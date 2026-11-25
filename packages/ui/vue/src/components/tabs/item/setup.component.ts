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
	type SetupContext,
} from '../../../adapter'
import { createVuePreparedAdapterContext } from '../../../adapter/common/collection-preparation'
import BaseTabsItem, { type TabsItemProps } from './base.component'

export default {
	name: '_TabsItem',
	inheritAttrs: false,
	extends: BaseTabsItem,
	expose: useExpose(),
	setup(props: TabsItemProps, { emit }: SetupContext) {
		const adapter = createVuePreparedAdapterContext(TabsItemDescriptor(), {
			ctrl: props.ctrl,
			props,
		})

		const itemAdapter = createVuePreparedAdapterContext(
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
