import {
	TCollectionExtension,
	StepperCollectionDescriptor,
	StepperDescriptor,
} from '@soxa-ui/setup'
import { useAdapter, useAdapterContext, useCollectionAdapter } from '../../adapter'
import type { StepperProps } from './base.component'

export function useSetupStepper(props: StepperProps) {
	const {
		contexts: [adapter, collectionAdapter],
		layer,
	} = useAdapterContext((create, elevator) => {
		const adapter = create(StepperDescriptor(), { ctrl: props.ctrl, props })

		const collectionAdapter = create(
			StepperCollectionDescriptor(),
			{
				props,
				options: { owner: adapter.instance, engine: props.engine },
			},
			{ bundle: adapter.bundle },
		).use(TCollectionExtension, { elevator })

		return [adapter, collectionAdapter] as const
	})

	return {
		...useCollectionAdapter(useAdapter(adapter, props), collectionAdapter, props),
		layer,
		next: collectionAdapter.instance.next,
		previous: collectionAdapter.instance.previous,
	}
}
