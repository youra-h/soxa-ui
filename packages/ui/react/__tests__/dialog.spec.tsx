/**
 * Dialog в React — проводка целиком, на настоящей разметке.
 *
 * Модель проверяет ядро (`core/__tests__/dialog.spec.ts`), правила фокуса и
 * нажатия мимо — плагины; здесь важно, что они сходятся: окно телепортировано
 * целиком, подложка — сосед панели с тем же слоем, панель помечена владельцем,
 * кнопки шапки говорят с ядром, три причины закрытия проходят через запрос, а
 * окно поверх окна, поповер и Select внутри закрывают только свой слой.
 * Сценарии — те же, что у Vue (`ui/vue/__tests__/dialog.spec.ts`); слой выше
 * окна — панель Popover и список Select. Фон под окном с поповером и Select
 * внутри — сценарии `ui/vue/__tests__/hide-outside.spec.ts`.
 *
 * Открытость окна — состояние родителя: смена приходит `onChangeVisible`, как
 * `v-model:visible` у Vue. Своё у React — портал, которого на сервере нет, и
 * StrictMode, который пересобирает контекст окна вместе с его плагинами.
 *
 * Раскладку, переходы темы и действие `mousedown` jsdom не выполняет: место,
 * размер, появление и исчезание и то, что нажатие по подложке не уносит
 * фокус, — `playground/vue/browser/dialog.spec.ts`.
 */

import { describe, it, expect, vi } from 'vitest'
import { StrictMode, act, createRef, useState, type ReactElement, type ReactNode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { TDialog } from '@soxa-ui/core'
import type { TCloseEvent, TCloseReason } from '@soxa-ui/core'
import type { TDialogOffsetEvent } from '@soxa-ui/plugins'
import type { DescriptorSlots, PopoverDescriptor } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'
import { Button, Dialog, Popover, Select, type DialogProps } from '@soxa-ui/react'
import { find, mount, nextFrame, track } from './mount'

type TPopoverTriggerScope = DescriptorSlots<typeof PopoverDescriptor>['trigger']

/** Узел по селектору; нет его — тест падает здесь, а не на чтении свойства. */
const node = (selector: string, scope: ParentNode = document) => find(scope, selector, HTMLElement)

const panel = (scope: ParentNode = document) => node('.so-dialog', scope)
const backdrop = (scope: ParentNode = document) => node('.so-backdrop:has(+ .so-dialog)', scope)
const isOpen = (element: HTMLElement = panel()) => element.style.display !== 'none'
const opener = () => node('.so-test-opener')

/** Событие на узле — внутри `act`: закрытие и фокус меняют состояние компонентов. */
function dispatch(target: Element, event: Event): void {
	act(() => {
		target.dispatchEvent(event)
	})
}

/** Нажатие мимо — `pointerdown`, как его слушает плагин оверлея. */
const pointerDown = (target: Element) =>
	dispatch(target, new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }))

/** Клик — внутри `act`. */
function click(target: HTMLElement): void {
	act(() => target.click())
}

/** Клавиша на элементе под фокусом. Отдаёт событие: по нему видно, погашена ли она. */
function press(key: string, options: KeyboardEventInit = {}): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options })

	dispatch(document.activeElement ?? document.body, event)

	return event
}

/** Содержимое окна с двумя остановками Tab. */
const inside = (
	<>
		<button className="so-test-first">Первая</button>
		<button className="so-test-second">Вторая</button>
	</>
)

type TPageOptions = {
	/** Пропсы окна; `data-*` в JSX — атрибут, а объекту его тип называет сам. */
	props?: DialogProps & { [name: `data-${string}`]: string }
	content?: ReactNode
}

/**
 * Страница с кнопкой, которая открывает окно, и само окно, чья открытость —
 * состояние родителя. Отдаёт открытость: её пишет и тест (`show`), и окно
 * (`onChangeVisible`).
 */
