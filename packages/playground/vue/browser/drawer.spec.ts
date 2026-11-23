/**
 * Drawer in a real browser: the theme's layout, the transition and the pointer
 * gesture.
 *
 * The edge, the size and the place in a container are laid out by the theme,
 * without measuring, — jsdom doesn't compute them, and the unit tests
 * (`ui/vue/__tests__/drawer.spec.ts`) see only classes, variables and `data-*`.
 * Here is what they make on screen: the panel at its edge (a logical one — in
 * RTL `start` is on the right), full height or width, inside a container —
 * within its bounds; sliding in and out goes by the theme's transition: no
 * flash in the first frames, the backdrop darkens together with the panel, and
 * without motion the panel fades in and out in place. The page's scrolling,
 * locked under the panel, comes back once the panel has slid out: back on
 * closing, it would shift the panel sideways at the start of its slide.
 *
 * The gesture — with a real mouse and a finger: jsdom performs neither pointer
 * capture, nor `touch-action`, nor scrolling by touch, nor a press on the strip
 * that doesn't take focus away.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from './render'
import { commands, page, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref, type VNode } from 'vue'
import { Drawer, Input } from '@soxa-ui/vue'
import type { IDrawerProps, TCloseEvent, TCloseReason, TDrawerPlacement } from '@soxa-ui/core'

import { DIRECTION_CASES, setDir, sidesOf, type TLine } from './directions'
import { reducedMotion } from './media'
import { durationOf, settled, transitionOf, transitioning, whileLeaving } from './transitions'
import { expectClassicScrollbar } from './viewport'
import { classicScrollbars, continuousTouch } from './engine'

import '@soxa-ui/theme-oren'

/** The side panel's default width in the oren theme: `20rem`. */
const DEFAULT_WIDTH = 320

/** The strip of backdrop the theme leaves at any panel size: `3rem`. */
const GAP = 48

/** The gesture strip's grip zone — at least 24px: the target minimum of WCAG 2.5.8. */
const GRIP_ZONE = 24

/** Tolerance for subpixel rounding of coordinates. */
const EPSILON = 1

/**
 * The first frames of sliding in, ms: six frames at 60 Hz. Had the panel and
 * the dimming covered almost all their path by this moment, the slide would
 * look like a flash.
 */
const FIRST_FRAMES = 100

/** The share of the path past which sliding in during the first frames is a flash. */
const FLASH_SHARE = 2 / 3

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/** Content with two Tab stops. */
const inside = (): VNode[] => [
	h('button', { class: 'so-test-first' }, 'Первая'),
	h('button', { class: 'so-test-second' }, 'Вторая'),
]

type TShowOptions = {
	/** The panel in a 600 × 300 container offset from the page's edge */
	contained?: boolean
	/** The container's direction */
	dir?: TLine
	content?: () => VNode[]
	/** A `close:before` subscriber */
	onCloseBefore?: (event: TCloseEvent) => void
	/** The page is taller than the screen — with a scrollbar */
	tall?: boolean
}

/**
 * A page with a button that opens the panel, and the panel on
 * `v-model:visible` — on the page or in a container.
 */
const show = async (
	props: Partial<IDrawerProps> = {},
	{ contained = false, dir, content = inside, onCloseBefore, tall = false }: TShowOptions = {},
) => {
	const shown = ref(false)
	const reasons: TCloseReason[] = []

	const drawer = () =>
		h(
			Drawer,
			{
				...props,
				contained,
				visible: shown.value,
				'onUpdate:visible': (value: boolean) => {
					shown.value = value
				},
				'onClose:before': (event: TCloseEvent) => {
					reasons.push(event.reason)
					onCloseBefore?.(event)
				},
			},
			{ title: () => 'Фильтры', default: content },
		)

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
					contained
						? h(
								'div',
								{
									class: 'so-test-host',
									dir,
									style: 'position: relative; width: 600px; height: 300px; margin-top: 20px',
								},
								[drawer()],
							)
						: drawer(),
				]),
		}),
	)

	await nextTick()
	await nextFrame()
	await nextFrame()

	return { shown, reasons }
}

