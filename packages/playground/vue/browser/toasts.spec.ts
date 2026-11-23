/**
 * Toasts in a real browser: layout, transitions and the pointer gesture.
 *
 * The region's place, the stack and the gaps are laid out by CSS, without
 * measuring, — the shared theme layer (`themes/base/src/components/toasts.css`),
 * while the transitions and the look are the oren theme's. jsdom computes
 * none of it, and the unit tests (`ui/vue/__tests__/toasts.spec.ts`) see only
 * classes and `data-*`. Here is what comes of them on screen: the region at
 * its window edge (a logical one — in RTL `start` is on the right), a new
 * toast at the edge, the gap between toasts and none past the last, the
 * pointer off the toasts goes to the page and in a gap to the toast; a new
 * toast slides in by transition, a closed one fades and leaves the document
 * once its transitions have played, and without motion it appears and fades
 * in place.
 *
 * The gesture is by a real mouse: jsdom doesn't do pointer capture and
 * `touch-action` at all.
 *
 * The stack (`layout: 'cascade'`) is the shared layer's layout too: the front
 * toast at the edge, the back ones narrower and peeping out by a step, the
 * stack as high as the front one (`--so-toasts-front-height` from the theme's
 * behaviour), focus brings a toast forward without reordering, the wheel pages
 * the stack, and the page under it doesn't scroll. A new toast slides into the
 * stack from the window's edge by its own height, while the former front one
 * steps back at the same time and curve, right behind the new one, and doesn't
 * collapse; one moved back by the wheel appears in its place without sliding,
 * and without motion a new one only appears.
 *
 * The message type is the plate's fill: a plain message stands on the control
 * surface, and everything on it reads — the title, the description, the icon,
 * the labels of its own buttons and the close button, at rest, under hover and
 * when pressed. Each type has its own fill, and everything on it has the
 * fill's text colour: the icon, the button labels, the close button and the
 * focus ring; the fill has no contrast thresholds — it is a signal, the step of
 * a `filled` button of its colour. The rim — a grey ring — only on the white
 * plate: a signal has no frame, as a `filled` button. Every plate has a
 * shadow, and in forced colors mode a frame holds each one's edge. A button's
 * hover and press show, and on a fill they lead the background away from the
 * label. The spec knows no palette: it measures WCAG contrast over layers as
 * the browser lays them (`./colors`). Changing the type of an open toast is a
 * colour transition of the plate and its rim, not of the root: the removal of
 * a closed toast waits for the root's transitions. While the toast waits, a
 * ring of the icon's colour runs in the icon's place — on the glyph's circle,
 * and the text doesn't move when the icon replaces the ring. The icons of all
 * types are drawn like the error's: an outline, the shape empty inside.
 */

import { describe, it, expect, beforeEach, afterEach, onTestFinished } from 'vitest'
import { render, cleanup } from './render'
import { commands, page, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, reactive, ref } from 'vue'
import { createEngineToasts } from '@soxa-ui/core'
import type {
	IToastsItem,
	IToastsProps,
	TToastInput,
	TToastsItemType,
	TToastsItemView,
	TToastsPlacement,
} from '@soxa-ui/core'
import { Alert, Button, Toasts } from '@soxa-ui/vue'
import type { TToastRender } from '@soxa-ui/vue'
import { BUTTON_VIEWS, TOASTS_ITEM_TYPES } from '@soxa-ui/playground-shared'

import {
	contrast,
	find,
	iconPaint,
	lightness,
	opacity,
	outlined,
	pixel,
	settled as colorsSettled,
	style,
} from './colors'
import { setDir } from './directions'
import { forcedColors, reducedMotion } from './media'
import { forcedColorsRepaint } from './engine'
import {
	durationOf,
	easingOf,
	ownTransitionRuns,
	settled,
	transitionEvents,
	transitionOf,
	transitioning,
} from './transitions'

import '@soxa-ui/theme-oren'

/**
 * The region's inset from the window's edges in oren: `--so-toasts-offset` of
 * the shared layer, `1rem`.
 */
const OFFSET = 16

/** The gap between toasts: `--so-toasts-gap`, `0.75rem`. */
const GAP = 12

/** A toast's width: `--so-toasts-width`, `22rem`. */
const WIDTH = 352

/** Tolerance for subpixel rounding of coordinates. */
const EPSILON = 1

/** The run's window. */
const VIEWPORT = { width: 1000, height: 700 }

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/** Toasts in the document — places in the list; the new one first. */
const items = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('.so-toasts-item')]

/** The toast's plate — what is seen. */
const card = (item: HTMLElement): HTMLElement => {
	const element = item.querySelector('.so-toasts-item__card')

	if (!(element instanceof HTMLElement)) throw new Error('плашки нет')

	return element
}

/** A toast's part by class; without it the test fails here. */
const part = (item: HTMLElement, name: string): HTMLElement => {
	const element = item.querySelector(`.so-toasts-item__${name}`)

	if (!(element instanceof HTMLElement)) throw new Error(`${name}: части нет`)

	return element
}

/** The window's width without the scrollbar: the region's inset counts from it. */
const viewportWidth = () => document.documentElement.clientWidth

/**
 * The region with an app and an engine from outside: toasts are shown by code
 * after mounting — so they slide in, as in an app. The duration is zero: the
 * test needs no timer.
 */
const mount = async (props: Partial<IToastsProps> = {}) => {
	const engine = createEngineToasts()

	render(
		defineComponent({
			render: () =>
				h('div', { class: 'so-test-page', style: 'padding: 40px; min-height: 100vh' }, [
					h(Toasts, { engine, duration: 0, ...props }, () => h('p', 'Приложение')),
				]),
		}),
	)

	await nextTick()
	await nextFrame()
	await nextFrame()

	/** Show toasts in order and wait for them to arrive. */
	const show = async (...inputs: TToastInput[]): Promise<IToastsItem[]> => {
		const toasts = inputs.map((input) => {
			const toast = engine.extensions.toasts.show(input)

			if (!toast) throw new Error('тост не показан')

			return toast
		})

		await nextTick()
		await nextFrame()

		return toasts
	}

	/** All the toasts' transitions have played. */
	const rest = async () => {
		await Promise.all(items().map(settled))
	}

	return { engine, show, rest }
}

beforeEach(async () => {
	document.documentElement.dataset.soTheme = 'oren'
	await page.viewport(VIEWPORT.width, VIEWPORT.height)
})

afterEach(async () => {
	cleanup()
	setDir(document.documentElement)
	await reducedMotion('no-preference')
	await forcedColors('none')
})

