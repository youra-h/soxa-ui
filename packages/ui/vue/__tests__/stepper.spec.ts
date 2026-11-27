import { mount } from '@vue/test-utils'
import { Stepper } from '@soxa-ui/vue'
import { createEngineStepper } from '@soxa-ui/core'
import { afterEach, describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import { hydrate, unmountHydrated } from './hydrate'

const items = [
	{ value: 'contact', text: 'Contact', completed: true },
	{ value: 'shipping', text: 'Shipping', error: true },
	{ value: 'payment', text: 'Payment' },
]

interface Navigation {
	next(): boolean
	previous(): boolean
	canNext: boolean
	canPrevious: boolean
}

const content = ({ next, previous, canNext, canPrevious }: Navigation) =>
	h('div', [
		...items.map(({ value, text }) =>
			h(Stepper.Content, { key: value, value }, () => text + ' panel'),
		),
		h('button', { type: 'button', class: 'next', disabled: !canNext, onClick: next }, 'Next'),
		h(
			'button',
			{ type: 'button', class: 'previous', disabled: !canPrevious, onClick: previous },
			'Previous',
		),
	])

afterEach(unmountHydrated)

describe('Stepper', () => {
	it('blocks forward jumps in linear mode and preserves completed and error states', async () => {
		const engine = createEngineStepper({ items })
		const wrapper = mount(Stepper, {
			props: { engine, value: 'shipping', linear: true },
			slots: { content },
		})
		const [contact, shipping, payment] = wrapper.findAll<HTMLButtonElement>(
			'.so-stepper-item__trigger',
		)
		expect(wrapper.get('[aria-current="step"]').text()).toContain('Shipping')
		expect(wrapper.get('.so-stepper-content').text()).toBe('Shipping panel')
		expect(wrapper.get('li[data-error="true"]').text()).toContain('Shipping')
		expect(payment.element.disabled).toBe(true)
		expect(engine.extensions.activation.activate(engine.extensions.batch.items[2])).toBe(false)
		expect(wrapper.get<HTMLButtonElement>('.next').element.disabled).toBe(true)

		await contact.trigger('click')
		expect(wrapper.get('.so-stepper-content').text()).toBe('Contact panel')
		expect(wrapper.get('li[data-completed="true"]').text()).toContain('Contact')
		await wrapper.get('.next').trigger('click')
		expect(wrapper.get('.so-stepper-content').text()).toBe('Shipping panel')

		engine.extensions.batch.items[1].completed = true
		await nextTick()
		expect(shipping.element.disabled).toBe(false)
		expect(payment.element.disabled).toBe(false)
		await wrapper.get('.next').trigger('click')
		expect(wrapper.get('.so-stepper-content').text()).toBe('Payment panel')
		expect(wrapper.get<HTMLButtonElement>('.next').element.disabled).toBe(true)
		wrapper.unmount()
		expect(engine.extensions.batch.items).toHaveLength(3)
	})

	it('supports passive headers, slot metadata and independent panel navigation', async () => {
		const wrapper = mount(Stepper, {
			props: { interactive: false, value: 'shipping' },
			slots: {
				default: () =>
					items.map((item) =>
						h(
							Stepper.Item,
							{ ...item, key: item.value },
							{
								leading: () => h('span', 'Tracking'),
								indicator: ({ number }: { number: number }) => h('b', '#' + number),
								separator: () => h('span', '→'),
								details: () =>
									h('button', { type: 'button', class: 'info' }, 'Info'),
							},
						),
					),
				content,
			},
		})

		await nextTick()
		expect(wrapper.findAll('ol > li')).toHaveLength(3)
		expect(wrapper.findAll('.so-stepper-item__separator')).toHaveLength(2)
		expect(wrapper.findAll('.so-stepper-item__indicator').map((item) => item.text())).toEqual([
			'#1',
			'#2',
			'#3',
		])
		expect(wrapper.get('[aria-current="step"]').element.tagName).toBe('SPAN')
		await wrapper.get('.info').trigger('click')
		expect(wrapper.get('.so-stepper-content').text()).toBe('Shipping panel')
		await wrapper.get('.next').trigger('click')
		expect(wrapper.get('.so-stepper-content').text()).toBe('Payment panel')
		wrapper.unmount()
	})

	it('starts from the next visible step when the active step is hidden', async () => {
		const engine = createEngineStepper({ items })
		const wrapper = mount(Stepper, { props: { engine, value: 'shipping' }, slots: { content } })
		engine.extensions.batch.items[1].visible = false
		await nextTick()

		expect(wrapper.get('.so-stepper-content').text()).toBe('Payment panel')
		expect(wrapper.findAll('.so-stepper-item__separator')).toHaveLength(1)
		wrapper.unmount()
	})

	it('renders a declared list with custom slots and the correct separators in SSR', async () => {
		const { server, client, warnings } = await hydrate(() =>
			h(
				Stepper,
				{ initial: { items }, value: 'shipping' },
				{
					default: () =>
						items.map((item, initial) =>
							h(Stepper.Item, { key: item.value, initial }, { separator: () => '?' }),
						),
					content,
				},
			),
		)

		for (const root of [server, client]) {
			expect(root.querySelectorAll('.so-stepper-item__separator')).toHaveLength(2)
			expect(root.querySelectorAll('[aria-current="step"]')).toHaveLength(1)
			expect(root.querySelector('.so-stepper-content')?.textContent).toBe('Shipping panel')
		}
		expect(warnings).toEqual([])
	})

	it('serializes data steps and their current panel before hydration', async () => {
		const { server, client, warnings } = await hydrate(() =>
			h(Stepper, { items, value: 'shipping', linear: true }, { content }),
		)

		for (const root of [server, client]) {
			expect(root.querySelectorAll('ol > li')).toHaveLength(3)
			expect(root.querySelectorAll('.so-stepper-item__separator')).toHaveLength(2)
			expect(root.querySelectorAll('[aria-current="step"]')).toHaveLength(1)
			expect(root.querySelector('.so-stepper-content')?.textContent).toBe('Shipping panel')
		}
		expect(warnings).toEqual([])
	})
})
