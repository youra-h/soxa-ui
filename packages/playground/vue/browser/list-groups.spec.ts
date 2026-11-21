/**
 * Groups of ListBox and Select in a real browser: the layout of the label and
 * the separator, the order of the arrows on screen and the row limit together
 * with groups. The group label is one for them and Menu: its font and fields
 * are in the common theme layer (`themes/base/src/group.css` and the files of
 * the blocks), its case and colour in the theme (`mixins/_group.scss`). Its
 * look — case, font, weight, colour and fields — is checked at all three.
 *
 * The model is `core/__tests__/list-groups.spec.ts`, the markup of sections and
 * ARIA `ui/vue/__tests__/list-groups.spec.ts`. Here is what jsdom does not see:
 * where the label stands against the rows, what font it has, that the
 * separator is a visible line across the whole list, that the arrows go top to
 * bottom on screen and that the row limit (`maxRows`) cuts the list at the
 * bottom of the last of the first rows, with labels and separators between
 * them.
 *
 * The separator is drawn while the component asks for it (`groupSeparators`:
 * off by default at ListBox and Select, on at Menu). Without it the place of
 * the line stays empty: sections stand where they stand behind the line and do
 * not stick together — at all three.
 *
 * The label is a note above the rows: in capitals, of the weight and colour of
 * a Field helper, and of its font at the same size. The test knows no numbers
 * of the theme: the helper itself is the measure.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from './render'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, type Component } from 'vue'
import type { TComponentSize } from '@soxa-ui/core'
import type { DescriptorSlots, MenuDescriptor } from '@soxa-ui/setup'
import { COMPONENT_SIZES } from '@soxa-ui/playground-shared'
import { Button, Field, Input, ListBox, Menu, Select } from '@soxa-ui/vue'

import { settled } from './transitions'

import '@soxa-ui/theme-oren'

type TTriggerScope = DescriptorSlots<typeof MenuDescriptor>['trigger']

/** Допуск на субпиксельное округление, px. */
const EPSILON = 1

/** Обе схемы: цвет подписи и подсказки у каждой свой. */
const SCHEMES = ['oren', 'oren-dark'] as const

/**
 * В данных овощи стоят между фруктами, у «Воды» группы нет. На экране —
 * «Фрукты»: Яблоко, Груша, разделитель, «Овощи»: Морковь, Свёкла,
 * разделитель, Вода.
 */
const ITEMS = [
	{ value: 'apple', text: 'Яблоко', _: { group: 'fruit' } },
	{ value: 'carrot', text: 'Морковь', _: { group: 'veg' } },
	{ value: 'water', text: 'Вода' },
	{ value: 'pear', text: 'Груша', _: { group: 'fruit' } },
	{ value: 'beet', text: 'Свёкла', _: { group: 'veg' } },
]

const GROUPS = [
	{ key: 'fruit', label: 'Фрукты' },
	{ key: 'veg', label: 'Овощи' },
]

/** Тексты строк в порядке экрана. */
const SCREEN_ORDER = ['Яблоко', 'Груша', 'Морковь', 'Свёкла', 'Вода']

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/** Несколько кадров: корень плагинам, предел строк и раскладка после него. */
async function frames(count = 3): Promise<void> {
	for (let index = 0; index < count; index++) await nextFrame()
}

/** Узел по селектору; нет его — тест падает здесь, а не на чтении свойства. */
const find = (selector: string, root: ParentNode = document): HTMLElement => {
	const element = root.querySelector(selector)

	if (!(element instanceof HTMLElement)) throw new Error(`${selector}: HTML-узла нет`)

	return element
}

/** Все узлы по селектору — HTML-узлы. */
const findAll = (selector: string, root: ParentNode = document): HTMLElement[] =>
	[...root.querySelectorAll(selector)].filter((node) => node instanceof HTMLElement)

/** Элемент списка по тексту строки. */
const itemOf = (block: string, text: string, root: ParentNode = document): HTMLElement => {
	const found = findAll(`.${block}-item`, root).find((item) => item.textContent?.trim() === text)

	if (!found) throw new Error(`${text}: элемента нет`)

	return found
}

/**
 * Левый край текста внутри узла — по первому непустому текстовому узлу:
 * поле узла и отступы его детей в него уже вошли.
 */
function textLeft(element: Element): number {
	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
		acceptNode: (node) =>
			node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP,
	})
	const text = walker.nextNode()

	if (!text) throw new Error('текста в узле нет')

	const range = document.createRange()

	range.selectNodeContents(text)

	return range.getBoundingClientRect().left
}

