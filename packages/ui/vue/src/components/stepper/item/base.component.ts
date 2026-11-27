import { StepperCollectionItemDescriptor, StepperItemDescriptor } from '@soxa-ui/setup'
import type { IStepperItem } from '@soxa-ui/core'
import { useEmits, useProps } from '../../../adapter'
import type { TProps, UseProps } from '../../../types/common'

export type StepperItemProps = UseProps<typeof StepperItemDescriptor, IStepperItem>

export default {
	name: 'BaseStepperItem',
	emits: useEmits(StepperItemDescriptor()),
	props: {
		...(useProps(StepperItemDescriptor()) as TProps),
		...(useProps(StepperCollectionItemDescriptor()) as TProps),
	},
}
