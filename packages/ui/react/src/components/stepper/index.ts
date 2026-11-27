import { withParts } from '@soxa-ui/setup'
import { Stepper as StepperComponent } from './Stepper'
import { StepperItem } from './item'
import { StepperContent } from './content'

export * from './base.component'
export * from './item'
export * from './content'

export const Stepper = withParts(StepperComponent, { Item: StepperItem, Content: StepperContent })
