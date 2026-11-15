/**
 * Сторож: сборка компонента идёт и на сервере, где нет ни узла, ни
 * `requestAnimationFrame`, ни типов DOM.
 *
 * Адаптер собирает компонент и на сервере (Vue — `setup()`, React — рендер,
 * Svelte — инициализация): плагины подписываются, движок привязывается,
 * элементы разметки у Vue и Svelte входят в коллекцию, — и события состава,
 * выбора и подсветки приходят плагинам уже тогда. Снятие там тоже бывает:
 * Solid снимает собранный корень следующей задачей после `renderToString`, и
 * элементы разметки уходят из коллекции. Узел корень получает только в
 * браузере. Работе на кадр он нужен — высоте, чтобы мерить, прокрутке, чтобы
 * крутить, подчёркиванию таба, чтобы найти таб, — поэтому плагин планирует
 * кадр, только пока узел у него есть (`ready` … `removed` своего
 * `TElementPlugin`). Что сменилось до узла, применяет `ready`. Проверка узла
 * — тоже работа при узле: где стоит DOM-фокус, клавиатура календаря узнаёт
 * по `instanceof Element` и `instanceof Node`, и без корня она выходит раньше
 * проверки.
 *
 * Окружение — `node`, как у сервера: `requestAnimationFrame`, `Element` и
 * `Node` в нём нет, и сторож их не подкладывает. Кадр, запланированный без
 * узла, и проверка узла без узла бросают `ReferenceError`. Подписчик прямо на
 * эмиттере роняет им сборку, а подписчика проброса (`relayAll` — так `plain`
 * отдаёт события драйвера) шина не роняет: ошибку она печатает в
 * `console.error`. Поэтому `console.error` под шпионом на каждом тесте файла.
 * Серверные тесты Vue и React идут в jsdom, где есть и кадр, и типы DOM, и
 * этого не видят.
 *
 * Сборка — как у адаптеров: свой контекст и контекст фасада на общем наборе,
 * обмен подписан на состояние, приём (`attach`) — по порядку сборки. Узла нет:
 * `bindElement` не зовётся.
 */

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import type { MockInstance } from 'vitest'
import {
	TCalendarKeyboardPlugin,
	TListHeightPlugin,
	TListScrollPlugin,
	TSelectKeyboardPlugin,
	TTabsActiveTabPlugin,
	TTextareaAutoresizePlugin,
} from '@soxa-ui/plugins'
import { FRAME_LAYER_ATTRIBUTE, menuOf } from '@soxa-ui/core'
import {
	CalendarCollectionDescriptor,
	CalendarDescriptor,
	DialogDescriptor,
	AlertDialogDescriptor,
	DrawerDescriptor,
	FrameDescriptor,
	ListBoxCollectionDescriptor,
	ListBoxCollectionItemDescriptor,
	ListBoxDescriptor,
	ListBoxItemDescriptor,
	MenuCheckboxItemDescriptor,
	MenuCollectionCheckboxItemDescriptor,
	MenuCollectionDescriptor,
	MenuDescriptor,
	MenuSubmenuDescriptor,
	SelectCollectionDescriptor,
	SelectDescriptor,
	TabsCollectionDescriptor,
	TabsCollectionItemDescriptor,
	TabsDescriptor,
	TabsItemDescriptor,
	TextareaDescriptor,
	ToastsCollectionDescriptor,
	ToastsDescriptor,
} from '../content/descriptors'
import {
	TCollectionExtension,
	TCollectionItemExtension,
	TDragAndDropCollectionExtension,
	TVirtualCollectionExtension,
} from '../content/extensions'
import { createAdapterContext } from '../protected/adapter'
import type { IAdapterContext, TExchange } from '../protected/adapter'
import { CallbackProfile, createElevatorFactory, required } from './helpers'

/** Шпион `console.error` текущего теста: вывод не глушится, а считается. */
let consoleError: MockInstance<typeof console.error>

beforeEach(() => {
	consoleError = vi.spyOn(console, 'error')
})

afterEach(() => {
	const calls = [...consoleError.mock.calls]

	// Консоль возвращается до проверки: после упавшего `expect` хук дальше не идёт
	consoleError.mockRestore()

	expect(calls, 'в консоль ушли ошибки').toEqual([])
})

