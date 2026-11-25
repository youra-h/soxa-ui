import {
	TCollectionItemExtension,
	TabsCollectionItemDescriptor,
	TabsItemDescriptor,
} from '@soxa-ui/setup'
import {
	joinBindings,
	useAdapter,
	useCollectionAdapter,
	useElevator,
	type TRootReceiver,
} from '../../../adapter'
import { createSveltePreparedAdapterContext } from '../../../adapter/common/collection-preparation'
import type { TabsItemProps } from './base.component'

export function setupTabsItem(
	getProps: () => TabsItemProps,
	mountId: string,
	receive: TRootReceiver,
) {
	const elevator = useElevator()
	const props = getProps()
	const adapter = createSveltePreparedAdapterContext(TabsItemDescriptor(), {
		ctrl: props.ctrl,
		props,
		mountId,
	})

	const item = createSveltePreparedAdapterContext(
		TabsCollectionItemDescriptor(),
		{ props, mountId },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator })

	const itemBinding = useCollectionAdapter(item, getProps)
	const owner = useAdapter(adapter, getProps, receive)

	return Object.assign(joinBindings(owner, itemBinding), { context: item.instance.context })
}
