/**
 * TTabsContentBindingExtension — binds a panel to its tab.
 *
 * The panel does not register in the collection: it is not in `items`. It
 * finds the existing tab with the same `value` and takes that tab's item
 * context (`TItemContext`) of its own, for the mount: the same adapters as
 * `TTabsItemCollectionFacade` has, but the panel releases them itself — on
 * rebinding and on teardown. A context shared with the tab and released by
 * one of them would break the other. A panel without a tab has no context at
 * all, or its `active` would answer for the previous tab. The facade reports
 * the change of activity that comes with the context; the binding only swaps
 * it.
 *
 * The panel's side of the tab link — `id` and `aria-labelledby` — is written
 * here into the panel's `aria`: this is the only place that knows the panel
 * found its tab. The panel has no `id` formula of its own: the tab
 * (`TTabsItemIdsPlugin`) wrote the panel's `id` into its `aria-controls`, and
 * the panel takes exactly that, so the two halves cannot diverge. When the tab
 * remounts or its `TIdPlugin` changes, its ids change (`change:aria`) and the
 * panel follows.
 *
 * An `id` the application gave the panel (its `TIdPlugin`) wins over the
 * formula: it goes on the panel from the first render, tab or no tab, and the
 * tab's `aria-controls` points to it. Only the tab's plugin writes
 * `aria-controls`, so an accepted panel hands it its `TIdPlugin`
 * (`bindPanel`) and takes it back on unbinding and teardown (`unbindPanel`).
 * The plugin of the tab's current mount is found in the collection's bundle
 * registry (`COLLECTION_BUNDLES_ELEVATOR`). A tab's bundle enters the registry
 * on the tab's entry — sometimes after the panel, and again on a remount — so
 * the panel hands its `id` over on every registration (`bundle:registered`)
 * too.
 *
 * The tab is looked up only in a Tabs engine (one with `TTabsExtension`). The
 * lift gives the nearest collection's engine, and it may be foreign: a panel
 * outside its tabs under an app-wide `<Toasts>`. A foreign collection is
 * treated as absent, as for `TCollectionItemExtension`: otherwise the panel
 * would bind to a foreign item with a matching `value` — silently under
 * RadioGroup, with a failing assembly where there is no activation.
 *
 * The work follows the context's phases, as in `TCollectionItemExtension`:
 *
 * - **assembly** — the first binding, writing only the panel's own: its
 *   facade and its `aria`. A data tab is already in the collection and the tab
 *   list renders before the panels, so the panel is bound from the first
 *   render, the server's included. A prepared panel (an initial source) puts
 *   its prepared link into its mount's patch instead of its `aria` until
 *   acceptance (`TPluginMount`);
 * - **entry** (`attach`) — binding again, the tab's side, and the
 *   subscriptions: the engine's `item:added`, the registry's
 *   `bundle:registered`, the panel's `change:value`, its `TIdPlugin`'s
 *   `change:id` and the bound tab's `change:aria`. Markup tabs enter on their
 *   own `attach`, and a panel after them finds them on this second lookup.
 *   Subscriptions and the write to the tab wait for entry because those buses
 *   and the tab are not the panel's: React assembles on render, and a
 *   discarded render would leave an extra subscriber on them and the `id` of
 *   a panel that does not exist on the tab. A tab found on assembly is reread
 *   after subscribing, so what it wrote in between (React: the tab's `id` set
 *   by an effect) reaches the panel. From entry to teardown the panel is a
 *   member of the collection (`TCollectionMembers`), as an item is: the
 *   owner's `detach` detaches its own context and the facade's, and the panel
 *   does not hear the tabs go;
 * - **teardown** (`destroy`) — unsubscribing, the panel's attributes, its `id`
 *   at the tab and the tab's context. A context assembled but never accepted
 *   is torn down too: it has no subscriptions, but what assembly took goes.
 */

import { TItemContext, TTabsExtension } from '@soxa-ui/core'
import type {
	ITabsItem,
	TCollectionEngine,
	TTabsCollection,
	TTabsCollectionExtensions,
} from '@soxa-ui/core'
import { TCollectionInitialPartPlugin, TIdPlugin, TTabsItemIdsPlugin } from '@soxa-ui/plugins'
import type { TCollectionBundlesPlugin } from '@soxa-ui/plugins'
import type { TInstanceContext } from '../../../protected/adapter/context'
import { ITEM_CONTEXT_ELEVATOR } from '../../../protected/adapter/elevator/keys'
import type { TCollectionItemFacade } from '../collection'
import { collectionInitialSourceOf } from '../collection/initial'
import { COLLECTION_BUNDLES_ELEVATOR, COLLECTION_MEMBERS_ELEVATOR } from '../collection/keys'
import type { ITabsContentBindingOptions } from './types'

/** A Tabs engine: the tabs extension is in it. Any other collection's engine is foreign to a panel. */
function isTabsEngine(engine: TCollectionEngine<any, any> | undefined): engine is TTabsCollection {
	return engine?.extensions.tabs instanceof TTabsExtension
}

/** The bundle registry of the panel's collection: another's is foreign. */
function registryOf(
	bundles: TCollectionBundlesPlugin | null | undefined,
	engine: TTabsCollection,
): TCollectionBundlesPlugin | undefined {
	return bundles?.engine === engine ? bundles : undefined
}