describe('место', () => {
	/** Where the toast must stand: the vertical edge and the place along the line. */
	const CASES: readonly [TToastsPlacement, 'top' | 'bottom', 'left' | 'center' | 'right'][] = [
		['top-start', 'top', 'left'],
		['top', 'top', 'center'],
		['top-end', 'top', 'right'],
		['bottom-start', 'bottom', 'left'],
		['bottom', 'bottom', 'center'],
		['bottom-end', 'bottom', 'right'],
	]

	it.each(CASES)('%s: тост у своего края окна, с отступом', async (placement, edge, side) => {
		const { show, rest } = await mount({ placement })

		await show('Сохранено')
		await rest()

		const [item] = items()

		if (!item) throw new Error('тоста нет')

		const box = card(item).getBoundingClientRect()

		if (edge === 'top') expect(box.top).toBeCloseTo(OFFSET, 0)
		else expect(box.bottom).toBeCloseTo(VIEWPORT.height - OFFSET, 0)

		if (side === 'left') expect(box.left).toBeCloseTo(OFFSET, 0)
		if (side === 'right') expect(box.right).toBeCloseTo(viewportWidth() - OFFSET, 0)
		if (side === 'center') {
			expect(Math.abs((box.left + box.right) / 2 - viewportWidth() / 2)).toBeLessThan(EPSILON)
		}

		expect(box.width).toBeCloseTo(WIDTH, 0)
	})

	it('RTL: start и end меняются местами', async () => {
		setDir(document.documentElement, 'rtl')

		const { show, rest } = await mount({ placement: 'bottom-start' })

		await show('Сохранено')
		await rest()

		const [item] = items()

		if (!item) throw new Error('тоста нет')

		expect(card(item).getBoundingClientRect().right).toBeCloseTo(viewportWidth() - OFFSET, 0)
	})

	it('узкий экран: тост во всю ширину окна без отступов', async () => {
		await page.viewport(320, 600)

		const { show, rest } = await mount()

		await show('Сохранено')
		await rest()

		const [item] = items()

		if (!item) throw new Error('тоста нет')

		const box = card(item).getBoundingClientRect()

		expect(box.left).toBeCloseTo(OFFSET, 0)
		expect(box.right).toBeCloseTo(viewportWidth() - OFFSET, 0)
	})
})

describe('стопка', () => {
	it('новый тост — у края окна, между тостами — зазор', async () => {
		const { show, rest } = await mount()

		await show('Первый', 'Второй', 'Третий')
		await rest()

		const cards = items().map((item) => card(item).getBoundingClientRect())
		const [newest, middle, oldest] = cards

		if (!newest || !middle || !oldest) throw new Error('тостов меньше трёх')

		expect(items().map((item) => item.textContent?.trim())).toEqual([
			'Третий',
			'Второй',
			'Первый',
		])
		// At the bottom edge the new one is at the bottom, the stack grows upward
		expect(newest.bottom).toBeCloseTo(VIEWPORT.height - OFFSET, 0)
		expect(newest.top - middle.bottom).toBeCloseTo(GAP, 0)
		expect(middle.top - oldest.bottom).toBeCloseTo(GAP, 0)
	})

	it('у последнего тоста зазора нет: место — ровно плашка', async () => {
		const { show, rest } = await mount()

		await show('Первый', 'Второй')
		await rest()

		const [newest, last] = items()

		if (!newest || !last) throw new Error('тостов меньше двух')

		const lastPlace = last.getBoundingClientRect()
		const lastCard = card(last).getBoundingClientRect()
		const newestPlace = newest.getBoundingClientRect()
		const newestCard = card(newest).getBoundingClientRect()

		expect(lastPlace.height).toBeCloseTo(lastCard.height, 0)
		expect(newestPlace.height).toBeCloseTo(newestCard.height + GAP, 0)
	})

	it('указатель мимо тостов — странице, в зазоре — тосту', async () => {
		const { show, rest } = await mount()

		await show('Первый', 'Второй')
		await rest()

		const region = document.querySelector('.so-toasts')
		const [newest, older] = items().map((item) => card(item).getBoundingClientRect())

		if (!region || !newest || !older) throw new Error('тостов меньше двух')

		// Left of the stack, at the new toast's height: the region is full width,
		// but the point misses the toasts
		const beside = document.elementFromPoint(OFFSET + 8, newest.top + newest.height / 2)
		// In the middle of the gap between toasts
		const between = document.elementFromPoint(
			(newest.left + newest.right) / 2,
			(older.bottom + newest.top) / 2,
		)

		expect(beside !== null && region.contains(beside)).toBe(false)
		expect(between?.closest('.so-toasts-item')).not.toBeNull()
	})

	it('видно не больше max: остальные ждут и приходят, когда место освободилось', async () => {
		const { show, rest } = await mount({ max: 2 })
		const texts = () => items().map((item) => item.textContent?.trim())
		const [, , newest] = await show('Первый', 'Второй', 'Третий')

		await rest()

		expect(texts()).toEqual(['Третий', 'Второй'])

		// The closed one leaves after its transitions — and the waiting one comes back
		newest?.close()

		await expect.poll(texts).toEqual(['Второй', 'Первый'])
	})
})

describe('части тоста', () => {
	it('пустые описание и своё содержимое места не занимают; значок и крестик — по центру строки', async () => {
		const { show, rest } = await mount()

		await show('Сохранено')
		await rest()

		const [item] = items()

		if (!item) throw new Error('тоста нет')

		expect(getComputedStyle(part(item, 'description')).display).toBe('none')
		expect(getComputedStyle(part(item, 'content')).display).toBe('none')
		// The icon, the text and the close button are in one line: the icon before
		// the text, the close button after it, both centred on the text's line
		const icon = part(item, 'icon').getBoundingClientRect()
		const text = part(item, 'text').getBoundingClientRect()
		const close = part(item, 'close').getBoundingClientRect()
		const middle = (text.top + text.bottom) / 2

		expect(icon.width).toBeGreaterThan(0)
		expect(icon.right).toBeLessThanOrEqual(text.left + EPSILON)
		expect(Math.abs((icon.top + icon.bottom) / 2 - middle)).toBeLessThan(EPSILON)
		expect(Math.abs((close.top + close.bottom) / 2 - middle)).toBeLessThan(EPSILON)
	})

	it('keeps the close button square and full size when switching to cascade', async () => {
		const props = reactive<Pick<IToastsProps, 'layout'>>({ layout: 'list' })
		const { show, rest } = await mount(props)

		await show('Saved')
		await rest()

		const [item] = items()

		if (!item) throw new Error('Toast did not render')

		const close = part(item, 'close')

		for (const layout of ['list', 'cascade'] as const) {
			props.layout = layout
			await nextTick()
			await rest()

			const { width, height } = close.getBoundingClientRect()

			expect([width, height], layout).toEqual([32, 32])
		}
	})

	it('у текста в несколько строк значок — по центру первой', async () => {
		const { show, rest } = await mount()

		await show({
			text: 'Черновик сохранён, но письмо не ушло: адрес получателя не найден, проверьте его',
			type: 'warning',
		})
		await rest()

		const [item] = items()

		if (!item) throw new Error('тоста нет')

		const icon = part(item, 'icon').getBoundingClientRect()
		const title = part(item, 'text')
		const text = title.getBoundingClientRect()
		const line = parseFloat(getComputedStyle(title).lineHeight)

		// The text really takes several lines — otherwise the first line is all of it
		expect(text.height).toBeGreaterThan(line * 1.5)
		expect(Math.abs((icon.top + icon.bottom) / 2 - (text.top + line / 2))).toBeLessThan(EPSILON)
	})

	it('описание — под текстом, тем же столбцом', async () => {
		const { show, rest } = await mount()

		await show({ text: 'Отправлено', description: 'Письмо ушло адресату' })
		await rest()

		const [item] = items()

		if (!item) throw new Error('тоста нет')

		const text = part(item, 'text').getBoundingClientRect()
		const description = part(item, 'description').getBoundingClientRect()

		expect(description.top).toBeGreaterThanOrEqual(text.bottom - EPSILON)
		expect(description.left).toBeCloseTo(text.left, 0)
	})
})

