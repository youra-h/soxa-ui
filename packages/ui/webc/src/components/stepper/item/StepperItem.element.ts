import { StepperCollectionItemDescriptor, StepperItemDescriptor } from '@soxa-ui/setup'
import type { IStepperItem, TStepperItemCollectionFacade } from '@soxa-ui/core'
import {
	ElementBase,
	defineElement,
	type TElementClassOf,
	type TElementType,
} from '../../../adapter'
import { setupStepperItem } from './setup.component'
import { stepperItemTemplate } from './stepper-item.template'

export const TStepperItemElement: TElementClassOf<
	typeof HTMLLIElement,
	typeof StepperItemDescriptor,
	IStepperItem,
	TStepperItemCollectionFacade
> = ElementBase(HTMLLIElement, {
	descriptor: StepperItemDescriptor,
	facade: StepperCollectionItemDescriptor,
	template: stepperItemTemplate,
	root: { strategy: 'host', sets: ['dataset'] },
	setup: setupStepperItem,
})

defineElement('so-stepper-item', TStepperItemElement, 'li')

export type TStepperItemElementProps = TElementType<typeof TStepperItemElement>
