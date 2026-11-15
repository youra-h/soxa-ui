// @vitest-environment jsdom

/**
 * Правила узла фокуса компонентов — куда запись `focused = true` ставит фокус
 * (`focusTarget` плагина действия, `action.plugin.spec.ts`).
 *
 * Каждое правило отвечает за модель фокуса своего компонента: часть поля
 * даты, день календаря, радио, заголовок секции, тег, текущую страницу,
 * остановку ленты, строку элемента коллекции. Плагины собраны настоящими
 * bundle, как в рантайме, но без адаптера: разметку тест строит сам в том
 * виде, в каком её рисует Vue, а остановку модель считает сама — движки
 * компонентов (`createEngine*`). Правило зовётся с контекстом набора, который
 * получил бы плагин действия; что тот ставит фокус на найденный узел, — в
 * `action.plugin.spec.ts`.
 *
 * Где у модели есть остановка, правило берёт её у модели, а не у разметки:
 * в такте смены разметка ещё старая. Это видно на тестах «в одном такте» —
 * разметку тест оставляет прежней, меняется только модель.
 */

import { describe, it, expect, afterEach } from 'vitest'
import {
	TAccordion,
	TAccordionItem,
	TCalendar,
	TDateInput,
	TDatePicker,
	TPagination,
	TRadioGroup,
	TRadioGroupItem,
	TScroller,
	TTags,
	TTagsItem,
	createEngineAccordion,
	createEngineCalendar,
	createEnginePagination,
	createEngineRadioGroup,
	createEngineTags,
} from '@soxa-ui/core'
import type { ICalendarItem, ITagsItem, TCollectionEngine } from '@soxa-ui/core'
import {
	TBasePlugin,
	TCalendarIdsPlugin,
	TCollectionBundlesPlugin,
	TCollectionElements,
	TElementPlugin,
	TPluginBundle,
	currentPageOf,
	fieldSegmentOf,
	firstHeaderOf,
	firstSegmentOf,
	gridStopOf,
	headerIn,
	radioStopOf,
	rowIn,
	tabIn,
	tagStopIn,
	tagStopOf,
	viewportStopOf,
} from '../src'
import type { IPlugin, IPluginConstructor, IPluginContext } from '../src'

afterEach(() => {
	document.body.innerHTML = ''
})

/** Плагин, который тест поставил сам: без него дальше проверять нечего. */
function pluginOf<P extends IPlugin<any, any>>(
	bundle: TPluginBundle,
	ctor: IPluginConstructor<any, any, P>,
): P {
	const plugin = bundle.get(ctor)

	if (!plugin) throw new Error(`${ctor.name} не установлен в bundle`)

	return plugin
}

/** Контекст набора — тот же, что получает плагин действия, а с ним правило. */
class TContextProbe extends TBasePlugin {
	ctx: IPluginContext | null = null

	override install(ctx: IPluginContext): void {
		super.install(ctx)

		this.ctx = ctx
	}
}

function contextOf(bundle: TPluginBundle): IPluginContext {
	const ctx = pluginOf(bundle, TContextProbe).ctx

	if (!ctx) throw new Error('контекст набора не получен')

	return ctx
}

/** Корень компонента в документе. */
function rootOf(...children: Element[]): HTMLElement {
	const root = document.createElement('div')

	root.append(...children)
	document.body.appendChild(root)

	return root
}

/** Кнопка с классом — своя остановка Tab перед главной частью или после неё. */
function button(className = ''): HTMLButtonElement {
	const node = document.createElement('button')

	node.className = className

	return node
}

/**
 * Набор владельца коллекции с узлами элементов: реестр bundles, реестр узлов
 * и контекст. Узел элемента строит `build`, как фреймворк — по экземпляру, в
 * порядке коллекции; элемент без узла (`null`) в документе не нарисован.
 */
