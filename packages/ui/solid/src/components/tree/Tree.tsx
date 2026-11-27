import type { Accessor, JSX } from 'solid-js'
import type { TTreeRenderEntry, TTreeRenderItem } from '@soxa-ui/core'
import { Elevate, KeyedFor, Root, createRootProps, resolveSlot, roleIcon } from '../../adapter'
import { Show } from '../../adapter/runtime/flow'
import { Icon } from '../icon'
import { ItemRow } from '../item-row'
import { setupTree, setupTreeRow } from './setup.component'
import type { TreeProps, TreeRowProps } from './base.component'

const CHECK = roleIcon('check')

function TreeRow(props: TreeRowProps): JSX.Element {
	const binding = setupTreeRow({
		get ctrl() {
			return props.ctrl
		},
	})
	const state = binding.state
	const branch = () => state.aria?.['aria-expanded'] !== undefined
	const expanded = () => state.aria?.['aria-expanded'] === 'true'
	const scope = () => ({
		item: props.ctrl,
		branch: branch(),
		expanded: expanded(),
		loading: state.aria?.['aria-busy'] === 'true',
	})
	const link = () => (branch() ? undefined : state.href)
	const root = createRootProps(() => ({
		state,
		sets: [state.attrs, state.aria, state.dataset, { href: link() ?? null }],
		forward: {},
	}))
	const indicatorSide = () => state.dataset?.['data-indicator']
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

function itemOf(entry: TTreeRenderEntry): TTreeRenderItem | undefined {
	return entry.kind === 'item' ? entry : undefined
}

function fillerStyle(entry: TTreeRenderEntry): JSX.CSSProperties | undefined {
	return entry.kind === 'filler' ? entry.style : undefined
}

export function Tree(props: TreeProps): JSX.Element {
	const binding = setupTree(props)
	const state = binding.state
	const root = createRootProps(() => ({
		state,
		sets: [state.attrs, state.aria, state.dataset],
		forward: binding.forwardProps(),
	}))
	const empty = resolveSlot(
		() => props.empty,
		() => ({}),
	)

	const drawEntry = (entry: Accessor<TTreeRenderEntry>) => (
		<Show
			when={itemOf(entry())}
			fallback={
				<div class="so-tree__filler" aria-hidden="true" style={fillerStyle(entry())} />
			}
		>
			{(item) => (
				<TreeRow ctrl={item().item} entry={item()} slots={props}>
					<KeyedFor each={item().children} by={(child) => child.key}>
						{drawEntry}
					</KeyedFor>
				</TreeRow>
			)}
		</Show>
	)

	return (
		<Show when={state.rendered}>
			<Root tag={state.tag} attributes={root} ref={binding.ref}>
				<Elevate layer={binding.layer}>
					<Show when={state.layout?.length} fallback={empty()}>
						<KeyedFor each={state.layout} by={(entry) => entry.key}>
							{drawEntry}
						</KeyedFor>
					</Show>
				</Elevate>
			</Root>
		</Show>
	)
}
