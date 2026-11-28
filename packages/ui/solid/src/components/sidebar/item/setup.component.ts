import { SidebarItemDescriptor } from '@soxa-ui/setup'
import { createSolidAdapterContext, useAdapter } from '../../../adapter'
import type { SidebarItemProps } from './base.component'

export function setupSidebarItem(props: SidebarItemProps) {
	const adapter = createSolidAdapterContext(SidebarItemDescriptor(), { ctrl: props.ctrl, props })
	return useAdapter(adapter, props)
}
