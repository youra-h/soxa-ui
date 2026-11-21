/**
 * Table in a real browser: the column layout, the head — the label and the
 * sort button next to it, — the row lines, the width handle and a selected row
 * in forced colors — the theme.
 *
 * The core computes the columns, cells, sorting, selection and column widths
 * by the place (`core/__tests__/table*.spec.ts`), the adapter the markup
 * (`ui/vue/__tests__/table.spec.ts`). Here is what jsdom doesn't compute at
 * all: widths, text boxes, names in the accessibility tree and colors. The
 * layout plugin measures the place for the columns — the width of the table's
 * window, — and the shared theme layer decides how the table lies
 * (`themes/base/src/components/table.css`): the layout is fixed, a column with
 * a width gets exactly it, a table with known widths is their sum, the window
 * scrolls a table wider than the place, and before the measure a column without
 * a width takes its minimum. The look is the theme's
 * (`themes/oren/src/components/table/_table.scss`): the lines are row borders,
 * not cell ones — under the head in the color of the `outlined` border, under a
 * row quieter than it, — and a selected row in forced colors mode takes the
 * system highlight.
 *
 * Playwright's real input drags the width handle: only so is it seen that the
 * pointer capture carries a drag past the strip to the header, and that an
 * arrow makes exactly one step — the core's, without the field's native step.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from './render'
import { commands, page, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref, type Ref } from 'vue'
import { createEngineTable } from '@soxa-ui/core'
import type {
	ITableColumn,
	TTableCollection,
	TTableColumnSource,
	TTableRecord,
} from '@soxa-ui/core'
import { useMotion } from '@soxa-ui/plugins'
import { Button, Table } from '@soxa-ui/vue'

import {
	find,
	iconPaint,
	opacity,
	outlined,
	pixel,
	settled,
	shift,
	style,
	systemColor,
} from './colors'
import { forcedColors } from './media'
import { forcedColorsRepaint, hoverAfterCapture, continuousTouch } from './engine'
import {
	delayOf,
	pausedPseudoTransition,
	pseudoSettled,
	pseudoTransitionRuns,
	transitionEvents,
	transitionRuns,
	transitioning,
} from './transitions'

import '@soxa-ui/theme-oren'

/** Tolerance for subpixel rounding, px. */
const EPSILON = 1

/** The side of the sort button's hit zone — the minimum pointer target of WCAG 2.5.8, px. */
const ZONE = 24

const RECORDS = [
	{ id: 1, name: 'Анна Смирнова', city: 'Казань', age: 30 },
	{ id: 2, name: 'Борис Петров', city: 'Омск', age: 41 },
	{ id: 3, name: 'Вера Иванова', city: 'Тверь', age: 25 },
]

const NAME: TTableColumnSource = { field: 'name', text: 'Имя', rowHeader: true, sortable: true }
const CITY: TTableColumnSource = { field: 'city', text: 'Город' }
const AGE: TTableColumnSource = {
	field: 'age',
	text: 'Возраст',
	align: 'end',
	width: 120,
	sortable: true,
}

/** A row engine with records and columns: through it the test selects and disables rows. */
function engineOf(columns: readonly TTableColumnSource[] = [NAME, CITY, AGE]): TTableCollection {
	const engine = createEngineTable({
		items: RECORDS.map((data: TTableRecord) => ({ data })),
	})

	engine.extensions.columns.columns = columns
	engine.extensions.selection.mode = 'multiple'

	return engine
}

/**
 * A table in a container of the given width and writing direction, with its
 * columns laid out: until the core's layout the theme decides the widths, and
 * the boxes a test takes then would move under it.
 */
async function mount(
	engine: TTableCollection,
	width = 600,
	dir: 'ltr' | 'rtl' = 'ltr',
	props: Record<string, unknown> = {},
): Promise<void> {
	render(
		defineComponent({
			render: () =>
				h('div', { dir, style: `width: ${width}px` }, [
					h(Table, { engine, aria_label: 'Сотрудники', ...props }),
				]),
		}),
	)

	await new Promise((resolve) => requestAnimationFrame(resolve))
	await laidOut()
}

/** The head's column headers, in order. */
const headers = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('.so-table-column')]

/** The body's rows, in order. */
const rows = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('.so-table-row')]

/**
 * The columns are laid out: the layout plugin measures the place a frame after
 * mounting, and until the core lays the columns out by it, the theme decides
 * their widths — and with them the headers' edges.
 */
async function laidOut(): Promise<void> {
	await expect.poll(() => headers().every((header) => header.dataset.sized === 'true')).toBe(true)
}

/**
 * The box of a node's text, not of the node: a label in a button and a value in
 * a cell stand in their own padding, and it is the letters that must line up,
 * not the boxes.
 */
function textBox(element: Element): DOMRect {
	const range = document.createRange()

	range.selectNodeContents(element)

	return range.getBoundingClientRect()
}

/** A node's width. */
const width = (element: Element) => element.getBoundingClientRect().width

/** The table's window — the node around it that scrolls sideways. */
const viewport = () => find('.so-table__viewport')

/**
 * The pointer to a point of the page. It hovers `body`: a drag's point lies past
 * the strip, or even past the table, and Playwright wouldn't take a hover on the
 * node itself there.
 */
async function pointAt(x: number, y: number): Promise<void> {
	const body = document.body.getBoundingClientRect()

	await userEvent.hover(document.body, { position: { x: x - body.left, y: y - body.top } })
}

/** An engine without the selection column: the head's widths are only data columns. */
function resizeEngine(columns: readonly TTableColumnSource[]): TTableCollection {
	const engine = engineOf(columns)

	engine.extensions.selection.mode = 'none'

	return engine
}

/** The collection's column by its field. */
function columnOf(engine: TTableCollection, field: string): ITableColumn {
	const found = engine.extensions.columns.columns.find((column) => column.field === field)

	if (!found) throw new Error(`колонки ${field} нет`)

	return found
}

/** The handle's strip in a header. */
const resizerOf = (header: Element) => find('.so-table-column__resizer', header)

/** The handle's field in a header. */
function fieldOf(header: Element): HTMLInputElement {
	const field = resizerOf(header).querySelector('input')

	if (!field) throw new Error('поля ручки нет')

	return field
}

/** Dragging a header's handle: a press in the strip's center, a shift along the window's axis, a release. */
async function drag(header: Element, dx: number): Promise<void> {
	const box = resizerOf(header).getBoundingClientRect()
	const x = box.left + box.width / 2
	const y = box.top + box.height / 2

	await pointAt(x, y)
	await commands.mouseDown()

	try {
		await pointAt(x + dx / 2, y)
		await pointAt(x + dx, y)
	} finally {
		await commands.mouseUp()
	}
}

afterEach(async () => {
	cleanup()
	await forcedColors('none')
})

/**
 * The core lays out the column widths — by the place of the table's window and
 * its `columnFit` (`core/__tests__/table-layout.spec.ts`); the plugin measures
 * the place a frame after mounting, so the test polls for the layout. The theme
 * puts the widths into the headers and, once all are known, makes the table as
 * wide as their sum.
 */
describe('ширина колонок', () => {
	it('колонка с шириной — ровно её, остальные делят оставшееся место', async () => {
		await mount(engineOf())

		const [name, city, age] = headers()
		const table = find('.so-table')

		await expect.poll(() => name.dataset.sized).toBe('true')

		expect(Math.abs(width(age) - 120)).toBeLessThanOrEqual(EPSILON)
		// The table is as wide as the place, and the columns without a width share the rest equally
		expect(Math.abs(width(table) - 600)).toBeLessThanOrEqual(EPSILON)
		expect(Math.abs(width(name) - width(city))).toBeLessThanOrEqual(EPSILON)
	})

	it('в тесном месте колонки без ширины — в ширине по умолчанию: таблица шире места, окно её прокручивает', async () => {
		await mount(engineOf(), 200)

		const [name, city] = headers()
		const table = find('.so-table')

		await expect.poll(() => width(name)).toBe(160)

		expect(width(city)).toBe(160)
		expect(width(table)).toBeGreaterThan(200)
		expect(Math.abs(width(viewport()) - 200)).toBeLessThanOrEqual(EPSILON)
		expect(style(viewport()).overflowX).toBe('auto')
		expect(viewport().scrollWidth).toBeGreaterThan(viewport().clientWidth)
	})

	it('до замера ширины решает тема: колонка без ширины — в своём минимуме', async () => {
		render(
			defineComponent({
				render: () =>
					h('div', { style: 'width: 200px' }, [
						h(Table, { engine: engineOf(), aria_label: 'Сотрудники' }),
					]),
			}),
		)

		// The same frame as the mount: the layout plugin hasn't measured the window
		// yet. The column's minimum is ten header font sizes in oren, and the cell
		// padding on top
		const [name] = headers()
		const minimum = parseFloat(style(name).fontSize) * 10

		expect(name.dataset.sized).toBe('false')
		expect(width(name)).toBeGreaterThanOrEqual(minimum)
		expect(find('.so-table').hasAttribute('data-overflow')).toBe(false)
	})

	/**
	 * Before the measure, in a place wider than the columns, the table is the sum
	 * of their widths, not the place: as wide as the place, it would hand the
	 * excess out to every column, the selection column included, and the layout
	 * plugin, measuring that column with its share, would give the core a place
	 * short by it — the columns would be laid out twice. So the selection column
	 * is as wide before the measure as after it, and the first layout is the final
	 * one.
	 */
	it('до замера в широком месте таблица — сумма колонок: колонка выбора своей ширины, раскладка — с первого раза', async () => {
		render(
			defineComponent({
				render: () =>
					h('div', { style: 'width: 600px' }, [
						h(Table, { engine: engineOf(), aria_label: 'Сотрудники' }),
					]),
			}),
		)

		// The same frame as the mount: the layout plugin hasn't measured the window yet
		const table = find('.so-table')
		const select = find('.so-table__select')
		const sum = () => [select, ...headers()].reduce((total, cell) => total + width(cell), 0)
		const before = width(select)

		expect(table.hasAttribute('data-overflow')).toBe(false)
		expect(width(table)).toBeLessThan(600)
		expect(Math.abs(width(table) - sum())).toBeLessThanOrEqual(EPSILON)

		await laidOut()

		expect(Math.abs(width(select) - before)).toBeLessThanOrEqual(EPSILON)
		expect(Math.abs(width(table) - 600)).toBeLessThanOrEqual(EPSILON)
	})
})

/**
 * `columnFit` — how the columns without a width of their own share the window's
 * place: `none` — they stand at the default width, `auto` — they grow up to
 * `maxWidth` to the window's full width, `contain` — they fill the window
 * exactly, shrinking down to `minWidth`. They don't fit — the window scrolls the
 * table sideways (`data-overflow`), except with a sticky head: then the
 * container scrolls.
 */
