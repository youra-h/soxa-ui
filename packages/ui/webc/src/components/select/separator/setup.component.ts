import { SelectSeparatorDescriptor, TListSeparatorExtension } from '@soxa-ui/setup'
import type { TSelectSeparator } from '@soxa-ui/core'
import { createWebcAdapterContext, useAdapter } from '../../../adapter'
import type { TBinding, TUpdateListener } from '../../../adapter'
import { createWebcElevator } from '../../../adapter/elevator'

export function setupSelectSeparator(
	host: HTMLElement,
	ctrl: TSelectSeparator | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<TSelectSeparator> {
	const adapter = createWebcAdapterContext(host, SelectSeparatorDescriptor(), {
		ctrl,
		props,
	}).use(TListSeparatorExtension, { elevator: createWebcElevator(host) })

	return useAdapter(adapter, host, onUpdate)
}
