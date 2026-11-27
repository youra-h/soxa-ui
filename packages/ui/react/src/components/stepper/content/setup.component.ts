import { StepperContentDescriptor, TStepperContentExtension } from '@soxa-ui/setup'
import { useAdapter, useAdapterContext } from '../../../adapter'
import type { StepperContentProps } from './base.component'

export function useSetupStepperContent(props: StepperContentProps) {
	const {
		contexts: [adapter],
	} = useAdapterContext(
		(create, elevator) =>
			[
				create(StepperContentDescriptor(), { ctrl: props.ctrl, props }).use(
					TStepperContentExtension,
					{ elevator },
				),
			] as const,
	)

	return useAdapter(adapter, props)
}
