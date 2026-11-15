/**
 * `id` в разметке — от монтирования, плагинами связок.
 *
 * Ядро `id` не строит: они нужны только документу, и на сервере и в браузере
 * обязаны совпасть. Набор плагинов получает id монтирования (`mountId`) от
 * адаптера — тот берёт его у `useId` фреймворка, — и плагины строят из него `id`
 * частей (`createId`): `<mountId>-<часть>`. Формула связки одна, в плагине, и
 * обе её стороны пишутся в наборы компонента.
 */

import { describe, it, expect } from 'vitest'
import {
	TAccordionItem,
	TCalendar,
	TCalendarCollectionFacade,
	TDateInput,
	TDatePicker,
	TDialog,
	TDrawer,
	TField,
	TListBoxGroup,
	TListBoxItem,
	TMenu,
	TMenuGroup,
	TMenuPopoverItem,
	TMenuSubmenu,
	TPopover,
	TRadioGroup,
	TRadioGroupCollectionFacade,
	TRadioGroupItem,
	TSelect,
	TSelectGroup,
	TSelectItem,
	TTableColumn,
	TTableRow,
	TTabsItem,
	TTextarea,
	TTooltip,
} from '@soxa-ui/core'
import type { IRadioGroupItem } from '@soxa-ui/core'
import {
	TAccordionItemIdsPlugin,
	TAriaPlugin,
	TCalendarIdsPlugin,
	TCollectionBundlesPlugin,
	TDateInputIdsPlugin,
	TDatePickerIdsPlugin,
	TDialogIdsPlugin,
	TDismissPlugin,
	TFieldIdsPlugin,
	TIdPlugin,
	TItemGroupIdsPlugin,
	TMenuIdsPlugin,
	TMenuPopupIdsPlugin,
	TModalIdsPlugin,
	TOptionIdsPlugin,
	TPluginBundle,
	TPopoverIdsPlugin,
	TRadioGroupNamePlugin,
	TSelectIdsPlugin,
	TTableColumnIdsPlugin,
	TTableRowIdsPlugin,
	TTabsItemIdsPlugin,
	TTextareaIdsPlugin,
	TTooltipIdsPlugin,
} from '../src'
import type { IPluginConstructor } from '../src'

describe('id монтирования', () => {
	it('id части — <mountId>-<часть>', () => {
		expect(new TPluginBundle({}, 'v-3').createId('panel')).toBe('v-3-panel')
	})

	it('без id монтирования — свой у каждого набора', () => {
		expect(new TPluginBundle({}).createId('panel')).not.toBe(
			new TPluginBundle({}).createId('panel'),
		)
	})

	it('id — у монтирования: новое монтирование того же экземпляра пишет свои', () => {
		const popover = new TPopover()

		new TPluginBundle(popover, 'm1').use(TPopoverIdsPlugin)

		const first = popover.aria.get('id')

		new TPluginBundle(popover, 'm2').use(TPopoverIdsPlugin)

		expect(first).toBe('m1-panel')
		expect(popover.aria.get('id')).toBe('m2-panel')
	})
})

