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

type TPingEvents = { ping: (value: number) => void }

class TListeningPlugin extends TBasePlugin {
	readonly received: number[] = []

	override install(ctx: IPluginContext, options?: unknown): void {
		super.install(ctx, options)

		const owner = ctx.getInstance<{ events: TEvented<TPingEvents> }>()

		this._listenTo(owner?.events, 'ping', (value) => this.received.push(value))
	}
}

function listening(bundle: TPluginBundle): TListeningPlugin {
	const plugin = bundle.get(TListeningPlugin)

	if (!plugin) throw new Error('Expected installed plugin')

	return plugin
}

describe('accepted plugin mount', () => {
	it('installs foreign listeners once at acceptance and removes them at destruction', () => {
		const owner = { events: new TEvented<TPingEvents>() }
		const on = vi.spyOn(owner.events, 'on')
		const off = vi.spyOn(owner.events, 'off')
		const pluginMount = new TPluginMount()
		const bundle = new TPluginBundle(owner, undefined, undefined, pluginMount).use(
			TListeningPlugin,
		)
		const plugin = listening(bundle)

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

	it('cancels discarded work without subscribing, even if the gate is accepted later', () => {
		const owner = { events: new TEvented<TPingEvents>() }
		const on = vi.spyOn(owner.events, 'on')
		const pluginMount = new TPluginMount()
		const bundle = new TPluginBundle(owner, undefined, undefined, pluginMount).use(
			TListeningPlugin,
		)

		bundle.destroy()
		pluginMount.accept()

		expect(on).not.toHaveBeenCalled()
	})

	it('keeps concurrent mounts independent and immediately accepts later effects', () => {
		const owner = { events: new TEvented<TPingEvents>() }
		const accepted = new TPluginMount()

		accepted.accept()

		const speculative = new TPluginMount()
		const a = new TPluginBundle(owner, undefined, undefined, accepted).use(TListeningPlugin)
		const b = new TPluginBundle(owner, undefined, undefined, speculative).use(TListeningPlugin)

		owner.events.emit('ping', 1)

		expect(listening(a).received).toEqual([1])
		expect(listening(b).received).toEqual([])

		b.destroy()
		owner.events.emit('ping', 2)

		expect(listening(a).received).toEqual([1, 2])

		a.destroy()
	})

	it('keeps no deferred effect once the mount is accepted', () => {
		const pluginMount = new TPluginMount()
		const effect = vi.fn()

		pluginMount.defer(effect)
		pluginMount.accept()

		expect(pluginMount.accepted).toBe(true)
		expect(effect).toHaveBeenCalledOnce()

		// Accepted: later effects run at once instead of queueing
		pluginMount.defer(effect)

		expect(effect).toHaveBeenCalledTimes(2)
	})

	it('exposes the engine before HTML while delaying its foreign bindings', () => {
		const engine = createEngineTabs()
		const on = vi.spyOn(engine.extensions.plain.events, 'on')
		const pluginMount = new TPluginMount()
		const bundle = new TPluginBundle({}, undefined, undefined, pluginMount).use(
			TCollectionBundlesPlugin,
		)
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

	it('merges patches by field and drops them before the deferred effects run', () => {
		const mount = new TPluginMount()
		const seen: unknown[] = []

		mount.patch('aria', { id: 'tab' })
		mount.patch('aria', { 'aria-controls': 'panel' })
		mount.patch('closeAria', { 'aria-label': 'Close' })
		mount.defer(() => seen.push(mount.patches))

		expect(mount.patches).toEqual({
			aria: { id: 'tab', 'aria-controls': 'panel' },
			closeAria: { 'aria-label': 'Close' },
		})

		mount.accept()

		expect(seen).toEqual([{}])
		expect(() => mount.patch('aria', { id: 'late' })).toThrow()
	})

	it('names a prepared mount in its patch and moves the names into the model on acceptance', () => {
		const item = new TTabsItem({ text: 'Account' })
		const before = item.closeAria.toObject()
		const first = new TPluginMount()
		const second = new TPluginMount()
		const a = new TPluginBundle(item, 'a', new TLocaleSource(enUS), first).use(
			TTabsItemNamesPlugin,
		)
		const b = new TPluginBundle(item, 'b', new TLocaleSource(ruRU), second).use(
			TTabsItemNamesPlugin,
		)

		expect(first.patches.closeAria?.['aria-label']).toBe('Close Account')
		expect(second.patches.closeAria?.['aria-label']).not.toBe('Close Account')
		expect(item.closeAria.toObject()).toEqual(before)

		first.accept()

		expect(item.closeAria.get('aria-label')).toBe('Close Account')

		item.text = 'Privacy'

		expect(item.closeAria.get('aria-label')).toBe('Close Privacy')
		// A mount waiting for acceptance does not follow the shared item yet
		expect(second.patches.closeAria?.['aria-label']).not.toContain('Privacy')

		second.accept()

		expect(item.closeAria.get('aria-label')).toContain('Privacy')
		expect(item.closeAria.get('aria-label')).not.toBe('Close Privacy')

		a.destroy()
		b.destroy()
	})
})
