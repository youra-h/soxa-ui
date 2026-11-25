import {
	TTabsContentBindingExtension,
	TabsCollectionContentDescriptor,
	TabsContentDescriptor,
} from '@soxa-ui/setup'
import { useAdapter, joinBindings, useCollectionAdapter, useElevator } from '../../../adapter'
import { createSolidPreparedAdapterContext } from '../../../adapter/common/collection-preparation'
import type { TabsContentProps } from './base.component'

/** Панель таба: свой таб по `value` находит лифтом `TTabsContentBindingExtension`. */
export function setupTabsContent(props: TabsContentProps) {
	const { elevator } = useElevator()
	const adapter = createSolidPreparedAdapterContext(TabsContentDescriptor(), {
		ctrl: props.ctrl,
		props,
	})

	const content = createSolidPreparedAdapterContext(
		TabsCollectionContentDescriptor(),
		{ props },
		{ bundle: adapter.bundle },
	).use(TTabsContentBindingExtension, { adapter, elevator })

	const itemBinding = useCollectionAdapter(content, props)
	const owner = useAdapter(adapter, props)

	return joinBindings(owner, itemBinding)
}
