import { SidebarDescriptor } from '@soxa-ui/setup'
import { createVueAdapterContext, useAdapter, useExpose, type SetupContext } from '../../adapter'
import BaseSidebar, { type SidebarProps } from './base.component'

export default {
	name: '_Sidebar',
	extends: BaseSidebar,
	expose: useExpose(),
	setup(props: SidebarProps, { emit }: SetupContext) {
		const adapter = createVueAdapterContext(SidebarDescriptor(), { ctrl: props.ctrl, props })

		return useAdapter(adapter, props, emit)
	},
}
