import type { TClosedComponent } from '../../adapter'
import GuideComponent from './Guide.vue'

export type { GuideProps } from './base.component'
export const Guide: TClosedComponent<typeof GuideComponent> = GuideComponent
