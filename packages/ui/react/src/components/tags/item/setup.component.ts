import { collectionInitialInputs } from '@soxa-ui/setup'
import { resolveCollectionInitialItem } from '@soxa-ui/setup'
import {
	TCollectionItemExtension,
	TagsCollectionItemDescriptor,
	TagsItemDescriptor,
} from '@soxa-ui/setup'
import { useAdapter, useAdapterContext, useCollectionAdapter } from '../../../adapter'
import type { TagsItemProps } from './base.component'

export function useSetupTagsItem(props: TagsItemProps) {
	const {
		contexts: [adapter, item],
	} = useAdapterContext((create, elevator) => {
		const adapter = create(
			TagsItemDescriptor(),
			resolveCollectionInitialItem(
				TagsItemDescriptor(),
				{ ctrl: props.ctrl, props },
				elevator,
			),
		)

		const item = create(
			TagsCollectionItemDescriptor(),
			{ props: collectionInitialInputs(adapter, props) },
			{ bundle: adapter.bundle },
		).use(TCollectionItemExtension, { adapter, elevator })

		return [adapter, item] as const
	})

	return {
		...useCollectionAdapter(useAdapter(adapter, props), item, props),
		context: item.instance.context,
	}
}