describe('оверлеи', () => {
	it('Popover: id панели и aria-controls триггера — один id', () => {
		const popover = new TPopover()

		new TPluginBundle(popover, 'm1').use(TPopoverIdsPlugin)

		expect(popover.aria.get('id')).toBe('m1-panel')
		expect(popover.triggerAria.get('aria-controls')).toBe('m1-panel')
	})

	it('Menu: триггер и панель ссылаются друг на друга — имя меню от кнопки', () => {
		const menu = new TMenu()

		new TPluginBundle(menu, 'm1').use(TMenuIdsPlugin)

		expect(menu.triggerAria.toObject()).toEqual({
			'aria-haspopup': 'menu',
			'aria-expanded': 'false',
			id: 'm1-trigger',
			'aria-controls': 'm1-panel',
		})
		expect(menu.aria.get('id')).toBe('m1-panel')
		expect(menu.aria.get('aria-labelledby')).toBe('m1-trigger')
	})

	/**
	 * Контекстное меню вызывают над областью, а она не кнопка: ни `id`
	 * триггера, ни ссылок у неё нет, и панели не на что ссылаться за именем.
	 * `id` панели — её собственный, остаётся.
	 */
	it('Menu: у контекстного меню связки нет с первой отрисовки, смена режима её ставит и снимает', () => {
		const menu = new TMenu({ openOn: 'contextmenu' })

		new TPluginBundle(menu, 'm1').use(TMenuIdsPlugin)

		expect(menu.triggerAria.toObject()).toEqual({})
		expect(menu.aria.get('id')).toBe('m1-panel')
		expect(menu.aria.has('aria-labelledby')).toBe(false)

		menu.openOn = 'press'

		expect(menu.triggerAria.get('id')).toBe('m1-trigger')
		expect(menu.triggerAria.get('aria-controls')).toBe('m1-panel')
		expect(menu.aria.get('aria-labelledby')).toBe('m1-trigger')

		menu.openOn = 'contextmenu'

		expect(menu.triggerAria.toObject()).toEqual({})
		expect(menu.aria.has('aria-labelledby')).toBe(false)
	})

	it('Menu.Submenu: строка и панель подменю ссылаются друг на друга — имя подменю от строки', () => {
		const submenu = new TMenuSubmenu({ text: 'Поделиться' })

		new TPluginBundle(submenu, 'm1').use(TMenuPopupIdsPlugin)

		expect(submenu.aria.toObject()).toEqual({
			role: 'menuitem',
			'aria-haspopup': 'menu',
			'aria-expanded': 'false',
			id: 'm1-row',
			'aria-controls': 'm1-panel',
		})
		expect(submenu.panelAria.toObject()).toEqual({
			role: 'menu',
			id: 'm1-panel',
			'aria-labelledby': 'm1-row',
		})
	})

	it('Menu.PopoverItem: строка и панель-диалог ссылаются друг на друга — имя диалога от строки', () => {
		const due = new TMenuPopoverItem({ text: 'Срок' })

		new TPluginBundle(due, 'm1').use(TMenuPopupIdsPlugin)

		expect(due.aria.toObject()).toEqual({
			role: 'menuitem',
			'aria-haspopup': 'dialog',
			'aria-expanded': 'false',
			id: 'm1-row',
			'aria-controls': 'm1-panel',
		})
		expect(due.panelAria.toObject()).toEqual({
			role: 'dialog',
			id: 'm1-panel',
			'aria-labelledby': 'm1-row',
		})
	})

	/**
	 * Плагин имени группы один на три формы: у группы меню, ListBox и Select
	 * формула связки одна. Роль подписи — у формы, и плагин её не трогает.
	 */
	describe.each([
		['Menu.Group', (label?: string) => new TMenuGroup({ label })],
		['ListBox.Group', (label?: string) => new TListBoxGroup({ label })],
		['Select.Group', (label?: string) => new TSelectGroup({ label })],
	])('%s', (_name, create) => {
		it('имя группы — подпись, пока она не пуста', () => {
			const group = create('Вид')

			new TPluginBundle(group, 'm1').use(TItemGroupIdsPlugin)

			expect(group.labelAria.get('id')).toBe('m1-label')
			expect(group.aria.get('aria-labelledby')).toBe('m1-label')

			group.label = ''

			expect(group.aria.has('aria-labelledby')).toBe(false)

			group.label = 'Сортировка'

			expect(group.aria.get('aria-labelledby')).toBe('m1-label')
		})

		it('без подписи ссылки нет с первой отрисовки', () => {
			const group = create()

			new TPluginBundle(group, 'm1').use(TItemGroupIdsPlugin)

			expect(group.aria.has('aria-labelledby')).toBe(false)
		})
	})

	it('роль подписи плагин не трогает: у списков — presentation, у меню — нет', () => {
		const list = new TListBoxGroup({ label: 'Фрукты' })
		const menu = new TMenuGroup({ label: 'Вид' })

		new TPluginBundle(list, 'm1').use(TItemGroupIdsPlugin)
		new TPluginBundle(menu, 'm2').use(TItemGroupIdsPlugin)

		expect(list.labelAria.toObject()).toEqual({ role: 'presentation', id: 'm1-label' })
		expect(menu.labelAria.toObject()).toEqual({ id: 'm2-label' })
	})

	it('Tooltip: ссылка триггера по режиму, ровно одна', () => {
		const tooltip = new TTooltip()

		new TPluginBundle(tooltip, 'm1').use(TTooltipIdsPlugin)

		expect(tooltip.aria.get('id')).toBe('m1-panel')
		expect(tooltip.triggerAria.toObject()).toEqual({ 'aria-describedby': 'm1-panel' })

		tooltip.type = 'label'

		expect(tooltip.triggerAria.toObject()).toEqual({ 'aria-labelledby': 'm1-panel' })

		tooltip.type = 'description'

		expect(tooltip.triggerAria.toObject()).toEqual({ 'aria-describedby': 'm1-panel' })
	})

	it('Drawer: имя — заголовок', () => {
		const drawer = new TDrawer()

		new TPluginBundle(drawer, 'm1').use(TModalIdsPlugin)

		expect(drawer.titleAria.toObject()).toEqual({ id: 'm1-title' })
		expect(drawer.aria.get('aria-labelledby')).toBe('m1-title')
	})

	it('Dialog: имя — заголовок, описание предупреждения — тело', () => {
		const dialog = new TDialog()

		new TPluginBundle(dialog, 'm1').use(TDialogIdsPlugin)

		expect(dialog.aria.get('aria-labelledby')).toBe('m1-title')
		expect(dialog.bodyAria.toObject()).toEqual({ id: 'm1-body' })
		expect(dialog.aria.has('aria-describedby')).toBe(false)

		dialog.alert = true

		expect(dialog.aria.get('aria-describedby')).toBe('m1-body')

		dialog.alert = false

		expect(dialog.aria.has('aria-describedby')).toBe(false)
	})

	it('DatePicker: id панели и aria-controls кнопки календаря — один id', () => {
		const picker = new TDatePicker()

		new TPluginBundle(picker, 'm1').use(TDatePickerIdsPlugin)

		expect(picker.panelAria.get('id')).toBe('m1-panel')
		expect(picker.triggerAria.has('aria-controls')).toBe(false)
	})

	it('пометка панели владельцем — от монтирования', () => {
		const bundle = new TPluginBundle(new TPopover(), 'm1').use(TDismissPlugin)

		expect(bundle.get(TDismissPlugin)?.ownerAttribute).toEqual({ 'data-owner': 'm1-owner' })
	})
})