function collectionOf<TItem extends object>(
	owner: object,
	engine: TCollectionEngine<TItem, any>,
	items: readonly TItem[],
	build: (item: TItem) => Element | null,
	plugins: IPluginConstructor<any, any, any>[] = [],
) {
	const root = rootOf()
	const bundle = new TPluginBundle(owner)
		.use(TElementPlugin)
		.use(TCollectionBundlesPlugin)
		.use(TCollectionElements)
		.use(TContextProbe)

	for (const plugin of plugins) bundle.use(plugin)

	const bundles = pluginOf(bundle, TCollectionBundlesPlugin)
	const nodes = new Map<TItem, Element>()

	for (const item of items) {
		const node = build(item)

		if (!node) continue

		root.appendChild(node)
		nodes.set(item, node)

		const itemBundle = new TPluginBundle(item).use(TElementPlugin)

		bundles.register(itemBundle, item)
		pluginOf(itemBundle, TElementPlugin).element = node
	}

	bundles.bindEngine(engine)
	pluginOf(bundle, TElementPlugin).element = root

	/** Узел элемента; не нарисован — тест падает здесь. */
	const nodeOf = (item: TItem): Element => {
		const node = nodes.get(item)

		if (!node) throw new Error('узла элемента нет')

		return node
	}

	return { root, ctx: contextOf(bundle), nodeOf }
}

/** Узел по селектору внутри `scope`; нет его — тест падает здесь. */
function find(scope: ParentNode, selector: string): Element {
	const node = scope.querySelector(selector)

	if (!node) throw new Error(`${selector}: узла нет`)

	return node
}

describe('строка, таб и заголовок в узле элемента', () => {
	it('rowIn — строка с tabindex, а не обёртка и не крестик после неё', () => {
		const node = document.createElement('div')
		const row = document.createElement('div')
		const close = button()

		row.tabIndex = -1
		node.append(row, close)

		expect(rowIn(node)).toBe(row)
		expect(rowIn(null)).toBeNull()
	})

	it('tabIn — строка с ролью tab, а не крестик', () => {
		const node = document.createElement('div')
		const tab = button()
		const close = button()

		tab.setAttribute('role', 'tab')
		node.append(tab, close)

		expect(tabIn(node)).toBe(tab)
		expect(tabIn(null)).toBeNull()
	})

	/**
	 * Заголовок — первая кнопка с `aria-expanded`: в панели секции бывает своя
	 * раскрывающаяся кнопка, и стоит она после заголовка.
	 */
	it('headerIn — заголовок секции, а не раскрывающаяся кнопка в панели', () => {
		const node = document.createElement('div')
		const header = button()
		const panel = document.createElement('div')
		const nested = button()

		header.setAttribute('aria-expanded', 'false')
		nested.setAttribute('aria-expanded', 'false')
		panel.appendChild(nested)
		node.append(header, panel)

		expect(headerIn(node)).toBe(header)
		expect(headerIn(null)).toBeNull()
	})
})

describe('firstSegmentOf — первая часть поля даты', () => {
	/** Корень поля: кнопка в `leading`, ряд частей с разделителем, кнопка очистки. */
	function field() {
		const owner = new TDateInput()
		const segment = (type: string) => {
			const node = document.createElement('span')

			node.className = owner.classes.resolve('__segment')
			node.dataset.type = type

			return node
		}
		const month = segment('month')
		const day = segment('day')
		const row = document.createElement('span')
		const literal = document.createElement('span')

		row.className = owner.classes.resolve('__segments')
		row.append(month, literal, day)

		const root = rootOf(button('before'), row, button('clear'))
		const bundle = new TPluginBundle(owner).use(TContextProbe)

		return { root, ctx: contextOf(bundle), month }
	}

	it('первая часть по порядку документа, а не кнопка в leading', () => {
		const { root, ctx, month } = field()

		expect(firstSegmentOf(root, ctx)).toBe(month)
	})

	it('частей в корне нет — null', () => {
		const { ctx } = field()

		expect(firstSegmentOf(rootOf(button()), ctx)).toBeNull()
	})
})

