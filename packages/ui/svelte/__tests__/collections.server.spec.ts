/**
 * Коллекции на сервере: компоненты собраны для сервера, рисует их `render` из
 * `svelte/server` — как сервер приложения.
 *
 * Элемент коллекции входит в неё при инициализации компонента, а она идёт и
 * на сервере. Поэтому сервер рисует полностью и список из данных, и элементы
 * разметки — вместе с тем, что пишет им коллекция: выбор, раскрытость,
 * отметку, общий `name` радио, остановки Tab. Кроме остановки у элемента выше
 * активного таба или выбранного тега: сервер пишет разметку по ходу
 * инициализации, в порядке документа, и такой элемент уже отдан с остановкой,
 * которую держал как первый, когда её забирает активный, — до гидратации
 * остановок две (`docs/agents/collections.md`, «Цена»). Панель таба находит
 * свой таб к своей инициализации, и панель активного таба тоже в разметке
 * сервера. У React элементы разметки входят в коллекцию при коммите, и сервер
 * рисует их без этого.
 *
 * `id` частей — связки «таб ↔ панель» и «заголовок ↔ панель» — и общий `name`
 * радио строят плагины связок от id монтирования, а он у Svelte — от
 * `$props.id()`: счётчик у каждого рендера свой. Два рендера одной разметки,
 * параллельные или нет, дают одни и те же `id`, и ни один не сдвигает другой.
 * Счётчик набора, общий для процесса, дал бы им разные.
 *
 * Гидратацию календаря — разметку и панель выбора сервера тем же узлом, `id`
 * от сервера — проверяет `hydration/dates.hydration.spec.ts`. Лишнюю
 * остановку Tab табов и тегов гидратация снимает —
 * `hydration/collections.hydration.spec.ts`.
 */

import { describe, it, expect } from 'vitest'
import { render } from 'svelte/server'
import type { TTableColumnSource } from '@soxa-ui/core'
import { ruRU } from '@soxa-ui/plugins'
import {
	Accordion,
	Calendar,
	ListBox,
	Menu,
	RadioGroup,
	Select,
	Table,
	Tags,
} from '@soxa-ui/svelte'
import AccordionHarness from './Accordion.test.svelte'
import DragAndDropHarness from './DragAndDrop.test.svelte'
import ListBoxHarness from './ListBox.test.svelte'
import MenuHarness, { area, trigger } from './Menu.test.svelte'
import RadioGroupHarness from './RadioGroup.test.svelte'
import SelectHarness from './Select.test.svelte'
import Surround from './Surround.test.svelte'
import TabsHarness from './Tabs.test.svelte'
import TagsHarness from './Tags.test.svelte'
import VirtualHarness from './Virtual.test.svelte'

/** Открывающий тег разметки: имя и атрибуты; атрибут без значения — пустая строка. */
type TTag = {
	readonly name: string
	readonly attributes: Readonly<Record<string, string>>
}

/**
 * Открывающие теги разметки сервера по порядку, без меток гидратации — в
 * комментариях Svelte пишет метки блоков и id монтирования (`<!--$s1-->`).
 */
