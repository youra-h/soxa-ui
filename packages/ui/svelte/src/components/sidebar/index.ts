import { withParts } from '@soxa-ui/setup'
import SidebarComponent from './Sidebar.svelte'
import { SidebarItem } from './item'

export * from './base.component'
export * from './item'
export const Sidebar = withParts(SidebarComponent, { Item: SidebarItem })
