import { describe, expect, it, vi } from 'vitest'
import { TEvented, TTabsItem, createEngineTabs } from '@soxa-ui/core'
import {
	TBasePlugin,
	TPluginBundle,
	TPluginMount,
	TCollectionBundlesPlugin,
	TTabsItemNamesPlugin,
	TLocaleSource,
	enUS,
	ruRU,
} from '../src'
import type { IPluginContext } from '../src'

class TListeningPlugin extends TBasePlugin {
	readonly received: number[] = []
	override install(ctx: IPluginContext, options?: unknown): void {
		super.install(ctx, options)
		const owner = ctx.getInstance<{ events: TEvented<{ ping: (value: number) => void }> }>()
		this._listenTo(owner?.events, 'ping', (value) => this.received.push(value))
	}
}

describe('accepted plugin mount', () => {
	it('installs foreign listeners once at acceptance and removes them at destruction', () => {
		const owner = { events: new TEvented<{ ping: (value: number) => void }>() }
		const on = vi.spyOn(owner.events, 'on')
		const off = vi.spyOn(owner.events, 'off')
		const pluginMount = new TPluginMount()
		const bundle = new TPluginBundle(owner).use(TListeningPlugin, { pluginMount })
		const plugin = bundle.get(TListeningPlugin)
		if (!plugin) throw new Error('Expected installed plugin')
		expect(on).not.toHaveBeenCalled()
		owner.events.emit('ping', 1)
		pluginMount.accept()
		pluginMount.accept()
		owner.events.emit('ping', 2)
		expect(plugin.received).toEqual([2])
		expect(on).toHaveBeenCalledTimes(1)
		bundle.destroy()
		owner.events.emit('ping', 3)
		expect(off.mock.calls).toEqual(on.mock.calls)
		expect(plugin.received).toEqual([2])
	})

	it('cancels discarded work without subscribing, even if another plugin accepts the scope', () => {
		const owner = { events: new TEvented<{ ping: (value: number) => void }>() }
		const on = vi.spyOn(owner.events, 'on')
		const pluginMount = new TPluginMount()
		const bundle = new TPluginBundle(owner).use(TListeningPlugin, { pluginMount })
		bundle.destroy()
		pluginMount.accept()
		expect(on).not.toHaveBeenCalled()
	})

	it('keeps concurrent mounts independent and immediately accepts later effects', () => {
		const owner = { events: new TEvented<{ ping: (value: number) => void }>() }
		const accepted = new TPluginMount()
		accepted.accept()
		const speculative = new TPluginMount()
		const a = new TPluginBundle(owner).use(TListeningPlugin, { pluginMount: accepted })
		const b = new TPluginBundle(owner).use(TListeningPlugin, { pluginMount: speculative })
		owner.events.emit('ping', 1)
		expect(a.get(TListeningPlugin)?.received).toEqual([1])
		expect(b.get(TListeningPlugin)?.received).toEqual([])
		b.destroy()
		owner.events.emit('ping', 2)
		expect(a.get(TListeningPlugin)?.received).toEqual([1, 2])
		a.destroy()
	})

	it('exposes the engine before HTML while delaying its foreign bindings', () => {
		const engine = createEngineTabs()
		const on = vi.spyOn(engine.extensions.plain.events, 'on')
		const pluginMount = new TPluginMount()
		const bundle = new TPluginBundle({}).use(TCollectionBundlesPlugin, { pluginMount })
		const registry = bundle.get(TCollectionBundlesPlugin)
		if (!registry) throw new Error('Expected installed plugin')
		const bound = vi.fn()
		registry.events.on('engine:bound', bound)
		registry.bindEngine(engine)
		expect(registry.engine).toBe(engine)
		expect(on).not.toHaveBeenCalled()
		expect(bound).not.toHaveBeenCalled()
		pluginMount.accept()
		expect(bound).toHaveBeenCalledExactlyOnceWith(engine)
		expect(on).toHaveBeenCalledTimes(2)
		bundle.destroy()
	})

	it('computes mount-local close names without mutating a shared item before or after acceptance', () => {
		const item = new TTabsItem({ text: 'Account' })
		const before = item.closeAria.toObject()
		const english = new TLocaleSource(enUS)
		const russian = new TLocaleSource(ruRU)
		const first = new TPluginMount()
		const second = new TPluginMount()
		const a = new TPluginBundle(item, 'a', english).use(TTabsItemNamesPlugin, {
			pluginMount: first,
		})
		const b = new TPluginBundle(item, 'b', russian).use(TTabsItemNamesPlugin, {
			pluginMount: second,
		})
		const namesA = a.get(TTabsItemNamesPlugin)
		if (!namesA) throw new Error('Expected installed plugin')
		const namesB = b.get(TTabsItemNamesPlugin)
		if (!namesB) throw new Error('Expected installed plugin')
		expect(namesA.getSnapshot().closeAria?.['aria-label']).toBe('Close Account')
		expect(namesB.getSnapshot().closeAria?.['aria-label']).not.toBe('Close Account')
		expect(item.closeAria.toObject()).toEqual(before)
		first.accept()
		const changed = vi.fn()
		const stop = namesA.subscribe(changed)
		item.text = 'Privacy'
		expect(namesA.getSnapshot().closeAria?.['aria-label']).toBe('Close Privacy')
		expect(namesB.getSnapshot().closeAria?.['aria-label']).not.toContain('Privacy')
		second.accept()
		expect(namesB.getSnapshot().closeAria?.['aria-label']).toContain('Privacy')
		expect(item.closeAria.toObject()).toEqual(before)
		expect(changed).toHaveBeenCalledOnce()
		stop()
		a.destroy()
		b.destroy()
	})
})
