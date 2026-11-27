import {
	TCollectionItemExtension,
	TreeItemCollectionDescriptor,
	TreeItemDescriptor,
} from '@soxa-ui/setup'
import { LIST_INDICATOR_ATTRIBUTE } from '@soxa-ui/core'
import {
	createVueAdapterContext,
	extendBinding,
	joinBindings,
	roleIcon,
	useAdapter,
	useCollectionAdapter,
	useExpose,
	VueElevatorFactory,
	type SetupContext,
} from '../../../adapter'
import BaseTreeItem, { type TreeItemProps } from './base.component'

export default {
	name: 'TreeItem',
	extends: BaseTreeItem,
	expose: useExpose(),
	setup(props: TreeItemProps, { emit }: SetupContext) {
		const adapter = createVueAdapterContext(TreeItemDescriptor(), { ctrl: props.ctrl, props })
		// Bind the item facade to the same bundle and mounted element as the item model.
		const collectionAdapter = createVueAdapterContext(
			TreeItemCollectionDescriptor(),
			{ props },
			{ bundle: adapter.bundle },
		).use(TCollectionItemExtension, { adapter, elevator: VueElevatorFactory })

		const collectionBinding = useCollectionAdapter(collectionAdapter, props, emit)
		const itemBinding = useAdapter(adapter, props, emit)

		return extendBinding(joinBindings(itemBinding, collectionBinding), {
			itemProps: props,
			selectionIconTag: roleIcon('check'),
			selectionIndicatorAttribute: `data-${LIST_INDICATOR_ATTRIBUTE}`,
		})
	},
}
