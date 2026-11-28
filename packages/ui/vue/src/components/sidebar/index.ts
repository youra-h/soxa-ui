import { h, type FunctionalComponent, type HTMLAttributes } from 'vue'
import { withParts } from '@soxa-ui/setup'
import type { TClosedComponent } from '../../adapter'
import SidebarComponent from './Sidebar.vue'
import { SidebarItem } from './item'

export * from './base.component'
export * from './item'

const SidebarExpandedOnly: FunctionalComponent<HTMLAttributes> = (_, { attrs, slots }) =>
	h('div', { ...attrs, 'data-so-sidebar-expanded-only': '' }, slots.default?.())

SidebarExpandedOnly.inheritAttrs = false

const SidebarOwner: TClosedComponent<typeof SidebarComponent> = SidebarComponent
export const Sidebar = withParts(SidebarOwner, {
	Item: SidebarItem,
	ExpandedOnly: SidebarExpandedOnly,
})
