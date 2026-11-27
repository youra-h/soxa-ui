// @vitest-environment jsdom

/**
 * Сторож: монтирование элемента коллекции не оставляет подписок на движке.
 *
 * Фасад элемента получает при сборке контекст элемента (`TItemContext`), и
 * item-адаптеры этого контекста подписаны на расширения движка — выбор,
 * порядок, список, — а некоторые и на сам элемент. Движок живёт дольше
 * монтирования. Элемент из данных (`items`) остаётся в коллекции, когда
 * фильтр или страница его прячут, и монтируется заново, когда показывают;
 * React под StrictMode и `<Activity>` пересобирает элемент, не размонтируя.
 * Контекст, который монтирование не освободило, оставляет на шинах движка
 * обработчики мёртвого фасада — с каждым показом новые, и каждое изменение
 * выбора их обходит. Снаружи этого не видно, поэтому стережётся тестом.
 *
 * Сверка — шпионами на `on` и `off` шин, как в `plugin-unsubscribe.spec.ts`:
 * после размонтирования каждая пара «событие, обработчик», повешенная на шину
 * за время монтирований, найдена среди снятых. Шпионы ставятся после сборки
 * списка, поэтому его собственные подписки в сверку не попадают. Элемент
 * монтируется так, как его монтируют адаптеры: свой контекст, контекст фасада
 * на его наборе, подписка на состояние обоих, `attach`; размонтирование —
 * отписка и `destroy` в том же порядке. После размонтирования состояние
 * фасада читается ещё раз, как это делает React со сборкой, которую уже
 * уничтожил: чтение не должно заводить подписок заново.
 *
 * Идёт по всем фасадам элементов из экспорта: новая коллекция попадёт под
 * проверку сама — без строки в таблице сторож упадёт.
 *
 * Второй сторож на том же харнессе — элемент под чужой коллекцией. Лифт
 * отдаёт движок ближайшей коллекции, а она бывает чужой: `<Toasts>`
 * оборачивает приложение. Каждый элемент разметки монтируется под списком
 * каждой другой коллекции, панель таба — под каждым списком, кроме Tabs:
 * сборка не падает, контекста у фасада нет, состав чужого движка тот же, и на
 * его шинах элемент ничего не вешал.
 */

