import type { ElementType, ReactElement } from 'react'
import { renderSlot, toRootProps } from '../../../adapter'
import type { SplitterHandleProps } from './base.component'
import { useSetupSplitterHandle } from './setup.component'

export function SplitterHandle(props: SplitterHandleProps): ReactElement | null {
	const { ref, state, forwardProps } = useSetupSplitterHandle(props)
	const { rendered, tag, attrs, aria, dataset } = state

	if (!rendered) return null

	const Tag = tag as ElementType

	return (
		<Tag {...toRootProps(ref, state, [attrs, aria, dataset], forwardProps)}>
			{state.thumbShown ? (
				<span className="so-splitter__grip" aria-hidden="true">
					{renderSlot(props.icon)}
				</span>
			) : null}
		</Tag>
	)
}
