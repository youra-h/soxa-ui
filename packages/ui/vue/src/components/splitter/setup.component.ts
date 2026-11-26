import { SplitterDescriptor, TSplitterExtension } from '@soxa-ui/setup'
import {
	createVueAdapterContext,
	useAdapter,
	useExpose,
	VueElevatorFactory,
	type SetupContext,
} from '../../adapter'
import BaseSplitter, { type SplitterProps } from './base.component'

export default {
	name: '_Splitter',
	extends: BaseSplitter,
	expose: useExpose(),
	setup(props: SplitterProps, { emit }: SetupContext) {
		const adapter = createVueAdapterContext(SplitterDescriptor(), {
			ctrl: props.ctrl,
			props,
		}).use(TSplitterExtension, { elevator: VueElevatorFactory })

		return useAdapter(adapter, props, emit)
	},
}
