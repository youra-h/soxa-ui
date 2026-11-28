import { withParts } from '@soxa-ui/setup'
import type { TClosedComponent } from '../../adapter'
import SidebarComponent from './Sidebar.vue'
import { SidebarItem } from './item'

export * from './base.component'
export * from './item'

const SidebarOwner: TClosedComponent<typeof SidebarComponent> = SidebarComponent
export const Sidebar = withParts(SidebarOwner, { Item: SidebarItem })
