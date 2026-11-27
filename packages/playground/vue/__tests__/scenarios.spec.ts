/**
 * Страница тестов стенда — у каждого фреймворка.
 *
 * Сценарии реестра здесь не запускаются — в CI они не идут: упавший сценарий
 * — найденная проблема компонента, а не сломанная сборка. Проверяется сама
 * площадка: что страница открывается, что фикстуры и сценарии не разошлись и
 * что настоящий хост фреймворка доводит прогон до итога. Для последнего
 * сценарии свои, из теста, — и подкладываются странице через `provide`.
 */

import { A11Y_CASES, COMPONENTS, auditInventoryErrors } from '@soxa-ui/playground-shared'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import {
	SCENARIOS as SCENARIO_REGISTRY,
	TScenarioHost,
	TScenarioJournal,
	createInstance,
	findComponent,
	type IPreviewHost,
	type TScenario,
} from '@soxa-ui/playground-shared'
import { componentsOf, coversScenario, scenariosOf, testsPath, topicsOf } from '../src/catalog'
import { FRAMEWORKS, hostOf, loadHost } from '../src/hosts'
import { createScenarioBench, SCENARIO_BENCH } from '../src/composables/useScenarios'
import { router } from '../src/router'
import TestsPage from '../src/views/TestsPage.vue'
import AppHeader from '../src/components/AppHeader.vue'
import TestsSidebar from '../src/components/TestsSidebar.vue'

/** Хосты — загрузчиком, как их грузит роутер. */
await Promise.all(FRAMEWORKS.map(({ id }) => loadHost(id)))

const IDS = FRAMEWORKS.map(({ id }) => id)

/**
 * Кнопки страницы слушают DOM с кадра после монтирования: `TElementPlugin`
 * отдаёт узел плагинам через requestAnimationFrame. Клик раньше ушёл бы в
 * пустоту.
 */
async function rendered(): Promise<void> {
	await nextTick()
	await new Promise((resolve) => requestAnimationFrame(resolve))
}

/** Предупреждения и ошибки в консоли роняют тест — как в `smoke/harness.ts`. */
const warnings: string[] = []

beforeAll(async () => {
	// Журнал сценариев печатает каждое событие — в отчёте это шум
	vi.spyOn(console, 'log').mockImplementation(() => {})

	for (const method of ['warn', 'error'] as const) {
		vi.spyOn(console, method).mockImplementation((...args) => {
			warnings.push(args.map(String).join(' ').split('\n')[0])
		})
	}

	router.push('/')
	await router.isReady()
})

beforeEach(() => {
	warnings.length = 0
})

const mountOptions = { global: { plugins: [router] }, attachTo: document.body }

/** Кнопка сцены, которую шаг ручного сценария велит нажать: «Нажмите «info»». */
const PRESS = /Нажмите «([^»]+)»/g

/** Подписи кнопок, которые велят нажать шаги сценария. */
function pressedIn(scenario: TScenario): string[] {
	if (scenario.kind !== 'manual') return []

	return scenario.steps.flatMap((step) => [...step.matchAll(PRESS)].map(([, label]) => label))
}

/**
 * Подписи кнопок на сцене сценария. Сцену ставит хост сценариев, как прогон, —
 * превью или фикстура, пропсы сценария и `ctrl` с экземпляром, — но без `run`:
 * кнопки человек жмёт на готовой сцене. Подписи прочитаны — сцена снимается.
 */
async function sceneButtons(host: IPreviewHost, scenario: TScenario): Promise<string[]> {
	const entry = findComponent(scenario.component)

	if (!entry) throw new Error(`компонента «${scenario.component}» нет в реестре`)

	const stage = new TScenarioHost(host)
	const instance = createInstance(entry)
	const scene = document.createElement('div')
	const target = scene.appendChild(document.createElement('div'))

	document.body.append(scene)
	stage.attach(scenario.id, { scene, target })
	await stage.mount({ scenario, instance, journal: new TScenarioJournal(scenario.id) })

	const labels = [...scene.querySelectorAll('button')].map(
		(node) => node.textContent?.trim() ?? '',
	)

	await stage.unmount(scenario.id)
	instance.destroy?.()
	scene.remove()

	return labels
}

