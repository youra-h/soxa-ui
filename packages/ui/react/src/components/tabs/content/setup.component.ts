import { collectionInitialInputs } from '@soxa-ui/setup'
import { resolveCollectionInitialPanel } from '@soxa-ui/setup'
import {
	TTabsContentBindingExtension,
	TabsCollectionContentDescriptor,
	TabsContentDescriptor,
} from '@soxa-ui/setup'
import { useAdapter, useAdapterContext, useCollectionAdapter } from '../../../adapter'
import type { TabsContentProps } from './base.component'

export function useSetupTabsContent(props: TabsContentProps) {
	const {
		contexts: [adapter, content],
	} = useAdapterContext((create, elevator) => {
		const adapter = create(
			TabsContentDescriptor(),
			resolveCollectionInitialPanel(
				TabsContentDescriptor(),
				{ ctrl: props.ctrl, props },
				elevator,
			),
		)

		const content = create(
			TabsCollectionContentDescriptor(),
			{ props: collectionInitialInputs(adapter, props) },
			{ bundle: adapter.bundle },
		).use(TTabsContentBindingExtension, { adapter, elevator })

		return [adapter, content] as const
	})

	return useCollectionAdapter(useAdapter(adapter, props), content, props)
}
