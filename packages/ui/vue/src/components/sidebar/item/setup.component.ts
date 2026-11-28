import { SidebarItemDescriptor } from '@soxa-ui/setup'
import { createVueAdapterContext, useAdapter, useExpose, type SetupContext } from '../../../adapter'
import BaseSidebarItem, { type SidebarItemProps } from './base.component'

export default {
	name: '_SidebarItem',
	extends: BaseSidebarItem,
	expose: useExpose(),
	setup(props: SidebarItemProps, { emit }: SetupContext) {
		const adapter = createVueAdapterContext(SidebarItemDescriptor(), {
			ctrl: props.ctrl,
			props,
		})

		return useAdapter(adapter, props, emit)
	},
}
