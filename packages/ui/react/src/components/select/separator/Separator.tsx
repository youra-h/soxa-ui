import type { ElementType, ReactElement } from 'react'
import { toRootProps } from '../../../adapter'
import { useSetupSelectSeparator } from './setup.component'
import type { SelectSeparatorProps } from './base.component'

export function SelectSeparator(props: SelectSeparatorProps): ReactElement | null {
	const { ref, forwardProps, state } = useSetupSelectSeparator(props)

	const { rendered, tag, attrs, aria, dataset } = state

	if (!rendered) return null

	const Tag = tag as ElementType

	return <Tag {...toRootProps(ref, state, [attrs, aria, dataset], forwardProps)} />
}