describe('fieldSegmentOf — первая часть поля DatePicker', () => {
	/** Корень DatePicker: поля по режиму, у каждого — две части, кнопка календаря. */
	function picker(mode: 'single' | 'range') {
		const owner = new TDatePicker({ mode })
		const fieldOf = (name: string) => {
			const node = document.createElement('div')

			node.dataset.field = name

			for (const type of ['month', 'day']) {
				const segment = document.createElement('span')

				segment.className = owner.field.classes.resolve('__segment')
				segment.dataset.type = type
				node.appendChild(segment)
			}

			return node
		}
		const fields = mode === 'range' ? [fieldOf('start'), fieldOf('end')] : [fieldOf('field')]
		const root = rootOf(...fields, button('trigger'))
		const bundle = new TPluginBundle(owner).use(TContextProbe)

		return { root, ctx: contextOf(bundle) }
	}

	it('одна дата — первая часть поля', () => {
		const { root, ctx } = picker('single')

		expect(fieldSegmentOf(root, ctx)).toBe(find(root, '[data-field="field"] [data-type]'))
	})

	it('диапазон — первая часть поля начала, а не конца', () => {
		const { root, ctx } = picker('range')

		expect(fieldSegmentOf(root, ctx)).toBe(find(root, '[data-field="start"] [data-type]'))
	})
})

describe('gridStopOf — остановка календаря', () => {
	/**
	 * Календарь на сентябре 2026: кнопки листания перед днями, по узлу на день
	 * коллекции. Фокус коллекции — на 16-м.
	 */
	function calendar() {
		const owner = new TCalendar({ months: ['2026-09-01'] })
		const engine = createEngineCalendar({ owner })

		engine.extensions.focus.focusDate('2026-09-16')

		const items = engine.extensions.batch.items
		const set = collectionOf<ICalendarItem>(
			owner,
			engine,
			items,
			(item) => {
				const node = document.createElement('div')

				node.dataset.date = item.date

				return node
			},
			[TCalendarIdsPlugin],
		)

		set.root.prepend(button(owner.classes.resolve('__prev')))

		/** Узел дня по дате; нет его — тест падает здесь. */
		const dayOf = (date: string) => find(set.root, `[data-date="${date}"]`)

		return { ...set, owner, engine, dayOf }
	}

	it('день с фокусом коллекции, а не кнопка листания перед сеткой', () => {
		const { root, ctx, dayOf } = calendar()

		expect(gridStopOf(root, ctx)).toBe(dayOf('2026-09-16'))
	})

	/**
	 * Фокус коллекции сменился в том же такте: `tabindex="0"` в разметке ещё
	 * у прежнего дня, а остановку правило берёт у модели.
	 */
	it('смена фокуса коллекции в одном такте — новый день, а не прежняя остановка', () => {
		const { root, ctx, engine, dayOf } = calendar()

		dayOf('2026-09-16').setAttribute('tabindex', '0')
		engine.extensions.focus.focusDate('2026-09-20')

		expect(gridStopOf(root, ctx)).toBe(dayOf('2026-09-20'))
	})

	/**
	 * Фокус коллекции ушёл в непоказанный месяц, и сетка сдвинулась, а
	 * разметка нового месяца ещё не нарисована: дня с фокусом в документе нет.
	 * Прежний день из разметки — не остановка: его уже нет в коллекции.
	 */
	it('день нового месяца ещё не нарисован — null', () => {
		const { root, ctx, engine } = calendar()

		engine.extensions.focus.focusDate('2026-10-05')

		expect(gridStopOf(root, ctx)).toBeNull()
	})

	/**
	 * Открыта панель выбора месяца и года — сетка под её подложкой, остановка
	 * — список панели. Свою карточку правило узнаёт по шапке места, как
	 * клавиатура календаря.
	 */
	it('панель выбора открыта — узел списка в её карточке', () => {
		const { root, ctx, owner, engine } = calendar()
		const place = engine.extensions.picker.pickers[0]

		const headingId = place?.headingAria.id

		if (!place || !headingId) throw new Error('Missing picker heading ID')

		const card = document.createElement('div')
		const listRoot = document.createElement('div')
		const list = document.createElement('div')
		const heading = button()

		card.className = owner.classes.resolve('__picker')
		listRoot.className = owner.classes.resolve('__picker-list')
		list.setAttribute('role', 'listbox')
		heading.id = headingId
		listRoot.appendChild(list)
		card.append(listRoot, heading)
		root.appendChild(card)

		place.popover.open = true

		expect(gridStopOf(root, ctx)).toBe(list)

		place.popover.open = false

		expect(gridStopOf(root, ctx)).not.toBe(list)
	})

	it('панель открыта, а её карточки в документе нет — null, не день под подложкой', () => {
		const { root, ctx, engine } = calendar()
		const place = engine.extensions.picker.pickers[0]

		if (!place) throw new Error('места нет')

		place.popover.open = true

		expect(gridStopOf(root, ctx)).toBeNull()
	})
})

