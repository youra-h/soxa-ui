import { afterEach, describe, it, expect, vi } from 'vitest'
import { TTabs, TEvented, createEngineTabs } from '@soxa-ui/core'
import { render } from 'svelte/server'
import Example from './CollectionInitial.test.svelte'

afterEach(() => vi.restoreAllMocks())

describe('explicit initial source SSR', () => {
	it.each([false, true])('serializes the complete composition, auto=%s', (automatic) => {
		const { body } = render(Example, { props: { automatic } })
		const tabs = body.match(/<[^>]*role="tab"[^>]*>/g) ?? []
		expect(tabs).toHaveLength(2)
		expect(tabs[0]).toContain('tabindex="-1"')
		expect(tabs[1]).toContain('tabindex="0"')
		expect(tabs[1]).toContain('aria-controls="panel-b"')
		expect(tabs[1]).toContain('id="tab-b"')
		expect(body).toContain('aria-labelledby="tab-b"')
		expect(body).toContain('id="panel-b"')
	})
	it('prepares Tags selection', () => {
		const { body } = render(Example, { props: { tags: true } })
		const options = body.match(/<[^>]*role="option"[^>]*>/g) ?? []
		expect(options[0]).toContain('tabindex="-1"')
		expect(options[1]).toContain('tabindex="0"')
	})
})

it('leaves an external engine unchanged after server rendering', () => {
	const engine = createEngineTabs()
	engine.extensions.batch.set([
		{ value: 'a', text: 'A' },
		{ value: 'b', text: 'B', _: { active: true } },
	])
	engine.options.set({ owner: new TTabs() })
	const before = engine.options.get('owner')
	const buses = [
		engine.events,
		engine.getCore().driver.events,
		...Object.values(engine.extensions).map((x) => x?.events),
		...engine.extensions.batch.items.map((x) => x.events),
	].filter((x): x is TEvented<any> => x instanceof TEvented)
	const counts = buses.map((bus) => {
		const on = bus.on.bind(bus),
			off = bus.off.bind(bus),
			listen = bus.listen.bind(bus),
			unlisten = bus.unlisten.bind(bus),
			use = bus.use.bind(bus)
		const events = new Map<unknown, Set<unknown>>()
		const listeners = new Set<unknown>()
		let middleware = 0
		vi.spyOn(bus, 'on').mockImplementation((event, handler) => {
			const handlers = events.get(event) ?? new Set<unknown>()
			handlers.add(handler)
			events.set(event, handlers)
			on(event, handler)
		})
		vi.spyOn(bus, 'off').mockImplementation((event, handler) => {
			events.get(event)?.delete(handler)
			off(event, handler)
		})
		vi.spyOn(bus, 'listen').mockImplementation((handler) => {
			listeners.add(handler)
			listen(handler)
		})
		vi.spyOn(bus, 'unlisten').mockImplementation((handler) => {
			listeners.delete(handler)
			unlisten(handler)
		})
		vi.spyOn(bus, 'use').mockImplementation((handler) => {
			middleware++
			const stop = use(handler)
			return () => {
				middleware--
				stop()
			}
		})
		return () =>
			middleware +
			listeners.size +
			[...events.values()].reduce((sum, handlers) => sum + handlers.size, 0)
	})

	const items = engine.extensions.batch.items
	const metadata = items.map((item) => ({ ...engine.extensions.meta.get(item) }))
	const aria = items.map((item) => item.aria.toObject())
	const closeAria = items.map((item) => item.closeAria.toObject())
	expect(render(Example, { props: { engine } }).body).toContain('panel-b')
	expect(engine.options.get('owner')).toBe(before)
	expect(counts.reduce((sum, count) => sum + count(), 0)).toBe(0)
	expect(engine.extensions.batch.items).toEqual(items)
	expect(items.map((item) => ({ ...engine.extensions.meta.get(item) }))).toEqual(metadata)
	expect(items.map((item) => item.aria.toObject())).toEqual(aria)
	expect(items.map((item) => item.closeAria.toObject())).toEqual(closeAria)
})
