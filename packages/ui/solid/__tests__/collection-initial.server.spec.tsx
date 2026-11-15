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
