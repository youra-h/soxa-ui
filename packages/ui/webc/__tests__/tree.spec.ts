import { describe, expect, it, vi } from 'vitest'
import type { ITreeProps } from '@soxa-ui/core'
import { TTreeElement } from '@soxa-ui/webc'

const items = [
	{ value: 'files', text: 'Files', children: [{ value: 'readme', text: 'Readme' }] },
	{ value: 'help', text: 'Help', href: '/help' },
]

describe('Tree', () => {
	it('keeps the selection indicator beside disclosure and applies icon samples to nested items', async () => {
		const root = new TTreeElement()
		Object.assign(root, {
			items,
			mode: 'multiple',
			indicator: 'start',
			value: ['files'],
		} satisfies ITreeProps)
		root.innerHTML = '<template slot="item-icon"><span data-icon></span></template>'
		document.body.append(root)

		try {
			const branch = await vi.waitFor(() => {
				const node = root.querySelector('[role="treeitem"]')

				expect(node).toBeInstanceOf(HTMLElement)

				return node as HTMLElement
			})

			await vi.waitFor(() => {
				branch.dispatchEvent(
					new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
				)
				expect(branch.getAttribute('aria-expanded')).toBe('true')
			})

			const row = branch.querySelector('.so-tree-item__row')
			if (!row) throw new Error('Tree row missing')
			const mark = row.querySelector('.so-tree-item__selection-indicator')
			expect(mark?.querySelector('svg')).toBeInstanceOf(SVGElement)
			expect(mark?.previousElementSibling).toBe(row.querySelector('.so-tree-item__toggle'))

			Object.assign(root, { indicator: 'end' } satisfies ITreeProps)
			await vi.waitFor(() => expect(row.lastElementChild).toBe(mark))

			const child = branch.querySelector('[role="group"]:not([hidden]) [role="treeitem"]')
			expect(child?.querySelector('[data-icon]')).not.toBeNull()
			expect(root.querySelector('a[role="treeitem"]')?.getAttribute('href')).toBe('/help')
		} finally {
			root.remove()
		}
	})
})
