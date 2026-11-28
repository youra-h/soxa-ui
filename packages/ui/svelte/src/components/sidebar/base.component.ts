import type { ISidebar } from '@soxa-ui/core'
import type { SidebarDescriptor } from '@soxa-ui/setup'
import type { EventProps, UseDomProps } from '../../types'

export type SidebarEventProps = EventProps<typeof SidebarDescriptor>
export type SidebarProps = UseDomProps<typeof SidebarDescriptor, ISidebar, SidebarEventProps>
