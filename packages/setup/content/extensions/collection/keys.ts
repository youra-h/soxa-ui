/**
 * Lift keys of the collection, lowered by its owner beside the engine. They
 * live apart from the wiring, as the group key (`ITEM_GROUP_ELEVATOR`) does:
 * the lift takes any key, so keys belong to the content, not to the lift's
 * mechanics.
 */

import type { TCollectionBundlesPlugin } from '@soxa-ui/plugins'
import type { IElevatorKey } from '../../../protected/adapter/elevator'
import type { TCollectionMembers } from './members.class'
import type { TCollectionPreparationExtension } from './collection-preparation.extension.class'

/**
 * The registry of the nearest collection's item bundles
 * (`TCollectionBundlesPlugin`), of the same owner as the engine under
 * `ITEM_CONTEXT_ELEVATOR`; an item's bundle in it is of its current mount. An
 * owner without a registry lowers `null`, so that a collection's registry
 * above does not reach its subtree.
 */
export const COLLECTION_BUNDLES_ELEVATOR: IElevatorKey<TCollectionBundlesPlugin | null> = {
	name: 'soxa:collection-bundles',
}

/**
 * The members of the nearest collection, of the same owner as the engine: an
 * item and a part bound to an item join on entry and leave when their mount
 * ends.
 */
export const COLLECTION_MEMBERS_ELEVATOR: IElevatorKey<TCollectionMembers> = {
	name: 'soxa:collection-members',
}

/** An opt-in initial preparation scope, separate from ordinary collection membership. */
export const COLLECTION_PREPARATION_ELEVATOR: IElevatorKey<TCollectionPreparationExtension> = {
	name: 'soxa:collection-preparation',
}
