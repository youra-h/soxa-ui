import type { ISplitterPanel } from '@soxa-ui/core'
import { SplitterPanelDescriptor, TSplitterPartExtension } from '@soxa-ui/setup'
import {
	createWebcAdapterContext,
	useAdapter,
	type TBinding,
	type TUpdateListener,
} from '../../../adapter'
import { createWebcElevator } from '../../../adapter/elevator'

export function setupSplitterPanel(
	host: HTMLElement,
	ctrl: ISplitterPanel | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<ISplitterPanel> {
	const adapter = createWebcAdapterContext(host, SplitterPanelDescriptor(), { ctrl, props }).use(
		TSplitterPartExtension,
		{ elevator: createWebcElevator(host) },
	)

	return useAdapter(adapter, host, onUpdate)
}
