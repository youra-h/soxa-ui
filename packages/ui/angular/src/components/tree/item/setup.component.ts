import {
	TCollectionItemExtension,
	TreeItemCollectionDescriptor,
	TreeItemDescriptor,
} from '@soxa-ui/setup'
import type { TTreeItem, TTreeItemCollectionFacade } from '@soxa-ui/core'
import {
	AngularElevatorFactory,
	createAngularAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
	type TBinding,
} from '../../../adapter'

export function setupTreeItem(
	ctrl: TTreeItem | undefined,
	props: object,
): TBinding<TTreeItem, TTreeItemCollectionFacade> {
	const adapter = createAngularAdapterContext(TreeItemDescriptor(), { ctrl, props })
	const owner = useAdapter(adapter)
	const item = createAngularAdapterContext(
		TreeItemCollectionDescriptor(),
		{ props },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator: AngularElevatorFactory })

	return joinBindings(owner, useCollectionAdapter(item))
}
