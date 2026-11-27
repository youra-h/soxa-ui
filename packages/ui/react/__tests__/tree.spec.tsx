import { act } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Tree } from '@soxa-ui/react'
import { find, mount, nextFrame } from './mount'
const items = [
	{ value: 'files', text: 'Files', children: [{ value: 'readme', text: 'Readme' }] },
	{ value: 'help', text: 'Help', href: '/help' },
]

describe('Tree', () => {
	it('preserves nested accessibility and renders the scoped icon before hydration', () => {
		const html = renderToString(
			<Tree
				items={items}
				expanded={['files']}
				item-icon={({ item }) => <span data-icon={item.value} />}
			/>,
		)

		expect(html).toContain('role="group"')
		expect(html).toContain('aria-level="2"')
		expect(html).toContain('data-icon="readme"')
		expect(html).toMatch(/<a[^>]*href="\/help"/)
	})

	it('expands a branch and selects its child through the shared keyboard plugin', async () => {
		const { container } = mount(<Tree items={items} mode="multiple" />)
		await nextFrame()

		const branch = find(container, '[role="treeitem"]', HTMLElement)
		act(() =>
			branch.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
			),
		)
		expect(branch.getAttribute('aria-expanded')).toBe('true')

		const child = find(branch, '[role="treeitem"]', HTMLElement)
		act(() => child.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })))
		expect(child.getAttribute('aria-selected')).toBe('true')
	})
})
