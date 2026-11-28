import type { ElementType, ReactElement } from 'react'
import { renderSlot, toRootProps } from '../../adapter'
import type { SidebarProps } from './base.component'
import { useSetupSidebar } from './setup.component'

export function Sidebar(props: SidebarProps): ReactElement | null {
	const { ref, state, forwardProps } = useSetupSidebar(props)
	if (!state.rendered) return null

	const Tag = state.tag as ElementType

	return (
		<Tag {...toRootProps(ref, state, [state.attrs, state.aria, state.dataset], forwardProps)}>
			<div className="so-sidebar__content" inert={state.offcanvasHidden}>
				{renderSlot(props.children, { collapsed: state.collapsed ?? false })}
			</div>
		</Tag>
	)
}