describe('вид', () => {
	/** Both schemes: their colours differ, the rules are the same. */
	const SCHEMES = ['oren', 'oren-dark'] as const

	/** The toast's kinds: a plain message — a toast without a type — and each type. */
	const KINDS = [
		{ name: 'обычное', type: undefined },
		...TOASTS_ITEM_TYPES.map((type) => ({ name: type, type })),
	] satisfies readonly { name: string; type: TToastsItemType | undefined }[]

	/** A "scheme × kind" case: a toast per case. */
	const CASES = SCHEMES.flatMap((scheme) => KINDS.map((kind) => ({ scheme, ...kind })))

	/**
	 * WCAG 2 thresholds — on the white plate of a plain message. The title and
	 * button labels are `text-sm` text: 4.5:1 (1.4.3). The icon and the close
	 * button are graphics: 3:1 (1.4.11). The description is muted text of the
	 * step of the theme's other hints: it has no threshold, it is only quieter
	 * than the title. A type's fill has no thresholds: it is a signal, the step
	 * of a `filled` button of its colour, and it isn't fitted to thresholds
	 * (`themes/oren/AGENTS.md`, «тосты Toasts»).
	 */
	const TEXT = 4.5
	const GRAPHIC = 3

	/**
	 * A button's state shows if the background under it moved off the resting
	 * one in OKLab lightness at least as far as the veil fill off its backdrop
	 * — the `VISIBLE_FILL` threshold of `button-view.spec.ts`. In absolute
	 * value: on the white plate states lead the background toward the dark
	 * label, on a type's fill away from the white one, that is darker; the
	 * direction is checked separately.
	 */
	const VISIBLE_FILL = 0.02

	/** The drawing in the icon's box — the icon's `svg`; without it the test fails here. */
	const glyph = (item: HTMLElement): SVGElement => {
		const element = part(item, 'icon').querySelector('svg')

		if (!(element instanceof SVGElement)) throw new Error('рисунка значка нет')

		return element
	}

	/** The toast with this title; without it the test fails here. */
	const titled = (text: string): HTMLElement => {
		const found = items().find((item) => part(item, 'text').textContent === text)

		if (!found) throw new Error(`${text}: тоста нет`)

		return found
	}

	/**
	 * The control surface in the current scheme, by a probe: the only token the
	 * spec knows. A plain toast stands on it, like the overlay panels.
	 */
	const surface = (): string => {
		const probe = document.createElement('div')

		probe.style.backgroundColor = 'var(--so-component-surface)'
		document.body.append(probe)

		const color = style(probe).backgroundColor

		probe.remove()

		return color
	}

	it.each(SCHEMES)(
		'%s: у каждого вида своя заливка, значок на ней цвета заголовка, а белая плашка читается',
		async (scheme) => {
			document.documentElement.dataset.soTheme = scheme

			const { show, rest } = await mount({ max: KINDS.length })

			await show(
				...KINDS.map(({ name, type }) => ({ text: name, description: 'Описание', type })),
			)
			await rest()

			const fills = KINDS.map(({ name }) => style(card(titled(name))).backgroundColor)

			// A plain message is on the control surface
			expect(pixel([style(card(titled('обычное'))).backgroundColor])).toEqual(
				pixel([surface()]),
			)
			// Each type has its own fill, and it is opaque: a toast stands over
			// anything, and its colour covers the content of a back toast in a stack
			expect(fills.map(opacity)).toEqual(KINDS.map(() => 1))
			expect(new Set(fills.map((fill) => pixel([fill]).join())).size).toBe(KINDS.length)

			for (const { name, type } of KINDS) {
				const item = titled(name)
				const icon = style(part(item, 'icon')).color

				// The icon's drawing has the box's colour
				expect(pixel([iconPaint(glyph(item))]), `${name}: рисунок значка`).toEqual(
					pixel([icon]),
				)

				// On a type's fill the icon has the title's colour: everything on it is
				// one colour. The fill has no contrast thresholds (see `TEXT`)
				if (type) {
					expect(pixel([icon]), `${name}: значок цвета заголовка`).toEqual(
						pixel([style(part(item, 'text')).color]),
					)
					continue
				}

				// The white plate: the text and the icon hold the WCAG thresholds
				const plate = [style(card(item)).backgroundColor]

				expect(
					contrast(style(part(item, 'text')).color, plate),
					`${name}: заголовок`,
				).toBeGreaterThanOrEqual(TEXT)
				expect(
					contrast(style(part(item, 'description')).color, plate),
					`${name}: описание тише заголовка`,
				).toBeLessThan(contrast(style(part(item, 'text')).color, plate))
				expect(contrast(icon, plate), `${name}: значок`).toBeGreaterThanOrEqual(GRAPHIC)
			}
		},
	)

	it.each(SCHEMES)('%s: soft toasts match the Alert palette', async (scheme) => {
		document.documentElement.dataset.soTheme = scheme

		const variants = ['normal', 'accent', 'positive', 'caution', 'negative'] as const
		const alerts = render(() =>
			variants.map((variant) => h(Alert, { variant, view: 'soft' as const })),
		).querySelectorAll('.so-alert')
		const { show, rest } = await mount({ max: KINDS.length })
		const toasts = await show(
			...KINDS.map(({ name, type }) => ({
				text: name,
				description: 'Details',
				type,
				view: 'soft' as const,
			})),
		)
		await rest()

		for (const [index, { name }] of KINDS.entries()) {
			const item = titled(name)
			const alert = alerts[index]
			if (!alert) throw new Error('Missing Alert reference for ' + name)
			const plate = style(card(item))
			const alertStyle = style(alert)

			expect(plate.backgroundColor, name).toBe(alertStyle.backgroundColor)
			expect(opacity(plate.backgroundColor), name).toBe(1)
			expect(plate.color, name).toBe(alertStyle.color)
			expect(style(part(item, 'description')).color, name).toBe(alertStyle.color)
			expect(style(part(item, 'close')).color, name).toBe(alertStyle.color)
			expect(style(part(item, 'icon')).color, name).toBe(
				style(find('.so-alert__icon', alert)).color,
			)
			expect(contrast(plate.color, [plate.backgroundColor]), name).toBeGreaterThanOrEqual(
				TEXT,
			)
		}

		const item = titled('success')
		const softFill = style(card(item)).backgroundColor
		const success = toasts.find((toast) => toast.type === 'success')
		if (!success) throw new Error('Missing success toast')
		success.view = undefined
		await nextTick()
		await colorsSettled(card(item))

		expect(style(card(item)).backgroundColor).not.toBe(softFill)
		expect(style(part(item, 'icon')).color).toBe(style(card(item)).color)
	})

	it.each(SCHEMES)('%s: item view overrides the live Toasts default', async (scheme) => {
		document.documentElement.dataset.soTheme = scheme

		const view = ref<TToastsItemView>('filled')
		const { show, rest } = await mount({
			get view() {
				return view.value
			},
		})
		const palette = render(() => [
			h(Alert, { view: 'filled' as const, class: 'reference-filled' }),
			h(Alert, { view: 'outlined' as const, class: 'reference-outlined' }),
			h(Alert, { view: 'soft' as const, class: 'reference-soft' }),
		])
		const [override] = await show({ text: 'Override', view: 'outlined' }, { text: 'Inherited' })
		if (!override) throw new Error('Missing outlined toast')
		await rest()

		const inherited = card(titled('Inherited'))
		const outlined = card(titled('Override'))
		const expectView = (plate: HTMLElement, view: TToastsItemView) => {
			const expected = style(find('.reference-' + view, palette))
			expect(style(plate).backgroundColor).toBe(expected.backgroundColor)
			expect(style(plate).color).toBe(expected.color)
			expect(ringed(plate)).toBe(view === 'outlined')
		}

		expectView(inherited, 'filled')
		expectView(outlined, 'outlined')

		view.value = 'soft'
		await nextTick()
		await colorsSettled(inherited)
		expectView(inherited, 'soft')
		expectView(outlined, 'outlined')

		override.view = undefined
		await nextTick()
		await colorsSettled(outlined)
		expectView(outlined, 'soft')
	})

	/**
	 * The node's visible shadow layers, as the computed style gives them: the
	 * colour, the offsets, the blur and the spread. Tailwind's empty layers —
	 * transparent and zero-size — are dropped. A comma inside a colour
	 * (`rgba(…)`) doesn't split layers.
	 */
	const shadows = (element: Element) =>
		style(element)
			.boxShadow.split(/,(?![^(]*\))/)
			.map((layer) => {
				const lengths = (layer.match(/-?[\d.]+px/g) ?? []).map(parseFloat)
				const [x = 0, y = 0, blur = 0, spread = 0] = lengths

				return { color: layer.replace(/-?[\d.]+px/g, '').trim(), x, y, blur, spread }
			})
			.filter(({ color }) => color !== 'none' && opacity(color) > 0)

	/**
	 * The rim is a ring: a shadow layer without offset and blur, with spread —
	 * as Tailwind draws a ring (`ring-1`). A shadow's layers have offset and
	 * blur.
	 */
	const ringed = (element: Element): boolean =>
		shadows(element).some(
			({ x, y, blur, spread }) => x === 0 && y === 0 && blur === 0 && spread >= 1,
		)

	/**
	 * The rim — a grey ring of step 300 — only on the white plate: it holds the
	 * edge where the shadow doesn't show — in the dark scheme and over a panel
	 * of the same colour. A filled plate is a signal, and a signal has no frame
	 * anywhere in the theme — neither a `filled` button nor a tag's pill, — and
	 * a ring on the fill read as a dirty rim. Every plate has a shadow.
	 */
	it.each(SCHEMES)('%s: кромка — только у белой плашки, тень — у каждой', async (scheme) => {
		document.documentElement.dataset.soTheme = scheme

		const { show, rest } = await mount({ max: KINDS.length })

		await show(...KINDS.map(({ name, type }) => ({ text: name, type })))
		await rest()

		for (const { name, type } of KINDS) {
			const plate = card(titled(name))

			expect(ringed(plate), `${name}: кромка`).toBe(type === undefined)
			expect(
				shadows(plate).some(({ blur }) => blur > 0),
				`${name}: тень`,
			).toBe(true)
		}
	})

	/**
	 * In forced colors mode the browser removes the fill, the shadow and the
	 * ring, and a frame holds the edge — the rim's second half, a transparent
	 * outline the browser paints with a system colour (`forced-colors.spec.ts`,
	 * «кромка панели»). Every plate has it: a filled one has no ring in the
	 * normal mode either, but the outline is the same.
	 */
	it.runIf(forcedColorsRepaint).each(SCHEMES)(
		'%s: в режиме принудительных цветов рамка — у каждой плашки',
		async (scheme) => {
			await forcedColors('active')
			document.documentElement.dataset.soTheme = scheme

			const { show, rest } = await mount({ max: KINDS.length })

			await show(...KINDS.map(({ name, type }) => ({ text: name, type })))
			await rest()

			// The mode is on: the browser removed the shadow, and the ring with it
			expect(matchMedia('(forced-colors: active)').matches).toBe(true)

			for (const { name } of KINDS) {
				const plate = card(titled(name))
				const { boxShadow, outlineColor, backgroundColor } = style(plate)

				expect(boxShadow, `${name}: тени нет`).toBe('none')
				expect(outlined(plate), `${name}: рамка`).toBe(true)
				expect(pixel([outlineColor]), `${name}: рамка видна на фоне`).not.toEqual(
					pixel([backgroundColor]),
				)
			}
		},
	)

	/**
	 * A point inside the shape of a type's icon, off the sign on it, — in
	 * Material `viewBox` units (x 0…960, y −960…0): in a circle — under the top
	 * edge, above the sign, in the bell — in the middle, in the triangle — above
	 * the "!".
	 */
	const HOLLOW: Readonly<Record<string, { x: number; y: number }>> = {
		обычное: { x: 480, y: -480 },
		info: { x: 480, y: -760 },
		success: { x: 480, y: -760 },
		warning: { x: 480, y: -640 },
		error: { x: 480, y: -760 },
	}

	/** Directions from the point — a step in `viewBox` units. */
	const SIDES = {
		вправо: { x: 1, y: 0 },
		влево: { x: -1, y: 0 },
		вниз: { x: 0, y: 1 },
		вверх: { x: 0, y: -1 },
	}

	/** Whether there is drawing from the point toward `side` — up to the icon box's edge. */
	const reaches = (
		path: SVGGeometryElement,
		point: { x: number; y: number },
		side: { x: number; y: number },
	): boolean => {
		for (let step = 1; step < 960; step++) {
			const x = point.x + side.x * step
			const y = point.y + side.y * step

			if (path.isPointInFill({ x, y })) return true
		}

		return false
	}

	/**
	 * The types' icons are drawn alike: an outline, like the error's. A filled
	 * icon by Field's error text read as a blot and became an outline, while
	 * the other types' icons came filled — the error looked alien in a stack. An
	 * outline is an empty shape: at a point inside it there is no drawing, and
	 * there is drawing in every direction from the point — the point isn't
	 * outside the shape. The measure is the drawing's geometry (`isPointInFill`),
	 * not pixels: colour and antialiasing don't disturb it.
	 */
	it('значок каждого вида — контур, как у ошибки: фигура внутри пуста', async () => {
		const { show, rest } = await mount({ max: KINDS.length })

		await show(...KINDS.map(({ name, type }) => ({ text: name, type })))
		await rest()

		for (const { name } of KINDS) {
			const path = glyph(titled(name)).querySelector('path')
			const point = HOLLOW[name]

			if (!(path instanceof SVGPathElement)) throw new Error(`${name}: рисунка значка нет`)
			if (!point) throw new Error(`${name}: точки внутри фигуры нет`)

			expect(path.isPointInFill(point), `${name}: внутри фигуры`).toBe(false)

			for (const [direction, side] of Object.entries(SIDES)) {
				expect(reaches(path, point, side), `${name}: рисунок ${direction}`).toBe(true)
			}
		}
	})

	/**
	 * The toast's own content — a button of each view, without a variant: the
	 * plate gives its colour.
	 */
	const Actions: TToastRender = () =>
		BUTTON_VIEWS.map((view) => h(Button, { key: view, view, text: view }))

	/**
	 * The toast's buttons in markup order — the Tab order: its own content,
	 * then the close button. A button's label is text, the close button's is an
	 * icon, a graphic: the label's threshold on the white plate is its own
	 * (`label`). The `none` view has neither a state background nor a focus
	 * ring, outside a toast too (`button/_button.scss`) — only its label is
	 * checked.
	 */
	const CONTROLS = [
		...BUTTON_VIEWS.map((view) => ({
			name: view,
			selector: `.so-toasts-item__content > .so-button--view-${view}`,
			label: TEXT,
			bare: view === 'none',
		})),
		{ name: 'крестик', selector: '.so-toasts-item__close', label: GRAPHIC, bare: false },
	]

	/**
	 * What a button shows: the label's colour, its contrast to its background
	 * and that background's lightness.
	 */
	const look = (item: HTMLElement, button: HTMLElement) => {
		const { color, backgroundColor } = style(button)
		const backdrop = [style(card(item)).backgroundColor, backgroundColor]

		return { color, label: contrast(color, backdrop), fill: lightness(backdrop) }
	}

	/**
	 * The button under hover and when pressed — once the whole toast's colour
	 * transitions have played. The press is released even when a check fails:
	 * a held mouse button would pass to the next test. A release over the
	 * button is a click, so the close button is measured last: its click closes
	 * the toast.
	 */
	const press = async (item: HTMLElement, button: HTMLElement) => {
		await userEvent.hover(button)
		await colorsSettled(item)

		const hovered = look(item, button)

		await commands.mouseDown()

		try {
			await colorsSettled(item)

			return { наведение: hovered, нажатие: look(item, button) }
		} finally {
			await commands.mouseUp()
		}
	}

	/**
	 * On the white plate a label holds the WCAG threshold to its background. On
	 * a type's fill there are no thresholds (see `TEXT`): there the label has
	 * the plate's text colour, like everything on it, `none` too, and hover and
	 * press are a shadow — the background moves away from the white label,
	 * darker.
	 */
	it.each(CASES)(
		'$scheme, $name: подписи кнопок и крестика в покое, под наведением и при нажатии — по плашке, а состояние видно',
		async ({ scheme, type }) => {
			document.documentElement.dataset.soTheme = scheme

			const { show, rest } = await mount()

			await show({ text: 'Сохранено', type, render: Actions })
			await rest()

			const [item] = items()

			if (!item) throw new Error('тоста нет')

			const text = style(card(item)).color

			// Rest — for all buttons at once: the pointer is moved off the toast
			await userEvent.hover(find('.so-test-page'))
			await colorsSettled(item)

			const controls = CONTROLS.map((control) => ({
				...control,
				resting: look(item, find(control.selector, item)),
			}))

			for (const { name, selector, label, bare, resting } of controls) {
				const looks = { покой: resting, ...(await press(item, find(selector, item))) }

				for (const [state, seen] of Object.entries(looks)) {
					if (type) {
						expect(
							pixel([seen.color]),
							`${name}, ${state}: подпись цвета плашки`,
						).toEqual(pixel([text]))
					} else {
						expect(seen.label, `${name}, ${state}: подпись`).toBeGreaterThanOrEqual(
							label,
						)
					}
				}

				if (bare) continue

				for (const state of ['наведение', 'нажатие'] as const) {
					expect(
						Math.abs(looks[state].fill - resting.fill),
						`${name}, ${state}: фон отошёл от покоя`,
					).toBeGreaterThanOrEqual(VISIBLE_FILL)

					if (type) {
						expect(
							looks[state].fill,
							`${name}, ${state}: фон темнее покоя`,
						).toBeLessThan(resting.fill)
					}
				}
			}
		},
	)

	/**
	 * The buttons' keyboard focus ring — by Tab from the toast's root, through
	 * the buttons in markup order. On a type's fill it has the plate's text
	 * colour, like the labels: the theme's ring almost vanishes on it. A plain
	 * toast has the theme's ring, as everywhere, — it isn't measured.
	 */
	it.each(CASES.filter(({ type }) => type))(
		'$scheme, $name: кольцо фокуса кнопок с клавиатуры на заливке — цвета текста плашки',
		async ({ scheme, type }) => {
			document.documentElement.dataset.soTheme = scheme

			const { show, rest } = await mount()

			await show({ text: 'Сохранено', type, render: Actions })
			await rest()

			const [item] = items()

			if (!item) throw new Error('тоста нет')

			const text = style(card(item)).color

			item.focus()

			for (const { name, selector, bare } of CONTROLS) {
				const button = find(selector, item)

				await userEvent.tab()

				expect(document.activeElement, name).toBe(button)

				if (bare) continue

				await colorsSettled(item)

				expect(outlined(button), `${name}: кольцо`).toBe(true)
				expect(pixel([style(button).outlineColor]), `${name}: кольцо цвета плашки`).toEqual(
					pixel([text]),
				)
			}
		},
	)

	/**
	 * «Сохраняем…» on the white plate becomes «Сохранено» on the success fill.
	 * The plate is repainted by a transition — the background and the text on
	 * it: text turned white at once would vanish for a moment on the still
	 * white plate. The white plate's rim fades by the same transition, of the
	 * shadow: a filled plate has none, and removed at once it would leave the
	 * still white plate without an edge. The root has no transitions: the
	 * removal of a closed toast waits for them (`afterTransitions`), while
	 * colour and shadow transitions run without motion too.
	 */
	it('смена вида у открытого тоста — переход цвета и кромки плашки, а не корня', async () => {
		const { show, rest } = await mount()
		const [toast] = await show({ text: 'Сохраняем…', loading: true })

		await rest()

		const [item] = items()

		if (!item || !toast) throw new Error('тоста нет')

		const own = ownTransitionRuns(item)
		const plate = ownTransitionRuns(card(item))

		toast.loading = false
		toast.type = 'success'
		toast.text = 'Сохранено'
		await nextTick()
		await transitionEvents()

		expect(plate).toEqual(expect.arrayContaining(['background-color', 'color', 'box-shadow']))
		expect(own).toEqual([])
	})

	it('кольцо ожидания — по кругу значка, и текст не сдвигается, когда кольцо сменилось значком', async () => {
		const { show, rest } = await mount()
		const [toast] = await show({ text: 'Сохраняем…', type: 'success', loading: true })

		await rest()

		const [item] = items()

		if (!item || !toast) throw new Error('тоста нет')

		const box = part(item, 'icon').getBoundingClientRect()
		const spinner = part(item, 'icon').querySelector('.so-progress-spinner')

		if (!(spinner instanceof HTMLElement)) throw new Error('кольца нет')

		const ring = spinner.getBoundingClientRect()
		const before = part(item, 'text').getBoundingClientRect()
		const runner = spinner.querySelector('.so-progress-spinner__runner')

		if (!(runner instanceof SVGElement)) throw new Error('бегущей дуги нет')

		// The circle of Material icons is 800 of the box's 960 units, 5/6 of its side
		expect(ring.width).toBeCloseTo((box.width * 5) / 6, 0)
		expect(ring.height).toBeCloseTo((box.height * 5) / 6, 0)
		expect((ring.left + ring.right) / 2).toBeCloseTo((box.left + box.right) / 2, 0)
		expect((ring.top + ring.bottom) / 2).toBeCloseTo((box.top + box.bottom) / 2, 0)
		// The arc has the icon box's colour, like the icon it gives way to. The
		// ring runs, and the running arc shows: the theme hides the fraction arc
		// while running
		expect(pixel([style(runner).stroke])).toEqual(pixel([style(part(item, 'icon')).color]))

		toast.loading = false
		await nextTick()
		await nextFrame()

		const after = part(item, 'text').getBoundingClientRect()

		expect(part(item, 'icon').querySelector('.so-progress-spinner')).toBeNull()
		expect(glyph(item).getBoundingClientRect().width).toBeCloseTo(box.width, 0)
		expect(part(item, 'icon').getBoundingClientRect().width).toBeCloseTo(box.width, 1)
		expect(after.left).toBeCloseTo(before.left, 1)
		expect(after.top).toBeCloseTo(before.top, 1)
	})
})

