/**
 * The slider in a real browser: layout and real input.
 *
 * jsdom computes no layout — the track has neither width nor place there, —
 * and doesn't perform the browser's actions: the native field step from an
 * arrow and the `Label` action on `click` it doesn't do at all. So the gesture
 * here is real Playwright input (`userEvent` with a position), not a synthetic
 * `PointerEvent`: only so does it show that a press suppresses the browser's
 * selection and focus, the pointer capture brings the release to the root, and
 * an arrow makes exactly one step — the core's, without the native one.
 *
 * The theme's transitions, the thumb's halo colour and its shadow are here
 * too: jsdom computes no styles and starts no transitions.
 *
 * Positions are from the track's top-left corner: its box is the travel of the
 * thumb centres, fractions 0 and 1 are its edges along the axis (the theme's
 * contract with the pointer plugin).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from './render'
import { commands, page, userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { TSlider } from '@soxa-ui/core'
import type { ISliderProps, TComponentVariant, TSliderValue } from '@soxa-ui/core'
import { COMPONENT_VARIANTS } from '@soxa-ui/playground-shared'
import { Button, Label, Slider, Switch } from '@soxa-ui/vue'

import { opacity, pixel } from './colors'
import { reducedMotion } from './media'
import { captureMovesHover } from './engine'
import { settled, transitionEvents, transitionRuns } from './transitions'

import '@soxa-ui/theme-oren'

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

type THarness = {
	/** The page's writing direction */
	dir?: 'ltr' | 'rtl'
	/** The slider in a `Label` */
	label?: boolean
	/** A button before the slider — to have where to Tab in from */
	before?: boolean
}

/**
 * The slider on a page 400 px wide. The core instance holds the value: the
 * test reads the gesture's result from it. The top padding is wider: the
 * `auto` tooltip stands above the thumb, past the slider's box.
 */
async function mount(
	props: Partial<ISliderProps> = {},
	{ dir = 'ltr', label = false, before = false }: THarness = {},
) {
	const ctrl = new TSlider(props)
	const slider = () => h(Slider, { ctrl })

	render(
		defineComponent({
			render: () =>
				h('div', { dir, style: 'width: 400px; padding: 48px 24px 24px' }, [
					before ? h('button', { class: 'so-test-before' }, 'До') : null,
					label ? h(Label, { text: 'Цена', position: 'top' }, slider) : slider(),
				]),
		}),
	)

	// Plugins get the root a frame later
	await nextFrame()
	await nextFrame()

	return ctrl
}

/** A node by selector; without it the test fails here, not on reading a property. */
function find(selector: string): HTMLElement {
	const element = document.querySelector(selector)

	if (!(element instanceof HTMLElement)) throw new Error(`${selector}: HTML-узла нет`)

	return element
}

const all = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)]
const track = () => find('.so-slider__track')
const range = () => find('.so-slider__range')
const thumbs = () => all('.so-slider__thumb')
const fields = () => all('.so-slider__input')

/** The field of thumb `index`; without it the test fails here. */
function field(index: number): HTMLInputElement {
	const node = fields()[index]

	if (!(node instanceof HTMLInputElement)) throw new Error(`поля ${index} нет`)

	return node
}

/**
 * The point at fraction `fraction` of travel — from the track's top-left
 * corner: along the axis the fraction of its length, across it the middle.
 */
function along(fraction: number, orientation: 'horizontal' | 'vertical' = 'horizontal') {
	const box = track().getBoundingClientRect()

	return orientation === 'horizontal'
		? { x: box.width * fraction, y: box.height / 2 }
		: { x: box.width / 2, y: box.height * fraction }
}

/** The node's horizontal centre — in window coordinates. */
const centerX = (node: Element) => {
	const box = node.getBoundingClientRect()

	return box.left + box.width / 2
}

/**
 * The node's `box-shadow` layers: colour, offset, blur and spread. A comma
 * inside a colour's parentheses doesn't split layers.
 */
function shadows(element: Element) {
	return getComputedStyle(element)
		.boxShadow.split(/,(?![^(]*\))/)
		.map((layer) => {
			const lengths = (layer.match(/-?[\d.]+px/g) ?? []).map(parseFloat)
			const [x = 0, y = 0, blur = 0, spread = 0] = lengths

			return { color: layer.replace(/-?[\d.]+px/g, '').trim(), x, y, blur, spread }
		})
}

/**
 * The colour of the thumb's halo ring — the layer without offset and blur,
 * with spread; without the ring the test fails here.
 */
function halo(thumb: Element): string {
	const ring = shadows(thumb).find(
		({ x, y, blur, spread }) => x === 0 && y === 0 && blur === 0 && spread >= 1,
	)

	if (!ring) throw new Error('кольца ореола нет')

	return ring.color
}

