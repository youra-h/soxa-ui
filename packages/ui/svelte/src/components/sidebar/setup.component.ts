import { SidebarDescriptor } from '@soxa-ui/setup'
import { createSvelteAdapterContext, useAdapter, type TRootReceiver } from '../../adapter'
import type { SidebarProps } from './base.component'

export function setupSidebar(
	getProps: () => SidebarProps,
	mountId: string,
	receive: TRootReceiver,
) {
	const adapter = createSvelteAdapterContext(SidebarDescriptor(), {
		ctrl: getProps().ctrl,
		props: getProps(),
		mountId,
	})
	return useAdapter(adapter, getProps, receive)
}