async function render({ props = {}, content = inside }: TPageOptions = {}) {
	const shown = { value: false, set: (_: boolean) => {} }

	function Page(): ReactElement {
		const [visible, setVisible] = useState(false)

		shown.value = visible
		shown.set = setVisible

		return (
			<div>
				<button className="so-test-opener">Открыть</button>
				<Dialog
					title="Настройки"
					{...props}
					visible={visible}
					onChangeVisible={({ newValue }) => setVisible(newValue)}
				>
					{content}
				</Dialog>
			</div>
		)
	}

	mount(<Page />)
	await nextFrame()

	return shown
}

type TShown = Awaited<ReturnType<typeof render>>

/** Открыть окно с кнопки страницы и дождаться, пока фокус уйдёт в окно. */
async function open(shown: TShown): Promise<void> {
	act(() => {
		opener().focus()
		shown.set(true)
	})

	await nextFrame()
}

/** Закрыть окно записью родителя и дождаться кадра. */
async function close(shown: TShown): Promise<void> {
	act(() => shown.set(false))

	await nextFrame()
}

describe('разметка', () => {
	// Телепорт кладёт их в свою обёртку: место — по `contains`, а не по родителю
	it('окно телепортировано целиком: подложка и панель — соседи в body, подложка раньше', async () => {
		await render()

		expect(document.body.contains(panel())).toBe(true)
		expect(opener().parentElement?.contains(panel())).toBe(false)
		expect(backdrop().parentElement).toBe(panel().parentElement)
		expect(backdrop().nextElementSibling).toBe(panel())
		expect(panel().contains(backdrop())).toBe(false)
	})

	it('закрытое окно спрятано вместе с подложкой, а не размонтировано', async () => {
		await render()

		expect(isOpen()).toBe(false)
		expect(isOpen(backdrop())).toBe(false)
		expect(document.querySelector('.so-test-first')).not.toBeNull()
	})

	it('панель — модальный диалог, имя — заголовок', async () => {
		await render()

		const title = node('.so-dialog__title')

		expect(panel().getAttribute('role')).toBe('dialog')
		expect(panel().getAttribute('aria-modal')).toBe('true')
		expect(panel().getAttribute('tabindex')).toBe('-1')
		expect(panel().getAttribute('aria-labelledby')).toBe(title.id)
		expect(title.textContent).toBe('Настройки')
		expect(panel().hasAttribute('aria-describedby')).toBe(false)
	})

	it('предупреждение — alertdialog, описание — тело окна', async () => {
		await render({ props: { alert: true } })

		const body = node('.so-dialog__body')

		expect(panel().getAttribute('role')).toBe('alertdialog')
		expect(panel().getAttribute('aria-describedby')).toBe(body.id)
		expect(body.contains(node('.so-test-first'))).toBe(true)
	})

	it('слоты — по местам: заголовок, тело, подвал', async () => {
		await render({ props: { footer: <button className="so-test-ok">Готово</button> } })

		expect(node('.so-dialog__title').textContent).toBe('Настройки')
		expect(node('.so-dialog__body').contains(node('.so-test-first'))).toBe(true)
		expect(node('.so-dialog__footer').contains(node('.so-test-ok'))).toBe(true)
	})

	it('место — модификатором, по умолчанию центр; развёрнутость — data-maximized', async () => {
		await render({ props: { placement: 'end' } })

		expect(panel().classList).toContain('so-dialog--placement-end')
		expect(panel().dataset.maximized).toBe('false')
	})

	/** По нему тема гасит закрытое окно вместе с подложкой. */
	it('открытость — data-open у панели и подложки, туда и обратно', async () => {
		const shown = await render()

		expect(panel().dataset.open).toBe('false')
		expect(backdrop().dataset.open).toBe('false')

		await open(shown)

		expect(panel().dataset.open).toBe('true')
		expect(backdrop().dataset.open).toBe('true')

		await close(shown)

		expect(panel().dataset.open).toBe('false')
		expect(backdrop().dataset.open).toBe('false')
	})

	it('размер — переменными темы, не инлайном', async () => {
		await render({ props: { width: 480, height: '60vh' } })

		expect(panel().style.getPropertyValue('--so-dialog-width')).toBe('480px')
		expect(panel().style.getPropertyValue('--so-dialog-height')).toBe('60vh')
		expect(panel().style.width).toBe('')
	})

	it('незаданный размер переменной не даёт: умолчание — у темы', async () => {
		await render()

		expect(panel().style.getPropertyValue('--so-dialog-width')).toBe('')
		expect(panel().style.getPropertyValue('--so-dialog-height')).toBe('')
	})

	it('открытое: панель и подложка в одном слое — z-index и data-layer одни', async () => {
		const shown = await render()

		await open(shown)

		const layer = panel().dataset.layer

		expect(layer).toMatch(/^\d+$/)
		expect(backdrop().dataset.layer).toBe(layer)
		expect(panel().style.zIndex).toBe(layer)
		expect(backdrop().style.zIndex).toBe(layer)
	})

	it('панель помечена владельцем, подложка — нет: для окна она мимо', async () => {
		await render()

		// Пометка — от id монтирования окна (`useId`), а не от счётчика процесса
		expect(panel().dataset.owner).toBeTruthy()
		expect(backdrop().hasAttribute('data-owner')).toBe(false)
	})

	it('атрибуты, обработчики и ref потребителя — на панели', async () => {
		const onClick = vi.fn()
		const ref = createRef<Element>()

		await render({ props: { className: 'so-test-mine', 'data-test': 'x', onClick, ref } })

		expect(panel().classList).toContain('so-test-mine')
		expect(panel().classList).toContain('so-dialog')
		expect(panel().dataset.test).toBe('x')
		expect(ref.current).toBe(panel())
		expect(backdrop().classList).not.toContain('so-test-mine')

		click(panel())

		expect(onClick).toHaveBeenCalledTimes(1)
	})

	it('target меняет место телепорта', async () => {
		const host = document.createElement('div')

		host.id = 'so-test-host'
		document.body.appendChild(host)

		await render({ props: { target: '#so-test-host' } })

		expect(host.contains(panel())).toBe(true)
		expect(host.contains(backdrop())).toBe(true)
	})
})