/**
 * A point past the slider: 20 px from the track's edge — beyond the root's
 * inset for half a thumb, — level with the track's middle. Coordinates are from
 * the top-left corner of `body`: the pointer goes out onto the page.
 */
function beyond(edge: 'left' | 'right') {
	const box = track().getBoundingClientRect()
	const page = document.body.getBoundingClientRect()
	const x = edge === 'left' ? box.left - 20 : box.right + 20

	return { x: x - page.left, y: box.top + box.height / 2 - page.top }
}

/**
 * A point at fraction `fraction` of the track along the axis and below the
 * first thumb, a thumb's side away from it — past its halo, a third of the
 * side. From the top-left corner of `body`. A drag leads the pointer there,
 * off the thumb that follows it: WebKit keeps `:hover` on the node under the
 * pointer, and the thumb would be hovered in the middle of the drag. Below,
 * not above: above the thumb stands its tooltip, the thumb's child.
 */
function under(fraction: number) {
	const box = track().getBoundingClientRect()
	const thumb = thumbs()[0].getBoundingClientRect()
	const page = document.body.getBoundingClientRect()

	return {
		x: box.left + box.width * fraction - page.left,
		y: thumb.bottom + thumb.height - page.top,
	}
}

beforeEach(() => {
	document.documentElement.dataset.soTheme = 'oren'
})

afterEach(() => {
	cleanup()
})

describe('раскладка', () => {
	it('центр ручки — на своей доле дорожки; в RTL — от правого края', async () => {
		await mount({ value: 25 })

		const ltr = track().getBoundingClientRect()

		expect(Math.abs(centerX(thumbs()[0]) - (ltr.left + ltr.width * 0.25))).toBeLessThan(0.5)

		cleanup()
		await mount({ value: 25 }, { dir: 'rtl' })

		const rtl = track().getBoundingClientRect()

		expect(Math.abs(centerX(thumbs()[0]) - (rtl.right - rtl.width * 0.25))).toBeLessThan(0.5)
	})

	it('пустая подпись метки не видна, метка остаётся точкой', async () => {
		await mount({ value: 50, marks: [{ value: 0, label: 'Мин' }, { value: 50 }] })

		const [named, empty] = all('.so-slider__mark-label')

		expect(getComputedStyle(named).display).not.toBe('none')
		expect(getComputedStyle(empty).display).toBe('none')
	})
})

/**
 * Mark labels are a visual scale: the field announces the value and the bounds
 * itself. A `Label` names the field by all its text, and the marks lie inside
 * it: without `aria-hidden` a screen reader would read «Мин Макс Цена».
 */
describe('подписи меток', () => {
	it('в подписи Label на экране, но в имя поля не входят', async () => {
		await mount(
			{
				value: 50,
				marks: [
					{ value: 0, label: 'Мин' },
					{ value: 100, label: 'Макс' },
				],
			},
			{ label: true },
		)

		const labels = all('.so-slider__mark-label')

		expect(labels.map((node) => node.textContent)).toEqual(['Мин', 'Макс'])
		expect(labels.every((node) => find('.so-label').contains(node))).toBe(true)
		expect(labels.map((node) => getComputedStyle(node).display)).not.toContain('none')
		expect(page.getByRole('slider', { name: 'Цена', exact: true }).query()).toBe(field(0))
	})
})

/**
 * A label names one field by its content, the first one. The second field
 * inside it is an embedded control for that name (accname 1.2, step 2C), and
 * its value would enter the first one's name: «80 Цена». So with several
 * thumbs each one's name, the first's too, comes from `thumbLabels`: a
 * field's `aria-label` is stronger than the label. The names are compared
 * exactly: they hold neither the label's text nor the neighbour field's value.
 * The slider's own name (`aria_label`) with several thumbs names their group —
 * the root, — not each field.
 */
describe('имена ручек', () => {
	it('в подписи Label имя каждой ручки — ровно её имя из thumbLabels', async () => {
		await mount({ value: [20, 80], thumbLabels: ['От', 'До'] }, { label: true })

		expect(fields().every((node) => find('.so-label').contains(node))).toBe(true)
		expect(page.getByRole('slider', { name: 'От', exact: true }).query()).toBe(field(0))
		expect(page.getByRole('slider', { name: 'До', exact: true }).query()).toBe(field(1))
	})

	it('aria_label называет группу ручек, имя каждой ручки — её имя из thumbLabels', async () => {
		render(
			defineComponent({
				render: () =>
					h('div', { style: 'width: 400px; padding: 48px 24px 24px' }, [
						h(Slider, {
							value: [20, 80],
							thumbLabels: ['От', 'До'],
							aria_label: 'Цена',
						}),
					]),
			}),
		)
		await nextFrame()

		expect(page.getByRole('group', { name: 'Цена', exact: true }).query()).toBe(
			find('.so-slider'),
		)
		expect(page.getByRole('slider', { name: 'От', exact: true }).query()).toBe(field(0))
		expect(page.getByRole('slider', { name: 'До', exact: true }).query()).toBe(field(1))
	})
})