/** Принятый контекст: его обмен и снятие. */
type TAccepted = { readonly exchange: TExchange; readonly unmount: () => void }

/**
 * Принять контекст, как рантайм адаптера: обмен подписан на состояние, затем
 * `attach`. Снятие — отписка и `destroy`.
 */
function accept(context: IAdapterContext): TAccepted {
	const exchange = context.connect(CallbackProfile)
	const off = exchange.state.subscribe(() => {})

	context.attach()

	return {
		exchange,
		unmount: () => {
			off()
			context.destroy()
		},
	}
}

/** Снять принятые контексты в обратном порядке: элементы и фасад раньше владельца. */
function unmountAll(accepted: readonly TAccepted[]): void {
	for (const { unmount } of [...accepted].reverse()) unmount()
}

/**
 * ListBox, собранный как в адаптере Svelte, — и элементы разметки под ним:
 * свой контекст элемента и контекст его фасада, лифт — общий со списком.
 */
function assembleListBox(props: object, markup: readonly object[] = []) {
	const { factory: elevator } = createElevatorFactory()
	const list = createAdapterContext(ListBoxDescriptor(), { props })
	const ownAccepted = accept(list)
	const facade = createAdapterContext(
		ListBoxCollectionDescriptor(),
		{ props, options: { owner: list.instance } },
		{ bundle: list.bundle },
	)
		.use(TCollectionExtension, { elevator })
		.use(TDragAndDropCollectionExtension, { elevator })
		.use(TVirtualCollectionExtension, { elevator })
	const accepted = [ownAccepted, accept(facade)]

	for (const itemProps of markup) {
		const item = createAdapterContext(ListBoxItemDescriptor(), { props: itemProps })

		accepted.push(accept(item))
		accepted.push(
			accept(
				createAdapterContext(
					ListBoxCollectionItemDescriptor(),
					{ props: itemProps },
					{ bundle: item.bundle },
				).use(TCollectionItemExtension, { adapter: item, elevator }),
			),
		)
	}

	return {
		list,
		facade,
		inputs: ownAccepted.exchange.inputs,
		unmount: () => unmountAll(accepted),
	}
}

/** Select из данных, собранный как в адаптере Vue: свой контекст и контекст фасада. */
function assembleSelect(props: object) {
	const { factory: elevator } = createElevatorFactory()
	const select = createAdapterContext(SelectDescriptor(), { props })
	const ownAccepted = accept(select)
	const facade = createAdapterContext(
		SelectCollectionDescriptor(),
		{ props, options: { owner: select.instance } },
		{ bundle: select.bundle },
	)
		.use(TCollectionExtension, { elevator })
		.use(TVirtualCollectionExtension, { elevator })
	const facadeAccepted = accept(facade)

	return {
		select,
		facade,
		inputs: ownAccepted.exchange.inputs,
		facadeInputs: facadeAccepted.exchange.inputs,
		unmount: () => unmountAll([ownAccepted, facadeAccepted]),
	}
}

/**
 * Menu, собранный как в адаптере Svelte, — и флажки разметки под ним: свой
 * контекст флажка и контекст его фасада, лифт — общий с меню.
 */
function assembleMenu(markup: readonly object[]) {
	const { factory: elevator } = createElevatorFactory()
	const menu = createAdapterContext(MenuDescriptor(), { props: {} })
	const facade = createAdapterContext(
		MenuCollectionDescriptor(),
		{ props: {}, options: { owner: menu.instance } },
		{ bundle: menu.bundle },
	).use(TCollectionExtension, { elevator })
	const accepted = [accept(menu), accept(facade)]

	for (const itemProps of markup) {
		const item = createAdapterContext(MenuCheckboxItemDescriptor(), { props: itemProps })

		accepted.push(accept(item))
		accepted.push(
			accept(
				createAdapterContext(
					MenuCollectionCheckboxItemDescriptor(),
					{ props: itemProps },
					{ bundle: item.bundle },
				).use(TCollectionItemExtension, { adapter: item, elevator }),
			),
		)
	}

	return { facade, unmount: () => unmountAll(accepted) }
}

