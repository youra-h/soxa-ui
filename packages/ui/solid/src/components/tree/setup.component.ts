import {
	TCollectionExtension,
	TCollectionItemExtension,
	TVirtualCollectionExtension,
	TreeCollectionDescriptor,
	TreeDescriptor,
	TreeItemCollectionDescriptor,
	TreeItemDescriptor,
} from '@soxa-ui/setup'
import {
	createSolidAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
	useElevator,
} from '../../adapter'
import type { TreeProps, TreeRowProps } from './base.component'

export function setupTree(props: TreeProps) {
	const { elevator, layer } = useElevator()
	const adapter = createSolidAdapterContext(TreeDescriptor(), { ctrl: props.ctrl, props })
	const collectionAdapter = createSolidAdapterContext(
		TreeCollectionDescriptor(),
		{ props, options: { owner: adapter.instance, engine: props.engine } },
		{ bundle: adapter.bundle },
	)
		.use(TCollectionExtension, { elevator })
		.use(TVirtualCollectionExtension, { elevator })

	const facade = useCollectionAdapter(collectionAdapter, props)

	return { ...joinBindings(useAdapter(adapter, props), facade), layer }
}

export function setupTreeRow(props: Pick<TreeRowProps, 'ctrl'>) {
	const { elevator } = useElevator()
	const adapter = createSolidAdapterContext(TreeItemDescriptor(), { ctrl: props.ctrl, props })
	const item = createSolidAdapterContext(
		TreeItemCollectionDescriptor(),
		{ props },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator })
	const facade = useCollectionAdapter(item, props)

	return joinBindings(useAdapter(adapter, props), facade)
}
