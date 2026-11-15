import { collectionInitialOwnerOptions } from '@soxa-ui/setup'
import { TCollectionInitialExtension } from '@soxa-ui/setup'
import { useCollectionInitial } from '../../adapter'
import {
	TCollectionExtension,
	TDragAndDropCollectionExtension,
	TabsCollectionDescriptor,
	TabsDescriptor,
} from '@soxa-ui/setup'
import {
	createSvelteAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
	useElevator,
	type TRootReceiver,
} from '../../adapter'
import type { TabsProps } from './base.component'

export function setupTabs(getProps: () => TabsProps, mountId: string, receive: TRootReceiver) {
	const elevator = useElevator()
	const props = getProps()
	const source = useCollectionInitial(props, '')
	const adapter = createSvelteAdapterContext(TabsDescriptor(), {
		...collectionInitialOwnerOptions(
			TabsDescriptor(),
			{ ctrl: props.ctrl, props, mountId },
			source,
		),
		mountId,
	})

	const collectionAdapter = createSvelteAdapterContext(
		TabsCollectionDescriptor(),
		{
			props,
			mountId,
			options: { owner: adapter.instance, engine: source?.engine ?? props.engine },
		},
		{ bundle: adapter.bundle },
	)
		.use(TCollectionExtension, { elevator })
		.use(TCollectionInitialExtension, { source, elevator })
		.use(TDragAndDropCollectionExtension, { elevator })

	const collectionBinding = useCollectionAdapter(collectionAdapter, getProps)
	const owner = useAdapter(adapter, getProps, receive)

	return joinBindings(owner, collectionBinding)
}