describe('коллекции', () => {
	it('Select: id списка и aria-controls поля', () => {
		const select = new TSelect()

		new TPluginBundle(select, 'm1').use(TSelectIdsPlugin)

		expect(select.listAria.get('id')).toBe('m1-list')
		expect(select.field.aria.has('aria-controls')).toBe(false)
	})

	/**
	 * Плагин `id` элемента — один на оба списка: на `id` ссылается
	 * `aria-activedescendant` узла с фокусом — поля Select и узла списка ListBox.
	 * Элемент из данных рисуется с готовым экземпляром, поэтому новое
	 * монтирование пишет свой `id`.
	 */
	it.each([
		['Select.Item', () => new TSelectItem({ value: 'a' })],
		['ListBox.Item', () => new TListBoxItem({ value: 'a' })],
	] as const)('%s: id элемента — от его монтирования', (_name, create) => {
		const item = create()

		new TPluginBundle(item, 'm2').use(TOptionIdsPlugin)

		expect(item.aria.get('id')).toBe('m2-option')

		new TPluginBundle(item, 'm3').use(TOptionIdsPlugin)

		expect(item.aria.get('id')).toBe('m3-option')
	})

	it('Tabs.Item: id таба и aria-controls его панели', () => {
		const tab = new TTabsItem({ value: 'a' })

		new TPluginBundle(tab, 'm1').use(TTabsItemIdsPlugin)

		expect(tab.aria.get('id')).toBe('m1-tab')
		expect(tab.aria.get('aria-controls')).toBe('m1-panel')
	})

	it('Table.Row: id заголовка строки — от её монтирования, в набор заголовка', () => {
		const row = new TTableRow({ data: { id: 1 } })

		new TPluginBundle(row, 'm1').use(TTableRowIdsPlugin)

		expect(row.headerAria.toObject()).toEqual({ id: 'm1-header' })

		// Строку таблица рисует с готовым экземпляром: новое монтирование — свой id
		new TPluginBundle(row, 'm2').use(TTableRowIdsPlugin)

		expect(row.headerAria.get('id')).toBe('m2-header')
		expect(row.aria.has('id')).toBe(false)
	})

	it('Table.Column: заголовок и поле ручки названы подписью; кнопку сортировки плагин не трогает', () => {
		const column = new TTableColumn({
			field: 'name',
			text: 'Имя',
			resizable: true,
			sortable: true,
		})

		new TPluginBundle(column, 'm1').use(TTableColumnIdsPlugin)

		expect(column.textAria.toObject()).toEqual({ id: 'm1-text' })
		expect(column.aria.get('aria-labelledby')).toBe('m1-text')
		expect(column.resizerAria.toObject()).toEqual({ 'aria-labelledby': 'm1-text' })
		// Имя кнопке — от локали, а не ссылкой на подпись: см. плагин имён
		expect(column.sortAria.toObject()).toEqual({})

		// Колонку таблица рисует с готовым экземпляром: новое монтирование — свой id
		new TPluginBundle(column, 'm2').use(TTableColumnIdsPlugin)

		expect(column.textAria.get('id')).toBe('m2-text')
		expect(column.aria.get('aria-labelledby')).toBe('m2-text')
		expect(column.resizerAria.get('aria-labelledby')).toBe('m2-text')
		expect(column.aria.has('id')).toBe(false)
	})

	it('Accordion.Item: заголовок и панель ссылаются друг на друга', () => {
		const section = new TAccordionItem({ value: 'a' })

		new TPluginBundle(section, 'm1').use(TAccordionItemIdsPlugin)

		expect(section.aria.get('id')).toBe('m1-header')
		expect(section.aria.get('aria-controls')).toBe('m1-content')
		expect(section.contentAria.toObject()).toEqual({
			role: 'region',
			id: 'm1-content',
			'aria-labelledby': 'm1-header',
		})
	})

	it('Calendar: сетку называет заголовок её места, и листание его не меняет', () => {
		const owner = new TCalendar({ months: ['2026-01-01', '2026-02-01'] })
		const facade = new TCalendarCollectionFacade({}, { owner })
		const bundle = new TPluginBundle(owner, 'm1')
			.use(TCollectionBundlesPlugin)
			.use(TCalendarIdsPlugin)
		const titles = () => facade.grids.map(({ titleAria }) => titleAria.id)

		bundle.get(TCollectionBundlesPlugin)?.bindEngine(facade.engine)

		expect(titles()).toEqual(['m1-title-0', 'm1-title-1'])
		expect(facade.grids.map(({ gridAria }) => gridAria['aria-labelledby'])).toEqual([
			'm1-title-0',
			'm1-title-1',
		])

		facade.extensions.view.showNext()

		expect(titles()).toEqual(['m1-title-0', 'm1-title-1'])

		// Мест стало больше — новое тоже названо
		owner.months = ['2026-01-01', '2026-02-01', '2026-03-01']

		expect(titles()).toEqual(['m1-title-0', 'm1-title-1', 'm1-title-2'])
	})

	it('Calendar: панель выбора месяца и года называет её шапка — на каждом месте', () => {
		const owner = new TCalendar({ months: ['2026-01-01', '2026-02-01'] })
		const facade = new TCalendarCollectionFacade({}, { owner })
		const bundle = new TPluginBundle(owner, 'm1')
			.use(TCollectionBundlesPlugin)
			.use(TCalendarIdsPlugin)
		const headings = () => facade.pickers.map(({ headingAria }) => headingAria.id)
		const labels = () => facade.pickers.map(({ labelledBy }) => labelledBy)

		bundle.get(TCollectionBundlesPlugin)?.bindEngine(facade.engine)

		expect(headings()).toEqual(['m1-picker-0', 'm1-picker-1'])
		expect(labels()).toEqual([undefined, undefined])

		const first = facade.pickers[0]

		if (!first) throw new Error('Missing first picker')

		first.popover.open = true

		expect(labels()).toEqual(['m1-picker-0', undefined])

		first.popover.open = false

		expect(labels()).toEqual(['m1-picker-0', undefined])

		owner.months = ['2026-01-01', '2026-02-01', '2026-03-01']

		expect(headings()).toEqual(['m1-picker-0', 'm1-picker-1', 'm1-picker-2'])
		expect(labels()).toEqual(['m1-picker-0', undefined, undefined])
	})
})

