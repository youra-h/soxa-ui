import { StepperCollectionDescriptor, StepperDescriptor } from '@soxa-ui/setup'
import type { IStepper, TStepperCollectionFacade } from '@soxa-ui/core'
import { ElementBase, defineElement, type TElementClassOf, type TElementType } from '../../adapter'
import './content/StepperContent.element'
import { setupStepper } from './setup.component'
import { stepperTemplate } from './stepper.template'

export const TStepperElement: TElementClassOf<
	typeof HTMLDivElement,
	typeof StepperDescriptor,
	IStepper,
	TStepperCollectionFacade
> = ElementBase(HTMLDivElement, {
	descriptor: StepperDescriptor,
	facade: StepperCollectionDescriptor,
	template: stepperTemplate,
	root: { strategy: 'host', sets: ['attrs', 'dataset', 'aria'] },
	setup: setupStepper,
})

defineElement('so-stepper', TStepperElement, 'div')

export type TStepperElementProps = TElementType<typeof TStepperElement>