describe.each(IDS)('каталог сценариев %s', (framework) => {
	const host = hostOf(framework)
	const scenarios = scenariosOf(host)

	it('audit cases cover the complete host inventory', () => {
		expect(
			auditInventoryErrors(
				host,
				COMPONENTS.map((entry) => entry.id),
				framework,
			),
		).toEqual([])
	})

	it('есть хотя бы одна тема', () => {
		expect(topicsOf(scenarios).length).toBeGreaterThan(0)
	})

	/**
	 * Сценарий без фикстуры не падает — он молча пропадает со страницы:
	 * каталог строится пересечением. Поэтому пропажа ловится здесь. Сценарий,
	 * которому нужен компонент, ещё не перенесённый в адаптер (`requires`:
	 * радио в подписи), сиротой не считается: хосту его нечем нарисовать. Как и
	 * сценарий scope слота у хоста, слоты которого scope не отдают (`slotScope`).
	 */
	it('у каждого сценария компонента хоста есть чем его нарисовать', () => {
		const orphans = SCENARIO_REGISTRY.filter(
			(scenario) => coversScenario(host, scenario) && !scenarios.includes(scenario),
		).map((scenario) => scenario.id)

		expect(orphans).toEqual([])
	})

	/**
	 * Сценарий, который проверяет scope слота, — на странице хоста ровно тогда,
	 * когда слоты хоста scope отдают: у Web Components его нет, у остальных он
	 * есть, и сценарий там не пропадает молча.
	 */
	it('сценарии scope слота — только у хоста со scope', () => {
		const scoped = SCENARIO_REGISTRY.filter(
			(scenario) => scenario.slotScope && host.previews.includes(scenario.component),
		)

		expect(scoped.length).toBeGreaterThan(0)
		expect(scoped.filter((scenario) => scenarios.includes(scenario)).length).toBe(
			host.slotScope === false ? 0 : scoped.length,
		)
	})

	/**
	 * Сценарий, фикстура которого задаёт тег корня пропом (радио на `span` в
	 * подписи), — на странице хоста ровно тогда, когда тег задаётся пропом: у
	 * Web Components тег — сам элемент, у остальных проп `tag` есть.
	 */
	it('сценарии с тегом пропом — только у хоста с пропом tag', () => {
		const tagged = SCENARIO_REGISTRY.filter(
			(scenario) =>
				scenario.tagProp &&
				[scenario.component, ...(scenario.requires ?? [])].every((id) =>
					host.previews.includes(id),
				),
		)

		expect(tagged.filter((scenario) => scenarios.includes(scenario)).length).toBe(
			host.tagProp === false ? 0 : tagged.length,
		)
	})

	it('нет фикстур, на которые не ссылается ни один сценарий', () => {
		const used = new Set([
			...SCENARIO_REGISTRY.map((scenario) => scenario.fixture),
			...A11Y_CASES.map((audit) => audit.fixture),
		])

		expect(host.fixtures.filter((key) => !used.has(key))).toEqual([])
	})
})

/**
 * Кнопку, которую шаг ручного сценария велит нажать, человек ищет на сцене.
 * Подписи кнопок превью живут в хостах, шаги — в `shared`, и разойтись они
 * могут молча: стопка Toasts просила «positive» и «negative», когда кнопки
 * давно стояли по видам сообщения.
 */
describe('кнопки из шагов ручных сценариев', () => {
	it('шаги называют кнопки — сторожу есть что сверять', () => {
		expect(SCENARIO_REGISTRY.filter((scenario) => pressedIn(scenario).length)).not.toEqual([])
	})

	it.each(IDS)('%s: каждая — на сцене своего сценария', async (framework) => {
		const host = hostOf(framework)
		const missing: string[] = []

		for (const scenario of scenariosOf(host)) {
			const labels = pressedIn(scenario)

			if (!labels.length) continue

			const shown = await sceneButtons(host, scenario)

			missing.push(
				...labels
					.filter((label) => !shown.includes(label))
					.map((label) => `${scenario.id}: «${label}»`),
			)
		}

		expect(missing).toEqual([])
		expect(warnings).toEqual([])
	})
})

