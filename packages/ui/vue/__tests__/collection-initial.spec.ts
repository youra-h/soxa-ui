import { describe, it, expect, afterEach } from 'vitest'
import { h, nextTick, createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
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
async function serverRoot(view: () => ReturnType<typeof h>) {
	const root = document.createElement('div')
	root.innerHTML = await renderToString(createSSRApp({ render: view }))
	return root
}
describe('initial source native SSR matrix', () => {
	it.each([0, 1, -1])('serializes active position %s before JavaScript', async (active) => {
		const source = matrixSource(active)
		const root = await serverRoot(() =>
			h(
				Tabs,
				{ initial: source },
				{
					content: () =>
						source.panels.map((_, index) =>
							h(Tabs.Content, { initial: index }, () => String(index)),
						),
				},
			),
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
	it.each(['disabled', 'visible', 'rendered'])('respects initial %s', async (field) => {
		const root = await serverRoot(() =>
			h(Tabs, {
				initial: {
					items: [
						{ text: 'A', id: 'excluded-tab', [field]: field === 'disabled' },
						{ text: 'B' },
					],
				},
			}),
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
	it('keeps duplicate and omitted values as distinct native identities', async () => {
		const root = await serverRoot(() =>
			h(Tabs, {
				initial: {
					items: [
						{ text: 'A' },
						{ text: 'B', id: 'available-tab' },
						{ value: 'x', text: 'C' },
						{ value: 'x', text: 'D', _: { active: true } },
					],
				},
			}),
		)
		const tabs = [...root.querySelectorAll('[role=tab]')]
		expect(tabs.map((tab) => tab.textContent)).toEqual(['A', 'B', 'C', 'D'])
		expect(new Set(tabs.map((tab) => tab.id)).size).toBe(4)
		expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '-1', '-1', '0'])
	})
	it('links a panel serialized before the native tab list', async () => {
		const root = await serverRoot(() =>
			h(
				Tabs,
				{ initial: matrixSource(1) },
				{ leading: () => h(Tabs.Content, { initial: 1 }, () => 'Early') },
			),
		)
		expect(root.querySelector('#matrix-tab-1')?.getAttribute('aria-controls')).toBe(
			'matrix-panel-1',
		)
		expect(root.querySelector('#matrix-panel-1')?.getAttribute('aria-labelledby')).toBe(
			'matrix-tab-1',
		)
	})
	it.each([0, 1])(
		'isolates nested owners and skips inactive content, active=%s',
		async (active) => {
			const entered = new Set<number>()
			const nested = {
				items: [{ value: 0, text: 'Nested', id: 'nested-tab', _: { active: true } }],
				panels: [{ value: 0, id: 'nested-panel' }],
			}
			const root = await serverRoot(() =>
				h(
					Tabs,
					{ initial: matrixSource(active) },
					{
						content: () =>
							[0, 1].map((index) =>
								h(Tabs.Content, { initial: index }, () => {
									entered.add(index)
									return h(
										Tabs,
										{ initial: nested },
										{
											content: () =>
												h(
													Tabs.Content,
													{ initial: 0 },
													() => 'Nested body',
												),
										},
									)
								}),
							),
					},
				),
			)
			expect([...entered]).toEqual([active])
			expect(root.querySelectorAll('[role=tab]')).toHaveLength(3)
			expect(root.querySelector('#nested-panel')?.getAttribute('aria-labelledby')).toBe(
				'nested-tab',
			)
			expect(root.querySelector('#nested-tab')?.getAttribute('aria-controls')).toBe(
				'nested-panel',
			)
		},
	)
})
