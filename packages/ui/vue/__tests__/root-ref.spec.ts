/**
 * `ref` потребителя во Vue — экземпляр, и путь к корню у него — `$el`.
 *
 * Корень — узел, на который ложатся класс и атрибуты потребителя: у поля
 * (Input, NumberInput, CheckBox, Switch, RadioGroup.Item, Textarea) — корень, а
 * не поле, у элемента коллекции — корень, а не строка, у таблицы — окно,
 * внешний узел. У
 * всех, кроме таблицы, это тот же узел, что привязан к `TElementPlugin`: с ним
 * приходит `element:ready`.
 *
 * `$el` даёт сам Vue — первый узел шаблона. У Frame, Dialog и Drawer первый
 * узел шаблона — `<teleport>`, и Vue отдавал его якорь, узел-комментарий, а
 * панель была в другом месте; у Toasts первый узел — приложение в слоте, а
 * регион телепортирован. Корень им открывает `exposeRoot`, и он читается
 * через ссылку адаптера: смена тега отдаёт новый корень, не отрисован —
 * `null`. Телепорт выключен (`contained`) — корень тот же.
 *
 * Экземпляр закрыт: свойства Vue (`$el`, `$props`…) он отдаёт, а привязки
 * шаблона — `ctrl`, состояние, выходы плагинов — нет, ни в рантайме, ни в типе.
 * Рантайм закрывает опция `expose` — своя у каждого компонента (`useExpose`),
 * тип — `TClosedComponent` в точке экспорта.
 */

import { describe, it, expect, afterEach, expectTypeOf } from 'vitest'
import { mount } from '@vue/test-utils'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import {
	defineComponent,
	h,
	nextTick,
	shallowRef,
	type ComponentPublicInstance,
	type ShallowRef,
	type VNode,
	type VNodeRef,
} from 'vue'
import { TDialog, TDrawer, TFrame, TToasts, type TTableColumnSource } from '@soxa-ui/core'
import { ruRU } from '@soxa-ui/plugins'
import * as SoxaVue from '@soxa-ui/vue'
import {
	Accordion,
	AccordionItem,
	Button,
	CheckBox,
	ComponentView,
	Dialog,
	Drawer,
	Field,
	Frame,
	Icon,
	Input,
	Label,
	ListBox,
	ListBoxItem,
	LocaleProvider,
	Menu,
	MenuCheckboxItem,
	MenuGroup,
	MenuItem,
	MenuRadioGroup,
	MenuRadioItem,
	MenuSeparator,
	MenuSubmenu,
	MenuPopoverItem,
	NumberInput,
	Pagination,
	Popover,
	ProgressLinear,
	ProgressSpinner,
	RadioGroup,
	RadioGroupItem,
	Rating,
	Scroller,
	Select,
	SelectItem,
	Skeleton,
	Slider,
	Switch,
	Table,
	Tabs,
	TabsContent,
	TabsItem,
	Tags,
	TagsItem,
	Textarea,
	Toasts,
	Tooltip,
	Tree,
} from '@soxa-ui/vue'
import ButtonTemplate from '../src/components/button/Button.vue'

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

let wrapper: { unmount(): void } | null = null

afterEach(() => {
	wrapper?.unmount()
	wrapper = null
	document.body.innerHTML = ''
})

/** Рисует разметку в документе: телепорт уходит в `body`. */
function render(draw: () => VNode): void {
	wrapper = mount(defineComponent({ render: draw }), { attachTo: document.body })
}

/** Узел по селектору; нет его — тест падает здесь, а не на сравнении. */
function find(selector: string, scope: ParentNode = document): Element {
	const node = scope.querySelector(selector)

	if (!node) throw new Error(`${selector}: узла нет`)

	return node
}

/** Экземпляр, который получил `ref` потребителя. */
function instanceOf(host: ShallowRef<ComponentPublicInstance | null>): ComponentPublicInstance {
	if (!host.value) throw new Error('ref потребителя пуст')

	return host.value
}

/** Пропсы, которые таблица отдаёт каждому компоненту: `ref` и событие привязки корня. */
type TProbeProps = {
	ref?: VNodeRef
	'onElement:ready'?: (node: Element) => void
}

const COLUMNS: TTableColumnSource[] = [{ field: 'name', text: 'Имя', rowHeader: true }]

/** The menu's items are mounted from its first opening on: parts are drawn in an open menu. */
const OPENED = { open: true }