/** A node by selector; without it the test fails here, not on reading a property. */
const find = (selector: string): HTMLElement => {
	const element = document.querySelector(selector)

	if (!(element instanceof HTMLElement)) throw new Error(`${selector}: HTML-узла нет`)

	return element
}

const panel = () => find('.so-drawer')
const backdrop = () => find('.so-backdrop:has(+ .so-drawer)')
const handle = () => find('.so-drawer__handle')
const opener = () => find('.so-test-opener')
const active = () => document.activeElement
const isOpen = () => getComputedStyle(panel()).display !== 'none'

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

/** Open by the page's button, wait for focus in the panel and for the end of sliding in. */
const open = async () => {
	await userEvent.click(opener())
	await expect.poll(active).toBe(find('.so-test-first'))
	await settled(panel())
}

/** The visible area — the boundary from which the theme counts the panel's edge. */
const viewport = () => ({
	width: document.documentElement.clientWidth,
	height: document.documentElement.clientHeight,
})

/** The panel's gaps to the four edges of an area. */
const gaps = (
	box: DOMRect,
	area: { left: number; top: number; width: number; height: number },
) => ({
	left: box.left - area.left,
	right: area.left + area.width - box.right,
	top: box.top - area.top,
	bottom: area.top + area.height - box.bottom,
})

/** Drag the mouse from the node's middle by `dx`, `dy` — with real events, in steps. */
const drag = (from: HTMLElement, dx: number, dy: number, steps = 10) => {
	const box = from.getBoundingClientRect()
	const x = box.width / 2
	const y = box.height / 2

	// `force`: the release point is outside the node, and Playwright's hit check
	// would wait until the node is under it
	return userEvent.dragAndDrop(from, from, {
		sourcePosition: { x, y },
		targetPosition: { x: x + dx, y: y + dy },
		steps,
		force: true,
	})
}

beforeEach(async () => {
	document.documentElement.dataset.soTheme = 'oren'
	await page.viewport(1000, 700)
})

afterEach(async () => {
	cleanup()
	setDir(document.documentElement)
	setDir(document.body)
	await reducedMotion('no-preference')
})

describe('край', () => {
	/**
	 * The panel is pressed close to its edge and stretches along the whole other
	 * axis. `start` and `end` are logical sides: in RTL they swap.
	 */
	it.each<[TDrawerPlacement, 'ltr' | 'rtl', 'left' | 'right' | 'top' | 'bottom']>([
		['end', 'ltr', 'right'],
		['start', 'ltr', 'left'],
		['end', 'rtl', 'left'],
		['start', 'rtl', 'right'],
		['top', 'ltr', 'top'],
		['bottom', 'ltr', 'bottom'],
	])('%s в %s — у края %s, во всю другую ось', async (placement, direction, edge) => {
		await show({ placement, direction })
		await open()

		const box = gaps(panel().getBoundingClientRect(), { left: 0, top: 0, ...viewport() })
		const horizontal = edge === 'left' || edge === 'right'
		const across = horizontal ? [box.top, box.bottom] : [box.left, box.right]

		expect(Math.abs(box[edge])).toBeLessThan(EPSILON)
		expect(across.every((gap) => Math.abs(gap) < EPSILON)).toBe(true)
	})
})