describe('radioStopOf — остановка группы радио', () => {
	/** Группа из трёх радио: у каждого корень — подпись, в ней поле. */
	function group(values: string[]) {
		const owner = new TRadioGroup()
		const engine = createEngineRadioGroup({ owner })
		const items = values.map((value) =>
			engine.extensions.plain.push(new TRadioGroupItem({ value })),
		)
		const set = collectionOf(owner, engine, items, (item) => {
			const label = document.createElement('label')
			const input = document.createElement('input')

			input.type = 'radio'
			input.name = 'group'
			input.value = String(item.value)
			label.appendChild(input)

			return label
		})

		/** Поле радио по значению. */
		const fieldOf = (value: string) => find(set.root, `input[value="${value}"]`)
		/** Радио по значению. */
		const radioOf = (value: string) => {
			const radio = items.find((item) => item.value === value)

			if (!radio) throw new Error(`радио ${value} нет`)

			return radio
		}

		return { ...set, owner, fieldOf, radioOf }
	}

	it('отмеченное радио', () => {
		const { root, ctx, owner, fieldOf } = group(['a', 'b', 'c'])

		owner.value = 'b'

		expect(radioStopOf(root, ctx)).toBe(fieldOf('b'))
	})

	it('без отметки — первое, на которое можно перейти', () => {
		const { root, ctx, fieldOf, radioOf } = group(['a', 'b', 'c'])

		radioOf('a').disabled = true

		expect(radioStopOf(root, ctx)).toBe(fieldOf('b'))
	})

	it('отмеченное выключено — первое, на которое можно перейти', () => {
		const { root, ctx, owner, fieldOf, radioOf } = group(['a', 'b', 'c'])

		owner.value = 'c'
		radioOf('c').disabled = true

		expect(radioStopOf(root, ctx)).toBe(fieldOf('a'))
	})

	/**
	 * Значение сменилось в том же такте: `checked` в разметке ещё у прежнего
	 * радио, а отмеченное правило берёт у модели.
	 */
	it('смена значения в одном такте — новое радио, а не прежняя отметка', () => {
		const { root, ctx, owner, fieldOf } = group(['a', 'b', 'c'])
		const stale = fieldOf('a')

		if (!(stale instanceof HTMLInputElement)) throw new Error('у радио нет поля')

		owner.value = 'a'
		stale.checked = true
		owner.value = 'c'

		expect(radioStopOf(root, ctx)).toBe(fieldOf('c'))
	})

	it('радио, на которые можно перейти, нет — null', () => {
		const { root, ctx, radioOf } = group(['a', 'b'])

		radioOf('a').disabled = true
		radioOf('b').visible = false

		expect(radioStopOf(root, ctx)).toBeNull()
	})
})

describe('firstHeaderOf — заголовок первой доступной секции', () => {
	/** Аккордеон: у секции заголовок с `aria-expanded` и панель с кнопкой. */
	function accordion(values: string[]) {
		const owner = new TAccordion()
		const engine = createEngineAccordion({ owner })
		const items = values.map((value) =>
			engine.extensions.plain.push(new TAccordionItem({ value, text: value })),
		)
		const set = collectionOf(owner, engine, items, (item) => {
			const node = document.createElement('div')
			const header = button()
			const panel = document.createElement('div')

			header.dataset.value = String(item.value)
			header.setAttribute('aria-expanded', 'false')
			panel.appendChild(button())
			node.append(header, panel)

			return node
		})

		const headerOf = (value: string) => find(set.root, `[data-value="${value}"]`)
		const sectionOf = (value: string) => {
			const section = items.find((item) => item.value === value)

			if (!section) throw new Error(`секции ${value} нет`)

			return section
		}

		return { ...set, headerOf, sectionOf }
	}

	it('заголовок первой секции', () => {
		const { root, ctx, headerOf } = accordion(['a', 'b'])

		expect(firstHeaderOf(root, ctx)).toBe(headerOf('a'))
	})

	it('первая выключена или скрыта — следующая, на которую можно перейти', () => {
		const { root, ctx, headerOf, sectionOf } = accordion(['a', 'b', 'c'])

		sectionOf('a').disabled = true
		sectionOf('b').visible = false

		expect(firstHeaderOf(root, ctx)).toBe(headerOf('c'))
	})

	it('секций, на которые можно перейти, нет — null', () => {
		const { root, ctx, sectionOf } = accordion(['a'])

		sectionOf('a').disabled = true

		expect(firstHeaderOf(root, ctx)).toBeNull()
	})
})

