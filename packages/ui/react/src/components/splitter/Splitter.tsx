import type { ElementType, ReactElement } from 'react'
import { Elevate, renderSlot, toRootProps } from '../../adapter'
import type { SplitterProps } from './base.component'
import { useSetupSplitter } from './setup.component'

export function SplitterComponent(props: SplitterProps): ReactElement | null {
	const { ref, state, forwardProps, layer } = useSetupSplitter(props)
	const { rendered, tag, attrs, aria, dataset, splitterStyle } = state

	if (!rendered) return null

	const Tag = tag as ElementType

	return (
		<Tag {...toRootProps(ref, state, [attrs, aria, dataset], forwardProps, splitterStyle)}>
			<Elevate layer={layer}>{renderSlot(props.children)}</Elevate>
		</Tag>
	)
}