/**
 * Tabs, собранный как в адаптере Svelte, — и табы разметки под ним: свой
 * контекст таба и контекст его фасада, лифт — общий с Tabs.
 */
function assembleTabs(props: object, markup: readonly object[] = []) {
	const { factory: elevator } = createElevatorFactory()
	const tabs = createAdapterContext(TabsDescriptor(), { props })
	const ownAccepted = accept(tabs)
	const facade = createAdapterContext(
		TabsCollectionDescriptor(),
		{ props, options: { owner: tabs.instance } },
		{ bundle: tabs.bundle },
	)
		.use(TCollectionExtension, { elevator })
		.use(TDragAndDropCollectionExtension, { elevator })
	const accepted = [ownAccepted, accept(facade)]

	for (const itemProps of markup) {
		const item = createAdapterContext(TabsItemDescriptor(), { props: itemProps })

		accepted.push(accept(item))
		accepted.push(
			accept(
				createAdapterContext(
					TabsCollectionItemDescriptor(),
					{ props: itemProps },
					{ bundle: item.bundle },
				).use(TCollectionItemExtension, { adapter: item, elevator }),
			),
		)
	}

	return { facade, unmount: () => unmountAll(accepted) }
}

/**
 * Calendar, собранный как в адаптере Solid: свой контекст и контекст фасада на
 * общем наборе. Дни кладёт в коллекцию вид по месяцам сеток — дней разметкой
 * у календаря нет.
 */
function assembleCalendar(props: object) {
	const { factory: elevator } = createElevatorFactory()
	const calendar = createAdapterContext(CalendarDescriptor(), { props })
	const ownAccepted = accept(calendar)
	const facade = createAdapterContext(
		CalendarCollectionDescriptor(),
		{ props, options: { owner: calendar.instance } },
		{ bundle: calendar.bundle },
	).use(TCollectionExtension, { elevator })
	const facadeAccepted = accept(facade)

	return {
		facade,
		inputs: ownAccepted.exchange.inputs,
		unmount: () => unmountAll([ownAccepted, facadeAccepted]),
	}
}

/** Значения элементов по порядку. */
const valuesOf = (items: ReadonlyArray<{ readonly value?: unknown }>) =>
	items.map((item) => item.value)

