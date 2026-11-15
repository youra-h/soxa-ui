import { collectionInitialInputs } from '@soxa-ui/setup'
import { resolveCollectionInitialItem } from '@soxa-ui/setup'
import {
	TCollectionItemExtension,
	TabsCollectionItemDescriptor,
	TabsItemDescriptor,
} from '@soxa-ui/setup'
import {
	createSolidAdapterContext,
	useAdapter,
	joinBindings,
	useCollectionAdapter,
	useElevator,
} from '../../../adapter'
import type { TabsItemProps } from './base.component'

export function setupTabsItem(props: TabsItemProps) {
	const { elevator } = useElevator()
	const adapter = createSolidAdapterContext(
		TabsItemDescriptor(),
		resolveCollectionInitialItem(TabsItemDescriptor(), { ctrl: props.ctrl, props }, elevator),
	)

	const item = createSolidAdapterContext(
		TabsCollectionItemDescriptor(),
		{ props: collectionInitialInputs(adapter, props) },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator })

	const itemBinding = useCollectionAdapter(item, props)
	const owner = useAdapter(adapter, props)

	return { ...joinBindings(owner, itemBinding), context: item.instance.context }
}
