import { describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h } from 'vue'
import { TSidebar } from '@soxa-ui/core'
import { ListBox, Sidebar } from '@soxa-ui/vue'
import '@soxa-ui/theme-oren'
import { FRAMEWORKS, loadHost } from '../src/hosts'
import SidebarDemo from '../src/components/SidebarDemo.vue'
import '../src/styles.css'
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
			expect(item?.textContent).toContain('Календарь публикаций')
			expect(sidebar?.querySelectorAll('[role="group"]')).toHaveLength(2)
			expect(sidebar?.querySelectorAll('.pg-sidebar-group .so-sidebar-item')).toHaveLength(6)

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

it('collapses and reopens the grouped panel from the workspace', async () => {
	const host = await loadHost('vue')
	const root = render({
		render: () =>
			h('div', { 'data-so-theme': 'oren' }, [
				h(SidebarDemo, { host }),
				h(ListBox, {
					items: [{ value: 'apple', text: 'Яблоко', _: { group: 'fruit' } }],
					groups: [{ key: 'fruit', label: 'Фрукты' }],
				}),
			]),
	})
	const demo = page.getByRole('region', { name: 'Редакция «Поле»' })
	const collapse = demo.getByRole('button', { name: 'Свернуть панель' })
	const expand = demo.getByRole('button', { name: 'Развернуть панель' })
	const hide = demo.getByRole('switch', { name: 'Скрывать целиком' })
	const search = demo.getByRole('textbox', { name: 'Поиск по разделам' })
	const profile = demo.getByRole('button', { name: /Анна Волкова/ })
	const sidebar = element(root, '.so-sidebar')
	const width = () => sidebar.getBoundingClientRect().width
	const expandedWidth = width()
	const sidebarLabel = element(root, '.so-sidebar-group__label')
	const listBoxLabel = element(root, '.so-list-box-group__label')
	const labelStyle = getComputedStyle(sidebarLabel)
	const listBoxStyle = getComputedStyle(listBoxLabel)

	for (const property of [
		'textTransform',
		'color',
		'fontSize',
		'fontWeight',
		'paddingInlineStart',
	] as const) {
		expect(labelStyle[property]).toBe(listBoxStyle[property])
	}

	await search.fill('Черновики')
	await collapse.click()
	await expect.poll(width).toBeLessThan(expandedWidth)
	expect(width()).toBeGreaterThan(0)
	expect(getComputedStyle(sidebarLabel).display).toBe('none')
	await expect.element(expand).toHaveAttribute('aria-expanded', 'false')
	await expect.element(demo.getByRole('button', { name: 'Напоминания' })).toBeVisible()
	const searchBlock = element(sidebar, '.pg-sidebar-header > [data-so-sidebar-expanded-only]')
	expect(getComputedStyle(searchBlock).display).toBe('none')
	await expect.element(demo.getByText('Команда выпуска')).not.toBeVisible()
	const profileLabel = element(sidebar, '.pg-sidebar-footer .so-sidebar-item__text')
	expect(getComputedStyle(profileLabel).clipPath).toBe('inset(50%)')
	expect(element(sidebar, '.pg-sidebar-brand__mark').getBoundingClientRect().width).toBe(32)
	expect(
		element(sidebar, '.pg-sidebar-footer .so-avatar').getBoundingClientRect().width,
	).toBeGreaterThan(0)

	await profile.click()
	await expect.element(page.getByRole('menuitem', { name: 'Мой профиль' })).toBeVisible()
	await expect.element(page.getByRole('menu')).toHaveFocus()
	await userEvent.keyboard('{Escape}')
	await expect.element(profile).toHaveFocus()

	await hide.click()
	await expect.poll(width).toBe(0)
	await expect.element(expand).toBeVisible()

	await expand.click()
	await expect.poll(width).toBe(expandedWidth)
	await expect.element(collapse).toHaveAttribute('aria-expanded', 'true')
	await expect.element(demo.getByRole('group', { name: 'Материалы' })).toBeVisible()
	await expect.element(search).toHaveValue('Черновики')
	await expect.element(demo.getByText('Команда выпуска')).toBeVisible()
	await expect.element(demo.getByText('Редактор')).toBeVisible()
})

it('keeps a Web Components sidebar link native', async () => {
	await loadHost('webc')
	const link = document.createElement('a', { is: 'so-sidebar-link' })
	link.setAttribute('href', '#settings')
	link.setAttribute('text', 'Settings')
	link.setAttribute('disabled', '')
	document.body.append(link)

	try {
		await expect.poll(() => link.classList.contains('so-sidebar-item')).toBe(true)
		await expect.poll(() => link.getAttribute('href')).toBeNull()

		link.removeAttribute('disabled')
		await expect
			.element(page.getByRole('link', { name: 'Settings' }))
			.toHaveAttribute('href', '#settings')

		link.setAttribute('disabled', '')
		await expect.poll(() => link.getAttribute('href')).toBeNull()

		link.setAttribute('href', '#billing')
		await expect.poll(() => link.getAttribute('href')).toBeNull()

		link.removeAttribute('disabled')
		await expect.poll(() => link.getAttribute('href')).toBe('#billing')
		link.removeAttribute('href')
		await expect.poll(() => link.getAttribute('href')).toBeNull()
	} finally {
		link.remove()
	}
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
