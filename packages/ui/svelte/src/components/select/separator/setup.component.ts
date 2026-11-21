import { SelectSeparatorDescriptor, TListSeparatorExtension } from '@soxa-ui/setup'
import {
	createSvelteAdapterContext,
	useAdapter,
	useElevator,
	type TRootReceiver,
} from '../../../adapter'
import type { SelectSeparatorProps } from './base.component'

export function setupSelectSeparator(
	getProps: () => SelectSeparatorProps,
	mountId: string,
	receive: TRootReceiver,
) {
	const elevator = useElevator()
	const adapter = createSvelteAdapterContext(SelectSeparatorDescriptor(), {
		ctrl: getProps().ctrl,
		props: getProps(),
		mountId,
	}).use(TListSeparatorExtension, { elevator })

	return useAdapter(adapter, getProps, receive)
}