/** Все страницы тестов: фреймворк × тема × компонент со сценариями в ней. */
const PAGES = IDS.flatMap((framework) => {
	const scenarios = scenariosOf(hostOf(framework))

	return topicsOf(scenarios).flatMap((topic) =>
		componentsOf(scenarios, topic.id).map((entry) => [framework, topic.id, entry.id] as const),
	)
})

describe('страница компонента в теме', () => {
	it.each(PAGES)(
		'%s/%s/%s открывается с блоком на каждый сценарий',
		async (framework, topic, component) => {
			const wrapper = mount(TestsPage, {
				...mountOptions,
				props: { framework, topic, component },
			})

			await nextTick()

			const expected = scenariosOf(hostOf(framework)).filter(
				(scenario) => scenario.topic === topic && scenario.component === component,
			)

			expect(wrapper.findAll('.pg-scenario')).toHaveLength(expected.length)
			// Сцены пустые до запуска: на каждой — заглушка
			expect(wrapper.findAll('.pg-scenario__placeholder')).toHaveLength(expected.length)
			expect(warnings).toEqual([])

			wrapper.unmount()
		},
	)

	/** Автоматические запускаются пачкой, ручные — по одному: смешивать их неудобно. */
	it.each(PAGES)(
		'%s/%s/%s: автоматические сверху, ручные снизу',
		(framework, topic, component) => {
			const wrapper = mount(TestsPage, {
				...mountOptions,
				props: { framework, topic, component },
			})
			const kindOf = (id: string | undefined) =>
				scenariosOf(hostOf(framework)).find((scenario) => scenario.id === id)?.kind

			const auto = wrapper.findAll('.pg-tests__section--auto .pg-scenario')
			const manual = wrapper.findAll('.pg-tests__section--manual .pg-scenario')

			expect(auto.every((block) => kindOf(block.attributes('data-id')) === 'auto')).toBe(true)
			expect(manual.every((block) => kindOf(block.attributes('data-id')) === 'manual')).toBe(
				true,
			)
			expect(auto.length + manual.length).toBe(wrapper.findAll('.pg-scenario').length)

			// Раздел автоматических, если он есть, — первый
			if (auto.length) {
				expect(wrapper.findAll('.pg-tests__section')[0].classes()).toContain(
					'pg-tests__section--auto',
				)
			}

			wrapper.unmount()
		},
	)

	it('на неизвестную тему отвечает, а не падает', () => {
		const wrapper = mount(TestsPage, {
			...mountOptions,
			props: { framework: 'vue', topic: 'нет-такой', component: 'button' },
		})

		expect(wrapper.find('.pg-empty').exists()).toBe(true)

		wrapper.unmount()
	})
})

/**
 * Сквозной прогон: раннер, хост сценариев, настоящий Button хоста фреймворка,
 * журнал из его событий. Имена в журнале — полные имена ядра у любого
 * фреймворка (`change:text`), а `update:<prop>` — v-model Vue: у остальных
 * его нет.
 */
