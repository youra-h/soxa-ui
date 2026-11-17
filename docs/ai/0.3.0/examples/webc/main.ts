import {
	TInputElement,
	TCheckBoxElement,
	TSelectElement,
	TDatePickerElement,
	TLocaleProviderElement,
	TButtonElement,
} from '@soxa-ui/webc'
import { enUS } from '@soxa-ui/plugins'
import './setup'

const app = document.getElementById('app')
if (!app) throw new Error('Missing application mount')

function mount(container: HTMLElement) {
	const view = document.createElement('section')
	const provider = document.createElement('so-locale-provider')
	const input = document.createElement('div', { is: 'so-input' })
	const checkbox = document.createElement('span', { is: 'so-check-box' })
	const select = document.createElement('div', { is: 'so-select' })
	const picker = document.createElement('div', { is: 'so-date-picker' })
	const keep = document.createElement('button', { is: 'so-button' })

	if (
		!(provider instanceof TLocaleProviderElement) ||
		!(input instanceof TInputElement) ||
		!(checkbox instanceof TCheckBoxElement) ||
		!(select instanceof TSelectElement) ||
		!(picker instanceof TDatePickerElement) ||
		!(keep instanceof TButtonElement)
	) {
		throw new Error('Register the matching elements before constructing markup')
	}

	// Construct customized built-ins directly: detached innerHTML upgrades later in WebKit.
	const form = document.createElement('form')
	const nameLabel = document.createElement('label', { is: 'so-label' })
	const policyLabel = document.createElement('label', { is: 'so-label' })
	nameLabel.setAttribute('text', 'Traveler name')
	policyLabel.setAttribute('text', 'Accept travel policy')
	input.name = 'traveler'
	input.dataset.field = 'traveler'
	checkbox.name = 'policy'
	checkbox.dataset.field = 'policy'
	select.name = 'destination'
	select.aria_label = 'Destination'
	select.dataset.field = 'destination'
	picker.name = 'departure'
	picker.aria_label = 'Departure'
	picker.dataset.field = 'departure'
	nameLabel.append(input)
	policyLabel.append(checkbox)
	const code = document.createElement('input')
	code.type = 'hidden'
	code.name = 'destinationCode'

	const accordion = document.createElement('div', { is: 'so-accordion' })
	const item = document.createElement('div', { is: 'so-accordion-item' })
	item.setAttribute('value', 'help')
	item.setAttribute('text', 'Travel help')
	const advice = document.createElement('p')
	advice.textContent = 'Bring your travel documents.'
	item.append(advice)
	accordion.append(item)

	const save = document.createElement('button', { is: 'so-button' })
	save.type = 'submit'
	save.setAttribute('text', 'Save preferences')
	save.setAttribute('variant', 'accent')
	form.append(nameLabel, policyLabel, select, code, picker, accordion, save)
	provider.append(form)
	for (const [action, text] of [
		['restore', 'Restore defaults'],
		['hide', 'Try hiding'],
	]) {
		const button = document.createElement('button', { is: 'so-button' })
		button.type = 'button'
		button.dataset.action = action
		button.setAttribute('text', text)
		provider.append(button)
	}
	keep.type = 'button'
	keep.text = 'Keep me visible'
	provider.append(keep)
	for (const name of ['values', 'change', 'saved', 'canceled']) {
		const output = document.createElement('output')
		output.dataset.testid = name
		provider.append(output)
	}
	view.append(provider)

	// Objects are properties; complete the light DOM and initial props before insertion.
	provider.locale = enUS
	select.items = [
		{ value: 'kzn', text: 'Kazan' },
		{ value: 'msk', text: 'Moscow' },
	]
	select.value = 'kzn'
	picker.value = '2026-11-14'
	input.value = ''
	checkbox.value = false

	if (false) {
		// @ts-expect-error Props retain their published boolean contract.
		checkbox.disabled = 'yes'
		// @ts-expect-error Element values retain the published date contract.
		picker.value = 42
	}

	const events = new AbortController()
	const output = (name: string, text: string) => {
		const node = view.querySelector('[data-testid="' + name + '"]')
		if (node) node.textContent = text
	}
	const paintValues = () => {
		output('values', [input.value, checkbox.value, select.value, picker.value].join('|'))
		// The Select native field submits its display text; domain values need their own field.
		const code = view.querySelector('input[name="destinationCode"]')
		if (code instanceof HTMLInputElement) code.value = String(select.value ?? '')
	}
	for (const field of [input, checkbox, select, picker]) {
		field.addEventListener('so:change:value', paintValues, { signal: events.signal })
	}
	input.addEventListener(
		'so:change:value',
		(event) => {
			if (!(event instanceof CustomEvent)) return
			const payload: unknown = event.detail
			if (
				payload &&
				typeof payload === 'object' &&
				'newValue' in payload &&
				typeof payload.newValue === 'string'
			)
				output('change', payload.newValue)
		},
		{ signal: events.signal },
	)

	view.querySelector('[data-action="restore"]')?.addEventListener(
		'so:action:press',
		() => {
			input.value = 'Alex'
			checkbox.value = false
			select.value = 'kzn'
			picker.value = '2026-11-14'
			paintValues()
		},
		{ signal: events.signal },
	)
	keep.addEventListener(
		'so:hide:before',
		(event) => {
			event.preventDefault()
			output('canceled', 'Hide canceled')
		},
		{ signal: events.signal },
	)
	view.querySelector('[data-action="hide"]')?.addEventListener(
		'so:action:press',
		() => {
			keep.ctrl?.hide()
		},
		{ signal: events.signal },
	)
	view.querySelector('form')?.addEventListener(
		'submit',
		(event) => {
			event.preventDefault()
			const form = event.currentTarget
			if (form instanceof HTMLFormElement) {
				output('saved', JSON.stringify(Object.fromEntries(new FormData(form))))
			}
		},
		{ signal: events.signal },
	)

	container.append(view)
	paintValues()
	// DOM connection does not imply immediate polyfill assembly or element-ready notification.
	requestAnimationFrame(() => {
		if (view.isConnected) view.dataset.testid = 'mounted'
	})
	return () => {
		events.abort()
		view.remove()
	}
}

let unmount = mount(app)
const toggle = document.createElement('button')
toggle.textContent = 'Toggle travel form'
app.before(toggle)
toggle.addEventListener('click', () => {
	if (app.childElementCount) unmount()
	else unmount = mount(app)
})
