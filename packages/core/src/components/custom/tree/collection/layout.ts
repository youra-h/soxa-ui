import type { TDrawnEntry, TDrawnFiller } from '../../../base/collection'
import type { TTreeItem } from '../item.class'
import type { TTreeExtension } from './extensions/tree/tree.extension'

export type TTreeRenderEntry = TTreeRenderItem | TDrawnFiller

export interface TTreeRenderItem {
	kind: 'item'
	key: number
	item: TTreeItem
	row: boolean
	children: TTreeRenderEntry[]
}

/**
 * Preserve tree/group ownership even when Virtual omits the rows of open
 * ancestors. A filler still occupies precisely its step count in block flow.
 */
export function treeLayout(
	entries: readonly TDrawnEntry<TTreeItem>[],
	tree: TTreeExtension,
): readonly TTreeRenderEntry[] {
	const roots: TTreeRenderEntry[] = []
	const registered = new Map<TTreeItem, TTreeRenderItem>()
	let filler: TDrawnFiller | undefined

	for (const entry of entries) {
		if (entry.kind === 'filler') {
			filler = entry

			continue
		}

		const missing: TTreeItem[] = []
		let parent: TTreeItem | undefined = entry.item

		while (parent && !registered.has(parent)) {
			missing.push(parent)
			parent = tree.parentOf(parent)
		}

		let group = (parent ? registered.get(parent)?.children : undefined) ?? roots

		if (filler) {
			group.push(filler)
			filler = undefined
		}

		for (let item = missing.pop(); item; item = missing.pop()) {
			const rendered: TTreeRenderItem = {
				kind: 'item',
				key: item.uid,
				item,
				row: item === entry.item,
				children: [],
			}

			registered.set(item, rendered)
			group.push(rendered)
			group = rendered.children
		}
	}

	if (filler) roots.push(filler)

	return roots
}
