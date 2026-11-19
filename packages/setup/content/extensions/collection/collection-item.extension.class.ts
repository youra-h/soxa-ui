/**
 * TCollectionItemExtension — an item of a collection: its assembly on mount
 * and its entry into the collection.
 *
 * The work follows the context's phases; when each comes is the adapter
 * runtime's call:
 *
 * - **assembly** (constructor) — through the lift: the own collection's
 *   engine, its registrar and the markup group above the item; the item
 *   context goes into the facade, `meta` is taken from the props. Nothing is
 *   written into the owner's storage. The context releases the assembly props
 *   on `connect()`, so the extension is installed right after the context is
 *   created;
 * - **entry** (`attach`) — registration in the owner's collection and
 *   `meta.apply`. This writes into someone else's storage, so it waits until
 *   the framework accepts the component: React assembles on render, and a
 *   discarded render would leave a phantom in the engine, while an item added
 *   after the mount would update its owner in the middle of a child's render.
 *   From entry to teardown the item's own context (`adapter`, its instance is
 *   the item) and the facade's are members of the collection
 *   (`TCollectionMembers`): when the whole
 *   collection comes down, the owner's `detach` detaches them, and an item
 *   does not hear its siblings leave;
 * - **teardown** (`destroy`) — leaving the collection and releasing the item
 *   context.
 *
 * The own collection is the nearest one above, if the item is of it. The lift
 * gives the nearest engine, and it may be foreign: a tag outside Tags under an
 * app-wide `<Toasts>`, a tag or a radio in a Tabs panel. Whose an item is, the
 * engine's factory knows (`factoryOf(...).isSource`): anything else it turns
 * into an item of its own class — a radio entering Tabs became a tab — and the
 * facade, lacking its own collection's extensions, failed to assemble. A
 * foreign collection is treated as absent: no item context, no entry, no
 * `meta`, the item renders on its own. There is no warning: under `<Toasts>`
 * almost any single item stands under a foreign collection, legitimately.
 *
 * The item context (`TItemContext`) belongs to this mount. Its item adapters
 * subscribe to the engine's extensions, and the engine outlives the mount: a
 * data item hidden by a filter or a page stays in the collection and mounts
 * again, React reassembles without unmounting (StrictMode, `<Activity>`). So
 * teardown releases the context, or every show would leave subscribers on the
 * engine, and clears the facade, since React rereads the state of a destroyed
 * assembly and the facade would recreate the adapters. One context per item
 * for all mounts would not do: a tab and its panel take the same item's
 * context, and one releasing it would break the other.
 *
 * An item removed from the collection while mounted destroys its context
 * (`TItemContext.destroy`). A markup item leaving on teardown is not a
 * removal: `rendered` of an external `ctrl` stays as it is, and mounted again
 * the item renders.
 *
 * An item inside a markup group (`Menu.Group`, `ListBox.Group` and the like)
 * joins that group: the key lowered by `TItemGroupExtension` goes into the
 * item's `meta` as `group`, the channel `_.group` takes in data. Only an item
 * the entry adds to the list takes the key — a data item keeps the group of
 * its data, even when the owner renders it inside a section — and only from
 * its own collection: submenu items inside a menu group are the submenu's.
 */
import { TCollectionInitialPartPlugin } from '@soxa-ui/plugins'

import { TItemContext, batchOf, factoryOf, metaOf, plainOf } from '@soxa-ui/core'
import type { TCollectionEngine, TRemoveEvent } from '@soxa-ui/core'
import type { TInstanceContext } from '../../../protected/adapter/context'
import {
	COLLECTION_ENGINE_ELEVATOR,
	ITEM_CONTEXT_ELEVATOR,
} from '../../../protected/adapter/elevator/keys'
import { ITEM_GROUP_ELEVATOR } from '../item-group/keys'
import { COLLECTION_MEMBERS_ELEVATOR } from './keys'
import { collectItemProps } from './item-props'
import type { ICollectionItemExtensionOptions, TCollectionItemFacade } from './types'

/** The nearest collection's engine, if the item is of it: its factory takes the item as its own. */
function ownEngine(
	engine: TCollectionEngine<any, any> | undefined,
	item: object,
): TCollectionEngine<any, any> | undefined {
	const factory = factoryOf(engine)

	return factory && !factory.isSource(item) ? engine : undefined
}

export class TCollectionItemExtension {
	private _leave: (() => void) | undefined

	constructor(
		context: TInstanceContext<TCollectionItemFacade>,
		options: ICollectionItemExtensionOptions,
	) {
		const { adapter, elevator } = options
		const item = adapter.instance
		const { props } = context

		// The context releases the assembly props on `connect()`. An empty
		// `meta` instead of an error would silently lose the markup's
		// `selected` and `active`
		if (!props) {
			throw new Error(
				'TCollectionItemExtension ставится до connect(): пропсы сборки, из которых берётся meta элемента, контекст уже отпустил',
			)
		}

		// A foreign collection is treated as absent
		const engine = ownEngine(elevator(ITEM_CONTEXT_ELEVATOR).up(), item)
		// The registrar and the members are lowered by the owner of the engine:
		// a foreign collection's are foreign too
		const register = engine ? elevator(COLLECTION_ENGINE_ELEVATOR).up() : undefined
		const members = engine ? elevator(COLLECTION_MEMBERS_ELEVATOR).up() : undefined
		// The markup group above the item — if it is a group of its collection
		const link = engine ? elevator(ITEM_GROUP_ELEVATOR).up() : undefined
		const groupKey = link && link.engine === engine ? link.key : undefined
		// The gate of a prepared mount: its item was declared and seeded by the owner
		const pluginMount = context.bundle?.get(TCollectionInitialPartPlugin)?.pluginMount
		const meta = pluginMount ? {} : collectItemProps(context.descriptor.props, props)
		// The facade gets the item context on assembly: the markup reads it
		// from the first render
		const itemContext = engine ? new TItemContext(item, engine.extensions) : undefined
		const plain = plainOf<object>(engine)

		if (itemContext) context.instance.setContext(itemContext)

		// The item was removed from the collection while mounted
		const removed = (e: TRemoveEvent<object>): void => {
			if (e.item === item) itemContext?.destroy()
		}

		context.events.on('attach', () => {
			pluginMount?.accept()
			plain?.events.on('item:removed', removed)

			// The group key goes only to an item the entry adds to the list: a
			// data item takes its group from the data
			const grouped = groupKey !== undefined && !batchOf<object>(engine)?.items.includes(item)

			// The group enters the grouping before its first item: React accepts the
			// item before its group, and the section came without the group's label
			if (grouped) link?.enter()

			if (register) this._leave = register(item, context.bundle)

			members?.add(adapter, context)

			// `meta` after the registration: the engine applies it to an item already in it.
			// Initial data was accepted once by its owner; a part mount must not reseed it
			if (!pluginMount) {
				metaOf<object>(engine)?.apply(item, grouped ? { ...meta, group: groupKey } : meta)
			}
		})

		context.events.on('destroy', () => {
			// Unsubscribed before leaving: its own leaving is not a removal
			plain?.events.off('item:removed', removed)
			members?.delete(adapter, context)

			this._leave?.()
			this._leave = undefined

			// The facade without its context: a read after teardown would recreate the adapters
			context.instance.clearContext()
			itemContext?.release()
		})
	}
}