describe('нажатие на дорожке', () => {
	it('ставит ближайшую ручку в точку нажатия', async () => {
		const ctrl = await mount({ value: [10, 90] })

		await userEvent.click(track(), { position: along(0.3) })

		expect(ctrl.value).toEqual([30, 90])
	})

	it('RTL: ход растёт справа налево', async () => {
		const ctrl = await mount({ value: 0 }, { dir: 'rtl' })

		await userEvent.click(track(), { position: along(0.3) })

		expect(ctrl.value).toBe(70)
	})

	it('inverted: ход растёт в обратную сторону', async () => {
		const ctrl = await mount({ value: 0, inverted: true })

		await userEvent.click(track(), { position: along(0.3) })

		expect(ctrl.value).toBe(70)
	})

	it('вертикальный: ход растёт снизу вверх', async () => {
		const ctrl = await mount({ value: 0, orientation: 'vertical' })

		await userEvent.click(track(), { position: along(0.25, 'vertical') })

		expect(ctrl.value).toBe(75)
	})
})

describe('протяжка', () => {
	/**
	 * The thumb is taken 6 px right of its centre — a step and a half. Without
	 * the grab offset the value would jump to the press point.
	 */
	it('ручка идёт за указателем со смещением захвата', async () => {
		const ctrl = await mount({ value: 50 })
		const from = along(0.5)
		const to = along(0.7)

		await userEvent.dragAndDrop(track(), track(), {
			sourcePosition: { x: from.x + 6, y: from.y },
			targetPosition: { x: to.x + 6, y: to.y },
		})

		expect(ctrl.value).toBe(70)
	})

	/**
	 * The thumb is taken 6 px nearer the edge it is dragged to, and the pointer
	 * is led past the slider. The thumb follows with the grab offset, and the
	 * pointer's fraction clamped to the track's edge would leave it those 6 px
	 * short of the edge.
	 */
	it('взятая не за середину ручка доходит до края хода, когда указатель за ползунком', async () => {
		const ctrl = await mount({ value: [10, 90] })
		const low = along(0.1)
		const high = along(0.9)

		await userEvent.dragAndDrop(track(), document.body, {
			sourcePosition: { x: high.x + 6, y: high.y },
			targetPosition: beyond('right'),
		})

		expect(ctrl.value).toEqual([10, 100])

		await userEvent.dragAndDrop(track(), document.body, {
			sourcePosition: { x: low.x - 6, y: low.y },
			targetPosition: beyond('left'),
		})

		expect(ctrl.value).toEqual([0, 100])
	})

	it('две ручки не перехлёстываются', async () => {
		const ctrl = await mount({ value: [20, 60] })

		await userEvent.dragAndDrop(track(), track(), {
			sourcePosition: along(0.2),
			targetPosition: along(0.95),
		})

		expect(ctrl.value).toEqual([60, 60])
	})

	/**
	 * Released over the label's text — outside the slider, but inside the
	 * `label`. Without the pointer capture and the suppressed `click` the label
	 * would give focus to the first field.
	 */
	it('в подписи Label фокус остаётся на тянутой ручке', async () => {
		const ctrl = await mount({ value: [20, 80] }, { label: true })

		await userEvent.dragAndDrop(track(), find('.so-label__text'), {
			sourcePosition: along(0.8),
		})

		expect(ctrl.values[0]).toBe(20)
		expect(document.activeElement).toBe(fields()[1])
	})

	/**
	 * The pointer plugin focuses the field by script, and Chromium takes the
	 * visibility of such focus from the previous one. The previous came from
	 * the keyboard — without `focusVisible: false` the thumb's ring would show
	 * from a mouse press.
	 */
	it('нажатие мышью после фокуса с клавиатуры — фокус у поля, кольца нет', async () => {
		await mount({ value: 50 }, { before: true })

		// Onto the button before it from the keyboard: Tab into the field and
		// Shift+Tab back
		find('.so-test-before').focus()
		await userEvent.keyboard('{Tab}')
		await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
		expect(document.activeElement).toBe(find('.so-test-before'))

		await userEvent.click(thumbs()[0])

		expect(document.activeElement).toBe(field(0))
		expect(field(0).matches(':focus-visible')).toBe(false)
	})
})