/**
 * Строка текста подписи — её коробка без полей. Подпись в одну строку
 * (`truncate`), и это строка целиком, с интерлиньяжем: коробку самих глифов
 * браузер ставит в строку с округлением до пикселя, и половины интерлиньяжа
 * над глифами и под ними расходятся на пиксель.
 */
function lineOf(label: HTMLElement): { top: number; bottom: number } {
	const box = label.getBoundingClientRect()
	const { paddingTop, paddingBottom } = getComputedStyle(label)

	return {
		top: box.top + parseFloat(paddingTop),
		bottom: box.bottom - parseFloat(paddingBottom),
	}
}

const fontSize = (element: Element): number => parseFloat(getComputedStyle(element).fontSize)

/** Строка элемента — кнопка внутри него: кегль строки — её. */
const rowOf = (item: HTMLElement): HTMLElement => find(':scope > .so-button', item)

/**
 * Подпись каждой группы: над первой строкой группы, текст — по началу текста
 * строк, кегль — мельче строки.
 */
function expectLabels(list: HTMLElement, block: string): void {
	const groups = findAll(`.${block}-group`, list)

	expect(groups).toHaveLength(GROUPS.length)

	for (const group of groups) {
		const label = find(`.${block}-group__label`, group)
		const [first] = findAll(`.${block}-item`, group)
		const row = rowOf(first)

		expect(label.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			first.getBoundingClientRect().top + EPSILON,
		)
		expect(Math.abs(textLeft(label) - textLeft(row))).toBeLessThan(EPSILON)
		expect(fontSize(label)).toBeLessThan(fontSize(row))
	}
}

/**
 * Разделители — между секциями: видимая линия в один пиксель во всю ширину
 * содержимого списка, ниже предыдущей секции и выше следующей.
 */
function expectSeparators(list: HTMLElement, block: string): void {
	const separators = findAll(`.${block}__separator`, list)
	const style = getComputedStyle(list)
	const width = list.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)

	expect(separators).toHaveLength(2)

	for (const separator of separators) {
		const box = separator.getBoundingClientRect()
		const line = getComputedStyle(separator)
		const before = separator.previousElementSibling
		const after = separator.nextElementSibling

		expect(line.borderTopStyle).toBe('solid')
		expect(Math.abs(box.height - 1)).toBeLessThan(EPSILON)
		expect(Math.abs(box.width - width)).toBeLessThan(EPSILON)

		if (!before || !after) throw new Error('у разделителя нет соседей')

		expect(before.getBoundingClientRect().bottom).toBeLessThanOrEqual(box.top + EPSILON)
		expect(after.getBoundingClientRect().top).toBeGreaterThanOrEqual(box.bottom - EPSILON)
	}
}

/**
 * Низ содержимого прокручиваемого списка — по его видимой части: верх, рамка,
 * паддинг-бокс без нижнего поля.
 */
function contentBottom(list: HTMLElement): number {
	const style = getComputedStyle(list)

	return (
		list.getBoundingClientRect().top +
		parseFloat(style.borderTopWidth) +
		list.clientHeight -
		parseFloat(style.paddingBottom)
	)
}

/** Подсказка Field размера `size` — своей сценой на той же странице. */
async function fieldHelper(size: TComponentSize = 'normal'): Promise<HTMLElement> {
	const container = render(
		defineComponent({
			render: () => h(Field, { size, helper: 'Не покажем никому' }, () => h(Input)),
		}),
	)

	return find('.so-field__helper', container)
}

/**
 * The text of a label is in capitals, of the weight of a Field helper, and of
 * its font and line height at the same size: a step smaller than the rows.
 */
function expectLabelText(label: HTMLElement, helper: HTMLElement): void {
	const own = getComputedStyle(label)
	const note = getComputedStyle(helper)

	expect(own.textTransform).toBe('uppercase')
	expect(own.fontWeight).toBe(note.fontWeight)
	expect(own.fontSize).toBe(note.fontSize)
	expect(own.lineHeight).toBe(note.lineHeight)
}

/**
 * Над текстом подписи и под ним свободно одинаково: от разделителя до строки
 * подписи следующей группы — столько же, сколько от неё до первой строки
 * группы. Сверху — зазор списка и поле подписи, снизу — её поле и зазор
 * группы.
 */
