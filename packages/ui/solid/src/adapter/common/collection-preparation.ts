import { TCollectionPreparation, collectionPreparationConfig } from '@soxa-ui/setup'
import { useElevator } from '../elevator'
import { createSolidAdapterContext } from './createSolidAdapterContext'

/** Applies the shared initial collection strategy before native context assembly. */
export const createSolidPreparedAdapterContext: typeof createSolidAdapterContext = (
	descriptor,
	options,
	config,
) =>
	createSolidAdapterContext(
		descriptor,
		options,
		collectionPreparationConfig(
			descriptor,
			config,
			() => new TCollectionPreparation(useElevator().elevator),
		),
	)
