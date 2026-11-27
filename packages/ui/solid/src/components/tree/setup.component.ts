import {
	TCollectionExtension,
	TVirtualCollectionExtension,
	TreeCollectionDescriptor,
	TreeDescriptor,
} from '@soxa-ui/setup'
import {
	createSolidAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
	useElevator,
} from '../../adapter'
import type { TreeProps } from './base.component'

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