describe('отступ', () => {
	/** Переменные отступа панели — по стороне. */
	const offsets = () => ({
		top: panel().style.getPropertyValue('--so-dialog-offset-top'),
		bottom: panel().style.getPropertyValue('--so-dialog-offset-bottom'),
		start: panel().style.getPropertyValue('--so-dialog-offset-start'),
		end: panel().style.getPropertyValue('--so-dialog-offset-end'),
	})

	it('offset — переменными темы по сторонам, не инлайном', async () => {
		await render({ props: { offset: 24 } })

		expect(offsets()).toEqual({ top: '24px', bottom: '24px', start: '24px', end: '24px' })
		expect(panel().getAttribute('style')).not.toMatch(/inset|margin/)
	})

	it('незаданный отступ переменных не даёт: умолчание — у темы', async () => {
		await render()

		expect(offsets()).toEqual({ top: '', bottom: '', start: '', end: '' })
	})

	it('смена offset из пропа пересчитывает переменные', async () => {
		const { render: rerender } = mount(<Dialog offset={24}>{inside}</Dialog>)

		await nextFrame()

		rerender(<Dialog offset="5%">{inside}</Dialog>)

		expect(offsets().top).toBe('5%')

		rerender(<Dialog>{inside}</Dialog>)

		expect(offsets().top).toBe('')
	})

	it('обработчик layout:offset:before правит сторону у окна, открытого позже', async () => {
		const shown = await render({
			props: {
				offset: 24,
				onLayoutOffsetBefore: (event: TDialogOffsetEvent) => {
					event.top = '10%'
				},
			},
		})

		await open(shown)

		expect(offsets()).toEqual({ top: '10%', bottom: '24px', start: '24px', end: '24px' })
	})

	it('и у созданного видимым: показа, который пересчитал бы стили, у него нет', async () => {
		const placements: string[] = []

		mount(
			<Dialog
				visible
				placement="start"
				offset={24}
				onLayoutOffsetBefore={(event: TDialogOffsetEvent) => {
					placements.push(event.placement)
					event.start = 0
				}}
			>
				{inside}
			</Dialog>,
		)

		await nextFrame()

		expect(placements).toContain('start')
		expect(offsets()).toEqual({ top: '24px', bottom: '24px', start: '0px', end: '24px' })
	})
})

