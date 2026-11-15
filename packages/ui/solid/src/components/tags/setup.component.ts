import { collectionInitialOwnerOptions } from '@soxa-ui/setup'
import { TCollectionInitialExtension } from '@soxa-ui/setup'
import { useCollectionInitial } from '../../adapter'
import { TCollectionExtension, TagsCollectionDescriptor, TagsDescriptor } from '@soxa-ui/setup'
import {
	createSolidAdapterContext,
	useAdapter,
	joinBindings,
	useCollectionAdapter,
	useElevator,
} from '../../adapter'
import type { TagsProps } from './base.component'

export function setupTags(props: TagsProps) {
	const source = useCollectionInitial(props)
	const { elevator, layer } = useElevator()
	const adapter = createSolidAdapterContext(
		TagsDescriptor(),
		collectionInitialOwnerOptions(TagsDescriptor(), { ctrl: props.ctrl, props }, source),
	)

	const collectionAdapter = createSolidAdapterContext(
		TagsCollectionDescriptor(),
		{
			props,
			options: { owner: adapter.instance, engine: source?.engine ?? props.engine },
		},
		{ bundle: adapter.bundle },
	)
		.use(TCollectionExtension, { elevator })
		.use(TCollectionInitialExtension, { source, elevator })

	const collectionBinding = useCollectionAdapter(collectionAdapter, props)
	const owner = useAdapter(adapter, props)

	return { ...joinBindings(owner, collectionBinding), layer }
}