import { describe, it, expect } from 'vitest'
import {
	TCollectionItemComponent,
	TListBoxItem,
	TMenuCheckboxItem,
	TMenuRadioItem,
} from '@soxa-ui/core'
import type { TCollectionEngine } from '@soxa-ui/core'
import { TCollectionBundlesPlugin } from '@soxa-ui/plugins'
import {
	StepperDescriptor,
	StepperCollectionDescriptor,
	StepperItemDescriptor,
	StepperCollectionItemDescriptor,
	BreadcrumbsDescriptor,
	BreadcrumbsCollectionDescriptor,
	BreadcrumbsItemDescriptor,
	BreadcrumbsCollectionItemDescriptor,
	AccordionCollectionDescriptor,
	ToggleGroupCollectionDescriptor,
	AccordionCollectionItemDescriptor,
	ToggleGroupCollectionItemDescriptor,
	AccordionDescriptor,
	ToggleGroupDescriptor,
	AccordionItemDescriptor,
	ToggleGroupItemDescriptor,
	CalendarCollectionDescriptor,
	CalendarCollectionItemDescriptor,
	CalendarDescriptor,
	CalendarItemDescriptor,
	ListBoxCollectionDescriptor,
	ListBoxCollectionItemDescriptor,
	TreeCollectionDescriptor,
	TreeItemCollectionDescriptor,
	TreeDescriptor,
	TreeItemDescriptor,
	ListBoxDescriptor,
	ListBoxItemDescriptor,
	MenuCheckboxItemDescriptor,
	MenuCollectionCheckboxItemDescriptor,
	MenuCollectionDescriptor,
	MenuCollectionItemDescriptor,
	MenuCollectionRadioItemDescriptor,
	MenuDescriptor,
	MenuItemDescriptor,
	MenuRadioItemDescriptor,
	PaginationCollectionDescriptor,
	PaginationCollectionItemDescriptor,
	PaginationDescriptor,
	PaginationItemDescriptor,
	RadioGroupCollectionDescriptor,
	RadioGroupCollectionItemDescriptor,
	RadioGroupDescriptor,
	RadioGroupItemDescriptor,
	SelectCollectionDescriptor,
	SelectCollectionItemDescriptor,
	SelectDescriptor,
	SelectItemDescriptor,
	TableCollectionDescriptor,
	TableCollectionRowDescriptor,
	TableDescriptor,
	TableRowDescriptor,
	TabsCollectionContentDescriptor,
	TabsCollectionDescriptor,
	TabsCollectionItemDescriptor,
	TabsContentDescriptor,
	TabsDescriptor,
	TabsItemDescriptor,
	TagsCollectionDescriptor,
	TagsCollectionItemDescriptor,
	TagsDescriptor,
	TagsItemDescriptor,
	ToastsCollectionDescriptor,
	ToastsCollectionItemDescriptor,
	ToastsDescriptor,
	ToastsItemDescriptor,
} from '../content/descriptors'
import {
	TCollectionExtension,
	TCollectionItemExtension,
	TTabsContentBindingExtension,
} from '../content/extensions'
import type { TCollectionItemFacade, TCollectionOwner } from '../content/extensions'
import { createAdapterContext } from '../protected/adapter'
import type { IAdapterContext, TContextContract, TElevatorFactory } from '../protected/adapter'
import type { IComponentDescriptor, IPluginsContract } from '../protected/define'
import { CommonProfile } from '../protected/naming'
import {
	createElevatorFactory,
	exportedDescriptors,
	leftovers,
	required,
	spyBus,
	subscribed,
	type IBusSpy,
} from './helpers'

/** Сколько раз элемент монтируется и снимается: утечка растёт с каждым разом. */
const MOUNTS = 3

/** Состав списка из данных: у элемента из данных `value` есть в любой коллекции. */
const SOURCES = [{ value: 'a' }, { value: 'b' }]

/**
 * Список, собранный над составом, лифт, через который его находят элементы, и
 * реестр bundles элементов у его набора.
 */
type TMountedList = {
	readonly engine: TCollectionEngine<any, any>
	readonly elevator: TElevatorFactory
	readonly registry: TCollectionBundlesPlugin | undefined
}

/**
 * Собрать список так, как его собирают адаптеры: свой контекст и контекст
 * фасада коллекции на его наборе, с расширением коллекции.
 */
function mountList<TFacade extends TCollectionOwner, TPlugins extends IPluginsContract>(
	own: IComponentDescriptor,
	collectionDescriptor: IComponentDescriptor<TContextContract<TFacade, TPlugins>>,
	items: readonly object[],
): TMountedList {
	const { factory: elevator } = createElevatorFactory()
	const owner = createAdapterContext(own, {})
	const facade = createAdapterContext(
		collectionDescriptor,
		{ props: { items: [...items] }, options: { owner: owner.instance } },
		{ bundle: owner.bundle },
	).use(TCollectionExtension, { elevator })

	return {
		engine: facade.instance.engine,
		elevator,
		registry: owner.bundle?.get(TCollectionBundlesPlugin),
	}
}

/** Смонтированное: контекст фасада и размонтирование. */
type TMounted = {
	readonly facade: IAdapterContext
	readonly unmount: () => void
}

/** Смонтированный элемент — ещё и его экземпляр. */
type TMountedItem = TMounted & { readonly instance: object }

/**
 * Принять контексты, как это делает рантайм адаптера: подписка на состояние и
 * `attach` — по порядку сборки. Размонтирование — отписка и `destroy` в том же
 * порядке, как `onUnmounted` у Vue.
 */