function tagsOf(body: string): TTag[] {
	const tags = body.replace(/<!--[\s\S]*?-->/g, '').match(/<[a-z][^>]*>/g) ?? []

	return tags.map((tag) => {
		const name = /^<([a-z][\w-]*)/.exec(tag)?.[1] ?? ''
		const attributes: Record<string, string> = {}

		for (const [, attribute, value] of tag.matchAll(/\s([^\s="'>/]+)(?:="([^"]*)")?/g)) {
			attributes[attribute] = value ?? ''
		}

		return { name, attributes }
	})
}

/** Теги с атрибутом `attribute` — по порядку; с `value` — только с этим значением. */
function tagsWith(body: string, attribute: string, value?: string): TTag[] {
	return tagsOf(body).filter(
		(tag) =>
			attribute in tag.attributes &&
			(value === undefined || tag.attributes[attribute] === value),
	)
}

/** Значение атрибута у каждого тега. */
const attributeOf = (tags: readonly TTag[], attribute: string) =>
	tags.map((tag) => tag.attributes[attribute])

/** Теги с классом `name` — по порядку. */
const withClass = (body: string, name: string) =>
	tagsOf(body).filter((tag) => (tag.attributes.class ?? '').split(' ').includes(name))

/** Текст разметки без тегов и меток. */
const textOf = (body: string) => body.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, '')

describe('ListBox · серверный рендер', () => {
	it('список из items — полностью: выбранное — aria-selected', () => {
		const { body } = render(ListBox, {
			props: {
				items: [
					{ value: 'a', text: 'Первый' },
					{ value: 'b', text: 'Второй' },
					{ value: 'c', text: 'Третий' },
				],
				value: 'b',
			},
		})

		expect(attributeOf(tagsWith(body, 'aria-selected'), 'aria-selected')).toEqual([
			'false',
			'true',
			'false',
		])
	})

	it('элементы разметки — с выбором и остановками Tab от коллекции', () => {
		const { body } = render(ListBoxHarness, {
			props: {
				items: [
					{ value: 'a', text: 'A' },
					{ value: 'b', text: 'B', selected: true },
				],
			},
		})
		const rows = tagsWith(body, 'aria-selected')

		expect(attributeOf(rows, 'aria-selected')).toEqual(['false', 'true'])
		expect(attributeOf(rows, 'tabindex')).toEqual(['-1', '-1'])
		expect(attributeOf(withClass(body, 'so-list-box-item'), 'data-selected')).toEqual([
			'false',
			'true',
		])
	})
})

describe('Tags · серверный рендер', () => {
	const ITEMS = [
		{ value: 'a', text: 'A' },
		{ value: 'b', text: 'B' },
		{ value: 'c', text: 'C' },
	]

	it('теги из items — полностью: выбранные — aria-selected, остановка Tab — у первого из них', () => {
		const { body } = render(Tags, { props: { items: ITEMS, mode: 'multiple', value: ['b'] } })
		const rows = tagsWith(body, 'role', 'option')

		expect(tagsOf(body)[0]?.attributes.role).toBe('listbox')
		expect(attributeOf(rows, 'aria-selected')).toEqual(['false', 'true', 'false'])
		expect(attributeOf(rows, 'tabindex')).toEqual(['-1', '0', '-1'])
		expect(attributeOf(withClass(body, 'so-tags-item'), 'data-selected')).toEqual([
			'false',
			'true',
			'false',
		])
	})

	/**
	 * Остановку Tab коллекция пишет тегу, когда он входит, а сервер рисует
	 * теги по одному, в порядке документа. Тег выше выбранного вошёл первым и
	 * держал остановку как первый — с ней сервер его и нарисовал, — а
	 * выбранный забрал её, когда разметка тега выше была уже отдана. До
	 * гидратации остановок Tab две — цена серверной разметки
	 * (`docs/agents/collections.md`, «Цена»); гидратация лишнюю снимает
	 * (`hydration/collections.hydration.spec.ts`).
	 */
	it('теги разметки — выбор от коллекции, крестик назван; у тега выше выбранного вторая остановка Tab — цена сервера, см. «Цена»', () => {
		const { body } = render(TagsHarness, {
			props: {
				tags: { mode: 'single', closable: true },
				items: [
					{ value: 'a', text: 'A' },
					{ value: 'b', text: 'B', selected: true },
				],
			},
		})
		const rows = tagsWith(body, 'role', 'option')

		expect(attributeOf(rows, 'aria-selected')).toEqual(['false', 'true'])
		expect(attributeOf(rows, 'tabindex')).toEqual(['0', '0'])
		expect(attributeOf(withClass(body, 'so-tags-item__close'), 'aria-label')).toEqual([
			'Close A',
			'Close B',
		])
	})

	it('теги разметки, выбранный первым — остановка Tab одна, у него', () => {
		const { body } = render(TagsHarness, {
			props: {
				tags: { mode: 'single' },
				items: [
					{ value: 'a', text: 'A', selected: true },
					{ value: 'b', text: 'B' },
				],
			},
		})
		const rows = tagsWith(body, 'role', 'option')

		expect(attributeOf(rows, 'aria-selected')).toEqual(['true', 'false'])
		expect(attributeOf(rows, 'tabindex')).toEqual(['0', '-1'])
	})
})

/**
 * Панель Select — Frame, а телепорта на сервере нет, как у всех оверлеев:
 * опций в разметке сервера нет. Опции из данных в коллекции с самой сборки, и
 * поле сервер рисует с текстом выбранного, а в `multiple` — с тегами. Опции
 * разметкой стоят в панели и входят в коллекцию, когда её смонтирует
 * `Teleport`, — только в браузере: на сервере поле пустое.
 */
describe('Select · серверный рендер', () => {
	const ITEMS = [
		{ value: 'a', text: 'Первый' },
		{ value: 'b', text: 'Второй' },
		{ value: 'c', text: 'Третий' },
	]

	/** Поле комбобокса — единственный `<input>` разметки. */
	const fieldOf = (body: string) => tagsOf(body).filter((tag) => tag.name === 'input')

	it('из items — поле с текстом выбранного и связкой комбобокса, панели нет', () => {
		const { body } = render(Select, { props: { items: ITEMS, value: 'b', name: 'Город' } })
		const [field, ...rest] = fieldOf(body)

		expect(rest).toEqual([])
		expect(field?.attributes.role).toBe('combobox')
		expect(field?.attributes.value).toBe('Второй')
		expect(field?.attributes['aria-expanded']).toBe('false')
		expect(field?.attributes['aria-controls']).toBeUndefined()
		expect(withClass(body, 'so-select__panel')).toEqual([])
		expect(tagsWith(body, 'role', 'option')).toEqual([])
	})

	it('из items в multiple — выбранное тегами в поле, текст поля пуст', () => {
		const { body } = render(Select, {
			props: { items: ITEMS, mode: 'multiple', value: ['a', 'c'] },
		})

		expect(withClass(body, 'so-select__tags')).toHaveLength(1)
		expect(withClass(body, 'so-tags-item')).toHaveLength(2)
		expect(textOf(body)).toContain('Первый')
		expect(textOf(body)).toContain('Третий')
		expect(textOf(body)).not.toContain('Второй')
		expect(fieldOf(body)[0]?.attributes.value ?? '').toBe('')
	})

	it('опции разметкой — поле пустое: опции входят в коллекцию только в браузере', () => {
		const { body } = render(SelectHarness, { props: { select: { value: 'tver' } } })

		expect(fieldOf(body)[0]?.attributes.value ?? '').toBe('')
		expect(textOf(body)).not.toContain('Тверь')
		expect(withClass(body, 'so-select-item')).toEqual([])
	})
})

/**
 * The trigger keeps its name and expanded state on the server. The panel
 * and its items mount in the browser through Teleport, so the server does
 * not emit the trigger's aria-controls reference.
 */
describe('Menu · серверный рендер', () => {
	/** Триггер — кнопка из scope: её атрибуты. */
	const triggerOf = (body: string) => withClass(body, 'so-test-trigger')[0]?.attributes ?? {}

	it.each([false, true])('omits the unmounted panel link when open=%s', (open) => {
		const { body } = render(MenuHarness, { props: { case: 'groups', menu: { open } } })
		const button = triggerOf(body)

		expect(tagsOf(body)[0]?.name).toBe('span')
		expect(tagsOf(body)[0]?.attributes.class?.split(' ')).toContain('so-menu')
		expect(button['aria-haspopup']).toBe('menu')
		expect(button['aria-expanded']).toBe(String(open))
		expect(button['aria-controls']).toBeUndefined()
		expect(button.id).toMatch(/.+/)
		expect(button['data-selected']).toBe(String(open))
		expect(withClass(body, 'so-menu__panel')).toEqual([])
		expect(textOf(body)).not.toContain('Изменить')
		expect(textOf(body)).not.toContain('Сетка')
	})

	it('у пунктов из данных — так же: панели и пунктов нет', () => {
		const { body } = render(Menu, {
			props: { items: [{ value: 'edit', text: 'Изменить' }], trigger },
		})

		expect(triggerOf(body)['aria-haspopup']).toBe('menu')
		expect(withClass(body, 'so-menu__panel')).toEqual([])
		expect(textOf(body)).not.toContain('Изменить')
	})

	it('у контекстного меню — область без связки', () => {
		const { body } = render(Menu, { props: { openOn: 'contextmenu', trigger: area } })
		const [root, areaTag] = tagsOf(body)

		expect(root?.attributes.class?.split(' ')).toContain('so-menu')
		expect(areaTag?.attributes).toEqual({ class: 'so-test-area' })
		expect(withClass(body, 'so-menu__panel')).toEqual([])
	})
})

describe('Tabs · серверный рендер', () => {
	/** Табы — строки с ролью, показанные панели — с ролью панели. */
	function partsOf(body: string) {
		return { rows: tagsWith(body, 'role', 'tab'), panels: tagsWith(body, 'role', 'tabpanel') }
	}

	it('табы из items: aria-selected, связка таба с панелью и панель активного таба', () => {
		const { body } = render(TabsHarness, {
			props: {
				tabs: {
					items: [
						{ value: 'a', text: 'A' },
						{ value: 'b', text: 'B', _: { active: true } },
					],
				},
				panels: [
					{ value: 'a', text: 'Панель A' },
					{ value: 'b', text: 'Панель B' },
				],
			},
		})
		const { rows, panels } = partsOf(body)

		expect(attributeOf(rows, 'aria-selected')).toEqual(['false', 'true'])
		expect(panels).toHaveLength(1)
		expect(textOf(body)).toContain('Панель B')
		expect(textOf(body)).not.toContain('Панель A')
		expect(rows[1]?.attributes['aria-controls']).toBe(panels[0]?.attributes.id)
		expect(panels[0]?.attributes['aria-labelledby']).toBe(rows[1]?.attributes.id)
	})

	it('табы и панели из разметки: панель активного таба — в разметке, со связкой', () => {
		const { body } = render(TabsHarness, {
			props: {
				items: [
					{ value: 'a', text: 'A' },
					{ value: 'b', text: 'B', active: true },
				],
				panels: [{ value: 'b', text: 'Панель B' }],
			},
		})
		const { rows, panels } = partsOf(body)

		expect(attributeOf(rows, 'aria-selected')).toEqual(['false', 'true'])
		expect(panels).toHaveLength(1)
		expect(textOf(body)).toContain('Панель B')
		expect(rows[1]?.attributes['aria-controls']).toBe(panels[0]?.attributes.id)
		expect(panels[0]?.attributes['aria-labelledby']).toBe(rows[1]?.attributes.id)
	})

	/**
	 * Остановка Tab у табов разметки — как у тегов с выбором: таб выше
	 * активного сервер нарисовал с остановкой, которую тот держал как первый
	 * доступный, а активный забрал её, когда разметка таба выше была уже
	 * отдана. До гидратации остановок две — цена серверной разметки
	 * (`docs/agents/collections.md`, «Цена»); гидратация лишнюю снимает
	 * (`hydration/collections.hydration.spec.ts`).
	 */
	it('табы разметки, активный вторым: у таба выше вторая остановка Tab — цена сервера, см. «Цена»', () => {
		const { body } = render(TabsHarness, {
			props: {
				items: [
					{ value: 'a', text: 'A' },
					{ value: 'b', text: 'B', active: true },
				],
			},
		})
		const { rows } = partsOf(body)

		expect(attributeOf(rows, 'aria-selected')).toEqual(['false', 'true'])
		expect(attributeOf(rows, 'tabindex')).toEqual(['0', '0'])
	})

	it('табы разметки, активный первым — остановка Tab одна, у него', () => {
		const { body } = render(TabsHarness, {
			props: {
				items: [
					{ value: 'a', text: 'A', active: true },
					{ value: 'b', text: 'B' },
				],
			},
		})
		const { rows } = partsOf(body)

		expect(attributeOf(rows, 'aria-selected')).toEqual(['true', 'false'])
		expect(attributeOf(rows, 'tabindex')).toEqual(['0', '-1'])
	})

	/**
	 * Свой `id` панели — на ней в разметке сервера: узел его с первой
	 * отрисовки. Таб отдан раньше, чем инициализировалась панель, и ведёт на
	 * формулу — цена сервера, как вторая остановка Tab; ссылку на `id` панели
	 * он получает с гидратацией (`hydration/collections.hydration.spec.ts`).
	 */
	it('свой id панели — на панели; таб, отданный раньше неё, ведёт на формулу', () => {
		const { body } = render(TabsHarness, {
			props: {
				items: [{ value: 'a', text: 'A', active: true }],
				panels: [{ value: 'a', text: 'Панель A', id: 'general' }],
			},
		})
		const { rows, panels } = partsOf(body)

		expect(panels[0]?.attributes.id).toBe('general')
		expect(rows[0]?.attributes['aria-controls']).not.toBe('general')
		expect(tagsWith(body, 'id', 'general')).toHaveLength(1)
	})
})

describe('Accordion · серверный рендер', () => {
	/** Заголовки и панели секций. */
	function partsOf(body: string) {
		return {
			heads: withClass(body, 'so-accordion-item__header'),
			bodies: withClass(body, 'so-accordion-item__content'),
		}
	}

	it('секции из items: aria-expanded и связка заголовка с панелью', () => {
		const { body } = render(Accordion, {
			props: {
				items: [
					{ value: 'a', text: 'A', _: { selected: true } },
					{ value: 'b', text: 'B' },
				],
			},
		})
		const { heads, bodies } = partsOf(body)

		expect(attributeOf(heads, 'aria-expanded')).toEqual(['true', 'false'])
		expect(attributeOf(heads, 'aria-controls')).toEqual(attributeOf(bodies, 'id'))
		expect(attributeOf(bodies, 'aria-labelledby')).toEqual(attributeOf(heads, 'id'))
	})

	it('секции из разметки: aria-expanded и связка заголовка с панелью', () => {
		const { body } = render(AccordionHarness, {
			props: {
				items: [
					{ value: 'a', text: 'A', selected: true },
					{ value: 'b', text: 'B' },
				],
				bodies: { a: 'Содержимое A', b: 'Содержимое B' },
			},
		})
		const { heads, bodies } = partsOf(body)

		expect(attributeOf(heads, 'aria-expanded')).toEqual(['true', 'false'])
		expect(attributeOf(heads, 'aria-controls')).toEqual(attributeOf(bodies, 'id'))
		expect(attributeOf(bodies, 'aria-labelledby')).toEqual(attributeOf(heads, 'id'))
	})
})

describe('RadioGroup · серверный рендер', () => {
	it('радио из items — с общим name и отметкой', () => {
		const { body } = render(RadioGroup, {
			props: { name: 'delivery', value: 'b', items: [{ value: 'a' }, { value: 'b' }] },
		})
		const fields = tagsWith(body, 'type', 'radio')

		expect(attributeOf(fields, 'name')).toEqual(['delivery', 'delivery'])
		expect(fields.map((field) => 'checked' in field.attributes)).toEqual([false, true])
	})

	it('радио из разметки — с общим name и отметкой', () => {
		const { body } = render(RadioGroupHarness, {
			props: {
				group: { value: 'b' },
				items: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
				labels: { a: 'Первый', b: 'Второй', c: 'Третий' },
			},
		})
		const fields = tagsWith(body, 'type', 'radio')
		const names = new Set(attributeOf(fields, 'name'))

		expect(fields.map((field) => 'checked' in field.attributes)).toEqual([false, true, false])
		expect(names.size).toBe(1)
		expect([...names][0]).not.toBe('')
	})
})

/**
 * Таблица из данных: строки в коллекции с самой сборки, и сервер рисует их со
 * всем, что пишут им коллекция и плагины, — `id` заголовков строк и ссылки
 * чекбоксов на них, `id` подписей колонок и ссылки заголовков и поля ручки на
 * них, имя кнопки сортировки от локали. Ширину поле ручки отдаёт атрибутом
 * `value`: attachment-а поля на сервере нет.
 */
describe('Table · серверный рендер', () => {
	const NAME: TTableColumnSource = { field: 'name', text: 'Имя', rowHeader: true }
	const AGE: TTableColumnSource = {
		field: 'age',
		text: 'Возраст',
		sortable: true,
		resizable: true,
		width: 120,
	}
	const ROWS = [
		{ data: { id: 1, name: 'Анна', age: 30 } },
		{ data: { id: 2, name: 'Борис', age: 41 } },
	]

	it('строки и колонки из данных — со связками, именами и шириной', () => {
		const { body } = render(Table, {
			props: { items: ROWS, columns: [NAME, AGE], mode: 'multiple' },
		})
		const rowHeaders = attributeOf(tagsWith(body, 'scope', 'row'), 'id')
		const captions = attributeOf(withClass(body, 'so-table-column__text'), 'id')
		// Чекбоксы строк называет ссылка; у «выбрать все» — своё имя
		const rowChecks = tagsWith(body, 'type', 'checkbox').filter(
			(tag) => 'aria-labelledby' in tag.attributes,
		)

		expect(textOf(body)).toContain('Анна')
		expect(textOf(body)).toContain('Борис')
		expect(rowHeaders).toHaveLength(2)
		expect(rowHeaders.every(Boolean)).toBe(true)
		expect(attributeOf(rowChecks, 'aria-labelledby')).toEqual(rowHeaders)
		expect(captions).toHaveLength(2)
		expect(captions.every(Boolean)).toBe(true)
		expect(attributeOf(withClass(body, 'so-table-column'), 'aria-labelledby')).toEqual(captions)
		expect(attributeOf(withClass(body, 'so-table-column__sort'), 'aria-label')).toEqual([
			'Sort by Возраст',
		])

		const [field] = withClass(body, 'so-table-column__input')

		expect(field?.attributes['aria-labelledby']).toBe(captions[1])
		expect(field?.attributes.value).toBe('120')
	})

	it('окно таблицы — внешний узел, корень, наборы и атрибуты потребителя — у table', () => {
		const { body } = render(Table, {
			props: {
				items: ROWS,
				columns: [NAME],
				class: 'staff',
				aria_label: 'Сотрудники',
				id: 'staff',
				'data-probe': '1',
			},
		})
		const [viewport] = withClass(body, 'so-table__viewport')
		const [table] = withClass(body, 'so-table')
		const classes = (tag: TTag | undefined) =>
			(tag?.attributes.class ?? '').split(' ').filter(Boolean)

		expect(viewport?.name).toBe('div')
		expect(classes(viewport)).toEqual(['so-table__viewport', 'staff'])
		expect(viewport?.attributes['aria-label']).toBeUndefined()
		expect(viewport?.attributes['id']).toBeUndefined()
		expect(table?.name).toBe('table')
		expect(table?.attributes['aria-label']).toBe('Сотрудники')
		expect(table?.attributes['id']).toBe('staff')
		expect(table?.attributes['data-probe']).toBe('1')
		expect(classes(table)).not.toContain('staff')
	})
})

/**
 * Пагинация на сервере: страницы окна кладёт в коллекцию её расширение при
 * сборке, а она идёт и на сервере. Поэтому сервер рисует окно целиком —
 * страницы, пропуски и текущую с `aria-current` и `data-selected`, — а имена
 * стрелок и цифры номеров — на языке провайдера.
 */
describe('Pagination · серверный рендер', () => {
	/** Ряд строкой, как его видит пользователь: пропуск — «…», текущая — в скобках. */
	function rowOf(body: string): string {
		const clean = body.replace(/<!--[\s\S]*?-->/g, '')
		const list = /<ol class="so-pagination__list">([\s\S]*?)<\/ol>/.exec(clean)?.[1] ?? ''

		return [...list.matchAll(/<li ([^>]*)>([\s\S]*?)<\/li>/g)]
			.map(([, attributes, inner]) => {
				if (attributes.includes('so-pagination__ellipsis')) return inner

				const text = textOf(inner).trim()
				const current = inner.includes('aria-current="page"')

				if (current !== attributes.includes('data-selected="true"')) {
					throw new Error(`страница ${text}: наборы разошлись`)
				}

				return current ? `[${text}]` : text
			})
			.join(' ')
	}

	it('окно, текущая и имена — уже в разметке сервера', () => {
		const { body } = render(Surround, {
			props: {
				around: 'locale',
				control: 'pagination',
				locale: ruRU,
				pagination: { total: 100, value: 5, aria_label: 'Страницы' },
			},
		})
		const [root] = withClass(body, 'so-pagination')
		const [prev] = withClass(body, 'so-pagination__prev')
		const [next] = withClass(body, 'so-pagination__next')

		expect(root?.name).toBe('nav')
		expect(root?.attributes['aria-label']).toBe('Страницы')
		expect(rowOf(body)).toBe('1 … 4 [5] 6 … 10')
		expect(prev?.attributes['aria-label']).toBe('Предыдущая страница')
		expect(next?.attributes['aria-label']).toBe('Следующая страница')
		expect(prev?.attributes['type']).toBe('button')
	})

	it('номера — в цифрах и с разрядами локали провайдера', () => {
		const { body } = render(Surround, {
			props: {
				around: 'locale',
				control: 'pagination',
				locale: ruRU,
				pagination: { total: 200_000, value: 12_345 },
			},
		})
		const ru = new Intl.NumberFormat('ru-RU')

		expect(rowOf(body)).toBe(
			`1 … ${ru.format(12_344)} [${ru.format(12_345)}] ${ru.format(12_346)} … ${ru.format(20_000)}`,
		)
	})
})

/**
 * Календарь на сервере: дни кладёт в коллекцию вид по месяцам сеток при
 * сборке, а она идёт и на сервере, — сервер рисует сетки целиком, со всем, что
 * пишут дням расширения коллекции: имя — полная дата, одна остановка Tab на
 * все сетки. Имена сеток — `id` заголовков и ссылки таблиц на них — пишет
 * плагин связок от id монтирования. Панель выбора месяца и года — поповер с
 * `contained`: `Teleport` с `contained` рисует её на месте и на сервере —
 * скрытой и без карточки: содержимое не монтируется до первого открытия
 * (`lazyMount`).
 */
describe('Calendar · серверный рендер', () => {
	const MONTHS = ['2026-09-01', '2026-10-01']
	const FULL = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeZone: 'UTC' })

	/** Имена дней месяца `month` (1–12) 2026 года — полные даты, как их прочтёт скринридер. */
	const namesOf = (month: number) =>
		Array.from({ length: new Date(Date.UTC(2026, month, 0)).getUTCDate() }, (_, index) =>
			FULL.format(Date.UTC(2026, month - 1, index + 1)),
		)

	/**
	 * Панель места — прямой потомок заголовка, а он — месяца: за кнопкой
	 * заголовка сразу идёт панель. С `contained` сервер Svelte рисует её на
	 * месте, без обёрток телепорта.
	 */
	const PLACE =
		/<div class="so-calendar__month"><div [^>]*class="so-popover so-calendar__heading"[^>]*><button [^>]*>[\s\S]*?<\/button>(<div [^>]*class="so-frame so-popover__panel"[^>]*>)/g

	it('сетки названы заголовками: id заголовков и aria-labelledby таблиц на них', () => {
		const { body } = render(Calendar, { props: { months: MONTHS } })
		const titles = withClass(body, 'so-calendar__title-text')
		const ids = attributeOf(titles, 'id')

		expect(textOf(body)).toContain('September 2026')
		expect(textOf(body)).toContain('October 2026')
		expect(new Set(ids).size).toBe(2)
		expect(ids).toEqual([expect.stringMatching(/\S/), expect.stringMatching(/\S/)])
		expect(attributeOf(titles, 'aria-live')).toEqual(['polite', 'polite'])
		expect(attributeOf(tagsWith(body, 'role', 'grid'), 'aria-labelledby')).toEqual(ids)
	})

	it('дни — с полными именами и одной остановкой Tab на все сетки, заполнители — под aria-hidden', () => {
		const { body } = render(Calendar, { props: { months: MONTHS, value: '2026-10-14' } })
		const days = withClass(body, 'so-calendar-item')
		const fillers = withClass(body, 'so-calendar__filler')

		expect(attributeOf(days, 'aria-label')).toEqual([...namesOf(9), ...namesOf(10)])
		// Остановка — у дня с фокусом коллекции: он на выбранной дате
		expect(attributeOf(tagsWith(body, 'tabindex', '0'), 'aria-label')).toEqual([
			FULL.format(Date.UTC(2026, 9, 14)),
		])
		expect(new Set(attributeOf(days, 'tabindex'))).toEqual(new Set(['0', '-1']))
		// Неделя en-US — с воскресенья: у сентября 2026 заполнители — 2 дня
		// августа и 3 октября, у октября — 4 дня сентября, ноябрьских нет
		expect(attributeOf(fillers, 'aria-hidden')).toEqual(Array.from({ length: 9 }, () => 'true'))
		expect(fillers.filter((cell) => 'aria-label' in cell.attributes)).toEqual([])
	})

	it('панель выбора места — на месте, прямым потомком заголовка: скрыта и без карточки', () => {
		const { body } = render(Calendar, { props: { months: MONTHS } })
		// Группа поиска — один открывающий тег панели
		const panels = [...body.replace(/<!--[\s\S]*?-->/g, '').matchAll(PLACE)].flatMap(
			([, panel]) => tagsOf(panel),
		)

		expect(panels).toHaveLength(2)
		expect(attributeOf(panels, 'data-contained')).toEqual(['true', 'true'])
		expect(attributeOf(panels, 'style')).toEqual([
			expect.stringContaining('display: none'),
			expect.stringContaining('display: none'),
		])
		// Заголовок — триггер панели своего места
		expect(attributeOf(withClass(body, 'so-calendar__title'), 'aria-controls')).toEqual(
			attributeOf(panels, 'id'),
		)
		expect(withClass(body, 'so-calendar__picker')).toEqual([])
		expect(withClass(body, 'so-list-box')).toEqual([])
	})
})

