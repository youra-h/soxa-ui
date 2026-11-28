import { describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { h } from 'vue'
import { TSidebar } from '@soxa-ui/core'
import { Sidebar } from '@soxa-ui/vue'
import '@soxa-ui/theme-oren'
import { FRAMEWORKS, loadHost } from '../src/hosts'
import { render } from './render'

function element(root: ParentNode, selector: string): HTMLElement {
	const node = root.querySelector(selector)
	if (!(node instanceof HTMLElement)) throw new Error(`Missing ${selector}`)
	return node
}

describe.each(FRAMEWORKS)('Sidebar preview · $id', ({ id }) => {
	it('updates the panel in place for both collapse modes', async () => {
		const host = await loadHost(id)
		const root = document.createElement('div')
		root.dataset.soTheme = 'oren'
		document.body.append(root)
		const preview = host.mount(root, { component: 'sidebar', props: { side: 'right' } })

		try {
			await expect
				.poll(() => root.querySelector<HTMLElement>('.so-sidebar')?.dataset.side)
				.toBe('right')
			const sidebar = root.querySelector<HTMLElement>('.so-sidebar')
			const item = sidebar?.querySelector('.so-sidebar-item')
			expect(item?.textContent).toContain('Обзор')

			preview.update({ collapse: 'icon', collapsed: true })
			await expect.poll(() => sidebar?.hasAttribute('data-collapsed')).toBe(true)
			expect(sidebar?.querySelector('.so-sidebar-item')).toBe(item)
			expect(sidebar?.querySelector('.so-sidebar__content')?.hasAttribute('inert')).toBe(
				false,
			)

			preview.update({ collapse: 'offcanvas', collapsed: true })
			await expect
				.poll(() => sidebar?.querySelector('.so-sidebar__content')?.hasAttribute('inert'))
				.toBe(true)

			preview.update({ collapse: 'offcanvas', collapsed: false })
			await expect
				.poll(() => sidebar?.querySelector('.so-sidebar__content')?.hasAttribute('inert'))
				.toBe(false)
		} finally {
			preview.unmount()
			root.remove()
		}
	})
})

describe.each(['left', 'right'] as const)('Sidebar on the %s', (side) => {
	it('moves to the correct side, keeps the icon link and releases its width off-canvas', async () => {
		const ctrl = new TSidebar({ side })
		const root = render({
			render: () =>
				h('div', { style: { display: 'flex', width: '600px' }, 'data-so-theme': 'oren' }, [
					h('main', { style: { flex: '1' } }, 'Main'),
					h(Sidebar, { ctrl }, () =>
						h(
							Sidebar.Item,
							{ text: 'Deployments', href: '#deployments' },
							{ leading: () => h('span', { class: 'test-icon' }, 'D') },
						),
					),
				]),
		})
		const sidebar = element(root, '.so-sidebar')
		const main = element(root, 'main')
		const link = page.getByRole('link', { name: 'Deployments' })
		const panelWidth = () => sidebar.getBoundingClientRect().width
		const expandedWidth = panelWidth()
		expect(expandedWidth).toBeGreaterThan(200)
		const sidebarRect = sidebar.getBoundingClientRect()
		const mainRect = main.getBoundingClientRect()
		expect(side === 'left' ? sidebarRect.right : sidebarRect.left).toBe(
			side === 'left' ? mainRect.left : mainRect.right,
		)

		element(sidebar, 'a').focus()
		ctrl.collapsed = true
		await expect.poll(panelWidth).toBeLessThan(60)
		expect(panelWidth()).toBeGreaterThan(0)
		await expect.element(link).toHaveFocus()
		expect(getComputedStyle(element(sidebar, '.so-sidebar-item__text')).clipPath).toBe(
			'inset(50%)',
		)
		expect(element(sidebar, '.test-icon').getBoundingClientRect().width).toBeGreaterThan(0)

		ctrl.collapse = 'offcanvas'
		await expect.poll(panelWidth).toBe(0)
		expect(element(sidebar, '.so-sidebar__content').inert).toBe(true)
		expect(main.getBoundingClientRect().width).toBe(600)

		ctrl.collapsed = false
		await expect.poll(panelWidth).toBe(expandedWidth)
		await expect.element(link).toBeVisible()
	})
})