describe('сторож: сборка списка без узла и без requestAnimationFrame', () => {
	/** Иначе сторож молча перестанет ловить кадр, запланированный сборкой. */
	it('в окружении нет requestAnimationFrame — как на сервере', () => {
		expect('requestAnimationFrame' in globalThis).toBe(false)
	})

	/** Иначе сценарии ниже проходили бы без тех, кто работает на кадр. */
	it('плагины, которые работают на кадр, стоят в наборе ListBox, Select и меню', () => {
		const list = createAdapterContext(ListBoxDescriptor(), { props: {} })
		const select = createAdapterContext(SelectDescriptor(), { props: {} })
		const menu = createAdapterContext(MenuDescriptor(), { props: {} })
		const submenu = createAdapterContext(MenuSubmenuDescriptor(), { props: {} })

		expect(list.bundle?.get(TListHeightPlugin)).toBeDefined()
		expect(list.bundle?.get(TListScrollPlugin)).toBeDefined()
		expect(select.bundle?.get(TListHeightPlugin)).toBeDefined()
		expect(select.bundle?.get(TListScrollPlugin)).toBeDefined()
		expect(menu.bundle?.get(TListScrollPlugin)).toBeDefined()
		expect(submenu.bundle?.get(TListScrollPlugin)).toBeDefined()

		list.destroy()
		select.destroy()
		menu.destroy()
		submenu.destroy()
	})

	it('ListBox из items: сборка, приём, смена value и maxRows, уничтожение', () => {
		const props = {
			items: [
				{ value: 'a', text: 'A' },
				{ value: 'b', text: 'B' },
				{ value: 'c', text: 'C' },
			],
			value: 'b',
			maxRows: 2,
		}
		const { list, facade, inputs, unmount } = assembleListBox(props)
		const { selection } = facade.instance.engine.extensions

		expect(valuesOf(selection.selected)).toEqual(['b'])

		inputs.full({ ...props, value: 'c', maxRows: 3 })

		expect(valuesOf(selection.selected)).toEqual(['c'])
		expect(list.instance.maxRows).toBe(3)

		unmount()
	})

	it('ListBox с элементами разметки: входят в коллекцию на attach, выбранный — выбран', () => {
		const { facade, unmount } = assembleListBox({}, [
			{ value: 'a', text: 'A' },
			{ value: 'b', text: 'B', selected: true },
		])
		const { batch, selection } = facade.instance.engine.extensions

		expect(valuesOf(batch.items)).toEqual(['a', 'b'])
		expect(valuesOf(selection.selected)).toEqual(['b'])

		unmount()
	})

	/**
	 * Прокрутка списка панели слушает выбор и подсветку клавиатуры, а оба факта
	 * приходят и на сервере: значение из пропсов, подсветка — от кода (так её
	 * ставит ввод поля). Узла нет — кадр она не планирует.
	 */
	it('Select из items: сборка, приём, смена value, maxRows и состава, подсветка, уничтожение', () => {
		const props = {
			items: [
				{ value: 'a', text: 'A' },
				{ value: 'b', text: 'B' },
			],
			value: 'a',
			maxRows: 1,
		}
		const { select, facade, inputs, facadeInputs, unmount } = assembleSelect(props)
		const { batch, selection } = facade.instance.engine.extensions
		const keyboard = required(select.bundle?.get(TSelectKeyboardPlugin), 'клавиатура Select')

		expect(valuesOf(batch.items)).toEqual(['a', 'b'])

		inputs.full({ ...props, value: 'b', maxRows: 2 })
		facadeInputs.full({ ...props, items: [...props.items, { value: 'c', text: 'C' }] })
		keyboard.highlightSelected()
		keyboard.highlightByText('')

		expect(valuesOf(selection.selected)).toEqual(['b'])
		expect(select.instance.maxRows).toBe(2)
		expect(valuesOf(batch.items)).toEqual(['a', 'b', 'c'])

		unmount()
	})

	/**
	 * Меню собирается и на сервере, и отметка флажков — значение меню, за
	 * которым идёт прокрутка списка пунктов, — там тоже меняется.
	 */
	it('Menu с флажками разметки: сборка, приём, отметка, уничтожение', () => {
		const { facade, unmount } = assembleMenu([
			{ value: 'grid', text: 'Сетка' },
			{ value: 'list', text: 'Список' },
		])
		const { engine } = facade.instance
		const { batch, selection } = engine.extensions

		expect(valuesOf(batch.items)).toEqual(['grid', 'list'])

		menuOf(engine)?.checkItem(batch.items[1])

		expect(valuesOf(selection.selected)).toEqual(['list'])

		unmount()
	})
})

/**
 * Авторост Textarea работает на кадр: мерит текст поля и пишет его высоту.
 * Сборка поля идёт и на сервере, и значение, строки, потолок и размер там
 * меняются, а узла нет — кадр плагин не планирует, высоту поставит `ready`.
 */
describe('сторож: сборка Textarea без узла и без requestAnimationFrame', () => {
	/** Иначе сценарий ниже прошёл бы без того, кто работает на кадр. */
	it('плагин автороста стоит в наборе Textarea', () => {
		const textarea = createAdapterContext(TextareaDescriptor(), { props: {} })

		expect(textarea.bundle?.get(TTextareaAutoresizePlugin)).toBeDefined()

		textarea.destroy()
	})

	it('сборка с авторостом, приём, смена value, rows, maxRows, size и autoresize, уничтожение', () => {
		const props = { autoresize: true, rows: 2, maxRows: 4, value: 'a', counter: true }
		const textarea = createAdapterContext(TextareaDescriptor(), { props })
		const { exchange, unmount } = accept(textarea)

		exchange.inputs.full({ ...props, value: 'a\nb\nc', rows: 3, maxRows: 6, size: 'lg' })
		exchange.inputs.full({ ...props, autoresize: false })

		expect(textarea.instance.value).toBe('a')
		expect(textarea.instance.rows).toBe(2)
		expect(textarea.instance.autoresize).toBe(false)

		unmount()
	})
})

