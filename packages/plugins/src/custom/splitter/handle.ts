import type { ISplitter } from '@soxa-ui/core'

export function handleOf(owner: ISplitter, root: Element, target: EventTarget | null) {
	if (!(target instanceof Node)) return null

	const handleClass = owner.classes.resolve('__thumb')

	for (const child of root.children) {
		if (!(child instanceof HTMLElement)) continue
		if (!child.classList.contains(handleClass) || !child.contains(target)) continue
		if (child.hasAttribute('data-disabled')) return null

		const index = Number(child.dataset.index ?? -1)

		return Number.isInteger(index) && index >= 0 ? { element: child, index } : null
	}

	return null
}
