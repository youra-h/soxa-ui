import type { JSX } from 'solid-js'
import { Root, createRootProps, resolveSlot, roleIcon } from '../../../adapter'
import { Show } from '../../../adapter/runtime/flow'
import { Icon } from '../../icon'
import { ItemRow } from '../../item-row'
import type { TreeItemProps } from './base.component'
import { setupTreeItem } from './setup.component'

const CHECK = roleIcon('check')

/** Binds one layout entry and reads item state through Solid accessors. */
export function TreeItem(props: TreeItemProps): JSX.Element {
	const binding = setupTreeItem({
		get ctrl() {
			return props.ctrl
		},
	})
	const state = binding.state
	const branch = () => state.branch ?? false
	const expanded = () => state.expanded ?? false
	const scope = () => ({
		item: props.ctrl,
		branch: branch(),
		expanded: expanded(),
		loading: state.loading ?? false,
	})
	const link = () => (branch() ? undefined : state.href)
	const root = createRootProps(() => ({
		state,
		sets: [state.attrs, state.aria, state.dataset, { href: link() ?? null }],
		forward: {},
	}))
	const indicatorSide = () => state.indicator
	const selectionMark = () => (
		<span class="so-tree-item__selection-indicator" aria-hidden="true">
			<Show when={state.selected}>
				<Icon embedded="tree.selection-indicator" tag={CHECK} size={state.size} />
			</Show>
		</span>
	)
	const icon = resolveSlot(() => props.slots['item-icon'], scope)
	const indicator = resolveSlot(() => props.slots['item-indicator-icon'], scope)
	const text = resolveSlot(
		() => props.slots.item,
		() => ({
			...scope(),
			text: state.text ?? '',
			selected: state.selected ?? false,
		}),
	)

	return (
		<Root tag={link() ? 'a' : state.tag} attributes={root} ref={binding.ref}>
			<Show
				when={props.entry.row}
				fallback={<span class="so-tree-item__accessible-name">{state.text}</span>}
			>
				<ItemRow
					embedded="tree.row"
					tag="div"
					class="so-tree-item__row"
					size={state.size}
					variant={state.variant}
					{...state.dataset}
					trailing={indicatorSide() === 'end' ? selectionMark() : null}
					leading={
						<>
							<span
								class={branch() ? 'so-tree-item__toggle' : 'so-tree-item__spacer'}
								aria-hidden="true"
							>
								<Show when={branch()}>
									{indicator() ?? <span class="so-tree-item__chevron" />}
								</Show>
							</span>
							{indicatorSide() === 'start' ? selectionMark() : null}
							{icon()}
						</>
					}
				>
					{text() ?? state.text}
				</ItemRow>
			</Show>
			<Show when={expanded()}>
				<div role="group" class="so-tree-item__group">
					{props.children}
				</div>
			</Show>
		</Root>
	)
}
