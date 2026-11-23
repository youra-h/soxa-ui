/**
 * Dialog in a real browser: the theme's layout and transition, the browser's
 * actions.
 *
 * Place, size, the offset from the screen's edges and maximizing are laid out
 * by the theme, without measuring, — jsdom doesn't compute them, and the unit
 * tests (`ui/vue/__tests__/dialog.spec.ts`) see only classes and variables.
 * Here is what they make on screen: the dialog in the center and at the sides
 * (logical ones — in RTL `start` is on the right), at its offset from the
 * edges, maximized to the whole screen, long content scrolling in the body.
 * Appearing and disappearing go by the theme's transition: the dialog fades in
 * and out together with the backdrop, in place, whatever the system's motion
 * settings. The page's scrolling, locked under the dialog, comes back once the
 * dialog has disappeared: back on closing, it would shift the dialog sideways
 * while it fades.
 *
 * jsdom doesn't perform the action of `mousedown` either: there one sees only
 * that the focus model cancels it. Here — that a press on the backdrop really
 * doesn't take focus away: neither the one returned to the button that opened
 * the dialog, nor the one staying in a dialog that closes only by a button.
 * And that Tab goes around in the order the browser itself keeps.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from './render'
import { page, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref, type VNode } from 'vue'
import { Button, Dialog } from '@soxa-ui/vue'
import type { IDialogProps, TBackdropView, TDialogPlacement } from '@soxa-ui/core'
import type { TDialogOffsetEvent } from '@soxa-ui/plugins'

import { reducedMotion } from './media'
import {
	durationOf,
	easingOf,
	settled,
	transitionOf,
	transitioning,
	whileLeaving,
} from './transitions'
import { expectClassicScrollbar } from './viewport'
import { classicScrollbars } from './engine'

import '@soxa-ui/theme-oren'

/**
 * The dialog's offset from the screen's edge in the oren theme:
 * `calc(var(--spacing) * 4)`. One for the place at a side and for the size cap.
 */
const GAP = 16

/** The dialog's default width in the oren theme: `32rem`. */
const DEFAULT_WIDTH = 512

/** Tolerance for subpixel rounding of coordinates. */
const EPSILON = 1

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/** Content with two Tab stops. */
const inside = (): VNode[] => [
	h('button', { class: 'so-test-first' }, 'Первая'),
	h('button', { class: 'so-test-second' }, 'Вторая'),
]

type TPageOptions = {
	/** The page is taller than the screen — with a scrollbar */
	tall?: boolean
}

/**
 * A page with a button that opens the dialog, and the dialog on
 * `v-model:visible`. The footer has one more Tab stop. Besides the dialog's
 * props — handlers of its events (`onLayout:offset:before`).
 */
const show = async (
	props: Partial<IDialogProps> & Record<string, unknown> = {},
	content: () => VNode[] = inside,
	{ tall = false }: TPageOptions = {},
) => {
	const shown = ref(false)

	render(
		defineComponent({
			render: () =>
				h('div', { style: tall ? 'padding: 40px; height: 3000px' : 'padding: 40px' }, [
					h(
						'button',
						{
							class: 'so-test-opener',
							onClick: () => {
								shown.value = true
							},
						},
						'Открыть',
					),
					h(
						Dialog,
						{
							...props,
							visible: shown.value,
							'onUpdate:visible': (value: boolean) => {
								shown.value = value
							},
						},
						{
							title: () => 'Настройки',
							default: content,
							footer: () => h(Button, { text: 'Готово', class: 'so-test-ok' }),
						},
					),
				]),
		}),
	)

	await nextTick()
	await nextFrame()
	await nextFrame()

	return shown
}

/** A node by selector; without it the test fails here, not on reading a property. */
const find = (selector: string): HTMLElement => {
	const element = document.querySelector(selector)

	if (!(element instanceof HTMLElement)) throw new Error(`${selector}: HTML-узла нет`)

	return element
}

const panel = () => find('.so-dialog')
const backdrop = () => find('.so-backdrop:has(+ .so-dialog)')
const opener = () => find('.so-test-opener')
const isOpen = () => getComputedStyle(panel()).display !== 'none'
const active = () => document.activeElement