describe('поле даты', () => {
	it('DateInput: id каждой части — от монтирования и её типа, смена локали его не меняет', () => {
		const input = new TDateInput({ locale: 'ru-RU' })

		new TPluginBundle(input, 'm1').use(TDateInputIdsPlugin)

		const ids = () =>
			input.segments.flatMap((segment) =>
				segment.type === 'literal' ? [] : [[segment.type, segment.aria.id]],
			)

		expect(ids()).toEqual([
			['day', 'm1-day'],
			['month', 'm1-month'],
			['year', 'm1-year'],
		])

		// Части переставились, а их `id` остались с ними
		input.locale = 'en-US'

		expect(ids()).toEqual([
			['month', 'm1-month'],
			['day', 'm1-day'],
			['year', 'm1-year'],
		])
	})
})

/**
 * Поле формы: `id` подписи, подсказки и ошибки — в их наборы, `for` подписи —
 * на `id` контрола, а ссылки контрола на части — на те, что рисуются.
 */
describe('поле формы', () => {
	function field(props: ConstructorParameters<typeof TField>[0] = {}) {
		const owner = new TField(props)
		const bundle = new TPluginBundle(owner, 'm1').use(TFieldIdsPlugin)
		const ids = bundle.get(TFieldIdsPlugin)

		if (!ids) throw new Error('плагина связок нет')

		return { owner, ids }
	}

	it('id частей — от монтирования, for подписи — на id поля контрола', () => {
		const { owner, ids } = field()

		expect(owner.labelAria.toObject()).toEqual({ id: 'm1-label', for: 'm1-control' })
		expect(owner.helperAria.get('id')).toBe('m1-helper')
		expect(owner.errorAria.get('id')).toBe('m1-error')
		expect(ids.controlId).toBe('m1-control')
	})

	it('ссылка на подпись — пока у неё есть текст', () => {
		const { owner, ids } = field()

		expect(ids.links.labelledBy).toBeUndefined()

		owner.label = 'Почта'

		expect(ids.links.labelledBy).toBe('m1-label')
	})

	it('пояснение — видимая справка: подсказка, а при ошибке — ошибка', () => {
		const { owner, ids } = field({ helper: 'Подсказка', error: 'Ошибка' })

		expect(ids.links.describedBy).toBe('m1-helper')

		owner.invalid = true

		expect(ids.links.describedBy).toBe('m1-error')

		owner.error = ''

		expect(ids.links.describedBy).toBe('m1-helper')

		owner.helper = ''

		expect(ids.links.describedBy).toBeUndefined()
	})

	it('change:links — только когда ссылки сменились', () => {
		const { owner, ids } = field({ helper: 'Подсказка' })
		const seen: unknown[] = []

		ids.events.on('change:links', ({ newValue: links }) => seen.push(links))

		owner.helper = 'Другая подсказка'
		owner.label = 'Почта'
		owner.invalid = true

		expect(seen).toEqual([{ labelledBy: 'm1-label', describedBy: 'm1-helper' }])
	})

	it('for подписи — на id контрола; у группы for нет', () => {
		const { owner, ids } = field()

		ids.bindControl({ id: 'own', labelable: true })

		expect(owner.labelAria.get('for')).toBe('own')
		expect(ids.bound).toBe(true)

		ids.bindControl({ id: undefined, labelable: false })

		expect(owner.labelAria.has('for')).toBe(false)

		ids.unbindControl()

		expect(owner.labelAria.get('for')).toBe('m1-control')
		expect(ids.bound).toBe(false)
	})

	it('после destroy поле не слушает и подпись не пишет', () => {
		const { owner, ids } = field()
		const seen: unknown[] = []

		ids.events.on('change:links', ({ newValue: links }) => seen.push(links))
		ids.destroy()

		owner.label = 'Почта'
		ids.bindControl({ id: 'own', labelable: true })

		expect(seen).toEqual([])
		expect(owner.labelAria.get('for')).toBe('m1-control')
	})
})

