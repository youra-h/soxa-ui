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
		const adapter = createVueAdapterContext(TagsItemDescriptor(), { ctrl: props.ctrl, props })

		const itemAdapter = createVueAdapterContext(
			TagsCollectionItemDescriptor(),
			{ props },
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