/**
 * Окно на сервере: подхват — при сборке коллекции, а она идёт и на сервере.
 * Сервер рисует уже окно — первые 50 элементов, без распорок: замера нет.
 */
describe('Virtual · серверный рендер', () => {
	const ITEMS = Array.from({ length: 80 }, (_, index) => ({
		value: `v${index + 1}`,
		text: `Пункт ${index + 1}`,
	}))

	it('список в окне — первые 50 элементов, распорок нет', () => {
		const { body } = render(VirtualHarness, { props: { list: { items: ITEMS } } })

		expect(withClass(body, 'so-list-box-item')).toHaveLength(50)
		expect(withClass(body, 'so-list-box__filler')).toEqual([])
		expect(attributeOf(tagsWith(body, 'aria-posinset'), 'aria-posinset').at(-1)).toBe('50')
	})

	it('таблица в окне — первые 50 строк и число строк у таблицы', () => {
		const rows = ITEMS.map((item, index) => ({ data: { id: index + 1, name: item.text } }))
		const { body } = render(VirtualHarness, {
			props: {
				kind: 'table',
				table: { items: rows, columns: [{ field: 'name', text: 'Имя', rowHeader: true }] },
			},
		})

		expect(withClass(body, 'so-table-row')).toHaveLength(50)
		expect(withClass(body, 'so-table__filler-row')).toEqual([])
		expect(withClass(body, 'so-table')[0]?.attributes['aria-rowcount']).toBe('81')
	})
})