describe('раскладка колонок', () => {
	const NAME_FLEX: TTableColumnSource = {
		field: 'name',
		text: 'Имя',
		rowHeader: true,
		minWidth: 120,
	}
	const CITY_FLEX: TTableColumnSource = { field: 'city', text: 'Город', minWidth: 100 }

	/** A table in a place whose width the test changes on the fly, with the table's props. */
	async function mountIn(
		engine: TTableCollection,
		place: Ref<number>,
		props: Record<string, unknown> = {},
	): Promise<void> {
		render(
			defineComponent({
				render: () =>
					h('div', { style: `width: ${place.value}px` }, [
						h(Table, { engine, aria_label: 'Сотрудники', ...props }),
					]),
			}),
		)

		await new Promise((resolve) => requestAnimationFrame(resolve))
	}

	it('none — таблица шириной в сумму ширин по умолчанию, хоть место и шире', async () => {
		await mountIn(resizeEngine([NAME_FLEX, CITY_FLEX]), ref(400), { columnFit: 'none' })

		const table = find('.so-table')

		await expect.poll(() => width(table)).toBe(320)

		expect(headers().map(width)).toEqual([160, 160])
		await expect.poll(() => table.dataset.overflow).toBe('false')
		expect(style(viewport()).overflowX).toBe('clip')
	})

	it('auto — гибкие растут до maxWidth: упёрлись все — таблица уже окна', async () => {
		const engine = resizeEngine([
			{ ...NAME_FLEX, maxWidth: 150 },
			{ ...CITY_FLEX, maxWidth: 180 },
		])

		await mountIn(engine, ref(400))

		const table = find('.so-table')

		await expect.poll(() => width(table)).toBe(330)

		expect(headers().map(width)).toEqual([150, 180])
	})

	it('contain — таблица шириной в окно; окно сузилось — колонки сжимаются до minWidth, дальше окно прокручивает', async () => {
		const place = ref(400)

		await mountIn(resizeEngine([NAME_FLEX, CITY_FLEX]), place, { columnFit: 'contain' })

		const table = find('.so-table')

		await expect.poll(() => headers().map(width)).toEqual([200, 200])
		expect(Math.abs(width(table) - 400)).toBeLessThanOrEqual(EPSILON)
		expect(viewport().scrollWidth).toBe(viewport().clientWidth)

		place.value = 250

		// Below the default width: `contain` shrinks, while `auto` would stay at 160
		await expect.poll(() => headers().map(width)).toEqual([125, 125])
		expect(Math.abs(width(table) - 250)).toBeLessThanOrEqual(EPSILON)

		place.value = 200

		await expect.poll(() => headers().map(width)).toEqual([120, 100])
		await expect.poll(() => table.dataset.overflow).toBe('true')
		expect(style(viewport()).overflowX).toBe('auto')
		expect(viewport().scrollWidth).toBeGreaterThan(viewport().clientWidth)
	})

	it('колонка выбора — не место колонок: auto заполняет окно вместе с ней', async () => {
		const engine = engineOf([NAME_FLEX, CITY_FLEX])

		await mountIn(engine, ref(400))

		const table = find('.so-table')
		const select = find('.so-table__select')
		const columns = () => headers().reduce((sum, header) => sum + width(header), 0)

		await expect.poll(() => headers()[0].dataset.sized).toBe('true')

		// The columns took the window without the selection column: with it the table fits the window exactly
		expect(Math.abs(width(select) + columns() - 400)).toBeLessThanOrEqual(EPSILON)
		expect(Math.abs(width(table) - 400)).toBeLessThanOrEqual(EPSILON)
		expect(table.dataset.overflow).toBe('false')
	})

	/**
	 * The table doesn't clip a column dragged past the window's edge: the columns
	 * became wider than the place — the window scrolls the table sideways, and the
	 * container around it doesn't grow.
	 */
	it('протяжка последней колонки за край — окно прокручивается', async () => {
		const engine = resizeEngine([
			{ ...NAME_FLEX, width: 100 },
			{ ...CITY_FLEX, width: 100, resizable: true },
		])

		render(
			defineComponent({
				render: () =>
					h('div', { class: 'so-test-scroll', style: 'width: 300px; overflow: auto' }, [
						h(Table, { engine, aria_label: 'Сотрудники' }),
					]),
			}),
		)
		await new Promise((resolve) => requestAnimationFrame(resolve))

		const [, city] = headers()

		await expect.poll(() => city.querySelector('.so-table-column__resizer')).not.toBeNull()
		await drag(city, 140)

		const scroller = find('.so-test-scroll')

		await expect.poll(() => find('.so-table').dataset.overflow).toBe('true')
		expect(width(city)).toBe(240)
		expect(style(viewport()).overflowX).toBe('auto')
		expect(viewport().scrollWidth).toBeGreaterThan(viewport().clientWidth)
		// The window scrolls, not the container around it
		expect(scroller.scrollWidth).toBe(scroller.clientWidth)
	})

	it('с закреплённой шапкой окно не прокручивается: вбок прокручивает контейнер', async () => {
		const engine = resizeEngine([
			{ ...NAME_FLEX, width: 200 },
			{ ...CITY_FLEX, width: 200 },
		])

		render(
			defineComponent({
				render: () =>
					h('div', { class: 'so-test-scroll', style: 'width: 300px; overflow: auto' }, [
						h(Table, { engine, stickyHead: true, aria_label: 'Сотрудники' }),
					]),
			}),
		)
		await new Promise((resolve) => requestAnimationFrame(resolve))

		const scroller = find('.so-test-scroll')

		await expect.poll(() => find('.so-table').dataset.overflow).toBe('true')
		expect(style(viewport()).overflowX).toBe('visible')
		expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth)
	})
})

/**
 * Every column has a label, and on a sortable one it is the head cell's text
 * too, not the button's: the sort button stands next to the label and doesn't
 * move it.
 */
describe('подпись шапки вровень с текстом ячеек', () => {
	it('сортируемая колонка по началу: подпись — над началом текста ячеек', async () => {
		await mount(engineOf())

		const header = find('.so-table-column__text', headers()[0])
		const cell = rows()[0].querySelector('th')

		if (!cell) throw new Error('заголовка строки нет')

		expect(Math.abs(textBox(header).left - textBox(cell).left)).toBeLessThanOrEqual(EPSILON)
	})

	it('сортируемая колонка по концу: подпись — над концом чисел, кнопка её не сдвигает', async () => {
		await mount(engineOf())

		const header = find('.so-table-column__text', headers()[2])
		const cell = rows()[0].children[3]

		expect(Math.abs(textBox(header).right - textBox(cell).right)).toBeLessThanOrEqual(EPSILON)
	})

	it('несортируемая колонка: подпись — над текстом ячеек', async () => {
		await mount(engineOf())

		const header = find('.so-table-column__text', headers()[1])
		const cell = rows()[0].children[2]

		expect(Math.abs(textBox(header).left - textBox(cell).left)).toBeLessThanOrEqual(EPSILON)
	})
})

/**
 * A column's head is the label and a small sort button next to it. The button
 * sorts, and a press on the cell does nothing: the consumer puts their own
 * control into the label. The button is a square around the arrow in the
 * header's font, right after the label (before it in a column at the end), with
 * a hit zone of at least 24 px and a focus ring around itself. An unsorted
 * column's arrow is invisible at rest and shows at half strength when the
 * pointer reaches for the header. A header acted upon as a whole — with a width
 * handle or reordering — is highlighted with a rectangle from line to line, and
 * one sees where the column ends; a sortable one is not. The header's top
 * corners are softer — half the button's rounding, the bottom ones square.
 */
