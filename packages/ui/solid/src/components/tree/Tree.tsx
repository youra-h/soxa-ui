import type { Accessor, JSX } from 'solid-js'
import type { TTreeRenderEntry, TTreeRenderItem } from '@soxa-ui/core'
import { Elevate, KeyedFor, Root, createRootProps, resolveSlot } from '../../adapter'
import { Show } from '../../adapter/runtime/flow'
import { TreeItem } from './item'
import { setupTree } from './setup.component'
import type { TreeProps } from './base.component'

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
				<TreeItem ctrl={item().item} entry={item()} slots={props}>
					<KeyedFor each={item().children} by={(child) => child.key}>
						{drawEntry}
					</KeyedFor>
				</TreeItem>
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
