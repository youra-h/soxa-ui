import { TCollectionExtension, TagsCollectionDescriptor, TagsDescriptor } from '@soxa-ui/setup'
import {
	createSolidAdapterContext,
	useAdapter,
	joinBindings,
	useCollectionAdapter,
	useElevator,
} from '../../adapter'
import type { TagsProps } from './base.component'

export function setupTags(props: TagsProps, create = createSolidAdapterContext) {
	const { elevator, layer } = useElevator()
	const adapter = create(TagsDescriptor(), { ctrl: props.ctrl, props })

	const collectionAdapter = create(
		TagsCollectionDescriptor(),
		{
			props,
			options: { owner: adapter.instance, engine: props.engine },
		},
		{ bundle: adapter.bundle },
	).use(TCollectionExtension, { elevator })

	const collectionBinding = useCollectionAdapter(collectionAdapter, props)
	const owner = useAdapter(adapter, props)

	return { ...joinBindings(owner, collectionBinding), layer }
}
