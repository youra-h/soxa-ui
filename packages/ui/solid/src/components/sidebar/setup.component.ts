import { SidebarDescriptor } from '@soxa-ui/setup'
import { createSolidAdapterContext, useAdapter } from '../../adapter'
import type { SidebarProps } from './base.component'

export function setupSidebar(props: SidebarProps) {
	const adapter = createSolidAdapterContext(SidebarDescriptor(), { ctrl: props.ctrl, props })
	return useAdapter(adapter, props)
}
