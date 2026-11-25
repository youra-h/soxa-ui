import {
	TCollectionPreparation,
	TCollectionPreparationLifetime,
	collectionPreparationConfig,
} from '@soxa-ui/setup'
import { createWebcElevator } from '../elevator'
import { createWebcAdapterContext } from './createWebcAdapterContext'

const preparationLifetimes = new WeakMap<Element, TCollectionPreparationLifetime>()

/** Applies the shared initial collection strategy before native context assembly. */
export const createWebcPreparedAdapterContext: typeof createWebcAdapterContext = (
	host,
	descriptor,
	options,
	config,
) =>
	createWebcAdapterContext(
		host,
		descriptor,
		options,
		collectionPreparationConfig(
			descriptor,
			config,
			() => new TCollectionPreparation(createWebcElevator(host), lifetimeOf(host)),
		),
	)

/** A host keeps its sources across reconnection and moves: the element is the native mount. */
function lifetimeOf(host: Element): TCollectionPreparationLifetime {
	let lifetime = preparationLifetimes.get(host)

	if (!lifetime) {
		lifetime = new TCollectionPreparationLifetime()
		preparationLifetimes.set(host, lifetime)
	}

	return lifetime
}