describe('заголовок колонки', () => {
	/** How far the arrow is from the label at any alignment: the row's gap and the button's padding, no more. */
	const GAP = 8

	/** The label, the sort button and its arrow in a header. */
	function sortParts(header: Element) {
		const button = find('.so-table-column__sort', header)

		return {
			button,
			text: textBox(find('.so-table-column__text', header)),
			icon: find('.so-table-column__sort-icon', button).getBoundingClientRect(),
		}
	}

	/** The opacity of the sort button's arrow in a header, once the transition is over. */
	async function arrowOf(header: Element): Promise<number> {
		await settled(header)

		return parseFloat(style(find('.so-table-column__sort-icon', header)).opacity)
	}

	/** A header's background without the pointer on it — and with the pointer in its middle. */
	async function hoverBackground(header: Element): Promise<{ idle: string; hover: string }> {
		await userEvent.hover(find('.so-test-away'))
		await settled(header)

		const idle = style(header).backgroundColor
		const box = header.getBoundingClientRect()

		await userEvent.hover(header, { position: { x: box.width / 2, y: box.height / 2 } })
		await settled(header)

		return { idle, hover: style(header).backgroundColor }
	}

	/** A table with an "away" bar over it: the pointer is taken there. */
	async function mountAway(engine: TTableCollection, disabled = false): Promise<void> {
		render(
			defineComponent({
				render: () =>
					h('div', { style: 'width: 600px' }, [
						h('div', { class: 'so-test-away', style: 'height: 24px' }),
						h(Table, { engine, disabled, aria_label: 'Сотрудники' }),
					]),
			}),
		)

		await new Promise((resolve) => requestAnimationFrame(resolve))
	}

	/** A node's middle. */
	function middleOf(element: Element): { x: number; y: number } {
		const box = element.getBoundingClientRect()

		return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
	}

	it('кнопка — квадрат вокруг стрелки в кегль заголовка; номер приоритета её расширяет', async () => {
		const engine = engineOf()

		await mount(engine)

		const [name, , age] = headers()
		const { button, icon } = sortParts(name)
		const own = button.getBoundingClientRect()
		const size = parseFloat(style(name).fontSize)

		// The arrow is in the header's font and color, the button a square with
		// padding around it
		expect(style(button).color).toBe(style(name).color)
		expect(Math.abs(icon.width - size)).toBeLessThanOrEqual(EPSILON)
		expect(Math.abs(icon.height - size)).toBeLessThanOrEqual(EPSILON)
		expect(Math.abs(own.width - own.height)).toBeLessThanOrEqual(EPSILON)
		expect(own.width).toBeGreaterThan(icon.width)
		expect(own.width - icon.width).toBeLessThanOrEqual(GAP)
		// The button is smaller than the head row and doesn't stretch it
		expect(own.height).toBeLessThan(name.getBoundingClientRect().height)

		engine.extensions.sort.sortMode = 'multiple'
		engine.extensions.sort.sort = [
			{ field: 'name', direction: 'asc' },
			{ field: 'age', direction: 'desc' },
		]

		// Both sorted columns get a priority number, and the button is wider than a square
		await expect
			.poll(() => find('.so-table-column__sort', age).getBoundingClientRect().width)
			.toBeGreaterThan(own.width + EPSILON)
		expect(find('.so-table-column__sort', name).getBoundingClientRect().height).toBe(own.height)
	})

	it('кнопка — сразу за подписью, у колонки по концу — перед ней', async () => {
		await mount(engineOf())

		const start = sortParts(headers()[0])

		expect(start.icon.left).toBeGreaterThanOrEqual(start.text.right - EPSILON)
		expect(start.icon.left - start.text.right).toBeLessThanOrEqual(GAP)

		const end = sortParts(headers()[2])

		expect(end.icon.right).toBeLessThanOrEqual(end.text.left + EPSILON)
		expect(end.text.left - end.icon.right).toBeLessThanOrEqual(GAP)
	})

	/**
	 * The button is smaller than the minimum pointer target, and the hit zone is
	 * an invisible square centered on it: a press there is a press on the button.
	 * The zone doesn't reach over the label — the consumer's own control in the
	 * label is pressable whole.
	 */
	it('зона нажатия кнопки — не меньше 24 px и на подпись не заходит', async () => {
		await mount(engineOf())

		const header = headers()[0]
		const { button, text } = sortParts(header)
		const caption = find('.so-table-column__text', header)
		const { x, y } = middleOf(button)
		const reach = ZONE / 2 - 0.5

		expect(button.getBoundingClientRect().width).toBeLessThan(ZONE)

		for (const [dx, dy] of [
			[-reach, 0],
			[reach, 0],
			[0, -reach],
			[0, reach],
		]) {
			expect(button.contains(document.elementFromPoint(x + dx, y + dy)), `${dx}, ${dy}`).toBe(
				true,
			)
		}

		expect(caption.contains(document.elementFromPoint(text.right - 1, y))).toBe(true)
	})

	it('кольцо фокуса — вокруг кнопки, внутри заголовка', async () => {
		await mount(engineOf())

		const header = headers()[0]
		const { button } = sortParts(header)

		button.focus({ focusVisible: true })
		await settled(button)

		const ring = style(button)
		const reach = parseFloat(ring.outlineOffset) + parseFloat(ring.outlineWidth)
		const own = button.getBoundingClientRect()
		const cell = header.getBoundingClientRect()

		expect(outlined(button)).toBe(true)
		expect(parseFloat(ring.outlineOffset)).toBeGreaterThanOrEqual(0)
		expect(own.left - reach).toBeGreaterThanOrEqual(cell.left)
		expect(own.right + reach).toBeLessThanOrEqual(cell.right)
		expect(own.top - reach).toBeGreaterThanOrEqual(cell.top)
		expect(own.bottom + reach).toBeLessThanOrEqual(cell.bottom)
	})

	it('стрелка неотсортированной колонки: на покое невидима, вполсилы — при наведении на заголовок и фокусе кнопки', async () => {
		const engine = engineOf()

		await mountAway(engine)

		const [name, , age] = headers()
		const caption = find('.so-table-column__text', name)

		expect(matchMedia('(hover: hover)').matches).toBe(true)
		expect(await arrowOf(name)).toBe(0)

		// The pointer on the label, not on the button: it reaches for the header
		await userEvent.hover(caption)

		expect(await arrowOf(name)).toBe(0.5)

		await userEvent.hover(find('.so-test-away'))

		expect(await arrowOf(name)).toBe(0)

		find('.so-table-column__sort', name).focus({ focusVisible: true })

		expect(await arrowOf(name)).toBe(0.5)

		// A sorted one — whole
		engine.extensions.sort.sort = [{ field: 'age', direction: 'asc' }]

		await expect.poll(() => age.dataset.sort).toBe('asc')
		expect(await arrowOf(age)).toBe(1)
	})

	it('у выключенной таблицы стрелка неотсортированной колонки не проступает', async () => {
		await mountAway(engineOf(), true)

		const [name] = headers()

		await userEvent.hover(find('.so-table-column__text', name))

		expect(await arrowOf(name)).toBe(0)
	})

	it('верхние углы заголовка — вполовину скругления кнопки, нижние прямые', async () => {
		render(
			defineComponent({
				render: () =>
					h('div', { style: 'width: 600px' }, [
						h(Table, { engine: engineOf(), aria_label: 'Сотрудники' }),
						h(Button, { class: 'so-test-button', text: 'Кнопка' }),
					]),
			}),
		)
		await new Promise((resolve) => requestAnimationFrame(resolve))

		const header = headers()[0]
		const half = parseFloat(style(find('.so-test-button')).borderTopLeftRadius) / 2

		expect(half).toBeGreaterThan(0)
		expect(parseFloat(style(header).borderTopLeftRadius)).toBe(half)
		expect(parseFloat(style(header).borderTopRightRadius)).toBe(half)
		expect(style(header).borderBottomLeftRadius).toBe('0px')
		expect(style(header).borderBottomRightRadius).toBe('0px')
	})

	/**
	 * The button sorts, not the cell: highlighting the cell would promise a
	 * response that won't come. The button shows its own hover and press.
	 */
	it('сортируемый заголовок под указателем не подсвечен, и нажатие кнопки его не подсвечивает', async () => {
		await mountAway(engineOf())

		const [name, city] = headers()
		const sortable = await hoverBackground(name)

		expect(opacity(sortable.idle)).toBe(0)
		expect(opacity(sortable.hover)).toBe(0)
		expect(opacity((await hoverBackground(city)).hover)).toBe(0)

		const button = find('.so-table-column__sort', name)
		const { x, y } = middleOf(button)

		await pointAt(x, y)
		await commands.mouseDown()

		try {
			await settled(name)

			expect(opacity(style(name).backgroundColor)).toBe(0)
			// The pressed button shows by its own veil
			expect(opacity(style(button).backgroundColor)).toBeGreaterThan(0)
		} finally {
			await commands.mouseUp()
		}

		await expect.poll(() => name.dataset.sort).toBe('asc')
	})

	it('заголовок с ручкой ширины и тот, что можно перетащить, подсвечены одинаково', async () => {
		await mountAway(
			engineOf([
				{ ...NAME, resizable: true, width: 160 },
				{ ...CITY, reorderable: true },
			]),
		)

		const [name, city] = headers()
		const resizable = await hoverBackground(name)
		const reorderable = await hoverBackground(city)

		expect(opacity(resizable.idle)).toBe(0)
		expect(opacity(resizable.hover)).toBeGreaterThan(0)
		expect(pixel([reorderable.hover])).toEqual(pixel([resizable.hover]))
	})

	it('у выключенной таблицы подсветки нет', async () => {
		await mountAway(engineOf([NAME, { ...CITY, reorderable: true }]), true)

		const { hover } = await hoverBackground(headers()[1])

		expect(opacity(hover)).toBe(0)
	})

	/**
	 * The button draws the arrow in its text color — the header's color. In forced
	 * colors mode the browser replaces it, and the arrow stays visible; the focus
	 * ring takes the system focus color, as on any button.
	 */
	it('принудительные цвета: стрелка — цветом текста кнопки, кольцо фокуса — системным цветом фокуса', async () => {
		const engine = engineOf()

		engine.extensions.sort.sort = [{ field: 'name', direction: 'asc' }]
		await mount(engine)
		await forcedColors('active')

		const button = find('.so-table-column__sort', headers()[0])
		const arrow = button.querySelector('.so-table-column__sort-icon svg')

		if (!arrow) throw new Error('стрелки нет')

		expect(opacity(style(button).color)).toBe(1)
		expect(pixel([iconPaint(arrow)])).toEqual(pixel([style(button).color]))
		expect(await arrowOf(headers()[0])).toBe(1)

		button.focus({ focusVisible: true })
		await settled(button)

		expect(pixel([style(button).outlineColor])).toEqual(pixel([systemColor('Highlight')]))
	})
})

describe('линии строк', () => {
	/**
	 * A disabled row fades its data cells. The row draws the line under itself — a
	 * border in the collapsed border model, — and the cells don't fade it: had the
	 * line faded with the cells, it would run pale under the data and whole under
	 * the checkbox.
	 */
	it('под выключенной строкой линия та же, что под соседней', async () => {
		const engine = engineOf()

		engine.extensions.batch.items[1].disabled = true
		await mount(engine)

		const [enabled, disabled] = rows()
		const cell = disabled.querySelector('.so-table-row__cell')

		if (!cell) throw new Error('ячейки нет')

		expect(parseFloat(style(cell).opacity)).toBeLessThan(1)
		expect(style(disabled).opacity).toBe('1')
		expect(style(disabled).borderBottomStyle).toBe('solid')
		expect(pixel([style(disabled).borderBottomColor])).toEqual(
			pixel([style(enabled).borderBottomColor]),
		)
	})

	/**
	 * The color of the lines. Under the head — a border: the same step as Button's
	 * `outlined` border. Under a row — quieter than the head: a veil of the neutral
	 * at the density of the `filled` fill, a step off what the table stands on. At
	 * step 400 the head's line burned brighter than any border nearby, and no step
	 * gives a row line quieter than a border: 200 on the dark scheme's control
	 * surface is the surface itself.
	 *
	 * The test doesn't know the palette, nor does the guard of Button's views
	 * (`button-view.spec.ts`): it checks the head's line against the border of the
	 * button nearby and measures a row's line — how far it went from the backdrop
	 * toward the cell's text.
	 */
	describe('цвет', () => {
		/** Both schemes: the rule is shared, the backdrops differ. */
		const SCHEMES = ['oren', 'oren-dark'] as const

		type TScheme = (typeof SCHEMES)[number]

		/**
		 * Where the table stands: on the page and on the control surface — in a card,
		 * in the panel of Popover and Dialog.
		 */
		const BACKDROPS = {
			страница: 'var(--so-neutral-50)',
			'поверхность контрола': 'var(--so-component-surface)',
		} as const

		type TBackdrop = keyof typeof BACKDROPS

		const CASES = SCHEMES.flatMap((scheme) =>
			(Object.keys(BACKDROPS) as TBackdrop[]).map((backdrop) => ({ scheme, backdrop })),
		)

		/**
		 * The threshold of a row line's visibility by OKLab lightness — the same as
		 * Button's neutral `filled` fill: the line is a veil of the same density.
		 */
		const VISIBLE_LINE = 0.02

		afterEach(() => {
			delete document.documentElement.dataset.soTheme
		})

		/**
		 * The scene: on each backdrop — a table and an `outlined` button next to it.
		 * The pointer is taken away: under it the button's border is stronger.
		 */
		async function showLines(scheme: TScheme): Promise<void> {
			document.documentElement.dataset.soTheme = scheme
			render(
				defineComponent({
					render: () =>
						h('div', [
							h('div', { class: 'so-test-away', style: 'height: 24px' }),
							...Object.entries(BACKDROPS).map(([name, color]) =>
								h(
									'div',
									{
										key: name,
										'data-backdrop': name,
										style: `background: ${color}; padding: 8px`,
									},
									[
										h(Table, { engine: engineOf(), aria_label: 'Сотрудники' }),
										h(Button, { view: 'outlined', text: 'Рамка' }),
									],
								),
							),
						]),
				}),
			)

			await new Promise((resolve) => requestAnimationFrame(resolve))
			await userEvent.hover(find('.so-test-away'))
			await settled(document.body)
		}

		/** The scene's parts on a backdrop: the backdrop, the head row, a body row, its cell and the button. */
		const partsOf = (backdrop: TBackdrop) => {
			const root = find(`[data-backdrop="${backdrop}"]`)

			return {
				root,
				head: find('.so-table__head-row', root),
				row: find('.so-table-row', root),
				cell: find('.so-table-row__cell', root),
				button: find('.so-button--view-outlined', root),
			}
		}

		/** How far the line went from the backdrop toward the cell's text; a minus — past the backdrop. */
		function away(line: Element, backdrop: TBackdrop): number {
			const { root, cell } = partsOf(backdrop)
			const under = style(root).backgroundColor

			return (
				shift(style(line).borderBottomColor, under) *
				Math.sign(shift(style(cell).color, under))
			)
		}

		it.each(CASES)(
			'$scheme, $backdrop: линия шапки — цвета рамки outlined',
			async (scenario) => {
				await showLines(scenario.scheme)

				const { head, button } = partsOf(scenario.backdrop)

				expect(pixel([style(head).borderBottomColor])).toEqual(
					pixel([style(button).borderTopColor]),
				)
			},
		)

		it.each(CASES)(
			'$scheme, $backdrop: линия строки уходит от подложки к тексту и тише шапки',
			async (scenario) => {
				await showLines(scenario.scheme)

				const { head, row } = partsOf(scenario.backdrop)
				const line = away(row, scenario.backdrop)

				expect(line).toBeGreaterThan(VISIBLE_LINE)
				expect(line).toBeLessThan(away(head, scenario.backdrop))
			},
		)

		/**
		 * A row's line is a veil, that is a color with transparency. In this mode the
		 * browser keeps a background's transparency, and a line it painted the same way
		 * would vanish. It must take the system text color, like the borders the
		 * browser paints itself.
		 */
		describe.runIf(forcedColorsRepaint)('принудительные цвета', () => {
			it.each(SCHEMES)('%s: линия строки — цветом текста системы', async (scheme) => {
				await forcedColors('active')
				await showLines(scheme)

				const { row } = partsOf('страница')

				expect(pixel([style(row).borderBottomColor])).toEqual(
					pixel([systemColor('CanvasText')]),
				)
			})
		})
	})
})