/**
 * Узел тега, как его рисует разметка: строка — набор `aria` тега (роль и
 * `tabindex`; своих строка не пишет, она `TItemRow`), — и крестик, пока
 * тег закрывается (`tabindex` — из `closeAria`). Наборы тест кладёт на узлы
 * сам — один раз, при отрисовке: дальше разметка не перерисовывается.
 */
function drawTag(item: ITagsItem, closable = true): HTMLElement {
	const node = document.createElement('div')
	const row = document.createElement('div')

	for (const [name, value] of Object.entries(item.aria.valueOf())) {
		if (value !== null && value !== undefined) row.setAttribute(name, String(value))
	}

	row.dataset.value = String(item.value)
	node.append(row)

	if (!closable) return node

	const close = button()

	for (const [name, value] of Object.entries(item.closeAria.valueOf())) {
		if (value !== null && value !== undefined) close.setAttribute(name, String(value))
	}

	close.dataset.close = String(item.value)
	close.disabled = item.disabled
	node.append(close)

	return node
}

/** Тег в наборе с режимом выбора — модель, по которой рисуется его узел. */
function tagInMode(mode: 'none' | 'single'): ITagsItem {
	const engine = createEngineTags({ owner: new TTags({ closable: true }) })
	const tag = engine.extensions.plain.push(new TTagsItem({ value: 'a', text: 'a' }))

	engine.extensions.selection.mode = mode

	return tag
}

describe('tagStopIn — остановка в узле тега', () => {
	it('с выбором — строка с ролью опции, а не крестик и не обёртка', () => {
		const node = drawTag(tagInMode('single'))

		expect(tagStopIn(node)).toBe(find(node, '[data-value="a"]'))
	})

	/**
	 * Строка без выбора — `listitem` без `tabindex`: фокус она не принимает, и
	 * `focused = true` ставит его туда же, куда ведёт Tab, — на крестик.
	 */
	it('без выбора — крестик: у строки ни роли опции, ни tabindex', () => {
		const node = drawTag(tagInMode('none'))
		const row = find(node, '[data-value="a"]')

		expect(row.hasAttribute('tabindex')).toBe(false)
		expect(tagStopIn(node)).toBe(find(node, '[data-close="a"]'))
	})

	it('без выбора и без крестика — null: остановок в теге нет', () => {
		expect(tagStopIn(drawTag(tagInMode('none'), false))).toBeNull()
	})

	it('узла нет — null', () => {
		expect(tagStopIn(null)).toBeNull()
	})
})