/**
 * Компонент со своим корнем, как его рисовать, узел, который получает `ref`
 * потребителя, и узел, с которым приходит `element:ready`. Это один узел — у
 * всех, кроме таблицы: её `$el` — окно, внешний узел, куда ложатся атрибуты
 * потребителя, а к `TElementPlugin` привязан корень `table`. Элемент коллекции
 * рисуется в своём владельце: без него у элемента нет коллекции.
 */
const ROOTS: ReadonlyArray<readonly [string, (props: TProbeProps) => VNode, string, string]> = [
	['Button', (props) => h(Button, props), '.so-button', '.so-button'],
	[
		'ComponentView',
		(props) => h(ComponentView, props),
		'.so-component-view',
		'.so-component-view',
	],
	['Frame', (props) => h(Frame, props), '.so-frame', '.so-frame'],
	[
		'Frame contained',
		(props) => h(Frame, { contained: true, ...props }),
		'.so-frame',
		'.so-frame',
	],
	['Dialog', (props) => h(Dialog, props), '.so-dialog', '.so-dialog'],
	['Drawer', (props) => h(Drawer, props), '.so-drawer', '.so-drawer'],
	[
		'Drawer contained',
		(props) => h(Drawer, { contained: true, ...props }),
		'.so-drawer',
		'.so-drawer',
	],
	['Popover', (props) => h(Popover, props), '.so-popover', '.so-popover'],
	['Tooltip', (props) => h(Tooltip, props), '.so-tooltip', '.so-tooltip'],
	['Tree', (props) => h(Tree, props), '.so-tree', '.so-tree'],
	// Первый узел шаблона — приложение в слоте, корень — регион в телепорте
	['Toasts', (props) => h(Toasts, props), '.so-toasts', '.so-toasts'],
	['Icon', (props) => h(Icon, { tag: 'i', ...props }), '.so-icon', '.so-icon'],
	['Label', (props) => h(Label, props), '.so-label', '.so-label'],
	['Field', (props) => h(Field, props), '.so-field', '.so-field'],
	[
		'ProgressLinear',
		(props) => h(ProgressLinear, props),
		'.so-progress-linear',
		'.so-progress-linear',
	],
	[
		'ProgressSpinner',
		(props) => h(ProgressSpinner, props),
		'.so-progress-spinner',
		'.so-progress-spinner',
	],
	['Skeleton', (props) => h(Skeleton, props), '.so-skeleton', '.so-skeleton'],
	['Slider', (props) => h(Slider, props), '.so-slider', '.so-slider'],
	['Rating', (props) => h(Rating, props), '.so-rating', '.so-rating'],
	['Scroller', (props) => h(Scroller, props), '.so-scroller', '.so-scroller'],
	['Pagination', (props) => h(Pagination, props), '.so-pagination', '.so-pagination'],
	['Input', (props) => h(Input, props), '.so-input', '.so-input'],
	['NumberInput', (props) => h(NumberInput, props), '.so-number-input', '.so-number-input'],
	['Textarea', (props) => h(Textarea, props), '.so-textarea', '.so-textarea'],
	['CheckBox', (props) => h(CheckBox, props), '.so-check-box', '.so-check-box'],
	['Switch', (props) => h(Switch, props), '.so-switch', '.so-switch'],
	['Select', (props) => h(Select, props), '.so-select', '.so-select'],
	[
		'Select.Item',
		(props) => h(Select, null, () => h(SelectItem, { value: 'a', text: 'A', ...props })),
		'.so-select-item',
		'.so-select-item',
	],
	['Tags', (props) => h(Tags, props), '.so-tags', '.so-tags'],
	[
		'Tags.Item',
		(props) => h(Tags, null, () => h(TagsItem, { value: 'a', text: 'A', ...props })),
		'.so-tags-item',
		'.so-tags-item',
	],
	['Tabs', (props) => h(Tabs, props), '.so-tabs', '.so-tabs'],
	[
		'Tabs.Item',
		(props) =>
			h(Tabs, null, () => h(TabsItem, { value: 'a', text: 'A', active: true, ...props })),
		'.so-tabs-item',
		'.so-tabs-item',
	],
	[
		'Tabs.Content',
		(props) =>
			h(Tabs, null, {
				default: () => h(TabsItem, { value: 'a', text: 'A', active: true }),
				content: () => h(TabsContent, { value: 'a', ...props }),
			}),
		'.so-tabs-content',
		'.so-tabs-content',
	],
	['Accordion', (props) => h(Accordion, props), '.so-accordion', '.so-accordion'],
	[
		'Accordion.Item',
		(props) => h(Accordion, null, () => h(AccordionItem, { value: 'a', text: 'A', ...props })),
		'.so-accordion-item',
		'.so-accordion-item',
	],
	['RadioGroup', (props) => h(RadioGroup, props), '.so-radio-group', '.so-radio-group'],
	[
		'RadioGroup.Item',
		(props) => h(RadioGroup, null, () => h(RadioGroupItem, { value: 'a', ...props })),
		'.so-radio-group-item',
		'.so-radio-group-item',
	],
	['ListBox', (props) => h(ListBox, props), '.so-list-box', '.so-list-box'],
	[
		'ListBox.Item',
		(props) => h(ListBox, null, () => h(ListBoxItem, { value: 'a', text: 'A', ...props })),
		'.so-list-box-item',
		'.so-list-box-item',
	],
	[
		'Table',
		(props) =>
			h(Table, { columns: COLUMNS, items: [{ data: { id: 1, name: 'Анна' } }], ...props }),
		'.so-table__viewport',
		'table.so-table',
	],
	// Корень меню — обёртка триггера, а не его телепортированная панель
	['Menu', (props) => h(Menu, props), '.so-menu', '.so-menu'],
	[
		'Menu.Item',
		(props) => h(Menu, OPENED, () => h(MenuItem, { value: 'a', text: 'A', ...props })),
		'.so-menu-item',
		'.so-menu-item',
	],
	[
		'Menu.CheckboxItem',
		(props) => h(Menu, OPENED, () => h(MenuCheckboxItem, { value: 'a', text: 'A', ...props })),
		'.so-menu-item',
		'.so-menu-item',
	],
	[
		'Menu.RadioItem',
		(props) => h(Menu, OPENED, () => h(MenuRadioItem, { value: 'a', text: 'A', ...props })),
		'.so-menu-item',
		'.so-menu-item',
	],
	// Корень пункта с подменю — пункт, а не его телепортированная панель
	[
		'Menu.Submenu',
		(props) =>
			h(Menu, OPENED, () => h(MenuSubmenu, { value: 'share', text: 'Поделиться', ...props })),
		'.so-menu-item',
		'.so-menu-item',
	],
	// Корень пункта с панелью — так же пункт, а не его телепортированная панель
	[
		'Menu.PopoverItem',
		(props) =>
			h(Menu, OPENED, () => h(MenuPopoverItem, { value: 'due', text: 'Срок', ...props })),
		'.so-menu-item',
		'.so-menu-item',
	],
	[
		'Menu.Group',
		(props) => h(Menu, OPENED, () => h(MenuGroup, { label: 'Вид', ...props })),
		'.so-menu-group',
		'.so-menu-group',
	],
	[
		'Menu.RadioGroup',
		(props) => h(Menu, OPENED, () => h(MenuRadioGroup, { label: 'Сортировка', ...props })),
		'.so-menu-group',
		'.so-menu-group',
	],
	[
		'Menu.Separator',
		(props) => h(Menu, OPENED, () => h(MenuSeparator, props)),
		'.so-menu-separator',
		'.so-menu-separator',
	],
]

