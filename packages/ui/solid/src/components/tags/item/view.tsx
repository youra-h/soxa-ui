import type { createSolidAdapterContext } from '../../../adapter'
import type { JSX } from 'solid-js'
import {
	Root,
	clickAction,
	createRootProps,
	renderSlot,
	resolveSlot,
	roleIcon,
	toControlAttrs,
	toRootForward,
} from '../../../adapter'
import { Show } from '../../../adapter/runtime/flow'
import { Button } from '../../button'
import { ItemRow } from '../../item-row'
import { Icon } from '../../icon'
import { setupTagsItem } from './setup.component'
import type { TagsItemAttributes, TagsItemProps } from './base.component'

/** Resolve the default close icon by role. */
const CLOSE = roleIcon('close')

/**
 * Keep the close button beside the option for accessibility. Mount its context only for
 * closable tags. The row uses the action plugin's press, which respects disabled state.
 */
export function createTagsItem(create?: typeof createSolidAdapterContext) {
	return function TagsItem(props: TagsItemProps): JSX.Element {
		const binding = setupTagsItem(props, create)
		const state = binding.state
		const context = binding.context
		const root = createRootProps(() => ({
			state,
			sets: [state.rootAria, state.dataset, state.attrs],
			forward: toRootForward(binding.forwardProps()),
		}))
		const content = resolveSlot(
			() => props.children,
			() => ({ text: state.text ?? '', selected: state.selected ?? false }),
		)
		const closeIcon = resolveSlot(
			() => props['close-icon'],
			() => ({}),
		)

		const row = () => toControlAttrs<TagsItemAttributes>(binding.forwardProps())

		function toggle(): void {
			context?.adapters.selection.toggle()
		}

		/** Stopped at the cross: the roots of the tag and the set and the Select field would take the click. */
		const close = clickAction((event) => {
			event.stopPropagation()
			context?.adapters.tags.close()
		})

		return (
			<Show when={state.rendered}>
				<Root tag={state.tag} attributes={root} ref={binding.ref}>
					<ItemRow
						embedded="tags.row"
						tag="div"
						direction={state.direction}
						disabled={state.disabled}
						size={state.size}
						variant={state.variant}
						leading={renderSlot(props.leading)}
						trailing={renderSlot(props.trailing)}
						onActionPress={toggle}
						{...state.aria}
						{...row()}
					>
						{content() ?? state.text}
					</ItemRow>
					<Show when={state.tag_closable === true}>
						<Button
							embedded="tags.close"
							type="button"
							class="so-tags-item__close"
							disabled={state.disabled}
							size={state.size}
							{...state.closeAria}
							ref={close}
						>
							{closeIcon() ?? (
								<Icon embedded="tags.close-icon" tag={CLOSE} size={state.size} />
							)}
						</Button>
					</Show>
				</Root>
			</Show>
		)
	}
}
