import { TCollectionPreparation, collectionPreparationConfig } from '@soxa-ui/setup'
import { AngularElevatorFactory } from '../elevator'
import { createAngularAdapterContext } from './createAngularAdapterContext'

/** Applies the shared initial collection strategy before native context assembly. */
export const createAngularPreparedAdapterContext: typeof createAngularAdapterContext = (
	descriptor,
	options,
	config,
) =>
	createAngularAdapterContext(
		descriptor,
		options,
		collectionPreparationConfig(
			descriptor,
			config,
			() => new TCollectionPreparation(AngularElevatorFactory),
		),
	)
