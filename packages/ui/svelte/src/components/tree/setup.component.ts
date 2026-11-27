import {
	TCollectionExtension,
	TCollectionItemExtension,
	TVirtualCollectionExtension,
	TreeCollectionDescriptor,
	TreeDescriptor,
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
} from '../../adapter'
import type { TreeProps } from './base.component'

export function setupTree(getProps: () => TreeProps, mountId: string, receive: TRootReceiver) {
	const elevator = useElevator()
	const props = getProps()
	const adapter = createSvelteAdapterContext(TreeDescriptor(), {
		ctrl: props.ctrl,
		props,
		mountId,
	})
	const collectionAdapter = createSvelteAdapterContext(
		TreeCollectionDescriptor(),
		{ props, mountId, options: { owner: adapter.instance, engine: props.engine } },
		{ bundle: adapter.bundle },
	)
		.use(TCollectionExtension, { elevator })
		.use(TVirtualCollectionExtension, { elevator })

	const facade = useCollectionAdapter(collectionAdapter, getProps)

	return joinBindings(useAdapter(adapter, getProps, receive), facade)
}

export function setupTreeRow(
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
