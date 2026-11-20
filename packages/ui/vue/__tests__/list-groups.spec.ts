/**
 * Группы ListBox и Select во Vue — разметка секций на настоящем компоненте.
 *
 * Группы из данных: метка `_.group` в `items` или `groupBy`, порядок и
 * подписи — `groups`. Список рисует секции нарисованного (`drawnSections`):
 * группу с подписью — частью `ListBox.Group` или `Select.Group`
 * (`role="group"`, имя — подпись), элементы без группы — прямо в списке, а
 * между секциями, пока их просит список (`groupSeparators`, по умолчанию
 * выключен), — немой разделитель (в `listbox` ARIA пускает только опции и
 * группы). Группы из `groups` идут первыми, остальное — по месту. Стрелки
 * ходят тем же порядком, что элементы стоят на экране.
 *
 * Группы разметки входят в ту же группировку: секции описывают и их, а
 * элемент вне группы над группой стоит первым и на экране, и в стрелках.
 *
 * Модель — `core/__tests__/list-groups.spec.ts`, раскладка темы —
 * `playground/vue/browser/list-groups.spec.ts`.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref, type VNode } from 'vue'
import { ListBox, Select } from '@soxa-ui/vue'
import { createEngineListBox, createEngineSelect } from '@soxa-ui/core'
import type { IListBoxItem, TGroupSection } from '@soxa-ui/core'

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

let wrapper: ReturnType<typeof mount> | null = null

afterEach(() => {
	wrapper?.unmount()
	wrapper = null
	document.body.innerHTML = ''
})

/** Смонтировать разметку в документ и дождаться кадра: корень плагины получают через кадр. */
async function render(content: () => VNode): Promise<ReturnType<typeof mount>> {
	const mounted = mount(defineComponent({ render: content }), { attachTo: document.body })

	wrapper = mounted

	await nextTick()
	await nextFrame()

	return mounted
}

/** Узел по селектору; нет его — тест падает здесь, а не на чтении свойства. */
function find(selector: string, scope: ParentNode = document): HTMLElement {
	const element = scope.querySelector(selector)

	if (!(element instanceof HTMLElement)) throw new Error(`${selector}: HTML-узла нет`)

	return element
}

/** В данных «Морковь» стоит между фруктами, у «Воды» группы нет. */
const MIXED = [
	{ value: 'apple', text: 'Яблоко', _: { group: 'fruit' } },
	{ value: 'carrot', text: 'Морковь', _: { group: 'veg' } },
	{ value: 'water', text: 'Вода' },
	{ value: 'pear', text: 'Груша', _: { group: 'fruit' } },
]

const GROUPS = [
	{ key: 'fruit', label: 'Фрукты' },
	{ key: 'veg', label: 'Овощи' },
]

/** Секции `MIXED` на экране — без разделителей. */
const SECTIONS = [['Фрукты', ['Яблоко', 'Груша']], ['Овощи', ['Морковь']], 'Вода']

/** Те же секции с разделителями между соседними. */
const SEPARATED = [['Фрукты', ['Яблоко', 'Груша']], '—', ['Овощи', ['Морковь']], '—', 'Вода']

/**
 * Части списка по порядку: группа — подписью и текстами её элементов,
 * разделитель — `—`, элемент без группы — текстом.
 */
function parts(list: HTMLElement, block: string): unknown[] {
	return [...list.children].map((node) => {
		if (node.classList.contains(`${block}-group`)) {
			const label = node.querySelector(`.${block}-group__label`)?.textContent ?? ''
			const items = [...node.querySelectorAll(`.${block}-item`)].map((item) =>
				item.textContent?.trim(),
			)

			return [label, items]
		}

		if (node.classList.contains(`${block}__separator`)) return '—'

		return node.textContent?.trim()
	})
}

/** Разметка группы по APG «Listbox with grouped options». */
function expectGroupMarkup(group: Element, block: string): void {
	const label = find(`.${block}-group__label`, group)

	expect(group.getAttribute('role')).toBe('group')
	expect(label.id).not.toBe('')
	expect(group.getAttribute('aria-labelledby')).toBe(label.id)
	expect(label.getAttribute('role')).toBe('presentation')
}

