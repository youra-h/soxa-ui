import { SidebarDescriptor } from '@soxa-ui/setup'
import type { ISidebar } from '@soxa-ui/core'
import { useEmits, useProps } from '../../adapter'
import type { TEmits, TProps, UseProps } from '../../types/common'

export const emitsSidebar: TEmits = useEmits(SidebarDescriptor())
export const propsSidebar: TProps = useProps(SidebarDescriptor()) as TProps
export type SidebarProps = UseProps<typeof SidebarDescriptor, ISidebar>

export default { name: 'BaseSidebar', emits: emitsSidebar, props: propsSidebar }
