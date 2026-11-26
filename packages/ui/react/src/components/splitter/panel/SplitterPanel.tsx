import type { ElementType, ReactElement } from 'react'
import { renderSlot, toRootProps } from '../../../adapter'
import type { SplitterPanelProps } from './base.component'
import { useSetupSplitterPanel } from './setup.component'

export function SplitterPanel(props: SplitterPanelProps): ReactElement | null {
	const { ref, state, forwardProps } = useSetupSplitterPanel(props)
	const { rendered, tag, attrs, aria, dataset, panelStyle } = state

	if (!rendered) return null

	const Tag = tag as ElementType

	return (
		<Tag {...toRootProps(ref, state, [attrs, aria, dataset], forwardProps, panelStyle)}>
			{renderSlot(props.children)}
		</Tag>
	)
}