/** Open by the page's button and wait until focus goes into the dialog. */
const open = async () => {
	await userEvent.click(opener())
	await expect.poll(active).toBe(find('.so-test-first'))
}

/**
 * Open by an event in the page itself, not through `userEvent`: the transition
 * is read right after the render and has no time to play out, however slow the
 * run.
 */
const openInPage = async () => {
	opener().click()
	await nextTick()
}

/** Close by Escape — the same way, by an event in the page itself, at the focused node. */
const escapeInPage = async () => {
	active()?.dispatchEvent(
		new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
	)
	await nextTick()
}

/** The visible area — the boundary from which the theme counts the dialog's place. */
const viewport = () => ({
	width: document.documentElement.clientWidth,
	height: document.documentElement.clientHeight,
})

/** The dialog's gaps to the four edges of the visible area. */
const gaps = () => {
	const box = panel().getBoundingClientRect()
	const { width, height } = viewport()

	return {
		left: box.left,
		right: width - box.right,
		top: box.top,
		bottom: height - box.bottom,
	}
}

beforeEach(async () => {
	document.documentElement.dataset.soTheme = 'oren'
	// Wider than the default dialog with its offsets: otherwise the dialog would
	// hit the width cap, and the center and the sides would look the same
	await page.viewport(1000, 700)
})

afterEach(async () => {
	cleanup()
	await reducedMotion('no-preference')
})

describe('место', () => {
	it('по умолчанию — по центру экрана', async () => {
		await show()
		await open()

		const { left, right, top, bottom } = gaps()

		expect(Math.abs(left - right)).toBeLessThan(EPSILON)
		expect(Math.abs(top - bottom)).toBeLessThan(EPSILON)
		expect(left).toBeGreaterThan(GAP)
	})

	/**
	 * The dialog is pressed to its side at the offset and centered on the other
	 * axis. `start` and `end` are logical sides: in RTL they swap.
	 */
	it.each<[TDialogPlacement, 'ltr' | 'rtl', 'left' | 'right' | 'top' | 'bottom']>([
		['start', 'ltr', 'left'],
		['end', 'ltr', 'right'],
		['start', 'rtl', 'right'],
		['end', 'rtl', 'left'],
		['top', 'ltr', 'top'],
		['bottom', 'ltr', 'bottom'],
	])('%s в %s — у края %s', async (placement, direction, edge) => {
		await show({ placement, direction })
		await open()

		const box = gaps()
		const horizontal = edge === 'left' || edge === 'right'
		const [near, far] = horizontal ? [box.top, box.bottom] : [box.left, box.right]

		expect(Math.abs(box[edge] - GAP)).toBeLessThan(EPSILON)
		// Centered on the other axis
		expect(Math.abs(near - far)).toBeLessThan(EPSILON)
	})
})

describe('размер', () => {
	it('ширина не задана — ширина темы, задана — своя', async () => {
		await show()
		await open()

		expect(Math.round(panel().getBoundingClientRect().width)).toBe(DEFAULT_WIDTH)

		cleanup()

		await show({ width: 400 })
		await open()

		expect(Math.round(panel().getBoundingClientRect().width)).toBe(400)
	})

	it('размер больше экрана упирается в экран с отступом', async () => {
		await show({ width: 5000, height: 5000 })
		await open()

		const { left, right, top, bottom } = gaps()

		expect(Math.abs(left - GAP)).toBeLessThan(EPSILON)
		expect(Math.abs(right - GAP)).toBeLessThan(EPSILON)
		expect(Math.abs(top - GAP)).toBeLessThan(EPSILON)
		expect(Math.abs(bottom - GAP)).toBeLessThan(EPSILON)
	})

	it('развёрнутое — на весь экран, место и размер не действуют', async () => {
		await show({ maximized: true, placement: 'end', width: 300 })
		await open()

		const box = panel().getBoundingClientRect()
		const { width, height } = viewport()

		expect(box.left).toBe(0)
		expect(box.top).toBe(0)
		expect(Math.round(box.width)).toBe(width)
		expect(Math.round(box.height)).toBe(height)
	})

	it('кнопка разворота разворачивает окно и возвращает ему размер', async () => {
		await show({ maximizable: true })
		await open()

		await userEvent.click(find('.so-dialog__maximize'))

		await expect
			.poll(() => Math.round(panel().getBoundingClientRect().width))
			.toBe(viewport().width)

		await userEvent.click(find('.so-dialog__maximize'))

		await expect
			.poll(() => Math.round(panel().getBoundingClientRect().width))
			.toBe(DEFAULT_WIDTH)
	})

	it('длинное содержимое прокручивается в теле, шапка и подвал на месте', async () => {
		await show({}, () => [...inside(), h('div', { style: 'height: 2000px' })])
		await open()

		const box = panel().getBoundingClientRect()
		const body = find('.so-dialog__body')
		const title = find('.so-dialog__title').getBoundingClientRect()
		const footer = find('.so-dialog__footer').getBoundingClientRect()

		expect(Math.abs(box.height - (viewport().height - 2 * GAP))).toBeLessThan(EPSILON)
		expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
		expect(title.top).toBeGreaterThanOrEqual(box.top)
		expect(footer.bottom).toBeLessThanOrEqual(box.bottom + EPSILON)
		expect(footer.height).toBeGreaterThan(0)
	})
})

