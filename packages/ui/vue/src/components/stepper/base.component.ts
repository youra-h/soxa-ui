import { StepperCollectionDescriptor, StepperDescriptor } from '@soxa-ui/setup'
import type { IStepper } from '@soxa-ui/core'
import { useEmits, useProps } from '../../adapter'
import type { TProps, UseProps } from '../../types/common'

export type StepperProps = UseProps<typeof StepperDescriptor, IStepper>

export default {
	name: 'BaseStepper',
	emits: [...useEmits(StepperDescriptor()), ...useEmits(StepperCollectionDescriptor())],
	props: {
		...(useProps(StepperDescriptor()) as TProps),
		...(useProps(StepperCollectionDescriptor()) as TProps),
	},
}
