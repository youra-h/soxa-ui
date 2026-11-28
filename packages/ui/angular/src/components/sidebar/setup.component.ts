import { SidebarDescriptor } from '@soxa-ui/setup'
import type { ISidebar } from '@soxa-ui/core'
import { createAngularAdapterContext, useAdapter, type TBinding } from '../../adapter'

export function setupSidebar(ctrl: ISidebar | undefined, props: object): TBinding<ISidebar> {
	const adapter = createAngularAdapterContext(SidebarDescriptor(), { ctrl, props })
	return useAdapter(adapter)
}