/**
 * Snapping to marks by real input: the radius in px turns into a fraction of
 * the real track's length, the theme's transition carries the settle, a real
 * clock keeps the hold at a mark. The mark is 50, the default radius 8 px.
 */
describe('щелчок к меткам', () => {
	const MARK = [{ value: 50 }]

	/** A point `px` from the mark along the track: plus is toward `max`. */
	const nearMark = (px: number) => {
		const { x, y } = along(0.5)

		return { x: x + px, y }
	}

	/** The value the thumb would take without snapping at point `nearMark(px)`. */
	const freeValue = (px: number) =>
		Math.round((nearMark(px).x / track().getBoundingClientRect().width) * 100)

	it('magnet: в радиусе метки ручка встаёт на метку, за радиусом — нет', async () => {
		const ctrl = await mount({ value: 20, marks: MARK, snap: 'magnet' })

		await userEvent.dragAndDrop(track(), track(), {
			sourcePosition: along(0.2),
			targetPosition: nearMark(-5),
		})

		expect(ctrl.value).toBe(50)

		await userEvent.dragAndDrop(track(), track(), {
			sourcePosition: along(0.5),
			targetPosition: nearMark(-20),
		})

		expect(ctrl.value).toBe(freeValue(-20))
	})

	it('plateau: ручка стоит на метке, пока указатель на плато; край хода достижим', async () => {
		const ctrl = await mount({ value: 50, marks: MARK, snap: 'plateau' })

		await userEvent.dragAndDrop(track(), track(), {
			sourcePosition: along(0.5),
			targetPosition: nearMark(6),
		})

		expect(ctrl.value).toBe(50)

		await userEvent.dragAndDrop(track(), track(), {
			sourcePosition: along(0.5),
			targetPosition: along(1),
		})

		expect(ctrl.value).toBe(100)
	})

	it('settle: отпущенная в радиусе ручка доезжает до метки — один commit', async () => {
		const ctrl = await mount({ value: 20, marks: MARK, snap: 'settle' })
		const commits: unknown[] = []

		ctrl.events.on('commit', (payload) => commits.push(payload))

		await userEvent.dragAndDrop(track(), track(), {
			sourcePosition: along(0.2),
			targetPosition: nearMark(-5),
		})

		expect(ctrl.value).toBe(50)
		expect(ctrl.dragging).toBe(false)
		expect(commits).toEqual([{ newValue: 50, oldValue: 20 }])
	})

	it('settle: за радиусом ручка остаётся, где отпустили', async () => {
		const ctrl = await mount({ value: 20, marks: MARK, snap: 'settle' })

		await userEvent.dragAndDrop(track(), track(), {
			sourcePosition: along(0.2),
			targetPosition: nearMark(-20),
		})

		expect(ctrl.value).toBe(freeValue(-20))
	})

	/**
	 * "At once" is within the hold window (250 ms by the clock), so the gesture
	 * goes by a command without a pause before the release (`quickDrag`):
	 * `dragAndDrop` has an RPC round trip between the move and the release, and
	 * under load the release came when the hold was over and the thumb had
	 * rightly caught up with the pointer.
	 */
	it('hold: отпустили сразу за меткой — ручка осталась на метке', async () => {
		const ctrl = await mount({ value: 20, marks: MARK, snap: 'hold' })

		await commands.quickDrag('.so-slider__track', { x: 0.2, y: 0.5 }, { x: 0.6, y: 0.5 })

		expect(ctrl.value).toBe(50)
	})

	/**
	 * The button is held, the pointer is past the mark and stands: the thumb
	 * stays on the mark, and when the hold is over it catches up without a
	 * single pointer move. The value changes are recorded with times: so both
	 * the hold and its length show, however long the browser's answer to the
	 * test takes.
	 */
	it('hold: ручка стоит на пересечённой метке и догоняет стоящий указатель', async () => {
		const ctrl = await mount({ value: 20, marks: MARK, snap: 'hold' })
		const changes: Array<{ value: TSliderValue; at: number }> = []

		ctrl.events.on('change:value', ({ newValue }) =>
			changes.push({ value: newValue, at: performance.now() }),
		)

		await userEvent.hover(track(), { position: along(0.2) })
		await commands.mouseDown()

		try {
			await userEvent.hover(track(), { position: along(0.6) })
			await expect.poll(() => ctrl.value, { timeout: 2000 }).toBe(60)
		} finally {
			await commands.mouseUp()
		}

		const [held, caught] = changes

		expect(changes.map(({ value }) => value)).toEqual([50, 60])
		// The default hold is 250 ms; the margin is for the clock's coarsening
		expect(caught.at - held.at).toBeGreaterThanOrEqual(240)
	})
})