describe('появление и исчезание', () => {
	it('новый тост въезжает: место растёт, тост проявляется', async () => {
		const { engine } = await mount()

		engine.extensions.toasts.show('Сохранено')
		await nextTick()

		const [item] = items()

		if (!item) throw new Error('тоста нет')

		expect(transitioning(item)).toEqual(
			expect.arrayContaining(['opacity', 'grid-template-rows']),
		)
	})

	it('закрытый гаснет, уходит вбок и уходит из документа, когда доиграл переходы', async () => {
		const { show, rest } = await mount()
		const [toast] = await show('Сохранено')

		await rest()

		const [item] = items()

		if (!item || !toast) throw new Error('тоста нет')

		toast.close()
		await nextTick()

		expect(item.dataset.open).toBe('false')
		expect(getComputedStyle(item).pointerEvents).toBe('none')

		let frames = 0

		while (item.isConnected) {
			if (frames === 120) throw new Error('тост не ушёл за 120 кадров')

			frames += 1
			await nextFrame()
		}

		// It didn't leave at once: the closing transitions had time to run
		expect(frames).toBeGreaterThan(2)
	})

	it('без движения тост проявляется и гаснет на месте', async () => {
		await reducedMotion('reduce')

		const { show, rest, engine } = await mount()
		const [toast] = await show('Сохранено')
		const [item] = items()

		if (!item || !toast) throw new Error('тоста нет')

		expect(transitioning(item)).toEqual(['opacity'])

		await rest()

		const before = card(item).getBoundingClientRect()

		toast.close()
		await nextTick()

		expect(transitioning(item)).toEqual(['opacity'])
		expect(card(item).getBoundingClientRect().left).toBeCloseTo(before.left, 0)

		await expect.poll(() => engine.extensions.batch.items).toEqual([])
	})
})

