import { SplitterPanelDescriptor, TSplitterPartExtension } from '@soxa-ui/setup'
import { createSolidAdapterContext, useAdapter, useElevator } from '../../../adapter'
import type { SplitterPanelProps } from './base.component'

export function setupSplitterPanel(props: SplitterPanelProps) {
	const { elevator } = useElevator()
	const adapter = createSolidAdapterContext(SplitterPanelDescriptor(), {
		ctrl: props.ctrl,
		props,
	}).use(TSplitterPartExtension, { elevator })

	return useAdapter(adapter, props)
}
