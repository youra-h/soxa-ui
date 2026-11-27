import {
	TCollectionItemExtension,
	StepperCollectionItemDescriptor,
	StepperItemDescriptor,
} from '@soxa-ui/setup'
import type { IStepperItem, TStepperItemCollectionFacade } from '@soxa-ui/core'
import {
	createWebcAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
} from '../../../adapter'
import type { TBinding, TUpdateListener } from '../../../adapter'
import { createWebcElevator } from '../../../adapter/elevator'

export function setupStepperItem(
	host: HTMLElement,
	ctrl: IStepperItem | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<IStepperItem, TStepperItemCollectionFacade> {
	const adapter = createWebcAdapterContext(host, StepperItemDescriptor(), { ctrl, props })

	const itemAdapter = createWebcAdapterContext(
		host,
		StepperCollectionItemDescriptor(),
		{ props },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator: createWebcElevator(host) })

	const item = useCollectionAdapter(itemAdapter, host, onUpdate)
	const owner = useAdapter(adapter, host, onUpdate)

	return joinBindings(owner, item)
}