describe('ListBox · группы из данных', () => {
	const list = () => find('.so-list-box__list')

	it('группы с подписью, без группы — последними; разделителей по умолчанию нет', async () => {
		await render(() => h(ListBox, { items: MIXED, groups: GROUPS }))

		expect(parts(list(), 'so-list-box')).toEqual(SECTIONS)
		expect(list().querySelector('.so-list-box__separator')).toBeNull()

		const groups = [...list().querySelectorAll('.so-list-box-group')]

		expect(groups).toHaveLength(2)

		for (const group of groups) expectGroupMarkup(group, 'so-list-box')
	})

	it('groupSeparators — немой разделитель только между соседними секциями', async () => {
		await render(() => h(ListBox, { items: MIXED, groups: GROUPS, groupSeparators: true }))

		expect(parts(list(), 'so-list-box')).toEqual(SEPARATED)

		const separators = [...list().querySelectorAll('.so-list-box__separator')]

		expect(separators.map((node) => node.getAttribute('aria-hidden'))).toEqual(['true', 'true'])
		expect(separators.some((node) => node.hasAttribute('role'))).toBe(false)
	})

	it('groupSeparators на лету ставит и снимает разделители', async () => {
		const separated = ref(true)

		await render(() =>
			h(ListBox, { items: MIXED, groups: GROUPS, groupSeparators: separated.value }),
		)

		expect(parts(list(), 'so-list-box')).toEqual(SEPARATED)

		separated.value = false
		await nextTick()

		expect(parts(list(), 'so-list-box')).toEqual(SECTIONS)

		separated.value = true
		await nextTick()

		expect(parts(list(), 'so-list-box')).toEqual(SEPARATED)
	})

	it('стрелки ходят порядком экрана: ↓ после «Яблока» — «Груша»', async () => {
		await render(() => h(ListBox, { items: MIXED, groups: GROUPS }))

		const highlighted = () =>
			document
				.querySelector('.so-list-box-item [data-highlighted="true"]')
				?.textContent?.trim()
		const press = async (key: string) => {
			list().dispatchEvent(
				new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
			)
			await nextTick()
		}

		list().focus()
		await press('ArrowDown')

		expect(highlighted()).toBe('Яблоко')

		await press('ArrowDown')

		expect(highlighted()).toBe('Груша')

		await press('ArrowDown')

		expect(highlighted()).toBe('Морковь')

		await press('ArrowDown')

		expect(highlighted()).toBe('Вода')
	})

	it('смена подписи в groups перерисовывает подписи групп', async () => {
		const groups = ref(GROUPS)

		await render(() => h(ListBox, { items: MIXED, groups: groups.value }))

		groups.value = [
			{ key: 'fruit', label: 'Fruit' },
			{ key: 'veg', label: 'Vegetables' },
		]
		await nextTick()

		expect(parts(list(), 'so-list-box')).toEqual([
			['Fruit', ['Яблоко', 'Груша']],
			['Vegetables', ['Морковь']],
			'Вода',
		])
	})

	it('groupBy пропом: ключ группы — из элемента', async () => {
		await render(() =>
			h(ListBox, {
				items: [
					{ value: 'a', text: 'Первый' },
					{ value: 'b', text: 'Второй' },
				],
				groupBy: (item: IListBoxItem) => (item.value === 'b' ? 'second' : undefined),
				groups: [{ key: 'second', label: 'Вторые' }],
			}),
		)

		expect(parts(list(), 'so-list-box')).toEqual([['Вторые', ['Второй']], 'Первый'])
	})

	it('группировка через движок: engine.extensions.group после монтирования', async () => {
		const engine = createEngineListBox({
			items: [
				{ value: 'a', text: 'Первый' },
				{ value: 'b', text: 'Второй' },
			],
		})

		await render(() => h(ListBox, { engine, groupSeparators: true }))

		expect(parts(list(), 'so-list-box')).toEqual(['Первый', 'Второй'])

		engine.extensions.group.groupBy = (item) => (item.value === 'b' ? 'second' : undefined)
		engine.extensions.group.groups = [{ key: 'second', label: 'Вторые' }]
		await nextTick()

		expect(parts(list(), 'so-list-box')).toEqual([['Вторые', ['Второй']], '—', 'Первый'])
	})

	it('группа без подписи — обёртка без подписи и без ссылки на неё', async () => {
		await render(() => h(ListBox, { items: MIXED }))

		const groups = [...list().querySelectorAll('.so-list-box-group')]

		expect(groups).toHaveLength(2)
		expect(list().querySelector('.so-list-box-group__label')).toBeNull()
		expect(groups.some((group) => group.hasAttribute('aria-labelledby'))).toBe(false)
	})

	it('без группировки — ни групп, ни разделителей: элементы прямо в списке', async () => {
		await render(() =>
			h(ListBox, {
				items: [
					{ value: 'a', text: 'Первый' },
					{ value: 'b', text: 'Второй' },
				],
				groupSeparators: true,
			}),
		)

		expect(parts(list(), 'so-list-box')).toEqual(['Первый', 'Второй'])
		expect(list().querySelector('.so-list-box-group, .so-list-box__separator')).toBeNull()
	})

	it('ListBox.Group разметкой — группа с именем от подписи, элементы — в коллекции списка', async () => {
		await render(() =>
			h(ListBox, null, () => [
				h(ListBox.Group, { label: 'Фрукты' }, () => [
					h(ListBox.Item, { value: 'apple', text: 'Яблоко' }),
					h(ListBox.Item, { value: 'pear', text: 'Груша' }),
				]),
				h(ListBox.Item, { value: 'water', text: 'Вода' }),
			]),
		)

		const group = find('.so-list-box-group')

		expectGroupMarkup(group, 'so-list-box')
		expect(group.querySelectorAll('[role="option"]')).toHaveLength(2)
		expect(list().querySelectorAll('[role="option"][aria-selected]')).toHaveLength(3)
	})
})

