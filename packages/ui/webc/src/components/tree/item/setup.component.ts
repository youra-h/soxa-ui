import {
	TCollectionItemExtension,
	TreeItemCollectionDescriptor,
	TreeItemDescriptor,
} from '@soxa-ui/setup'
import type { TTreeItem, TTreeItemCollectionFacade } from '@soxa-ui/core'
import {
	createWebcAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
} from '../../../adapter'
import type { TBinding, TUpdateListener } from '../../../adapter'
import { createWebcElevator } from '../../../adapter/elevator'

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
