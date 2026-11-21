import { SelectSeparatorDescriptor, TListSeparatorExtension } from '@soxa-ui/setup'
import { createSolidAdapterContext, useAdapter, useElevator } from '../../../adapter'
import type { SelectSeparatorProps } from './base.component'

export function setupSelectSeparator(props: SelectSeparatorProps) {
	const { elevator } = useElevator()
	const adapter = createSolidAdapterContext(SelectSeparatorDescriptor(), {
		ctrl: props.ctrl,
		props,
	}).use(TListSeparatorExtension, { elevator })

	return useAdapter(adapter, props)
}
