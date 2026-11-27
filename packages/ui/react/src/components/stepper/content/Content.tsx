import type { ElementType, ReactElement } from 'react'
import { renderSlot, toRootProps } from '../../../adapter'
import { useSetupStepperContent } from './setup.component'
import type { StepperContentProps } from './base.component'

export function StepperContent(props: StepperContentProps): ReactElement | null {
	const { ref, forwardProps, state } = useSetupStepperContent(props)

	const { rendered, active, tag, attrs, dataset, aria } = state

	if (!rendered || !active) return null

	const Tag = tag as ElementType

	return (
		<Tag {...toRootProps(ref, state, [attrs, dataset, aria], forwardProps)}>
			{renderSlot(props.children)}
		</Tag>
	)
}