function accept(contexts: readonly IAdapterContext[]): () => void {
	const offs = contexts.map((context) => context.connect(CommonProfile).state.subscribe(() => {}))

	for (const context of contexts) context.attach()

	return () => {
		offs.forEach((off) => off())

		for (const context of contexts) context.destroy()
	}
}

/**
 * Перечитать состояние уже уничтоженной сборки. Так делает React: под
 * StrictMode он заново подписывается на обмен прежней сборки, хотя её
 * контексты уже уничтожены. Фасад, который держит отпущенный контекст
 * элемента, на таком чтении создал бы адаптеры заново.
 */
function reread(context: IAdapterContext): void {
	context.connect(CommonProfile).state.subscribe(() => {})()
}

/** Смонтировать, размонтировать и перечитать размонтированное. */
function cycle(mount: () => TMounted): void {
	const { facade, unmount } = mount()

	unmount()
	reread(facade)
}

/**
 * Откуда элемент: из данных списка — его экземпляр приходит `ctrl`, — или из
 * разметки — экземпляр строит своя сборка по пропсам.
 */
type TItemSource = { readonly ctrl: object } | { readonly props: object }

/**
 * Смонтировать элемент так, как его монтируют адаптеры: свой контекст и
 * контекст фасада на его наборе с расширением элемента.
 */
function mountItem<TFacade extends TCollectionItemFacade, TPlugins extends IPluginsContract>(
	own: IComponentDescriptor,
	collectionItemDescriptor: IComponentDescriptor<TContextContract<TFacade, TPlugins>>,
	elevator: TElevatorFactory,
	source: TItemSource,
): TMountedItem {
	const props = 'props' in source ? source.props : {}
	const adapter = createAdapterContext(own, { ...source, props })
	const facade = createAdapterContext(
		collectionItemDescriptor,
		{ props },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator })

	return { instance: adapter.instance, facade, unmount: accept([facade, adapter]) }
}

/** Коллекция под сторожем: её список и её элемент. */
type TCollectionKit = {
	readonly list: (items: readonly object[]) => TMountedList
	readonly item: (elevator: TElevatorFactory, source: TItemSource) => TMountedItem
}

