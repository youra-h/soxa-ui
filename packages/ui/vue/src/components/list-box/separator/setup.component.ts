import { ListBoxSeparatorDescriptor, TListSeparatorExtension } from '@soxa-ui/setup'
import {
	useAdapter,
	useExpose,
	VueElevatorFactory,
	createVueAdapterContext,
	type SetupContext,
} from '../../../adapter'
import BaseListBoxSeparator, { type ListBoxSeparatorProps } from './base.component'

export default {
	name: '_ListBoxSeparator',
	extends: BaseListBoxSeparator,
	expose: useExpose(),
	setup(props: ListBoxSeparatorProps, { emit }: SetupContext) {
		const adapter = createVueAdapterContext(ListBoxSeparatorDescriptor(), {
			ctrl: props.ctrl,
			props,
		}).use(TListSeparatorExtension, { elevator: VueElevatorFactory })

		return useAdapter(adapter, props, emit)
	},
}
