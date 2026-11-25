import type { createSolidAdapterContext } from '../../adapter'
import type { Component, JSX } from 'solid-js'
import { Elevate, ResolvedSlot, createRootProps, relaySlot, renderSlot } from '../../adapter'
import { For, Show } from '../../adapter/runtime/flow'
import type { TagsItemProps } from './item/base.component'
import { setupTags } from './setup.component'
import type { TagsProps } from './base.component'

/**
 * The default slot can lay out the shown tags. Each item gets one view in the collection.
 */
export function createTags(
	Item: Component<TagsItemProps>,
	create?: typeof createSolidAdapterContext,
) {
	return function Tags(props: TagsProps): JSX.Element {
		const binding = setupTags(props, create)
		const state = binding.state
		const root = createRootProps(() => ({
			state,
			sets: [state.attrs, state.aria, state.dataset],
			forward: binding.forwardProps(),
		}))

		return (
			<Show when={state.rendered}>
				<div {...root()} ref={binding.ref}>
					<Elevate layer={binding.layer}>
						<ResolvedSlot
							content={props.children}
							scope={() => ({ shown: state.shown ?? [] })}
							fallback={
								<For each={state.shown}>
									{(item) => (
										<Item
											ctrl={item}
											leading={renderSlot(props['item-leading'], { item })}
											trailing={renderSlot(props['item-trailing'], { item })}
											close-icon={renderSlot(props['item-close-icon'], {
												item,
											})}
										>
											{relaySlot(props.item, { item })}
										</Item>
									)}
								</For>
							}
						/>
					</Elevate>
				</div>
			</Show>
		)
	}
}
