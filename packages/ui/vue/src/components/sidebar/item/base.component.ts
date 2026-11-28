import { SidebarItemDescriptor } from '@soxa-ui/setup'
import type { ISidebarItem } from '@soxa-ui/core'
import { useEmits, useProps } from '../../../adapter'
import type { TEmits, TProps, UseProps } from '../../../types/common'

export const emitsSidebarItem: TEmits = useEmits(SidebarItemDescriptor())
export const propsSidebarItem: TProps = useProps(SidebarItemDescriptor()) as TProps
export type SidebarItemProps = UseProps<typeof SidebarItemDescriptor, ISidebarItem>

export default { name: 'BaseSidebarItem', emits: emitsSidebarItem, props: propsSidebarItem }