function expectLabelSpace(list: HTMLElement, block: string): void {
	const separator = find(`.${block}__separator`, list)
	const group = separator.nextElementSibling

	if (!(group instanceof HTMLElement)) throw new Error('за разделителем нет группы')

	const line = lineOf(find(`.${block}-group__label`, group))
	const [first] = findAll(`.${block}-item`, group)
	const above = line.top - separator.getBoundingClientRect().bottom
	const below = first.getBoundingClientRect().top - line.bottom

	expect(above).toBeGreaterThan(0)
	expect(Math.abs(above - below)).toBeLessThan(EPSILON)
}

/**
 * Где стоят части списка: верх каждой строки, затем строка текста каждой
 * подписи — от верха списка. Разделители в счёт не идут: сверяется место
 * секций.
 */
function layoutOf(list: HTMLElement, block: string): number[] {
	const top = list.getBoundingClientRect().top
	const rows = findAll(`.${block}-item`, list).map(
		(item) => item.getBoundingClientRect().top - top,
	)
	const labels = findAll(`.${block}-group__label`, list).map((label) => lineOf(label).top - top)

	return [...rows, ...labels]
}

/** Части стоят там же: то же число и те же места с допуском на округление. */
function expectSameLayout(actual: number[], expected: number[]): void {
	expect(actual).toHaveLength(expected.length)

	actual.forEach((place, index) =>
		expect(Math.abs(place - expected[index])).toBeLessThan(EPSILON),
	)
}

/**
 * Секции без разделителя не слипаются. Строка без группы («Вода») отстоит от
 * последней строки группы над ней дальше, чем строки одной группы друг от
 * друга: иначе она читалась бы строкой «Овощей». Подпись второй группы ближе к
 * своей первой строке, чем к последней строке группы над ней: она заголовок
 * своих строк, а не строка посередине.
 */
function expectApart(list: HTMLElement, block: string): void {
	const box = (text: string) => itemOf(block, text, list).getBoundingClientRect()
	const [, second] = findAll(`.${block}-group`, list)
	const line = lineOf(find(`.${block}-group__label`, second))
	const step = box('Груша').top - box('Яблоко').bottom

	expect(findAll(`.${block}__separator, .so-menu-separator`, list)).toHaveLength(0)
	expect(box('Вода').top - box('Свёкла').bottom).toBeGreaterThan(step + EPSILON)
	expect(line.top - box('Груша').bottom).toBeGreaterThan(
		box('Морковь').top - line.bottom + EPSILON,
	)
}

beforeEach(() => {
	document.documentElement.dataset.soTheme = 'oren'
})

afterEach(() => {
	cleanup()
})

