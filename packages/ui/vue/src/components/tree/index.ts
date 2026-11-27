import type { TClosedComponent } from '../../adapter'
import TreeComponent from './Tree.vue'

export type { TreeProps } from './base.component'
export const Tree: TClosedComponent<typeof TreeComponent> = TreeComponent
