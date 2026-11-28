import type { TClosedComponent } from '../../../adapter'
import Component from './Item.vue'

export type { SidebarItemProps } from './base.component'
export const SidebarItem: TClosedComponent<typeof Component> = Component
