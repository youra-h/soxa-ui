import { splitProps, type JSX } from 'solid-js'
import { createPartProps } from '../../adapter'

export function SidebarExpandedOnly(props: JSX.HTMLAttributes<HTMLDivElement>): JSX.Element {
	const [local, rest] = splitProps(props, ['children'])
	const attrs = createPartProps(() => rest)

	return (
		<div {...attrs()} data-so-sidebar-expanded-only="">
			{local.children}
		</div>
	)
}
