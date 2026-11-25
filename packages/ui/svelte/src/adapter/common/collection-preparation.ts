import { TCollectionPreparation, collectionPreparationConfig } from '@soxa-ui/setup'
import { useElevator } from '../elevator'
import { createSvelteAdapterContext } from './createSvelteAdapterContext'

/** Applies the shared initial collection strategy before native context assembly. */
export const createSveltePreparedAdapterContext: typeof createSvelteAdapterContext = (
	descriptor,
	options,
	config,
) =>
	createSvelteAdapterContext(
		descriptor,
		options,
		collectionPreparationConfig(
			descriptor,
			config,
			() => new TCollectionPreparation(useElevator()),
		),
	)
