import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tree, Virtual } from '@soxa-ui/vue'
import { cleanup, render } from './render'
import '@soxa-ui/theme-oren'

afterEach(cleanup)

describe('Tree with Virtual', () => {
	it('keeps grouped ownership and moves focus outside the original window', async () => {
		const children = Array.from({ length: 160 }, (_, index) => ({
			value: index,
			text: `Document ${index + 1}`,
		}))
		const items = [{ value: 'root', text: 'Files', children }]

		render({
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

		branch.focus()
		branch.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))

		await vi.waitFor(() => {
			const last = document.activeElement

			expect(last?.textContent?.trim()).toBe('Document 160')
			expect(last?.getAttribute('aria-level')).toBe('2')
			expect(last?.getAttribute('aria-setsize')).toBe('160')
			expect(last?.getAttribute('aria-posinset')).toBe('160')
			expect(last?.parentElement?.getAttribute('role')).toBe('group')
		})
	})
})
