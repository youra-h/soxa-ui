import { expect, it, onTestFinished } from 'vitest'
import { h, nextTick, ref } from 'vue'
import { createEngineToasts } from '@soxa-ui/core'
import {
	Alert,
	Button,
	Calendar,
	CheckBox,
	DateInput,
	DatePicker,
	FileUpload,
	Input,
	NumberInput,
	RadioGroup,
	Rating,
	Select,
	Slider,
	Switch,
	Textarea,
	Toasts,
	ToggleButton,
	ToggleGroup,
} from '@soxa-ui/vue'
import { find, style } from './colors'
import { render } from './render'

import '@soxa-ui/theme-burg'

const variants = ['normal', 'negative', 'positive'] as const
const themes = ['burg', 'burg-dark']

function themeColor(root: HTMLElement, token: string): string {
	const probe = document.createElement('span')
	probe.style.color = 'var(--so-burg-' + token + ')'
	root.append(probe)
	const color = style(probe).color
	probe.remove()
	return color
}

it.each(themes)('colors all Button views in %s', (theme) => {
	const scene = render({
		render: () =>
			h(
				'div',
				{ 'data-so-theme': theme },
				variants.map((variant) =>
					h('div', { 'data-case': variant }, [
						h(Button, { variant, view: 'filled', text: 'Filled' }),
						h(Button, { variant, view: 'outlined', text: 'Outlined' }),
						h(Button, { variant, view: 'plain', text: 'Plain' }),
					]),
				),
			),
	})
	const root = find('[data-so-theme]', scene)
	const tones = ['text', 'danger', 'positive'].map((token) => themeColor(root, token))
	for (const [index, variant] of variants.entries()) {
		const row = find('[data-case="' + variant + '"]', root)
		const filled = find('.so-button--view-filled', row)
		const outlined = find('.so-button--view-outlined', row)
		const plain = find('.so-button--view-plain', row)

		expect(style(filled, '::after').backgroundColor).toBe(tones[index])
		expect(style(outlined).color).toBe(tones[index])
		expect(style(outlined, '::after').borderTopColor).toBe(
			index === 0 ? themeColor(root, 'border') : tones[index],
		)
		expect(style(plain).color).toBe(tones[index])
	}
})

it.each(themes)('updates the painted field borders in %s', async (theme) => {
	const variant = ref<(typeof variants)[number]>('normal')
	const scene = render({
		render: () =>
			h('div', { 'data-so-theme': theme }, [
				h(Input, { variant: variant.value, class: 'test-input' }),
				h(NumberInput, { variant: variant.value }),
				h(Textarea, { variant: variant.value }),
				h(DateInput, { variant: variant.value, class: 'test-date-input' }),
				h(DatePicker, { variant: variant.value }),
				h(DatePicker, { variant: variant.value, mode: 'range' }),
				h(Select, { variant: variant.value }),
			]),
	})
	const root = find('[data-so-theme]', scene)
	const fields = [
		'.test-input',
		'.so-number-input',
		'.so-textarea',
		'.test-date-input',
		'.so-date-picker__field',
		'.so-date-picker--mode-range',
		'.so-select__field',
	].map((selector) => find(selector, root))
	const tones = ['border', 'danger', 'positive'].map((token) => themeColor(root, token))

	for (const [index, value] of variants.entries()) {
		variant.value = value
		await nextTick()
		for (const field of fields) {
			expect(style(field).borderTopColor, field.className).toBe(tones[index])
		}
	}

	find('.so-textarea textarea', root).focus()
	expect(style(fields[2]).borderTopColor).toBe(tones[2])
	expect(style(fields[2]).outlineWidth).toBe('3px')

	fields[2].dataset.invalid = 'true'
	expect(style(fields[2]).borderTopColor).toBe(tones[1])
})

it.each(themes)('paints button groups and input controls in %s', async (theme) => {
	const variant = ref<(typeof variants)[number]>('normal')
	const scene = render({
		render: () =>
			h('div', { 'data-so-theme': theme }, [
				h(ToggleButton, { variant: variant.value, text: 'List' }),
				h(ToggleGroup, { variant: variant.value }, () =>
					h(ToggleGroup.Item, { text: 'Grid' }),
				),
				h(CheckBox, { variant: variant.value, value: true }),
				h(Switch, { variant: variant.value, value: true }),
				h(RadioGroup, { variant: variant.value, value: 'pickup' }, () =>
					h(RadioGroup.Item, { value: 'pickup' }, () => 'Pickup'),
				),
				h(Slider, { variant: variant.value, value: 50 }),
				h(Rating, { variant: variant.value, value: 3 }),
				h(Calendar, {
					variant: variant.value,
					months: ['2026-05-01'],
					value: '2026-05-12',
				}),
				h(FileUpload, { variant: variant.value }),
			]),
	})
	const root = find('[data-so-theme]', scene)
	const parts = [
		['.so-toggle-button', 'color'],
		['.so-toggle-group-item', 'color'],
		['.so-check-box__container', 'backgroundColor'],
		['.so-switch__track', 'backgroundColor'],
		['.so-radio-group-item__indicator', 'backgroundColor'],
		['.so-slider__range', 'backgroundColor'],
		['.so-rating__star-fill', 'color'],
		['.so-calendar-item[data-selected="true"] .so-calendar-item__day', 'backgroundColor'],
		['.so-file-upload__dropzone', 'borderTopColor'],
	] as const

	for (const [value, token] of [
		['normal', 'text'],
		['negative', 'danger'],
		['positive', 'positive'],
	] as const) {
		variant.value = value
		await nextTick()
		for (const [selector, property] of parts) {
			const element = find(selector, root)
			const color = themeColor(
				root,
				token === 'text' && selector === '.so-file-upload__dropzone' ? 'border' : token,
			)
			expect(style(element)[property], selector).toBe(color)
		}
	}
})

it.each(themes)('keeps the full Alert and Toasts palettes in %s', async (theme) => {
	document.documentElement.dataset.soTheme = theme
	onTestFinished(() => document.documentElement.removeAttribute('data-so-theme'))

	const messages = [
		['normal', undefined, 'muted'],
		['accent', 'info', 'progress-accent'],
		['positive', 'success', 'positive'],
		['caution', 'warning', 'caution'],
		['negative', 'error', 'danger'],
	] as const
	const engine = createEngineToasts()
	const scene = render({
		render: () =>
			h('div', { 'data-so-theme': theme }, [
				h(Toasts, { engine, duration: 0, max: messages.length }),
				...messages.map(([variant]) => h(Alert, { key: variant, variant })),
			]),
	})
	const root = find('[data-so-theme]', scene)
	await nextTick()
	for (const [variant, type] of messages) {
		engine.extensions.toasts.show({ type, text: variant, view: 'filled' })
	}
	await nextTick()

	for (const [variant, type, token] of messages) {
		const alert = find('.so-alert--variant-' + variant, root)
		const toast = find(
			type
				? '.so-toasts-item--type-' + type + ' .so-toasts-item__card'
				: '.so-toasts-item:not([class*="--type-"]) .so-toasts-item__card',
		)

		const tone = themeColor(root, token)
		expect(style(alert).borderInlineStartColor).toBe(tone)
		expect(style(toast).backgroundColor).toBe(tone)
	}
})