/** Коллекции экспорта — ключ по дескриптору фасада элемента. */
const COLLECTIONS: Readonly<Record<string, TCollectionKit>> = {
	StepperCollectionItemDescriptor: {
		list: (items) => mountList(StepperDescriptor(), StepperCollectionDescriptor(), items),
		item: (elevator, source) =>
			mountItem(StepperItemDescriptor(), StepperCollectionItemDescriptor(), elevator, source),
	},
	BreadcrumbsCollectionItemDescriptor: {
		list: (items) =>
			mountList(BreadcrumbsDescriptor(), BreadcrumbsCollectionDescriptor(), items),
		item: (elevator, source) =>
			mountItem(
				BreadcrumbsItemDescriptor(),
				BreadcrumbsCollectionItemDescriptor(),
				elevator,
				source,
			),
	},
	AccordionCollectionItemDescriptor: {
		list: (items) => mountList(AccordionDescriptor(), AccordionCollectionDescriptor(), items),
		item: (elevator, source) =>
			mountItem(
				AccordionItemDescriptor(),
				AccordionCollectionItemDescriptor(),
				elevator,
				source,
			),
	},
	ToggleGroupCollectionItemDescriptor: {
		list: (items) =>
			mountList(ToggleGroupDescriptor(), ToggleGroupCollectionDescriptor(), items),
		item: (elevator, source) =>
			mountItem(
				ToggleGroupItemDescriptor(),
				ToggleGroupCollectionItemDescriptor(),
				elevator,
				source,
			),
	},
	TreeItemCollectionDescriptor: {
		list: (items) => mountList(TreeDescriptor(), TreeCollectionDescriptor(), items),
		item: (elevator, source) =>
			mountItem(TreeItemDescriptor(), TreeItemCollectionDescriptor(), elevator, source),
	},
	ListBoxCollectionItemDescriptor: {
		list: (items) => mountList(ListBoxDescriptor(), ListBoxCollectionDescriptor(), items),
		item: (elevator, source) =>
			mountItem(ListBoxItemDescriptor(), ListBoxCollectionItemDescriptor(), elevator, source),
	},
	MenuCollectionItemDescriptor: {
		list: (items) => mountList(MenuDescriptor(), MenuCollectionDescriptor(), items),
		item: (elevator, source) =>
			mountItem(MenuItemDescriptor(), MenuCollectionItemDescriptor(), elevator, source),
	},
	// Флажок — пункт той же коллекции меню: его список — меню из флажков
	MenuCollectionCheckboxItemDescriptor: {
		list: (items) =>
			mountList(
				MenuDescriptor(),
				MenuCollectionDescriptor(),
				items.map((source) => new TMenuCheckboxItem(source)),
			),
		item: (elevator, source) =>
			mountItem(
				MenuCheckboxItemDescriptor(),
				MenuCollectionCheckboxItemDescriptor(),
				elevator,
				source,
			),
	},
	// Переключатель — тоже пункт коллекции меню: его список — меню из переключателей
	MenuCollectionRadioItemDescriptor: {
		list: (items) =>
			mountList(
				MenuDescriptor(),
				MenuCollectionDescriptor(),
				items.map((source) => new TMenuRadioItem(source)),
			),
		item: (elevator, source) =>
			mountItem(
				MenuRadioItemDescriptor(),
				MenuCollectionRadioItemDescriptor(),
				elevator,
				source,
			),
	},
	RadioGroupCollectionItemDescriptor: {
		list: (items) => mountList(RadioGroupDescriptor(), RadioGroupCollectionDescriptor(), items),
		item: (elevator, source) =>
			mountItem(
				RadioGroupItemDescriptor(),
				RadioGroupCollectionItemDescriptor(),
				elevator,
				source,
			),
	},
	SelectCollectionItemDescriptor: {
		list: (items) => mountList(SelectDescriptor(), SelectCollectionDescriptor(), items),
		item: (elevator, source) =>
			mountItem(SelectItemDescriptor(), SelectCollectionItemDescriptor(), elevator, source),
	},
	TabsCollectionItemDescriptor: {
		list: (items) => mountList(TabsDescriptor(), TabsCollectionDescriptor(), items),
		item: (elevator, source) =>
			mountItem(TabsItemDescriptor(), TabsCollectionItemDescriptor(), elevator, source),
	},
	TagsCollectionItemDescriptor: {
		list: (items) => mountList(TagsDescriptor(), TagsCollectionDescriptor(), items),
		item: (elevator, source) =>
			mountItem(TagsItemDescriptor(), TagsCollectionItemDescriptor(), elevator, source),
	},
}

/**
 * Коллекции, у которых элемента из разметки нет: состав кладёт сама коллекция.
 * Дни календаря кладёт вид по месяцам сеток, `items` у него не принимается, а
 * день монтируется только над элементом из состава (`ctrl`). Так же страницы
 * пагинации — их кладёт окно. Строки таблицы — только данными: таблица рисует
 * строку сама, над её экземпляром.
 */