describe('ListBox', () => {
	const list = () => find('.so-list-box > .so-list-box__list')

	async function show(props: Record<string, unknown> = {}): Promise<void> {
		render(
			defineComponent({
				render: () =>
					h('div', { style: 'padding: 40px; width: 320px' }, [
						h(ListBox, { items: ITEMS, groups: GROUPS, ...props }),
					]),
			}),
		)

		await nextTick()
		await frames()
	}

	it.each(COMPONENT_SIZES)(
		'%s: подпись — над строками группы, текст по началу их текста, кегль мельче',
		async (size) => {
			await show({ size })

			expectLabels(list(), 'so-list-box')
		},
	)

	it.each(COMPONENT_SIZES)(
		'%s: подпись — заглавными, начертания подсказки Field, кегль и интерлиньяж её',
		async (size) => {
			const helper = await fieldHelper(size)

			await show({ size })

			expectLabelText(find('.so-list-box-group__label', list()), helper)
		},
	)

	it.each(SCHEMES)('%s: подпись — цвета подсказки Field', async (scheme) => {
		document.documentElement.dataset.soTheme = scheme

		const helper = await fieldHelper()

		await show()

		expect(getComputedStyle(find('.so-list-box-group__label', list())).color).toBe(
			getComputedStyle(helper).color,
		)
	})

	it('над текстом подписи и под ним свободно одинаково', async () => {
		await show({ groupSeparators: true })

		expectLabelSpace(list(), 'so-list-box')
	})

	it('разделитель — линия во всю ширину списка между секциями', async () => {
		await show({ groupSeparators: true })

		expectSeparators(list(), 'so-list-box')
	})

	it('без разделителя (по умолчанию) секции не слипаются', async () => {
		await show()

		expectApart(list(), 'so-list-box')
	})

	it('без разделителя секции стоят там же, где с ним: место линии пусто', async () => {
		await show({ groupSeparators: true })

		const separated = layoutOf(list(), 'so-list-box')

		cleanup()
		await show()

		expectSameLayout(layoutOf(list(), 'so-list-box'), separated)
	})

	/**
	 * Порядок стрелок — показанное, а строки стоят флексом по месту в составе:
	 * без секций в разметке подсветка прыгала бы по экрану в порядке данных.
	 */
	it('↓ ведёт подсветку сверху вниз по экрану: группа за группой, без группы — последней', async () => {
		await show()

		const highlighted = () =>
			document.querySelector<HTMLElement>('.so-list-box-item[data-highlighted="true"]')
		const texts: string[] = []
		let top = -Infinity

		list().focus()

		for (let step = 0; step < SCREEN_ORDER.length; step++) {
			const previous = highlighted()

			await userEvent.keyboard('{ArrowDown}')
			await expect.poll(highlighted).not.toBe(previous)

			const item = highlighted()

			if (!item) throw new Error('подсветки нет')

			const { top: next } = item.getBoundingClientRect()

			expect(next).toBeGreaterThan(top)

			top = next
			texts.push(item.textContent?.trim() ?? '')
		}

		expect(texts).toEqual(SCREEN_ORDER)
	})

	/**
	 * Строки в группах — не дети узла списка, и между ними стоят подпись и
	 * разделитель или его пустое место: предел считается по месту последней из
	 * первых строк.
	 */
	it.each([false, true])(
		'maxRows (groupSeparators: %s): в пределе — ровно первые строки вместе с подписями и местом между секциями',
		async (groupSeparators) => {
			await show({ maxRows: 3, groupSeparators })

			await expect.poll(() => list().style.overflowY).toBe('auto')
			await frames()

			expect(
				Math.abs(
					contentBottom(list()) -
						itemOf('so-list-box', 'Морковь').getBoundingClientRect().bottom,
				),
			).toBeLessThan(EPSILON)
		},
	)

	it('выбранный в группе за пределом — прокручен узел списка, а не группа', async () => {
		await show({ maxRows: 2, value: 'beet' })

		await expect.poll(() => list().scrollTop).toBeGreaterThan(0)

		const view = list().getBoundingClientRect()
		const selected = itemOf('so-list-box', 'Свёкла').getBoundingClientRect()

		expect(findAll('.so-list-box-group', list()).map((group) => group.scrollTop)).toEqual([
			0, 0,
		])
		expect(selected.top).toBeGreaterThanOrEqual(view.top - EPSILON)
		expect(selected.bottom).toBeLessThanOrEqual(view.bottom + EPSILON)
	})
})

/**
 * Список Select — в телепортированной панели, и модификатора размера Select
 * на ней нет: размер подписи тема берёт у строк её группы.
 */
describe('Select', () => {
	const panel = () => find('.so-select__panel')
	const list = () => find('.so-select__list', panel())

	async function open(props: Record<string, unknown> = {}): Promise<void> {
		render(
			defineComponent({
				render: () =>
					h('div', { style: 'padding: 40px; width: 320px' }, [
						h(Select, { items: ITEMS, groups: GROUPS, ...props }),
					]),
			}),
		)

		await nextTick()
		await frames()

		await userEvent.click(find('.so-select__field input'))
		await expect.poll(() => panel().dataset.open).toBe('true')
		await settled(panel())
		await frames()
	}

	it.each(COMPONENT_SIZES)(
		'%s: подпись — над опциями группы, текст по началу их текста, кегль мельче',
		async (size) => {
			await open({ size })

			expectLabels(list(), 'so-select')
		},
	)

	it('подпись растёт с размером Select', async () => {
		const sizes: number[] = []

		for (const size of COMPONENT_SIZES) {
			await open({ size })

			sizes.push(fontSize(find('.so-select-group__label', list())))
			cleanup()
		}

		expect(sizes).toEqual([...sizes].sort((a, b) => a - b))
		expect(new Set(sizes).size).toBe(COMPONENT_SIZES.length)
	})

	it.each(COMPONENT_SIZES)(
		'%s: подпись — заглавными, начертания подсказки Field, кегль и интерлиньяж её',
		async (size) => {
			const helper = await fieldHelper(size)

			await open({ size })

			expectLabelText(find('.so-select-group__label', list()), helper)
		},
	)

	it.each(SCHEMES)('%s: подпись — цвета подсказки Field', async (scheme) => {
		document.documentElement.dataset.soTheme = scheme

		const helper = await fieldHelper()

		await open()

		expect(getComputedStyle(find('.so-select-group__label', list())).color).toBe(
			getComputedStyle(helper).color,
		)
	})

	it('над текстом подписи и под ним свободно одинаково', async () => {
		await open({ groupSeparators: true })

		expectLabelSpace(list(), 'so-select')
	})

	it('разделитель — линия во всю ширину списка между секциями', async () => {
		await open({ groupSeparators: true })

		expectSeparators(list(), 'so-select')
	})

	it('без разделителя (по умолчанию) секции не слипаются', async () => {
		await open()

		expectApart(list(), 'so-select')
	})

	it('без разделителя секции стоят там же, где с ним: место линии пусто', async () => {
		await open({ groupSeparators: true })

		const separated = layoutOf(list(), 'so-select')

		cleanup()
		await open()

		expectSameLayout(layoutOf(list(), 'so-select'), separated)
	})

	it.each([false, true])(
		'maxRows (groupSeparators: %s): в пределе — ровно первые опции вместе с подписями и местом между секциями',
		async (groupSeparators) => {
			await open({ maxRows: 3, groupSeparators })

			await expect.poll(() => list().style.overflowY).toBe('auto')
			await frames()

			expect(
				Math.abs(
					contentBottom(list()) -
						itemOf('so-select', 'Морковь', panel()).getBoundingClientRect().bottom,
				),
			).toBeLessThan(EPSILON)
		},
	)
})