describe('жест', () => {
	/**
	 * How long the pointer stands before the release, ms: longer than the
	 * velocity window of the swipe plugin (`VELOCITY_WINDOW`, 100 ms).
	 */
	const STILL = 200

	it('у бокового места тост смахивают к краю строки: закрыт и ушёл', async () => {
		const { show, rest } = await mount()
		const [toast] = await show('Сохранено')

		await rest()

		const [item] = items()

		if (!item || !toast) throw new Error('тоста нет')

		expect(getComputedStyle(item).touchAction).toBe('pan-y pinch-zoom')

		const box = card(item).getBoundingClientRect()
		const x = 40
		const y = box.height / 2

		await userEvent.dragAndDrop(card(item), card(item), {
			sourcePosition: { x, y },
			targetPosition: { x: x + 200, y },
			steps: 10,
			force: true,
		})

		await expect.poll(() => toast.open).toBe(false)
		await expect.poll(() => item.isConnected).toBe(false)
	})

	/**
	 * Released after a pause: the pointer stood still longer than the swipe
	 * plugin's velocity window (`VELOCITY_WINDOW`, 100 ms), so the release is no
	 * throw, and only the distance decides — 40 px is short of a quarter of the
	 * card. Without the pause WebKit got the steps of the drag almost at once:
	 * 40 px in a few milliseconds is a throw by the plugin's rule
	 * (`CLOSE_VELOCITY`), and the toast closed. The pause is the input «the
	 * pointer stands», not a wait for the outcome. Points are from `body`: the
	 * card follows the pointer.
	 */
	it('отпустили ближе четверти — тост возвращается на место', async () => {
		const { show, rest } = await mount()
		const [toast] = await show('Сохранено')

		await rest()

		const [item] = items()

		if (!item || !toast) throw new Error('тоста нет')

		const before = card(item).getBoundingClientRect()
		const body = document.body.getBoundingClientRect()
		const from = {
			x: before.left + 40 - body.left,
			y: before.top + before.height / 2 - body.top,
		}

		await userEvent.hover(document.body, { position: from })
		await commands.mouseDown()

		try {
			await userEvent.hover(document.body, { position: { x: from.x + 40, y: from.y } })
			await new Promise((resolve) => setTimeout(resolve, STILL))
		} finally {
			await commands.mouseUp()
		}

		expect(toast.open).toBe(true)

		await expect
			.poll(() => Math.abs(card(item).getBoundingClientRect().left - before.left))
			.toBeLessThan(EPSILON)
	})
})

