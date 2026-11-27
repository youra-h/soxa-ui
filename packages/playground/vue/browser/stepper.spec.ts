import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { Stepper } from '@soxa-ui/vue'
import { page, userEvent } from 'vitest/browser'
import { FRAMEWORKS, loadHost } from '../src/hosts'
import { COMPONENT_SIZES, COMPONENT_VARIANTS } from '@soxa-ui/playground-shared'
import type { IStepperProps } from '@soxa-ui/core'
import { render, cleanup } from './render'
import { find } from './colors'
import orenStyles from '../src/themes/oren.css?inline'
import burgStyles from '../src/themes/burg.css?inline'

const items = [
	{ value: 'contact', text: 'Contact', completed: true },
	{ value: 'shipping', text: 'Shipping' },
	{ value: 'payment', text: 'Payment' },
]

const currentIcon = '.so-stepper-item__step-icon'
const completedIcon = '.so-stepper-item[data-completed="true"] .so-icon'

function iconOf(selector: string): SVGSVGElement {
	const icon = document.querySelector(selector)
	if (!(icon instanceof SVGSVGElement)) throw new Error('Missing SVG icon: ' + selector)

	return icon
}

const stylesheet = document.createElement('style')

function applyScheme(scheme: string): void {
	document.documentElement.dataset.soTheme = scheme
	stylesheet.textContent = scheme.startsWith('burg') ? burgStyles : orenStyles
}

beforeEach(() => {
	applyScheme('oren')
	document.head.append(stylesheet)
})

afterEach(() => {
	stylesheet.remove()
	cleanup()
	document.documentElement.removeAttribute('dir')
	document.documentElement.removeAttribute('data-so-theme')
})

