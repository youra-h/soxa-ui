import { StepperContentDescriptor, TStepperContentExtension } from '@soxa-ui/setup'
import { createSolidAdapterContext, useAdapter, useElevator } from '../../../adapter'
import type { StepperContentProps } from './base.component'

export function setupStepperContent(props: StepperContentProps) {
	const { elevator } = useElevator()
	const adapter = createSolidAdapterContext(StepperContentDescriptor(), {
		ctrl: props.ctrl,
		props,
	}).use(TStepperContentExtension, { elevator })

	return useAdapter(adapter, props)
}
