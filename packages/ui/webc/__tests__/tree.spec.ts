import { describe, expect, it, vi } from 'vitest'
import { TTreeElement } from '@soxa-ui/webc'
const items = [
	{ value: 'files', text: 'Files', children: [{ value: 'readme', text: 'Readme' }] },
	{ value: 'help', text: 'Help', href: '/help' },
]

describe('Tree', () => {
	it('puts icon samples on data items and keeps groups nested during updates', async () => {
		const root = new TTreeElement()
		root.items = items
		root.mode = 'multiple'
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

			const child = branch.querySelector('[role="group"]:not([hidden]) [role="treeitem"]')
			expect(child?.querySelector('[data-icon]')).not.toBeNull()
			expect(root.querySelector('a[role="treeitem"]')?.getAttribute('href')).toBe('/help')
		} finally {
			root.remove()
		}
	})
})
