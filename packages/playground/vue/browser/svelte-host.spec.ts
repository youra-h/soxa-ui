/**
 * The Svelte host on the stand page in a real browser — the layout jsdom
 * doesn't compute.
 *
 * The Svelte markup follows the Vue markup, and the theme is the same, but the
 * two can drift apart silently: Svelte keeps whitespace between neighbouring
 * nodes as text, Vue strips it, and outside flex and grid such whitespace would
 * shift the parts. So the Svelte component sits in its cell exactly like the
 * component of the Vue host — the same place and size. In previews with a
 * wrapper and content the wrapper and the parts sit the same too: the label
 * around a control, collection items, tags, the Select field with its wrappers
 * and arrow, the active tab's panel, the slider's thumbs and fill, the rating's
 * stars, the scroller's buttons and viewport, the pagination's pages and
 * arrows, the date field's parts and separators, the calendar's heading, paging
 * buttons, weekday labels and days — and the table's window, root, headers and
 * rows; for the Virtual window, its row: a list, a Select and a table.
 *
 * Overlays are checked twice. In the cell — what stays in place: the root of a
 * popover, tooltip and menu with its trigger, the buttons of the dialog, the
 * drawer and the toasts, the Select field, the DatePicker field with its
 * calendar button. And opened: the popover panel, the Select list with options,
 * the menu panel with groups, separators and items, the dialog and the drawer
 * with backdrop and parts, the region with a toast, the DatePicker panel with
 * its calendar — teleported to `body`, past the stage — and the month and year
 * picker, which stays in the calendar; their boxes are compared from the
 * window's corner once the theme's transitions have played. jsdom doesn't see
 * Svelte's whitespace inside panels: only the browser computes layout.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useIcons, useTheme } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'
import { router } from '../src/router'
import { renderStand } from './stand'

import '@soxa-ui/theme-oren'
import oren from '@soxa-ui/theme-oren/setup'
import '../src/styles.css'

useIcons(material)
useTheme(oren)

const settle = () => new Promise((resolve) => setTimeout(resolve, 300))

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/** The page's row by the name of its prop. */
const propRow = (name: string): HTMLElement => {
	const found = [...document.querySelectorAll('.pg-prop')].find(
		(node) => node.querySelector('.pg-prop__name')?.textContent?.trim() === name,
	)

	if (!(found instanceof HTMLElement)) throw new Error(`строки «${name}» нет`)

	return found
}

/**
 * Boxes of the component and its drawn parts in the first column of row `row`,
 * from the corner of the column's stage, in document order: they show both the
 * place of each part in the cell and its size. The row is `visible`, and for
 * the wrapper without a view (Virtual) — its switch. They are taken once the
 * layout holds still (`settledBoxesIn`).
 */
async function boxesOf(framework: string, component: string, selector: string, row = 'visible') {
	await router.push(`/${framework}/${component}`)

	return settledBoxesIn(selector, row)
}

/**
 * The Svelte component's boxes wait for the Vue ones: the host finishes the
 * preview's layout over its own ticks — the Virtual window trims the row to the
 * visible lines once it has measured itself. The wait is for the match, not for
 * a time; no match within `timeout` — the test fails with the last measurement.
 */
async function expectSvelteLikeVue(component: string, selector: string, row = 'visible') {
	const vue = await boxesOf('vue', component, selector, row)

	expect(vue[0].width).toBeGreaterThan(0)

	await router.push(`/svelte/${component}`)
	await expect.poll(() => boxesIn(selector, row), { timeout: 5000 }).toEqual(vue)

	return vue
}

/**
 * Frames between two measurements that must agree for the layout to count as
 * settled: the Virtual window measures itself a frame after its node is ready
 * (`TElementPlugin`) and trims the row by the next one.
 */
const LAYOUT_FRAMES = 4

/**
 * Boxes of the parts once the layout holds still: a measurement equal to the
 * one `LAYOUT_FRAMES` frames before. A pause by the clock doesn't promise that:
 * in WebKit in CI the Vue reference was taken before the Virtual window trimmed
 * its row — all 105 boxes instead of 40 — and the trimmed Svelte row never
 * matched it.
 */
async function settledBoxesIn(selector: string, row: string) {
	let last: ReturnType<typeof boxesIn> = []

	await expect
		.poll(
			async () => {
				for (let frame = 0; frame < LAYOUT_FRAMES; frame++) await nextFrame()

				const previous = JSON.stringify(last)

				last = boxesIn(selector, row)

				return JSON.stringify(last) === previous
			},
			{ timeout: 5000 },
		)
		.toBe(true)

	return last
}

/** Boxes of the parts in the stage of row `row` of the current page — as in `boxesOf`. */
function boxesIn(selector: string, row: string) {
	const stage = propRow(row).querySelector('.pg-col__stage')
	const parts = [...(stage?.querySelectorAll(selector) ?? [])].filter(
		(part) => part.getClientRects().length > 0,
	)

	if (!stage || parts.length === 0) {
		throw new Error(`${router.currentRoute.value.fullPath}: в сцене нет ${selector}`)
	}

	const outer = stage.getBoundingClientRect()

	return parts.map((part) => {
		const inner = part.getBoundingClientRect()

		return {
			x: Math.round(inner.left - outer.left),
			y: Math.round(inner.top - outer.top),
			width: Math.round(inner.width),
			height: Math.round(inner.height),
		}
	})
}

