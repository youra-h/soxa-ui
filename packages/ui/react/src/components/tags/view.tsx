import type { ComponentType, ReactElement } from 'react'
import { Elevate, hasSlot, relaySlot, renderSlot, toRootProps } from '../../adapter'
import type { TCreateCollectionPreparation } from '../../adapter/runtime/collection-preparation'
import type { TagsItemProps } from './item/base.component'
import { useSetupTags } from './setup.component'
import type { TagsProps } from './base.component'

/**
 * Renders the shown tags in the row, with an optional consumer layout.
 */
export function createTags(
	Item: ComponentType<TagsItemProps>,
	createPreparation?: TCreateCollectionPreparation,
) {
	return function Tags(props: TagsProps): ReactElement | null {
		const { ref, forwardProps, state, layer } = useSetupTags(props, createPreparation)

		const { rendered, shown, attrs, aria, dataset } = state

		if (!rendered) return null

		return (
			<div {...toRootProps(ref, state, [attrs, aria, dataset], forwardProps)}>
				<Elevate layer={layer}>
					{hasSlot(props.children)
						? renderSlot(props.children, { shown: shown ?? [] })
						: shown?.map((item) => (
								<Item
									key={item.uid}
									ctrl={item}
									leading={renderSlot(props['item-leading'], { item })}
									trailing={renderSlot(props['item-trailing'], { item })}
									close-icon={renderSlot(props['item-close-icon'], { item })}
								>
									{relaySlot(props.item, { item })}
								</Item>
							))}
				</Elevate>
			</div>
		)
	}
}
