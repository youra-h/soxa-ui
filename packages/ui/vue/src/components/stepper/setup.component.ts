import {
	StepperCollectionDescriptor,
	StepperDescriptor,
	TCollectionExtension,
} from '@soxa-ui/setup'
import {
	createVueAdapterContext,
	extendBinding,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
	useExpose,
	VueElevatorFactory,
	type SetupContext,
} from '../../adapter'
import BaseStepper, { type StepperProps } from './base.component'

export default {
	name: '_Stepper',
	extends: BaseStepper,
	expose: useExpose(),
	setup(props: StepperProps, { emit }: SetupContext) {
		const adapter = createVueAdapterContext(StepperDescriptor(), { ctrl: props.ctrl, props })
		const collectionAdapter = createVueAdapterContext(
			StepperCollectionDescriptor(),
			{ props, options: { owner: adapter.instance, engine: props.engine } },
			{ bundle: adapter.bundle },
		).use(TCollectionExtension, { elevator: VueElevatorFactory })

		const collectionBinding = useCollectionAdapter(collectionAdapter, props, emit)
		const ownerBinding = useAdapter(adapter, props, emit)

		return extendBinding(joinBindings(ownerBinding, collectionBinding), {
			next: collectionAdapter.instance.next,
			previous: collectionAdapter.instance.previous,
		})
	},
}