describe.each(IDS)('прогон через хост %s', (framework) => {
	const updates = framework === 'vue' ? 1 : 0

	const scenarios: TScenario[] = [
		{
			id: 'test/auto',
			component: 'button',
			topic: 'events',
			kind: 'auto',
			title: 'авто',
			description: '',
			props: { text: 'До' },
			run: async (ctx) => {
				const from = ctx.journal.entries.length

				ctx.instance.text = 'После'
				await ctx.frame()

				ctx.check(ctx.journal.count('change:text', from) === 1, 'change:text в журнале')
				ctx.check(
					ctx.journal.count('update:text', from) === updates,
					`update:text в журнале — ${updates}`,
				)
				ctx.check(ctx.scene.textContent?.includes('После') === true, 'новый текст в DOM')
			},
		},
		{
			id: 'test/press',
			component: 'button',
			topic: 'events',
			kind: 'manual',
			title: 'нажатие',
			description: '',
			steps: ['нажать дважды'],
			run: async (ctx) => {
				await ctx.events('action:press', 2)
				ctx.check(true, 'два нажатия')
			},
		},
		{
			id: 'test/verdict',
			component: 'button',
			topic: 'events',
			kind: 'manual',
			title: 'вердикт',
			description: '',
			steps: ['посмотреть'],
		},
	]

	function setup() {
		const bench = createScenarioBench(hostOf(framework), scenarios, { timeout: 2000 })
		const wrapper = mount(TestsPage, {
			...mountOptions,
			props: { framework, topic: 'events', component: 'button' },
			global: { ...mountOptions.global, provide: { [SCENARIO_BENCH]: bench } },
		})

		const block = (id: string) => wrapper.get(`.pg-scenario[data-id="${id}"]`)
		const status = (id: string) => bench.runner.state(id).status

		return { bench, wrapper, block, status }
	}

	it('«Запустить все» гонит автоматические, ручные не трогает', async () => {
		const { wrapper, block, status } = setup()

		await rendered()
		await wrapper.get('.pg-tests__run-all').trigger('click')

		await vi.waitFor(() => expect(status('test/auto')).toBe('passed'))

		expect(status('test/press')).toBe('idle')
		expect(status('test/verdict')).toBe('idle')
		expect(block('test/auto').findAll('.pg-checks__item--failed')).toHaveLength(0)
		expect(block('test/auto').findAll('.pg-checks__item')).toHaveLength(3)
		expect(block('test/auto').find('.pg-scenario__placeholder').exists()).toBe(false)
		expect(block('test/press').find('.pg-scenario__scene .so-button').exists()).toBe(false)
		expect(block('test/press').find('.pg-scenario__placeholder').exists()).toBe(true)
		expect(wrapper.find('.pg-badge--failed').exists()).toBe(false)
		expect(warnings).toEqual([])

		wrapper.unmount()
	})

	it('ручной засчитывается сам по нажатиям на сцене', async () => {
		const { wrapper, block, status } = setup()

		await rendered()
		await block('test/press').get('.pg-scenario__run').trigger('click')
		await vi.waitFor(() => expect(status('test/press')).toBe('waiting'))

		const button = block('test/press').get('.pg-scenario__scene .so-button')

		await button.trigger('click')
		await button.trigger('click')

		await vi.waitFor(() => expect(status('test/press')).toBe('passed'))
		await nextTick()

		expect(block('test/press').attributes('data-status')).toBe('passed')

		wrapper.unmount()
	})

	it('✗ роняет ручной, и сводка показывает errors', async () => {
		const { wrapper, block, status } = setup()

		await rendered()
		await block('test/verdict').get('.pg-scenario__run').trigger('click')
		await vi.waitFor(() => expect(status('test/verdict')).toBe('waiting'))
		await nextTick()

		await block('test/verdict').get('.pg-scenario__fail').trigger('click')
		await nextTick()

		expect(status('test/verdict')).toBe('failed')
		expect(wrapper.get('.pg-tests__section--manual .pg-badge--failed').text()).toBe('errors: 1')
		expect(wrapper.find('.pg-tests__section--auto .pg-badge--failed').exists()).toBe(false)

		wrapper.unmount()
	})

	it('уход со страницы снимает ожидание и сцену: ручной возвращается в idle', async () => {
		const { bench, wrapper, block, status } = setup()

		await rendered()
		await block('test/verdict').get('.pg-scenario__run').trigger('click')
		await vi.waitFor(() => expect(status('test/verdict')).toBe('waiting'))

		expect(bench.staged.has('test/verdict')).toBe(true)

		wrapper.unmount()
		await flushPromises()

		expect(status('test/verdict')).toBe('idle')
		expect(bench.staged.size).toBe(0)
	})
})

