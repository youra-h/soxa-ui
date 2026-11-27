import { mount } from '@vue/test-utils'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
import { createEngine } from '@soxa-ui/core'
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
	it('completes an external engine and forwards the Tree style to its rows', async () => {
		const engine = createEngine()
		const wrapper = mount(Tree, {
			props: { engine, items, expanded: ['accounts'], size: 'lg', variant: 'danger' },
		})

		try {
			expect(engine.has('tree')).toBe(true)
			expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(4)
			const row = wrapper.get('[role="group"] .so-tree-item__row')
			expect(row.classes()).toEqual(
				expect.arrayContaining(['so-button--size-lg', 'so-button--variant-danger']),
			)

			await wrapper.setProps({ size: 'sm', variant: 'brand' })
			expect(row.classes()).toEqual(
				expect.arrayContaining(['so-button--size-sm', 'so-button--variant-brand']),
			)
		} finally {
			wrapper.unmount()
		}
	})

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

	it.each(['single', 'multiple'] as const)(
		'keeps branch disclosure and selection independent in %s mode',
		async (mode) => {
			const wrapper = mount(Tree, {
				attachTo: document.body,
				props: { items, mode, indicator: 'start' },
			})

			try {
				const branch = wrapper.get('[aria-expanded]')
				const label = branch.get('.so-button__text')
				const arrow = branch.get('.so-tree-item__chevron')
				const mark = branch.get('.so-tree-item__selection-indicator')
				expect(mark.element.previousElementSibling).toBe(arrow.element.parentElement)
				expect(mark.find('svg').exists()).toBe(false)

				await vi.waitFor(async () => {
					await arrow.trigger('click')
					expect(branch.attributes('aria-expanded')).toBe('true')
				})
				expect(branch.attributes('aria-selected')).toBe('false')

				await label.trigger('click')
				expect(branch.attributes('aria-expanded')).toBe('true')
				expect(branch.attributes('aria-selected')).toBe('true')
				expect(mark.find('svg').exists()).toBe(true)

				await arrow.trigger('click')
				expect(branch.attributes('aria-expanded')).toBe('false')
				expect(branch.attributes('aria-selected')).toBe('true')

				await label.trigger('click')
				expect(branch.attributes('aria-expanded')).toBe('false')
				expect(branch.attributes('aria-selected')).toBe('false')

				await branch.trigger('keydown', { key: 'Enter' })
				expect(branch.attributes('aria-expanded')).toBe('false')
				expect(branch.attributes('aria-selected')).toBe('true')

				await wrapper.setProps({ mode: 'none' })
				expect(branch.find('.so-tree-item__selection-indicator').exists()).toBe(false)
			} finally {
				wrapper.unmount()
			}
		},
	)

	it('highlights the last activated row in none mode independently of focus and selection', async () => {
		const wrapper = mount(Tree, { attachTo: document.body, props: { items, mode: 'none' } })

		try {
			const branch = wrapper.get('[aria-expanded]')
			await vi.waitFor(async () => {
				await branch.get('.so-button__text').trigger('click')
				expect(branch.attributes('aria-expanded')).toBe('true')
			})

			const child = wrapper.get('[role="group"] [role="treeitem"]')
			await child.get('.so-tree-item__row').trigger('click')
			await child.get('.so-tree-item__row').trigger('click')
			await child.trigger('keydown', { key: 'ArrowUp' })

			expect(branch.attributes('tabindex')).toBe('0')
			expect(branch.attributes('data-highlighted')).not.toBe('true')
			expect(child.attributes('data-highlighted')).toBe('true')
			expect(wrapper.find('[aria-selected]').exists()).toBe(false)
			expect(wrapper.emitted('update:value')).toBeUndefined()

			await wrapper.setProps({ mode: 'single' })
			expect(child.attributes('data-highlighted')).not.toBe('true')
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
