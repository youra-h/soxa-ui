import {
	TTabsContentBindingExtension,
	TabsCollectionContentDescriptor,
	TabsContentDescriptor,
} from '@soxa-ui/setup'
import {
	joinBindings,
	useAdapter,
	useCollectionAdapter,
	useElevator,
	type TRootReceiver,
} from '../../../adapter'
import { createSveltePreparedAdapterContext } from '../../../adapter/common/collection-preparation'
import type { TabsContentProps } from './base.component'

export function setupTabsContent(
	getProps: () => TabsContentProps,
	mountId: string,
	receive: TRootReceiver,
) {
	const elevator = useElevator()
	const props = getProps()
	const adapter = createSveltePreparedAdapterContext(TabsContentDescriptor(), {
		ctrl: props.ctrl,
		props,
		mountId,
	})

	const content = createSveltePreparedAdapterContext(
		TabsCollectionContentDescriptor(),
		{ props, mountId },
		{ bundle: adapter.bundle },
	).use(TTabsContentBindingExtension, { adapter, elevator })

	const itemBinding = useCollectionAdapter(content, getProps)
	const owner = useAdapter(adapter, getProps, receive)

	return joinBindings(owner, itemBinding)
}
