import {
	TCollectionItemExtension,
	TreeItemCollectionDescriptor,
	TreeItemDescriptor,
} from '@soxa-ui/setup'
import type { TTreeItem } from '@soxa-ui/core'
import {
	createSvelteAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
	useElevator,
	type TRootReceiver,
} from '../../../adapter'

export function setupTreeItem(
	getProps: () => { ctrl: TTreeItem },
	mountId: string,
	receive: TRootReceiver,
) {
	const elevator = useElevator()
	const props = getProps()
	const adapter = createSvelteAdapterContext(TreeItemDescriptor(), {
		ctrl: props.ctrl,
		props,
		mountId,
	})
	const collectionAdapter = createSvelteAdapterContext(
		TreeItemCollectionDescriptor(),
		{ props, mountId },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator })

	const facade = useCollectionAdapter(collectionAdapter, getProps)

	return joinBindings(useAdapter(adapter, getProps, receive), facade)
}
