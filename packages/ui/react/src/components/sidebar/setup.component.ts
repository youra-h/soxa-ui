import { SidebarDescriptor } from '@soxa-ui/setup'
import { useComponent } from '../../adapter'
import type { SidebarProps } from './base.component'

export function useSetupSidebar(props: SidebarProps) {
	return useComponent((create) => create(SidebarDescriptor(), { ctrl: props.ctrl, props }), props)
}