/**
 * Подпись группы меню — та же, что у ListBox и Select (`group.label`), а
 * размер её тема берёт с модификатора панели: панель телепортирована. Зазоров
 * у списка меню нет, и место над текстом подписи и под ним дают её поля.
 * Разделитель между секциями у меню по умолчанию есть; выключенный оставляет
 * пустым своё место — с полями, — как у списков.
 */
describe('Menu', () => {
	const panel = () => find('.so-menu__panel')
	const list = () => find('.so-menu__list', panel())

	async function open(props: Record<string, unknown> = {}): Promise<void> {
		render(
			defineComponent({
				render: () =>
					h('div', { style: 'padding: 40px' }, [
						h(
							Menu,
							{ items: ITEMS, groups: GROUPS, ...props },
							{
								trigger: ({ triggerAria, triggerDataset }: TTriggerScope) =>
									h(Button, {
										text: 'Действия',
										class: 'so-test-trigger',
										...triggerAria,
										...triggerDataset,
									}),
							},
						),
					]),
			}),
		)

		await nextTick()
		await frames()

		await userEvent.click(find('.so-test-trigger'))
		await expect.poll(() => getComputedStyle(panel()).display).not.toBe('none')
		await settled(panel())
		await frames()
	}

	it.each(COMPONENT_SIZES)(
		'%s: подпись — заглавными, начертания подсказки Field, кегль и интерлиньяж её',
		async (size) => {
			const helper = await fieldHelper(size)

			await open({ size })

			expectLabelText(find('.so-menu-group__label', panel()), helper)
		},
	)

	it.each(SCHEMES)('%s: подпись — цвета подсказки Field', async (scheme) => {
		document.documentElement.dataset.soTheme = scheme

		const helper = await fieldHelper()

		await open()

		expect(getComputedStyle(find('.so-menu-group__label', panel())).color).toBe(
			getComputedStyle(helper).color,
		)
	})

	it('поля подписи над текстом и под ним — поровну', async () => {
		await open()

		const { paddingTop, paddingBottom } = getComputedStyle(
			find('.so-menu-group__label', panel()),
		)

		expect(parseFloat(paddingTop)).toBeGreaterThan(0)
		expect(paddingBottom).toBe(paddingTop)
	})

	it('разделители между секциями — по умолчанию', async () => {
		await open()

		expect(findAll('.so-menu-separator', list())).toHaveLength(2)
	})

	it('groupSeparators=false: секции не слипаются', async () => {
		await open({ groupSeparators: false })

		expectApart(list(), 'so-menu')
	})

	it('без разделителя секции стоят там же, где с ним: место линии с полями пусто', async () => {
		await open()

		const separated = layoutOf(list(), 'so-menu')

		cleanup()
		await open({ groupSeparators: false })

		expectSameLayout(layoutOf(list(), 'so-menu'), separated)
	})
})

