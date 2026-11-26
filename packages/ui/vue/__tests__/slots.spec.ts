/**
 * Слоты: соответствие контракту и поведение.
 *
 * Contract conformance — главная цель всей затеи: слоты объявлены один раз в
 * дескрипторе, и все адаптеры обязаны реализовать ровно их. Здесь проверяется
 * Vue; остальные адаптеры проверяют себя в своих пакетах.
 *
 * Разметка каждого компонента сверяется с дескриптором в обе стороны. Её слот
 * объявлен в дескрипторе, и ключи scope те же: необъявленный слот жил бы только
 * во Vue — React, Solid и Svelte берут имена из дескриптора, и при переносе
 * компонента такой слот не попал бы в тип пропсов, а уехал бы в DOM атрибутом.
 * Так было у Input, CheckBox, Switch, Tabs.Item, Accordion.Item и DragAndDrop.
 * И обратно: каждый слот дескриптора разметка рисует. Слот без места тип
 * адаптеров принимает, а содержимое молча пропадает: так было у Icon, Input,
 * CheckBox, Switch и Slider, которым `default` доставался наследованием от
 * ComponentView. Поэтому слоты не наследуются — дескриптор объявляет ровно те,
 * что рисует его шаблон, и исключений у сверки нет.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { parse, type SFCDescriptor } from 'vue/compiler-sfc'
import { mount } from '@vue/test-utils'
import {
	AlertDescriptor,
	BreadcrumbsDescriptor,
	BreadcrumbsItemDescriptor,
	AccordionDescriptor,
	AccordionItemDescriptor,
	ButtonDescriptor,
	ToggleButtonDescriptor,
	ToggleGroupDescriptor,
	ToggleGroupItemDescriptor,
	ItemRowDescriptor,
	CalendarDescriptor,
	CalendarItemDescriptor,
	CheckBoxDescriptor,
	ComponentViewDescriptor,
	DateInputDescriptor,
	DatePickerDescriptor,
	DialogDescriptor,
	AlertDialogDescriptor,
	DragAndDropDescriptor,
	FieldDescriptor,
	FileUploadDescriptor,
	SplitterDescriptor,
	SplitterPanelDescriptor,
	SplitterHandleDescriptor,
	FrameDescriptor,
	IconDescriptor,
	InputDescriptor,
	DrawerDescriptor,
	BadgeDescriptor,
	AvatarDescriptor,
	AvatarGroupDescriptor,
	CodeBlockDescriptor,
	LabelDescriptor,
	ListBoxDescriptor,
	ListBoxGroupDescriptor,
	ListBoxItemDescriptor,
	MenuCheckboxItemDescriptor,
	MenuDescriptor,
	MenuGroupDescriptor,
	MenuItemDescriptor,
	MenuRadioGroupDescriptor,
	MenuRadioItemDescriptor,
	MenuSeparatorDescriptor,
	SelectSeparatorDescriptor,
	ListBoxSeparatorDescriptor,
	MenuSubmenuDescriptor,
	MenuPopoverItemDescriptor,
	NumberInputDescriptor,
	PaginationDescriptor,
	PaginationItemDescriptor,
	PopoverDescriptor,
	ProgressLinearDescriptor,
	ProgressSpinnerDescriptor,
	RadioGroupDescriptor,
	RadioGroupItemDescriptor,
	RatingDescriptor,
	ScrollerDescriptor,
	SelectDescriptor,
	SelectGroupDescriptor,
	SelectItemDescriptor,
	SeparatorDescriptor,
	SkeletonDescriptor,
	SliderDescriptor,
	SwitchDescriptor,
	TableColumnDescriptor,
	TableDescriptor,
	TableRowDescriptor,
	TabsContentDescriptor,
	TabsDescriptor,
	TabsItemDescriptor,
	TagsDescriptor,
	TagsItemDescriptor,
	TextareaDescriptor,
	ToastsDescriptor,
	ToastsItemDescriptor,
	TooltipDescriptor,
	VirtualDescriptor,
} from '@soxa-ui/setup'
import type { IComponentDescriptor } from '@soxa-ui/setup'
import { Button, ComponentView } from '@soxa-ui/vue'

const COMPONENTS = resolve(import.meta.dirname, '../src/components')

/**
 * Дескриптор каждого шаблона — слоты компонента объявляет он. У частей
 * коллекций это собственный дескриптор, а не коллекционный: фасад членства
 * слотов не объявляет. Шаблон без строки здесь роняет тест — иначе его слоты
 * прошли бы мимо контракта.
 */
