import { collectionInitialInputs } from '@soxa-ui/setup'
import { resolveCollectionInitialPanel } from '@soxa-ui/setup'
import {
	TTabsContentBindingExtension,
	TabsCollectionContentDescriptor,
	TabsContentDescriptor,
} from '@soxa-ui/setup'
import {
	createSvelteAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
	useElevator,
	type TRootReceiver,
} from '../../../adapter'
import type { TabsContentProps } from './base.component'

export function setupTabsContent(
	getProps: () => TabsContentProps,
	mountId: string,
	receive: TRootReceiver,
) {
	const elevator = useElevator()
	const props = getProps()
	const adapter = createSvelteAdapterContext(TabsContentDescriptor(), {
		...resolveCollectionInitialPanel(
			TabsContentDescriptor(),
			{ ctrl: props.ctrl, props, mountId },
			elevator,
		),
		mountId,
	})

	const content = createSvelteAdapterContext(
		TabsCollectionContentDescriptor(),
		{ props: collectionInitialInputs(adapter, props), mountId },
		{ bundle: adapter.bundle },
	).use(TTabsContentBindingExtension, { adapter, elevator })

	const itemBinding = useCollectionAdapter(content, getProps)
	const owner = useAdapter(adapter, getProps, receive)

	return joinBindings(owner, itemBinding)
}
