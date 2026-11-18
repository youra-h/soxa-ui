import {
	TCollectionItemExtension,
	TabsItemDescriptor,
	TabsCollectionItemDescriptor,
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
import BaseTabsItem, { type TabsItemProps } from './base.component'

export default {
	name: '_TabsItem',
	inheritAttrs: false,
	extends: BaseTabsItem,
	expose: useExpose(),
	setup(props: TabsItemProps, { emit }: SetupContext) {
		const adapter = createVueAdapterContext(TabsItemDescriptor(), { ctrl: props.ctrl, props })

		const itemAdapter = createVueAdapterContext(
			TabsCollectionItemDescriptor(),
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