/** У всех, кроме таблицы, `$el` — узел, привязанный к `TElementPlugin`. */
const BOUND_ROOTS = ROOTS.filter(([, , root, bound]) => root === bound)

/** Поле каждого компонента-поля: `$el` — корень, а не оно. */
const FIELDS: Readonly<Record<string, string>> = {
	Input: 'input',
	NumberInput: 'input',
	CheckBox: 'input',
	Switch: 'input',
	'RadioGroup.Item': 'input',
	Textarea: 'textarea',
}

const FIELD_ROOTS = ROOTS.filter(([name]) => name in FIELDS)

/** Строка элемента коллекции — вложенный узел, который `$el` не отдаёт. */
const ITEM_ROWS: Readonly<Record<string, string>> = {
	'Tabs.Item': '[role="tab"]',
	'Accordion.Item': '.so-accordion-item__header',
	'ListBox.Item': '.so-button',
	'Select.Item': '.so-button',
	'Tags.Item': '.so-button',
	'Menu.Item': '.so-button',
	'Menu.CheckboxItem': '.so-button',
	'Menu.RadioItem': '.so-button',
	'Menu.Submenu': '.so-button',
	'Menu.PopoverItem': '.so-button',
}

const ITEM_ROOTS = ROOTS.filter(([name]) => name in ITEM_ROWS)