describe('размер', () => {
	it('боковая: ширина не задана — ширина темы, задана — своя', async () => {
		await show()
		await open()

		expect(Math.round(panel().getBoundingClientRect().width)).toBe(DEFAULT_WIDTH)

		cleanup()

		await show({ width: 400 })
		await open()

		expect(Math.round(panel().getBoundingClientRect().width)).toBe(400)
	})

	it('нижняя: высота по содержимому, задана — своя', async () => {
		await show({ placement: 'bottom' })
		await open()

		const auto = panel().getBoundingClientRect().height

		expect(auto).toBeGreaterThan(0)
		expect(auto).toBeLessThan(viewport().height / 2)

		cleanup()

		await show({ placement: 'bottom', height: 300 })
		await open()

		expect(Math.round(panel().getBoundingClientRect().height)).toBe(300)
	})

	it('больше экрана — упирается в экран без полосы подложки', async () => {
		await show({ width: 5000 })
		await open()

		expect(Math.round(panel().getBoundingClientRect().width)).toBe(viewport().width - GAP)
	})

	it('длинное содержимое прокручивается в теле, шапка на месте', async () => {
		await show(
			{ placement: 'bottom' },
			{ content: () => [...inside(), h('div', { style: 'height: 2000px' })] },
		)
		await open()

		const box = panel().getBoundingClientRect()
		const body = find('.so-drawer__body')

		expect(Math.abs(box.height - (viewport().height - GAP))).toBeLessThan(EPSILON)
		expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
		expect(find('.so-drawer__title').getBoundingClientRect().top).toBeGreaterThanOrEqual(
			box.top,
		)
	})
})

describe('подложка', () => {
	it('накрывает экран под панелью: мимо панели нажатие приходится в неё', async () => {
		await show()
		await open()

		const box = panel().getBoundingClientRect()

		expect(document.elementFromPoint(4, 4)).toBe(backdrop())
		expect(panel().contains(document.elementFromPoint(box.left + 20, box.top + 200))).toBe(true)
	})
})

describe('внутри контейнера', () => {
	it('панель и подложка — в границах контейнера, страница за ним открыта', async () => {
		await show({}, { contained: true })
		await open()

		const host = find('.so-test-host').getBoundingClientRect()
		const box = gaps(panel().getBoundingClientRect(), host)
		const cover = backdrop().getBoundingClientRect()

		expect(Math.abs(box.right)).toBeLessThan(EPSILON)
		expect(Math.abs(box.top)).toBeLessThan(EPSILON)
		expect(Math.abs(box.bottom)).toBeLessThan(EPSILON)
		expect(Math.round(cover.width)).toBe(Math.round(host.width))
		expect(Math.round(cover.height)).toBe(Math.round(host.height))
		// The backdrop doesn't cover the whole screen: above the container is the page
		expect(document.elementFromPoint(host.left + 4, host.top - 4)).not.toBe(backdrop())
		// A panel in a container doesn't lock the document's scrolling
		expect(getComputedStyle(document.documentElement).overflow).not.toBe('hidden')
	})
})

