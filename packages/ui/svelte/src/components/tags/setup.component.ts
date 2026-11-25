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

export function setupTags(
	getProps: () => TagsProps,
	mountId: string,
	receive: TRootReceiver,
	getCreate: () => typeof createSvelteAdapterContext | undefined,
) {
	const elevator = useElevator()
	const props = getProps()
	const create = getCreate() ?? createSvelteAdapterContext

	const adapter = create(TagsDescriptor(), {
		ctrl: props.ctrl,
		props,
		mountId,
	})

	const collectionAdapter = create(
		TagsCollectionDescriptor(),
		{
			props,
			mountId,
			options: { owner: adapter.instance, engine: props.engine },
		},
		{ bundle: adapter.bundle },
	).use(TCollectionExtension, { elevator })

	const collectionBinding = useCollectionAdapter(collectionAdapter, getProps)
	const owner = useAdapter(adapter, getProps, receive)

	return joinBindings(owner, collectionBinding)
}