describe('manual separators', () => {
	it.each(['ListBox', 'Select'] as const)(
		'%s uses the existing data line geometry',
		async (kind) => {
			const component: Component = kind === 'Select' ? Select : ListBox
			const Group: Component = kind === 'Select' ? Select.Group : ListBox.Group
			const Item: Component = kind === 'Select' ? Select.Item : ListBox.Item
			const Separator: Component = kind === 'Select' ? Select.Separator : ListBox.Separator
			const block = kind === 'Select' ? 'so-select' : 'so-list-box'
			const items = [
				{ value: 'a', text: 'Apple', _: { group: 'first' } },
				{ value: 'b', text: 'Banana', _: { group: 'second' } },
			]
			const groups = [
				{ key: 'first', label: 'First' },
				{ key: 'second', label: 'Second' },
			]

			render(
				defineComponent({
					render: () =>
						h('div', { style: 'padding:40px;width:320px' }, [
							h(component, {
								items,
								groups,
								groupSeparators: true,
								open: true,
							}),
						]),
				}),
			)
			await nextTick()
			await frames(4)

			const dataList = find('.' + block + '__list')
			const dataLine = find('.' + block + '__separator', dataList)
			const dataBox = dataLine.getBoundingClientRect()
			const expected = {
				width: dataBox.width,
				height: dataBox.height,
				offset: dataBox.top - dataList.getBoundingClientRect().top,
				border: getComputedStyle(dataLine).borderTopWidth,
			}

			cleanup()
			render(
				defineComponent({
					render: () =>
						h('div', { style: 'padding:40px;width:320px' }, [
							h(component, { open: true }, () => [
								h(Group, { label: 'First' }, () =>
									h(Item, { value: 'a', text: 'Apple' }),
								),
								h(Separator),
								h(Group, { label: 'Second' }, () =>
									h(Item, { value: 'b', text: 'Banana' }),
								),
							]),
						]),
				}),
			)
			await nextTick()
			await frames(4)

			const list = find('.' + block + '__list')
			const line = find('.' + block + '__separator', list)
			const box = line.getBoundingClientRect()

			expect(getComputedStyle(line).display).not.toBe('none')
			expect(box.width).toBeGreaterThan(0)
			expect(Math.abs(box.width - expected.width)).toBeLessThan(EPSILON)
			expect(Math.abs(box.height - expected.height)).toBeLessThan(EPSILON)
			expect(
				Math.abs(box.top - list.getBoundingClientRect().top - expected.offset),
			).toBeLessThan(EPSILON)
			expect(getComputedStyle(line).borderTopWidth).toBe(expected.border)
		},
	)

	it('filtering a middle group leaves one line; filtering to one group leaves none', async () => {
		const { createEngineSelect } = await import('@soxa-ui/core')
		const engine = createEngineSelect()

		render(
			defineComponent({
				render: () =>
					h('div', { style: 'padding:40px;width:320px' }, [
						h(
							Select,
							{ engine, open: true, editable: true, editableMode: 'filter' },
							() => [
								h(Select.Group, { label: 'First' }, () =>
									h(Select.Item, { value: 'a', text: 'Keep Apple' }),
								),
								h(Select.Separator),
								h(Select.Group, { label: 'Second' }, () =>
									h(Select.Item, { value: 'b', text: 'Banana' }),
								),
								h(Select.Separator),
								h(Select.Group, { label: 'Third' }, () =>
									h(Select.Item, { value: 'c', text: 'Keep Cherry' }),
								),
							],
						),
					]),
			}),
		)
		await nextTick()
		await frames(4)

		const lines = () =>
			findAll('.so-select__separator').filter(
				(node) => getComputedStyle(node).display !== 'none',
			)

		expect(lines()).toHaveLength(2)

		engine.extensions.filter.query = 'Keep'
		await nextTick()
		await frames(3)

		expect(lines()).toHaveLength(1)
		const line = lines()[0].getBoundingClientRect()
		const first = findAll('.so-select-group')[0].getBoundingClientRect()
		const last = findAll('.so-select-group')[2].getBoundingClientRect()

		expect(line.top).toBeGreaterThanOrEqual(first.bottom - EPSILON)
		expect(last.top).toBeGreaterThan(line.bottom)

		engine.extensions.filter.query = 'Cherry'
		await nextTick()
		await frames(3)
		expect(lines()).toHaveLength(0)

		engine.extensions.filter.clear()
		await nextTick()
		await frames(3)
		expect(lines()).toHaveLength(2)
	})
})