/** The tab whose value matches the panel's. */
function findByValue(engine: TTabsCollection, value: unknown): ITabsItem | undefined {
	for (const item of engine.extensions.batch.items) {
		if (item.value === value) return item
	}

	return undefined
}

export class TTabsContentBindingExtension {
	constructor(
		context: TInstanceContext<TCollectionItemFacade>,
		options: ITabsContentBindingOptions,
	) {
		const { adapter, elevator } = options
		const content = adapter.instance

		// A foreign collection is treated as absent: no tab, nothing to bind
		const engine = elevator(ITEM_CONTEXT_ELEVATOR).up()

		if (!isTabsEngine(engine)) return

		const extensions: TTabsCollectionExtensions = engine.extensions
		/** The tabs' bundles: there the panel finds its tab's link plugin. */
		const bundles = registryOf(elevator(COLLECTION_BUNDLES_ELEVATOR).up(), engine)
		/** The collection's members, lowered beside the engine as the registry is. */
		const members = elevator(COLLECTION_MEMBERS_ELEVATOR).up()
		/** The `id` the application gave the panel. */
		const idPlugin = context.bundle?.get(TIdPlugin)
		const part = context.bundle?.get(TCollectionInitialPartPlugin)
		const initial = part?.prepared ? collectionInitialSourceOf(elevator) : undefined
		/** A prepared panel's gate: until acceptance the panel renders its prepared link. */
		const mount = initial ? part?.pluginMount : undefined

		/** The tab bound now. */
		let boundItem: ITabsItem | undefined
		/** The tab's context at the panel's facade; unbinding releases it. */
		let boundContext: TItemContext<ITabsItem, TTabsCollectionExtensions> | undefined
		/** The tab's link plugin the panel handed its `TIdPlugin` to. */
		let boundIds: TTabsItemIdsPlugin | undefined
		/** The context is accepted: subscribing to foreign buses is allowed. */
		let attached = false

		/**
		 * The panel's side: the application's `id`, else the one the tab wrote,
		 * and the link to the tab. Without a tab only the own `id` stays.
		 */
		const linkPanel = (): void => {
			if (mount && !mount.accepted) {
				const prepared = boundItem ? initial?.link(boundItem) : undefined

				mount.patch('aria', {
					id: idPlugin?.id ?? prepared?.panelId,
					'aria-labelledby': prepared?.tabId,
				})

				return
			}

			content.aria.add('id', idPlugin?.id ?? boundItem?.aria.get('aria-controls'))
			content.aria.add('aria-labelledby', boundItem?.aria.get('id'))
		}

		/** The tab's `aria-controls` no longer follows this panel: back to the formula. */
		const unlinkTab = (): void => {
			if (idPlugin) boundIds?.unbindPanel(idPlugin)

			boundIds = undefined
		}

		/**
		 * The tab's side: its link plugin points `aria-controls` to the panel's
		 * `id`. Only for an accepted panel, and only the plugin of the tab's
		 * current mount: a remounted tab has a new one.
		 */
		const linkTab = (): void => {
			const ids =
				idPlugin && attached && boundItem
					? bundles?.getByItem(boundItem)?.get(TTabsItemIdsPlugin)
					: undefined

			if (ids === boundIds) return

			unlinkTab()

			if (!idPlugin || !ids) return

			boundIds = ids
			ids.bindPanel(idPlugin)
		}

		/**
		 * The panel is bound to no tab. The facade is cleared before the context
		 * is released: the facade is read after teardown too, and reading a
		 * released context would recreate the adapters.
		 */
		const unbind = (): void => {
			if (attached) boundItem?.events.off('change:aria', linkPanel)

			unlinkTab()

			context.instance.clearContext()
			boundContext?.release()

			boundContext = undefined
			boundItem = undefined
		}

		/** Bind to a tab or to none: both write the panel's side. */
		const bind = (item: ITabsItem | undefined): void => {
			unbind()

			if (item) {
				boundContext = new TItemContext(item, extensions)
				boundItem = item

				if (attached) item.events.on('change:aria', linkPanel)
			}

			linkPanel()
			linkTab()

			// Last: the facade reports the activity change once the binding is in place
			if (boundContext) context.instance.setContext(boundContext)
		}

		const resolve = (): void => {
			const item = findByValue(engine, content.value)

			if (item !== boundItem) bind(item)
		}

		bind(findByValue(engine, content.value))

		context.events.on('attach', () => {
			part?.pluginMount?.accept()
			attached = true
			members?.add(adapter, context)

			// The tab found on assembly: subscribed now, and what it wrote since
			// is read after subscribing
			boundItem?.events.on('change:aria', linkPanel)
			idPlugin?.events.on('change:id', linkPanel)

			linkPanel()
			linkTab()

			resolve()

			// The panel may mount before its tab, and the tab's bundle may enter
			// the registry after the panel or again
			engine.extensions.plain.events.on('item:added', resolve)
			bundles?.events.on('bundle:registered', linkTab)
			content.events.on('change:value', resolve)
		})

		context.events.on('destroy', () => {
			engine.extensions.plain.events.off('item:added', resolve)
			bundles?.events.off('bundle:registered', linkTab)
			content.events.off('change:value', resolve)
			idPlugin?.events.off('change:id', linkPanel)

			members?.delete(adapter, context)
			unbind()
			attached = false

			// A prepared panel discarded before acceptance never wrote the model
			if (!mount || mount.accepted) {
				content.aria.remove('id')
				content.aria.remove('aria-labelledby')
			}
		})
	}
}