/**
 * The offset is the margins of the screen area the theme fits the dialog into:
 * in the center the dialog is centered in the area, at a side — at its edge,
 * and in every case the area is the size cap. Checked with a dialog larger than
 * the screen: it hits the cap, and its gaps to the screen's edges are the
 * offsets.
 */
describe('отступ', () => {
	/** Larger than the screen at any offset: the dialog hits the cap. */
	const HUGE = { width: 5000, height: 5000 } as const

	/** The gap to an edge matches the expected one within the tolerance. */
	const near = (actual: number, expected: number) =>
		expect(Math.abs(actual - expected)).toBeLessThan(EPSILON)

	it('0 — окно-потолок вплотную к краям экрана', async () => {
		await show({ ...HUGE, offset: 0 })
		await open()

		const { left, right, top, bottom } = gaps()

		near(left, 0)
		near(right, 0)
		near(top, 0)
		near(bottom, 0)
	})

	it('число у центра — отступ со всех сторон', async () => {
		await show({ ...HUGE, offset: 40 })
		await open()

		const { left, right, top, bottom } = gaps()

		near(left, 40)
		near(right, 40)
		near(top, 40)
		near(bottom, 40)
	})

	it('число у центра окна меньше экрана его не двигает: окно по-прежнему по центру', async () => {
		await show({ offset: 40 })
		await open()

		const { left, right, top, bottom } = gaps()

		near(left, right)
		near(top, bottom)
	})

	/**
	 * At a side the dialog stands at the offset from its edge and is centered on
	 * the other axis. `start` and `end` are logical: in RTL they swap.
	 */
	it.each<[TDialogPlacement, 'ltr' | 'rtl', 'left' | 'right']>([
		['start', 'ltr', 'left'],
		['start', 'rtl', 'right'],
		['end', 'ltr', 'right'],
		['end', 'rtl', 'left'],
	])('число у %s в %s — от края %s', async (placement, direction, edge) => {
		await show({ placement, direction, offset: 40 })
		await open()

		const box = gaps()

		near(box[edge], 40)
		near(box.top, box.bottom)
	})

	it("'10%' — от экрана по своей оси: по горизонтали от ширины, по вертикали от высоты", async () => {
		await show({ ...HUGE, offset: '10%' })
		await open()

		const { left, right, top, bottom } = gaps()
		const { width, height } = viewport()

		near(left, width / 10)
		near(right, width / 10)
		near(top, height / 10)
		near(bottom, height / 10)
	})

	it('top из события сдвигает центр: окно по центру области, а не экрана', async () => {
		await show({
			offset: 20,
			'onLayout:offset:before': (event: TDialogOffsetEvent) => {
				event.top = 200
			},
		})
		await open()

		const { left, right, top, bottom } = gaps()

		// Equally far from the area's edges — and those are 200 and 20 from the screen's
		near(top - 200, bottom - 20)
		near(left, right)
	})

	it('развёрнутое отступов не читает — на весь экран', async () => {
		await show({ maximized: true, offset: 50 })
		await open()

		const { left, right, top, bottom } = gaps()

		near(left, 0)
		near(right, 0)
		near(top, 0)
		near(bottom, 0)
	})
})

