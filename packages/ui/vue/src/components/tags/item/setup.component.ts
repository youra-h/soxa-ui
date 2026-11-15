import { collectionInitialInputs } from '@soxa-ui/setup'
import { initialAssemblyProps } from '../../../adapter'
import { resolveCollectionInitialItem } from '@soxa-ui/setup'
import {
	TCollectionItemExtension,
	TagsItemDescriptor,
	TagsCollectionItemDescriptor,
} from '@soxa-ui/setup'
import {
	useAdapter,
	extendBinding,
	joinBindings,
	useCollectionAdapter,
	useExpose,
	VueElevatorFactory,
	roleIcon,
	useSplitAttrs,
	createVueAdapterContext,
	type SetupContext,
} from '../../../adapter'
import BaseTagsItem, { type TagsItemProps } from './base.component'

export default {
	name: '_TagsItem',
	inheritAttrs: false,
	extends: BaseTagsItem,
	expose: useExpose(),
	setup(props: TagsItemProps, { emit }: SetupContext) {
		const adapter = createVueAdapterContext(
			TagsItemDescriptor(),
			resolveCollectionInitialItem(
				TagsItemDescriptor(),
				{ ctrl: initialAssemblyProps(props).ctrl, props: initialAssemblyProps(props) },
				VueElevatorFactory,
			),
		)

		const itemAdapter = createVueAdapterContext(
			TagsCollectionItemDescriptor(),
			{ props: collectionInitialInputs(adapter, props) },
			{ bundle: adapter.bundle },
		).use(TCollectionItemExtension, { adapter, elevator: VueElevatorFactory })

		const itemBinding = useCollectionAdapter(itemAdapter, props, emit)
		const ownerBinding = useAdapter(adapter, props, emit)

		return extendBinding(joinBindings(ownerBinding, itemBinding), {
			context: itemAdapter.instance.context,
			closeIconTag: roleIcon('close'),
			...useSplitAttrs(),
		})
	},
}
