import { h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ListBox, Tree, Virtual } from '@soxa-ui/vue'
import { previewProps } from '@soxa-ui/playground-shared'
import { cleanup, render } from './render'
import { find, style } from './colors'
import orenStyles from '../src/themes/oren.css?inline'
import burgStyles from '../src/themes/burg.css?inline'

const stylesheet = document.createElement('style')

beforeEach(() => {
	stylesheet.textContent = orenStyles
	document.head.append(stylesheet)
})

afterEach(() => {
	cleanup()
	stylesheet.remove()
})

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

it.each(['burg', 'burg-dark'])(
	'keeps selection and keyboard focus distinct in %s',
	async (scheme) => {
		stylesheet.textContent = burgStyles
		const selected = 'guide'
		const items = [
			{
				value: 'docs',
				text: 'Documents',
				children: [
					{ value: selected, text: 'Guide.md' },
					{ value: 'notes', text: 'Notes.md' },
				],
			},
		]
		const scene = render({
			render: () =>
				h('div', { 'data-so-theme': scheme, style: 'width: 304px' }, [
					h('button', { id: 'before-tree' }, 'Before tree'),
					h(Tree, {
						items,
						expanded: ['docs'],
						mode: 'multiple',
						value: [selected],
						indicator: 'end',
						guides: true,
						'aria-label': 'Workspace files',
					}),
				]),
		})

		const active = page.getByRole('treeitem', { name: 'Guide.md', exact: true })
		const idle = page.getByRole('treeitem', { name: 'Notes.md', exact: true })
		const activeRow = find('.so-tree-item__row', active.element())
		const idleRow = find('.so-tree-item__row', idle.element())
		const group = find('.so-tree-item__group', scene)
		const fill = scheme === 'burg' ? 'oklch(0.96 0 0)' : 'oklch(0.3 0 0)'
		const ring = scheme === 'burg' ? 'oklch(0.84 0 0)' : 'oklch(0.48 0 0)'

		expect(style(activeRow).height).toBe('30px')
		expect(style(activeRow).fontSize).toBe('13px')
		expect(style(group).rowGap).toBe('4px')
		expect(style(group).borderInlineStartWidth).toBe('1px')
		expect(style(activeRow, '::after').backgroundColor).toBe(fill)
		expect(style(idleRow, '::after').backgroundColor).toBe('rgba(0, 0, 0, 0)')
		expect(
			find('.so-tree-item__selection-indicator', activeRow).querySelector('.so-icon'),
		).not.toBeNull()

		await idle.hover()
		await expect
			.poll(() => style(idleRow, '::after').backgroundColor)
			.not.toBe('rgba(0, 0, 0, 0)')
		expect(style(idleRow, '::after').backgroundColor).not.toBe(fill)
		find('#before-tree', scene).focus()
		await userEvent.keyboard('{Tab}')
		await expect.poll(() => scene.querySelector('.so-tree-item:focus-visible')).not.toBeNull()
		const focusedRow = find('.so-tree-item:focus-visible > .so-tree-item__row', scene)
		expect(style(focusedRow).outlineWidth).toBe('3px')
		expect(style(focusedRow).outlineOffset).toBe('-3px')
		expect(style(focusedRow).outlineColor).toBe(ring)
	},
)

describe('Tree with Virtual', () => {
	it.each(['oren', 'burg', 'burg-dark'])(
		'%s keeps grouped ownership and moves focus outside the original window',
		async (scheme) => {
			if (scheme.startsWith('burg')) stylesheet.textContent = burgStyles
			const children = Array.from({ length: 160 }, (_, index) => ({
				value: index,
				text: `Document ${index + 1}`,
			}))
			const items = [{ value: 'root', text: 'Files', children }]

			const scene = render({
				render: () =>
					h('div', { 'data-so-theme': scheme, style: 'height: 200px; overflow: auto' }, [
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
		},
	)
})