/**
 * Счётчик Textarea: пока он включён, `id` — в его набор, а ссылка поля на
 * него — `aria-describedby` через `TAriaPlugin` поля, его третьим входом.
 */
describe('счётчик Textarea', () => {
	function textarea(props: ConstructorParameters<typeof TTextarea>[0] = {}) {
		const owner = new TTextarea(props)
		const bundle = new TPluginBundle(owner, 'm1').use(TAriaPlugin).use(TTextareaIdsPlugin)
		const aria = bundle.get(TAriaPlugin)
		const ids = bundle.get(TTextareaIdsPlugin)

		if (!aria || !ids) throw new Error('плагинов нет')

		return { owner, aria, ids }
	}

	it('id счётчика — от монтирования, поле ссылается на него', () => {
		const { owner } = textarea({ counter: true })

		expect(owner.counterAria.get('id')).toBe('m1-counter')
		expect(owner.aria.get('aria-describedby')).toBe('m1-counter')
	})

	it('без счётчика нет ни id, ни ссылки; включили — есть, выключили — сняты', () => {
		const { owner } = textarea()

		expect(owner.counterAria.has('id')).toBe(false)
		expect(owner.aria.has('aria-describedby')).toBe(false)

		owner.counter = true

		expect(owner.counterAria.get('id')).toBe('m1-counter')
		expect(owner.aria.get('aria-describedby')).toBe('m1-counter')

		owner.counter = false

		expect(owner.counterAria.has('id')).toBe(false)
		expect(owner.aria.has('aria-describedby')).toBe(false)
	})

	it('справка поля формы и своё пояснение остаются: счётчик — между ними', () => {
		const { owner, aria } = textarea({ counter: true })

		aria.describedBy = 'hint'
		aria.links = { describedBy: 'f-helper' }

		expect(owner.aria.get('aria-describedby')).toBe('f-helper m1-counter hint')

		owner.counter = false

		expect(owner.aria.get('aria-describedby')).toBe('f-helper hint')
	})

	it('ссылка на счётчик — пояснение, не имя', () => {
		const { owner, aria } = textarea({ counter: true })

		expect(aria.named).toBe(false)
		expect(owner.aria.has('aria-labelledby')).toBe(false)
	})

	it('живого региона у счётчика нет', () => {
		const { owner } = textarea({ counter: true })

		expect(owner.counterAria.has('aria-live')).toBe(false)
		expect(owner.counterAria.has('role')).toBe(false)
	})

	it('без TAriaPlugin в наборе — только id счётчика', () => {
		const owner = new TTextarea({ counter: true })

		new TPluginBundle(owner, 'm1').use(TTextareaIdsPlugin)

		expect(owner.counterAria.get('id')).toBe('m1-counter')
		expect(owner.aria.has('aria-describedby')).toBe(false)
	})

	it('после destroy смену счётчика не слушает', () => {
		const { owner, ids } = textarea({ counter: true })

		ids.destroy()
		owner.counter = false

		expect(owner.counterAria.get('id')).toBe('m1-counter')
		expect(owner.aria.get('aria-describedby')).toBe('m1-counter')
	})
})