describe('ссылка в шапке', () => {
	it.each(IDS)(
		'%s: ведёт на тесты фреймворка и обратно на ту же страницу свойств',
		async (framework) => {
			await router.push(`/${framework}/button`)

			const wrapper = mount(AppHeader, mountOptions)
			const link = () => wrapper.get('.pg__switch')

			expect(link().text()).toBe('Тесты')

			await link().trigger('click')
			await flushPromises()

			expect(router.currentRoute.value.path).toBe(
				testsPath(framework, scenariosOf(hostOf(framework))),
			)
			expect(link().text()).toBe('Свойства')

			await link().trigger('click')
			await flushPromises()

			expect(router.currentRoute.value.path).toBe(`/${framework}/button`)

			wrapper.unmount()
		},
	)
})

describe('меню страницы тестов', () => {
	const lists = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('.pg__menu')

	it.each(IDS)(
		'%s: рядом с темами — компоненты темы, каждый своей страницей',
		async (framework) => {
			const scenarios = scenariosOf(hostOf(framework))
			const [topic] = topicsOf(scenarios)
			const [first] = componentsOf(scenarios, topic.id)

			await router.push(`/${framework}/tests/${topic.id}/${first.id}`)

			const wrapper = mount(TestsSidebar, mountOptions)

			await rendered()

			const [topics, components] = lists(wrapper).map((list) =>
				list.findAll('.so-list-box-item').map((item) => item.text()),
			)

			expect(topics).toEqual(topicsOf(scenarios).map((item) => item.label))
			expect(components).toEqual(
				componentsOf(scenarios, topic.id).map((entry) => entry.label),
			)

			wrapper.unmount()
		},
	)

	/** Первые две темы фреймворка и компонент, общий для них, — если он есть. */
	function firstTopics(framework: string) {
		const scenarios = scenariosOf(hostOf(framework))
		const [from, to] = topicsOf(scenarios)
		const shared = componentsOf(scenarios, from.id).find((entry) =>
			componentsOf(scenarios, to.id).some((candidate) => candidate.id === entry.id),
		)

		return { scenarios, from, to, shared }
	}

	/**
	 * Открыть первую тему на компоненте `component` и нажать в меню вторую.
	 * Меню снимает вызывающий — после проверки адреса.
	 */
	async function switchTopic(framework: string, component: string): Promise<VueWrapper> {
		const { from } = firstTopics(framework)

		await router.push(`/${framework}/tests/${from.id}/${component}`)

		const wrapper = mount(TestsSidebar, mountOptions)

		await rendered()
		await lists(wrapper)[0].findAll('.so-list-box-item .so-button')[1].trigger('click')
		await flushPromises()

		return wrapper
	}

	/**
	 * Проверял Button в Events — в Slots открывается тоже Button, а не первый в
	 * списке. Проверка — у фреймворков, где первые две темы делят компонент:
	 * у Web Components не делят (Button проверяется событиями, кольцо —
	 * движением), и там смена темы открывает первый компонент новой (ниже).
	 */
	it.each(IDS.filter((framework) => firstTopics(framework).shared))(
		'%s: смена темы оставляет компонент, если в новой теме он есть',
		async (framework) => {
			const { to, shared } = firstTopics(framework)

			if (!shared) throw new Error('нет компонента, общего для двух тем')

			const wrapper = await switchTopic(framework, shared.id)

			expect(router.currentRoute.value.path).toBe(`/${framework}/tests/${to.id}/${shared.id}`)

			wrapper.unmount()
		},
	)

	it.each(IDS.filter((framework) => !firstTopics(framework).shared))(
		'%s: смена темы без общего компонента открывает первый компонент новой',
		async (framework) => {
			const { scenarios, from, to } = firstTopics(framework)
			const [first] = componentsOf(scenarios, from.id)
			const wrapper = await switchTopic(framework, first.id)

			expect(router.currentRoute.value.path).toBe(testsPath(framework, scenarios, to.id))

			wrapper.unmount()
		},
	)

	it.each(IDS)(
		'%s: адрес темы без компонента ведёт на её первый компонент',
		async (framework) => {
			const scenarios = scenariosOf(hostOf(framework))
			const [topic] = topicsOf(scenarios)

			await router.push(`/${framework}/tests/${topic.id}`)

			expect(router.currentRoute.value.path).toBe(testsPath(framework, scenarios, topic.id))
		},
	)
})