describe('Select · группы из данных', () => {
	const list = () => find('.so-select__list')

	async function open(): Promise<void> {
		const input = find('.so-select input')

		input.dispatchEvent(new MouseEvent('click', { bubbles: true }))
		await nextTick()
	}

	it('группы с подписью, без группы — последними; разделителей по умолчанию нет', async () => {
		await render(() => h(Select, { items: MIXED, groups: GROUPS }))
		await open()

		expect(parts(list(), 'so-select')).toEqual(SECTIONS)
		expect(list().querySelector('.so-select__separator')).toBeNull()

		for (const group of list().querySelectorAll('.so-select-group')) {
			expectGroupMarkup(group, 'so-select')
		}
	})

	it('groupSeparators — немой разделитель только между соседними секциями', async () => {
		await render(() => h(Select, { items: MIXED, groups: GROUPS, groupSeparators: true }))
		await open()

		expect(parts(list(), 'so-select')).toEqual(SEPARATED)
		expect(
			[...list().querySelectorAll('.so-select__separator')].map((node) =>
				node.getAttribute('aria-hidden'),
			),
		).toEqual(['true', 'true'])
	})

	it('groupSeparators на лету ставит и снимает разделители', async () => {
		const separated = ref(false)

		await render(() =>
			h(Select, { items: MIXED, groups: GROUPS, groupSeparators: separated.value }),
		)
		await open()

		expect(parts(list(), 'so-select')).toEqual(SECTIONS)

		separated.value = true
		await nextTick()

		expect(parts(list(), 'so-select')).toEqual(SEPARATED)
	})

	it('стрелки подсвечивают опции порядком экрана', async () => {
		await render(() => h(Select, { items: MIXED, groups: GROUPS }))

		const input = find('.so-select input')
		const active = () =>
			document
				.getElementById(input.getAttribute('aria-activedescendant') ?? '')
				?.textContent?.trim()
		const press = async (key: string) => {
			input.dispatchEvent(
				new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
			)
			await nextTick()
		}

		await press('ArrowDown')

		expect(active()).toBe('Яблоко')

		await press('ArrowDown')

		expect(active()).toBe('Груша')

		await press('ArrowDown')

		expect(active()).toBe('Морковь')
	})

	it('отбор убрал все опции группы — нет и её подписи', async () => {
		await render(() =>
			h(Select, { items: MIXED, groups: GROUPS, editable: true, editableMode: 'filter' }),
		)
		await open()

		const input = find('.so-select input')

		if (!(input instanceof HTMLInputElement)) throw new Error('поле — не input')

		input.value = 'Морковь'
		input.dispatchEvent(new Event('input', { bubbles: true }))
		await nextTick()
		await nextTick()

		expect(parts(list(), 'so-select')).toEqual([['Овощи', ['Морковь']]])
	})
})

/** Секции коротко: подпись группы (`null` — без группы) и значения элементов. */
const brief = (sections: ReadonlyArray<TGroupSection<{ readonly value?: unknown }>>) =>
	sections.map(({ group, items }) => [
		group === null ? null : (group.label ?? ''),
		items.map((item) => item.value),
	])

/**
 * Группы разметки входят в группировку коллекции: ключ группы элементы внутри
 * берут лифтом, подпись группа регистрирует сама. Группы не заявлены в
 * `groups`, поэтому показанное идёт по месту: «Вода» над группой — первой.
 */
