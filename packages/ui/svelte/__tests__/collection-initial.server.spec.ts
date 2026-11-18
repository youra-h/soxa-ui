import { afterEach, describe, it, expect, vi } from 'vitest'
import { TTabs, TEvented, createEngineTabs } from '@soxa-ui/core'
import { render } from 'svelte/server'
import Example from './CollectionInitial.test.svelte'
import Matrix from './CollectionInitialMatrix.test.svelte'
import type { ICollectionInitialSource } from '@soxa-ui/svelte'

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

function matrix(
	source: ICollectionInitialSource,
	props: {
		automatic?: boolean
		before?: boolean
		tags?: boolean
		nested?: boolean
		discover?: () => void
	} = {},
) {
	return render(Matrix, { props: { source, ...props } }).body
}
function parts(body: string, role: string) {
	return (body.match(/<[^>]+>/g) ?? [])
		.filter((tag) => tag.includes('role="' + role + '"'))
		.map((tag) =>
			Object.fromEntries(
				[...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]),
			),
		)
}

describe('initial source native SSR matrix', () => {
	it.each([0, 1, -1])('serializes active item %s with one tab stop', (active) => {
		const body = matrix({
			items: [0, 1].map((value) => ({
				value,
				text: String(value),
				_: { active: value === active },
			})),
			panels: [{ value: 0 }, { value: 1 }],
		})
		const tabs = parts(body, 'tab')
		expect(tabs.map((tab) => tab['aria-selected'])).toEqual([
			String(active === 0),
			String(active === 1),
		])
		expect(tabs.filter((tab) => tab.tabindex === '0')).toHaveLength(1)
		expect(parts(body, 'tabpanel')).toHaveLength(active < 0 ? 0 : 1)
	})
	it.each(['disabled', 'visible', 'rendered'])('uses the engine %s policy', (field) => {
		const body = matrix(
			{
				items: [
					{ value: 'a', text: 'A', id: 'excluded-tab', [field]: field === 'disabled' },
					{ value: 'b', text: 'B', id: 'available-tab' },
				],
			},
			{ automatic: true },
		)
		const stops = parts(body, 'tab').filter((tab) => tab.tabindex === '0')
		expect(stops).toHaveLength(1)
		expect(stops[0].id).toBe('available-tab')
		const excluded = parts(body, 'tab').find((tab) => tab.id === 'excluded-tab')
		if (field === 'disabled') expect(excluded?.['data-disabled']).toBe('true')
		if (field === 'visible')
			expect(body).toMatch(/class="so-tabs-item[^"]*" style="[^"]*display: none"/)
		if (field === 'rendered') expect(excluded).toBeUndefined()
	})
	it.each([false, true])(
		'keeps duplicate and undefined models distinct, auto=%s',
		(automatic) => {
			const body = matrix(
				{
					items: [
						{ text: 'A' },
						{ text: 'B' },
						{ value: 'x', text: 'C' },
						{ value: 'x', text: 'D', _: { active: true } },
					],
				},
				{ automatic },
			)
			const tabs = parts(body, 'tab')
			expect(tabs).toHaveLength(4)
			expect(new Set(tabs.map((tab) => tab.id)).size).toBe(4)
			expect(tabs.map((tab) => tab.tabindex)).toEqual(['-1', '-1', '-1', '0'])
			for (const text of ['A', 'B', 'C', 'D']) expect(body).toContain('>' + text + '<')
		},
	)
	it.each([false, true])('links custom ids when panels precede tabs=%s', (before) => {
		const body = matrix(
			{
				items: [
					{ value: 'a', text: 'A' },
					{ value: 'b', text: 'B', id: 'matrix-tab', _: { active: true } },
				],
				panels: [{ value: 'a' }, { value: 'b', id: 'matrix-panel' }],
			},
			{ before },
		)
		const tabs = parts(body, 'tab'),
			panels = parts(body, 'tabpanel')
		expect(tabs[1].id).toBe('matrix-tab')
		expect(tabs[1]['aria-controls']).toBe('matrix-panel')
		expect(panels).toHaveLength(1)
		expect(panels[0].id).toBe('matrix-panel')
		expect(panels[0]['aria-labelledby']).toBe('matrix-tab')
		const panelPosition = body.indexOf('id="matrix-panel"')
		const tabPosition = body.indexOf('id="matrix-tab"')
		expect(before ? panelPosition < tabPosition : panelPosition > tabPosition).toBe(true)
	})
	it.each([0, 1, -1])('prepares Tags selected item %s', (selected) => {
		const body = matrix(
			{
				items: [0, 1].map((value) => ({
					value,
					text: String(value),
					_: { selected: value === selected },
				})),
			},
			{ tags: true },
		)
		const options = parts(body, 'option')
		expect(options.map((item) => item['aria-selected'])).toEqual([
			String(selected === 0),
			String(selected === 1),
		])
		expect(options.filter((item) => item.tabindex === '0')).toHaveLength(1)
	})
	it('keeps nested owners separate and does not invoke inactive snippets for discovery', () => {
		const discover = vi.fn()
		const body = matrix(
			{
				items: [
					{ value: 'a', text: 'A' },
					{ value: 'b', text: 'B', _: { active: true } },
				],
				panels: [{ value: 'a' }, { value: 'b' }],
			},
			{ nested: true, discover },
		)
		expect(discover).not.toHaveBeenCalled()
		expect(parts(body, 'tab')).toHaveLength(3)
		expect(body).not.toContain('Hidden')
		expect(parts(body, 'tabpanel').some((panel) => panel.id === 'nested-panel')).toBe(true)
	})
})
