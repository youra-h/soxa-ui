import { describe, expect, it } from 'vitest'
import { Tree } from '@soxa-ui/solid'
import { find, mount, nextFrame } from './mount'
const items = [
	{ value: 'files', text: 'Files', children: [{ value: 'readme', text: 'Readme' }] },
	{ value: 'help', text: 'Help', href: '/help' },
]

describe('Tree', () => {
	it('preserves the branch node and adds scoped icons as children become visible', async () => {
		const { container } = mount(() => (
			<Tree
				items={items}
				mode="multiple"
				item-icon={({ item }) => <span data-icon={item.value} />}
			/>
		))
		await nextFrame()

		const branch = find(container, '[role="treeitem"]', HTMLElement)
		branch.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

		expect(find(container, '[role="treeitem"]', HTMLElement)).toBe(branch)
		expect(branch.querySelector('[role="group"] [data-icon="readme"]')).not.toBeNull()

		const child = find(branch, '[role="treeitem"]', HTMLElement)
		child.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
		expect(child.getAttribute('aria-selected')).toBe('true')
	})
})
