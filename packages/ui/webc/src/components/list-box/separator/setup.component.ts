import { ListBoxSeparatorDescriptor, TListSeparatorExtension } from '@soxa-ui/setup'
import type { TListBoxSeparator } from '@soxa-ui/core'
import { createWebcAdapterContext, useAdapter } from '../../../adapter'
import type { TBinding, TUpdateListener } from '../../../adapter'
import { createWebcElevator } from '../../../adapter/elevator'

export function setupListBoxSeparator(
	host: HTMLElement,
	ctrl: TListBoxSeparator | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<TListBoxSeparator> {
	const adapter = createWebcAdapterContext(host, ListBoxSeparatorDescriptor(), {
		ctrl,
		props,
	}).use(TListSeparatorExtension, { elevator: createWebcElevator(host) })

	return useAdapter(adapter, host, onUpdate)
}
