import type { ElementType, ReactElement } from 'react'
import type { IStepperItem } from '@soxa-ui/core'
import { Elevate, hasSlot, renderSlot, toRootProps } from '../../adapter'
import { StepperItem } from './item'
import { useSetupStepper } from './setup.component'
import type { StepperProps } from './base.component'

function StepperSlot({
	item,
	replacement,
}: {
	item: IStepperItem
	replacement: StepperProps['item']
}) {
	return <>{renderSlot(replacement, { item }) ?? <StepperItem ctrl={item} />}</>
}

export function Stepper(props: StepperProps): ReactElement | null {
	const { ref, forwardProps, state, layer, next, previous } = useSetupStepper(props)
	if (!state.rendered) return null

	const Tag = state.tag as ElementType

	return (
		<Tag {...toRootProps(ref, state, [state.attrs, state.dataset, state.aria], forwardProps)}>
			<Elevate layer={layer}>
				<ol className="so-stepper__list" role="list">
					{hasSlot(props.children)
						? renderSlot(props.children)
						: state.shown?.map((item) => (
								<StepperSlot key={item.uid} item={item} replacement={props.item} />
							))}
				</ol>
				{renderSlot(props.content, {
					value: state.value,
					next,
					previous,
					canNext: state.stepper_canNext ?? false,
					canPrevious: state.stepper_canPrevious ?? false,
				})}
			</Elevate>
		</Tag>
	)
}
