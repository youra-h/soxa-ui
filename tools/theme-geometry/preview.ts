import { createApp, defineComponent, h, nextTick } from 'vue'
import {
	Input,
	DateInput,
	NumberInput,
	Textarea,
	Button,
	ListBox,
	Alert,
	Toasts,
} from '@soxa-ui/vue'
import { createEngineToasts } from '@soxa-ui/core'
import { useIcons } from '@soxa-ui/setup'
import * as icons from '@soxa-ui/icons-material'

useIcons(icons)
const sizes = ['sm', 'normal', 'lg', 'xl', '2xl'] as const
const icon = () =>
	h(
		'svg',
		{
			class: 'sample-icon',
			viewBox: '0 0 24 24',
			fill: 'none',
			stroke: 'currentColor',
			'aria-hidden': 'true',
		},
		[h('circle', { cx: 10, cy: 10, r: 6 }), h('path', { d: 'm15 15 6 6' })],
	)
const engines = sizes.map(() => createEngineToasts())
const inputSlots = { leading: () => [icon(), icon()] }

createApp(
	defineComponent({
		render: () => [
			h('h1', 'Oren · radius and spacing · sm → 2xl'),
			h(
				'p',
				'Input, DateInput, NumberInput, Textarea, Button, ListBox and Alert. Identical fixture before and after.',
			),
			h(
				'div',
				{ class: 'matrix' },
				sizes.map((size) =>
					h('section', { class: 'cell', 'data-size': size }, [
						h('h2', size),
						h(
							Input,
							{ size, value: 'Search', clearable: true, aria_label: `Input ${size}` },
							inputSlots,
						),
						h(
							DateInput,
							{
								size,
								value: '2026-11-21',
								clearable: true,
								aria_label: `Date ${size}`,
							},
							inputSlots,
						),
						h(NumberInput, {
							size,
							clearable: true,
							value: 42,
							aria_label: `Number ${size}`,
						}),
						h(Textarea, { size, value: 'A short note', aria_label: `Note ${size}` }),
						h(Button, { size }, { leading: icon, default: () => 'Action' }),
						h(ListBox, { size, aria_label: `List ${size}` }, () => [
							h(ListBox.Item, { value: 'one' }, () => 'First option'),
							h(ListBox.Item, { value: 'two' }, () => 'Second option'),
						]),
						h(
							Alert,
							{ size, closable: true },
							{
								title: () => 'Saved',
								default: () => 'Your changes are ready.',
								icon,
							},
						),
						h('div', { id: `toast-${size}` }),
					]),
				),
			),
		],
	}),
).mount('#app')
await nextTick()
sizes.forEach((size, index) => {
	const target = document.getElementById(`toast-${size}`)
	if (!target) throw new Error('Toast target is missing')
	const holder = document.createElement('div')
	document.body.append(holder)
	createApp({
		render: () =>
			h(Toasts, {
				engine: engines[index],
				target,
				duration: 0,
				style: `position:relative;inset:auto;width:100%;--so-toasts-width:100%;--so-toasts-spacing-scale:var(--so-message-scale-${size},1)`,
			}),
	}).mount(holder)
})
for (const engine of engines)
	engine.extensions.toasts.show({ text: 'Saved', description: 'Your changes are ready.' })
await nextTick()
document.documentElement.dataset.ready = 'true'