describe('подложка', () => {
	it('накрывает экран под окном: мимо окна нажатие приходится в неё', async () => {
		await show()
		await open()

		const box = panel().getBoundingClientRect()

		expect(document.elementFromPoint(4, 4)).toBe(backdrop())
		expect(
			panel().contains(
				document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2),
			),
		).toBe(true)
	})
})

describe('появление и исчезание', () => {
	/** The properties that transition, besides `display`: that one only defers hiding. */
	const moving = (element: Element) =>
		transitioning(element).filter((property) => property !== 'display')

	/** The duration and curve of the opacity transition on the node. */
	const timingOf = (element: Element) => {
		const transition = transitionOf(element, 'opacity')

		return { duration: durationOf(transition), easing: easingOf(transition) }
	}

	/** The opacity transition of the dialog and the backdrop — right now. */
	const timings = () => ({ panel: timingOf(panel()), backdrop: timingOf(backdrop()) })

	/**
	 * The theme holds the transition: `@starting-style` gives the shown dialog
	 * and backdrop zero opacity, `allow-discrete` defers `display: none` until
	 * the end of the disappearing. The code has no animation hooks — it is seen
	 * by the transition on the nodes themselves.
	 */
	it('открытие — окно и подложка проявляются, закрытие — гаснут и только потом пропадают', async () => {
		await show()
		await openInPage()

		expect(transitioning(panel())).toContain('opacity')
		expect(transitioning(backdrop())).toContain('opacity')

		await expect.poll(active).toBe(find('.so-test-first'))
		await settled(panel())
		await settled(backdrop())
		await escapeInPage()

		// They fade: until the transition's end both are in the document, not `display: none`
		for (const element of [panel(), backdrop()]) {
			expect(element.dataset.open).toBe('false')
			expect(transitioning(element)).toContain('opacity')
			expect(getComputedStyle(element).display).not.toBe('none')
		}

		await expect.poll(isOpen).toBe(false)
		await expect.poll(() => getComputedStyle(backdrop()).display).toBe('none')
	})

	/**
	 * The dialog appears in its place rather than sliding in, and maximizing and
	 * size change at once. With a transition of all properties they would travel
	 * too.
	 */
	it('переходит только прозрачность: окно не выезжает, разворот — сразу', async () => {
		await show({ maximizable: true })
		await openInPage()

		expect(moving(panel())).toEqual(['opacity'])
		expect(moving(backdrop())).toEqual(['opacity'])

		await expect.poll(active).toBe(find('.so-test-first'))
		await settled(panel())

		find('.so-dialog__maximize').click()
		await nextTick()

		expect(panel().dataset.maximized).toBe('true')
		expect(transitioning(panel())).toEqual([])
		expect(Math.round(panel().getBoundingClientRect().width)).toBe(viewport().width)
	})

	/**
	 * The dimming is part of the same appearing: it starts and ends together with
	 * the dialog and goes at the same pace. Disappearing is shorter than
	 * appearing: nobody waits for a closed dialog.
	 */
	it('окно и подложка идут вместе, исчезание короче появления', async () => {
		await show()
		await openInPage()

		const entering = timings()

		await expect.poll(active).toBe(find('.so-test-first'))
		await settled(panel())
		await settled(backdrop())
		await escapeInPage()

		const leaving = timings()

		expect(entering.backdrop).toEqual(entering.panel)
		expect(leaving.backdrop).toEqual(leaving.panel)
		expect(leaving.panel.duration).toBeLessThan(entering.panel.duration)
	})

	/**
	 * Opacity isn't motion: the dialog stands in place, and the motion mode
	 * doesn't touch the transition. A guard of that decision: without it the
	 * transition would be hidden in the theme's motion add-on, like the travel of
	 * the Slider handles.
	 */
	it('система просит меньше движения — окно всё равно проявляется и гаснет', async () => {
		await reducedMotion('reduce')
		await show()

		// The emulation is on — otherwise the guard would check the usual mode
		expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true)

		await openInPage()

		expect(transitioning(panel())).toContain('opacity')
		expect(transitioning(backdrop())).toContain('opacity')

		await expect.poll(active).toBe(find('.so-test-first'))
		await settled(panel())
		await escapeInPage()

		// It fades: until the transition's end the dialog is in the document
		expect(panel().dataset.open).toBe('false')
		expect(getComputedStyle(panel()).display).not.toBe('none')

		await expect.poll(isOpen).toBe(false)
	})
})

