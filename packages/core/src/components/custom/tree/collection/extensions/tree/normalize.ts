import type { ITreeItemPlacement, ITreeItemProps } from '../../../item.class'
import type { ITreeNode, TTreeKey } from '../../../types'

export type TTreeItemSource = ITreeItemProps & ITreeItemPlacement & { value: TTreeKey }

export function normalizeNodes(
	nodes: readonly ITreeNode[],
	parentValue: TTreeKey | null = null,
	known = new Set<TTreeKey>(),
): TTreeItemSource[] {
	const items: TTreeItemSource[] = []
	const stack = [{ nodes, parentValue, next: 0 }]

	while (stack.length) {
		const frame = stack[stack.length - 1]

		if (frame.next === frame.nodes.length) {
			stack.pop()

			continue
		}

		const siblingOrder = frame.next++
		const node = frame.nodes[siblingOrder]
		const { value, text, href, children } = node

		if (typeof value !== 'string' && (typeof value !== 'number' || !Number.isFinite(value))) {
			throw new Error('Tree node values must be strings or finite numbers')
		}

		if (known.has(value)) throw new Error(`Duplicate Tree node value: ${value}`)

		known.add(value)
		items.push({
			value,
			text,
			href,
			disabled: node.disabled ?? false,
			hasChildren: node.hasChildren ?? false,
			parentValue: frame.parentValue,
			siblingOrder,
		})

		if (children?.length) stack.push({ nodes: children, parentValue: value, next: 0 })
	}

	return items
}