describe('ListBox · группы разметки', () => {
	const list = () => find('.so-list-box__list')

	/** «Вода» — над группой «Фрукты», «Сок» — под ней. */
	async function renderMarkup(label = ref('Фрукты')) {
		const engine = createEngineListBox()

		await render(() =>
			h(ListBox, { engine }, () => [
				h(ListBox.Item, { value: 'water', text: 'Вода' }),
				h(ListBox.Group, { label: label.value }, () => [
					h(ListBox.Item, { value: 'apple', text: 'Яблоко' }),
					h(ListBox.Item, { value: 'pear', text: 'Груша' }),
				]),
				h(ListBox.Item, { value: 'juice', text: 'Сок' }),
			]),
		)

		return engine
	}

	it('секции — группа разметки с подписью, элементы вне группы — на своих местах', async () => {
		const engine = await renderMarkup()

		expect(brief(engine.extensions.group.sections)).toEqual([
			[null, ['water']],
			['Фрукты', ['apple', 'pear']],
			[null, ['juice']],
		])
		// Разметка — как написана: группу рисует потребитель, а не секции
		expect(parts(list(), 'so-list-box')).toEqual([
			'Вода',
			['Фрукты', ['Яблоко', 'Груша']],
			'Сок',
		])
	})

	it('стрелки ходят порядком экрана: «Вода» над группой — первой', async () => {
		await renderMarkup()

		const highlighted = () =>
			document
				.querySelector('.so-list-box-item [data-highlighted="true"]')
				?.textContent?.trim()
		const visited: unknown[] = []

		list().focus()

		for (let step = 0; step < 4; step += 1) {
			list().dispatchEvent(
				new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
			)
			await nextTick()
			visited.push(highlighted())
		}

		expect(visited).toEqual(['Вода', 'Яблоко', 'Груша', 'Сок'])
	})

	it('смена подписи группы — новая подпись секции', async () => {
		const label = ref('Фрукты')
		const engine = await renderMarkup(label)

		label.value = 'Ягоды'
		await nextTick()

		expect(brief(engine.extensions.group.sections)[1]).toEqual(['Ягоды', ['apple', 'pear']])
	})
})

describe('Select · группы разметки', () => {
	it('секции — группа разметки с подписью; стрелки — порядком экрана', async () => {
		const engine = createEngineSelect()

		await render(() =>
			h(Select, { engine }, () => [
				h(Select.Item, { value: 'water', text: 'Вода' }),
				h(Select.Group, { label: 'Фрукты' }, () => [
					h(Select.Item, { value: 'apple', text: 'Яблоко' }),
					h(Select.Item, { value: 'pear', text: 'Груша' }),
				]),
			]),
		)

		expect(brief(engine.extensions.group.sections)).toEqual([
			[null, ['water']],
			['Фрукты', ['apple', 'pear']],
		])

		const input = find('.so-select input')
		const active = () =>
			document
				.getElementById(input.getAttribute('aria-activedescendant') ?? '')
				?.textContent?.trim()
		const visited: unknown[] = []

		for (let step = 0; step < 3; step += 1) {
			input.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
			)
			await nextTick()
			visited.push(active())
		}

		expect(visited).toEqual(['Вода', 'Яблоко', 'Груша'])
	})
})

/**
 * A markup group whose options the filter left out hides with its label, as
 * the owner draws no section for such a group from data (issue #905).
 */
describe('Select · группа разметки под отбором', () => {
	it('группа без показанных опций скрыта вместе с подписью, снятый отбор её возвращает', async () => {
		const engine = createEngineSelect()

		await render(() =>
			h(Select, { engine, editable: true, editableMode: 'filter' }, () => [
				h(Select.Group, { label: 'Фрукты' }, () => [
					h(Select.Item, { value: 'apple', text: 'Яблоко' }),
					h(Select.Item, { value: 'pear', text: 'Груша' }),
				]),
				h(Select.Group, { label: 'Овощи' }, () => [
					h(Select.Item, { value: 'carrot', text: 'Морковь' }),
				]),
			]),
		)

		const groups = () => [...document.querySelectorAll<HTMLElement>('.so-select-group')]
		const shown = () =>
			groups()
				.filter((group) => group.style.display !== 'none')
				.map((group) => group.querySelector('.so-select-group__label')?.textContent)

		expect(shown()).toEqual(['Фрукты', 'Овощи'])

		engine.extensions.filter.query = 'груш'
		await nextTick()

		expect(shown()).toEqual(['Фрукты'])

		engine.extensions.filter.clear()
		await nextTick()

		expect(shown()).toEqual(['Фрукты', 'Овощи'])
	})
})
