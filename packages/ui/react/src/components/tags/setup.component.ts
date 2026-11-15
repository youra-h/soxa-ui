import { collectionInitialOwnerOptions } from '@soxa-ui/setup'
import { TCollectionInitialExtension } from '@soxa-ui/setup'
import { useCollectionInitial } from '../../adapter'
import { TCollectionExtension, TagsCollectionDescriptor, TagsDescriptor } from '@soxa-ui/setup'
import { useAdapter, useAdapterContext, useCollectionAdapter } from '../../adapter'
import type { TagsProps } from './base.component'

export function useSetupTags(props: TagsProps) {
	const source = useCollectionInitial(props)
	const {
		contexts: [adapter, collectionAdapter],
		layer,
	} = useAdapterContext((create, elevator) => {
		const adapter = create(
			TagsDescriptor(),
			collectionInitialOwnerOptions(TagsDescriptor(), { ctrl: props.ctrl, props }, source),
		)

		const collectionAdapter = create(
			TagsCollectionDescriptor(),
			{
				props,
				options: { owner: adapter.instance, engine: source?.engine ?? props.engine },
			},
			{ bundle: adapter.bundle },
		)
			.use(TCollectionExtension, { elevator })
			.use(TCollectionInitialExtension, { source, elevator })

		return [adapter, collectionAdapter] as const
	})

	return {
		...useCollectionAdapter(useAdapter(adapter, props), collectionAdapter, props),
		layer,
	}
}