describe('tagStopOf — остановка набора тегов', () => {
	function tags(values: string[], mode: 'none' | 'single') {
		const owner = new TTags({ closable: true })
		const engine = createEngineTags({ owner })
		const items = values.map((value) =>
			engine.extensions.plain.push(new TTagsItem({ value, text: value })),
		)

		engine.extensions.selection.mode = mode

		const set = collectionOf(owner, engine, items, (item) => drawTag(item))
		const rowOf = (value: string) => find(set.root, `[data-value="${value}"]`)
		const closeOf = (value: string) => find(set.root, `[data-close="${value}"]`)
		const tagOf = (value: string) => {
			const tag = items.find((item) => item.value === value)

			if (!tag) throw new Error(`тега ${value} нет`)

			return tag
		}

		return { ...set, engine, rowOf, closeOf, tagOf }
	}

	it('с выбором — строка тега-остановки: выбранного', () => {
		const { root, ctx, engine, rowOf, tagOf } = tags(['a', 'b', 'c'], 'single')

		engine.extensions.selection.select(tagOf('b'))

		expect(tagStopOf(root, ctx)).toBe(rowOf('b'))
	})

	/**
	 * Выбор сменился в том же такте: `tabindex="0"` в разметке ещё у прежнего
	 * тега, а остановку правило берёт у модели.
	 */
	it('смена выбора в одном такте — новый тег, а не прежняя остановка', () => {
		const { root, ctx, engine, rowOf, tagOf } = tags(['a', 'b', 'c'], 'single')

		expect(rowOf('a').getAttribute('tabindex')).toBe('0')

		engine.extensions.selection.select(tagOf('c'))

		expect(tagStopOf(root, ctx)).toBe(rowOf('c'))
	})

	it('без выбора — крестик первого тега: у строк остановки нет', () => {
		const { root, ctx, closeOf, rowOf } = tags(['a', 'b'], 'none')

		expect(rowOf('a').hasAttribute('tabindex')).toBe(false)
		expect(tagStopOf(root, ctx)).toBe(closeOf('a'))
	})

	it('без выбора, первый выключен — крестик следующего', () => {
		const { root, ctx, closeOf, tagOf } = tags(['a', 'b'], 'none')

		tagOf('a').disabled = true

		expect(tagStopOf(root, ctx)).toBe(closeOf('b'))
	})
})

describe('currentPageOf — кнопка текущей страницы', () => {
	/** Пагинация: стрелка «назад», по узлу `li` с кнопкой на страницу окна. */
	function pagination(value: number) {
		const owner = new TPagination({ total: 50, value })
		const engine = createEnginePagination({ owner })
		const set = collectionOf(owner, engine, engine.extensions.batch.items, (item) => {
			const node = document.createElement('li')
			const page = button()

			page.textContent = item.text
			node.appendChild(page)

			return node
		})

		set.root.prepend(button(owner.classes.resolve('__prev')))

		const pageOf = (text: string) => {
			const found = [...set.root.querySelectorAll('li button')].find(
				(node) => node.textContent === text,
			)

			if (!found) throw new Error(`страницы ${text} нет`)

			return found
		}

		return { ...set, owner, pageOf }
	}

	it('кнопка страницы значения, а не стрелка «назад»', () => {
		const { root, ctx, pageOf } = pagination(3)

		expect(currentPageOf(root, ctx)).toBe(pageOf('3'))
	})

	it('ключ без страницы — null', () => {
		const { root, ctx, owner } = pagination(3)

		owner.value = 999

		expect(currentPageOf(root, ctx)).toBeNull()
	})
})

describe('viewportStopOf — остановка ленты', () => {
	/** Лента: кнопка «назад», вьюпорт с содержимым, кнопка «вперёд». */
	function scroller(content: Element[]) {
		const owner = new TScroller()
		const viewport = document.createElement('div')

		viewport.className = owner.classes.resolve('__viewport')
		viewport.append(...content)

		const root = rootOf(button(owner.classes.resolve('__prev')), viewport, button())
		const bundle = new TPluginBundle(owner).use(TContextProbe)

		return { owner, root, viewport, ctx: contextOf(bundle) }
	}

	it('свои остановки внутри — первая из них, а не кнопка «назад»', () => {
		const first = button()
		const { root, ctx, owner } = scroller([document.createElement('span'), first, button()])

		owner.notifyViewport({ canPrev: false, canNext: true, hasTabStops: true })

		expect(viewportStopOf(root, ctx)).toBe(first)
	})

	it('своих остановок нет, а листать есть куда — сам вьюпорт', () => {
		const { root, ctx, owner, viewport } = scroller([document.createElement('span')])

		owner.notifyViewport({ canPrev: false, canNext: true, hasTabStops: false })

		expect(viewportStopOf(root, ctx)).toBe(viewport)
	})

	it('остановок нет и листать некуда — null', () => {
		const { root, ctx } = scroller([document.createElement('span')])

		expect(viewportStopOf(root, ctx)).toBeNull()
	})
})