describe('въезд и выезд', () => {
	/**
	 * The theme holds the transition: `@starting-style` gives the shown panel a
	 * place beyond its edge, `allow-discrete` defers `display: none` until the
	 * end of sliding out. The code has no animation hooks — it is seen by the
	 * transition on the panel itself.
	 */
	it('открытие — панель въезжает переходом, закрытие — выезжает и только потом пропадает', async () => {
		await show()
		await openInPage()

		expect(transitioning(panel())).toContain('translate')

		await expect.poll(active).toBe(find('.so-test-first'))
		await settled(panel())
		await escapeInPage()

		// It slides out: until the transition's end the panel is in the document,
		// not `display: none`
		expect(panel().dataset.open).toBe('false')
		expect(getComputedStyle(panel()).display).not.toBe('none')

		await expect.poll(isOpen).toBe(false)
	})

	/**
	 * A flash is the first frames: by then the panel and the dimming have almost
	 * arrived. So it was with the vaul curve at 300 ms — nearly nine tenths of the
	 * path in 100 ms. The threshold is in time, not a share of the duration: so a
	 * shortened duration is caught too. The transitions are paused, and the
	 * moment is chosen by the test, not by the run's speed.
	 */
	it('въезд без вспышки: за первые 100 мс панель и затемнение не проходят двух третей пути', async () => {
		await show()
		await openInPage()

		const transitions = [
			transitionOf(panel(), 'translate'),
			transitionOf(backdrop(), 'opacity'),
		]

		// The panel's path — by its box: the computed `translate` mixes percents and px
		const look = () => ({
			edge: panel().getBoundingClientRect().left,
			shade: Number(getComputedStyle(backdrop()).opacity),
		})

		const at = (time: number) => {
			for (const transition of transitions) transition.currentTime = time

			return look()
		}

		for (const transition of transitions) transition.pause()

		const start = at(0)
		const early = at(FIRST_FRAMES)

		for (const transition of transitions) transition.finish()

		const end = look()
		const share = (key: 'edge' | 'shade') => (early[key] - start[key]) / (end[key] - start[key])

		// The path has begun — otherwise the check below would pass on a frozen panel too
		expect(share('edge')).toBeGreaterThan(0)
		expect(share('shade')).toBeGreaterThan(0)

		expect(share('edge')).toBeLessThanOrEqual(FLASH_SHARE)
		expect(share('shade')).toBeLessThanOrEqual(FLASH_SHARE)
	})

	/**
	 * The dimming is part of the same motion: it starts and ends together with
	 * the panel. Sliding out is shorter than sliding in: nobody waits for a closed
	 * panel.
	 */
	it('подложка идёт вместе с панелью, выезд короче въезда', async () => {
		const durations = () => ({
			panel: durationOf(transitionOf(panel(), 'translate')),
			backdrop: durationOf(transitionOf(backdrop(), 'opacity')),
		})

		await show()
		await openInPage()

		const entering = durations()

		await expect.poll(active).toBe(find('.so-test-first'))
		await settled(panel())
		await settled(backdrop())
		await escapeInPage()

		const leaving = durations()

		expect(entering.backdrop).toBe(entering.panel)
		expect(leaving.backdrop).toBe(leaving.panel)
		expect(leaving.panel).toBeLessThan(entering.panel)
	})

	/**
	 * Sliding in and out is motion, and without it (here — at the system's
	 * request) the panel fades in and out in place by opacity, like a Dialog,
	 * while the backdrop darkens and lightens as always. The panel still
	 * disappears after the transition. The application's mode over the system's
	 * one — `browser/motion-mode.spec.ts`.
	 */
	it('система просит меньше движения — панель проявляется и гаснет на месте', async () => {
		await reducedMotion('reduce')
		await show()

		// The emulation is on — otherwise the guard would check the usual mode
		expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true)

		await openInPage()

		expect(transitioning(panel())).toContain('opacity')
		expect(transitioning(panel())).not.toContain('translate')
		expect(transitioning(backdrop())).toContain('opacity')

		// Fading in starts at the place where the panel will stand: the transition
		// is paused, and the moment is chosen by the test
		const fade = transitionOf(panel(), 'opacity')

		fade.pause()
		fade.currentTime = 0

		const start = panel().getBoundingClientRect()

		expect(Number(getComputedStyle(panel()).opacity)).toBe(0)

		fade.finish()

		expect(panel().getBoundingClientRect().left).toBe(start.left)

		await expect.poll(active).toBe(find('.so-test-first'))
		await settled(panel())

		const place = panel().getBoundingClientRect().left

		// It fades in place and stays in the document until the transition's end
		await whileLeaving(panel(), escapeInPage, () => {
			expect(transitioning(panel()), 'не едет').not.toContain('translate')
			expect(panel().getBoundingClientRect().left, 'панель на месте').toBe(place)
		})

		await expect.poll(isOpen).toBe(false)
	})
})

/**
 * A side panel slides in from beyond its edge and slides out past it. The place
 * at the edge is logical, and the browser sets it itself, while the side of the
 * shift is set by the theme: a shift has no logical directions. The theme takes
 * the sign from the nearest `dir`, as the browser takes the directionality, so
 * a panel with `direction="ltr"` in an RTL ancestor slides in from beyond its
 * own edge, not the opposite one (`browser/directions.ts`).
 *
 * The panel's ancestor on the page is `body`: the teleport takes it there. The
 * ancestor of a panel in a container is the container itself.
 */
