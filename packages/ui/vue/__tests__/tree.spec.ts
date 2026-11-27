import { mount } from '@vue/test-utils'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
import type { TTreeItem } from '@soxa-ui/core'
import { Tree } from '../src'

const items = [
	{
		value: 'accounts',
		text: 'Accounts',
		children: [
			{ value: 'acme', text: 'Acme' },
			{ value: 'globex', text: 'Globex' },
		],
	},
	{ value: 'support', text: 'Support' },
]

describe('Tree', () => {
	it('renders groups and independent icon slots on the server', async () => {
		const html = await renderToString(
			createSSRApp({
				render: () =>
					h(
						Tree,
						{
							items,
							expanded: ['accounts'],
							mode: 'multiple',
							value: ['acme'],
							'aria-label': 'Sections',
						},
						{
							'item-icon': ({ item }: { item: TTreeItem }) =>
								h('span', { 'data-icon': item.value }),
							'item-indicator-icon': ({ expanded }: { expanded: boolean }) =>
								h('span', { 'data-indicator': expanded }),
						},
					),
			}),
		)

		expect(html).toContain('role="tree"')
		expect(html).toContain('role="group"')
		expect(html).toContain('aria-expanded="true"')
		expect(html).toContain('aria-level="2"')
		expect(html).toContain('aria-posinset="2"')
		expect(html).toContain('aria-selected="true"')
		expect(html).toContain('data-icon="acme"')
		expect(html).toContain('data-indicator="true"')
		expect(html.match(/tabindex="0"/g)).toHaveLength(1)
	})

	it('navigates visible rows and returns focus on external collapse', async () => {
		const wrapper = mount(Tree, { attachTo: document.body, props: { items, mode: 'multiple' } })

		try {
			const branch = wrapper.get('[role="treeitem"]')

			await vi.waitFor(async () => {
				await branch.trigger('keydown', { key: 'ArrowRight' })
				expect(branch.attributes('aria-expanded')).toBe('true')
			})

			const child = wrapper.findAll('[role="treeitem"]')[1]

			await branch.trigger('keydown', { key: 'ArrowRight' })
			await vi.waitFor(() => expect(document.activeElement).toBe(child.element))

			await child.trigger('keydown', { key: ' ' })
			expect(child.attributes('aria-selected')).toBe('true')

			await child.trigger('keydown', { key: 'g' })
			const sibling = wrapper.findAll('[role="treeitem"]')[2]

			await vi.waitFor(() => expect(document.activeElement).toBe(sibling.element))

			await wrapper.setProps({ expanded: [] })
			await vi.waitFor(() => expect(document.activeElement).toBe(branch.element))
			expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(2)
			expect(wrapper.findAll('[tabindex="0"]')).toHaveLength(1)
		} finally {
			wrapper.unmount()
		}
	})

	it('loads a deferred branch once and exposes loading state', async () => {
		let complete: (value: typeof items) => void = () => {}
		const loadChildren = vi.fn(
			() =>
				new Promise<typeof items>((resolve) => {
					complete = resolve
				}),
		)
		const wrapper = mount(Tree, {
			attachTo: document.body,
			props: {
				items: [{ value: 'deferred', text: 'Deferred', hasChildren: true }],
				loadChildren,
			},
		})

		try {
			const branch = wrapper.get('[role="treeitem"]')

			await vi.waitFor(async () => {
				await branch.trigger('keydown', { key: 'ArrowRight' })
				expect(loadChildren).toHaveBeenCalledOnce()
			})

			expect(branch.attributes('aria-busy')).toBe('true')
			await branch.trigger('keydown', { key: 'ArrowRight' })
			expect(loadChildren).toHaveBeenCalledOnce()
			complete(items)

			await vi.waitFor(() => expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(3))
			expect(branch.attributes('aria-busy')).toBeUndefined()
		} finally {
			wrapper.unmount()
		}
	})
})
