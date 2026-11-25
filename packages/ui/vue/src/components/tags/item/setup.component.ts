import {
	TCollectionItemExtension,
	TagsItemDescriptor,
	TagsCollectionItemDescriptor,
} from '@soxa-ui/setup'
import {
	createVueAdapterContext,
	useAdapter,
	extendBinding,
	joinBindings,
	useCollectionAdapter,
	useExpose,
	VueElevatorFactory,
	roleIcon,
	useSplitAttrs,
	type SetupContext,
} from '../../../adapter'
import BaseTagsItem, { type TagsItemProps } from './base.component'

export function setupTagsItem(
	props: TagsItemProps,
	{ emit }: SetupContext,
	create = createVueAdapterContext,
) {
	const adapter = create(TagsItemDescriptor(), { ctrl: props.ctrl, props })

	const itemAdapter = create(
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
}

export default {
	name: '_TagsItem',
	inheritAttrs: false,
	extends: BaseTagsItem,
	expose: useExpose(),
	setup: setupTagsItem,
}
