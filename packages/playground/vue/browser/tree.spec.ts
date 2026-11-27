import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { ListBox, Tree, Virtual } from '@soxa-ui/vue'
import { previewProps } from '@soxa-ui/playground-shared'
import { cleanup, render } from './render'
import '@soxa-ui/theme-oren'

afterEach(cleanup)

it.each(['ltr', 'rtl'])(
	'keeps row width and label alignment after expansion in %s',
	async (dir) => {
		const items = [
			{
				value: 'support',
				text: 'Support',
				children: [{ value: 'faq', text: 'Frequently asked questions' }],
			},
		]
		const scene = render({
			render: () =>
				h('div', { dir, 'data-so-theme': 'oren', style: 'display: flex; width: 320px' }, [
					h(Tree, {
						...previewProps('tree'),
						items,
						guides: true,
						'aria-label': 'Sections',
					}),
				]),
		})
		const label = page.getByText('Support', { exact: true })
		const branch = scene.querySelector('[aria-expanded]')
		const row = branch?.querySelector('.so-tree-item__row')
		if (!branch || !row) throw new Error('Tree branch did not render')
		const before = row.getBoundingClientRect()
		const background = getComputedStyle(row).backgroundColor
		const child = page.getByText('Frequently asked questions')

		await label.click()
		await expect.element(child).toBeVisible()

		expect(row.getBoundingClientRect().width).toBe(before.width)
		expect(row.getBoundingClientRect().x).toBe(before.x)
		expect(getComputedStyle(label.element()).textAlign).toBe('start')
		expect(branch.getAttribute('data-highlighted')).toBe('true')
		expect(branch.hasAttribute('aria-selected')).toBe(false)

		await child.hover()
		await expect.poll(() => getComputedStyle(row).backgroundColor).not.toBe(background)

		await label.click()
		await expect.element(child).not.toBeInTheDocument()
		expect(branch.getAttribute('data-highlighted')).toBe('true')
	},
)

it.each(['normal', 'lg'] as const)('matches the ListBox row gap at size %s', async (size) => {
	const children = [
		{ value: 'leaf-1', text: 'Leaf one' },
		{ value: 'leaf-2', text: 'Leaf two' },
	]
	const items = [
		{ value: 'root', text: 'Root', children },
		{ value: 'last', text: 'Last' },
	]
	const scene = render({
		render: () =>
			h('div', { 'data-so-theme': 'oren' }, [
				h(ListBox, { items: children, size, 'aria-label': 'Items' }),
				h(Tree, { items, expanded: ['root'], size, 'aria-label': 'Tree' }),
			]),
	})
	await nextTick()

	const list = scene.querySelector('.so-list-box__list')
	if (!list) throw new Error('ListBox did not render')
	const gap = Number.parseFloat(getComputedStyle(list).rowGap)
	const rows = [...scene.querySelectorAll('.so-tree-item__row')].map((row) =>
		row.getBoundingClientRect(),
	)

	expect(gap).toBeGreaterThan(0)
	expect(rows).toHaveLength(4)
	expect(rows.slice(1).map((row, index) => row.top - rows[index].bottom)).toEqual([gap, gap, gap])
})

describe('Tree with Virtual', () => {
	it('keeps grouped ownership and moves focus outside the original window', async () => {
		const children = Array.from({ length: 160 }, (_, index) => ({
			value: index,
			text: `Document ${index + 1}`,
		}))
		const items = [{ value: 'root', text: 'Files', children }]

		const scene = render({
			render: () =>
				h('div', { 'data-so-theme': 'oren', style: 'height: 200px; overflow: auto' }, [
					h(Virtual, null, {
						default: () =>
							h(Tree, {
								items,
								expanded: ['root'],
								'aria-label': 'Documents',
							}),
					}),
				]),
		})

		await nextTick()

		const branch = document.querySelector<HTMLElement>('[role="treeitem"]')
		if (!branch) throw new Error('Tree branch did not render')

		await vi.waitFor(() => {
			expect(document.querySelector('.so-tree__filler')).not.toBeNull()
			expect(document.querySelectorAll('.so-tree-item__row').length).toBeLessThan(50)
		})

		const container = scene.firstElementChild
		if (!container) throw new Error('Tree scroll container did not render')
		const [first, second] = scene.querySelectorAll('.so-tree-item__row')
		const rowHeight = first.getBoundingClientRect().height
		const step = second.getBoundingClientRect().top - first.getBoundingClientRect().top
		const totalHeight = children.length * step + rowHeight
		expect(step).toBeGreaterThan(rowHeight)
		expect(container.scrollHeight).toBeCloseTo(totalHeight, 0)

		branch.focus()
		branch.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))

		await vi.waitFor(() => {
			const last = document.activeElement

			expect(last?.textContent?.trim()).toBe('Document 160')
			expect(last?.getAttribute('aria-level')).toBe('2')
			expect(container.scrollHeight).toBeCloseTo(totalHeight, 0)
			expect(last?.getAttribute('aria-setsize')).toBe('160')
			expect(last?.getAttribute('aria-posinset')).toBe('160')
			expect(last?.parentElement?.getAttribute('role')).toBe('group')
		})
	})
})