describe('ref потребителя: $el — корень компонента', () => {
	it.each(ROOTS)('%s: $el — корень', (_name, draw, root) => {
		const host = shallowRef<ComponentPublicInstance | null>(null)

		render(() => draw({ ref: host }))

		expect(instanceOf(host).$el).toBe(find(root))
	})

	it.each(ROOTS)(
		'%s: element:ready приходит с привязанным корнем',
		async (_name, draw, _root, bound) => {
			const ready: Element[] = []

			render(() => draw({ 'onElement:ready': (node) => ready.push(node) }))
			await nextFrame()

			expect(ready.at(-1)).toBe(find(bound))
		},
	)

	it.each(BOUND_ROOTS)('%s: $el — узел TElementPlugin', async (_name, draw) => {
		const host = shallowRef<ComponentPublicInstance | null>(null)
		const ready: Element[] = []

		render(() => draw({ ref: host, 'onElement:ready': (node) => ready.push(node) }))
		await nextFrame()

		expect(ready).toHaveLength(1)
		expect(instanceOf(host).$el).toBe(ready[0])
	})

	it.each(FIELD_ROOTS)('%s: $el — корень, а не поле', (name, draw, root) => {
		const host = shallowRef<ComponentPublicInstance | null>(null)

		render(() => draw({ ref: host }))

		const node = find(root)

		expect(instanceOf(host).$el).toBe(node)
		expect(instanceOf(host).$el).not.toBe(find(FIELDS[name], node))
	})

	it.each(ITEM_ROOTS)('%s: $el — корень, а не строка', (name, draw, root) => {
		const host = shallowRef<ComponentPublicInstance | null>(null)

		render(() => draw({ ref: host }))

		const node = find(root)

		expect(instanceOf(host).$el).toBe(node)
		expect(instanceOf(host).$el).not.toBe(find(ITEM_ROWS[name], node))
	})
})

/** Экземпляр ядра компонента с телепортом и его разметка с этим `ctrl`. */
type TTeleported = {
	/** Им тест снимает корень и меняет его тег */
	readonly ctrl: { rendered: boolean; tag: string | object }
	readonly draw: (props: TProbeProps) => VNode
}

/** Компонент, у которого корень шаблона — `<teleport>`, и класс его панели. */
const TELEPORTED: ReadonlyArray<readonly [string, () => TTeleported, string]> = [
	[
		'Frame',
		() => {
			const ctrl = new TFrame()

			return { ctrl, draw: (props) => h(Frame, { ctrl, ...props }) }
		},
		'.so-frame',
	],
	[
		'Frame contained',
		() => {
			const ctrl = new TFrame()

			return { ctrl, draw: (props) => h(Frame, { ctrl, contained: true, ...props }) }
		},
		'.so-frame',
	],
	[
		'Dialog',
		() => {
			const ctrl = new TDialog()

			return { ctrl, draw: (props) => h(Dialog, { ctrl, ...props }) }
		},
		'.so-dialog',
	],
	[
		'Drawer',
		() => {
			const ctrl = new TDrawer()

			return { ctrl, draw: (props) => h(Drawer, { ctrl, ...props }) }
		},
		'.so-drawer',
	],
	[
		'Drawer contained',
		() => {
			const ctrl = new TDrawer()

			return { ctrl, draw: (props) => h(Drawer, { ctrl, contained: true, ...props }) }
		},
		'.so-drawer',
	],
	[
		'Toasts',
		() => {
			// Регион по умолчанию — `section`: смене тега нужен другой стартовый
			const ctrl = new TToasts({ tag: 'div' })

			return { ctrl, draw: (props) => h(Toasts, { ctrl, ...props }) }
		},
		'.so-toasts',
	],
]

describe('ref потребителя: корень компонента с телепортом читается через ссылку адаптера', () => {
	it.each(TELEPORTED)(
		'%s: не отрисован — null, отрисован снова — новый корень',
		async (_name, create, panel) => {
			const { ctrl, draw } = create()
			const host = shallowRef<ComponentPublicInstance | null>(null)

			render(() => draw({ ref: host }))

			const first = instanceOf(host).$el

			expect(first).toBe(find(panel))

			ctrl.rendered = false
			await nextTick()

			expect(document.querySelector(panel)).toBeNull()
			expect(instanceOf(host).$el).toBeNull()

			ctrl.rendered = true
			await nextTick()

			expect(instanceOf(host).$el).toBe(find(panel))
			expect(instanceOf(host).$el).not.toBe(first)
		},
	)

	it.each(TELEPORTED)('%s: смена tag — новый корень', async (_name, create, panel) => {
		const { ctrl, draw } = create()
		const host = shallowRef<ComponentPublicInstance | null>(null)

		render(() => draw({ ref: host }))

		const first = instanceOf(host).$el

		ctrl.tag = 'section'
		await nextTick()

		const root = find(panel)

		expect(root.localName).toBe('section')
		expect(root).not.toBe(first)
		expect(instanceOf(host).$el).toBe(root)
	})
})

