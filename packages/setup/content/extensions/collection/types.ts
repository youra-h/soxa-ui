/**
 * Contracts of the collection extensions: the instance each is installed on, and its options.
 */

import type { TCollectionEngine, TItemContext } from '@soxa-ui/core'
import type { TInstanceContext } from '../../../protected/adapter/context'
import type { TElevatorFactory } from '../../../protected/adapter/elevator'

/**
 * The instance `TCollectionExtension` is installed on: the facade that owns
 * the collection. Acceptance binds the owner to the engine, destruction
 * releases it.
 */
export type TCollectionOwner = {
	readonly engine: TCollectionEngine<any, any>
	bindOwner(): void
	releaseOwner(): void
}

export interface ICollectionExtensionOptions {
	elevator: TElevatorFactory
}

/**
 * The instance `TCollectionItemExtension` is installed on: the item facade,
 * which takes the item context for the mount and lets it go at the end.
 */
export type TCollectionItemFacade = {
	setContext(context: TItemContext<any, any>): void
	clearContext(): void
}

/** A context the collection detaches with itself (`TCollectionMembers`). */
export interface IDetachable {
	detach(): void
}

/**
 * The own adapter context of a collection member, of its own descriptor, not
 * of the facade: its instance is the collection's item, and the collection
 * detaches it with itself.
 */
export type TMemberAdapter<TInstance extends object = object> = Pick<
	TInstanceContext<TInstance>,
	'instance' | 'detach'
>

export interface ICollectionItemExtensionOptions {
	adapter: TMemberAdapter
	elevator: TElevatorFactory
}

/** Options for an owner that explicitly enables initial membership preparation. */
export interface ICollectionPreparationOptions {
	elevator: TElevatorFactory
	/** Maximum lifetime of an unaccepted assembly; expired assemblies can be rebuilt. */
	timeout?: number
}

/** A pending mount's ownership receipt, independent of the item's value. */
export interface ICollectionPreparationRegistration {
	commit(): void
	cancel(): void
}
