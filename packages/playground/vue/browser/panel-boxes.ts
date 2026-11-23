/**
 * Measuring an open panel at its trigger and an open layer at the window's
 * edge or centre — to compare the layout of two renders: Vue and Web
 * Components (`webc-frame.spec.ts`, `webc-collections.spec.ts`,
 * `webc-dates.spec.ts`), Vue and Angular (`angular-host.spec.ts`).
 *
 * A panel stands at its anchor, so its place is compared not from the window's
 * corner but from the trigger: the boxes of the trigger and of the panel with
 * its parts — from the trigger's corner. A dialog and a drawer stand at an edge
 * or in the middle of the window, and their boxes with the backdrop and the
 * parts are compared from the window's corner. The theme sees the same classes
 * and the same markup in the layers of different frameworks, and the boxes
 * must match.
 */

import { expect } from 'vitest'

/** A node's box from the trigger's corner, in pixels. */
export type TBox = { x: number; y: number; width: number; height: number }

/** The block the component stands in — one for both renders. */
export const BOX = 'padding: 48px 24px; width: 400px'

/** The parts of an open popover: the panel, the content wrapper, the content, the cross and its icon. */
export const POPOVER_PARTS =
	'.so-popover__panel, .so-popover__content, .so-popover__content > *, .so-popover__close, .so-popover__close .so-icon'

/** The parts of an open tooltip: the panel and the text wrapper. */
export const TOOLTIP_PARTS = '.so-tooltip__panel, .so-tooltip__content'

/** The parts of an open dialog: the backdrop, the dialog, the title, the body with its content, the footer with its buttons, the cross. */
export const DIALOG_PARTS =
	'.so-backdrop:has(+ .so-dialog), .so-dialog, .so-dialog__title, .so-dialog__body, .so-dialog__body > *, .so-dialog__footer, .so-dialog__footer > *, .so-dialog__close'

/** The parts of an open drawer — the same as the dialog's. */
export const DRAWER_PARTS =
	'.so-backdrop:has(+ .so-drawer), .so-drawer, .so-drawer__title, .so-drawer__body, .so-drawer__body > *, .so-drawer__footer, .so-drawer__footer > *, .so-drawer__close'

/**
 * How long an open panel or layer may take to stand still, ms. A limit in
 * time, not in frames: a count of frames is a guess about the machine, and
 * under load frames come rarely.
 */
const SETTLE_TIMEOUT = 5000

/** What a read of standing boxes returns; anything else is what keeps them from it. */
const STILL = 'стоят'

/** A frame: the panel's anchoring computes the place after it. */
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/**
 * The boxes of the trigger and of the open panel with its parts — from the
 * trigger's corner. The parts are looked up in the document: the panel is
 * teleported. Hidden parts have no boxes and don't count. No panel — empty.
 */
function boxesOf(trigger: () => Element | null, parts: string): TBox[] {
	const anchor = trigger()
	const found = [...document.querySelectorAll(parts)].filter(
		(node) => node.getClientRects().length > 0,
	)

	if (!anchor || found.length === 0) return []

	const origin = anchor.getBoundingClientRect()

	return [anchor, ...found].map((node) => {
		const box = node.getBoundingClientRect()

		return {
			x: Math.round(box.left - origin.left),
			y: Math.round(box.top - origin.top),
			width: Math.round(box.width),
			height: Math.round(box.height),
		}
	})
}

/**
 * Boxes that stand still: each read waits for a frame and for the document's
 * transitions to play out — the panel's appearance, the drawer sliding in, —
 * and two reads in a row give the same boxes, and not none. A transition
 * interrupted by a new value or by moving the node is cancelled, and its
 * `finished` is rejected: for the wait that is an end too — whether things
 * have settled, the boxes decide.
 *
 * The wait is limited in time (`SETTLE_TIMEOUT`), and the error names what the
 * last read saw: no boxes — the panel or the layer didn't open; other boxes
 * than the read before — it is still moving, with both reads.
 */
async function stillBoxes(read: () => TBox[], message: string): Promise<TBox[]> {
	let previous = ''
	let boxes: TBox[] = []

	await expect
		.poll(
			async () => {
				await nextFrame()
				await Promise.all(
					document
						.getAnimations()
						.map((animation) => animation.finished.catch(() => undefined)),
				)

				const before = previous

				boxes = read()
				previous = JSON.stringify(boxes)

				if (boxes.length === 0) return 'рамок нет: не открыто'
				if (previous !== before) return `едут: ${before} → ${previous}`

				return STILL
			},
			{ timeout: SETTLE_TIMEOUT, interval: 0, message },
		)
		.toBe(STILL)

	return boxes
}

/**
 * The boxes of the trigger and of the open panel with its parts, once the
 * panel stands still: the anchoring computes its place a frame after it shows,
 * and under load frames come rarely, so their number isn't guessed
 * (`stillBoxes`).
 */
export function measure(trigger: () => Element | null, parts: string): Promise<TBox[]> {
	return stillBoxes(() => boxesOf(trigger, parts), `${parts}: открытая панель не встала`)
}

/** The boxes of an open layer and its parts — from the window's corner: they stand at an edge or in the middle of the screen. */
function windowBoxesOf(parts: string): TBox[] {
	return [...document.querySelectorAll(parts)]
		.filter((node) => node.getClientRects().length > 0)
		.map((node) => {
			const box = node.getBoundingClientRect()

			return {
				x: Math.round(box.left),
				y: Math.round(box.top),
				width: Math.round(box.width),
				height: Math.round(box.height),
			}
		})
}

/** The boxes of an open layer and its parts, once the layer stands still (`stillBoxes`). */
export function measureLayer(parts: string): Promise<TBox[]> {
	return stillBoxes(() => windowBoxesOf(parts), `${parts}: открытый слой не встал`)
}
