import {
	TCollectionExtension,
	TCollectionItemExtension,
	TVirtualCollectionExtension,
	TreeCollectionDescriptor,
	TreeDescriptor,
	TreeItemCollectionDescriptor,
	TreeItemDescriptor,
} from '@soxa-ui/setup'
import type {
	TTree,
	TTreeCollectionFacade,
	TTreeItem,
	TTreeItemCollectionFacade,
} from '@soxa-ui/core'
import {
	createWebcAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
} from '../../adapter'
import type { TBinding, TUpdateListener } from '../../adapter'
import { createWebcElevator } from '../../adapter/elevator'

export function setupTree(
	host: HTMLElement,
	ctrl: TTree | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<TTree, TTreeCollectionFacade> {
	const adapter = createWebcAdapterContext(host, TreeDescriptor(), { ctrl, props })
	const elevator = createWebcElevator(host)
	const collectionAdapter = createWebcAdapterContext(
		host,
		TreeCollectionDescriptor(),
		{ props, options: { owner: adapter.instance, engine: props['engine'] } },
		{ bundle: adapter.bundle },
	)
		.use(TCollectionExtension, { elevator })
		.use(TVirtualCollectionExtension, { elevator })
	const facade = useCollectionAdapter(collectionAdapter, host, onUpdate)

	return joinBindings(useAdapter(adapter, host, onUpdate), facade)
}

export function setupTreeItem(
	host: HTMLElement,
	ctrl: TTreeItem | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<TTreeItem, TTreeItemCollectionFacade> {
	const adapter = createWebcAdapterContext(host, TreeItemDescriptor(), { ctrl, props })
	const item = createWebcAdapterContext(
		host,
		TreeItemCollectionDescriptor(),
		{ props },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator: createWebcElevator(host) })
	const facade = useCollectionAdapter(item, host, onUpdate)

	return joinBindings(useAdapter(adapter, host, onUpdate), facade)
}
