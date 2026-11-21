import type { ElementType, ReactElement } from 'react'
import { toRootProps } from '../../../adapter'
import { useSetupListBoxSeparator } from './setup.component'
import type { ListBoxSeparatorProps } from './base.component'

export function ListBoxSeparator(props: ListBoxSeparatorProps): ReactElement | null {
	const { ref, forwardProps, state } = useSetupListBoxSeparator(props)

	const { rendered, tag, attrs, aria, dataset } = state

	if (!rendered) return null

	const Tag = tag as ElementType

	return <Tag {...toRootProps(ref, state, [attrs, aria, dataset], forwardProps)} />
}
