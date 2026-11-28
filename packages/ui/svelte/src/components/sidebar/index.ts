import { withParts } from '@soxa-ui/setup'
import SidebarComponent from './Sidebar.svelte'
import SidebarExpandedOnly from './ExpandedOnly.svelte'
import { SidebarItem } from './item'

export * from './base.component'
export * from './item'
export const Sidebar = withParts(SidebarComponent, {
	Item: SidebarItem,
	ExpandedOnly: SidebarExpandedOnly,
})
