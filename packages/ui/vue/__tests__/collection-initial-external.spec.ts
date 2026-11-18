import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createEngineTabs, TEvented, TTabs } from '@soxa-ui/core'
import { Tabs } from '@soxa-ui/vue'

const initial = {
	items: [
		{ value: 'a', text: 'A' },
		{ value: 'b', text: 'B', _: { active: true } },
	],
	panels: [{ value: 'a' }, { value: 'b' }],
}
describe('initial external engine on Vue server', () => {
	it('does not keep mount listeners or replace its external owner after server rendering', async () => {
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
			const html = await renderToString(
				createSSRApp({
					render: () =>
						h(
							Tabs,
							{ initial, engine },
							{
								content: () =>
									initial.panels.map((_, ordinal) =>
										h(
											Tabs.Content,
											{ initial: ordinal },
											() => `Panel ${ordinal}`,
										),
									),
							},
						),
				}),
			)
			expect(html).toContain('Panel 1')
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
})
