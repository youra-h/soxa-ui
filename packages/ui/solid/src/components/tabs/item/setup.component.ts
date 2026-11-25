import {
	TCollectionItemExtension,
	TabsCollectionItemDescriptor,
	TabsItemDescriptor,
} from '@soxa-ui/setup'
import { useAdapter, joinBindings, useCollectionAdapter, useElevator } from '../../../adapter'
import { createSolidPreparedAdapterContext } from '../../../adapter/common/collection-preparation'
import type { TabsItemProps } from './base.component'

export function setupTabsItem(props: TabsItemProps) {
	const { elevator } = useElevator()
	const adapter = createSolidPreparedAdapterContext(TabsItemDescriptor(), {
		ctrl: props.ctrl,
		props,
	})

	const item = createSolidPreparedAdapterContext(
		TabsCollectionItemDescriptor(),
		{ props },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator })

	const itemBinding = useCollectionAdapter(item, props)
	const owner = useAdapter(adapter, props)

	return { ...joinBindings(owner, itemBinding), context: item.instance.context }
}