/**
 * Перестановка на сервере: обёртку коллекции подхватывают при инициализации,
 * а она идёт и на сервере, но `draggable` ставит плагин перетаскивания на узлы
 * элементов, а узлов на сервере нет. Своего узла у обёртки нет, и в разметке
 * её не видно.
 */
describe('DragAndDrop · серверный рендер', () => {
	it('элементы Tabs, ListBox и Accordion — без draggable, узла обёртки нет', () => {
		const { body } = render(DragAndDropHarness, { props: {} })

		expect(withClass(body, 'so-tabs-item')).toHaveLength(3)
		expect(withClass(body, 'so-list-box-item')).toHaveLength(3)
		expect(withClass(body, 'so-accordion-item')).toHaveLength(3)
		expect(tagsWith(body, 'draggable')).toEqual([])
		expect(tagsOf(body)[0]?.attributes.class?.split(' ')).toContain('so-tabs')
	})
})

describe('id и name — от $props.id()', () => {
	/** Страница: табы и панели, секции и радио — всё разметкой, и календарь из двух сеток. */
	function page(): string {
		const tabs = render(TabsHarness, {
			props: {
				items: [
					{ value: 'a', text: 'A', active: true },
					{ value: 'b', text: 'B' },
				],
				panels: [{ value: 'a', text: 'Панель A' }],
			},
		}).body
		const accordion = render(AccordionHarness, {
			props: {
				items: [
					{ value: 'a', text: 'A' },
					{ value: 'b', text: 'B' },
				],
			},
		}).body
		const radios = render(RadioGroupHarness, {
			props: { items: [{ value: 'a' }, { value: 'b' }] },
		}).body
		const calendar = render(Calendar, {
			props: { months: ['2026-09-01', '2026-10-01'] },
		}).body

		return tabs + accordion + radios + calendar
	}

	/**
	 * `id` и `name` страницы: табов, панели таба, заголовков и панелей секций,
	 * радио, заголовков месяцев календаря и панелей выбора месяца и года.
	 */
	function idsOf(body: string) {
		return {
			tabs: attributeOf(tagsWith(body, 'role', 'tab'), 'id'),
			panel: attributeOf(tagsWith(body, 'role', 'tabpanel'), 'id'),
			heads: attributeOf(withClass(body, 'so-accordion-item__header'), 'id'),
			bodies: attributeOf(withClass(body, 'so-accordion-item__content'), 'id'),
			names: attributeOf(tagsWith(body, 'type', 'radio'), 'name'),
			titles: attributeOf(withClass(body, 'so-calendar__title-text'), 'id'),
			pickers: attributeOf(withClass(body, 'so-popover__panel'), 'id'),
		}
	}

	it('два параллельных рендера одной разметки дают одни и те же id и name', async () => {
		const [first, second] = await Promise.all([
			Promise.resolve().then(page),
			Promise.resolve().then(page),
		])

		expect(idsOf(first)).toEqual(idsOf(second))
	})

	it('id у частей свои, name у радио группы — один', () => {
		const ids = idsOf(page())

		expect(
			new Set([...ids.tabs, ...ids.heads, ...ids.bodies, ...ids.titles, ...ids.pickers]).size,
		).toBe(10)
		expect(ids.panel).toEqual([expect.stringMatching(/\S/)])
		expect(new Set(ids.names).size).toBe(1)
	})

	/** Счётчик набора даёт `so-<n>`: им набор берёт, когда адаптер id монтирования не передал. */
	it('ни один id и name не от счётчика набора', () => {
		const ids = idsOf(page())

		for (const id of [
			...ids.tabs,
			...ids.panel,
			...ids.heads,
			...ids.bodies,
			...ids.names,
			...ids.titles,
			...ids.pickers,
		]) {
			expect(id).not.toMatch(/^so-\d+-/)
		}
	})
})
