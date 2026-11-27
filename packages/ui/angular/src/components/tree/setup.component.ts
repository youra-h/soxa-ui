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
	TTreeCollectionFacadeEngine,
	TTreeCollectionFacade,
	TTreeItem,
	TTreeItemCollectionFacade,
} from '@soxa-ui/core'
import {
	AngularElevatorFactory,
	createAngularAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
	type TBinding,
} from '../../adapter'

export function setupTree(
	ctrl: TTree | undefined,
	props: object,
	engine: TTreeCollectionFacadeEngine | undefined,
): TBinding<TTree, TTreeCollectionFacade> {
	const adapter = createAngularAdapterContext(TreeDescriptor(), { ctrl, props })
	const owner = useAdapter(adapter)
	const collectionAdapter = createAngularAdapterContext(
		TreeCollectionDescriptor(),
		{ props, options: { owner: adapter.instance, engine } },
		{ bundle: adapter.bundle },
	)
		.use(TCollectionExtension, { elevator: AngularElevatorFactory })
		.use(TVirtualCollectionExtension, { elevator: AngularElevatorFactory })

	return joinBindings(owner, useCollectionAdapter(collectionAdapter))
}

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
