import { ListBoxSeparatorDescriptor, TListSeparatorExtension } from '@soxa-ui/setup'
import { createSolidAdapterContext, useAdapter, useElevator } from '../../../adapter'
import type { ListBoxSeparatorProps } from './base.component'

export function setupListBoxSeparator(props: ListBoxSeparatorProps) {
	const { elevator } = useElevator()
	const adapter = createSolidAdapterContext(ListBoxSeparatorDescriptor(), {
		ctrl: props.ctrl,
		props,
	}).use(TListSeparatorExtension, { elevator })

	return useAdapter(adapter, props)
}
