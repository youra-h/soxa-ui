import { SplitterDescriptor, TSplitterExtension } from '@soxa-ui/setup'
import {
	createSvelteAdapterContext,
	useAdapter,
	useElevator,
	type TRootReceiver,
} from '../../adapter'
import type { SplitterProps } from './base.component'

export function setupSplitter(
	getProps: () => SplitterProps,
	mountId: string,
	receive: TRootReceiver,
) {
	const elevator = useElevator()
	const adapter = createSvelteAdapterContext(SplitterDescriptor(), {
		ctrl: getProps().ctrl,
		props: getProps(),
		mountId,
	}).use(TSplitterExtension, { elevator })

	return useAdapter(adapter, getProps, receive)
}