describe('стопка', () => {
	/** How far a back toast peeps out from under the one before it: the column's gap. */
	const PEEK = GAP

	/** How much narrower a back toast is at each step. */
	const NARROW = 0.05

	/** The plate's middle along the line. */
	const middle = (box: DOMRect) => (box.left + box.right) / 2

	/** The toasts' texts in document order — the stack's order, the front one first. */
	const texts = () =>
		items().map((item) => item.querySelector('.so-toasts-item__text')?.textContent)

	/** The toasts in order; fewer than `count` — the test fails here. */
	const take = (count: number): HTMLElement[] => {
		const found = items()

		if (found.length < count) throw new Error(`тостов меньше ${count}`)

		return found
	}

	/**
	 * A node at the document's end — past the toasts' region, which was
	 * teleported there earlier. Removed after the test.
	 */
	const append = <T extends HTMLElement>(element: T): T => {
		document.body.append(element)
		onTestFinished(() => element.remove())

		return element
	}

	/** The page is longer than the window: there is room to scroll it. */
	const scrollable = () => {
		const spacer = append(document.createElement('div'))

		spacer.style.height = '200vh'
	}

	/**
	 * The stack's transitions have played. The layout plugin writes the back
	 * toasts' height when the front one changed, and a height transition
	 * started by a step change gives way to a new one: an interrupted
	 * transition rejects `finished`. Wait until no new ones come.
	 */
	const still = async () => {
		for (;;) {
			const running = items().flatMap((item) => item.getAnimations())

			if (running.length === 0) return

			await Promise.allSettled(running.map((animation) => animation.finished))
		}
	}

	it('передний — у края окна, задние уже и выглядывают на ступень к дальней стороне', async () => {
		const { show } = await mount({ layout: 'cascade' })

		await show('Первый', 'Второй', 'Третий')
		await still()

		const [front, next, last] = take(3).map((item) => card(item).getBoundingClientRect())

		if (!front || !next || !last) throw new Error('тостов меньше трёх')

		expect(texts()).toEqual(['Третий', 'Второй', 'Первый'])
		expect(front.bottom).toBeCloseTo(VIEWPORT.height - OFFSET, 0)
		expect(front.right).toBeCloseTo(viewportWidth() - OFFSET, 0)
		expect(front.width).toBeCloseTo(WIDTH, 0)
		expect(front.top - next.top).toBeCloseTo(PEEK, 0)
		expect(next.top - last.top).toBeCloseTo(PEEK, 0)
		expect(next.width).toBeCloseTo(WIDTH * (1 - NARROW), 0)
		expect(last.width).toBeCloseTo(WIDTH * (1 - 2 * NARROW), 0)
		expect(Math.abs(middle(next) - middle(front))).toBeLessThan(EPSILON)
		expect(Math.abs(middle(last) - middle(front))).toBeLessThan(EPSILON)

		// The front one is on top: at its middle is itself
		const hit = document.elementFromPoint(middle(front), (front.top + front.bottom) / 2)

		expect(hit?.closest('.so-toasts-item')).toBe(take(1)[0])
	})

	it('высота стопки — по переднему: задний выше переднего не торчит', async () => {
		const { show } = await mount({ layout: 'cascade' })

		await show(
			{
				text: 'Высокий',
				description: 'Описание в несколько строк, чтобы тост стал заметно выше переднего',
			},
			'Низкий',
		)
		await still()

		const [front, back] = take(2)
		const region = document.querySelector<HTMLElement>('.so-toasts')
		const list = region?.querySelector('.so-toasts__list')
		const body = back?.querySelector('.so-toasts-item__body')

		if (!front || !back || !region || !list || !body) throw new Error('разметки нет')

		const frontHeight = front.getBoundingClientRect().height

		// The back toast's own content is higher than the front one — otherwise
		// there's nothing to check
		expect(Number.parseFloat(getComputedStyle(body).height)).toBeGreaterThan(frontHeight)
		expect(getComputedStyle(back).height).toBe(getComputedStyle(front).height)
		expect(
			Number.parseFloat(region.style.getPropertyValue('--so-toasts-front-height')),
		).toBeCloseTo(frontHeight, 0)
		expect(list.getBoundingClientRect().height).toBeCloseTo(frontHeight, 0)
		expect(
			card(front).getBoundingClientRect().top - card(back).getBoundingClientRect().top,
		).toBeCloseTo(PEEK, 0)
	})

	it('у верхнего края задние выглядывают вниз', async () => {
		const { show } = await mount({ layout: 'cascade', placement: 'top' })

		await show('Первый', 'Второй')
		await still()

		const [front, back] = take(2).map((item) => card(item).getBoundingClientRect())

		if (!front || !back) throw new Error('тостов меньше двух')

		expect(front.top).toBeCloseTo(OFFSET, 0)
		expect(back.bottom - front.bottom).toBeCloseTo(PEEK, 0)
		expect(Math.abs(middle(back) - middle(front))).toBeLessThan(EPSILON)
	})

	/**
	 * The second toast slides into the stack: the first one already stands, the
	 * second is shown by code. The new one's shift transition — the slide-in —
	 * is paused at its very start: so it shows where the toast comes from.
	 */
	const arrive = async (props: Partial<IToastsProps> = {}) => {
		const { show, engine } = await mount({ layout: 'cascade', ...props })

		await show('Первый')
		await still()

		engine.extensions.toasts.show('Второй')
		await nextTick()

		const [arriving, previous] = take(2)

		if (!arriving || !previous) throw new Error('тостов меньше двух')

		const entry = transitionOf(arriving, 'translate')

		entry.pause()
		entry.currentTime = 0

		return { arriving, previous, entry }
	}

	it('новый въезжает от края окна на свою высоту, прежний передний сразу за ним отходит тем же переходом', async () => {
		const { arriving, previous, entry } = await arrive()

		expect(transitioning(arriving)).toEqual(expect.arrayContaining(['translate', 'opacity']))
		// Below its place by its own height: the top is where the bottom will
		// stand, at the window's edge
		expect(card(arriving).getBoundingClientRect().top).toBeCloseTo(VIEWPORT.height - OFFSET, 0)
		// The former front one is already behind the new one, in the same frame
		expect(Number(getComputedStyle(previous).zIndex)).toBeLessThan(
			Number(getComputedStyle(arriving).zIndex),
		)

		for (const property of ['translate', 'scale']) {
			const step = transitionOf(previous, property)

			expect(durationOf(step), property).toBe(durationOf(entry))
			expect(easingOf(step), property).toBe(easingOf(entry))
		}
	})

	it('у верхнего края новый въезжает сверху', async () => {
		const { arriving } = await arrive({ placement: 'top' })

		expect(card(arriving).getBoundingClientRect().bottom).toBeCloseTo(OFFSET, 0)
	})

	/**
	 * One gone back takes the front one's height from the theme behaviour's
	 * variable, and doesn't go to it by a transition from `auto`: under a back
	 * toast's `contain: size`, `auto` is zero, and the former front one
	 * collapsed into a strip at the edge while the new one slid in. The place's
	 * height is unscaled (`offsetHeight`), every frame.
	 */
	it('прежний передний не схлопывается: высота идёт от своей к высоте нового переднего', async () => {
		const { show, engine } = await mount({ layout: 'cascade' })

		await show({
			text: 'Высокий',
			description: 'Описание в несколько строк, чтобы тост стал заметно выше нового',
		})
		await still()

		const [previous] = take(1)

		if (!previous) throw new Error('тоста нет')

		const own = previous.offsetHeight

		engine.extensions.toasts.show('Низкий')
		await nextTick()

		const heights: number[] = []

		do {
			heights.push(previous.offsetHeight)
			await nextFrame()
		} while (items().some((item) => item.getAnimations().length > 0))

		const [front] = take(1)

		if (!front) throw new Error('тоста нет')

		// The new one is lower than the former — otherwise there's nothing to check
		expect(front.offsetHeight).toBeLessThan(own)
		expect(heights[0]).toBeCloseTo(own, 0)
		expect(Math.min(...heights)).toBeGreaterThanOrEqual(front.offsetHeight - EPSILON)
		expect(previous.offsetHeight).toBeCloseTo(front.offsetHeight, 0)
	})

	it('без движения новый только проявляется на месте, а прежний встаёт на ступень сразу', async () => {
		await reducedMotion('reduce')

		const { show, engine } = await mount({ layout: 'cascade' })

		await show('Первый')
		await still()

		engine.extensions.toasts.show('Второй')
		await nextTick()

		const [arriving, previous] = take(2)

		if (!arriving || !previous) throw new Error('тостов меньше двух')

		expect(transitioning(arriving)).toEqual(['opacity'])
		expect(transitioning(previous).filter((property) => property !== 'opacity')).toEqual([])
		expect(card(arriving).getBoundingClientRect().bottom).toBeCloseTo(
			VIEWPORT.height - OFFSET,
			0,
		)
	})

	it('RTL: стопка у своего края, задние — по середине переднего', async () => {
		setDir(document.documentElement, 'rtl')

		const { show } = await mount({ layout: 'cascade', placement: 'bottom-start' })

		await show('Первый', 'Второй')
		await still()

		const [front, back] = take(2).map((item) => card(item).getBoundingClientRect())

		if (!front || !back) throw new Error('тостов меньше двух')

		expect(front.right).toBeCloseTo(viewportWidth() - OFFSET, 0)
		expect(Math.abs(middle(back) - middle(front))).toBeLessThan(EPSILON)
	})

	/**
	 * The back toast has a type: its plate is filled, and it must cover the
	 * content with its fill. `::after` covers it with the plate's background
	 * colour (`background-color: inherit`), and a fill that isn't the
	 * background — a gradient or a layer of its own — wouldn't repeat under it:
	 * the back toast's text would show through.
	 */
	it('содержимое заднего закрыто его плашкой, а нажатие по краю достаётся тосту', async () => {
		const { show } = await mount({ layout: 'cascade' })

		await show({ text: 'Первый', type: 'error' }, 'Второй')
		await still()

		const [front, back] = take(2)

		if (!front || !back) throw new Error('тостов меньше двух')

		const peek = card(back).getBoundingClientRect()
		const cover = style(card(back), '::after')

		expect(cover.opacity).toBe('1')
		expect(opacity(cover.backgroundColor), 'слой непрозрачен').toBe(1)
		expect(pixel([cover.backgroundColor]), 'цвета заливки').toEqual(
			pixel([style(card(back)).backgroundColor]),
		)
		expect(getComputedStyle(card(front), '::after').opacity).toBe('0')
		expect(document.elementFromPoint(middle(peek), peek.top + PEEK / 2)).toBe(back)
	})

	it('колесо над стопкой: передний уходит назад переходом, страница не едет', async () => {
		const { show } = await mount({ layout: 'cascade' })

		scrollable()
		await show('Первый', 'Второй', 'Третий')
		await still()

		const [front, next] = take(2)

		if (!front || !next) throw new Error('тостов меньше двух')

		const moved = ownTransitionRuns(front)

		await userEvent.wheel(card(front), { delta: { y: 100 } })
		await nextTick()

		expect(texts()).toEqual(['Второй', 'Первый', 'Третий'])
		expect(transitioning(next)).toEqual(expect.arrayContaining(['translate', 'scale']))
		expect(window.scrollY).toBe(0)

		// One gone back is a node inserted anew: it appears in its place and
		// doesn't slide in from the edge, like a new one
		await transitionEvents()

		expect(moved).toEqual(['opacity'])

		await still()

		expect(card(next).getBoundingClientRect().bottom).toBeCloseTo(VIEWPORT.height - OFFSET, 0)
	})

	it('столбцом колесо над тостом — странице', async () => {
		const { show } = await mount()

		scrollable()
		await show('Первый', 'Второй')
		await still()

		const [front] = take(1)

		if (!front) throw new Error('тоста нет')

		await userEvent.wheel(card(front), { delta: { y: 100 } })

		await expect.poll(() => window.scrollY).toBeGreaterThan(0)
		expect(texts()).toEqual(['Второй', 'Первый'])
	})

	it('фокус выводит задний вперёд без перестановки, и Tab идёт по тостам и из стопки', async () => {
		const { show } = await mount({ layout: 'cascade' })
		const after = append(document.createElement('button'))

		after.textContent = 'После региона'
		await show('Первый', 'Второй')
		await still()

		const [front, back] = take(2)

		if (!front || !back) throw new Error('тостов меньше двух')

		front.focus()
		// The front one's close button, then the back one
		await userEvent.tab()
		await userEvent.tab()

		expect(document.activeElement).toBe(back)

		await still()

		const box = card(back).getBoundingClientRect()

		expect(texts()).toEqual(['Второй', 'Первый'])
		expect(box.bottom).toBeCloseTo(VIEWPORT.height - OFFSET, 0)
		expect(box.width).toBeCloseTo(WIDTH, 0)
		expect(
			document
				.elementFromPoint(middle(box), (box.top + box.bottom) / 2)
				?.closest('.so-toasts-item'),
		).toBe(back)
		// The front one stepped back
		expect(box.top - card(front).getBoundingClientRect().top).toBeCloseTo(PEEK, 0)

		// The back one's close button, then out of the stack, to what is past the region
		await userEvent.tab()
		await userEvent.tab()

		expect(document.activeElement).toBe(after)
	})

	it('закрытый передний уходит поверх, а следующий сразу встаёт вперёд', async () => {
		const { show } = await mount({ layout: 'cascade' })
		const [, toast] = await show('Первый', 'Второй')

		await still()

		const [front, next] = take(2)

		if (!toast || !front || !next) throw new Error('тостов меньше двух')

		const height = front.offsetHeight

		toast.close()
		await nextTick()

		expect(getComputedStyle(front).zIndex).toBe('1')
		// The closed one's place in the stack's cell doesn't collapse, as in a
		// column: it leaves over the new front one while fading, and a collapsed
		// one would vanish at once
		expect(front.offsetHeight).toBeCloseTo(height, 0)

		await still()

		expect(card(next).getBoundingClientRect().bottom).toBeCloseTo(VIEWPORT.height - OFFSET, 0)
		expect(card(next).getBoundingClientRect().width).toBeCloseTo(WIDTH, 0)

		await expect.poll(() => front.isConnected).toBe(false)
	})

	it('без движения стопка листается на месте: переходит одна прозрачность', async () => {
		await reducedMotion('reduce')

		const { show } = await mount({ layout: 'cascade' })

		await show('Первый', 'Второй')
		await still()

		const [front, next] = take(2)

		if (!front || !next) throw new Error('тостов меньше двух')

		await userEvent.wheel(card(front), { delta: { y: 100 } })
		await nextTick()

		expect(texts()).toEqual(['Первый', 'Второй'])
		expect(transitioning(next).filter((property) => property !== 'opacity')).toEqual([])
		expect(card(next).getBoundingClientRect().bottom).toBeCloseTo(VIEWPORT.height - OFFSET, 0)
	})
})
