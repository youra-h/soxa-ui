/**
 * TCollectionExtension — the single entry point that sets up a collection. The
 * facade owns the `engine`.
 *
 * It binds the engine to the bundle registry and lowers to the children,
 * through the lift: the engine (`ITEM_CONTEXT_ELEVATOR`), the item registrar
 * (`COLLECTION_ENGINE_ELEVATOR`), the bundle registry
 * (`COLLECTION_BUNDLES_ELEVATOR`) and the members (`COLLECTION_MEMBERS_ELEVATOR`).
 *
 * The registry is for children that do not enter the collection but are tied
 * to its items: a `Tabs.Content` panel hands its `id` to its tab's link plugin
 * and finds the bundle of the tab's current mount in the registry. The
 * members are detached by the owner's `detach` (`TCollectionMembers`).
 */

import { batchOf, plainOf } from '@soxa-ui/core'
import type { TCollectionEngine } from '@soxa-ui/core'
import { TCollectionBundlesPlugin } from '@soxa-ui/plugins'
import { applyRegisteredExtensions } from '../../../protected/registry'
import type { TInstanceContext } from '../../../protected/adapter/context'
import type { TElevatorFactory } from '../../../protected/adapter/elevator'
import {
	COLLECTION_ENGINE_ELEVATOR,
	ITEM_CONTEXT_ELEVATOR,
} from '../../../protected/adapter/elevator/keys'
import {
	COLLECTION_BUNDLES_ELEVATOR,
	COLLECTION_MEMBERS_ELEVATOR,
	COLLECTION_INITIAL_ELEVATOR,
} from './keys'
import { TCollectionMembers } from './members.class'
import { collectionPreparedSource } from './preparation.class'
import { TCollectionInitialExtension } from './initial.extension.class'
import type { ICollectionExtensionOptions, TCollectionOwner } from './types'

export class TCollectionExtension {
	constructor(context: TInstanceContext<TCollectionOwner>, options: ICollectionExtensionOptions) {
		const { elevator } = options
		const engine = context.instance.engine

		if (!engine) {
			throw new Error('Engine is not available in the engine instance.')
		}

		elevator(ITEM_CONTEXT_ELEVATOR).down(engine)

		this._wire(context, elevator, engine)

		// Prepared data is materialized once, before native children are assembled.
		// An owner installed with its own source keeps it; any other lowers none,
		// so that a prepared collection above does not reach its subtree
		if (!context.get(TCollectionInitialExtension)) {
			const source = collectionPreparedSource(context.bundle)

			if (source) context.use(TCollectionInitialExtension, { source, elevator })
			else elevator(COLLECTION_INITIAL_ELEVATOR).down(null)
		}

		// The collection comes down with its owner, and its members with it
		const members = new TCollectionMembers()

		elevator(COLLECTION_MEMBERS_ELEVATOR).down(members)
		context.events.on('detach', () => members.detach())

		// The facade itself writes the owner into the engine's options: it knows
		// what is there. Here only the moment: accepted — bind, destroyed — release
		context.events.on('attach', () => context.instance.bindOwner())
		context.events.on('destroy', () => context.instance.releaseOwner())
	}

	/** Binds the engine to the plugins and lowers the item registrar through the lift. */
	private _wire(
		context: TInstanceContext<TCollectionOwner>,
		elevator: TElevatorFactory,
		engine: TCollectionEngine<any, any>,
	): void {
		const bundles = context.bundle?.get(TCollectionBundlesPlugin)

		// The plugins' only source of the collection's state (active item, order, items)
		if (bundles) {
			bundles.bindEngine(engine)
		}

		// The registry goes beside the engine, from the same owner. Without one —
		// `null`, or this engine's children would get the registry of a collection above
		elevator(COLLECTION_BUNDLES_ELEVATOR).down(bundles ?? null)

		// Registry extensions (`useExtensions`) go into the owner's engine. The
		// owner is the master of the plugin bundle: the facade shares the bundle
		// with the component but is not the component itself
		const owner = context.bundle?.getInstance<object>()

		if (owner) applyRegisteredExtensions(owner, engine, { embedded: context.embedded })

		const itemElevator = elevator(COLLECTION_ENGINE_ELEVATOR)

		itemElevator.down((instance, bundle) => {
			// Whoever created the item owns it. A data item (`items`) is already in
			// the collection: the data decide the list, the markup only renders it,
			// and its unmount means nothing — a filter narrowed the list, a table
			// page went, a panel closed. A markup item did not belong to the
			// collection until now: its source is the template, and leaving the
			// template is a removal.
			//
			// Both ways: removing markup does not touch data items, and reconciling
			// data (`items =` by `trackBy`) does not remove markup items — the
			// registrar holds its item (`batch.hold`) while it is in the markup. So
			// a data submenu with items in `item-content` keeps them on the menu's
			// patch, though its nested data list is `[]`
			const batch = batchOf<object>(engine)
			const owned = !batch?.items.includes(instance)

			// `push`, not `insert`: items come through the lift in mount order,
			// which keeps the DOM order
			if (owned) plainOf<object>(engine)?.push(instance)

			const release = owned ? batch?.hold(instance) : undefined

			// The item's bundle is registered by the item's uid. An item without
			// plugins has no bundle
			if (bundle) bundles?.register(bundle, instance)

			return () => {
				// The markup no longer holds the item
				release?.()

				// Removal emits `item:removed`, and the registry drops the entry on it
				if (owned) plainOf<object>(engine)?.remove(instance)
				// A data item stays in the collection while its mount ended: a
				// registry entry lives one mount, or every row that left the
				// table's window would keep a bundle with a detached node
				else if (bundle) bundles?.release(bundle, instance)
			}
		})
	}
}
