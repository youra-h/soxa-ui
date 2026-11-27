import {
	TCollectionExtension,
	StepperCollectionDescriptor,
	StepperDescriptor,
} from '@soxa-ui/setup'
import type { IStepper, TStepperCollectionFacade } from '@soxa-ui/core'
import {
	createWebcAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
} from '../../adapter'
import type { TBinding, TUpdateListener } from '../../adapter'
import { createWebcElevator } from '../../adapter/elevator'

export function setupStepper(
	host: HTMLElement,
	ctrl: IStepper | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<IStepper, TStepperCollectionFacade> {
	const adapter = createWebcAdapterContext(host, StepperDescriptor(), { ctrl, props })
	const elevator = createWebcElevator(host)

	const collectionAdapter = createWebcAdapterContext(
		host,
		StepperCollectionDescriptor(),
		{ props, options: { owner: adapter.instance, engine: props['engine'] } },
		{ bundle: adapter.bundle },
	).use(TCollectionExtension, { elevator })

	const facade = useCollectionAdapter(collectionAdapter, host, onUpdate)
	const owner = useAdapter(adapter, host, onUpdate)

	return joinBindings(owner, facade)
}