describe('общий name радио', () => {
	function group(name?: string) {
		const owner = new TRadioGroup(name === undefined ? {} : { name })
		const facade = new TRadioGroupCollectionFacade({}, { owner })
		const bundle = new TPluginBundle(owner, 'm1')
			.use(TCollectionBundlesPlugin)
			.use(TRadioGroupNamePlugin)

		facade.items = [
			new TRadioGroupItem({ value: 'a' }),
			new TRadioGroupItem({ value: 'b' }),
		] as IRadioGroupItem[]
		bundle.get(TCollectionBundlesPlugin)?.bindEngine(facade.engine)

		const names = () => facade.items.map((item) => item.name)

		return { owner, facade, names }
	}

	it('безымянная группа — id монтирования: две такие группы не сольются', () => {
		expect(group().names()).toEqual(['m1-group', 'm1-group'])
	})

	it('своё имя группы — всем радио, и на смену', () => {
		const { owner, names } = group('delivery')

		expect(names()).toEqual(['delivery', 'delivery'])

		owner.name = 'pickup'

		expect(names()).toEqual(['pickup', 'pickup'])

		owner.name = ''

		expect(names()).toEqual(['m1-group', 'm1-group'])
	})

	it('радио, вставленное позже, получает то же имя', () => {
		const { facade, names } = group('city')

		facade.extensions.plain.push(new TRadioGroupItem({ value: 'c' }))

		expect(names()).toEqual(['city', 'city', 'city'])
	})
})
/**
 * `id`, заданный приложением, держит `TIdPlugin` набора — проп `id`, — и он
 * главнее `id` от монтирования, как у поля: плагин связок пишет его в набор
 * строки и в ссылки на неё, на смену переписывает обе стороны, а снятый
 * возвращает формулу. `id` второй стороны — панели — у секции и пунктов меню
 * приложение не задаёт, он остаётся формулой; у панели таба — задаёт, и ссылку
 * таба на неё ведёт тот же плагин таба.
 */