const DATA_ONLY: Readonly<Record<string, TCollectionKit>> = {
	CalendarCollectionItemDescriptor: {
		list: () => mountList(CalendarDescriptor(), CalendarCollectionDescriptor(), []),
		item: (elevator, source) =>
			mountItem(
				CalendarItemDescriptor(),
				CalendarCollectionItemDescriptor(),
				elevator,
				source,
			),
	},
	// Страницы окна кладёт расширение пагинации: без данных — одна страница
	PaginationCollectionItemDescriptor: {
		list: () => mountList(PaginationDescriptor(), PaginationCollectionDescriptor(), []),
		item: (elevator, source) =>
			mountItem(
				PaginationItemDescriptor(),
				PaginationCollectionItemDescriptor(),
				elevator,
				source,
			),
	},
	// Строки с колонкой заголовка и выбором: монтирование подписывает строку и
	// на ячейки, и на выбор строк
	TableCollectionRowDescriptor: {
		list: () => {
			const list = mountList(TableDescriptor(), TableCollectionDescriptor(), [
				{ data: { id: 1, name: 'Анна' } },
				{ data: { id: 2, name: 'Борис' } },
			])
			const { columns, selection } = list.engine.extensions

			columns.columns = [{ field: 'name', rowHeader: true }]
			selection.mode = 'multiple'

			return list
		},
		item: (elevator, source) =>
			mountItem(TableRowDescriptor(), TableCollectionRowDescriptor(), elevator, source),
	},
	// Тосты приходят из кода (`show`), в разметку их не ставят: тост рисует
	// регион владельца, над экземпляром из состава
	ToastsCollectionItemDescriptor: {
		list: () =>
			mountList(ToastsDescriptor(), ToastsCollectionDescriptor(), [
				{ text: 'Сохранено' },
				{ text: 'Отправлено' },
			]),
		item: (elevator, source) =>
			mountItem(ToastsItemDescriptor(), ToastsCollectionItemDescriptor(), elevator, source),
	},
}

/**
 * Части одной коллекции с разными фасадами элементов: флажок и переключатель
 * меню — пункты той же коллекции, что и действие, и под её списком они в неё
 * входят. Чужой друг другу их коллекция не считается. Ключ — часть, значение —
 * строка таблицы с её коллекцией.
 */
const SIBLINGS: Readonly<Record<string, string>> = {
	MenuCollectionCheckboxItemDescriptor: 'MenuCollectionItemDescriptor',
	MenuCollectionRadioItemDescriptor: 'MenuCollectionItemDescriptor',
}

/** Строка таблицы с коллекцией части: своя или та, чья это соседняя часть. */
const collectionOf = (name: string): string => SIBLINGS[name] ?? name

/** Своя ли коллекция у элемента и списка: та же строка таблицы или соседние части. */
const sameCollection = (item: string, list: string): boolean =>
	collectionOf(item) === collectionOf(list)

/**
 * Фасады, чей контекст берут не через вход в коллекцию: панель таба в
 * коллекцию не входит, а берёт контекст таба с тем же `value`.
 */
const PANELS: readonly string[] = ['TabsCollectionContentDescriptor']

/** Шины, которые переживают монтирование: драйвер и каждое расширение движка. */
function spyEngine(engine: TCollectionEngine<any, any>): IBusSpy[] {
	const extensions: Readonly<Record<string, unknown>> = engine.extensions

	return [
		...spyBus('driver', engine.getCore().driver),
		...Object.entries(extensions).flatMap(([key, extension]) => spyBus(key, extension)),
	]
}

/** Первый элемент состава — элемент из данных. */
const firstOf = (engine: TCollectionEngine<any, any>): object =>
	required(engine.extensions.batch.items[0], 'элемент из данных')

/** Панель таба, смонтированная под списком, и её фасад. */
function mountPanel(elevator: TElevatorFactory, value: string) {
	const adapter = createAdapterContext(TabsContentDescriptor(), { props: { value } })
	const facade = createAdapterContext(
		TabsCollectionContentDescriptor(),
		{ props: { value } },
		{ bundle: adapter.bundle },
	).use(TTabsContentBindingExtension, { adapter, elevator })

	return { content: adapter.instance, facade, unmount: accept([facade, adapter]) }
}

