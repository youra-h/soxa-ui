import type { ISidebarItem } from '@soxa-ui/core'
import type { SidebarItemDescriptor } from '@soxa-ui/setup'
import type { EventProps, UseDomProps } from '../../../types'

export type SidebarItemEventProps = EventProps<typeof SidebarItemDescriptor>
export type SidebarItemProps = UseDomProps<
	typeof SidebarItemDescriptor,
	ISidebarItem,
	SidebarItemEventProps
>