/**
 * The page's scrolling under the dialog is locked, and the scrollbar goes with
 * it. Back as soon as the dialog is closed, it would narrow the viewport, and
 * the centered dialog would shift by half the bar's width while it fades. So
 * scrolling comes back once the dialog has disappeared.
 */
describe.runIf(classicScrollbars)('прокрутка страницы', () => {
	/** The page's scrolling is locked: the lock holds `overflow` on `html`. */
	const locked = () => getComputedStyle(document.documentElement).overflow === 'hidden'

	/** The dialog's frame — place and size. */
	const frame = () => {
		const { left, top, width, height } = panel().getBoundingClientRect()

		return { left, top, width, height }
	}

	it('пока окно гаснет, прокрутка заперта и окно на месте, а исчезло — прокрутка вернулась', async () => {
		await show({}, inside, { tall: true })

		// The bar takes room — otherwise the dialog has nothing to shift from, and
		// the guard is empty
		expectClassicScrollbar()

		await open()
		await settled(panel())

		const place = frame()

		await whileLeaving(panel(), escapeInPage, () => {
			expect(locked(), 'прокрутка заперта').toBe(true)
			expect(frame(), 'окно на месте').toEqual(place)
		})

		await expect.poll(locked).toBe(false)
		expectClassicScrollbar()
	})

	/**
	 * Opening interrupts the closing's transition. The lock stays — it hasn't
	 * been released yet, — and the next closing releases it once.
	 */
	it('открыли снова, пока окно гаснет: прокрутка заперта, следующее закрытие её возвращает', async () => {
		await show({}, inside, { tall: true })

		expectClassicScrollbar()

		await open()
		await settled(panel())
		await escapeInPage()
		await nextFrame()

		// The dialog still fades — opening will interrupt its transition
		expect(transitioning(panel())).toContain('opacity')

		await openInPage()
		await expect.poll(active).toBe(find('.so-test-first'))
		await settled(panel())

		// The interrupted transition is cancelled, and the lock stays
		expect(locked()).toBe(true)

		await escapeInPage()

		await expect.poll(isOpen).toBe(false)
		await expect.poll(locked).toBe(false)
	})
})

describe('фокус', () => {
	it('открытие уводит фокус на первую остановку содержимого, а не на кнопки шапки', async () => {
		await show({ maximizable: true })
		await open()

		expect(active()).toBe(find('.so-test-first'))
	})

	it('Tab ходит по кругу: с крестика — снова на первую остановку', async () => {
		await show()
		await open()

		await userEvent.keyboard('{Tab}')
		expect(active()).toBe(find('.so-test-second'))

		await userEvent.keyboard('{Tab}')
		expect(active()).toBe(find('.so-test-ok'))

		await userEvent.keyboard('{Tab}')
		expect(active()).toBe(find('.so-dialog__close'))

		await userEvent.keyboard('{Tab}')
		expect(active()).toBe(find('.so-test-first'))

		await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
		expect(active()).toBe(find('.so-dialog__close'))
	})

	it('Escape закрывает и возвращает фокус на кнопку, с которой открыли', async () => {
		await show()
		await open()

		await userEvent.keyboard('{Escape}')

		await expect.poll(isOpen).toBe(false)
		expect(active()).toBe(opener())
	})

	it('крестик закрывает и возвращает фокус', async () => {
		await show()
		await open()

		await userEvent.click(find('.so-dialog__close'))

		await expect.poll(isOpen).toBe(false)
		expect(active()).toBe(opener())
	})

	/**
	 * The dialog closes on `pointerdown` already, and focus returns at once. Had
	 * the focus model not cancelled this press's `mousedown`, its action would
	 * carry the returned focus to `body`.
	 */
	it('нажатие по подложке закрывает, и фокус остаётся на кнопке, с которой открыли', async () => {
		await show()
		await open()

		await userEvent.click(backdrop(), { position: { x: 4, y: 4 } })

		await expect.poll(isOpen).toBe(false)
		expect(active()).toBe(opener())
	})

	/**
	 * A dialog that closes only by a button isn't closed by a press on the
	 * backdrop — and focus doesn't leave it: from `body` Tab would lead to the
	 * page under the dialog.
	 */
	it('dismissible: false — нажатие по подложке фокус из окна не уводит, Tab остаётся в окне', async () => {
		await show({ dismissible: false })
		await open()

		await userEvent.click(backdrop(), { position: { x: 4, y: 4 } })

		expect(isOpen()).toBe(true)
		expect(active()).toBe(find('.so-test-first'))

		await userEvent.keyboard('{Tab}')

		expect(active()).toBe(find('.so-test-second'))
	})
})

