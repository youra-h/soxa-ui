import { SidebarItemDescriptor } from '@soxa-ui/setup'
import { useComponent } from '../../../adapter'
import type { SidebarItemProps } from './base.component'

export function useSetupSidebarItem(props: SidebarItemProps) {
	return useComponent(
		(create) => create(SidebarItemDescriptor(), { ctrl: props.ctrl, props }),
		props,
	)
}
