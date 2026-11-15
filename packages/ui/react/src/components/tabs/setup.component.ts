import { collectionInitialOwnerOptions } from '@soxa-ui/setup'
import { TCollectionInitialExtension } from '@soxa-ui/setup'
import { useCollectionInitial } from '../../adapter'
import {
	TCollectionExtension,
	TDragAndDropCollectionExtension,
	TabsCollectionDescriptor,
	TabsDescriptor,
} from '@soxa-ui/setup'
import { useAdapter, useAdapterContext, useCollectionAdapter } from '../../adapter'
import type { TabsProps } from './base.component'

export function useSetupTabs(props: TabsProps) {
	const source = useCollectionInitial(props, '')
	const {
		contexts: [adapter, collectionAdapter],
		layer,
	} = useAdapterContext((create, elevator) => {
		const adapter = create(
			TabsDescriptor(),
			collectionInitialOwnerOptions(TabsDescriptor(), { ctrl: props.ctrl, props }, source),
		)

		const collectionAdapter = create(
			TabsCollectionDescriptor(),
			{
				props,
				options: { owner: adapter.instance, engine: source?.engine ?? props.engine },
			},
			{ bundle: adapter.bundle },
		)
			.use(TCollectionExtension, { elevator })
			.use(TCollectionInitialExtension, { source, elevator })
			.use(TDragAndDropCollectionExtension, { elevator })

		return [adapter, collectionAdapter] as const
	})

	return {
		...useCollectionAdapter(useAdapter(adapter, props), collectionAdapter, props),
		layer,
	}
}