/**
 * Columns are moved by their header: while it is carried, it alone follows the
 * pointer, and the column takes its new place in one move once the released
 * header has reached it. With motion the neighbours make room for it and there
 * is no drop line; the body stands still in `head` and follows the headers in
 * `column`. Without motion the neighbours stand, and a line shows the place. A
 * press without a drag stays a press of the sort button, and a drag doesn't
 * press it. The keys are Ctrl+Shift+←/→ on the button, and focus stays on it.
 *
 * The run goes with motion: the system doesn't reduce it, and the app's mode is
 * the system's. The column takes its place not on the release but once the
 * header has arrived — the test polls for the order after the release.
 */
describe('перестановка колонок', () => {
	const MOVABLE = [NAME, CITY, AGE].map((column) => ({ ...column, reorderable: true }))

	/**
	 * The place isn't wider than the run's window (414 px): a drag past the
	 * window's edge would scroll the page, and the boxes before and after the drag
	 * would differ by the scroll.
	 */
	const PLACE = 400

	/** An engine without the selection column: the head's headers are only data columns. */
	function moveEngine(): TTableCollection {
		const engine = engineOf(MOVABLE)

		engine.extensions.selection.mode = 'none'

		return engine
	}

	/** A table with props in the `PLACE` place. */
	async function mountWith(
		engine: TTableCollection,
		props: Record<string, unknown>,
	): Promise<void> {
		render(
			defineComponent({
				render: () =>
					h('div', { style: `width: ${PLACE}px` }, [
						h(Table, { engine, aria_label: 'Сотрудники', ...props }),
					]),
			}),
		)

		await new Promise((resolve) => requestAnimationFrame(resolve))
	}

	const fieldsOf = (engine: TTableCollection) =>
		engine.extensions.columns.columns.map((column) => column.field)

	/** A node's middle. */
	function middleOf(element: Element): { x: number; y: number } {
		const box = element.getBoundingClientRect()

		return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
	}

	/** A node's left edge. */
	const left = (element: Element) => element.getBoundingClientRect().left

	/** The nodes' edges match — within the subpixel tolerance. */
	const near = (actual: readonly number[], expected: readonly number[]): boolean =>
		actual.length === expected.length &&
		actual.every((value, index) => Math.abs(value - expected[index]) <= EPSILON)

	/** The rows' cells — all of them, row by row. */
	const cells = (): HTMLElement[] => [
		...document.querySelectorAll<HTMLElement>('.so-table-row__cell'),
	]

	/** The shifts running as a transition — on the headers and the cells. */
	const moving = (): string[] =>
		[...headers(), ...cells()].flatMap((element) =>
			transitioning(element).filter((property) => property === 'translate'),
		)

	/**
	 * Take a header by its middle and carry the pointer to the row's point `x`:
	 * first past the gesture's threshold toward it, then there. The button stays
	 * pressed — the test releases it. Toward the point, not always to the right: on
	 * the last column a step to the right would go past the run window's edge.
	 */
	async function carry(header: Element, x: number): Promise<void> {
		const from = middleOf(header)

		await pointAt(from.x, from.y)
		await commands.mouseDown()
		await pointAt(from.x + Math.sign(x - from.x) * 40, from.y)
		await pointAt(x, from.y)
	}

	it('тащат заголовок — сосед уступает место, строки на месте; отпустили — колонка на новом месте', async () => {
		const engine = moveEngine()
		const moves: string[][] = []

		engine.extensions.columns.events.on('column:move', ({ order }) => moves.push(order))
		await mount(engine, PLACE)
		await laidOut()

		const [name, city, age] = headers()
		const cell = rows()[0].children[0]
		const cityCell = rows()[0].children[1]
		const before = {
			name: name.getBoundingClientRect(),
			city: left(city),
			age: left(age),
			cells: [left(cell), left(cityCell)],
		}
		const runs = transitionRuns(city)

		try {
			await carry(name, middleOf(city).x + 10)

			// The header follows the pointer
			expect(name.dataset.dragging).toBe('true')
			expect(left(name) - before.name.left).toBeGreaterThan(100)
			// The neighbour makes room by the carried one's width — with a transition; no drop line
			expect(city.dataset.shift).toBe('start')
			await expect
				.poll(() => near([left(city)], [before.city - before.name.width]))
				.toBe(true)
			expect(runs).toContain('translate')
			expect(city.dataset.drop).toBe('after')
			expect(style(city, '::before').display).toBe('none')
			// The far neighbour and the rows' cells stay in place
			expect(near([left(age)], [before.age])).toBe(true)
			expect(near([left(cell), left(cityCell)], before.cells)).toBe(true)
			expect(fieldsOf(engine)).toEqual(['name', 'city', 'age'])
		} finally {
			await commands.mouseUp()
		}

		await expect.poll(() => fieldsOf(engine)).toEqual(['city', 'name', 'age'])
		expect(moves).toEqual([['city', 'name', 'age']])

		await expect
			.poll(() => headers().map((header) => header.textContent?.trim()))
			.toEqual(['Город', 'Имя', 'Возраст'])

		// The rows' cells are in the new order, the marks and shifts are gone
		expect(rows()[0].children[1].textContent?.trim()).toBe('Анна Смирнова')
		expect(headers()[1].dataset.dragging).toBeUndefined()
		expect(headers()[1].dataset.landing).toBeUndefined()
		expect(headers()[0].dataset.shift).toBeUndefined()
		expect(headers()[1].style.getPropertyValue('--so-table-column-drag')).toBe('')
		expect(find('.so-table').style.getPropertyValue('--so-table-column-shift')).toBe('')
	})

	/**
	 * A finger is not a mouse. The browser captures a touch to the header's node
	 * under the finger by itself, and the gesture's start, moving the capture to the
	 * root, takes the capture from that node: its `lostpointercapture` bubbles up to
	 * the root. The drag is a DevTools protocol command (`commands.touchDrag`), from
	 * the header's middle past the neighbour's middle.
	 */
	it.runIf(continuousTouch)(
		'пальцем — колонка на новом месте, column:move один раз',
		async () => {
			const engine = moveEngine()
			const moves: string[][] = []

			engine.extensions.columns.events.on('column:move', ({ order }) => moves.push(order))
			await mount(engine, PLACE)
			await laidOut()

			const [name, city] = headers()

			await commands.touchDrag(
				'.so-table-column:first-child',
				middleOf(city).x + 10 - middleOf(name).x,
				0,
			)

			await expect.poll(() => fieldsOf(engine)).toEqual(['city', 'name', 'age'])
			expect(moves).toEqual([['city', 'name', 'age']])
			await expect
				.poll(() => headers().map((header) => header.textContent?.trim()))
				.toEqual(['Город', 'Имя', 'Возраст'])
		},
	)

	/**
	 * While a header is carried — the "grabbing" cursor and no selection over the
	 * whole table: the pointer leaves its header. The theme sets them by the root
	 * flag (`data-dragging`), which the core keeps only in a gesture, landing
	 * included, — once the column has landed, a body cell is the same as before the
	 * gesture.
	 */
	it('несут заголовок — курсор «тащу» и без выделения на всей таблице; встал — как было', async () => {
		const engine = moveEngine()

		await mount(engine, PLACE)
		await laidOut()

		const [name, city] = headers()
		const table = find('.so-table')
		const cell = () => find('.so-table-row__cell')
		const rest = { cursor: style(cell()).cursor, select: style(table).userSelect }

		expect(rest.cursor).not.toBe('grabbing')
		expect(rest.select).not.toBe('none')
		expect(table.hasAttribute('data-dragging')).toBe(false)

		try {
			await carry(name, middleOf(city).x + 10)

			expect(name.dataset.dragging).toBe('true')
			await expect.poll(() => style(cell()).cursor).toBe('grabbing')
			expect(style(table).userSelect).toBe('none')
		} finally {
			await commands.mouseUp()
		}

		await expect.poll(() => fieldsOf(engine)).toEqual(['city', 'name', 'age'])
		await expect.poll(() => table.hasAttribute('data-dragging')).toBe(false)
		expect(style(cell()).cursor).toBe(rest.cursor)
		expect(style(table).userSelect).toBe(rest.select)
	})

	/**
	 * The column is moved once the released header has landed: by then it and the
	 * shifted neighbours stand where the new layout will put them, and the
	 * transitions leave with the gesture — nothing slides back. The headers' boxes
	 * are taken in `column:move` — the move is in the model already, and Vue hasn't
	 * repainted yet, — and those of the headers and the first row's cells right
	 * after the repaint and once more when a shift transition, had it started,
	 * would have finished. From `column:move` the table root also listens to the
	 * shift's `transitionrun`: the event bubbles up to it from the headers and
	 * cells.
	 *
	 * There are three directions, and the first — the carried one onto the
	 * neighbour's place — alone is blind. Vue moves the nodes outside the longest
	 * increasing sequence of keys in the document: here that is the shifted
	 * neighbour, and the carried header stays in place. The last column to the start
	 * and the first past two to the end Vue moves as the carried one, and the
	 * shifted neighbours with their cells stay in place in the document. With the
	 * carried header leaves the sort button the press focused, and Chromium, losing
	 * focus, recalculates style in the middle of the repaint: by this recalc the
	 * headers have no marks, while the root flag is still there. A transition that
	 * held on the root flag rather than on the carried header took the neighbours'
	 * cells from the shift to zero in this recalc
	 * (`themes/oren/src/components/table/_table.scss`, the whole column). In the
	 * first direction the carried one isn't moved, there is no recalc in mid
	 * repaint, and the move lands in one recalc.
	 */
	describe('отпустили — заголовок встал на место, потом перестановка; ничего не отъезжает', () => {
		/** The gesture's marks on a header: after the move nobody has them. */
		const MARKS = ['dragging', 'landing', 'drop', 'shift', 'still']

		/** Longer than the theme's shift transition (`$reorder-duration`, 200 ms): had it started, it would have finished. */
		const SETTLE = 300

		/** A column header's text by the field. */
		const textOf = (field: string) => MOVABLE.find((column) => column.field === field)?.text

		it.each(
			(['head', 'column'] as const).flatMap((preview) => [
				{ preview, name: 'взятая — на место соседа', take: 0, past: 1 },
				{ preview, name: 'последняя — в начало', take: 2, past: 0 },
				{ preview, name: 'первая — через две в конец', take: 0, past: 2 },
			]),
		)('$preview: $name', async ({ preview, take, past }) => {
			const engine = moveEngine()

			await mountWith(engine, { reorderPreview: preview })
			await laidOut()

			const root = find('.so-table')
			const nodes = headers()
			const before = nodes.map(left)
			const widths = nodes.map(width)
			const order = fieldsOf(engine)
			const forward = past > take

			order.splice(past, 0, ...order.splice(take, 1))

			// The neighbours between the carried one and the place make room for it — by its width
			const shifted = nodes.filter(
				(_, index) =>
					index !== take &&
					index >= Math.min(take, past) &&
					index <= Math.max(take, past),
			)
			const shiftedTo = shifted.map(
				(node) => left(node) + (forward ? -widths[take] : widths[take]),
			)
			const runs: string[] = []
			const seen: {
				at: number[]
				heads: number[]
				cells: Element[]
				boxes: number[]
				moving: string[]
			}[] = []

			engine.extensions.columns.events.on('column:move', () => {
				const at = nodes.map(left)

				root.addEventListener('transitionrun', (event) => {
					const { target } = event

					if (event.propertyName !== 'translate' || !(target instanceof Element)) return
					if (!target.matches('.so-table-column, .so-table-row__cell')) return

					runs.push(`${target.className} «${target.textContent?.trim()}»`)
				})

				void nextTick(() => {
					const cells = [...rows()[0].children]

					seen.push({
						at,
						heads: nodes.map(left),
						cells,
						boxes: cells.map(left),
						moving: moving(),
					})
				})
			})

			try {
				await carry(nodes[take], middleOf(nodes[past]).x + (forward ? 10 : -10))
				await expect.poll(() => near(shifted.map(left), shiftedTo)).toBe(true)
			} finally {
				await commands.mouseUp()
			}

			await expect.poll(() => seen.length).toBe(1)
			await new Promise((resolve) => setTimeout(resolve, SETTLE))

			const [{ at, heads, cells, boxes }] = seen
			const placed = headers()
			let edge = before[0]
			// The new layout — the headers in a row in the new order, with the same widths
			const laid = placed.map((header) => {
				const start = edge

				edge += widths[nodes.indexOf(header)]

				return start
			})

			expect(fieldsOf(engine)).toEqual(order)
			expect(placed.map((header) => header.textContent?.trim())).toEqual(order.map(textOf))
			expect(near(placed.map(left), laid), 'заголовки — в новой раскладке').toBe(true)
			// The headers reached their place before the move, and it didn't shift them
			expect(near(heads, at), `в перерисовку: ${heads} — ${at}`).toBe(true)
			// Nobody moved after the repaint
			expect(seen[0].moving, 'переходы сдвига после перерисовки').toEqual([])
			expect(runs, 'начатые переходы сдвига').toEqual([])
			expect(near(nodes.map(left), heads), 'заголовки стоят').toBe(true)
			expect(near(cells.map(left), boxes), 'ячейки стоят').toBe(true)
			// No gesture
			expect(root.hasAttribute('data-reorder-preview')).toBe(false)
			expect(
				placed.flatMap((header) => MARKS.filter((mark) => mark in header.dataset)),
			).toEqual([])
		})
	})

	/**
	 * The head stands (`none`): with motion too the neighbours have no shift and no
	 * transition, the place is a line, and the column lands on the release, without
	 * a landing.
	 */
	it('none: соседи стоят, линия видна, колонка встаёт на отпускании', async () => {
		const engine = moveEngine()

		await mountWith(engine, { reorderPreview: 'none' })
		await laidOut()

		const [name, city, age] = headers()
		const before = [city, age].map(left)
		const runs = transitionRuns(city)

		try {
			await carry(name, middleOf(city).x + 10)

			expect(name.dataset.still).toBe('true')
			expect(city.dataset.drop).toBe('after')
			expect(city.dataset.shift).toBeUndefined()
			expect(style(city, '::before').display).not.toBe('none')
			expect(near([left(city), left(age)], before)).toBe(true)
			expect(style(city).translate).toBe('none')
			expect(runs).not.toContain('translate')
			expect(find('.so-table').style.getPropertyValue('--so-table-column-shift')).toBe('')
		} finally {
			await commands.mouseUp()
		}

		// Without a landing — right after the release, `plugins/__tests__` checks it
		// without frames; here — that the column landed and the marks are gone
		await expect.poll(() => fieldsOf(engine)).toEqual(['city', 'name', 'age'])
		await expect
			.poll(() => headers().map((header) => header.textContent?.trim()))
			.toEqual(['Город', 'Имя', 'Возраст'])
		expect(headers()[1].dataset.still).toBeUndefined()
	})

	it('column: ячейки соседа идут с его заголовком, ячейки взятой спрятаны', async () => {
		const engine = moveEngine()

		await mountWith(engine, { reorderPreview: 'column' })
		await laidOut()

		const [name, city] = headers()
		const [nameCell, cityCell, ageCell] = rows()[0].children
		const before = [nameCell, cityCell, ageCell].map(left)
		const width = name.getBoundingClientRect().width

		try {
			await carry(name, middleOf(city).x + 10)

			await expect.poll(() => near([left(cityCell)], [before[1] - width])).toBe(true)
			expect(near([left(ageCell)], [before[2]])).toBe(true)
			// The carried column's cells are hidden in every row, in place
			expect(rows().map((row) => style(row.children[0]).visibility)).toEqual(
				rows().map(() => 'hidden'),
			)
			expect(near([left(nameCell)], [before[0]])).toBe(true)
			expect(rows().map((row) => style(row.children[1]).visibility)).toEqual(
				rows().map(() => 'visible'),
			)
		} finally {
			await commands.mouseUp()
		}

		await expect.poll(() => fieldsOf(engine)).toEqual(['city', 'name', 'age'])
		await expect
			.poll(() => rows().map((row) => style(row.children[1]).visibility))
			.toEqual(rows().map(() => 'visible'))
	})

	/**
	 * The theme's body rules stand under the root flag `data-reorder-preview`,
	 * present only in a gesture: at rest a `column` table costs its cells nothing —
	 * they have neither a transition nor a shift, as in `head`.
	 */
	it('column на покое: у корня нет признака, у ячеек — ни перехода, ни сдвига', async () => {
		const engine = moveEngine()

		await mountWith(engine, { reorderPreview: 'column' })
		await laidOut()

		const root = find('.so-table')
		// No shift, no declared shift transition, no running transition
		const still = () =>
			moving().length === 0 &&
			cells().every((cell) => {
				const { translate, transitionProperty } = style(cell)
				const declared = transitionProperty.split(',').map((each) => each.trim())

				return translate === 'none' && !declared.includes('translate')
			})
		const [name, city] = headers()

		expect(root.hasAttribute('data-reorder-preview')).toBe(false)
		expect(still()).toBe(true)

		try {
			await carry(name, middleOf(city).x + 10)

			expect(root.dataset.reorderPreview).toBe('column')
		} finally {
			await commands.mouseUp()
		}

		await expect.poll(() => fieldsOf(engine)).toEqual(['city', 'name', 'age'])
		await expect.poll(() => root.hasAttribute('data-reorder-preview')).toBe(false)
		expect(still()).toBe(true)
	})

	it('RTL: сосед уступает место к началу строки — вправо', async () => {
		const engine = moveEngine()

		await mount(engine, PLACE, 'rtl')
		await laidOut()

		const [name, city] = headers()
		const before = left(city)
		const width = name.getBoundingClientRect().width

		try {
			// The first column is on the right; toward the row's end — to the left, past the neighbour's middle
			await carry(name, middleOf(city).x - 10)

			expect(city.dataset.shift).toBe('start')
			await expect.poll(() => near([left(city)], [before + width])).toBe(true)
		} finally {
			await commands.mouseUp()
		}

		await expect.poll(() => fieldsOf(engine)).toEqual(['city', 'name', 'age'])
	})

	it('Escape — соседи возвращаются, заголовок едет на своё место, колонка стоит', async () => {
		const engine = moveEngine()

		await mount(engine, PLACE)
		await laidOut()

		const [name, city, age] = headers()
		const before = [name, city, age].map(left)

		try {
			await carry(name, middleOf(age).x + 10)
			await expect.poll(() => age.dataset.shift).toBe('start')

			await userEvent.keyboard('{Escape}')

			expect(city.dataset.shift).toBeUndefined()
			await expect.poll(() => name.dataset.dragging).toBeUndefined()
			expect(near([name, city, age].map(left), before)).toBe(true)
		} finally {
			await commands.mouseUp()
		}

		await new Promise((resolve) => requestAnimationFrame(resolve))
		expect(fieldsOf(engine)).toEqual(['name', 'city', 'age'])
	})

	it('без движения соседи стоят, место — линия; колонка встаёт после отпускания', async () => {
		useMotion('reduce')

		try {
			const engine = moveEngine()

			await mount(engine, PLACE)
			await laidOut()

			const [name, city] = headers()
			const before = left(city)

			try {
				await carry(name, middleOf(city).x + 10)

				expect(city.dataset.shift).toBe('start')
				// A transition would run two hundred milliseconds — a couple of frames would catch it
				await new Promise((resolve) => requestAnimationFrame(resolve))
				await new Promise((resolve) => requestAnimationFrame(resolve))

				expect(near([left(city)], [before])).toBe(true)
				expect(city.dataset.drop).toBe('after')
				expect(style(city, '::before').display).not.toBe('none')
				expect(parseFloat(style(city, '::before').width)).toBe(3)
			} finally {
				await commands.mouseUp()
			}

			await expect.poll(() => fieldsOf(engine)).toEqual(['city', 'name', 'age'])
		} finally {
			useMotion('system')
		}
	})

	/**
	 * The drop line is drawn on every header not carried for the whole gesture,
	 * transparent, and the drop mark only colors it and puts it at the edge: a line
	 * that appeared and vanished with the mark laid the whole table out again on
	 * every change of the place (`benchmarks/table/history.md`). With motion the
	 * neighbours make room, and there is no line at all — on any header.
	 */
	describe('линия места', () => {
		/** The lines of the headers not carried — the computed style of their `::before`. */
		const lines = (): CSSStyleDeclaration[] =>
			headers()
				.filter((header) => header.dataset.dragging !== 'true')
				.map((header) => style(header, '::before'))

		/** The line is drawn: the pseudo-element is in the layout. */
		const drawn = (line: CSSStyleDeclaration): boolean =>
			line.content !== 'none' && line.display !== 'none'

		/** The line is visible: it has a color. */
		const shown = (header: Element): boolean =>
			opacity(style(header, '::before').backgroundColor) > 0

		it.each([
			{ name: 'без движения', props: {}, motion: 'reduce' },
			{ name: 'none', props: { reorderPreview: 'none' }, motion: 'system' },
		] as const)(
			'$name: у каждого невзятого заголовка весь жест, метка только красит её',
			async ({ props, motion }) => {
				useMotion(motion)

				try {
					const engine = moveEngine()

					await mountWith(engine, props)
					await laidOut()

					const [name, city, age] = headers()

					try {
						await carry(name, middleOf(city).x + 10)

						expect(city.dataset.drop).toBe('after')
						expect(lines().every(drawn)).toBe(true)
						expect([shown(city), shown(age)]).toEqual([true, false])

						// The place moves on: the neighbour's line stays in the layout and goes out
						await pointAt(middleOf(age).x + 10, middleOf(age).y)
						await expect.poll(() => age.dataset.drop).toBe('after')

						expect(lines().every(drawn)).toBe(true)
						expect([shown(city), shown(age)]).toEqual([false, true])
					} finally {
						await commands.mouseUp()
					}

					await expect.poll(() => fieldsOf(engine)).toEqual(['city', 'age', 'name'])
					expect(lines().some(drawn)).toBe(false)
				} finally {
					useMotion('system')
				}
			},
		)

		it('с движением соседи расступаются — линии нет ни у одного заголовка', async () => {
			const engine = moveEngine()

			await mount(engine, PLACE)
			await laidOut()

			const [name, city] = headers()

			try {
				await carry(name, middleOf(city).x + 10)

				expect(city.dataset.drop).toBe('after')
				expect(lines().some(drawn)).toBe(false)
			} finally {
				await commands.mouseUp()
			}

			await expect.poll(() => fieldsOf(engine)).toEqual(['city', 'name', 'age'])
		})
	})

	/**
	 * The head is raised over the body and painted after it, without sticking too.
	 * The field of a row's checkbox is raised (`z-10`), and without the head's raise
	 * the browser would paint it after the headers: a header that became a layer of
	 * its own in a gesture would be checked against every row's field on every
	 * layerization — on 5000 rows ~350 ms on the take and on every change of the
	 * place (`benchmarks/table/history.md`). WebKit turns `relative` on a row group
	 * into `static`, and the raise is `sticky` without an edge.
	 */
	it('шапка поднята над полем чекбокса строки', async () => {
		await mount(engineOf(), PLACE)

		const head = find('.so-table__head')
		const field = find('.so-table-row__select input')

		expect(style(head).position).not.toBe('static')
		expect(Number(style(head).zIndex)).toBeGreaterThan(Number(style(field).zIndex))
	})

	/**
	 * A drag started on the sort button goes to the reorder: the gesture captures
	 * the pointer on the root, and the release's `click` doesn't reach the button.
	 * A press without a drag stays a press of the button.
	 */
	it('протяжка, начатая с кнопки сортировки, не сортирует; нажатие без протяжки — сортирует', async () => {
		const engine = moveEngine()

		await mount(engine, PLACE)

		const [name, city] = headers()
		const from = middleOf(find('.so-table-column__sort', name))

		await pointAt(from.x, from.y)
		await commands.mouseDown()

		try {
			await pointAt(from.x + 30, from.y)
			await pointAt(middleOf(city).x + 20, from.y)
		} finally {
			await commands.mouseUp()
		}

		await expect.poll(() => fieldsOf(engine)).toEqual(['city', 'name', 'age'])

		// The column got no press after the drag
		await new Promise((resolve) => requestAnimationFrame(resolve))
		expect(headers().some((header) => header.dataset.sort)).toBe(false)

		const sortable = headers()[1]

		await userEvent.click(find('.so-table-column__sort', sortable))

		await expect.poll(() => sortable.dataset.sort).toBe('asc')
		expect(fieldsOf(engine)).toEqual(['city', 'name', 'age'])
	})

	it('Ctrl+Shift+→ на кнопке — колонка на шаг дальше, фокус остаётся на кнопке', async () => {
		const engine = moveEngine()

		await mount(engine, PLACE)

		const button = find('.so-table-column__sort', headers()[0])

		button.focus()
		await userEvent.keyboard('{Control>}{Shift>}{ArrowRight}{/Shift}{/Control}')

		expect(fieldsOf(engine)).toEqual(['city', 'name', 'age'])
		await expect.poll(() => headers()[1].contains(document.activeElement)).toBe(true)
		expect(document.activeElement).toBe(button)
	})

	it('RTL: Ctrl+Shift+← — к концу строки', async () => {
		const engine = moveEngine()

		await mount(engine, PLACE, 'rtl')

		find('.so-table-column__sort', headers()[0]).focus()
		await userEvent.keyboard('{Control>}{Shift>}{ArrowLeft}{/Shift}{/Control}')

		expect(fieldsOf(engine)).toEqual(['city', 'name', 'age'])
	})
})

