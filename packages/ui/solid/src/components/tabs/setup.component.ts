import {
	TCollectionExtension,
	TDragAndDropCollectionExtension,
	TabsCollectionDescriptor,
	TabsDescriptor,
} from '@soxa-ui/setup'
import { useAdapter, joinBindings, useCollectionAdapter, useElevator } from '../../adapter'
import { createSolidPreparedAdapterContext } from '../../adapter/common/collection-preparation'
import type { TabsProps } from './base.component'

export function setupTabs(props: TabsProps) {
	const { elevator, layer } = useElevator()
	const adapter = createSolidPreparedAdapterContext(TabsDescriptor(), { ctrl: props.ctrl, props })

	const collectionAdapter = createSolidPreparedAdapterContext(
		TabsCollectionDescriptor(),
		{
			props,
			options: { owner: adapter.instance, engine: props.engine },
		},
		{ bundle: adapter.bundle },
	)
		.use(TCollectionExtension, { elevator })
		.use(TDragAndDropCollectionExtension, { elevator })

	const collectionBinding = useCollectionAdapter(collectionAdapter, props)
	const owner = useAdapter(adapter, props)

	return { ...joinBindings(owner, collectionBinding), layer }
}
