import { SplitterPanelDescriptor, TSplitterPartExtension } from '@soxa-ui/setup'
import {
	createVueAdapterContext,
	useAdapter,
	useExpose,
	VueElevatorFactory,
	type SetupContext,
} from '../../../adapter'
import BaseSplitterPanel, { type SplitterPanelProps } from './base.component'

export default {
	name: '_SplitterPanel',
	extends: BaseSplitterPanel,
	expose: useExpose(),
	setup(props: SplitterPanelProps, { emit }: SetupContext) {
		const adapter = createVueAdapterContext(SplitterPanelDescriptor(), {
			ctrl: props.ctrl,
			props,
		}).use(TSplitterPartExtension, { elevator: VueElevatorFactory })

		return useAdapter(adapter, props, emit)
	},
}
