import {
	TCollectionExtension,
	TDragAndDropCollectionExtension,
	TabsCollectionDescriptor,
	TabsDescriptor,
} from '@soxa-ui/setup'
import {
	joinBindings,
	useAdapter,
	useCollectionAdapter,
	useElevator,
	type TRootReceiver,
} from '../../adapter'
import { createSveltePreparedAdapterContext } from '../../adapter/common/collection-preparation'
import type { TabsProps } from './base.component'

export function setupTabs(getProps: () => TabsProps, mountId: string, receive: TRootReceiver) {
	const elevator = useElevator()
	const props = getProps()

	const adapter = createSveltePreparedAdapterContext(TabsDescriptor(), {
		ctrl: props.ctrl,
		props,
		mountId,
	})

	const collectionAdapter = createSveltePreparedAdapterContext(
		TabsCollectionDescriptor(),
		{
			props,
			mountId,
			options: { owner: adapter.instance, engine: props.engine },
		},
		{ bundle: adapter.bundle },
	)
		.use(TCollectionExtension, { elevator })
		.use(TDragAndDropCollectionExtension, { elevator })

	const collectionBinding = useCollectionAdapter(collectionAdapter, getProps)
	const owner = useAdapter(adapter, getProps, receive)

	return joinBindings(owner, collectionBinding)
}
