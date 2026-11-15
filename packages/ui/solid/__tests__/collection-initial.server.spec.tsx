import { createRequire } from 'node:module'
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'solid-js/web'
import { Tabs, Tags } from '@soxa-ui/solid'
import { TTabs, TEvented, createEngineTabs } from '@soxa-ui/core'

const initial = {
	items: [
		{ value: 'a', text: 'A' },
		{ value: 'b', text: 'B', id: 'tab-b', _: { active: true } },
	],
	panels: [{ value: 'a' }, { value: 'b', id: 'panel-b' }],
}
describe('explicit initial source SSR', () => {
	it('preserves an external owner and releases all server mount subscriptions', () => {
		const owner = new TTabs()
		const engine = createEngineTabs({ owner, items: initial.items })
		const items = [...engine.extensions.batch.items]
		const buses = [
			engine.events,
			engine.getCore().driver.events,
			...Object.values(engine.extensions).map((extension) => extension?.events),
			...items.map((item) => item.events),
		].filter((bus) => bus instanceof TEvented)
		const tracked = buses.map((bus) => ({ on: vi.spyOn(bus, 'on'), off: vi.spyOn(bus, 'off') }))
		const before = items.map((item) => ({
			aria: item.aria.toObject(),
			closeAria: item.closeAria.toObject(),
			dataset: item.dataset.toObject(),
		}))
		try {
			const html = renderToString(() => (
				<Tabs
					initial={initial}
					engine={engine}
					content={<Tabs.Content initial={1}>Panel B</Tabs.Content>}
				/>
			))
			expect(html).toContain('Panel B')
			const live = tracked.reduce(
				(sum, { on, off }) =>
					sum +
					on.mock.calls.filter(
						([event, handler]) =>
							!off.mock.calls.some(([e, h]) => e === event && h === handler),
					).length,
				0,
			)
			expect({
				owner: engine.options.get('owner') === owner,
				items: engine.extensions.batch.items,
				attributes: items.map((item) => ({
					aria: item.aria.toObject(),
					closeAria: item.closeAria.toObject(),
					dataset: item.dataset.toObject(),
				})),
				live,
			}).toEqual({ owner: true, items, attributes: before, live: 0 })
		} finally {
			vi.restoreAllMocks()
		}
	})
	it.each([false, true])(
		'serializes the accepted composition before children, auto=%s',
		(automatic) => {
			const html = renderToString(() => (
				<Tabs
					initial={initial}
					content={
						<>
							<Tabs.Content initial={0}>A</Tabs.Content>
							<Tabs.Content initial={1}>B</Tabs.Content>
						</>
					}
				>
					{automatic ? undefined : (
						<>
							<div>
								<Tabs.Item initial={0} />
							</div>
							<Tabs.Item initial={1} />
						</>
					)}
				</Tabs>
			))
			const tabs = html.match(/<[^>]*role="tab"[^>]*>/g) ?? []
			expect(tabs).toHaveLength(2)
			expect(tabs[0]).toContain('tabindex="-1"')
			expect(tabs[1]).toContain('tabindex="0"')
			expect(tabs[1]).toContain('aria-controls="panel-b"')
			expect(tabs[1]).toContain('id="tab-b"')
			expect(html).toContain('aria-labelledby="tab-b"')
			expect(html).toContain('id="panel-b"')
		},
	)
	it('prepares Tags selection', () => {
		const html = renderToString(() => (
			<Tags
				mode="single"
				initial={{
					items: [
						{ value: 'a', text: 'A' },
						{ value: 'b', text: 'B', _: { selected: true } },
					],
				}}
			>
				<Tags.Item initial={0} />
				<Tags.Item initial={1} />
			</Tags>
		))
		const options = html.match(/<[^>]*role="option"[^>]*>/g) ?? []
		expect(options[0]).toContain('tabindex="-1"')
		expect(options[1]).toContain('tabindex="0"')
	})
})

function matrixSource(active: number) {
	return {
		items: [0, 1].map((value) => ({
			value,
			text: String(value),
			id: `matrix-tab-${value}`,
			_: { active: value === active },
		})),
		panels: [0, 1].map((value) => ({ value, id: `matrix-panel-${value}` })),
	}
}
// jsdom is already the test runtime dependency; keep its untyped Node boundary local.
const { JSDOM }: { JSDOM: new (html: string) => { window: { document: Document } } } =
	createRequire(import.meta.url)('jsdom')
