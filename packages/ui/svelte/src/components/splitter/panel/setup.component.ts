import { SplitterPanelDescriptor, TSplitterPartExtension } from '@soxa-ui/setup'
import {
	createSvelteAdapterContext,
	useAdapter,
	useElevator,
	type TRootReceiver,
} from '../../../adapter'
import type { SplitterPanelProps } from './base.component'

export function setupSplitterPanel(
	getProps: () => SplitterPanelProps,
	mountId: string,
	receive: TRootReceiver,
) {
	const elevator = useElevator()
	const adapter = createSvelteAdapterContext(SplitterPanelDescriptor(), {
		ctrl: getProps().ctrl,
		props: getProps(),
		mountId,
	}).use(TSplitterPartExtension, { elevator })

	return useAdapter(adapter, getProps, receive)
}
