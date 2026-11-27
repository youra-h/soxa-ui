import type { ElementType, ReactElement } from 'react'
import type { TTreeRenderEntry } from '@soxa-ui/core'
import {
	Elevate,
	renderSlot,
	roleIcon,
	toAriaProps,
	toReactStyle,
	toRootProps,
	withRenderBoundary,
} from '../../adapter'
import { Icon } from '../icon'
import { ItemRow } from '../item-row'
import { useSetupTree, useSetupTreeRow } from './setup.component'
import type { TreeProps, TreeRowProps } from './base.component'

const CHECK = roleIcon('check')

const TreeRow = withRenderBoundary(function TreeRow({
	ctrl,
	entry,
	slots,
	children,
}: TreeRowProps) {
	const { ref, state } = useSetupTreeRow({ ctrl })
	const { aria, dataset, attrs, href, size, variant, tag, text, selected } = state
	const branch = aria?.['aria-expanded'] !== undefined
	const expanded = aria?.['aria-expanded'] === 'true'
	const loading = aria?.['aria-busy'] === 'true'
	const link = branch ? undefined : href
	const Tag = (link ? 'a' : tag) as ElementType
	const scope = { item: ctrl, branch, expanded, loading }
	const indicatorSide = dataset?.['data-indicator']
	const selectionMark =
		indicatorSide === 'start' || indicatorSide === 'end' ? (
			<span className="so-tree-item__selection-indicator" aria-hidden="true">
				{selected && <Icon embedded="tree.selection-indicator" tag={CHECK} size={size} />}
			</span>
		) : null

	return (
		<Tag {...toRootProps(ref, state, [attrs, aria, dataset], {})} href={link}>
			{entry.row ? (
				<ItemRow
					embedded="tree.row"
					tag="div"
					className="so-tree-item__row"
					size={size}
					variant={variant}
					{...toAriaProps(dataset)}
					trailing={indicatorSide === 'end' ? selectionMark : null}
					leading={
						<>
							<span
								className={branch ? 'so-tree-item__toggle' : 'so-tree-item__spacer'}
								aria-hidden="true"
							>
								{branch &&
									(renderSlot(slots['item-indicator-icon'], scope) ?? (
										<span className="so-tree-item__chevron" />
									))}
							</span>
							{indicatorSide === 'start' ? selectionMark : null}
							{renderSlot(slots['item-icon'], scope)}
						</>
					}
				>
					{renderSlot(slots.item, {
						...scope,
						text: text ?? '',
						selected: selected ?? false,
					}) ?? text}
				</ItemRow>
			) : (
				<span className="so-tree-item__accessible-name">{text}</span>
			)}
			{expanded ? (
				<div role="group" className="so-tree-item__group">
					{children}
				</div>
			) : null}
		</Tag>
	)
})

function drawEntry(entry: TTreeRenderEntry, slots: TreeRowProps['slots']): ReactElement {
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
		<TreeRow key={entry.key} ctrl={entry.item} entry={entry} slots={slots}>
			{entry.children.map((child) => drawEntry(child, slots))}
		</TreeRow>
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
