/**
 * TTabsPanels — the panels of one Tabs collection waiting for their tabs.
 *
 * A panel follows two facts of its collection: a tab with its `value` enters
 * (`item:added`), and the bundle of its tab enters the registry
 * (`bundle:registered`), on the tab's mount and every remount. Each panel used
 * to listen to every such event of the collection, so N panels over N tabs
 * woke N² times while the tabs mounted. Here the collection is listened to
 * once, and only the panels of that `value` or that tab are woken.
 *
 * One per bundle registry — the owner's mount — or per engine for an owner
 * without one. The subscriptions live while some panel is watching.
 */

import type { ITabsItem, TInsertEvent, TTabsCollection } from '@soxa-ui/core'
import type { IPluginBundle, TCollectionBundlesPlugin } from '@soxa-ui/plugins'

type TWake = () => void

const instances = new WeakMap<object, TTabsPanels>()

export class TTabsPanels {
	private readonly _byValue = new Map<unknown, Set<TWake>>()
	private readonly _byTab = new Map<object, Set<TWake>>()
	private _watchers = 0

	private constructor(
		private readonly _engine: TTabsCollection,
		private readonly _bundles: TCollectionBundlesPlugin | undefined,
	) {}

	/** The panels of this collection mount; the registry already belongs to the engine. */
	static of(engine: TTabsCollection, bundles: TCollectionBundlesPlugin | undefined): TTabsPanels {
		const key = bundles ?? engine
		let panels = instances.get(key)

		if (!panels) {
			panels = new TTabsPanels(engine, bundles)
			instances.set(key, panels)
		}

		return panels
	}

	/** Wake when a tab with this `value` enters the collection. */
	watchValue(value: unknown, wake: TWake): () => void {
		return this._watch(this._byValue, value, wake)
	}

	/** Wake when this tab's bundle enters the registry. */
	watchTab(tab: ITabsItem, wake: TWake): () => void {
		return this._watch(this._byTab, tab, wake)
	}

	private _watch<K>(map: Map<K, Set<TWake>>, key: K, wake: TWake): () => void {
		const wakes = map.get(key) ?? new Set<TWake>()

		map.set(key, wakes)
		wakes.add(wake)

		if (this._watchers++ === 0) this._listen()

		return () => {
			if (!wakes.delete(wake)) return

			if (wakes.size === 0 && map.get(key) === wakes) map.delete(key)
			if (--this._watchers === 0) this._unlisten()
		}
	}

	private _listen(): void {
		this._engine.extensions.plain.events.on('item:added', this._added)
		this._bundles?.events.on('bundle:registered', this._registered)
	}

	private _unlisten(): void {
		this._engine.extensions.plain.events.off('item:added', this._added)
		this._bundles?.events.off('bundle:registered', this._registered)
	}

	private readonly _added = (e: TInsertEvent<ITabsItem>): void => {
		this._wake(this._byValue.get(e.item.value))
	}

	private readonly _registered = ({ bundle }: { bundle: IPluginBundle }): void => {
		const tab = bundle.getInstance<object>()

		if (tab) this._wake(this._byTab.get(tab))
	}

	/** A copy: a woken panel may rebind and change the watchers. */
	private _wake(wakes: Set<TWake> | undefined): void {
		if (wakes) for (const wake of [...wakes]) wake()
	}
}
