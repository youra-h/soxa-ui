import type { ISplitter } from '@soxa-ui/core'
import { SplitterDescriptor, TSplitterExtension } from '@soxa-ui/setup'
import {
	createWebcAdapterContext,
	useAdapter,
	type TBinding,
	type TUpdateListener,
} from '../../adapter'
import { createWebcElevator } from '../../adapter/elevator'

export function setupSplitter(
	host: HTMLElement,
	ctrl: ISplitter | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<ISplitter> {
	const adapter = createWebcAdapterContext(host, SplitterDescriptor(), { ctrl, props }).use(
		TSplitterExtension,
		{ elevator: createWebcElevator(host) },
	)

	return useAdapter(adapter, host, onUpdate)
}
