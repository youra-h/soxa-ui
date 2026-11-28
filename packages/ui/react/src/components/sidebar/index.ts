import { withParts } from '@soxa-ui/setup'
import { Sidebar as SidebarComponent } from './Sidebar'
import { SidebarExpandedOnly } from './expanded-only/ExpandedOnly'
import { SidebarItem } from './item'

export * from './base.component'
export * from './item'
export const Sidebar = withParts(SidebarComponent, {
	Item: SidebarItem,
	ExpandedOnly: SidebarExpandedOnly,
})
