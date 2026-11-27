import type { IStepper } from '@soxa-ui/core'
import type { StepperCollectionDescriptor, StepperDescriptor } from '@soxa-ui/setup'
import type { EventProps, TDomAttributes, UseDomProps } from '../../types'

export type StepperEventProps = EventProps<typeof StepperDescriptor> &
	EventProps<typeof StepperCollectionDescriptor>

export type StepperAttributes = TDomAttributes<typeof StepperDescriptor, StepperEventProps>

export type StepperProps = UseDomProps<typeof StepperDescriptor, IStepper, StepperEventProps>
