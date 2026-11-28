import { SidebarDescriptor } from '@soxa-ui/setup'
import type { ISidebar } from '@soxa-ui/core'
import {
	createWebcAdapterContext,
	useAdapter,
	type TBinding,
	type TUpdateListener,
} from '../../adapter'

export function setupSidebar(
	host: HTMLElement,
	ctrl: ISidebar | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<ISidebar> {
	const adapter = createWebcAdapterContext(host, SidebarDescriptor(), { ctrl, props })
	return useAdapter(adapter, host, onUpdate)
}