/** What opens an overlay in the stage: the node to click and its name for the error. */
type TOpener = {
	readonly name: string
	readonly find: (stage: Element) => Element | undefined
}

/** The button with text `text`: the popover trigger, the dialog, drawer and toasts buttons. */
const button = (text: string): TOpener => ({
	name: `кнопка «${text}»`,
	find: (stage) =>
		[...stage.querySelectorAll('.so-button')].find(
			(candidate) => candidate.textContent?.trim() === text,
		),
})

/**
 * A node by selector — the Select arrow: the stand's preview is `editable`, and
 * there the panel is opened by a click on the arrow, not on the field.
 */
const node = (selector: string): TOpener => ({
	name: selector,
	find: (stage) => stage.querySelector(selector) ?? undefined,
})

/**
 * Boxes of an opened overlay and its parts, from the window's corner, in
 * document order: the panel is teleported to `body`, past the stage, and stands
 * at its trigger or at the window's edge. A click on the `opener` node in the
 * first column of row `visible` opens it; the boxes are taken once the theme's
 * transitions have played — fade-in, slide-in, the place at the anchor.
 */
async function openedBoxesOf(
	framework: string,
	component: string,
	opener: TOpener,
	selector: string,
) {
	await router.push(`/${framework}/${component}`)
	await settle()

	const stage = propRow('visible').querySelector('.pg-col__stage')
	const target = stage ? opener.find(stage) : undefined

	if (!(target instanceof HTMLElement)) {
		throw new Error(`${framework}/${component}: в сцене нет: ${opener.name}`)
	}

	// Measure the pointer path: click-only AT activation now focuses and may scroll the page.
	target.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
	await settle()
	await Promise.all(document.getAnimations().map((animation) => animation.finished))

	const parts = [...document.querySelectorAll(selector)].filter(
		(part) => part.getClientRects().length > 0,
	)

	if (parts.length === 0) throw new Error(`${framework}/${component}: открытого ${selector} нет`)

	return parts.map((part) => {
		const box = part.getBoundingClientRect()

		return {
			x: Math.round(box.left),
			y: Math.round(box.top),
			width: Math.round(box.width),
			height: Math.round(box.height),
		}
	})
}

beforeEach(async () => {
	document.documentElement.dataset.soTheme = 'oren'

	await router.push('/vue')

	renderStand()

	await settle()
})

