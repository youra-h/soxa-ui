import { SelectSeparatorDescriptor, TListSeparatorExtension } from '@soxa-ui/setup'
import {
	useAdapter,
	useExpose,
	VueElevatorFactory,
	createVueAdapterContext,
	type SetupContext,
} from '../../../adapter'
import BaseSelectSeparator, { type SelectSeparatorProps } from './base.component'

export default {
	name: '_SelectSeparator',
	extends: BaseSelectSeparator,
	expose: useExpose(),
	setup(props: SelectSeparatorProps, { emit }: SetupContext) {
		const adapter = createVueAdapterContext(SelectSeparatorDescriptor(), {
			ctrl: props.ctrl,
			props,
		}).use(TListSeparatorExtension, { elevator: VueElevatorFactory })

		return useAdapter(adapter, props, emit)
	},
}
