import {
	TCollectionItemExtension,
	StepperCollectionItemDescriptor,
	StepperItemDescriptor,
} from '@soxa-ui/setup'
import type { IStepperItem, TStepperItemCollectionFacade } from '@soxa-ui/core'
import {
	AngularElevatorFactory,
	createAngularAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
} from '../../../adapter'
import type { TBinding } from '../../../adapter'

export function setupStepperItem(
	ctrl: IStepperItem | undefined,
	props: object,
): TBinding<IStepperItem, TStepperItemCollectionFacade> {
	const adapter = createAngularAdapterContext(StepperItemDescriptor(), { ctrl, props })
	const owner = useAdapter(adapter)

	const item = createAngularAdapterContext(
		StepperCollectionItemDescriptor(),
		{ props },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator: AngularElevatorFactory })

	return joinBindings(owner, useCollectionAdapter(item))
}
