import {
	TCollectionExtension,
	StepperCollectionDescriptor,
	StepperDescriptor,
} from '@soxa-ui/setup'
import {
	createSolidAdapterContext,
	useAdapter,
	joinBindings,
	useCollectionAdapter,
	useElevator,
} from '../../adapter'
import type { StepperProps } from './base.component'

export function setupStepper(props: StepperProps) {
	const { elevator, layer } = useElevator()
	const adapter = createSolidAdapterContext(StepperDescriptor(), { ctrl: props.ctrl, props })

	const collectionAdapter = createSolidAdapterContext(
		StepperCollectionDescriptor(),
		{
			props,
			options: { owner: adapter.instance, engine: props.engine },
		},
		{ bundle: adapter.bundle },
	).use(TCollectionExtension, { elevator })

	const collectionBinding = useCollectionAdapter(collectionAdapter, props)
	const owner = useAdapter(adapter, props)

	return {
		...joinBindings(owner, collectionBinding),
		layer,
		next: collectionAdapter.instance.next,
		previous: collectionAdapter.instance.previous,
	}
}