describe('сторож: элемент коллекции освобождает свой контекст', () => {
	it('таблица покрывает каждый фасад элемента из экспорта', () => {
		const facades = exportedDescriptors()
			.filter(
				([, descriptor]) => descriptor.ctor.prototype instanceof TCollectionItemComponent,
			)
			.map(([name]) => name)

		expect([...Object.keys(COLLECTIONS), ...Object.keys(DATA_ONLY), ...PANELS].sort()).toEqual(
			facades.sort(),
		)
	})

	// The order adapter has no subscription: the order extension notifies the adapters it
	// created and forgets each one on its `destroy` (core, collection.order.spec.ts)
	it('шпионы видят подписки item-адаптеров: у ListBox — выбор и список', () => {
		const kit = required(COLLECTIONS.ListBoxCollectionItemDescriptor, 'ListBox')
		const { engine, elevator } = kit.list(SOURCES)
		const spies = spyEngine(engine)

		kit.item(elevator, { ctrl: firstOf(engine) }).unmount()

		expect(subscribed(spies)).toEqual(
			expect.arrayContaining(['selection: change:selection', 'list: change:view']),
		)
	})

	describe.each(Object.entries(COLLECTIONS))('%s', (_name, kit) => {
		it('элемент из данных: после размонтирований подписок нет ни на движке, ни на элементе', () => {
			const { engine, elevator } = kit.list(SOURCES)
			const item = firstOf(engine)
			const spies = [...spyEngine(engine), ...spyBus('элемент', item)]

			for (let i = 0; i < MOUNTS; i++) cycle(() => kit.item(elevator, { ctrl: item }))

			expect(leftovers(spies)).toEqual([])
			// Данные на месте: размонтирование элемент из коллекции не удаляет
			expect(engine.extensions.batch.items).toContain(item)
		})

		it('элемент из разметки: после размонтирований подписок на движке нет', () => {
			const { engine, elevator } = kit.list([])
			const spies = spyEngine(engine)

			for (let i = 0; i < MOUNTS; i++)
				cycle(() => kit.item(elevator, { props: { value: 'm' } }))

			expect(leftovers(spies)).toEqual([])
			expect(engine.extensions.batch.items).toEqual([])
		})
	})

	describe.each(Object.entries(DATA_ONLY))('%s', (_name, kit) => {
		it('элемент из данных: после размонтирований подписок нет ни на движке, ни на элементе', () => {
			const { engine, elevator } = kit.list([])
			const item = firstOf(engine)
			const spies = [...spyEngine(engine), ...spyBus('элемент', item)]

			for (let i = 0; i < MOUNTS; i++) cycle(() => kit.item(elevator, { ctrl: item }))

			expect(leftovers(spies)).toEqual([])
			expect(engine.extensions.batch.items).toContain(item)
		})
	})
})

/**
 * `rendered = false` значит «элемента в коллекции больше нет», а не «кончилось
 * монтирование». Удалённый из коллекции элемент, пока смонтирован, перестаёт
 * рисоваться. Элемент из данных, которого спрятал фильтр, в коллекции
 * остаётся и при следующем показе обязан нарисоваться. Своё снятие элемента
 * разметки — тоже не удаление: его `ctrl` может смонтироваться снова.
 */
describe('rendered: удаление из коллекции, а не размонтирование', () => {
	const kit = required(COLLECTIONS.ListBoxCollectionItemDescriptor, 'ListBox')

	it('элемент из данных после размонтирования рисуется', () => {
		const { engine, elevator } = kit.list(SOURCES)
		const item = firstOf(engine)

		kit.item(elevator, { ctrl: item }).unmount()

		expect(Reflect.get(item, 'rendered')).toBe(true)
	})

	it('элемент из данных, удалённый из коллекции, пока смонтирован, не рисуется', () => {
		const { engine, elevator } = kit.list(SOURCES)
		const item = firstOf(engine)
		const spies = spyEngine(engine)

		cycle(() => {
			const mounted = kit.item(elevator, { ctrl: item })

			engine.extensions.plain.remove(item)

			expect(Reflect.get(item, 'rendered')).toBe(false)

			return mounted
		})

		expect(leftovers(spies)).toEqual([])
	})

	it('элемент из разметки, удалённый из коллекции, пока смонтирован, не рисуется', () => {
		const { engine, elevator } = kit.list([])
		const { instance, unmount } = kit.item(elevator, { props: { value: 'm' } })

		expect(engine.extensions.batch.items).toEqual([instance])

		engine.extensions.plain.remove(instance)

		expect(Reflect.get(instance, 'rendered')).toBe(false)

		unmount()
	})

	it('элемент разметки со своим ctrl после размонтирования рисуется и входит снова', () => {
		const { engine, elevator } = kit.list([])
		const ctrl = new TListBoxItem({ value: 'm' })

		kit.item(elevator, { ctrl }).unmount()

		expect(engine.extensions.batch.items).toEqual([])
		expect(ctrl.rendered).toBe(true)

		const { unmount } = kit.item(elevator, { ctrl })

		expect(engine.extensions.batch.items).toEqual([ctrl])
		expect(ctrl.rendered).toBe(true)

		unmount()
	})
})

