import {
	TCollectionItemExtension,
	StepperCollectionItemDescriptor,
	StepperItemDescriptor,
} from '@soxa-ui/setup'
import { useAdapter, useAdapterContext, useCollectionAdapter } from '../../../adapter'
import type { StepperItemProps } from './base.component'

export function useSetupStepperItem(props: StepperItemProps) {
	const {
		contexts: [adapter, item],
	} = useAdapterContext((create, elevator) => {
		const adapter = create(StepperItemDescriptor(), { ctrl: props.ctrl, props })

		const item = create(
			StepperCollectionItemDescriptor(),
			{ props },
			{ bundle: adapter.bundle },
		).use(TCollectionItemExtension, { adapter, elevator })

		return [adapter, item] as const
	})

	return {
		...useCollectionAdapter(useAdapter(adapter, props), item, props),
		activate: () => {
			item.instance.active = true
		},
	}
}
