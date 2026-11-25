import { TCollectionPreparation, collectionPreparationConfig } from '@soxa-ui/setup'
import { VueElevatorFactory } from '../elevator'
import { initialAssemblyProps } from '../runtime/collection-initial'
import { createVueAdapterContext } from './createVueAdapterContext'

/** Applies the shared initial collection strategy before native context assembly. */
export const createVuePreparedAdapterContext: typeof createVueAdapterContext = (
	descriptor,
	options,
	config,
) =>
	createVueAdapterContext(
		descriptor,
		options,
		collectionPreparationConfig(
			descriptor,
			config,
			() => new TCollectionPreparation(VueElevatorFactory, undefined, initialAssemblyProps),
		),
	)