const DESCRIPTORS: Readonly<Record<string, () => IComponentDescriptor>> = {
	'alert/Alert.vue': AlertDescriptor,
	'accordion/Accordion.vue': AccordionDescriptor,
	'accordion/item/Item.vue': AccordionItemDescriptor,
	'breadcrumbs/Breadcrumbs.vue': BreadcrumbsDescriptor,
	'breadcrumbs/item/Item.vue': BreadcrumbsItemDescriptor,
	'breadcrumbs/overflow-item/Item.vue': MenuItemDescriptor,
	'button/Button.vue': ButtonDescriptor,
	'toggle-button/ToggleButton.vue': ToggleButtonDescriptor,
	'toggle-group/ToggleGroup.vue': ToggleGroupDescriptor,
	'toggle-group/item/Item.vue': ToggleGroupItemDescriptor,
	'item-row/ItemRow.vue': ItemRowDescriptor,
	'calendar/Calendar.vue': CalendarDescriptor,
	'calendar/item/Item.vue': CalendarItemDescriptor,
	'check-box/CheckBox.vue': CheckBoxDescriptor,
	'component-view/ComponentView.vue': ComponentViewDescriptor,
	'date-input/DateInput.vue': DateInputDescriptor,
	'date-picker/DatePicker.vue': DatePickerDescriptor,
	'dialog/Dialog.vue': DialogDescriptor,
	'alert-dialog/AlertDialog.vue': AlertDialogDescriptor,
	'drag-and-drop/DragAndDrop.vue': DragAndDropDescriptor,
	'drawer/Drawer.vue': DrawerDescriptor,
	'field/Field.vue': FieldDescriptor,
	'file-upload/FileUpload.vue': FileUploadDescriptor,
	'splitter/Splitter.vue': SplitterDescriptor,
	'splitter/panel/SplitterPanel.vue': SplitterPanelDescriptor,
	'splitter/handle/SplitterHandle.vue': SplitterHandleDescriptor,
	'frame/Frame.vue': FrameDescriptor,
	'icon/Icon.vue': IconDescriptor,
	'input/Input.vue': InputDescriptor,
	'badge/Badge.vue': BadgeDescriptor,
	'avatar/Avatar.vue': AvatarDescriptor,
	'avatar/group/AvatarGroup.vue': AvatarGroupDescriptor,
	'code-block/CodeBlock.vue': CodeBlockDescriptor,
	'label/Label.vue': LabelDescriptor,
	'list-box/ListBox.vue': ListBoxDescriptor,
	'list-box/group/Group.vue': ListBoxGroupDescriptor,
	'list-box/item/Item.vue': ListBoxItemDescriptor,
	'menu/Menu.vue': MenuDescriptor,
	'menu/checkbox-item/CheckboxItem.vue': MenuCheckboxItemDescriptor,
	'menu/group/Group.vue': MenuGroupDescriptor,
	'menu/item/Item.vue': MenuItemDescriptor,
	'menu/radio-group/RadioGroup.vue': MenuRadioGroupDescriptor,
	'menu/radio-item/RadioItem.vue': MenuRadioItemDescriptor,
	'menu/separator/Separator.vue': MenuSeparatorDescriptor,
	'select/separator/Separator.vue': SelectSeparatorDescriptor,
	'list-box/separator/Separator.vue': ListBoxSeparatorDescriptor,
	'menu/submenu/Submenu.vue': MenuSubmenuDescriptor,
	'menu/popover-item/PopoverItem.vue': MenuPopoverItemDescriptor,
	'number-input/NumberInput.vue': NumberInputDescriptor,
	'pagination/Pagination.vue': PaginationDescriptor,
	// Страница — внутренняя часть пагинации, но слот у неё свой
	'pagination/item/Item.vue': PaginationItemDescriptor,
	'popover/Popover.vue': PopoverDescriptor,
	'progress-linear/ProgressLinear.vue': ProgressLinearDescriptor,
	'progress-spinner/ProgressSpinner.vue': ProgressSpinnerDescriptor,
	'radio-group/RadioGroup.vue': RadioGroupDescriptor,
	'radio-group/item/Item.vue': RadioGroupItemDescriptor,
	'rating/Rating.vue': RatingDescriptor,
	'scroller/Scroller.vue': ScrollerDescriptor,
	'select/Select.vue': SelectDescriptor,
	'select/group/Group.vue': SelectGroupDescriptor,
	'select/item/Item.vue': SelectItemDescriptor,
	'separator/Separator.vue': SeparatorDescriptor,
	'skeleton/Skeleton.vue': SkeletonDescriptor,
	'slider/Slider.vue': SliderDescriptor,
	'switch/Switch.vue': SwitchDescriptor,
	'table/Table.vue': TableDescriptor,
	'table/column/Column.vue': TableColumnDescriptor,
	// Ячейки строки — её внутренняя часть без дескриптора: слот `cell` строки
	// рисуют они
	'table/row/Cells.vue': TableRowDescriptor,
	'table/row/Row.vue': TableRowDescriptor,
	'tabs/Tabs.vue': TabsDescriptor,
	'tabs/content/Content.vue': TabsContentDescriptor,
	'tabs/item/Item.vue': TabsItemDescriptor,
	'tags/Tags.vue': TagsDescriptor,
	'tags/item/Item.vue': TagsItemDescriptor,
	'textarea/Textarea.vue': TextareaDescriptor,
	'toasts/Toasts.vue': ToastsDescriptor,
	// Тост — внутренняя часть менеджера, но слоты у него свои
	'toasts/item/Item.vue': ToastsItemDescriptor,
	'tooltip/Tooltip.vue': TooltipDescriptor,
	'virtual/Virtual.vue': VirtualDescriptor,
}

