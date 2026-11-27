import {
	TCollectionItemExtension,
	TreeItemCollectionDescriptor,
	TreeItemDescriptor,
} from '@soxa-ui/setup'
import {
	createSolidAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
	useElevator,
} from '../../../adapter'
import type { TreeItemProps } from './base.component'

export function setupTreeItem(props: Pick<TreeItemProps, 'ctrl'>) {
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