/**
 * Панель таба в коллекцию не входит: она берёт контекст таба с тем же
 * `value`. Контекст — этого монтирования панели, как у элемента: снятие
 * освобождает его, а перепривязка освобождает прежний — и к другому табу, и
 * ни к какому, когда таба с новым значением нет.
 */
describe('сторож: панель таба освобождает контекст своего таба', () => {
	const tabs = () => mountList(TabsDescriptor(), TabsCollectionDescriptor(), SOURCES)

	it('после размонтирований подписок на движке и на табе нет', () => {
		const { engine, elevator } = tabs()
		const spies = [...spyEngine(engine), ...spyBus('таб', firstOf(engine))]

		for (let i = 0; i < MOUNTS; i++) cycle(() => mountPanel(elevator, 'a'))

		expect(subscribed(spies)).toContain('activation: change:activation')
		expect(leftovers(spies)).toEqual([])
	})

	it('перепривязка к другому табу освобождает контекст прежнего', () => {
		const { engine, elevator } = tabs()
		const [, b] = engine.extensions.batch.items
		const spies = spyEngine(engine)
		const { content, facade, unmount } = mountPanel(elevator, 'a')
		let changes = 0

		facade.instance.events.on('change:active', () => changes++)

		content.value = 'b'
		engine.extensions.activation.activate(b)

		// Активность панели — одна, от нового таба: прежний контекст её больше не шлёт
		expect(changes).toBe(1)
		expect(facade.instance.active).toBe(true)

		unmount()

		expect(leftovers(spies)).toEqual([])
	})

	it('значение без таба освобождает контекст прежнего: панель — ни с каким табом', () => {
		const { engine, elevator } = tabs()
		const [a, b] = engine.extensions.batch.items
		const { activation } = engine.extensions
		const spies = spyEngine(engine)
		const { content, facade, unmount } = mountPanel(elevator, 'a')
		let changes = 0

		activation.activate(a)
		facade.instance.events.on('change:active', () => changes++)

		content.value = 'z'

		// За прежний таб панель больше не отвечает: она неактивна и сказала об этом
		expect(facade.instance.context).toBeUndefined()
		expect(facade.instance.active).toBe(false)
		expect(changes).toBe(1)
		// Подписки контекста сняты: на движке панель только ждёт таб со своим значением
		expect(leftovers(spies)).toEqual(['plain: item:added'])

		// Активность прежнего таба до панели больше не доходит
		activation.activate(b)
		activation.activate(a)

		expect(changes).toBe(1)

		unmount()

		expect(leftovers(spies)).toEqual([])
	})
})

/**
 * Элемент входит только в ближайшую коллекцию своего типа. Лифт отдаёт движок
 * ближайшей коллекции, а она бывает чужой: `<Toasts>` оборачивает
 * приложение, и тег-чип стоит под тостами, тег или радио — в панели Tabs.
 * Чужая коллекция — как будто её нет. Сборка не падает — у тега под тостами
 * раньше падала: фасаду тега нужен выбор, которого у тостов нет. Контекста у
 * фасада нет, состав чужого движка после приёма тот же — раньше фабрика
 * чужого движка делала из элемента свой (радио под Tabs становилось табом), —
 * и на шины чужого движка элемент ничего не вешал.
 */