/** Шаблоны компонентов — путь от `src/components`, через `/`. */
const templates = readdirSync(COMPONENTS, { recursive: true, encoding: 'utf8' })
	.filter((file) => file.endsWith('.vue'))
	.map((file) => file.split(sep).join('/'))
	.sort()

type TTemplateNode = NonNullable<NonNullable<SFCDescriptor['template']>['ast']>['children'][number]

type TElementNode = Extract<TTemplateNode, { tag: string }>

/** Место слота в разметке: имя и ключи scope — привязки `<slot>`, кроме имени. */
interface ISlotOutlet {
	name: string
	scope: string[]
}

/**
 * Имя и scope одного `<slot>`. Scope, состав которого не прочитать, — спред
 * `v-bind="…"` или вычисляемый ключ, — роняет тест, как и динамическое имя:
 * его резолвит только Vue (AGENTS.md, «Слоты элементов: статические имена со
 * scope»).
 */
function outletOf(file: string, element: TElementNode): ISlotOutlet {
	const outlet: ISlotOutlet = { name: 'default', scope: [] }

	for (const prop of element.props) {
		if (!('arg' in prop)) {
			if (prop.name === 'name' && prop.value) outlet.name = prop.value.content
			continue
		}

		// `v-if`, `v-else`, `v-show` — не данные слота
		if (prop.name !== 'bind') continue

		if (!prop.arg || !('isStatic' in prop.arg) || !prop.arg.isStatic) {
			throw new Error(`${file}: у <slot> привязка «${prop.loc.source}», scope не прочитать`)
		}

		if (prop.arg.content === 'name') throw new Error(`${file}: динамическое имя слота`)

		outlet.scope.push(prop.arg.content)
	}

	outlet.scope.sort()

	return outlet
}

/**
 * Слоты разметки `.vue` в порядке появления, по одному на каждый `<slot>`:
 * один слот бывает нарисован в нескольких местах. Разметку читает компилятор
 * Vue, а не регулярное выражение: привязка в атрибуте может содержать `>`.
 */
function outletsOf(source: string, file: string): ISlotOutlet[] {
	const { descriptor, errors } = parse(source, { filename: file })

	expect(errors).toEqual([])

	const ast = descriptor.template?.ast

	if (!ast) throw new Error(`${file}: нет <template>`)

	const outlets: ISlotOutlet[] = []
	const visit = (nodes: readonly TTemplateNode[]): void => {
		for (const node of nodes) {
			if (!('tag' in node)) continue
			if (node.tag === 'slot') outlets.push(outletOf(file, node))

			visit(node.children)
		}
	}

	visit(ast.children)

	return outlets
}

/** Слоты шаблона компонента — путь от `src/components`. */
function templateOutlets(file: string): ISlotOutlet[] {
	return outletsOf(readFileSync(join(COMPONENTS, file), 'utf8'), file)
}

/** Имена слотов, реально объявленные в разметке .vue-файла. */
function templateSlots(file: string): string[] {
	return [...new Set(templateOutlets(file).map((outlet) => outlet.name))].sort()
}

describe('разбор разметки', () => {
	it('имя — из атрибута name, scope — привязки; директивы и вложенность не мешают', () => {
		const source = `<template>
			<span v-if="count > 0"><slot name="leading" :text="text" :item="item" /></span>
			<slot v-else />
		</template>`

		expect(outletsOf(source, 'probe.vue')).toEqual([
			{ name: 'leading', scope: ['item', 'text'] },
			{ name: 'default', scope: [] },
		])
	})

	it('состав scope, которого не прочитать, — ошибка, а не пустой scope', () => {
		expect(() =>
			outletsOf('<template><slot v-bind="scope" /></template>', 'probe.vue'),
		).toThrow('scope не прочитать')
		expect(() =>
			outletsOf('<template><slot :[key]="value" /></template>', 'probe.vue'),
		).toThrow('scope не прочитать')
	})

	it('динамическое имя слота — ошибка', () => {
		expect(() => outletsOf('<template><slot :name="name" /></template>', 'probe.vue')).toThrow(
			'динамическое имя слота',
		)
	})
})

