import {
	TCollectionItemExtension,
	TreeItemCollectionDescriptor,
	TreeItemDescriptor,
	toInstanceState,
	type TContextContract,
	type TInstanceState,
} from '@soxa-ui/setup'
import { LIST_INDICATOR_ATTRIBUTE, type TTreeItem } from '@soxa-ui/core'
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
		const itemState: Pick<
			TInstanceState<TTreeItem>,
			'attrs' | 'aria' | 'dataset'
		> = toInstanceState<TContextContract<TTreeItem>>(itemBinding)

		return extendBinding(joinBindings(itemBinding, collectionBinding), {
			itemProps: props,
			itemState,
			selectionIconTag: roleIcon('check'),
			selectionIndicatorAttribute: `data-${LIST_INDICATOR_ATTRIBUTE}`,
		})
	},
}