describe('Stepper indicators', () => {
	it('rotates the active glyph with orientation and mirrors it in a horizontal RTL list', async () => {
		const orientation = ref<IStepperProps['orientation']>('horizontal')
		render(
			defineComponent({
				render: () =>
					h(Stepper, { items, value: 'shipping', orientation: orientation.value }),
			}),
		)
		await nextTick()

		const step = iconOf(currentIcon)
		expect(getComputedStyle(step).rotate).toBe('none')
		expect(getComputedStyle(step).scale).toBe('1')

		document.documentElement.dir = 'rtl'
		expect(getComputedStyle(step).scale).toBe('-1 1')

		orientation.value = 'vertical'
		await nextTick()
		expect(iconOf(currentIcon)).toBe(step)
		expect(getComputedStyle(step).rotate).toBe('90deg')
		expect(getComputedStyle(step).scale).toBe('none')
		expect(getComputedStyle(iconOf(completedIcon)).rotate).toBe('none')
	})

	it.each(['oren', 'oren-dark', 'burg', 'burg-dark'])(
		'%s scales circular markers and applies variants to the current step',
		async (scheme) => {
			applyScheme(scheme)
			const size = ref<IStepperProps['size']>('normal')
			const variant = ref<IStepperProps['variant']>()
			render(
				defineComponent({
					render: () =>
						h(Stepper, {
							items,
							value: 'shipping',
							size: size.value,
							variant: variant.value,
						}),
				}),
			)
			await nextTick()

			const activeIcon = iconOf(currentIcon)
			const active = find(
				'.so-stepper-item[data-selected="true"] .so-stepper-item__indicator',
			)
			const completed = find(
				'.so-stepper-item[data-completed="true"] .so-stepper-item__indicator',
			)
			const pending = find('.so-stepper-item:last-child .so-stepper-item__indicator')
			const fills = [completed, active, pending].map(
				(marker) => getComputedStyle(marker).backgroundColor,
			)

			expect(new Set(fills).size).toBe(3)
			for (const marker of [completed, active, pending]) {
				expect(getComputedStyle(marker).borderRadius).toBe('50%')
				expect(getComputedStyle(marker).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
			}

			const widths: number[] = []
			const fontSizes: number[] = []

			for (const selected of COMPONENT_SIZES) {
				size.value = selected
				await nextTick()

				widths.push(activeIcon.getBoundingClientRect().width)
				fontSizes.push(
					Number.parseFloat(getComputedStyle(find('.so-stepper-item__label')).fontSize),
				)
			}

			expect(widths).toEqual([...new Set(widths)].sort((a, b) => a - b))
			expect(fontSizes).toEqual([...new Set(fontSizes)].sort((a, b) => a - b))

			const colors = new Set<string>()
			for (const selected of COMPONENT_VARIANTS) {
				variant.value = selected
				await nextTick()

				const color = getComputedStyle(active).backgroundColor
				colors.add(color)
				expect(color).not.toBe(fills[0])
				expect(getComputedStyle(completed).backgroundColor).toBe(fills[0])
				expect(getComputedStyle(pending).backgroundColor).toBe(fills[2])
			}
			expect(colors.size).toBe(COMPONENT_VARIANTS.length)

			variant.value = undefined
			await nextTick()
			expect(getComputedStyle(active).backgroundColor).toBe(fills[1])
			expect(getComputedStyle(completed).backgroundColor).toBe(fills[0])
		},
	)

	describe.each(['burg', 'burg-dark'])('%s', (scheme) => {
		it('keeps the compact scale, focus ring, and unavailable step in a linear flow', async () => {
			const root = document.documentElement
			applyScheme(scheme)

			render({
				render: () => h(Stepper, { items, value: 'shipping', linear: true }),
			})
			await nextTick()

			const active = find(
				'.so-stepper-item[data-selected="true"] > .so-stepper-item__trigger',
			)
			const label = find('.so-stepper-item__label', active)
			const marker = find('.so-stepper-item__indicator', active)
			const pending = find('.so-stepper-item:last-child > .so-stepper-item__trigger')

			expect(getComputedStyle(label).fontSize).toBe('13px')
			expect(marker.getBoundingClientRect().width).toBe(22)
			expect(active.getBoundingClientRect().height).toBe(28)
			expect(pending.matches(':disabled')).toBe(true)
			expect(
				getComputedStyle(find('.so-stepper-item__indicator', pending)).backgroundColor,
			).toBe('rgba(0, 0, 0, 0)')

			await userEvent.keyboard('{Tab}{Tab}')
			expect(document.activeElement).toBe(active)
			expect(getComputedStyle(active).outlineWidth).toBe('3px')
			expect(getComputedStyle(active).outlineOffset).toBe('0px')
			expect(getComputedStyle(active).outlineColor).toBe(
				getComputedStyle(root).getPropertyValue('--so-burg-focus').trim(),
			)
		})
	})
})

describe.each(FRAMEWORKS)('Stepper navigation ? $id', ({ id }) => {
	it('shares linear navigation, native activation and passive headers', async () => {
		const host = await loadHost(id)
		const root = document.createElement('div')
		document.body.append(root)
		const props = { items, value: 'shipping', linear: true, interactive: true }
		const preview = host.mount(root, { component: 'stepper', props })

		try {
			const shipping = page.getByRole('button', { name: 'Shipping' })
			const contact = page.getByRole('button', { name: 'Contact' })
			const payment = page.getByRole('button', { name: 'Payment' })
			await expect.element(shipping).toHaveAttribute('aria-current', 'step')
			await expect.element(payment).toBeDisabled()

			await contact.click()
			await expect.element(contact).toHaveAttribute('aria-current', 'step')
			const shippingButton = shipping.element() as HTMLButtonElement
			shippingButton.focus()
			await userEvent.keyboard('{Enter}')
			await expect.element(shipping).toHaveAttribute('aria-current', 'step')

			preview.update({ ...props, interactive: false })
			await expect.poll(() => root.querySelectorAll('button').length).toBe(0)
			await expect
				.poll(() => root.querySelector('[aria-current="step"]')?.textContent)
				.toContain('Shipping')
		} finally {
			preview.unmount()
			root.remove()
		}
	})
})
