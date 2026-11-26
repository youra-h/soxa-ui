import { SplitterHandleDescriptor, TSplitterPartExtension } from '@soxa-ui/setup'
import { createSolidAdapterContext, useAdapter, useElevator } from '../../../adapter'
import type { SplitterHandleProps } from './base.component'

export function setupSplitterHandle(props: SplitterHandleProps) {
	const { elevator } = useElevator()
	const adapter = createSolidAdapterContext(SplitterHandleDescriptor(), {
		ctrl: props.ctrl,
		props,
	}).use(TSplitterPartExtension, { elevator })

	return useAdapter(adapter, props)
}