describe('кнопки шапки', () => {
	it('крестик назван локалью — без провайдера английской, closable: false его убирает из DOM', async () => {
		const { render: rerender } = mount(<Dialog>{inside}</Dialog>)

		expect(node('.so-dialog__close').getAttribute('aria-label')).toBe('Close')

		rerender(<Dialog closable={false}>{inside}</Dialog>)

		expect(document.querySelector('.so-dialog__close')).toBeNull()
	})

	it('кнопки разворота по умолчанию нет, maximizable её рисует', async () => {
		const { render: rerender } = mount(<Dialog>{inside}</Dialog>)

		expect(document.querySelector('.so-dialog__maximize')).toBeNull()

		rerender(<Dialog maximizable>{inside}</Dialog>)

		const button = node('.so-dialog__maximize')

		expect(button.getAttribute('aria-label')).toBe('Maximize')
		expect(button.getAttribute('aria-pressed')).toBe('false')
	})

	it('разворот переключает maximized: data-maximized, aria-pressed и иконка', async () => {
		const dialog = new TDialog()
		const shown = await render({ props: { ctrl: dialog, maximizable: true } })

		await open(shown)

		const button = node('.so-dialog__maximize')
		/** Контур значка кнопки — сравнивается с контуром роли в пакете. */
		const iconPath = () => button.querySelector('svg path')?.getAttribute('d')
		const pathOf = (body: string) => /d="([^"]+)"/.exec(body)?.[1]

		expect(iconPath()).toBe(pathOf(material.arrowsOutward.body))

		click(button)

		expect(dialog.maximized).toBe(true)
		expect(panel().dataset.maximized).toBe('true')
		expect(button.getAttribute('aria-pressed')).toBe('true')
		expect(iconPath()).toBe(pathOf(material.arrowsInward.body))

		click(button)

		expect(panel().dataset.maximized).toBe('false')
		expect(iconPath()).toBe(pathOf(material.arrowsOutward.body))
	})

	it('разворот виден onChangeMaximized: по вызову на клик', async () => {
		const changes: boolean[] = []
		const shown = await render({
			props: {
				maximizable: true,
				onChangeMaximized: ({ newValue: value }) => changes.push(value),
			},
		})

		await open(shown)

		click(node('.so-dialog__maximize'))

		expect(changes).toEqual([true])
	})
})