describe('id приложения у элемента', () => {
	/** Набор с `TIdPlugin` и плагином связок — как у дескриптора: `TIdPlugin` раньше. */
	function mount(instance: object, linker: IPluginConstructor): TIdPlugin {
		const idPlugin = new TPluginBundle(instance, 'm1').use(TIdPlugin).use(linker).get(TIdPlugin)

		if (!idPlugin) throw new Error('TIdPlugin не встал')

		return idPlugin
	}

	it.each([
		['Select.Item', () => new TSelectItem({ value: 'a' })],
		['ListBox.Item', () => new TListBoxItem({ value: 'a' })],
	] as const)(
		'%s: id — на строке, сменили — следом, сняли — от монтирования',
		(_name, create) => {
			const item = create()
			const idPlugin = mount(item, TOptionIdsPlugin)

			expect(item.aria.get('id')).toBe('m1-option')

			idPlugin.id = 'row-a'

			expect(item.aria.get('id')).toBe('row-a')

			idPlugin.id = 'row-b'

			expect(item.aria.get('id')).toBe('row-b')

			idPlugin.id = undefined

			expect(item.aria.get('id')).toBe('m1-option')
		},
	)

	it('Tabs.Item: id — у таба, а id панели без её TIdPlugin — от монтирования', () => {
		const tab = new TTabsItem({ value: 'a' })
		const idPlugin = mount(tab, TTabsItemIdsPlugin)

		idPlugin.id = 'tab-a'

		expect(tab.aria.get('id')).toBe('tab-a')
		expect(tab.aria.get('aria-controls')).toBe('m1-panel')

		idPlugin.id = undefined

		expect(tab.aria.get('id')).toBe('m1-tab')
		expect(tab.aria.get('aria-controls')).toBe('m1-panel')
	})

	/**
	 * `id` второй стороны связки таба — панели — задаёт приложение её
	 * `TIdPlugin`, а `aria-controls` пишет только плагин таба: связка панели
	 * отдаёт ему `TIdPlugin` панели (`bindPanel`), и ссылка ведёт на её `id` и
	 * идёт за его сменой. Отвязали (`unbindPanel`) — снова формула от
	 * монтирования таба.
	 */
	describe('Tabs.Item: id приложения у панели', () => {
		/** Плагин связок таба `a` и `TIdPlugin` панели — у каждого свой набор. */
		function mountPair() {
			const tab = new TTabsItem({ value: 'a' })
			const bundle = new TPluginBundle(tab, 'm1').use(TIdPlugin).use(TTabsItemIdsPlugin)
			const ids = bundle.get(TTabsItemIdsPlugin)
			const panel = new TPluginBundle({}, 'm2').use(TIdPlugin).get(TIdPlugin)

			if (!ids || !panel) throw new Error('плагины не встали')

			return { tab, bundle, ids, panel }
		}

		it('aria-controls — на id панели, пока она привязана, и за его сменой', () => {
			const { tab, ids, panel } = mountPair()

			panel.id = 'general'
			ids.bindPanel(panel)

			expect(tab.aria.get('aria-controls')).toBe('general')

			panel.id = 'common'

			expect(tab.aria.get('aria-controls')).toBe('common')

			// Сняли `id` у панели — ссылка на формулу, задали снова — на него
			panel.id = undefined

			expect(tab.aria.get('aria-controls')).toBe('m1-panel')

			panel.id = 'general'

			expect(tab.aria.get('aria-controls')).toBe('general')

			ids.unbindPanel(panel)

			expect(tab.aria.get('aria-controls')).toBe('m1-panel')

			panel.id = 'other'

			expect(tab.aria.get('aria-controls')).toBe('m1-panel')
		})

		it('id таба от id панели не зависит', () => {
			const { tab, ids, panel } = mountPair()

			panel.id = 'general'
			ids.bindPanel(panel)

			expect(tab.aria.get('id')).toBe('m1-tab')
		})

		/**
		 * Новое монтирование панели бывает принято раньше, чем снято прежнее:
		 * отвязка прежней не снимает ссылку на новую.
		 */
		it('привязанная следом панель заменяет прежнюю, отвязка прежней её не трогает', () => {
			const { tab, ids, panel } = mountPair()
			const next = new TPluginBundle({}, 'm3').use(TIdPlugin).get(TIdPlugin)

			if (!next) throw new Error('TIdPlugin не встал')

			panel.id = 'old'
			next.id = 'new'
			ids.bindPanel(panel)
			ids.bindPanel(next)

			expect(tab.aria.get('aria-controls')).toBe('new')

			ids.unbindPanel(panel)
			panel.id = 'older'

			expect(tab.aria.get('aria-controls')).toBe('new')
		})

		it('после destroy за панелью не следит и набор таба не пишет', () => {
			const { tab, bundle, ids, panel } = mountPair()

			panel.id = 'general'
			ids.bindPanel(panel)
			bundle.destroy()
			panel.id = 'common'
			ids.unbindPanel(panel)

			expect(tab.aria.get('aria-controls')).toBe('general')
		})
	})

	it('Accordion.Item: id — у заголовка и в ссылке панели на него', () => {
		const section = new TAccordionItem({ value: 'a' })
		const idPlugin = mount(section, TAccordionItemIdsPlugin)

		idPlugin.id = 'faq-a'

		expect(section.aria.get('id')).toBe('faq-a')
		expect(section.aria.get('aria-controls')).toBe('m1-content')
		expect(section.contentAria.toObject()).toEqual({
			role: 'region',
			id: 'm1-content',
			'aria-labelledby': 'faq-a',
		})

		idPlugin.id = undefined

		expect(section.aria.get('id')).toBe('m1-header')
		expect(section.contentAria.get('aria-labelledby')).toBe('m1-header')
		expect(section.contentAria.get('id')).toBe('m1-content')
	})

	it.each([
		['Menu.Submenu', () => new TMenuSubmenu({ text: 'Поделиться' })],
		['Menu.PopoverItem', () => new TMenuPopoverItem({ text: 'Срок' })],
	] as const)('%s: id — у строки и в ссылке панели на неё', (_name, create) => {
		const item = create()
		const idPlugin = mount(item, TMenuPopupIdsPlugin)

		idPlugin.id = 'share'

		expect(item.aria.get('id')).toBe('share')
		expect(item.aria.get('aria-controls')).toBe('m1-panel')
		expect(item.panelAria.get('id')).toBe('m1-panel')
		expect(item.panelAria.get('aria-labelledby')).toBe('share')

		idPlugin.id = undefined

		expect(item.aria.get('id')).toBe('m1-row')
		expect(item.panelAria.get('aria-labelledby')).toBe('m1-row')
	})

	/**
	 * Плагин связок без `TIdPlugin` в наборе работает от монтирования: так его
	 * ставит компонент, которому `id` приложения не нужен.
	 */
	it('без TIdPlugin в наборе — id от монтирования', () => {
		const item = new TListBoxItem({ value: 'a' })

		new TPluginBundle(item, 'm1').use(TOptionIdsPlugin)

		expect(item.aria.get('id')).toBe('m1-option')
	})
})
