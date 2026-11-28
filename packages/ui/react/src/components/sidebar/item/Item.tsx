import type { ElementType, ReactElement } from 'react'
import { renderSlot, toRootProps } from '../../../adapter'
import type { SidebarItemProps } from './base.component'
import { useSetupSidebarItem } from './setup.component'

export function SidebarItem(props: SidebarItemProps): ReactElement | null {
	const { ref, state, forwardProps } = useSetupSidebarItem(props)
	if (!state.rendered) return null

	const Tag = state.tag as ElementType

	return (
		<Tag
			title={state.text || undefined}
			{...toRootProps(ref, state, [state.attrs, state.aria, state.dataset], forwardProps)}
		>
			<span className="so-sidebar-item__leading" aria-hidden="true">
				{renderSlot(props.leading)}
			</span>
			<span className="so-sidebar-item__text">
				{renderSlot(props.children, { text: state.text ?? '' }) ?? state.text}
			</span>
		</Tag>
	)
}
