import { describe, it, expect, afterEach } from 'vitest'
import { h, nextTick } from 'vue'
import { Tabs, Tags } from '@soxa-ui/vue'
import { hydrate, unmountHydrated } from './hydrate'

afterEach(unmountHydrated)
const initial = {
	items: [
		{ value: 'a', text: 'A' },
		{ value: 'b', text: 'B', id: 'tab-b', _: { active: true } },
	],
	panels: [{ value: 'a' }, { value: 'b', id: 'panel-b' }],
}
function check(root: Element) {
	const tabs = [...root.querySelectorAll('[role=tab]')]
	expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '0'])
	expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['false', 'true'])
	const panel = root.querySelector('[role=tabpanel]')
	expect(panel?.id).toBe('panel-b')
	expect(tabs[1].id).toBe('tab-b')
	expect(tabs[1].getAttribute('aria-controls')).toBe(panel?.id)
	expect(panel?.getAttribute('aria-labelledby')).toBe(tabs[1].id)
}
describe('explicit initial source', () => {
	it.each([false, true])(
		'SSR and hydration use one declared composition, auto=%s',
		async (automatic) => {
			const { server, client, warnings } = await hydrate(() =>
				h(
					Tabs,
					{ initial },
					{
						...(automatic
							? {}
							: {
									default: () => [
										h('div', [h(Tabs.Item, { initial: 0 })]),
										h(Tabs.Item, { initial: 1 }),
									],
								}),
						content: () => [
							h(Tabs.Content, { initial: 0 }, () => 'A'),
							h(Tabs.Content, { initial: 1 }, () => 'B'),
						],
					},
				),
			)
			check(server)
			await nextTick()
			check(client)
			expect(warnings).toEqual([])
		},
	)
	it('prepares Tags through the same generic source', async () => {
		const source = {
			items: [
				{ value: 'a', text: 'A' },
				{ value: 'b', text: 'B', _: { selected: true } },
			],
		}
		const { server, client, warnings } = await hydrate(() =>
			h(Tags, { initial: source, mode: 'single' }, () => [
				h(Tags.Item, { initial: 0 }),
				h(Tags.Item, { initial: 1 }),
			]),
		)
		expect(
			[...server.querySelectorAll('[role=option]')].map((tab) =>
				tab.getAttribute('tabindex'),
			),
		).toEqual(['-1', '0'])
		await nextTick()
		expect(
			[...client.querySelectorAll('[role=option]')].map((tab) =>
				tab.getAttribute('tabindex'),
			),
		).toEqual(['-1', '0'])
		expect(warnings).toEqual([])
	})
})
