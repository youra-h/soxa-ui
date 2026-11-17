/**
 * Tabs and Accordion lifecycle, server rendering and hydration in React.
 * Reassembled owners replace their engines; children follow the new lift.
 * Tabs explicitly prepare initial membership before rendering, while subscriptions
 * and acceptance remain on commit. Accordion retains its ordinary attach path.
 */

import { describe, it, expect, vi } from 'vitest'
import { Activity, StrictMode, act, type ReactElement, type ReactNode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { Accordion, Tabs } from '@soxa-ui/react'
import { mount, track } from './mount'

/** Движок так, как его видит тест: состав элементов по значениям. */
type TEngineView = { extensions: { batch: { items: readonly object[] } } }

/** Движки, объявленные владельцем (`engine:create`): последний — живой. */
function engineProbe() {
	const engines: TEngineView[] = []

	return {
		onEngineCreate: (engine: TEngineView) => {
			engines.push(engine)
		},
		/** Значения элементов живого движка по порядку. */
		values: () => {
			const engine = engines.at(-1)

			if (!engine) throw new Error('владелец не объявил движок')

			return engine.extensions.batch.items.map((item) => Reflect.get(item, 'value'))
		},
		engines,
	}
}

/** Микрозадачи: `engine:create` движок объявляет на них. */
async function flush(): Promise<void> {
	await act(async () => {})
}

const tabs = () => [...document.querySelectorAll('[role="tab"]')]

function tab(text: string): HTMLElement {
	const found = tabs().find((candidate) => candidate.textContent?.trim() === text)

	if (!(found instanceof HTMLElement)) throw new Error(`таба «${text}» нет`)

	return found
}

const selection = () => tabs().map((row) => row.getAttribute('aria-selected'))

const panels = () =>
	[...document.querySelectorAll('.so-tabs-content')].map((panel) => panel.textContent)

const headers = () => [...document.querySelectorAll('.so-accordion-item__header')]

function header(text: string): HTMLElement {
	const found = headers().find((candidate) => candidate.textContent?.trim() === text)

	if (!(found instanceof HTMLElement)) throw new Error(`секции «${text}» нет`)

	return found
}

const expanded = () => headers().map((node) => node.getAttribute('aria-expanded'))

type TProbeProps = { onEngineCreate?: (engine: TEngineView) => void }

/** Табы и их панели из разметки. */
function TabSet(probe: TProbeProps): ReactNode {
	return (
		<Tabs
			{...probe}
			content={['a', 'b', 'c'].map((value) => (
				<Tabs.Content key={value} value={value}>
					{`Панель ${value.toUpperCase()}`}
				</Tabs.Content>
			))}
		>
			<Tabs.Item value="a" text="A" active />
			<Tabs.Item value="b" text="B" />
			<Tabs.Item value="c" text="C" />
		</Tabs>
	)
}

/** Секции из разметки. */
function Sections(probe: TProbeProps): ReactNode {
	return (
		<Accordion {...probe}>
			<Accordion.Item value="a" text="A" selected>
				Содержимое A
			</Accordion.Item>
			<Accordion.Item value="b" text="B">
				Содержимое B
			</Accordion.Item>
			<Accordion.Item value="c" text="C">
				Содержимое C
			</Accordion.Item>
		</Accordion>
	)
}

describe('пересборка набора табов', () => {
	it('StrictMode: в живом движке ровно табы разметки; клик активирует таб и его панель', async () => {
		const probe = engineProbe()

		mount(
			<StrictMode>
				<TabSet onEngineCreate={probe.onEngineCreate} />
			</StrictMode>,
		)
		await flush()

		expect(probe.values()).toEqual(['a', 'b', 'c'])
		expect(tabs()).toHaveLength(3)
		expect(panels()).toEqual(['Панель A'])

		act(() => tab('B').click())

		expect(selection()).toEqual(['false', 'true', 'false'])
		expect(panels()).toEqual(['Панель B'])
	})

	it('<Activity>: после показа в живом движке ровно табы разметки; клик переключает панель', async () => {
		const probe = engineProbe()
		const view = (mode: 'visible' | 'hidden') => (
			<Activity mode={mode}>
				<TabSet onEngineCreate={probe.onEngineCreate} />
			</Activity>
		)
		const { render } = mount(view('visible'))

		await flush()

		render(view('hidden'))
		render(view('visible'))
		await flush()

		expect(probe.engines.length).toBeGreaterThan(1)
		expect(probe.values()).toEqual(['a', 'b', 'c'])

		act(() => tab('C').click())

		expect(selection()).toEqual(['false', 'false', 'true'])
		expect(panels()).toEqual(['Панель C'])
	})

	/**
	 * Пересборка — новые наборы и таба, и панели: прежняя панель отдаёт табу
	 * свой `id` назад, новая — снова, и плагину таба нового его монтирования.
	 */
	it('StrictMode и <Activity>: ссылка таба — на свой id панели и после пересборки', async () => {
		const view = (mode: 'visible' | 'hidden') => (
			<StrictMode>
				<Activity mode={mode}>
					<Tabs
						content={
							<Tabs.Content value="a" id="general">
								Панель A
							</Tabs.Content>
						}
					>
						<Tabs.Item value="a" text="A" active />
						<Tabs.Item value="b" text="B" />
					</Tabs>
				</Activity>
			</StrictMode>
		)
		const { render } = mount(view('visible'))

		await flush()

		expect(tab('A').getAttribute('aria-controls')).toBe('general')

		render(view('hidden'))
		render(view('visible'))
		await flush()

		expect(tab('A').getAttribute('aria-controls')).toBe('general')
		expect(document.querySelectorAll('[id="general"]')).toHaveLength(1)
	})
})

describe('пересборка аккордеона', () => {
	it('StrictMode: в живом движке ровно секции разметки; клик раскрывает секцию', async () => {
		const probe = engineProbe()

		mount(
			<StrictMode>
				<Sections onEngineCreate={probe.onEngineCreate} />
			</StrictMode>,
		)
		await flush()

		expect(probe.values()).toEqual(['a', 'b', 'c'])
		expect(expanded()).toEqual(['true', 'false', 'false'])

		act(() => header('B').click())

		expect(expanded()).toEqual(['false', 'true', 'false'])
	})

	it('<Activity>: после показа в живом движке ровно секции разметки; клик раскрывает', async () => {
		const probe = engineProbe()
		const view = (mode: 'visible' | 'hidden') => (
			<Activity mode={mode}>
				<Sections onEngineCreate={probe.onEngineCreate} />
			</Activity>
		)
		const { render } = mount(view('visible'))

		await flush()

		render(view('hidden'))
		render(view('visible'))
		await flush()

		expect(probe.engines.length).toBeGreaterThan(1)
		expect(probe.values()).toEqual(['a', 'b', 'c'])

		act(() => header('C').click())

		expect(expanded()).toEqual(['false', 'false', 'true'])
	})
})

describe('сервер', () => {
	/** Сервер и браузер в одном процессе: рендер сервера и гидратация — одна разметка. */
	function hydrate(element: ReactElement): {
		container: HTMLElement
		onRecoverableError: ReturnType<typeof vi.fn>
	} {
		const container = document.createElement('div')
		const onRecoverableError = vi.fn()

		container.innerHTML = renderToString(element)
		document.body.append(container)

		act(() => {
			track(hydrateRoot(container, element, { onRecoverableError }))
		})

		return { container, onRecoverableError }
	}

	/** Разметка сервера в отдельном узле документа, без гидратации. */
	function serverMarkup(element: ReactElement): HTMLElement {
		const container = document.createElement('div')

		container.innerHTML = renderToString(element)

		return container
	}

	it('табы из items: aria-selected, связка таба с панелью и панель активного таба', () => {
		const container = serverMarkup(
			<Tabs
				items={[
					{ value: 'a', text: 'A' },
					{ value: 'b', text: 'B', _: { active: true } },
				]}
				content={
					<>
						<Tabs.Content value="a">Панель A</Tabs.Content>
						<Tabs.Content value="b">Панель B</Tabs.Content>
					</>
				}
			/>,
		)
		const rows = [...container.querySelectorAll('[role="tab"]')]
		const shown = [...container.querySelectorAll('.so-tabs-content')]

		expect(rows.map((row) => row.getAttribute('aria-selected'))).toEqual(['false', 'true'])
		expect(shown.map((panel) => panel.textContent)).toEqual(['Панель B'])
		expect(rows[1].getAttribute('aria-controls')).toBe(shown[0].id)
		expect(shown[0].getAttribute('aria-labelledby')).toBe(rows[1].id)
		expect(shown[0].getAttribute('role')).toBe('tabpanel')
	})

	/**
	 * Свой `id` панели — на ней с первой отрисовки, и у сервера тоже. Таб
	 * нарисован раньше, чем собралась панель, и у сервера ведёт на формулу:
	 * ссылку на `id` панели он получает со входа панели — после гидратации, и
	 * гидратация с разметкой сервера сходится.
	 */
	it('свой id панели: у сервера — на панели, ссылка таба на него — после гидратации', () => {
		const element = (
			<Tabs
				items={[
					{ value: 'a', text: 'A', _: { active: true } },
					{ value: 'b', text: 'B' },
				]}
				content={
					<Tabs.Content value="a" id="general">
						Панель A
					</Tabs.Content>
				}
			/>
		)
		const server = serverMarkup(element)

		expect(server.querySelector('.so-tabs-content')?.id).toBe('general')
		expect(server.querySelector('[role="tab"]')?.getAttribute('aria-controls')).not.toBe(
			'general',
		)

		const { container, onRecoverableError } = hydrate(element)

		expect(onRecoverableError).not.toHaveBeenCalled()
		expect(container.querySelector('[role="tab"]')?.getAttribute('aria-controls')).toBe(
			'general',
		)
		expect(container.querySelectorAll('[id="general"]')).toHaveLength(1)
	})

	it('секции из items: aria-expanded и связка заголовка с панелью', () => {
		const container = serverMarkup(
			<Accordion
				items={[
					{ value: 'a', text: 'A', _: { selected: true } },
					{ value: 'b', text: 'B' },
				]}
			/>,
		)
		const heads = [...container.querySelectorAll('.so-accordion-item__header')]
		const bodies = [...container.querySelectorAll('.so-accordion-item__content')]

		expect(heads.map((node) => node.getAttribute('aria-expanded'))).toEqual(['true', 'false'])
		expect(heads.map((node) => node.getAttribute('aria-controls'))).toEqual(
			bodies.map((node) => node.id),
		)
		expect(bodies.map((node) => node.getAttribute('aria-labelledby'))).toEqual(
			heads.map((node) => node.id),
		)
	})

	it('табы и панели из разметки гидратируются без расхождений, панель готова на сервере', () => {
		const element = (
			<Tabs content={<Tabs.Content value="b">Панель B</Tabs.Content>}>
				<Tabs.Item value="a" text="A" />
				<Tabs.Item value="b" text="B" active />
			</Tabs>
		)

		// Tabs opt into initial membership before rendering; live acceptance still waits for commit.
		expect(serverMarkup(element).querySelector('.so-tabs-content')?.textContent).toBe(
			'Панель B',
		)

		const { onRecoverableError } = hydrate(element)

		expect(onRecoverableError).not.toHaveBeenCalled()
		expect(panels()).toEqual(['Панель B'])
		expect(selection()).toEqual(['false', 'true'])

		act(() => tab('A').click())

		expect(selection()).toEqual(['true', 'false'])
		expect(panels()).toEqual([])
	})

	it('секции из разметки гидратируются без расхождений, раскрытость — после коммита', () => {
		const element = (
			<Accordion>
				<Accordion.Item value="a" text="A" selected>
					Содержимое A
				</Accordion.Item>
				<Accordion.Item value="b" text="B">
					Содержимое B
				</Accordion.Item>
			</Accordion>
		)
		const { onRecoverableError } = hydrate(element)

		expect(onRecoverableError).not.toHaveBeenCalled()
		expect(expanded()).toEqual(['true', 'false'])

		// Режим по умолчанию — одна раскрытая секция
		act(() => header('B').click())

		expect(expanded()).toEqual(['false', 'true'])
	})
})
