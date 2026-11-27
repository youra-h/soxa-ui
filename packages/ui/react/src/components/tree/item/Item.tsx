import type { ElementType } from 'react'
import {
	renderSlot,
	roleIcon,
	toAriaProps,
	toRootProps,
	withRenderBoundary,
} from '../../../adapter'
import { Icon } from '../../icon'
import { ItemRow } from '../../item-row'
import type { TreeItemProps } from './base.component'
import { useSetupTreeItem } from './setup.component'

const CHECK = roleIcon('check')

/** Renders one layout node and owns the adapter boundary for that item. */
export const TreeItem = withRenderBoundary(function TreeItem({
	ctrl,
	entry,
	slots,
	children,
}: TreeItemProps) {
	const { ref, state } = useSetupTreeItem({ ctrl })
	const {
		aria,
		dataset,
		attrs,
		href,
		size,
		variant,
		tag,
		text,
		selected,
		branch = false,
		expanded = false,
		loading = false,
		indicator,
	} = state
	const link = branch ? undefined : href
	const Tag = (link ? 'a' : tag) as ElementType
	const scope = { item: ctrl, branch, expanded, loading }
	const selectionMark =
		indicator === 'start' || indicator === 'end' ? (
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
					trailing={indicator === 'end' ? selectionMark : null}
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
							{indicator === 'start' ? selectionMark : null}
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
