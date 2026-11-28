import { SidebarItemDescriptor } from '@soxa-ui/setup'
import { createSvelteAdapterContext, useAdapter, type TRootReceiver } from '../../../adapter'
import type { SidebarItemProps } from './base.component'

export function setupSidebarItem(
	getProps: () => SidebarItemProps,
	mountId: string,
	receive: TRootReceiver,
) {
	const adapter = createSvelteAdapterContext(SidebarItemDescriptor(), {
		ctrl: getProps().ctrl,
		props: getProps(),
		mountId,
	})
	return useAdapter(adapter, getProps, receive)
}