describe.each(DIRECTION_CASES)('выезд по ближайшему dir: $name', (scenario) => {
	const sides = sidesOf(scenario.line)

	it.each([
		['start', false],
		['end', false],
		['start', true],
		['end', true],
	] as const)(
		'%s, в контейнере — %s: въезжает из-за своего края',
		async (placement, contained) => {
			setDir(document.documentElement, scenario.page)
			setDir(document.body, contained ? undefined : scenario.ancestor)

			await show(
				{ placement, direction: scenario.direction },
				{ contained, dir: contained ? scenario.ancestor : undefined },
			)
			await openInPage()

			const edge = placement === 'start' ? sides.start : sides.end
			const area = contained
				? find('.so-test-host').getBoundingClientRect()
				: { left: 0, right: viewport().width }
			const entry = transitionOf(panel(), 'translate')

			// Sliding in starts at the closed panel's position: the transition is
			// paused, and the moment is chosen by the test
			entry.pause()
			entry.currentTime = 0

			const away = panel().getBoundingClientRect()

			entry.finish()

			const box = panel().getBoundingClientRect()

			// The open panel's gap to its edge and how far the closed one goes past it
			const gap = edge === 'left' ? box.left - area.left : area.right - box.right
			const beyond = edge === 'left' ? area.left - away.right : away.left - area.right

			// The open one is at its edge: the scene's direction is the one the test expects
			expect(Math.abs(gap), `открытая — у края ${edge}`).toBeLessThan(EPSILON)
			expect(beyond, `закрытая — целиком за краем ${edge}`).toBeGreaterThan(-EPSILON)
		},
	)
})

/**
 * The page's scrolling under the panel is locked, and the scrollbar goes with
 * it. Back as soon as the panel is closed, it would narrow the viewport, and a
 * panel at the right edge would start sliding out shifted by the bar's whole
 * width. So scrolling comes back once the panel has disappeared.
 */
describe.runIf(classicScrollbars)('прокрутка страницы', () => {
	/** The page's scrolling is locked: the lock holds `overflow` on `html`. */
	const locked = () => getComputedStyle(document.documentElement).overflow === 'hidden'

	it('пока панель выезжает, прокрутка заперта и панель не сдвинута, а исчезла — прокрутка вернулась', async () => {
		await show({}, { tall: true })

		// The bar takes room — otherwise the panel has nothing to shift from, and
		// the guard is empty
		expectClassicScrollbar()

		await open()

		// The panel's place without the slide: `offsetLeft` doesn't see
		// `translate`, while its box is moved by the slide itself
		const place = panel().offsetLeft

		await whileLeaving(panel(), escapeInPage, () => {
			expect(locked(), 'прокрутка заперта').toBe(true)
			expect(panel().offsetLeft, 'панель не сдвинута').toBe(place)
		})

		await expect.poll(locked).toBe(false)
		expectClassicScrollbar()
	})
})