describe('клавиатура', () => {
	it('стрелка — ровно один шаг ядра: нативный сдвиг поля отменён', async () => {
		const ctrl = await mount({ value: 50 })

		await userEvent.click(thumbs()[0])
		expect(document.activeElement).toBe(fields()[0])

		await userEvent.keyboard('{ArrowRight}')

		expect(ctrl.value).toBe(51)
		await expect.poll(() => field(0).value).toBe('51')
	})

	it('RTL: → убавляет — ручка идёт туда, куда смотрит стрелка', async () => {
		const ctrl = await mount({ value: 50 }, { dir: 'rtl' })

		await userEvent.click(thumbs()[0])
		await userEvent.keyboard('{ArrowRight}')

		expect(ctrl.value).toBe(49)
	})
})

/**
 * The fill goes with the thumb. The theme animates the travel only outside a
 * drag and when the system doesn't ask to reduce motion — alike for the thumb
 * and the fill, otherwise one lags behind the other by the transition's
 * length.
 *
 * Transitions are caught by a listener set before the action, not by a
 * snapshot after it: Playwright's answer to input goes by an RPC round trip and
 * may come after a 150 ms transition is over, — then both `getAnimations()`
 * and the geometry would turn green with a lagging fill too.
 */
describe('заливка', () => {
	/** How far the fill's edge lags behind the thumb's centre, px. */
	const lag = () => Math.abs(range().getBoundingClientRect().right - centerX(thumbs()[0]))

	/**
	 * Focus on the first thumb's field — by a press on its centre, the value
	 * doesn't change. The transition events of the press come before the test
	 * sets its listener.
	 */
	const focusThumb = async () => {
		await userEvent.click(thumbs()[0])
		await transitionEvents()
	}

	afterEach(async () => {
		await reducedMotion('no-preference')
	})

	it('протяжка — край заливки под ручкой, без перехода', async () => {
		const ctrl = await mount({ value: 20 })
		const runs = transitionRuns(range())

		await userEvent.hover(track(), { position: along(0.2) })
		await commands.mouseDown()

		try {
			// Taken by the thumb's centre — the value didn't jump
			expect(ctrl.value).toBe(20)

			await userEvent.hover(track(), { position: along(0.6) })

			expect(ctrl.value).toBe(60)
			expect(lag()).toBeLessThan(0.5)
		} finally {
			await commands.mouseUp()
		}

		await transitionEvents()

		expect(runs).toEqual([])
	})

	/**
	 * A positive control: without it the drag test would pass with a theme
	 * where the fill's transition was simply removed.
	 */
	it('клавиша — заливка едет переходом', async () => {
		const ctrl = await mount({ value: 20 })

		await focusThumb()

		const runs = transitionRuns(range())

		await userEvent.keyboard('{ArrowRight}')
		await transitionEvents()

		expect(ctrl.value).toBe(21)
		expect(runs).not.toEqual([])
	})

	it('система просит меньше движения — клавиша без перехода', async () => {
		await reducedMotion('reduce')

		const ctrl = await mount({ value: 20 })

		await focusThumb()

		const runs = transitionRuns(range())

		await userEvent.keyboard('{ArrowRight}')
		await transitionEvents()

		expect(ctrl.value).toBe(21)
		expect(runs).toEqual([])
	})
})

/**
 * The value tooltip is markup inside the thumb, the theme gives its place and
 * visibility. That the core draws it and with what text the adapter checks
 * (`ui/vue/__tests__/slider.spec.ts`); here is what jsdom doesn't compute:
 * layout, hover, `:focus-visible` and pointer capture.
 */
