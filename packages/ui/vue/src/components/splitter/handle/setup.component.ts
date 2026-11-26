import { SplitterHandleDescriptor, TSplitterPartExtension } from '@soxa-ui/setup'
import {
	createVueAdapterContext,
	useAdapter,
	useExpose,
	VueElevatorFactory,
	type SetupContext,
} from '../../../adapter'
import BaseSplitterHandle, { type SplitterHandleProps } from './base.component'

export default {
	name: '_SplitterHandle',
	extends: BaseSplitterHandle,
	expose: useExpose(),
	setup(props: SplitterHandleProps, { emit }: SetupContext) {
		const adapter = createVueAdapterContext(SplitterHandleDescriptor(), {
			ctrl: props.ctrl,
			props,
		}).use(TSplitterPartExtension, { elevator: VueElevatorFactory })

		return useAdapter(adapter, props, emit)
	},
}
