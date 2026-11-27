import {
	TCollectionItemExtension,
	StepperCollectionItemDescriptor,
	StepperItemDescriptor,
} from '@soxa-ui/setup'
import {
	createSolidAdapterContext,
	useAdapter,
	joinBindings,
	useCollectionAdapter,
	useElevator,
} from '../../../adapter'
import type { StepperItemProps } from './base.component'

export function setupStepperItem(props: StepperItemProps) {
	const { elevator } = useElevator()
	const adapter = createSolidAdapterContext(StepperItemDescriptor(), { ctrl: props.ctrl, props })

	const item = createSolidAdapterContext(
		StepperCollectionItemDescriptor(),
		{ props },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator })

	const itemBinding = useCollectionAdapter(item, props)
	const owner = useAdapter(adapter, props)

	return {
		...joinBindings(owner, itemBinding),
		activate: () => {
			item.instance.active = true
		},
	}
}