describe('закрытие пользователем', () => {
	/** Причины закрытия, которые видел подписчик `close:before`. */
	const recorder = () => {
		const reasons: TCloseReason[] = []

		return {
			reasons,
			onCloseBefore: (event: TCloseEvent) => {
				reasons.push(event.reason)
			},
		}
	}

	it('крестик — причина button, фокус возвращается туда, откуда открыли', async () => {
		const { reasons, onCloseBefore } = recorder()
		const shown = await render({ props: { onCloseBefore } })

		await open(shown)

		expect(document.activeElement).toBe(node('.so-test-first'))

		click(node('.so-dialog__close'))

		expect(reasons).toEqual(['button'])
		expect(shown.value).toBe(false)
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('Escape — причина escape, клавиша погашена', async () => {
		const { reasons, onCloseBefore } = recorder()
		const shown = await render({ props: { onCloseBefore } })

		await open(shown)

		const event = press('Escape')

		expect(event.defaultPrevented).toBe(true)
		expect(reasons).toEqual(['escape'])
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('нажатие по подложке — причина outside, фокус возвращается', async () => {
		const { reasons, onCloseBefore } = recorder()
		const shown = await render({ props: { onCloseBefore } })

		await open(shown)

		pointerDown(backdrop())

		expect(reasons).toEqual(['outside'])
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('нажатие в окно его не закрывает', async () => {
		const shown = await render()

		await open(shown)

		pointerDown(node('.so-test-second'))

		expect(isOpen()).toBe(true)
	})

	it('отмена close:before оставляет окно открытым', async () => {
		const shown = await render({
			props: { onCloseBefore: (event: TCloseEvent) => event.preventDefault() },
		})

		await open(shown)

		click(node('.so-dialog__close'))
		press('Escape')
		pointerDown(backdrop())

		expect(shown.value).toBe(true)
		expect(isOpen()).toBe(true)
	})

	describe('dismissible: false', () => {
		it('подложка и Escape окно не закрывают и close:before не шлют', async () => {
			const { reasons, onCloseBefore } = recorder()
			const shown = await render({ props: { dismissible: false, onCloseBefore } })

			await open(shown)

			pointerDown(backdrop())
			press('Escape')

			expect(reasons).toEqual([])
			expect(isOpen()).toBe(true)
		})

		it('крестик закрывает', async () => {
			const shown = await render({ props: { dismissible: false } })

			await open(shown)

			click(node('.so-dialog__close'))

			expect(isOpen()).toBe(false)
		})
	})
})

describe('открытость — visible и onChangeVisible', () => {
	it('visible из пропа открывает и закрывает, программное закрытие — без close:before', async () => {
		const onCloseBefore = vi.fn()
		const shown = await render({ props: { onCloseBefore } })

		await open(shown)

		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-first'))

		await close(shown)

		expect(isOpen()).toBe(false)
		expect(isOpen(backdrop())).toBe(false)
		expect(onCloseBefore).not.toHaveBeenCalled()
		expect(document.activeElement).toBe(opener())
	})

	it('открытие и закрытие пользователем видит onChangeVisible', async () => {
		const changes: boolean[] = []
		const shown = { set: (_: boolean) => {} }

		function Page(): ReactElement {
			const [visible, setVisible] = useState(false)

			shown.set = setVisible

			return (
				<Dialog
					visible={visible}
					onChangeVisible={({ newValue: value }) => {
						changes.push(value)
						setVisible(value)
					}}
				>
					{inside}
				</Dialog>
			)
		}

		mount(<Page />)
		await nextFrame()

		act(() => shown.set(true))
		await nextFrame()

		press('Escape')

		expect(changes).toEqual([true, false])
		expect(isOpen()).toBe(false)
	})

	it('visible из инстанса открывает так же, как из пропа', async () => {
		const dialog = new TDialog()

		mount(<Dialog ctrl={dialog}>{inside}</Dialog>)
		await nextFrame()

		act(() => {
			dialog.visible = true
		})
		await nextFrame()

		expect(isOpen()).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-first'))
	})
})

describe('окно поверх окна', () => {
	/** Нижнее окно, из которого открыто верхнее. */
	async function renderNested() {
		const lower = { value: false, set: (_: boolean) => {} }
		const upper = { value: false, set: (_: boolean) => {} }

		function Page(): ReactElement {
			const [lowerVisible, setLower] = useState(false)
			const [upperVisible, setUpper] = useState(false)

			lower.value = lowerVisible
			lower.set = setLower
			upper.value = upperVisible
			upper.set = setUpper

			return (
				<div>
					<button className="so-test-opener">Открыть</button>
					<Dialog
						className="so-test-lower"
						visible={lowerVisible}
						onChangeVisible={({ newValue }) => setLower(newValue)}
					>
						<button className="so-test-lower-first">Внизу</button>
						<Dialog
							className="so-test-upper"
							visible={upperVisible}
							onChangeVisible={({ newValue }) => setUpper(newValue)}
						>
							<button className="so-test-upper-first">Наверху</button>
						</Dialog>
					</Dialog>
				</div>
			)
		}

		mount(<Page />)
		await nextFrame()

		act(() => {
			opener().focus()
			lower.set(true)
		})
		await nextFrame()

		act(() => upper.set(true))
		await nextFrame()

		return { lower, upper }
	}

	const backdropOf = (dialog: HTMLElement) => {
		const previous = dialog.previousElementSibling

		if (!(previous instanceof HTMLElement)) throw new Error('у окна нет подложки')

		return previous
	}

	it('верхнее окно — слоем выше нижнего, его подложка — тоже', async () => {
		await renderNested()

		const lower = Number(node('.so-test-lower').dataset.layer)
		const upper = Number(node('.so-test-upper').dataset.layer)

		expect(upper).toBeGreaterThan(lower)
		expect(backdropOf(node('.so-test-upper')).dataset.layer).toBe(String(upper))
		expect(document.activeElement).toBe(node('.so-test-upper-first'))
	})

	it('нажатие по подложке верхнего закрывает только его', async () => {
		const { lower, upper } = await renderNested()

		pointerDown(backdropOf(node('.so-test-upper')))

		expect(upper.value).toBe(false)
		expect(lower.value).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-lower-first'))
	})

	it('Escape в верхнем закрывает только его', async () => {
		const { lower, upper } = await renderNested()

		press('Escape')

		expect(upper.value).toBe(false)
		expect(lower.value).toBe(true)
	})

	// Пометка фона — на обёртке телепорта нижнего окна, а не на самой панели
	it('нижнее окно для скринридера спрятано, пока открыто верхнее', async () => {
		const { upper } = await renderNested()

		expect(node('.so-test-lower').closest('[aria-hidden="true"]')).not.toBeNull()
		expect(node('.so-test-upper').closest('[aria-hidden="true"]')).toBeNull()

		await close(upper)

		expect(node('.so-test-lower').closest('[aria-hidden="true"]')).toBeNull()
	})
})

/**
 * Панель поповера в окне — тоже панель в `body`, соседка окна, а не его
 * потомок. Пока закрыта, она лежит там без номера слоя выше окна: номер
 * пишет показ. Открытая — слой выше окна: нажатие в неё окно не закрывает,
 * Escape закрывает только её, и скринридер её видит.
 */
describe('Popover внутри', () => {
	const withPopover = (
		<Popover
			className="so-test-popover"
			trigger={({ triggerAria, triggerDataset }: TPopoverTriggerScope) => (
				<Button
					text="Ещё"
					className="so-test-popover-trigger"
					{...triggerAria}
					{...triggerDataset}
				/>
			)}
		>
			<button className="so-test-popover-first">В панели</button>
		</Popover>
	)

	const popoverTrigger = () => node('.so-test-popover-trigger')
	const popoverPanel = () => node('.so-popover__panel')

	/** Спрятан ли узел от скринридера — сам или через предка. */
	const muted = (element: Element) => element.closest('[aria-hidden="true"]') !== null

	/** Кто в документе несёт `aria-hidden` и с каким значением — чтобы сравнить «до» и «после». */
	const ariaHiddenNodes = () =>
		new Map(
			[...document.querySelectorAll('[aria-hidden]')].map((element) => [
				element,
				element.getAttribute('aria-hidden'),
			]),
		)

	/** Открыть поповер кликом по его триггеру и дождаться кадра. */
	async function openPopover(): Promise<void> {
		const target = popoverTrigger()

		pointerDown(target)
		act(() => {
			target.focus()
			target.click()
		})
		await nextFrame()
	}

	it('панель поповера — слоем выше окна: нажатие в неё окно не закрывает', async () => {
		const shown = await render({ content: withPopover })

		await open(shown)
		await openPopover()

		expect(isOpen(popoverPanel())).toBe(true)
		expect(Number(popoverPanel().dataset.layer)).toBeGreaterThan(Number(panel().dataset.layer))

		pointerDown(node('.so-test-popover-first'))

		expect(shown.value).toBe(true)
		expect(isOpen()).toBe(true)
		expect(isOpen(popoverPanel())).toBe(true)
	})

	it('Escape в открытом поповере закрывает только его, второй — окно', async () => {
		const shown = await render({ content: withPopover })

		await open(shown)
		await openPopover()

		expect(document.activeElement).toBe(node('.so-test-popover-first'))

		press('Escape')

		expect(isOpen(popoverPanel())).toBe(false)
		expect(shown.value).toBe(true)
		expect(document.activeElement).toBe(popoverTrigger())

		press('Escape')

		expect(shown.value).toBe(false)
	})

	it('окно открыто — страница под aria-hidden, окно и его содержимое доступны', async () => {
		const shown = await render({ content: withPopover })

		await open(shown)

		expect(muted(opener())).toBe(true)
		expect(muted(panel())).toBe(false)
		expect(muted(popoverTrigger())).toBe(false)
	})

	it('закрытая панель поповера спрятана, открытая — доступна', async () => {
		const shown = await render({ content: withPopover })

		await open(shown)

		// Панель смонтирована и скрыта, номера слоя выше окна у неё ещё нет
		expect(muted(popoverPanel())).toBe(true)

		await openPopover()

		expect(popoverTrigger().getAttribute('aria-expanded')).toBe('true')
		expect(muted(popoverPanel())).toBe(false)
		expect(muted(node('.so-test-popover-first'))).toBe(false)
	})

	it('окно закрыто — всё как было, в том числе чужие aria-hidden', async () => {
		const shown = await render({ content: withPopover })
		const before = ariaHiddenNodes()

		await open(shown)
		await openPopover()
		await close(shown)

		expect(ariaHiddenNodes()).toEqual(before)
		expect(muted(opener())).toBe(false)
		expect(muted(popoverPanel())).toBe(false)
	})
})

/**
 * Список Select в окне — тоже панель в `body`, соседка окна, как панель
 * поповера: открытый — слой выше окна, нажатие в него окно не закрывает,
 * Escape закрывает только его. Фон под окном — сценарии
 * `ui/vue/__tests__/hide-outside.spec.ts`: закрытый список, без номера слоя
 * выше окна, спрятан, открытый — доступен скринридеру.
 */
describe('Select внутри', () => {
	const withSelect = (
		<Select className="so-test-select">
			<Select.Item value="a" text="Первый" />
			<Select.Item value="b" text="Второй" />
		</Select>
	)

	const field = () => find(document, '.so-test-select input', HTMLInputElement)
	const selectPanel = () => node('.so-select__panel')

	/** Спрятан ли узел от скринридера — сам или через предка. */
	const muted = (element: Element) => element.closest('[aria-hidden="true"]') !== null

	/** Кто в документе несёт `aria-hidden` и с каким значением — чтобы сравнить «до» и «после». */
	const ariaHiddenNodes = () =>
		new Map(
			[...document.querySelectorAll('[aria-hidden]')].map((element) => [
				element,
				element.getAttribute('aria-hidden'),
			]),
		)

	/** Открыть список кликом мышью целиком: нажатие, фокус от `mousedown`, клик. */
	async function openSelect(): Promise<void> {
		const target = field()

		pointerDown(target)
		act(() => {
			target.focus()
			target.click()
		})
		await nextFrame()
	}

	it('список Select — слоем выше окна: нажатие в него окно не закрывает', async () => {
		const shown = await render({ content: withSelect })

		await open(shown)
		await openSelect()

		expect(isOpen(selectPanel())).toBe(true)
		expect(Number(selectPanel().dataset.layer)).toBeGreaterThan(Number(panel().dataset.layer))

		const option = node('.so-select__panel [role="option"]')

		pointerDown(option)
		click(option)

		expect(shown.value).toBe(true)
		expect(isOpen()).toBe(true)
		expect(field().value).toBe('Первый')
	})

	it('Escape в открытом Select закрывает только Select, второй — окно', async () => {
		const shown = await render({ content: withSelect })

		await open(shown)
		await openSelect()

		expect(isOpen(selectPanel())).toBe(true)

		press('Escape')

		expect(isOpen(selectPanel())).toBe(false)
		expect(shown.value).toBe(true)

		press('Escape')

		expect(shown.value).toBe(false)
	})

	it('окно открыто — страница под aria-hidden, окно и поле Select доступны', async () => {
		const shown = await render({ content: withSelect })

		await open(shown)

		expect(muted(opener())).toBe(true)
		expect(muted(panel())).toBe(false)
		expect(muted(field())).toBe(false)
	})

	it('закрытый список Select спрятан, открытый — доступен', async () => {
		const shown = await render({ content: withSelect })

		await open(shown)

		// Список смонтирован и скрыт, номера слоя выше окна у него ещё нет
		expect(muted(selectPanel())).toBe(true)

		await openSelect()

		expect(field().getAttribute('aria-expanded')).toBe('true')
		expect(muted(selectPanel())).toBe(false)
		expect(muted(node('.so-select__panel [role="option"]'))).toBe(false)
	})

	it('окно закрыто — всё как было, в том числе чужие aria-hidden', async () => {
		const shown = await render({ content: withSelect })
		const before = ariaHiddenNodes()

		await open(shown)
		await openSelect()
		await close(shown)

		expect(ariaHiddenNodes()).toEqual(before)
		expect(muted(opener())).toBe(false)
		expect(muted(selectPanel())).toBe(false)
	})
})

describe('фон под окном', () => {
	it('открытое окно прячет страницу от скринридера и запирает прокрутку', async () => {
		const shown = await render()

		await open(shown)

		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		await close(shown)

		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.documentElement.style.overflow).toBe('')
	})
})

/** Своё у React: портала на сервере нет, StrictMode пересобирает окно с плагинами. */
describe('React', () => {
	/**
	 * Лишний цикл эффектов уничтожает первый контекст окна вместе с его
	 * плагинами: замок прокрутки и пометки фона, которые они успели поставить,
	 * снимаются, а пересобранное окно ставит свои — и отпускает их на закрытии.
	 */
	it('StrictMode: одна панель в цели; закрытое окно отпускает замок и пометки фона', async () => {
		const shown = { set: (_: boolean) => {} }

		function Page(): ReactElement {
			const [visible, setVisible] = useState(false)

			shown.set = setVisible

			return (
				<div>
					<button className="so-test-opener">Открыть</button>
					<Dialog
						visible={visible}
						onChangeVisible={({ newValue }) => setVisible(newValue)}
					>
						{inside}
					</Dialog>
				</div>
			)
		}

		mount(
			<StrictMode>
				<Page />
			</StrictMode>,
		)
		await nextFrame()

		expect(document.querySelectorAll('.so-dialog')).toHaveLength(1)
		expect(document.querySelectorAll('.so-backdrop:has(+ .so-dialog)')).toHaveLength(1)

		act(() => {
			opener().focus()
			shown.set(true)
		})
		await nextFrame()

		expect(document.activeElement).toBe(node('.so-test-first'))
		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		act(() => shown.set(false))
		await nextFrame()

		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.documentElement.style.overflow).toBe('')
		expect(document.activeElement).toBe(opener())
	})

	it('серверная разметка пуста: окно целиком в портале, а его на сервере нет', () => {
		expect(renderToString(<Dialog visible>{inside}</Dialog>)).toBe('')
	})

	it('гидратация без расхождений, окно появляется после неё', async () => {
		const element = (
			<div>
				<button className="so-test-opener">Открыть</button>
				<Dialog visible>{inside}</Dialog>
			</div>
		)
		const container = document.createElement('div')
		const onRecoverableError = vi.fn()

		container.innerHTML = renderToString(element)
		document.body.append(container)

		act(() => {
			track(hydrateRoot(container, element, { onRecoverableError }))
		})

		expect(onRecoverableError).not.toHaveBeenCalled()
		expect(document.body.contains(panel())).toBe(true)
		expect(container.contains(panel())).toBe(false)
		expect(isOpen()).toBe(true)

		// Панель появилась после гидратации: кадр — её `ready`, следующий — фокус
		await nextFrame()
		await nextFrame()

		expect(document.activeElement).toBe(node('.so-test-first'))
	})
})

describe('non-modal dialog', () => {
	it('preserves focus, page access and natural keyboard navigation', async () => {
		const shown = await render({ props: { modal: false, dismissible: false } })
		await open(shown)

		expect(document.activeElement).toBe(opener())
		expect(panel().getAttribute('role')).toBe('dialog')
		expect(panel().hasAttribute('aria-modal')).toBe(false)
		expect(panel().getAttribute('aria-labelledby')).toBe(
			panel().querySelector('.so-dialog__title')?.id,
		)
		expect(opener().closest('[aria-hidden="true"], [inert]')).toBeNull()
		expect(document.documentElement.style.overflow).not.toBe('hidden')
		expect(document.body.style.overflow).not.toBe('hidden')

		expect(document.querySelector('.so-backdrop:has(+ .so-dialog)')).toBeNull()

		const last = panel().querySelector('.so-dialog__close')
		if (!(last instanceof HTMLElement)) throw new Error('Missing close button')
		act(() => last.focus())
		expect(press('Tab').defaultPrevented).toBe(false)
		expect(press('Tab', { shiftKey: true }).defaultPrevented).toBe(false)
		act(() => opener().focus())
		pointerDown(opener())
		expect(isOpen()).toBe(true)
		expect(document.activeElement).toBe(opener())

		await close(shown)
		expect(document.activeElement).toBe(opener())
	})
})
