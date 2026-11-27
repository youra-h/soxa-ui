import { StepperContentDescriptor, TStepperContentExtension } from '@soxa-ui/setup'
import {
	createSvelteAdapterContext,
	useAdapter,
	useElevator,
	type TRootReceiver,
} from '../../../adapter'
import type { StepperContentProps } from './base.component'

export function setupStepperContent(
	getProps: () => StepperContentProps,
	mountId: string,
	receive: TRootReceiver,
) {
	const elevator = useElevator()
	const props = getProps()
	const adapter = createSvelteAdapterContext(StepperContentDescriptor(), {
		ctrl: props.ctrl,
		props,
		mountId,
	}).use(TStepperContentExtension, { elevator })

	return useAdapter(adapter, getProps, receive)
}
