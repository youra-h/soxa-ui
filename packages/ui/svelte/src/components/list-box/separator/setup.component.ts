import { ListBoxSeparatorDescriptor, TListSeparatorExtension } from '@soxa-ui/setup'
import {
	createSvelteAdapterContext,
	useAdapter,
	useElevator,
	type TRootReceiver,
} from '../../../adapter'
import type { ListBoxSeparatorProps } from './base.component'

export function setupListBoxSeparator(
	getProps: () => ListBoxSeparatorProps,
	mountId: string,
	receive: TRootReceiver,
) {
	const elevator = useElevator()
	const adapter = createSvelteAdapterContext(ListBoxSeparatorDescriptor(), {
		ctrl: getProps().ctrl,
		props: getProps(),
		mountId,
	}).use(TListSeparatorExtension, { elevator })

	return useAdapter(adapter, getProps, receive)
}