/** Объявленные слоты шаблона, имя → ключи scope по порядку; шаблон без строки в таблице роняет тест. */
function declaredSlots(file: string): Map<string, string[]> {
	const descriptor = DESCRIPTORS[file]

	if (!descriptor) throw new Error(`${file}: нет строки в таблице «шаблон → дескриптор»`)

	return new Map(
		descriptor().slots.map((slot) => [slot.name, Object.keys(slot.scope ?? {}).sort()]),
	)
}

describe('разметка рисует ровно слоты своего дескриптора', () => {
	it('у каждого шаблона компонента есть дескриптор, и лишних строк нет', () => {
		expect(Object.keys(DESCRIPTORS).sort()).toEqual(templates)
	})

	describe('место слота объявлено, и scope тот же', () => {
		it.each(templates)('%s', (file) => {
			const declared = declaredSlots(file)
			const outlets = templateOutlets(file)

			// Каждое место слота — с его именем: необъявленный слот даёт `undefined`
			expect(outlets.map(({ name }) => [name, declared.get(name)])).toEqual(
				outlets.map(({ name, scope }) => [name, scope]),
			)
		})
	})

	describe('объявленный слот разметка рисует', () => {
		it.each(templates)('%s', (file) => {
			// Слот без места тип адаптеров принимает, а содержимое пропадает молча
			expect([...declaredSlots(file).keys()].sort()).toEqual(templateSlots(file))
		})
	})
})

describe('поведение слотов Button', () => {
	it('leading ставится перед текстом, trailing — после', () => {
		const wrapper = mount(Button, {
			props: { text: 'Mid' },
			slots: { leading: '<i>L</i>', trailing: '<i>T</i>' },
		})

		expect(wrapper.element.textContent).toBe('LMidT')
	})

	it('содержимое default переопределяет text', () => {
		const wrapper = mount(Button, {
			props: { text: 'ignored' },
			slots: { default: '<b>Custom</b>' },
		})

		expect(wrapper.find('.so-button__text').text()).toBe('Custom')
	})

	it('слот default получает scope с text', () => {
		const wrapper = mount(Button, {
			props: { text: 'Scoped' },
			slots: { default: '<template #default="{ text }"><b>{{ text }}!</b></template>' },
		})

		expect(wrapper.find('.so-button__text').text()).toBe('Scoped!')
	})

	it('без слота показывается text из props', () => {
		const wrapper = mount(Button, { props: { text: 'Fallback' } })

		expect(wrapper.find('.so-button__text').text()).toBe('Fallback')
	})
})

describe('поведение слотов ComponentView', () => {
	it('содержимое попадает в корень', () => {
		const wrapper = mount(ComponentView, { slots: { default: '<b>Inner</b>' } })

		expect(wrapper.find('b').text()).toBe('Inner')
	})
})

describe('слот не ограничивает содержимое', () => {
	/**
	 * `scope` в объявлении слота — данные, которые компонент передаёт ВНУТРЬ
	 * (`v-slot="{ text }"`), а не тип содержимого. Положить можно что угодно:
	 * кнопка остаётся кнопкой, клик и семантика не меняются.
	 */
	it('в default можно положить целую таблицу', () => {
		const wrapper = mount(Button, {
			props: { text: 'ignored' },
			slots: {
				default: '<table><tbody><tr><td>ячейка</td></tr></tbody></table>',
			},
		})

		expect(wrapper.find('.so-button__text table td').text()).toBe('ячейка')
		// Компонент не перестал быть кнопкой
		expect(wrapper.element.tagName.toLowerCase()).toBe('button')
	})

	it('scope доступен и при произвольной разметке', () => {
		const wrapper = mount(Button, {
			props: { text: 'Заголовок' },
			slots: {
				default: '<template #default="{ text }"><ul><li>{{ text }}</li></ul></template>',
			},
		})

		expect(wrapper.find('.so-button__text li').text()).toBe('Заголовок')
	})

	it('в leading и trailing тоже произвольная разметка', () => {
		const wrapper = mount(Button, {
			props: { text: 'Mid' },
			slots: { leading: '<svg><circle /></svg>', trailing: '<div><p>блок</p></div>' },
		})

		expect(wrapper.find('svg circle').exists()).toBe(true)
		expect(wrapper.find('p').text()).toBe('блок')
	})
})
