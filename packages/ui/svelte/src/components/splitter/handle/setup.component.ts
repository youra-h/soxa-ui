import { SplitterHandleDescriptor, TSplitterPartExtension } from '@soxa-ui/setup'
import {
	createSvelteAdapterContext,
	useAdapter,
	useElevator,
	type TRootReceiver,
} from '../../../adapter'
import type { SplitterHandleProps } from './base.component'

export function setupSplitterHandle(
	getProps: () => SplitterHandleProps,
	mountId: string,
	receive: TRootReceiver,
) {
	const elevator = useElevator()
	const adapter = createSvelteAdapterContext(SplitterHandleDescriptor(), {
		ctrl: getProps().ctrl,
		props: getProps(),
		mountId,
	}).use(TSplitterPartExtension, { elevator })

	return useAdapter(adapter, getProps, receive)
}