/** Шаблоны компонентов — у каждого своя опция `expose`. */
const TEMPLATES = import.meta.glob('../src/components/**/*.vue', {
	eager: true,
	import: 'default',
})

/** Сколько шаблонов в папке компонентов — сверка, что glob нашёл все. */
const TEMPLATE_COUNT = readdirSync(resolve(import.meta.dirname, '../src/components'), {
	recursive: true,
	encoding: 'utf8',
}).filter((file) => file.endsWith('.vue')).length

describe('экземпляр закрыт: свойства Vue — да, привязки шаблона — нет', () => {
	it('glob нашёл все шаблоны компонентов', () => {
		expect(Object.keys(TEMPLATES)).toHaveLength(TEMPLATE_COUNT)
	})

	/**
	 * Своя у каждого: из `extends` Vue опцию `expose` не берёт. Пустой список —
	 * открыто только то, что компонент открыл сам (`exposeRoot`).
	 */
	it.each(Object.entries(TEMPLATES))(
		'%s: своя опция expose — пустой список',
		(_file, component) => {
			expect(component instanceof Object && Object.hasOwn(component, 'expose')).toBe(true)
			expect(component).toHaveProperty('expose', [])
		},
	)

	it('LocaleProvider: своя опция expose — пустой список', () => {
		expect(Object.hasOwn(LocaleProvider, 'expose')).toBe(true)
		expect(LocaleProvider).toHaveProperty('expose', [])
	})

	it.each(ROOTS)('%s: ref отдаёт $el, но не ctrl', (_name, draw) => {
		const host = shallowRef<ComponentPublicInstance | null>(null)

		render(() => draw({ ref: host }))

		expect('$el' in instanceOf(host)).toBe(true)
		expect('$props' in instanceOf(host)).toBe(true)
		expect('ctrl' in instanceOf(host)).toBe(false)
	})

	/** У провайдера нет и корня: он рисует только содержимое. Закрыт он так же. */
	it('LocaleProvider: ref отдаёт $props, но не locale', () => {
		const host = shallowRef<ComponentPublicInstance | null>(null)

		render(() => h(LocaleProvider, { ref: host, locale: ruRU }))

		expect(instanceOf(host).$props).toHaveProperty('locale', ruRU)
		expect('locale' in instanceOf(host)).toBe(false)
	})
})

/** Экспорты пакета-значения: компоненты, функции и константы адаптера. */
type TPackage = typeof SoxaVue

/** Экземпляры компонентов пакета: у экспорта есть конструктор, у экземпляра — `$props`. */
type TPackageInstances = {
	[K in keyof TPackage]: TPackage[K] extends new (...args: any[]) => infer I
		? I extends { $props: unknown }
			? I
			: never
		: never
}[keyof TPackage]

/** Ключи экземпляра сверх свойств Vue — привязки шаблона, если экземпляр открыт. */
type TOpenKeys<TInstance> = TInstance extends unknown
	? Exclude<keyof TInstance, keyof ComponentPublicInstance>
	: never

/** Типы проверяет шаг CI «Типы — Vue»: в рантайме `expectTypeOf` ничего не делает. */
describe('экземпляр закрыт в типе', () => {
	it('привязка шаблона через тип экземпляра — ошибка, $el — есть', () => {
		// @ts-expect-error — `ctrl` — привязка шаблона, у экземпляра из `ref` её нет
		expectTypeOf<InstanceType<typeof Button>['ctrl']>()
		// @ts-expect-error — проп тоже не свойство экземпляра: он в `$props`
		expectTypeOf<InstanceType<typeof Button>['text']>()

		expectTypeOf<InstanceType<typeof Button>['$props']['text']>().toEqualTypeOf<
			string | undefined
		>()
		expectTypeOf<InstanceType<typeof Dialog>>().toHaveProperty('$el')
	})

	it('у каждого компонента пакета — только свойства Vue', () => {
		// Компоненты в выборке есть: пустая прошла бы сверку ниже сама собой
		expectTypeOf<InstanceType<typeof Button>>().toExtend<TPackageInstances>()
		expectTypeOf<InstanceType<typeof LocaleProvider>>().toExtend<TPackageInstances>()

		expectTypeOf<TOpenKeys<TPackageInstances>>().toEqualTypeOf<never>()
	})

	/** Тип шаблона — открытый: по нему vue-tsc проверяет разметку компонента. */
	it('проверка срабатывает: у типа шаблона привязки есть', () => {
		expectTypeOf<TOpenKeys<InstanceType<typeof ButtonTemplate>>>().not.toEqualTypeOf<never>()
		expectTypeOf<InstanceType<typeof ButtonTemplate>>().toHaveProperty('ctrl')
	})
})