describe('жест', () => {
	it('полосы нет без жеста; с жестом зона захвата — не меньше 24px поперёк края', async () => {
		await show()

		expect(document.querySelector('.so-drawer__handle')).toBeNull()

		cleanup()

		await show({ swipe: 'handle' })
		await open()

		expect(handle().getBoundingClientRect().width).toBeGreaterThanOrEqual(GRIP_ZONE)

		cleanup()

		await show({ swipe: 'handle', placement: 'bottom' })
		await open()

		expect(handle().getBoundingClientRect().height).toBeGreaterThanOrEqual(GRIP_ZONE)
	})

	it('пока жест включён, касание вдоль оси — жесту: touch-action на панели', async () => {
		await show({ swipe: 'handle' })
		await open()

		expect(getComputedStyle(panel()).touchAction).toBe('pan-y pinch-zoom')

		cleanup()

		await show({ swipe: 'panel', placement: 'bottom' })
		await open()

		expect(getComputedStyle(panel()).touchAction).toBe('pan-x pinch-zoom')
	})

	it('нажатие на полосу фокус не уводит', async () => {
		await show({ swipe: 'handle' })
		await open()

		await userEvent.click(handle())

		expect(active()).toBe(find('.so-test-first'))
	})

	it('смахнули к краю за полосу — закрытие с причиной swipe, фокус возвращается', async () => {
		const { shown, reasons } = await show({ swipe: 'handle' })

		await open()
		await drag(handle(), 200, 0)

		await expect.poll(isOpen).toBe(false)
		expect(shown.value).toBe(false)
		expect(reasons).toEqual(['swipe'])
		expect(active()).toBe(opener())
	})

	it('RTL: панель у левого края смахивают влево', async () => {
		const { reasons } = await show({ swipe: 'handle', direction: 'rtl' })

		await open()
		await drag(handle(), -200, 0)

		await expect.poll(isOpen).toBe(false)
		expect(reasons).toEqual(['swipe'])
	})

	it('нижнюю — вниз', async () => {
		const { reasons } = await show({ swipe: 'handle', placement: 'bottom' })

		await open()
		await drag(handle(), 0, 200)

		await expect.poll(isOpen).toBe(false)
		expect(reasons).toEqual(['swipe'])
	})

	it('от края — не закрытие: панель возвращается на место', async () => {
		const { reasons } = await show({ swipe: 'handle' })

		await open()

		const edge = panel().getBoundingClientRect().right

		await drag(handle(), -200, 0)

		// The offset goes a frame later, and the panel travels back by a transition
		await expect
			.poll(() => Math.abs(panel().getBoundingClientRect().right - edge) < EPSILON)
			.toBe(true)

		expect(isOpen()).toBe(true)
		expect(reasons).toEqual([])
		expect(panel().style.getPropertyValue('--so-swipe-offset')).toBe('')
	})

	it('отменённое close:before — панель остаётся и возвращается на место', async () => {
		const { reasons } = await show(
			{ swipe: 'handle' },
			{ onCloseBefore: (event) => event.preventDefault() },
		)

		await open()

		const left = panel().getBoundingClientRect().left

		await drag(handle(), 200, 0)

		await expect
			.poll(() => Math.abs(panel().getBoundingClientRect().left - left) < EPSILON)
			.toBe(true)

		expect(reasons).toEqual(['swipe'])
		expect(isOpen()).toBe(true)
		expect(panel().style.getPropertyValue('--so-swipe-offset')).toBe('')
	})

	describe('за всю панель', () => {
		it('тянут за заголовок — закрытие', async () => {
			const { reasons } = await show({ swipe: 'panel' })

			await open()
			await drag(find('.so-drawer__title'), 200, 0)

			await expect.poll(isOpen).toBe(false)
			expect(reasons).toEqual(['swipe'])
		})

		it('из поля — нет: с контролом работают сами', async () => {
			const { reasons } = await show(
				{ swipe: 'panel' },
				{
					content: () => [
						...inside(),
						h(Input, { class: 'so-test-input', placeholder: 'Поиск' }),
					],
				},
			)

			await open()
			await drag(find('.so-test-input input'), 200, 0)

			expect(isOpen()).toBe(true)
			expect(reasons).toEqual([])
		})
	})

	it('внутри контейнера жест тот же', async () => {
		const { reasons } = await show({ swipe: 'handle' }, { contained: true })

		await open()
		await drag(handle(), 200, 0)

		await expect.poll(isOpen).toBe(false)
		expect(reasons).toEqual(['swipe'])
	})

	/**
	 * A finger isn't a mouse. The browser captures a touch to the node under the
	 * finger by itself, and the gesture, moving the capture to the panel, takes
	 * it from that node. And in a body that scrolls, the panel's `touch-action`
	 * doesn't apply, and the browser takes the touch for scrolling. The drag is a
	 * DevTools protocol command (`commands.touchDrag`).
	 */
	describe.runIf(continuousTouch)('пальцем', () => {
		/** A paragraph in the body to pull the whole panel by, and two Tab stops. */
		const text = (): VNode[] => [
			h('p', { class: 'so-test-text', style: 'width: 120px' }, 'Текст тела'),
			...inside(),
		]

		/**
		 * The body is taller than the panel — it scrolls. The paragraph is 300 px
		 * below the body's start: a drag up from it stays within the window.
		 */
		const tallText = (): VNode[] => [
			...inside(),
			h('div', { style: 'height: 300px' }),
			h('p', { class: 'so-test-text', style: 'width: 120px' }, 'Текст тела'),
			h('div', { style: 'height: 2000px' }),
		]

		/**
		 * Edges with the gesture's axis: a side one — horizontal, the bottom one —
		 * vertical. The bottom panel has its own height: a drag by half of it stays
		 * within the window.
		 */
		const EDGES = [
			['end', { placement: 'end' }],
			['bottom', { placement: 'bottom', height: 300 }],
		] as const

		/** The finger's path to the edge — half the panel's size along the edge's axis. */
		const halfway = (placement: 'end' | 'bottom'): [number, number] => {
			const box = panel().getBoundingClientRect()

			return placement === 'end' ? [box.width / 2, 0] : [0, box.height / 2]
		}

		it.each(EDGES)(
			'%s: за полосу к краю — закрытие с причиной swipe',
			async (placement, props) => {
				const { shown, reasons } = await show({ swipe: 'handle', ...props })

				await open()
				await commands.touchDrag('.so-drawer__handle', ...halfway(placement))

				await expect.poll(isOpen).toBe(false)
				expect(shown.value).toBe(false)
				expect(reasons).toEqual(['swipe'])
			},
		)

		it.each(EDGES)(
			'%s, за всю панель: от абзаца в теле — закрытие с причиной swipe',
			async (placement, props) => {
				const { reasons } = await show({ swipe: 'panel', ...props }, { content: text })

				await open()
				await commands.touchDrag('.so-test-text', ...halfway(placement))

				await expect.poll(isOpen).toBe(false)
				expect(reasons).toEqual(['swipe'])
			},
		)

		/**
		 * A touch across the axis isn't the gesture: the browser scrolls the body by
		 * itself, and the touch cancelled during a gesture doesn't affect that.
		 */
		it('end, за всю панель: по телу вертикально — тело прокрутилось, панель открыта', async () => {
			const { reasons } = await show({ swipe: 'panel' }, { content: tallText })

			await open()
			await commands.touchDrag('.so-test-text', 0, -200)

			await expect.poll(() => find('.so-drawer__body').scrollTop).toBeGreaterThan(0)
			expect(isOpen()).toBe(true)
			expect(reasons).toEqual([])
		})

		/**
		 * Along the axis the body scrolls by itself, and the gesture doesn't start
		 * from it (`scrollsAlong`) — a finger has the same rule as a mouse.
		 */
		it('bottom, за всю панель: тело выше панели — протяжка вверх прокручивает его, панель открыта', async () => {
			const { reasons } = await show(
				{ swipe: 'panel', placement: 'bottom' },
				{ content: tallText },
			)

			await open()
			await commands.touchDrag('.so-test-text', 0, -200)

			await expect.poll(() => find('.so-drawer__body').scrollTop).toBeGreaterThan(0)
			expect(isOpen()).toBe(true)
			expect(reasons).toEqual([])
		})
	})
})

describe('закрытие', () => {
	it('крестик закрывает и возвращает фокус', async () => {
		const { reasons } = await show()

		await open()
		await userEvent.click(find('.so-drawer__close'))

		await expect.poll(isOpen).toBe(false)
		expect(reasons).toEqual(['button'])
		expect(active()).toBe(opener())
	})

	/**
	 * The panel closes on `pointerdown` already, and focus returns at once — the
	 * focus model cancels this press's `mousedown`, as with a dialog.
	 */
	it('нажатие по подложке закрывает, фокус остаётся на кнопке, с которой открыли', async () => {
		const { reasons } = await show()

		await open()
		await userEvent.click(backdrop(), { position: { x: 4, y: 4 } })

		await expect.poll(isOpen).toBe(false)
		expect(reasons).toEqual(['outside'])
		expect(active()).toBe(opener())
	})
})
