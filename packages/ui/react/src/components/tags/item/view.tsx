import type { ElementType, ReactElement } from 'react'
import {
	renderSlot,
	roleIcon,
	toAriaProps,
	toControlAttrs,
	toRootForward,
	toRootProps,
	useClickAction,
	withRenderBoundary,
} from '../../../adapter'
import { Button } from '../../button'
import { ItemRow } from '../../item-row'
import { Icon } from '../../icon'
import type { TCreateCollectionPreparation } from '../../../adapter/runtime/collection-preparation'
import { useSetupTagsItem } from './setup.component'
import type { TagsItemAttributes, TagsItemProps } from './base.component'

/** Resolve the default close icon by role. */
const CloseIcon = roleIcon('close')

/**
 * Keep the close button beside the selectable row so its label stays outside the option name.
 */
export function createTagsItem(createPreparation?: TCreateCollectionPreparation) {
	return withRenderBoundary(function TagsItem(props: TagsItemProps): ReactElement | null {
		const { ref, forwardProps, state, context } = useSetupTagsItem(props, createPreparation)
		const close = useClickAction((event) => {
			// Stopped at the cross: the roots of the tag and the set and the Select field would
			// take the click as theirs
			event.stopPropagation()
			context?.adapters.tags.close()
		})

		const {
			rendered,
			tag,
			text,
			direction,
			disabled,
			size,
			variant,
			selected,
			tag_closable,
			closeAria,
			rootAria,
			aria,
			dataset,
			attrs,
		} = state

		if (!rendered) return null

		const Tag = tag as ElementType

		return (
			<Tag
				{...toRootProps(
					ref,
					state,
					[rootAria, dataset, attrs],
					toRootForward(forwardProps),
				)}
			>
				<ItemRow
					embedded="tags.row"
					tag="div"
					direction={direction}
					disabled={disabled}
					size={size}
					variant={variant}
					{...toAriaProps(aria)}
					{...toControlAttrs<TagsItemAttributes>(forwardProps)}
					// The action plugin suppresses presses on disabled tags.
					onActionPress={() => context?.adapters.selection.toggle()}
					leading={renderSlot(props.leading)}
					trailing={renderSlot(props.trailing)}
				>
					{renderSlot(props.children, {
						text: text ?? '',
						selected: selected ?? false,
					}) ?? text}
				</ItemRow>
				{tag_closable === true ? (
					<Button
						embedded="tags.close"
						type="button"
						className="so-tags-item__close"
						disabled={disabled}
						size={size}
						{...toAriaProps(closeAria)}
						ref={close}
					>
						{renderSlot(props['close-icon']) ?? (
							<Icon embedded="tags.close-icon" tag={CloseIcon} size={size} />
						)}
					</Button>
				) : null}
			</Tag>
		)
	})
}
