import {
	TCollectionItemExtension,
	TagsCollectionItemDescriptor,
	TagsItemDescriptor,
} from '@soxa-ui/setup'
import { useAdapter, useAdapterContext, useCollectionAdapter } from '../../../adapter'
import type { TCreateCollectionPreparation } from '../../../adapter/runtime/collection-preparation'
import type { TagsItemProps } from './base.component'

export function useSetupTagsItem(
	props: TagsItemProps,
	createPreparation?: TCreateCollectionPreparation,
) {
	const {
		contexts: [adapter, item],
	} = useAdapterContext((create, elevator) => {
		const adapter = create(TagsItemDescriptor(), { ctrl: props.ctrl, props })

		const item = create(
			TagsCollectionItemDescriptor(),
			{ props },
			{ bundle: adapter.bundle },
		).use(TCollectionItemExtension, { adapter, elevator })

		return [adapter, item] as const
	}, createPreparation)

	return {
		...useCollectionAdapter(useAdapter(adapter, props), item, props),
		context: item.instance.context,
	}
}
