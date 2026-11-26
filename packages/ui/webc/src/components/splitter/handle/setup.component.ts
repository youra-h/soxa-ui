import type { ISplitterHandle } from '@soxa-ui/core'
import { SplitterHandleDescriptor, TSplitterPartExtension } from '@soxa-ui/setup'
import {
	createWebcAdapterContext,
	useAdapter,
	type TBinding,
	type TUpdateListener,
} from '../../../adapter'
import { createWebcElevator } from '../../../adapter/elevator'

export function setupSplitterHandle(
	host: HTMLElement,
	ctrl: ISplitterHandle | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<ISplitterHandle> {
	const adapter = createWebcAdapterContext(host, SplitterHandleDescriptor(), { ctrl, props }).use(
		TSplitterPartExtension,
		{ elevator: createWebcElevator(host) },
	)

	return useAdapter(adapter, host, onUpdate)
}