describe('сторож: элемент под чужой коллекцией в неё не входит', () => {
	const lists = { ...COLLECTIONS, ...DATA_ONLY }

	/** Контекст элемента у фасада: есть он — фасад в коллекции. */
	function contextOf(facade: IAdapterContext): unknown {
		const instance: unknown = facade.instance

		if (!(instance instanceof TCollectionItemComponent)) {
			throw new Error('фасад элемента — не TCollectionItemComponent')
		}

		return instance.context
	}

	/** Каждый элемент разметки под списком каждой другой коллекции. */
	const pairs = Object.entries(COLLECTIONS).flatMap(([itemName, itemKit]) =>
		Object.entries(lists)
			.filter(([listName]) => !sameCollection(itemName, listName))
			.map(([listName, listKit]) => [itemName, listName, itemKit, listKit] as const),
	)

	it.each(pairs)('%s под списком %s', (_item, _list, itemKit, listKit) => {
		const { engine, elevator } = listKit.list(SOURCES)
		const before = [...engine.extensions.batch.items]
		const spies = spyEngine(engine)
		const { facade, unmount } = itemKit.item(elevator, { props: { value: 'm' } })

		expect(contextOf(facade)).toBeUndefined()
		expect(engine.extensions.batch.items).toEqual(before)

		unmount()
		reread(facade)

		expect(contextOf(facade)).toBeUndefined()
		expect(engine.extensions.batch.items).toEqual(before)
		expect(subscribed(spies)).toEqual([])
		expect(leftovers(spies)).toEqual([])
	})

	/**
	 * Панель связывается только под движком Tabs. У списков из `COLLECTIONS`
	 * в данных есть элемент `a` — со значением панели, — и связка нашла бы
	 * его в чужом движке.
	 */
	const foreignLists = Object.entries(lists).filter(
		([name]) => name !== 'TabsCollectionItemDescriptor',
	)

	it.each(foreignLists)('панель под списком %s — ни с каким табом', (_name, kit) => {
		const { engine, elevator } = kit.list(SOURCES)
		const spies = spyEngine(engine)
		const { content, facade, unmount } = mountPanel(elevator, 'a')

		expect(facade.instance.item).toBeUndefined()
		expect(facade.instance.context).toBeUndefined()
		expect(content.aria.get('id')).toBeUndefined()
		expect(content.aria.get('aria-labelledby')).toBeUndefined()

		unmount()

		expect(subscribed(spies)).toEqual([])
		expect(leftovers(spies)).toEqual([])
	})
})

/**
 * Запись реестра bundles живёт одно монтирование элемента. Элемент из данных
 * остаётся в коллекции, когда его прячут — отбор или окно таблицы, — и без
 * снятия реестр держал бы bundle каждого прошлого монтирования с отсоединённым
 * узлом. Новое монтирование, собранное раньше, чем снято прежнее (React
 * пересобирает до очистки), своей записи не теряет.
 */
describe('реестр bundles: запись живёт одно монтирование элемента', () => {
	const kits = { ...COLLECTIONS, ...DATA_ONLY }

	describe.each(Object.entries(kits))('%s', (_name, kit) => {
		it('элемент из данных размонтирован — записи нет', () => {
			const { engine, elevator, registry } = kit.list(SOURCES)
			const item = firstOf(engine)
			const mounted = kit.item(elevator, { ctrl: item })

			expect(registry?.getByItem(item)).toBe(mounted.facade.bundle)

			mounted.unmount()

			expect(registry?.getByItem(item)).toBeUndefined()
		})

		it('новое монтирование до снятия прежнего — запись нового', () => {
			const { engine, elevator, registry } = kit.list(SOURCES)
			const item = firstOf(engine)
			const previous = kit.item(elevator, { ctrl: item })
			const next = kit.item(elevator, { ctrl: item })

			previous.unmount()

			expect(registry?.getByItem(item)).toBe(next.facade.bundle)

			next.unmount()
		})
	})
})