/**
 * Подчёркивание активного таба работает на кадр: таб сняли или переставили —
 * место активного оно мерит кадром позже, когда разметка перерисована. Табы
 * разметки входят в коллекцию и на сервере, а снимает их там Solid вместе с
 * корнем после `renderToString`. Узла нет — кадр плагин не планирует, место
 * померит `ready`.
 */
describe('сторож: сборка Tabs без узла и без requestAnimationFrame', () => {
	/** Иначе сценарий ниже прошёл бы без того, кто работает на кадр. */
	it('плагин подчёркивания стоит в наборе Tabs', () => {
		const tabs = createAdapterContext(TabsDescriptor(), { props: {} })

		expect(tabs.bundle?.get(TTabsActiveTabPlugin)).toBeDefined()

		tabs.destroy()
	})

	it('табы разметки: вход на attach, перестановка, снятие со всеми табами', () => {
		const { facade, unmount } = assembleTabs({}, [
			{ value: 'a', text: 'A' },
			{ value: 'b', text: 'B', active: true },
			{ value: 'c', text: 'C' },
		])
		const { activation, batch, plain } = facade.instance.engine.extensions
		const moved: unknown[] = []
		const removed: unknown[] = []

		plain.events.on('item:moved', (e) => moved.push(e.item.value))
		plain.events.on('item:removed', (e) => removed.push(e.item.value))

		expect(valuesOf(batch.items)).toEqual(['a', 'b', 'c'])
		expect(activation.activeItem?.value).toBe('b')

		plain.move(required(batch.items[2], 'таб c'), 0)

		expect(valuesOf(batch.items)).toEqual(['c', 'a', 'b'])

		// Табы разметки уходят из коллекции раньше Tabs — как при снятии корня
		unmount()

		expect(moved).toEqual(['c'])
		expect(removed).toEqual(['c', 'b', 'a'])
	})
})

/**
 * Клавиатура календаря ведёт DOM-фокус за фокусом коллекции, листанием и
 * панелями выбора месяца и года — и все три события приходят уже при сборке:
 * плагины связок и имён пишут наборы мест, а смена месяцев и границ двигает
 * фокус и листание. Где стоит DOM-фокус, плагин узнаёт проверкой узла
 * (`instanceof Element`, `instanceof Node`), а в Node типов DOM нет: без корня
 * плагин выходит раньше проверки — так же, как без узла не планируют кадр.
 */
describe('сторож: сборка Calendar без узла и без типов DOM', () => {
	/** Иначе сторож молча перестанет ловить проверку узла без узла. */
	it('в окружении нет Element и Node — как на сервере', () => {
		expect('Element' in globalThis).toBe(false)
		expect('Node' in globalThis).toBe(false)
	})

	/** Иначе сценарий ниже прошёл бы без того, кто проверяет узел. */
	it('плагин клавиатуры стоит в наборе Calendar', () => {
		const calendar = createAdapterContext(CalendarDescriptor(), { props: {} })

		expect(calendar.bundle?.get(TCalendarKeyboardPlugin)).toBeDefined()

		calendar.destroy()
	})

	it('две сетки в range: сборка, приём, смена months, min и max, уничтожение', () => {
		const props = {
			months: ['2026-09-01', '2026-10-01'],
			mode: 'range',
			value: ['2026-09-10', '2026-09-14'],
		}
		const { facade, inputs, unmount } = assembleCalendar(props)
		const { batch, focus, picker, view } = facade.instance.engine.extensions
		const heard = new Set<string>()

		// IDs are allocated during assembly, before the lazy headings render.
		expect(batch.items).toHaveLength(61)
		expect(focus.focusedDate).toBe('2026-09-10')
		expect(picker.pickers.map((place) => place.labelledBy)).toEqual([undefined, undefined])
		expect(picker.pickers.map((place) => place.headingAria.id)).toEqual([
			expect.stringMatching(/\S/),
			expect.stringMatching(/\S/),
		])

		focus.events.on('change:focusedDate', () => heard.add('change:focusedDate'))
		view.events.on('change:paging', () => heard.add('change:paging'))
		picker.events.on('change:pickers', () => heard.add('change:pickers'))

		const months = ['2026-11-01', '2026-12-01']

		inputs.full({ ...props, months })
		inputs.full({ ...props, months, min: '2026-11-15', max: '2026-12-20' })

		expect(view.months).toEqual(months)
		expect(focus.focusedDate).toBe('2026-11-15')
		expect([view.prevDisabled, view.nextDisabled]).toEqual([true, true])
		// Иначе сценарий прошёл бы мимо всех трёх подписок клавиатуры
		expect([...heard].sort()).toEqual(['change:focusedDate', 'change:paging', 'change:pickers'])

		unmount()
	})
})

