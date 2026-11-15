import { collectionInitialOwnerOptions } from '@soxa-ui/setup'
import { TCollectionInitialExtension } from '@soxa-ui/setup'
import { useCollectionInitial } from '../../adapter'
import { TCollectionExtension, TagsCollectionDescriptor, TagsDescriptor } from '@soxa-ui/setup'
import {
	createSvelteAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
	useElevator,
	type TRootReceiver,
} from '../../adapter'
import type { TagsProps } from './base.component'

export function setupTags(getProps: () => TagsProps, mountId: string, receive: TRootReceiver) {
	const elevator = useElevator()
	const props = getProps()
	const source = useCollectionInitial(props)
	const adapter = createSvelteAdapterContext(TagsDescriptor(), {
		...collectionInitialOwnerOptions(
			TagsDescriptor(),
			{ ctrl: props.ctrl, props, mountId },
			source,
		),
		mountId,
	})

	const collectionAdapter = createSvelteAdapterContext(
		TagsCollectionDescriptor(),
		{
			props,
			mountId,
			options: { owner: adapter.instance, engine: source?.engine ?? props.engine },
		},
		{ bundle: adapter.bundle },
	)
		.use(TCollectionExtension, { elevator })
		.use(TCollectionInitialExtension, { source, elevator })

	const collectionBinding = useCollectionAdapter(collectionAdapter, getProps)
	const owner = useAdapter(adapter, getProps, receive)

	return joinBindings(owner, collectionBinding)
}
