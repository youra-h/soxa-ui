import { withParts } from '@soxa-ui/setup'
import StepperComponent from './Stepper.svelte'
import { StepperItem } from './item'
import { StepperContent } from './content'

export * from './base.component'
export { setupStepper } from './setup.component'
export * from './item'
export * from './content'

export const Stepper = withParts(StepperComponent, { Item: StepperItem, Content: StepperContent })
