import type { ElementType, ReactElement } from 'react'
import type { TTreeRenderEntry } from '@soxa-ui/core'
import { Elevate, renderSlot, toReactStyle, toRootProps } from '../../adapter'
import { TreeItem } from './item'
import type { TreeItemProps } from './item'
import { useSetupTree } from './setup.component'
import type { TreeProps } from './base.component'

function drawEntry(entry: TTreeRenderEntry, slots: TreeItemProps['slots']): ReactElement {
	if (entry.kind === 'filler') {
		return (
			<div
				key={entry.key}
				className="so-tree__filler"
				aria-hidden="true"
				style={toReactStyle(entry.style)}
			/>
		)
	}

	return (
		<TreeItem key={entry.key} ctrl={entry.item} entry={entry} slots={slots}>
			{entry.children.map((child) => drawEntry(child, slots))}
		</TreeItem>
	)
}

export function Tree(props: TreeProps): ReactElement | null {
	const { ref, state, forwardProps, layer } = useSetupTree(props)
	const { rendered, tag, layout, attrs, aria, dataset } = state

	if (!rendered) return null

	const Tag = tag as ElementType

	return (
		<Tag {...toRootProps(ref, state, [attrs, aria, dataset], forwardProps)}>
			<Elevate layer={layer}>
				{layout?.length
					? layout.map((entry) => drawEntry(entry, props))
					: renderSlot(props.empty)}
			</Elevate>
		</Tag>
	)
}