/**
 * Слой, открытый уже в разметке сервера: панель с `contained`, окно, регион
 * тостов. Место в стеке слой берёт у счётчика процесса, и у сервера счётчик
 * свой: номер, попавший в разметку, браузер при гидратации нарисовал бы
 * другим. Номер открывает узел (`ready`), а на сервере узла нет — ни у панели,
 * ни у подложки номера в разметке нет, и `z-index` раскладки — 0, как в первой
 * отрисовке браузера.
 */
describe('сторож: слой, открытый на сервере, — без номера слоя', () => {
	/** Открытые слои — так, как их собирает адаптер по разметке страницы. */
	const frame = () =>
		createAdapterContext(FrameDescriptor(), { props: { visible: true, contained: true } })
	const drawer = () =>
		createAdapterContext(DrawerDescriptor(), { props: { visible: true, contained: true } })
	const dialog = () => createAdapterContext(DialogDescriptor(), { props: { visible: true } })
	const alertDialog = () =>
		createAdapterContext(AlertDialogDescriptor(), { props: { visible: true } })

	it.each([
		['Frame с contained', frame],
		['Drawer с contained', drawer],
		['Dialog', dialog],
		['AlertDialog', alertDialog],
	] as const)('%s: zIndex 0, data-layer нет, z-index раскладки — 0', (_, assemble) => {
		const layer = assemble()
		const { exchange, unmount } = accept(layer)
		const state = exchange.state.getSnapshot()

		expect(layer.instance.visible).toBe(true)
		expect(layer.instance.zIndex).toBe(0)
		expect(state.dataset).toMatchObject({ 'data-open': 'true' })
		expect(state.dataset).not.toHaveProperty(FRAME_LAYER_ATTRIBUTE)
		expect(state.layout_styles).toMatchObject({ 'z-index': 0 })

		unmount()
	})

	it.each([
		['Drawer с contained', drawer],
		['Dialog', dialog],
		['AlertDialog', alertDialog],
	] as const)('%s: у подложки тоже — номера нет, z-index 0', (_, assemble) => {
		const layer = assemble()
		const { exchange, unmount } = accept(layer)
		const state = exchange.state.getSnapshot()

		expect(state.backdropDataset).toMatchObject({ 'data-open': 'true' })
		expect(state.backdropDataset).not.toHaveProperty(FRAME_LAYER_ATTRIBUTE)
		expect(state.layout_backdropStyles).toEqual({ 'z-index': 0 })

		unmount()
	})

	/** Регион виден всегда, а каждый новый тост поднимает его в стеке. */
	it('Toasts с тостом: место поднято, номера нет, z-index раскладки — 0', () => {
		const { factory: elevator } = createElevatorFactory()
		const toasts = createAdapterContext(ToastsDescriptor(), { props: {} })
		const own = accept(toasts)
		const facade = createAdapterContext(
			ToastsCollectionDescriptor(),
			{ props: {}, options: { owner: toasts.instance } },
			{ bundle: toasts.bundle },
		).use(TCollectionExtension, { elevator })
		const accepted = [own, accept(facade)]

		facade.instance.engine.extensions.toasts.show('Сохранено')

		const state = own.exchange.state.getSnapshot()

		expect(facade.instance.engine.extensions.batch.shown).toHaveLength(1)
		expect(toasts.instance.zIndex).toBe(0)
		expect(state.dataset).not.toHaveProperty(FRAME_LAYER_ATTRIBUTE)
		expect(state.layout_styles).toEqual({ 'z-index': 0 })

		unmountAll(accepted)
	})
})