/**
 * The grid (APG Data Grid) with real keys: Tab enters the table on the grid's
 * focused cell and leaves past the table, skipping the cells' fields and
 * buttons; the arrows move focus over the cells; the row under focus and under
 * the pointer is highlighted, a cell focused from the keyboard has a ring
 * inside its bounds.
 */
describe('сетка', () => {
	/** A grid with row selection between two buttons: Tab enters and leaves. */
	async function mountGrid(): Promise<TTableCollection> {
		const engine = engineOf()

		engine.extensions.grid.grid = true

		render(
			defineComponent({
				render: () =>
					h('div', { style: 'width: 400px' }, [
						h('button', { class: 'so-test-before' }, 'до'),
						h(Table, { engine, aria_label: 'Сотрудники' }),
						h('button', { class: 'so-test-after' }, 'после'),
					]),
			}),
		)

		await new Promise((resolve) => requestAnimationFrame(resolve))

		return engine
	}

	it('Tab — на ячейку, стрелки — по ячейкам, Tab — за таблицу мимо полей ячеек', async () => {
		await mountGrid()

		find('.so-test-before').focus()
		await userEvent.keyboard('{Tab}')

		// Selection was turned on after the columns — the grid's focus is on the first of them
		expect(document.activeElement).toBe(headers()[0])

		await userEvent.keyboard('{ArrowDown}{ArrowRight}')

		expect(document.activeElement).toBe(rows()[0].children[2])

		await userEvent.keyboard('{Tab}')

		expect(document.activeElement).toBe(find('.so-test-after'))

		// Shift+Tab — back to the same cell: the grid is one stop
		await userEvent.keyboard('{Shift>}{Tab}{/Shift}')

		expect(document.activeElement).toBe(rows()[0].children[2])
	})

	it('ячейка под фокусом с клавиатуры — в кольце внутри своих границ', async () => {
		await mountGrid()

		find('.so-test-before').focus()
		await userEvent.keyboard('{Tab}{ArrowDown}')

		const cell = rows()[0].children[1]

		expect(document.activeElement).toBe(cell)
		expect(style(cell).outlineStyle).toBe('solid')
		expect(parseFloat(style(cell).outlineOffset)).toBeLessThan(0)
	})

	it('строка под фокусом и под указателем подсвечена; нажатие по строке — её выбор', async () => {
		const engine = await mountGrid()
		const [first, second] = rows()

		await userEvent.hover(find('.so-test-before'))
		await settled(document.body)

		expect(opacity(style(second).backgroundColor)).toBe(0)

		await userEvent.hover(second.children[2])
		await settled(second)

		expect(opacity(style(second).backgroundColor)).toBeGreaterThan(0)

		await userEvent.click(second.children[2])

		expect(engine.extensions.selection.selected).toEqual([engine.extensions.batch.items[1]])
		expect(second.getAttribute('aria-selected')).toBe('true')

		// Focus went to the pressed cell — its row is highlighted without the pointer too
		await userEvent.hover(find('.so-test-before'))
		await settled(document.body)

		expect(second.contains(document.activeElement)).toBe(true)
		expect(opacity(style(first).backgroundColor)).toBe(0)
		expect(style(second).backgroundColor).not.toBe(style(first).backgroundColor)
	})
})

