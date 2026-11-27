import {
	TCollectionItemExtension,
	TreeItemCollectionDescriptor,
	TreeItemDescriptor,
} from '@soxa-ui/setup'
import {
	createVueAdapterContext,
	extendBinding,
	joinBindings,
	roleIcon,
	useAdapter,
	useCollectionAdapter,
	useExpose,
	useSplitAttrs,
	VueElevatorFactory,
	type SetupContext,
} from '../../../adapter'
import BaseTreeItem, { type TreeItemProps } from './base.component'

export default {
	name: 'TreeItem',
	inheritAttrs: false,
	extends: BaseTreeItem,
	expose: useExpose(),
	setup(props: TreeItemProps, { emit }: SetupContext) {
		const adapter = createVueAdapterContext(TreeItemDescriptor(), { ctrl: props.ctrl, props })

		const itemAdapter = createVueAdapterContext(
			TreeItemCollectionDescriptor(),
			{ props },
			{ bundle: adapter.bundle },
		).use(TCollectionItemExtension, { adapter, elevator: VueElevatorFactory })

		const itemBinding = useCollectionAdapter(itemAdapter, props, emit)
		const ownerBinding = useAdapter(adapter, props, emit)

		return extendBinding(joinBindings(ownerBinding, itemBinding), {
			selectionIconTag: roleIcon('check'),
			...useSplitAttrs(),
		})
	},
}
