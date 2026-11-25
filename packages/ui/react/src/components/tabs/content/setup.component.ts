import {
	TTabsContentBindingExtension,
	TabsCollectionContentDescriptor,
	TabsContentDescriptor,
} from '@soxa-ui/setup'
import { useAdapter, useAdapterContext, useCollectionAdapter } from '../../../adapter'
import { createCollectionPreparation } from '../../../adapter/runtime/collection-preparation'
import type { TabsContentProps } from './base.component'

export function useSetupTabsContent(props: TabsContentProps) {
	const {
		contexts: [adapter, content],
	} = useAdapterContext((create, elevator) => {
		const adapter = create(TabsContentDescriptor(), { ctrl: props.ctrl, props })

		const content = create(
			TabsCollectionContentDescriptor(),
			{ props },
			{ bundle: adapter.bundle },
		).use(TTabsContentBindingExtension, { adapter, elevator })

		return [adapter, content] as const
	}, createCollectionPreparation)

	return useCollectionAdapter(useAdapter(adapter, props), content, props)
}