describe('хост Svelte', () => {
	// The selector is the component and its parts: the wrapper, collection items,
	// panels, drawn parts of the markup
	it.each([
		['button', '.so-button'],
		['icon', '.so-icon'],
		['skeleton', '.so-skeleton'],
		['input', '.so-input'],
		[
			'number-input',
			'.so-number-input, .so-number-input__input, .so-number-input__stepper, .so-number-input__decrement, .so-number-input__increment, .so-number-input svg',
		],
		['check-box', '.so-label, .so-check-box'],
		['switch', '.so-label, .so-switch'],
		['label', '.so-label, .so-check-box'],
		['field', '.so-field, .so-field__label, .so-field__control, .so-input, .so-field__helper'],
		['radio-group', '.so-radio-group, .so-radio-group-item'],
		['list-box', '.so-list-box, .so-list-box-item'],
		['tags', '.so-tags, .so-tags-item, .so-tags-item .so-button__text'],
		[
			'select',
			'.so-select, .so-select__field, .so-input__leading, .so-select__field input, .so-input__trailing, .so-select__arrow, .so-select__arrow svg',
		],
		['tabs', '.so-tabs, .so-tabs-item, .so-tabs-content'],
		['accordion', '.so-accordion, .so-accordion-item'],
		['table', '.so-table__viewport, .so-table, .so-table-column, .so-table-row'],
		['progress-spinner', '.so-progress-spinner'],
		['progress-linear', '.so-progress-linear, .so-progress-linear__range'],
		[
			'slider',
			'.so-label, .so-slider, .so-slider__track, .so-slider__range, .so-slider__thumb',
		],
		[
			'rating',
			'.so-label, .so-rating, .so-rating__star, .so-rating__star-fill, .so-rating svg',
		],
		[
			'scroller',
			'.so-scroller, .so-scroller__prev, .so-scroller__viewport, .so-scroller__next, .so-scroller svg',
		],
		[
			'pagination',
			'.so-pagination, .so-pagination__prev, .so-pagination-item, .so-pagination__ellipsis, .so-pagination__next, .so-pagination svg',
		],
		[
			'date-input',
			'.so-date-input, .so-date-input__segments, .so-date-input__segment, .so-date-input__literal',
		],
		[
			'calendar',
			'.so-calendar, .so-calendar__month, .so-calendar__heading, .so-calendar__title, .so-calendar__prev, .so-calendar__next, .so-calendar svg, .so-calendar__grid, .so-calendar__weekday, .so-calendar-item, .so-calendar__filler',
		],
		// The DatePicker panel is teleported past the stage: the cell holds the field and its button
		[
			'date-picker',
			'.so-date-picker, .so-date-picker__field, .so-date-input__segment, .so-date-input__literal, .so-date-input__trailing, .so-date-picker__trigger, .so-date-picker__trigger svg',
		],
		// Overlays in the cell: the root with its trigger, the buttons that open the
		// dialog, the drawer and the toasts — panels and the region are teleported
		// past the stage
		['popover', '.so-popover, .so-popover .so-button'],
		['tooltip', '.so-tooltip, .so-tooltip .so-button'],
		['menu', '.so-menu, .so-menu .so-button'],
		['dialog', '.so-button'],
		['drawer', '.so-button'],
		['toasts', '.so-button'],
	])('%s стоит в ячейке так же, как у Vue', async (component, selector) => {
		await expectSvelteLikeVue(component, selector)
	})

	/**
	 * The window's row: a list with a row limit, a Select in a column of its own
	 * width and a table in a wrapper. The wrapper has no `visible` row — it has no
	 * view — and the stage is taken from the row of its switch.
	 */
	it('virtual: ряд окна стоит в ячейке так же, как у Vue', async () => {
		const selector =
			'.so-list-box, .so-list-box-item, .so-select, .so-select__field, .so-table__viewport, .so-table, .so-table-row'
		const vue = await expectSvelteLikeVue('virtual', selector, 'enabled')

		expect(vue.length).toBeGreaterThan(3)
	})

	// What opens the overlay, its parts and their number: the panel, backdrop,
	// title, body, footer, close button and content; for Select — the panel,
	// list and options; for the menu — the panel, list, groups with labels,
	// separators, items with rows and the visible wrappers of rows (marks,
	// shortcuts, arrows); for toasts — the region with a toast (the empty regions
	// of the other columns stand at the same edge), the toast, card, icon, text,
	// the «Отменить» button and the close button; for the calendar — the month
	// and year picker panel, card, the list of 12 months and the header with the
	// year and arrows; for DatePicker — the panel, content, calendar, month,
	// heading with its button, paging buttons, grid and weekday labels — no days:
	// their number depends on the month. The number of parts keeps an overlay
	// that didn't open from matching itself
	it.each([
		[
			'popover',
			button('Открыть'),
			'.so-popover__panel, .so-popover__content, .so-popover__content > *, .so-popover__close',
			5,
		],
		[
			'select',
			node('.so-select__arrow'),
			'.so-select__panel, .so-select__list, .so-select-item',
			7,
		],
		[
			'menu',
			button('Действия'),
			'.so-menu__panel, .so-menu__list, .so-menu-group, .so-menu-group__label, .so-menu-separator, .so-menu-item, .so-menu-item > .so-button, .so-menu-item__indicator, .so-menu-item__shortcut, .so-menu-item__arrow',
			38,
		],
		[
			'dialog',
			button('Открыть окно'),
			'.so-backdrop:has(+ .so-dialog), .so-dialog, .so-dialog__title, .so-dialog__body, .so-dialog__body > *, .so-dialog__footer, .so-dialog__footer > *, .so-dialog__close',
			10,
		],
		[
			'drawer',
			button('Открыть панель'),
			'.so-backdrop:has(+ .so-drawer), .so-drawer, .so-drawer__title, .so-drawer__body, .so-drawer__body > *, .so-drawer__footer, .so-drawer__footer > *, .so-drawer__close',
			10,
		],
		[
			'toasts',
			button('обычное'),
			'.so-toasts:has(.so-toasts-item), .so-toasts-item, .so-toasts-item__card, .so-toasts-item__icon, .so-toasts-item__text, .so-toasts-item__content > *, .so-toasts-item__close',
			7,
		],
		// The month and year picker panel is in the calendar (`contained`), not in `body`
		[
			'calendar',
			node('.so-calendar__title'),
			'.so-calendar .so-popover__panel, .so-calendar__picker, .so-calendar__picker-list, .so-calendar__picker .so-list-box-item, .so-calendar__picker-header, .so-calendar__picker-heading, .so-calendar__picker-prev, .so-calendar__picker-next',
			19,
		],
		[
			'date-picker',
			node('.so-date-picker__trigger'),
			'.so-date-picker__panel, .so-date-picker__content, .so-date-picker__calendar, .so-date-picker__panel .so-calendar__month, .so-date-picker__panel .so-calendar__heading, .so-date-picker__panel .so-calendar__title, .so-date-picker__panel .so-calendar__prev, .so-date-picker__panel .so-calendar__next, .so-date-picker__panel .so-calendar__grid, .so-date-picker__panel .so-calendar__weekday',
			16,
		],
	])('%s: открытый стоит так же, как у Vue', async (component, opener, selector, parts) => {
		const vue = await openedBoxesOf('vue', component, opener, selector)
		const svelte = await openedBoxesOf('svelte', component, opener, selector)

		expect(svelte).toHaveLength(parts)
		expect(svelte[0].width).toBeGreaterThan(0)
		expect(svelte).toEqual(vue)
	})
})
