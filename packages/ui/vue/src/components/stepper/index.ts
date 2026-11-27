import { withParts } from '@soxa-ui/setup'
import type { TClosedComponent } from '../../adapter'
import StepperComponent from './Stepper.vue'
import ItemComponent from './item/Item.vue'
import ContentComponent from './content/Content.vue'

const StepperOwner: TClosedComponent<typeof StepperComponent> = StepperComponent

export const StepperItem: TClosedComponent<typeof ItemComponent> = ItemComponent
export const StepperContent: TClosedComponent<typeof ContentComponent> = ContentComponent
export const Stepper = withParts(StepperOwner, { Item: StepperItem, Content: StepperContent })

export type { StepperProps } from './base.component'
export type { StepperItemProps } from './item/base.component'
export type { StepperContentProps } from './content/Content.vue'