describe('подсказка', () => {
	/** The tooltip of thumb `index`; without it the test fails here. */
	function tooltip(index = 0): HTMLElement {
		const node = all('.so-slider__tooltip')[index]

		if (!node) throw new Error(`подсказки ${index} нет`)

		return node
	}

	/** The node's vertical centre — in window coordinates. */
	const centerY = (node: Element) => {
		const box = node.getBoundingClientRect()

		return box.top + box.height / 2
	}

	/** How far the tooltip's centre is off the first thumb's centre on axis `axis`, px. */
	const offCenter = (axis: 'x' | 'y') => {
		const center = axis === 'x' ? centerX : centerY

		return Math.abs(center(tooltip()) - center(thumbs()[0]))
	}

	/**
	 * The tooltip is the thumb's child and moves with it by construction: in a
	 * drag, where the thumb follows the pointer, and in the theme's transition
	 * after a value change. The plate's width changes with the text, the centre
	 * doesn't.
	 */
	it('центр подсказки — на центре ручки: в протяжке и после смены значения', async () => {
		const ctrl = await mount({ value: 20, tooltip: 'always' })

		expect(offCenter('x')).toBeLessThan(0.5)

		await userEvent.hover(track(), { position: along(0.2) })
		await commands.mouseDown()

		try {
			await userEvent.hover(track(), { position: along(0.6) })

			expect(ctrl.dragging).toBe(true)
			expect(offCenter('x')).toBeLessThan(0.5)
		} finally {
			await commands.mouseUp()
		}

		ctrl.value = 100
		await nextFrame()

		expect(tooltip().textContent).toBe('100')
		expect(offCenter('x')).toBeLessThan(0.5)
	})

	/**
	 * Above the thumb — past the halo: the halo (a third of the thumb's side)
	 * appears under hover and doesn't run onto the plate. A tooltip that is
	 * always visible a horizontal slider keeps inside its box.
	 */
	it('горизонтальная — над ручкой за ореолом; always — в коробке ползунка', async () => {
		await mount({ value: 50, tooltip: 'always' })

		const tip = tooltip().getBoundingClientRect()
		const knob = thumbs()[0].getBoundingClientRect()
		const root = find('.so-slider').getBoundingClientRect()

		expect(knob.top - tip.bottom).toBeGreaterThan(knob.height / 3)
		expect(tip.top).toBeGreaterThanOrEqual(root.top - 0.5)
	})

	/** Mark labels stand at the line's end — the tooltip stands at its start. */
	it('вертикальная — сбоку, со стороны начала строки; в RTL — зеркально', async () => {
		await mount({ value: 50, tooltip: 'always', orientation: 'vertical' })

		const ltr = tooltip().getBoundingClientRect()
		const ltrKnob = thumbs()[0].getBoundingClientRect()

		expect(ltrKnob.left - ltr.right).toBeGreaterThan(ltrKnob.width / 3)
		expect(offCenter('y')).toBeLessThan(0.5)

		cleanup()
		await mount({ value: 50, tooltip: 'always', orientation: 'vertical' }, { dir: 'rtl' })

		const rtl = tooltip().getBoundingClientRect()
		const rtlKnob = thumbs()[0].getBoundingClientRect()

		expect(rtl.left - rtlKnob.right).toBeGreaterThan(rtlKnob.width / 3)
		expect(offCenter('y')).toBeLessThan(0.5)
	})

	/**
	 * `auto`: the theme decides when to show — a hover on the thumb, its press,
	 * `data-dragging` and the field's `:focus-visible`. Each cause is checked
	 * with the others off: otherwise the test would pass without it.
	 *
	 * Whether the tooltip shows the test checks once its transitions have
	 * played: the plate fades by a transition, and all that time it still
	 * shows. Waiting a number of milliseconds won't do: the hover leaves the
	 * thumb not at the moment of the action, and a transition started later
	 * would find the plate still visible.
	 */
	describe('auto', () => {
		/** Whether the tooltip shows once its transitions have played. */
		const shown = async () => {
			await settled(tooltip())

			return getComputedStyle(tooltip()).visibility === 'visible'
		}

		const hovered = () => thumbs()[0].matches(':hover')

		beforeEach(async () => {
			// The cursor stayed where the previous test left it, and the slider will
			// stand in the same place: move it to the page's corner
			await userEvent.hover(document.body, { position: { x: 0, y: 0 } })
		})

		/**
		 * Hidden by `visibility`, not by opacity alone: a transparent plate would
		 * catch the hover, and the tooltip would pop up from a cursor over empty
		 * space by the thumb.
		 */
		it('в покое скрыта; курсор там, где она стоит, её не показывает', async () => {
			await mount({ value: 50, tooltip: 'auto' })

			expect(await shown()).toBe(false)

			const body = document.body.getBoundingClientRect()

			await userEvent.hover(document.body, {
				position: { x: centerX(tooltip()) - body.left, y: centerY(tooltip()) - body.top },
			})
			await nextFrame()

			expect(hovered()).toBe(false)
			expect(await shown()).toBe(false)
		})

		/**
		 * A cursor moved from the thumb onto the tooltip doesn't hide it (WCAG
		 * 1.4.13): the tooltip is the thumb's child and doesn't block the
		 * pointer.
		 */
		it('курсор на ручке показывает, на самой подсказке — держит, ушёл — скрыта', async () => {
			await mount({ value: 50, tooltip: 'auto' })
			await userEvent.hover(thumbs()[0])

			expect(await shown()).toBe(true)

			await userEvent.hover(tooltip())

			expect(hovered()).toBe(true)
			expect(await shown()).toBe(true)

			await userEvent.hover(document.body, { position: { x: 0, y: 0 } })
			await expect.poll(hovered).toBe(false)

			expect(await shown()).toBe(false)
		})

		it('поле в фокусе с клавиатуры — видна; фокус ушёл — скрыта', async () => {
			await mount({ value: 50, tooltip: 'auto' }, { before: true })

			find('.so-test-before').focus()
			await userEvent.keyboard('{Tab}')

			expect(document.activeElement).toBe(field(0))
			expect(field(0).matches(':focus-visible')).toBe(true)
			expect(hovered()).toBe(false)
			expect(await shown()).toBe(true)

			field(0).blur()
			await nextFrame()

			expect(await shown()).toBe(false)
		})

		/**
		 * The press captures the pointer by the root, and the hover leaves the
		 * thumb for the root, while `data-dragging` comes only with the first
		 * move. The tooltip is held by the press of the thumb. In WebKit the
		 * hover stays on the thumb under the pointer (`captureMovesHover`), and
		 * the press can't be told from it there.
		 */
		it('ручку держат, не сдвинув, — видна', async (context) => {
			context.skip(!captureMovesHover)
			const ctrl = await mount({ value: 50, tooltip: 'auto' })

			await userEvent.hover(thumbs()[0])
			await commands.mouseDown()

			try {
				await expect.poll(hovered).toBe(false)

				expect(ctrl.dragging).toBe(false)
				expect(field(0).matches(':focus-visible')).toBe(false)
				expect(await shown()).toBe(true)
			} finally {
				await commands.mouseUp()
			}
		})

		/**
		 * Pressed off the thumb and led below it (`under`): the thumb jumped to
		 * the pointer and follows it, but has neither the hover nor the press —
		 * the tooltip is held by `data-dragging`.
		 */
		it('ручку тянут — видна', async () => {
			const ctrl = await mount({ value: 50, tooltip: 'auto' })

			await userEvent.hover(track(), { position: along(0.1) })
			await commands.mouseDown()

			try {
				await userEvent.hover(document.body, { position: under(0.3) })

				expect(ctrl.dragging).toBe(true)
				await expect.poll(() => thumbs()[0].matches(':hover, :active')).toBe(false)
				expect(field(0).matches(':focus-visible')).toBe(false)
				expect(await shown()).toBe(true)
			} finally {
				await commands.mouseUp()
			}
		})
	})

	/**
	 * A label names the field by all its text, and the tooltip lies inside it.
	 * Its text doesn't enter the name: the tooltip is under `aria-hidden`, the
	 * field announces the value itself.
	 */
	it('в подписи Label имя поля — ровно текст подписи', async () => {
		await mount({ value: 50, tooltip: 'always' }, { label: true })

		expect(find('.so-label').contains(tooltip())).toBe(true)
		expect(tooltip().textContent).toBe('50')
		expect(page.getByRole('slider', { name: 'Цена', exact: true }).query()).toBe(field(0))
	})
})

