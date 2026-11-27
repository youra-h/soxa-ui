import { StepperContentDescriptor, TStepperContentExtension } from '@soxa-ui/setup'
import type { IStepperContent } from '@soxa-ui/core'
import { AngularElevatorFactory, createAngularAdapterContext, useAdapter } from '../../../adapter'

export function setupStepperContent(ctrl: IStepperContent | undefined, props: object) {
	const adapter = createAngularAdapterContext(StepperContentDescriptor(), { ctrl, props }).use(
		TStepperContentExtension,
		{ elevator: AngularElevatorFactory },
	)

	return useAdapter(adapter)
}
