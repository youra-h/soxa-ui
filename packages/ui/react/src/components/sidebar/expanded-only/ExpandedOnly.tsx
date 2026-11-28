import type { ComponentPropsWithoutRef, ReactElement } from 'react'

export function SidebarExpandedOnly(props: ComponentPropsWithoutRef<'div'>): ReactElement {
	return <div {...props} data-so-sidebar-expanded-only="" />
}
