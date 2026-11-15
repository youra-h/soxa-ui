import { collectionInitialInputs } from '@soxa-ui/setup'
import { initialAssemblyProps } from '../../../adapter'
import { resolveCollectionInitialItem } from '@soxa-ui/setup'
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
		const adapter = createVueAdapterContext(
			TabsItemDescriptor(),
			resolveCollectionInitialItem(
				TabsItemDescriptor(),
				{ ctrl: initialAssemblyProps(props).ctrl, props: initialAssemblyProps(props) },
				VueElevatorFactory,
			),
		)

		const itemAdapter = createVueAdapterContext(
			TabsCollectionItemDescriptor(),
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
