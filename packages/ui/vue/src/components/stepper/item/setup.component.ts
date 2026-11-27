import {
	StepperCollectionItemDescriptor,
	StepperItemDescriptor,
	TCollectionItemExtension,
} from '@soxa-ui/setup'
import {
	createVueAdapterContext,
	extendBinding,
	roleIcon,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
	useExpose,
	useSplitAttrs,
	VueElevatorFactory,
	type SetupContext,
} from '../../../adapter'
import BaseStepperItem, { type StepperItemProps } from './base.component'

export default {
	name: '_StepperItem',
	inheritAttrs: false,
	extends: BaseStepperItem,
	expose: useExpose(),
	setup(props: StepperItemProps, { emit }: SetupContext) {
		const adapter = createVueAdapterContext(StepperItemDescriptor(), {
			ctrl: props.ctrl,
			props,
		})
		const item = createVueAdapterContext(
			StepperCollectionItemDescriptor(),
			{ props },
			{ bundle: adapter.bundle },
		).use(TCollectionItemExtension, { adapter, elevator: VueElevatorFactory })

		const itemBinding = useCollectionAdapter(item, props, emit)
		const ownerBinding = useAdapter(adapter, props, emit)

		return extendBinding(joinBindings(ownerBinding, itemBinding), {
			...useSplitAttrs(),
			stepIconTag: roleIcon('step'),
			checkIconTag: roleIcon('check'),
			errorIconTag: roleIcon('error'),
			activate() {
				item.instance.active = true
			},
		})
	},
}