describe('принудительные цвета', () => {
	it('выбранная строка — системной подсветкой', async () => {
		const engine = engineOf()

		engine.extensions.selection.select(engine.extensions.batch.items[0])
		await mount(engine)
		await forcedColors('active')

		const selected = rows()[0]

		expect(pixel([style(selected).backgroundColor])).toEqual(pixel([systemColor('Highlight')]))
		expect(pixel([style(selected).color])).toEqual(pixel([systemColor('HighlightText')]))
	})
})

/**
 * The width handle is a strip at the header's end with an `input type="range"`
 * field.
 *
 * The plugin runs the drag, the core computes the width, and the layout is the
 * theme's: here one sees that the column's edge follows the pointer by exactly
 * the shift, in LTR and RTL, the neighbours with a width stay in place, and the
 * names of the header and the slider are exactly the column's text, without
 * the field's value.
 *
 * The table is in a place no wider than the run's window (414 px): a drag past
 * the window's edge would scroll the page, and the pointer's shift would differ
 * from the edge's.
 */
describe('ручка ширины', () => {
	const PLACE = 400

	const NAME_RESIZE: TTableColumnSource = {
		...NAME,
		resizable: true,
		width: 120,
		minWidth: 80,
		maxWidth: 300,
	}
	const CITY_RESIZE: TTableColumnSource = { ...CITY, resizable: true }
	const AGE_RESIZE: TTableColumnSource = { ...AGE, resizable: true, width: 100 }
	const ALL = [NAME_RESIZE, CITY_RESIZE, AGE_RESIZE]

	it('протяжка на Δ — колонка шире на Δ; отпускание — один commit', async () => {
		const engine = resizeEngine(ALL)
		const name = columnOf(engine, 'name')
		const commits: number[] = []

		name.events.on('commit', (value) => commits.push(value))
		await mount(engine, PLACE)

		const [header] = headers()

		await drag(header, 40)

		expect(Math.abs(width(header) - 160)).toBeLessThanOrEqual(EPSILON)
		expect(name.width).toBe(160)
		expect(commits).toEqual([160])
		expect(header.dataset.resizing).toBe('false')
	})

	it('RTL: ручка у левого края заголовка — колонку расширяет протяжка влево', async () => {
		const engine = resizeEngine(ALL)

		await mount(engine, PLACE, 'rtl')

		const [header] = headers()
		const resizer = resizerOf(header).getBoundingClientRect()
		const left = header.getBoundingClientRect().left

		// The strip is on the border between columns, at the header's left edge
		expect(Math.abs(resizer.left + resizer.width / 2 - left)).toBeLessThanOrEqual(EPSILON)

		await drag(header, -40)

		expect(Math.abs(width(header) - 160)).toBeLessThanOrEqual(EPSILON)
		expect(columnOf(engine, 'name').width).toBe(160)
	})

	it('протяжка — в границах колонки', async () => {
		await mount(resizeEngine(ALL), PLACE)

		const [header] = headers()

		await drag(header, 240)

		expect(Math.abs(width(header) - 300)).toBeLessThanOrEqual(EPSILON)
	})

	it('колонка без своей ширины: ручка — с раскладкой, протяжка — от ширины, которую видно', async () => {
		await mount(resizeEngine([CITY_RESIZE, AGE_RESIZE]), PLACE)

		const [header] = headers()

		// Until the window is measured the theme decides the width, and the handle
		// waits for the core's layout — a frame after the observer
		await expect.poll(() => header.querySelector('.so-table-column__resizer')).not.toBeNull()

		const before = width(header)

		await drag(header, -30)

		expect(Math.abs(width(header) - (before - 30))).toBeLessThanOrEqual(EPSILON)
		expect(header.dataset.sized).toBe('true')
	})

	/**
	 * A deferred drag: the table isn't laid out again during the gesture — the
	 * widths stand until the release, and a ghost shows the new border — a line on
	 * the handle's strip (`::after`), shifted by the coming change.
	 */
	describe('отложенная протяжка (deferred)', () => {
		const DEFERRED = { resizePreview: 'deferred' }

		/** Press the strip and move the pointer by `dx`, without releasing. */
		async function hold(header: Element, dx: number): Promise<void> {
			const box = resizerOf(header).getBoundingClientRect()
			const x = box.left + box.width / 2
			const y = box.top + box.height / 2

			await pointAt(x, y)
			await commands.mouseDown()
			await pointAt(x + dx / 2, y)
			await pointAt(x + dx, y)
		}

		/** The handle's ghost: whether it shows and how far it is shifted. */
		function ghostOf(header: Element): { shown: boolean; shift: string; height: number } {
			const style = getComputedStyle(resizerOf(header), '::after')

			return {
				shown: style.content !== 'none',
				shift: style.translate,
				height: parseFloat(style.blockSize),
			}
		}

		it('призрак идёт за указателем, ширины стоят; отпускание — ширина и один commit', async () => {
			const engine = resizeEngine(ALL)
			const commits: number[] = []

			columnOf(engine, 'name').events.on('commit', (value) => commits.push(value))
			await mount(engine, PLACE, 'ltr', DEFERRED)

			const [name, city, age] = headers()
			const before = [name, city, age].map(width)

			expect(ghostOf(name).shown).toBe(false)

			try {
				await hold(name, 40)

				await expect.poll(() => ghostOf(name).shift).toBe('40px')
				expect(ghostOf(name).shown).toBe(true)
				// From the header's top to the table's bottom
				const table = find('.so-table').getBoundingClientRect()

				expect(
					Math.abs(
						ghostOf(name).height - (table.bottom - name.getBoundingClientRect().top),
					),
				).toBeLessThanOrEqual(EPSILON)
				expect([name, city, age].map(width)).toEqual(before)
				expect(commits).toEqual([])
			} finally {
				await commands.mouseUp()
			}

			await expect.poll(() => width(name)).toBeCloseTo(before[0] + 40, 0)
			expect(commits).toEqual([160])
			expect(ghostOf(name).shown).toBe(false)
		})

		it('RTL: призрак уходит влево, когда колонка растёт', async () => {
			const engine = resizeEngine(ALL)

			await mount(engine, PLACE, 'rtl', DEFERRED)

			const [name] = headers()

			try {
				await hold(name, -40)

				await expect.poll(() => ghostOf(name).shift).toBe('-40px')
				expect(Math.abs(width(name) - 120)).toBeLessThanOrEqual(EPSILON)
			} finally {
				await commands.mouseUp()
			}

			expect(columnOf(engine, 'name').width).toBe(160)
		})

		it('призрак — в границах колонки, и записано то же', async () => {
			const engine = resizeEngine(ALL)

			await mount(engine, PLACE, 'ltr', DEFERRED)

			const [name] = headers()

			try {
				await hold(name, 240)

				// maxWidth 300 from the width 120
				await expect.poll(() => ghostOf(name).shift).toBe('180px')
			} finally {
				await commands.mouseUp()
			}

			expect(columnOf(engine, 'name').width).toBe(300)
		})

		/**
		 * The task's guard. On the last column the handle's line stands at the table's
		 * edge, not in the middle of the strip, and the ghost's rule of equal weight
		 * standing below overrode that: the ghost stood a few px before the line.
		 */
		it.each([
			['средней', 0],
			['последней', 2],
		])('у %s колонки призрак на нажатии — ровно на линии ручки', async (_, index) => {
			const engine = resizeEngine(ALL)

			await mount(engine, PLACE, 'ltr', DEFERRED)

			const header = headers()[index]
			const resizer = resizerOf(header)
			const edgeOf = (pseudo: string) => {
				const style = getComputedStyle(resizer, pseudo)

				return { left: style.left, right: style.right }
			}

			try {
				await hold(header, 0)
				await expect.poll(() => ghostOf(header).shown).toBe(true)

				expect(ghostOf(header).shift).toBe('0px')
				expect(edgeOf('::after')).toEqual(edgeOf('::before'))
			} finally {
				await commands.mouseUp()
			}
		})

		it('Escape — призрак снят, ширина та же', async () => {
			const engine = resizeEngine(ALL)

			await mount(engine, PLACE, 'ltr', DEFERRED)

			const [name] = headers()

			try {
				await hold(name, 40)
				await expect.poll(() => ghostOf(name).shown).toBe(true)
				await userEvent.keyboard('{Escape}')
				await expect.poll(() => ghostOf(name).shown).toBe(false)
			} finally {
				await commands.mouseUp()
			}

			expect(columnOf(engine, 'name').width).toBe(120)
		})
	})

	/**
	 * The task's guard. Flexible columns before the dragged one were laid out again
	 * with the rest, and the edge followed the pointer by half or stood still, while
	 * the column grew the other way. The columns before the dragged one keep their
	 * width, the column after it gives the place.
	 */
	it('auto, гибкие колонки: край идёт за указателем, левый край стоит', async () => {
		const FLEX = { resizable: true }

		// The flexible ones share 400 − 60: 170 each. Without the rule the first would
		// shrink toward 160, and the second's edge would move by 30, not 40
		await mount(
			resizeEngine([
				{ ...NAME, ...FLEX },
				{ ...CITY, ...FLEX },
				{ ...AGE, ...FLEX, width: 60 },
			]),
			PLACE,
		)

		const [first, second] = headers()

		await expect.poll(() => second.querySelector('.so-table-column__resizer')).not.toBeNull()

		const before = second.getBoundingClientRect()

		await drag(second, 40)

		const after = second.getBoundingClientRect()

		expect(Math.abs(after.left - before.left)).toBeLessThanOrEqual(EPSILON)
		expect(Math.abs(after.right - (before.right + 40))).toBeLessThanOrEqual(EPSILON)
		expect(Math.abs(width(first) - 170)).toBeLessThanOrEqual(EPSILON)
	})

	/**
	 * The task's guard. The theme laid out a column without its own width ignoring
	 * the bounds: a column bounded by 120–360 stood wider than the place the layout
	 * gave it — the whole table, — and the very first drag or key snapped it into
	 * the bound. The core lays it out within the bounds right away, and the handle
	 * takes it from what is seen.
	 */
	describe('колонка без ширины с границами в широком месте', () => {
		const BOUNDED: TTableColumnSource = {
			field: 'name',
			text: 'Имя',
			rowHeader: true,
			resizable: true,
			minWidth: 120,
			maxWidth: 360,
		}

		/** A table with one such column: the place would give it 400 px. */
		async function mountBounded(): Promise<{ engine: TTableCollection; header: HTMLElement }> {
			const engine = resizeEngine([BOUNDED])

			await mount(engine, PLACE)

			const [header] = headers()

			// Within its bound, not the whole place
			await expect.poll(() => width(header)).toBe(360)

			return { engine, header }
		}

		it('сразу в границах: у верхней, а не во всю ширину места; своей ширины нет', async () => {
			const { engine, header } = await mountBounded()

			expect(columnOf(engine, 'name').width).toBe(360)
			expect(columnOf(engine, 'name').getProps().width).toBeUndefined()
			expect(header.dataset.sized).toBe('true')
			// All flexible ones hit their bounds — the table is narrower than the place
			expect(width(find('.so-table'))).toBe(360)
		})

		it('первая стрелка к сужению — ровно шаг, без рывка', async () => {
			const { engine, header } = await mountBounded()
			const field = fieldOf(header)

			field.focus()
			await userEvent.keyboard('{ArrowLeft}')

			expect(columnOf(engine, 'name').width).toBe(350)
			await expect.poll(() => width(header)).toBe(350)
			expect(field.value).toBe('350')
		})

		it('первая протяжка — ровно на Δ', async () => {
			const { engine, header } = await mountBounded()

			await drag(header, -40)

			expect(columnOf(engine, 'name').width).toBe(320)
			expect(Math.abs(width(header) - 320)).toBeLessThanOrEqual(EPSILON)
		})

		it('протяжка за верхнюю границу — колонка стоит у неё и остаётся гибкой', async () => {
			const { engine, header } = await mountBounded()

			await drag(header, 30)

			expect(Math.abs(width(header) - 360)).toBeLessThanOrEqual(EPSILON)
			expect(columnOf(engine, 'name').getProps().width).toBeUndefined()
		})
	})

	it('ширина у всех колонок — таблица шириной в их сумму, соседи на месте', async () => {
		await mount(resizeEngine([NAME_RESIZE, { ...CITY_RESIZE, width: 150 }, AGE_RESIZE]), PLACE)

		const table = find('.so-table')
		const [name, city, age] = headers()

		// The place's excess isn't handed out to the columns: the table is the sum of their widths
		expect(Math.abs(width(table) - 370)).toBeLessThanOrEqual(EPSILON)

		const cityLeft = city.getBoundingClientRect().left

		await drag(name, 20)

		expect(Math.abs(width(name) - 140)).toBeLessThanOrEqual(EPSILON)
		expect(Math.abs(width(city) - 150)).toBeLessThanOrEqual(EPSILON)
		expect(Math.abs(width(age) - 100)).toBeLessThanOrEqual(EPSILON)
		expect(Math.abs(width(table) - 390)).toBeLessThanOrEqual(EPSILON)
		// The column's edge moved the neighbour — by exactly its gain
		expect(Math.abs(city.getBoundingClientRect().left - (cityLeft + 20))).toBeLessThanOrEqual(
			EPSILON,
		)
	})

	it('клавиши: стрелка — ровно один шаг ядра, Shift — крупный, Home и End — края', async () => {
		const engine = resizeEngine(ALL)

		await mount(engine, PLACE)

		const [header] = headers()
		const field = fieldOf(header)

		field.focus()
		await userEvent.keyboard('{ArrowRight}')

		expect(columnOf(engine, 'name').width).toBe(130)
		await expect.poll(() => field.value).toBe('130')
		expect(Math.abs(width(header) - 130)).toBeLessThanOrEqual(EPSILON)

		await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}')

		expect(columnOf(engine, 'name').width).toBe(230)

		await userEvent.keyboard('{End}')

		expect(columnOf(engine, 'name').width).toBe(300)

		await userEvent.keyboard('{Home}')

		expect(columnOf(engine, 'name').width).toBe(80)
	})

	it('клавиши в RTL: ← — шире', async () => {
		const engine = resizeEngine(ALL)

		await mount(engine, PLACE, 'rtl')

		fieldOf(headers()[0]).focus()
		await userEvent.keyboard('{ArrowLeft}')

		expect(columnOf(engine, 'name').width).toBe(130)
	})

	it('имя заголовка и ползунка ручки — ровно текст колонки, без значения поля', async () => {
		await mount(resizeEngine(ALL), PLACE)

		const [name, city] = headers()

		expect(page.getByRole('columnheader', { name: 'Имя', exact: true }).query()).toBe(name)
		expect(page.getByRole('columnheader', { name: 'Город', exact: true }).query()).toBe(city)
		expect(page.getByRole('slider', { name: 'Имя', exact: true }).query()).toBe(fieldOf(name))
		// The sort button is next to the label, with its own name from the locale: it
		// isn't part of the header's name
		expect(page.getByRole('button', { name: 'Sort by Имя', exact: true }).query()).toBe(
			find('.so-table-column__sort', name),
		)
	})

	it('полоса — зона захвата в 14 px; у последней колонки — в таблице', async () => {
		await mount(resizeEngine(ALL), PLACE)

		const table = find('.so-table').getBoundingClientRect()
		const [name, , age] = headers()

		expect(Math.abs(width(resizerOf(name)) - 14)).toBeLessThanOrEqual(EPSILON)
		expect(Math.abs(width(resizerOf(age)) - 14)).toBeLessThanOrEqual(EPSILON)
		expect(resizerOf(age).getBoundingClientRect().right).toBeLessThanOrEqual(
			table.right + EPSILON,
		)

		// Right on the border between columns — the strip
		const edge = name.getBoundingClientRect()
		const hit = document.elementFromPoint(edge.right, edge.top + edge.height / 2)

		expect(resizerOf(name).contains(hit)).toBe(true)
	})

	/**
	 * The sort button stands right after the label, and with a label as wide as the
	 * column it reaches the column's border together with its hit zone: at `sm` the
	 * zone goes under the strip. At the border between columns the handle takes
	 * the press — the strip lies over the button and its zone, — and on the button
	 * the button does, sorting the column without changing its width. The geometry
	 * is taken once the core has laid the columns out.
	 */
	it('у границы колонок нажатие берёт ручка, а не кнопка; на кнопке — кнопка', async () => {
		const LONG: TTableColumnSource = {
			...NAME_RESIZE,
			text: 'Фамилия, имя и отчество сотрудника',
		}

		render(
			defineComponent({
				render: () =>
					h('div', { style: `width: ${PLACE}px` }, [
						h(Table, {
							engine: resizeEngine([LONG, CITY_RESIZE, AGE_RESIZE]),
							size: 'sm',
							aria_label: 'Сотрудники',
						}),
					]),
			}),
		)
		await laidOut()

		const [name, , age] = headers()
		const button = find('.so-table-column__sort', name)
		// Keep the fixture's minimum hit area overlapping the resize strip at any density.
		button.style.setProperty('--so-table-sort-padding', '0px')
		const edge = name.getBoundingClientRect()
		const strip = resizerOf(name).getBoundingClientRect()
		const own = button.getBoundingClientRect()
		const y = own.top + own.height / 2

		// A label as wide as the column — the button at the column's end
		expect(edge.right - own.right).toBeLessThan(strip.width)

		// The button's hit zone goes under the strip
		expect(own.left + own.width / 2 + ZONE / 2).toBeGreaterThan(strip.left)

		// From the border to the strip's inner edge — the handle, over the button and its zone
		for (let x = edge.right - 0.5; x > strip.left; x -= 0.5) {
			expect(resizerOf(name).contains(document.elementFromPoint(x, y)), `${x}`).toBe(true)
		}

		// The strip at the neighbour's start is this column's handle too
		expect(resizerOf(name).contains(document.elementFromPoint(edge.right + 4, y))).toBe(true)

		// The last column's strip is at the table's edge
		const last = age.getBoundingClientRect()

		expect(resizerOf(age).contains(document.elementFromPoint(last.right - 4, y))).toBe(true)

		// On the button — the button: it sorts, the width stays
		const middle = own.left + own.width / 2

		expect(button.contains(document.elementFromPoint(middle, y))).toBe(true)

		const before = width(name)

		await pointAt(middle, y)
		await commands.mouseDown()
		await commands.mouseUp()

		await expect.poll(() => name.dataset.sort).toBe('asc')
		expect(Math.abs(width(name) - before)).toBeLessThanOrEqual(EPSILON)
	})

	/**
	 * The handle's line is 3 px and hangs in the middle of the header's height: it
	 * touches neither the row borders, nor the head's line, nor the top edge.
	 */
	it('линия — 3 px, висит посередине, не касаясь краёв заголовка', async () => {
		await mount(resizeEngine(ALL), PLACE)

		const [name] = headers()
		const line = style(resizerOf(name), '::before')
		const header = name.getBoundingClientRect()
		const resizer = resizerOf(name).getBoundingClientRect()
		const top = resizer.top + parseFloat(line.top)
		const bottom = top + parseFloat(line.height)

		expect(parseFloat(line.width)).toBe(3)
		// The offset is a tenth of the header's height above and below
		expect(Math.abs(top - header.top - header.height / 10)).toBeLessThanOrEqual(EPSILON)
		expect(header.bottom - bottom).toBeGreaterThan(0)
		expect(Math.abs(top - header.top - (header.bottom - bottom))).toBeLessThanOrEqual(EPSILON)
	})

	it('линия — под наведением; в принудительных цветах — системным цветом фокуса', async () => {
		await mount(resizeEngine(ALL), PLACE)

		const resizer = resizerOf(headers()[0])
		const line = () => style(resizer, '::before')

		expect(line().opacity).toBe('0')

		const box = resizer.getBoundingClientRect()

		await pointAt(box.left + box.width / 2, box.top + box.height / 2)
		await expect.poll(() => line().opacity).toBe('1')

		await forcedColors('active')

		expect(pixel([line().backgroundColor])).toEqual(pixel([systemColor('Highlight')]))
	})

	/**
	 * A pointer passing over the strip on its way doesn't light the line: the line
	 * waits to see whether it stays. The handle's cursor shows at once meanwhile.
	 * Once the handle is taken there is nothing to wait for, and the line shows
	 * without a delay under the pointer too, even in the middle of the hover delay:
	 * the transition waiting for it is cancelled rather than played out. After a
	 * gesture the line goes out with a transition as well.
	 *
	 * Passing by and the middle of the delay are judged by the line's transition,
	 * not by the clock: a hover's answer makes an RPC round trip and under load
	 * comes after the delay, when the line already shows. A listener set up before
	 * the hover catches the transition and pauses it, and the test picks the
	 * instant: the pointer leaves in the last moment of the delay and presses at
	 * its start.
	 */
	it('линия ждёт задержки указателя: мимоходом не моргает; взяли ручку — сразу', async (context) => {
		await mount(resizeEngine(ALL), PLACE)

		const resizer = resizerOf(headers()[0])
		const line = () => style(resizer, '::before')
		const box = resizer.getBoundingClientRect()
		const y = box.top + box.height / 2
		const on = box.left + box.width / 2
		const away = on + 60

		// First away from the strip, with the line at rest: the previous test's pointer
		// stands where the new table has its strip and would light the line before the
		// hover
		await pointAt(away, y)
		await pseudoSettled(resizer, '::before')

		expect(line().opacity).toBe('0')

		const transition = await pausedPseudoTransition(resizer, '::before', 'opacity', () =>
			pointAt(on, y),
		)

		expect(style(resizer).cursor).toBe('col-resize')

		const delay = delayOf(transition)

		expect(delay, 'линия ждёт указателя').toBeGreaterThan(0)

		// The last moment of the delay — no line yet
		transition.currentTime = delay - 1

		expect(line().opacity).toBe('0')

		// Left at that moment — the line never showed: the transition is cancelled
		// rather than played out, and there is no new opacity transition — the line
		// has nothing to fade from
		const runs = pseudoTransitionRuns(resizer, '::before')

		await pointAt(away, y)
		await transitionEvents()

		expect(transition.playState, 'переход линии отменён').toBe('idle')
		expect(runs, 'гаснуть линии не из чего').not.toContain('opacity')

		// It stayed — the line showed
		await pointAt(on, y)
		await expect.poll(() => line().opacity).toBe('1')

		await pointAt(away, y)
		await expect.poll(() => line().opacity).toBe('0')

		// Pressed the strip while the line waits — it shows at once: the hover's
		// transition is cancelled rather than playing out the delay. It is paused at
		// the delay's start, and if not cancelled it would keep the line out
		const waiting = await pausedPseudoTransition(resizer, '::before', 'opacity', () =>
			pointAt(on, y),
		)

		expect(line().opacity, 'линия ждёт указателя').toBe('0')

		await commands.mouseDown()

		try {
			await expect.poll(() => headers()[0].dataset.resizing).toBe('true')
			expect(line().opacity, 'взяли ручку — линия сразу').toBe('1')
			expect(waiting.playState, 'переход наведения отменён').toBe('idle')
		} finally {
			await commands.mouseUp()
		}

		// Released on the strip — the line stays; the pointer leaves — it fades
		// with a transition, as without a gesture. While the pointer is captured,
		// `:hover` is on the header, and it comes back to the strip after the
		// gesture flag is gone: the transition started between the two the
		// browser cancels at once — it isn't what puts the line out. So the
		// listener goes after the release events. WebKit leaves `:hover` on the
		// header until the pointer moves, and the line fades on the release
		context.skip(!hoverAfterCapture)

		await expect.poll(() => line().opacity).toBe('1')
		await transitionEvents()

		const fading = pseudoTransitionRuns(resizer, '::before')

		await pointAt(away, y)
		await expect.poll(() => line().opacity).toBe('0')

		expect(fading, 'ушёл — гаснет переходом').toContain('opacity')
	})

	/**
	 * Keyboard focus on the handle's field is an intent, like a press: the line
	 * shows at once, and in the middle of the hover delay the transition waiting
	 * for it is cancelled. A script sets the focus with a ring
	 * (`focusVisible: true`), and the hover's transition is caught paused, as
	 * above.
	 */
	it('фокус поля с клавиатуры посреди задержки наведения — линия сразу', async () => {
		await mount(resizeEngine(ALL), PLACE)

		const resizer = resizerOf(headers()[0])
		const line = () => style(resizer, '::before')
		const box = resizer.getBoundingClientRect()
		const y = box.top + box.height / 2
		const on = box.left + box.width / 2

		await pointAt(on + 60, y)
		await pseudoSettled(resizer, '::before')

		const waiting = await pausedPseudoTransition(resizer, '::before', 'opacity', () =>
			pointAt(on, y),
		)

		expect(line().opacity, 'линия ждёт указателя').toBe('0')

		find('.so-table-column__input', resizer).focus({ focusVisible: true })

		expect(line().opacity, 'фокус с клавиатуры — линия сразу').toBe('1')
		expect(waiting.playState, 'переход наведения отменён').toBe('idle')
	})

	/**
	 * While the handle is held — from the press, before any movement, — the
	 * handle's cursor and no selection over the whole table: the pointer leaves the
	 * strip, and the column's edge follows it. The theme sets them by the root flag
	 * (`data-resizing`), which the core keeps only in a gesture, — after the release
	 * a body cell is the same as before the press.
	 */
	it('держат ручку — курсор ручки и без выделения на всей таблице; отпустили — как было', async () => {
		await mount(resizeEngine(ALL), PLACE)

		const table = find('.so-table')
		const cell = () => find('.so-table-row__cell')
		const rest = { cursor: style(cell()).cursor, select: style(table).userSelect }
		const box = resizerOf(headers()[0]).getBoundingClientRect()

		expect(rest.cursor).not.toBe('col-resize')
		expect(rest.select).not.toBe('none')
		expect(table.hasAttribute('data-resizing')).toBe(false)

		await pointAt(box.left + box.width / 2, box.top + box.height / 2)
		await commands.mouseDown()

		try {
			await expect.poll(() => style(cell()).cursor).toBe('col-resize')
			expect(style(table).userSelect).toBe('none')
		} finally {
			await commands.mouseUp()
		}

		await expect.poll(() => table.hasAttribute('data-resizing')).toBe(false)
		expect(style(cell()).cursor).toBe(rest.cursor)
		expect(style(table).userSelect).toBe(rest.select)
	})
})