describe('Oren backdrop views', () => {
	it('switches views on the same node and keeps the transparent backdrop interactive', async () => {
		const view = ref<TBackdropView>()
		await show({
			get backdrop() {
				return view.value
			},
		})
		await open()

		const node = backdrop()
		expect(node.getAttribute('aria-hidden')).toBe('true')
		const styles = () => getComputedStyle(node)
		await expect.poll(() => styles().opacity).toBe('0.5')
		const tint = styles().backgroundColor

		view.value = 'blur'
		await nextTick()
		expect(backdrop()).toBe(node)
		expect(node.classList.contains('so-backdrop--view-blur')).toBe(true)
		expect(styles().backdropFilter).toBe('blur(3px)')
		node.style.setProperty('--so-backdrop-blur', '6px')
		expect(styles().backdropFilter).toBe('blur(6px)')
		await expect.poll(() => styles().opacity).toBe('1')

		view.value = 'dim'
		await nextTick()
		expect(styles().backdropFilter).toBe('none')
		expect(styles().backgroundColor).toBe(tint)

		view.value = undefined
		await nextTick()
		expect(node.classList.contains('so-backdrop--view-dim')).toBe(false)

		view.value = 'none'
		await nextTick()
		expect(styles().backgroundColor).toBe('rgba(0, 0, 0, 0)')
		expect(document.elementFromPoint(4, 4)).toBe(node)
		await userEvent.click(node, { position: { x: 4, y: 4 } })
		await expect.poll(isOpen).toBe(false)
		expect(active()).toBe(opener())
	})
})

describe('non-modal page interaction', () => {
	it('preserves opening focus, permits Tab in both directions and keeps a corner fixed while scrolling', async () => {
		const shown = await show(
			{
				modal: false,
				dismissible: false,
				placement: 'bottom',
				width: 320,
				style: 'margin-inline-start: 0',
			},
			inside,
			{ tall: true },
		)
		await userEvent.click(opener())
		await settled(panel())
		expect(active()).toBe(opener())
		expect(document.querySelector('.so-backdrop:has(+ .so-dialog)')).toBeNull()
		expect(panel().hasAttribute('aria-modal')).toBe(false)
		expect(opener().closest('[aria-hidden="true"], [inert]')).toBeNull()
		expect(getComputedStyle(document.documentElement).overflow).not.toBe('hidden')
		expect(getComputedStyle(panel()).position).toBe('fixed')
		expect(panel().getBoundingClientRect().left).toBeCloseTo(GAP, 0)

		await userEvent.keyboard('{Tab}')
		expect(active()).toBe(find('.so-test-first'))
		await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
		expect(active()).toBe(opener())
		await userEvent.click(find('.so-dialog__close'))
		await nextTick()
		expect(shown.value).toBe(false)

		await userEvent.click(opener())
		await settled(panel())
		const before = panel().getBoundingClientRect()
		window.scrollTo(0, 400)
		await expect.poll(() => window.scrollY).toBeGreaterThan(100)
		expect(panel().getBoundingClientRect().top).toBeCloseTo(before.top, 0)
		expect(panel().getBoundingClientRect().left).toBeCloseTo(before.left, 0)

		window.scrollTo(0, 0)
		await userEvent.click(opener())
		expect(shown.value).toBe(true)
		await userEvent.keyboard('{Escape}')
		expect(shown.value).toBe(true)
	})

	it('Tab leaves the last dialog control without closing the dialog', async () => {
		const shown = await show({ modal: false, dismissible: false })
		await userEvent.click(opener())
		await settled(panel())
		find('.so-dialog__close').focus()
		await userEvent.keyboard('{Tab}')
		expect(panel().contains(active())).toBe(false)
		expect(shown.value).toBe(true)
	})
})