function parse(html: string) {
	return new JSDOM(html).window.document
}
describe('initial source native SSR matrix', () => {
	it.each([0, 1, -1])('serializes active position %s before JavaScript', (active) => {
		const source = matrixSource(active)
		const root = parse(
			renderToString(() => (
				<Tabs
					initial={source}
					content={
						<>
							<Tabs.Content initial={0}>Zero</Tabs.Content>
							<Tabs.Content initial={1}>One</Tabs.Content>
						</>
					}
				/>
			)),
		)
		const tabs = [...root.querySelectorAll('[role=tab]')]
		expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual([
			String(active === 0),
			String(active === 1),
		])
		expect(root.querySelectorAll('[role=tab][tabindex="0"]')).toHaveLength(1)
		const panels = [...root.querySelectorAll('[role=tabpanel]')]
		expect(panels).toHaveLength(active < 0 ? 0 : 1)
		if (active >= 0) {
			expect(tabs[active].getAttribute('aria-controls')).toBe(panels[0].id)
			expect(panels[0].getAttribute('aria-labelledby')).toBe(tabs[active].id)
		}
	})
	it.each(['disabled', 'visible', 'rendered'])('respects initial %s', (field) => {
		const root = parse(
			renderToString(() => (
				<Tabs
					initial={{
						items: [
							{ text: 'A', id: 'excluded-tab', [field]: field === 'disabled' },
							{ text: 'B', id: 'available-tab' },
						],
					}}
				/>
			)),
		)
		expect(
			[...root.querySelectorAll('[role=tab][tabindex="0"]')].map((tab) => tab.textContent),
		).toEqual(['B'])
		if (field === 'disabled')
			expect(root.querySelector('#excluded-tab')?.getAttribute('data-disabled')).toBe('true')
		if (field === 'visible')
			expect(root.querySelector<HTMLElement>('.so-tabs-item')?.style.display).toBe('none')
		if (field === 'rendered') expect(root.querySelector('#excluded-tab')).toBeNull()
	})
	it('keeps duplicate and omitted values as distinct native identities', () => {
		const root = parse(
			renderToString(() => (
				<Tabs
					initial={{
						items: [
							{ text: 'A' },
							{ text: 'B', id: 'available-tab' },
							{ value: 'x', text: 'C' },
							{ value: 'x', text: 'D', _: { active: true } },
						],
					}}
				/>
			)),
		)
		const tabs = [...root.querySelectorAll('[role=tab]')]
		expect(tabs.map((tab) => tab.textContent)).toEqual(['A', 'B', 'C', 'D'])
		expect(new Set(tabs.map((tab) => tab.id)).size).toBe(4)
		expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '-1', '-1', '0'])
	})
	it('links a panel serialized before the native tab list', () => {
		const root = parse(
			renderToString(() => (
				<Tabs
					initial={matrixSource(1)}
					leading={<Tabs.Content initial={1}>Early</Tabs.Content>}
				/>
			)),
		)
		expect(root.querySelector('#matrix-tab-1')?.getAttribute('aria-controls')).toBe(
			'matrix-panel-1',
		)
		expect(root.querySelector('#matrix-panel-1')?.getAttribute('aria-labelledby')).toBe(
			'matrix-tab-1',
		)
	})
	it.each([0, 1])('isolates nested owners and skips inactive content, active=%s', (active) => {
		const entered = new Set<number>()
		const nested = {
			items: [{ value: 0, text: 'Nested', id: 'nested-tab', _: { active: true } }],
			panels: [{ value: 0, id: 'nested-panel' }],
		}
		function Nested(props: { index: number }) {
			entered.add(props.index)
			return (
				<Tabs
					initial={nested}
					content={<Tabs.Content initial={0}>Nested body</Tabs.Content>}
				/>
			)
		}
		const root = parse(
			renderToString(() => (
				<Tabs
					initial={matrixSource(active)}
					content={
						<>
							<Tabs.Content initial={0}>
								<Nested index={0} />
							</Tabs.Content>
							<Tabs.Content initial={1}>
								<Nested index={1} />
							</Tabs.Content>
						</>
					}
				/>
			)),
		)
		expect([...entered]).toEqual([active])
		expect(root.querySelectorAll('[role=tab]')).toHaveLength(3)
		expect(root.querySelector('#nested-panel')?.getAttribute('aria-labelledby')).toBe(
			'nested-tab',
		)
		expect(root.querySelector('#nested-tab')?.getAttribute('aria-controls')).toBe(
			'nested-panel',
		)
	})
})
