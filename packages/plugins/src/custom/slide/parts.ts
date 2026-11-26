import type { ISlidable } from '@soxa-ui/core'

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