/**
 * The thumb's halo is the state veil of the same density as the hover and the
 * press of the theme's other components: under the hover — the background of a
 * `plain` button of the same variant under the hover, held or dragged — its
 * background when pressed. The halo has no density of its own. The spec knows
 * neither densities nor the palette: the reference is the button beside it,
 * colours are compared on a canvas (`./colors`).
 *
 * The halo is a `box-shadow` ring of the thumb: a layer without offset and
 * blur, with spread. Held — pressed on the thumb and not moved: in WebKit the
 * hover stays on the thumb, and the press has to win over it. Dragged — pressed
 * off the thumb and led below it, as in «ручку тянут — видна»: the thumb has
 * neither the hover nor the press, and the halo is held by `data-dragging`.
 */
describe('ореол', () => {
	/** Both schemes: their colours differ, the densities are shared. */
	const SCHEMES = ['oren', 'oren-dark'] as const

	/** The pointer onto a node off the slider and the button. */
	const away = () => userEvent.hover(find('.so-test-away'))

	/**
	 * A slider of the variant and the reference below it — a `plain` button of
	 * the same variant.
	 */
	async function show(variant: TComponentVariant) {
		render(
			defineComponent({
				render: () =>
					h('div', { style: 'width: 400px; padding: 24px' }, [
						h('div', { class: 'so-test-away', style: 'height: 24px' }),
						h(Slider, { variant, value: 50 }),
						h(Button, { view: 'plain', variant, text: 'Эталон' }),
					]),
			}),
		)

		// Plugins get the root a frame later
		await nextFrame()
		await nextFrame()
		await away()
	}

	/** The halo under the hover — once its transition has played. */
	async function hovered(): Promise<string> {
		const thumb = thumbs()[0]

		await userEvent.hover(thumb)
		await settled(thumb)

		return halo(thumb)
	}

	/** The halo while the thumb is held without moving — once its transition has played. */
	async function held(): Promise<string> {
		const thumb = thumbs()[0]

		await userEvent.hover(thumb)
		await commands.mouseDown()

		try {
			await expect.poll(() => thumb.matches(':active')).toBe(true)

			expect(thumb.dataset.dragging).not.toBe('true')

			await settled(thumb)

			return halo(thumb)
		} finally {
			await commands.mouseUp()
		}
	}

	/** The halo while the thumb is dragged — once its transition has played. */
	async function dragged(): Promise<string> {
		const thumb = thumbs()[0]

		await userEvent.hover(track(), { position: along(0.1) })
		await commands.mouseDown()

		try {
			await userEvent.hover(document.body, { position: under(0.2) })
			await expect.poll(() => thumb.dataset.dragging).toBe('true')

			// Continue the gesture after capture starts so WebKit hit-tests the
			// pointer off the thumb before its native pseudo-classes are read.
			await userEvent.hover(document.body, { position: under(0.3) })
			await expect.poll(() => thumb.matches(':hover, :active')).toBe(false)

			await settled(thumb)

			return halo(thumb)
		} finally {
			await commands.mouseUp()
		}
	}

	/**
	 * The reference's background under the hover and when pressed — once its
	 * colour transition has played. The mouse button is released off the
	 * button.
	 */
	async function reference(): Promise<{ hover: string; press: string }> {
		const button = find('.so-button')

		await userEvent.hover(button)
		await settled(button)

		const hover = getComputedStyle(button).backgroundColor

		await commands.mouseDown()

		try {
			await settled(button)

			return { hover, press: getComputedStyle(button).backgroundColor }
		} finally {
			await away()
			await commands.mouseUp()
		}
	}

	describe.each(SCHEMES)('%s', (scheme) => {
		beforeEach(() => {
			document.documentElement.dataset.soTheme = scheme
		})

		it.each(COMPONENT_VARIANTS)(
			'variant="%s": под наведением — вуаль наведения кнопки, держат и тянут — вуаль нажатия',
			async (variant) => {
				await show(variant)

				const hover = await hovered()
				const hold = await held()
				const drag = await dragged()
				const button = await reference()

				expect(pixel([hover]), 'наведение').toEqual(pixel([button.hover]))
				expect(pixel([hold]), 'держат').toEqual(pixel([button.press]))
				expect(pixel([drag]), 'протяжка').toEqual(pixel([button.press]))
			},
		)
	})
})

