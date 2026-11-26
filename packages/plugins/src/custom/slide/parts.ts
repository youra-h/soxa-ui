import type { ISlidable } from '@soxa-ui/core'
import type { TSlideDirection } from './types'

/**
 * Части перетаскивания в разметке владельца — по его классам, а не строкой в
 * плагине (`classes.resolve`).
 *
 * Только прямые дети: в слоте ручки может лежать что угодно, вплоть до
 * другого ползунка, и поиск вглубь нашёл бы его части.
 */
function childrenWith(parent: Element, className: string): Element[] {
	return Array.from(parent.children).filter((child) => child.classList.contains(className))
}

/** Дорожка — ребёнок корня с классом `__track`. */
export function trackOf(owner: ISlidable, root: Element): Element | null {
	return childrenWith(root, owner.classes.resolve('__track'))[0] ?? null
}

/** Ручки — дети дорожки с классом `__thumb`, по порядку: i-я — ручка i. */
export function thumbsOf(owner: ISlidable, track: Element): Element[] {
	return childrenWith(track, owner.classes.resolve('__thumb'))
}

/** Поле ручки — её ребёнок `input`. */
export function fieldOf(thumb: Element | undefined): HTMLInputElement | null {
	if (!thumb) return null

	return (
		Array.from(thumb.children).find(
			(child): child is HTMLInputElement => child instanceof HTMLInputElement,
		) ?? null
	)
}

export interface ISlideParts {
	track?: typeof trackOf
	field?: (thumb: Element | undefined) => HTMLElement | null
	index?: (thumb: Element) => number
	length?: (direction: TSlideDirection, track: Element) => number
}

export function thumbIndex(
	parts: ISlideParts,
	thumbs: Element[],
	match: (thumb: Element) => boolean,
): number {
	const index = thumbs.findIndex(match)

	return index < 0 ? -1 : (parts.index?.(thumbs[index]) ?? index)
}

export function slideThumb(
	parts: ISlideParts,
	thumbs: Element[],
	index: number,
): Element | undefined {
	const indexOf = parts.index

	return indexOf ? thumbs.find((thumb) => indexOf(thumb) === index) : thumbs[index]
}
