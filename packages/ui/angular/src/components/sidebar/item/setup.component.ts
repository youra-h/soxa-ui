import { SidebarItemDescriptor } from '@soxa-ui/setup'
import type { ISidebarItem } from '@soxa-ui/core'
import { createAngularAdapterContext, useAdapter, type TBinding } from '../../../adapter'

export function setupSidebarItem(
	ctrl: ISidebarItem | undefined,
	props: object,
): TBinding<ISidebarItem> {
	const adapter = createAngularAdapterContext(SidebarItemDescriptor(), { ctrl, props })
	return useAdapter(adapter)
}