/**
 * The thumb's shadow is that of the Switch thumb: a control's thumb is one
 * role with one colour (`--so-component-knob`) and one shadow
 * (`themes/oren/AGENTS.md`, «Три роли цвета»). The spec knows no shadows: the
 * reference is the Switch thumb beside it.
 *
 * The shadow is the `box-shadow` layers with offset or blur. Rings don't count:
 * neither the thumb's halo nor the empty rings Tailwind puts in the same
 * `box-shadow`. Under hover the halo adds to the thumb's shadow, and the shadow
 * itself stays the same.
 */
describe('тень ручки', () => {
	/**
	 * Both schemes: a shadow of its own for one of the thumbs in the dark scheme
	 * would set them apart there.
	 */
	const SCHEMES = ['oren', 'oren-dark'] as const

	/** The node's shadow — the layers with offset or blur. */
	const shade = (element: Element) =>
		shadows(element).filter(({ x, y, blur }) => x !== 0 || y !== 0 || blur !== 0)

	/** The slider and the reference below it — an unchecked Switch; the pointer off both. */
	async function show() {
		render(
			defineComponent({
				render: () =>
					h('div', { style: 'width: 400px; padding: 24px' }, [
						h('div', { class: 'so-test-away', style: 'height: 24px' }),
						h(Slider, { value: 50 }),
						h(Switch),
					]),
			}),
		)

		// Plugins get the root a frame later
		await nextFrame()
		await nextFrame()
		await userEvent.hover(find('.so-test-away'))
	}

	describe.each(SCHEMES)('%s', (scheme) => {
		beforeEach(() => {
			document.documentElement.dataset.soTheme = scheme
		})

		it('у ручки Slider тень ручки Switch — в покое и под наведением, с ореолом', async () => {
			await show()

			const thumb = thumbs()[0]
			const reference = shade(find('.so-switch__track--thumb'))

			expect(reference, 'у ручки Switch тени нет').not.toEqual([])
			expect(shade(thumb), 'в покое').toEqual(reference)

			await userEvent.hover(thumb)
			await settled(thumb)

			// The halo is a ring in the same `box-shadow`; without the ring `halo`
			// fails here
			expect(opacity(halo(thumb)), 'ореол прозрачный').toBeGreaterThan(0)
			expect(shade(thumb), 'под наведением').toEqual(reference)
		})
	})
})
