import {
	TCollectionExtension,
	StepperCollectionDescriptor,
	StepperDescriptor,
} from '@soxa-ui/setup'
import type { IStepper, IStepperProps, TStepperCollectionFacade } from '@soxa-ui/core'
import {
	AngularElevatorFactory,
	createAngularAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
} from '../../adapter'
import type { TBinding } from '../../adapter'

export function setupStepper(
	ctrl: IStepper | undefined,
	props: object,
	engine: IStepperProps['engine'],
): TBinding<IStepper, TStepperCollectionFacade> {
	const adapter = createAngularAdapterContext(StepperDescriptor(), { ctrl, props })
	const owner = useAdapter(adapter)

	const collectionAdapter = createAngularAdapterContext(
		StepperCollectionDescriptor(),
		{ props, options: { owner: adapter.instance, engine: engine } },
		{ bundle: adapter.bundle },
	).use(TCollectionExtension, { elevator: AngularElevatorFactory })

	return joinBindings(owner, useCollectionAdapter(collectionAdapter))
}
