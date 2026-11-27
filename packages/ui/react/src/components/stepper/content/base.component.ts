import type { IStepperContent } from '@soxa-ui/core'
import type { StepperContentDescriptor } from '@soxa-ui/setup'
import type { EventProps, UseDomProps } from '../../../types'

export type StepperContentEventProps = EventProps<typeof StepperContentDescriptor>

export type StepperContentProps = UseDomProps<
	typeof StepperContentDescriptor,
	IStepperContent,
	StepperContentEventProps
>
