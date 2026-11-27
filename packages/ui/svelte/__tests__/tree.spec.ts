import { flushSync } from 'svelte'
import { describe, expect, it } from 'vitest'
import type { TTreeItem } from '@soxa-ui/core'
import { Tree } from '@soxa-ui/svelte'
import { find, mount, nextFrame } from './mount'
import { scopeText } from './snippets.svelte'
const items = [
	{ value: 'files', text: 'Files', children: [{ value: 'readme', text: 'Readme' }] },
	{ value: 'help', text: 'Help', href: '/help' },
]

describe('Tree', () => {
	it('renders a nested group and relays scoped item icons', async () => {
		const { root } = mount(Tree, {
			items,
			mode: 'multiple',
			'item-icon': scopeText(({ item }: { item: TTreeItem }) => `Icon: ${item.value}`),
		})

		await nextFrame()

		const branch = find(root(), '[role="treeitem"]', HTMLElement)
		branch.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
		flushSync()

		const child = find(branch, '[role="group"] [role="treeitem"]', HTMLElement)
		expect(child.textContent).toContain('Icon: readme')

		child.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
		flushSync()
		expect(child.getAttribute('aria-selected')).toBe('true')
	})
})
