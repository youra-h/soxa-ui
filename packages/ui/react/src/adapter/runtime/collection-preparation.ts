import type { RefObject } from 'react'
import {
	TCollectionPreparation,
	TCollectionPreparationLifetime,
	collectionPreparationConfig,
} from '@soxa-ui/setup'
import type { IAdapterContextConfig, IComponentDescriptor, TElevatorFactory } from '@soxa-ui/setup'
import type { IAdapterContext } from '@soxa-ui/setup'

export type TCreateCollectionPreparation = typeof createCollectionPreparation

/** One preparation pass covers a component and its facades. */
export function createCollectionPreparation(
	elevator: TElevatorFactory,
	lifetime: RefObject<TCollectionPreparationLifetime | null>,
) {
	let preparation: TCollectionPreparation | undefined

	return {
		config(descriptor: IComponentDescriptor, config?: IAdapterContextConfig) {
			return collectionPreparationConfig(descriptor, config, () => {
				lifetime.current ??= new TCollectionPreparationLifetime()
				return (preparation ??= new TCollectionPreparation(elevator, lifetime.current))
			})
		},
		pending(contexts: readonly IAdapterContext[], rollback: () => void) {
			return preparation?.pending(contexts, rollback)
		},
	}
}
