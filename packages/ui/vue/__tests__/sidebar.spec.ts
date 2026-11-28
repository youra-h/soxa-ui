import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { TSidebar } from '@soxa-ui/core'
import { Sidebar } from '@soxa-ui/vue'

describe('Sidebar', () => {
	it('updates the compact slot without replacing links or custom content', async () => {
		const ctrl = new TSidebar()
		const wrapper = mount(Sidebar, {
			props: { ctrl },
			slots: {
				default: ({ collapsed }) => [
					h(
						Sidebar.Item,
						{ href: '/deployments', text: 'Deployments' },
						{ leading: () => h('span', 'D') },
					),
					h('input', { 'aria-label': collapsed ? 'Compact search' : 'Project search' }),
				],
			},
		})

		const link = wrapper.get('a').element
		const input = wrapper.get('input').element
		input.value = 'production'
		ctrl.toggle()
		await nextTick()

		expect(wrapper.attributes('data-collapsed')).toBe('')
		expect(wrapper.get('a').element).toBe(link)
		expect(link.getAttribute('href')).toBe('/deployments')
		expect(link.textContent).toContain('Deployments')
		expect(wrapper.get('input').element).toBe(input)
		expect(input.getAttribute('aria-label')).toBe('Compact search')
		expect(input.value).toBe('production')
		expect(wrapper.emitted('change:collapsed')).toEqual([[{ oldValue: false, newValue: true }]])
		wrapper.unmount()
	})

	it('makes an off-canvas panel inert while preserving its contents', async () => {
		const wrapper = mount(Sidebar, {
			props: { collapsed: true, collapse: 'offcanvas', side: 'right' },
			slots: { default: () => h(Sidebar.Item, { text: 'Settings' }) },
		})

		const content = wrapper.get('.so-sidebar__content')
		expect(wrapper.element.tagName).toBe('ASIDE')
		expect(wrapper.attributes('data-side')).toBe('right')
		expect(content.attributes('inert')).toBeDefined()
		const button = wrapper.get('button').element
		expect(button.type).toBe('button')

		await wrapper.setProps({ collapsed: false })

		expect(content.attributes('inert')).toBeUndefined()
		expect(wrapper.get('button').element).toBe(button)
		wrapper.unmount()
	})

	it('keeps native link and button attributes in sync with href and disabled', async () => {
		const wrapper = mount(Sidebar.Item, { props: { text: 'Settings', disabled: true } })
		expect(wrapper.element.tagName).toBe('BUTTON')
		expect(wrapper.attributes('disabled')).toBeDefined()

		await wrapper.setProps({ href: '/settings' })
		expect(wrapper.element.tagName).toBe('A')
		expect(wrapper.attributes('href')).toBeUndefined()
		expect(wrapper.attributes('aria-disabled')).toBe('true')

		await wrapper.setProps({ disabled: false })
		expect(wrapper.attributes('href')).toBe('/settings')
		expect(wrapper.attributes('aria-disabled')).toBeUndefined()
		wrapper.unmount()
	})
})
