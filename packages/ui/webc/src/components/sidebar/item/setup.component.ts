import { SidebarItemDescriptor } from '@soxa-ui/setup'
import type { ISidebarItem } from '@soxa-ui/core'
import {
	createWebcAdapterContext,
	useAdapter,
	type TBinding,
	type TUpdateListener,
} from '../../../adapter'

export function setupSidebarItem(
	host: HTMLElement,
	ctrl: ISidebarItem | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<ISidebarItem> {
	const adapter = createWebcAdapterContext(host, SidebarItemDescriptor(), { ctrl, props })
	return useAdapter(adapter, host, onUpdate)
}
