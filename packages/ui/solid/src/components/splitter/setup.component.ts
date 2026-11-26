import { SplitterDescriptor, TSplitterExtension } from '@soxa-ui/setup'
import { createSolidAdapterContext, useAdapter, useElevator } from '../../adapter'
import type { SplitterProps } from './base.component'

export function setupSplitter(props: SplitterProps) {
	const { elevator, layer } = useElevator()
	const adapter = createSolidAdapterContext(SplitterDescriptor(), {
		ctrl: props.ctrl,
		props,
	}).use(TSplitterExtension, { elevator })

	return { ...useAdapter(adapter, props), layer }
}
