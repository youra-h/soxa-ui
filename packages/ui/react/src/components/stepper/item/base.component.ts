import type { HTMLAttributes } from 'react'
import type { IStepperItem } from '@soxa-ui/core'
import type { StepperCollectionItemDescriptor, StepperItemDescriptor } from '@soxa-ui/setup'
import type { EventProps, TDomAttributes, UseDomProps } from '../../../types'

export type StepperItemEventProps = EventProps<typeof StepperItemDescriptor> &
	EventProps<typeof StepperCollectionItemDescriptor>

export type StepperItemAttributes = TDomAttributes<
	typeof StepperItemDescriptor,
	HTMLAttributes<HTMLElement>,
	StepperItemEventProps
>

export type StepperItemProps = UseDomProps<
	typeof StepperItemDescriptor,
	IStepperItem,
	StepperItemEventProps
>
