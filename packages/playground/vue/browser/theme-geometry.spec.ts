import { describe, it, expect } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { Input, DateInput, Alert, Toasts } from '@soxa-ui/vue'
import { createEngineToasts } from '@soxa-ui/core'
import { render } from './render'
import '@soxa-ui/theme-oren'

const sizes = ['sm', 'normal', 'lg', 'xl', '2xl'] as const
function element(root: ParentNode, selector: string): HTMLElement {
	const node = root.querySelector(selector)
	if (!(node instanceof HTMLElement)) throw new Error(selector)
	return node
}
const style = (root: ParentNode, selector: string) => getComputedStyle(element(root, selector))
const mark = () => h('span', { style: 'display:block;width:1em;height:1em' }, '+')

describe('shared radius and spacing settings', () => {
	it.each(sizes)('scales both field families together at %s', (size) => {
		const root = render(
			defineComponent({
				render: () =>
					h('div', [
						h(
							Input,
							{ size, aria_label: 'Input' },
							{ leading: () => [mark(), mark()] },
						),
						h(
							DateInput,
							{ size, aria_label: 'Date' },
							{ leading: () => [mark(), mark()] },
						),
					]),
			}),
		)
		const scale = { sm: 0.75, normal: 1, lg: 1.25, xl: 1.5, '2xl': 1.75 }[size]
		expect(parseFloat(style(root, '.so-input__leading').gap)).toBeCloseTo(4 * scale)
		expect(parseFloat(style(root, '.so-date-input__leading').gap)).toBeCloseTo(4 * scale)
		expect(style(root, '.so-input').height).toBe(style(root, '.so-date-input').height)
	})

	it.each(['ltr', 'rtl'])('resolves subtree settings and exact local overrides in %s', (dir) => {
		const root = render(
			defineComponent({
				render: () =>
					h(
						'div',
						{
							dir,
							style: '--so-radius:12px;--so-spacing:8px;--so-field-scale-2xl:2',
						},
						[
							h(
								Input,
								{ size: '2xl', aria_label: 'Global' },
								{ leading: () => [mark(), mark()] },
							),
							h(
								Input,
								{
									size: '2xl',
									class: 'custom',
									style: '--so-input-radius:3px;--so-input-spacing-scale:3;--so-input-slot-spacing:5px;--so-input-indent-2xl:9px',
									aria_label: 'Local',
								},
								{ leading: () => [mark(), mark()] },
							),
						],
					),
			}),
		)
		expect(style(root, '.so-input').borderRadius).toBe('12px')
		expect(style(root, '.so-input__leading').gap).toBe('16px')
		expect(style(root, '.custom').borderRadius).toBe('3px')
		expect(style(root, '.custom .so-input__leading').gap).toBe('5px')
		expect(style(root, '.custom input').textIndent).toBe('9px')
		expect(style(root, '.custom .so-input__leading').paddingInlineStart).toBe('24px')
	})

	it('uses the message scale without inheriting a nested component scale', () => {
		const root = render(
			defineComponent({
				render: () =>
					h('div', { style: '--so-message-scale-xl:2;--so-field-scale-sm:.5' }, [
						h(Alert, { size: 'xl' }, () =>
							h(
								Input,
								{ size: 'sm', aria_label: 'Nested' },
								{ leading: () => [mark(), mark()] },
							),
						),
					]),
			}),
		)
		expect(style(root, '.so-alert').paddingBlockStart).toBe('28px')
		expect(style(root, '.so-alert').paddingInlineStart).toBe('32px')
		expect(style(root, '.so-input__leading').gap).toBe('2px')
	})

	it.each(sizes)('uses the compact Toasts spacing reference for Alert at %s', async (size) => {
		const engine = createEngineToasts()
		const root = render(
			defineComponent({
				render: () =>
					h('div', [
						h(
							Alert,
							{ size },
							{ title: () => 'Saved', default: () => 'Changes are ready.' },
						),
						h(Toasts, {
							engine,
							duration: 0,
							style: `--so-toasts-spacing-scale:var(--so-message-scale-${size},1)`,
						}),
					]),
			}),
		)
		await nextTick()
		engine.extensions.toasts.show({ text: 'Saved', description: 'Changes are ready.' })
		await expect.poll(() => document.querySelector('.so-toasts-item__card')).not.toBeNull()
		const card = style(document, '.so-toasts-item__card')
		const alert = style(root, '.so-alert')
		const factor = { sm: 0.875, normal: 1, lg: 1.125, xl: 1.25, '2xl': 1.5 }[size]
		expect(parseFloat(card.paddingBlockStart)).toBeCloseTo(14 * factor)
		expect(parseFloat(card.paddingInlineStart)).toBeCloseTo(16 * factor)
		expect(alert.paddingBlockStart).toBe(card.paddingBlockStart)
		expect(alert.paddingInlineStart).toBe(card.paddingInlineStart)
		expect(alert.columnGap).toBe(card.columnGap)
		expect(style(root, '.so-alert__content').marginBlockStart).toBe(
			style(document, '.so-toasts-item__body').rowGap,
		)
	})

	it('keeps exact Alert padding shorthands and body gaps above the message scale', () => {
		const root = render(
			defineComponent({
				render: () =>
					h(
						Alert,
						{
							size: '2xl',
							style: '--so-alert-padding:5px 10px 15px 20px;--so-alert-body-gap:7px',
						},
						{ title: () => 'Saved', default: () => 'Changes are ready.' },
					),
			}),
		)
		expect(style(root, '.so-alert').padding).toBe('5px 10px 15px 20px')
		expect(style(root, '.so-alert__content').marginBlockStart).toBe('7px')
	})
})
