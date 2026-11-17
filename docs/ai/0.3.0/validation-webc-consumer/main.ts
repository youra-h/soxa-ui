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
import './style.css'

type SessionCode = 'clay' | 'print'
interface Signup {
	attendee: string
	reminders: boolean
	sessionCode: SessionCode
	date: string
}
const app = document.getElementById('app')
const route = document.getElementById('route')
if (!app || !(route instanceof HTMLButtonElement)) throw new Error('Missing workshop shell')
let eventCount = 0

function make(
	tag: string,
	attributes: Record<string, string> = {},
	children: (Node | string)[] = [],
) {
	const node = document.createElement(tag, attributes.is ? { is: attributes.is } : undefined)
	for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value)
	node.append(...children)
	return node
}

function createSignup(container: HTMLElement) {
	const state: Signup = {
		attendee: '',
		reminders: false,
		sessionCode: 'clay',
		date: '2026-11-21',
	}
	// Construct custom native roots directly before assigning typed properties.
	const attendee = make('div', { is: 'so-input', name: 'attendee', 'data-field': 'attendee' })
	const reminders = make('span', {
		is: 'so-check-box',
		name: 'reminders',
		'data-field': 'reminders',
	})
	const session = make('div', {
		is: 'so-select',
		name: 'session',
		aria_label: 'Workshop session',
		'data-field': 'session',
	})
	const date = make('div', {
		is: 'so-date-picker',
		name: 'date',
		aria_label: 'Workshop date',
		'data-field': 'date',
	})
	const domainField = make('input', { type: 'hidden', name: 'sessionCode' })
	const keep = make('button', {
		is: 'so-button',
		type: 'button',
		'data-action': 'keep',
		text: 'Keep draft',
	})
	const accordion = make('div', { is: 'so-accordion' }, [
		make('div', { is: 'so-accordion-item', value: 'materials', text: 'Materials and access' }, [
			make('p', {}, ['Clay, inks and step-free access are included.']),
		]),
		make('div', { is: 'so-accordion-item', value: 'cancel', text: 'Cancellation policy' }, [
			make('p', {}, ['Cancel your seat at least one day before the workshop.']),
		]),
	])
	const form = make('form', {}, [
		make('label', { is: 'so-label', text: 'Attendee name' }, [attendee]),
		make('label', { is: 'so-label', text: 'Send session reminders' }, [reminders]),
		make('div', { class: 'field' }, [make('span', {}, ['Workshop session']), session]),
		domainField,
		make('div', { class: 'field' }, [make('span', {}, ['Workshop date']), date]),
		accordion,
		make(
			'button',
			{ is: 'so-button', type: 'submit', text: 'Reserve workshop', variant: 'accent' },
			[make('span', { slot: 'leading', 'aria-hidden': 'true' }, ['+'])],
		),
	])
	const provider = make('so-locale-provider', {}, [
		form,
		make('div', { class: 'actions' }, [
			make('button', {
				is: 'so-button',
				type: 'button',
				'data-action': 'load',
				text: 'Load saved signup',
			}),
			keep,
			make('button', {
				is: 'so-button',
				type: 'button',
				'data-action': 'hide',
				text: 'Try hide draft',
			}),
		]),
		make('p', {}, ['Current signup: ', make('output', { id: 'state' })]),
		make('p', {}, ['Last event: ', make('output', { id: 'last-event' })]),
		make('p', {}, ['Reservation: ', make('output', { id: 'reservation' })]),
		make('output', { id: 'cancellation' }),
	])
	const section = make('section', {}, [provider])
	if (
		!(provider instanceof TLocaleProviderElement) ||
		!(attendee instanceof TInputElement) ||
		!(reminders instanceof TCheckBoxElement) ||
		!(session instanceof TSelectElement) ||
		!(date instanceof TDatePickerElement) ||
		!(keep instanceof TButtonElement) ||
		!(domainField instanceof HTMLInputElement)
	)
		throw new Error('Registration failed')
	provider.locale = enUS
	session.items = [
		{ value: 'clay', text: 'Clay handbuilding' },
		{ value: 'print', text: 'Printmaking basics' },
	]
	const write = () => {
		attendee.value = state.attendee
		reminders.value = state.reminders
		session.value = state.sessionCode
		date.value = state.date
	}
	const show = (id: string, value: string) => {
		const node = section.querySelector('#' + id)
		if (node) node.textContent = value
	}
	const paint = () => {
		domainField.value = state.sessionCode
		show('state', JSON.stringify(state))
	}
	write()
	if (false) {
		// @ts-expect-error Published CheckBox flags require a boolean.
		reminders.disabled = 'false'
		// @ts-expect-error Published DatePicker values cannot be numeric timestamps.
		date.value = 123
	}
	const listeners = new AbortController()
	for (const [fieldName, field] of [
		['attendee', attendee],
		['reminders', reminders],
		['session', session],
		['date', date],
	] as const) {
		field.addEventListener(
			'so:change:value',
			(event) => {
				if (!(event instanceof CustomEvent)) return
				const payload: unknown = event.detail
				if (
					!payload ||
					typeof payload !== 'object' ||
					!('newValue' in payload) ||
					!('oldValue' in payload)
				)
					return
				eventCount++
				const counter = document.getElementById('listener-count')
				if (counter) counter.textContent = String(eventCount)
				if (fieldName === 'attendee' && typeof payload.newValue === 'string')
					state.attendee = payload.newValue
				if (fieldName === 'reminders') state.reminders = payload.newValue === true
				if (
					fieldName === 'session' &&
					(payload.newValue === 'clay' || payload.newValue === 'print')
				)
					state.sessionCode = payload.newValue
				if (fieldName === 'date' && typeof payload.newValue === 'string')
					state.date = payload.newValue
				show(
					'last-event',
					JSON.stringify({
						field: fieldName,
						newValue: payload.newValue,
						oldValue: payload.oldValue,
					}),
				)
				paint()
			},
			{ signal: listeners.signal },
		)
	}
	section.querySelector('[data-action="load"]')?.addEventListener(
		'so:action:press',
		() => {
			Object.assign(state, {
				attendee: 'Morgan Chen',
				reminders: true,
				sessionCode: 'print',
				date: '2026-12-05',
			} satisfies Signup)
			write()
			paint()
		},
		{ signal: listeners.signal },
	)
	keep.addEventListener(
		'so:hide:before',
		(event) => {
			event.preventDefault()
			show('cancellation', 'Draft remains available')
		},
		{ signal: listeners.signal },
	)
	section
		.querySelector('[data-action="hide"]')
		?.addEventListener('so:action:press', () => keep.ctrl?.hide(), { signal: listeners.signal })
	section.querySelector('form')?.addEventListener(
		'submit',
		(event) => {
			event.preventDefault()
			if (!(event.currentTarget instanceof HTMLFormElement)) return
			const fields = Object.fromEntries(new FormData(event.currentTarget))
			const reservation = {
				attendee: String(fields.attendee),
				sessionCode: fields.sessionCode,
				date: fields.date,
				reminders: state.reminders,
			}
			show('reservation', JSON.stringify({ fields, reservation }))
		},
		{ signal: listeners.signal },
	)
	container.append(section)
	paint()
	requestAnimationFrame(() => {
		if (section.isConnected) section.dataset.ready = 'true'
	})
	return () => {
		listeners.abort()
		section.remove()
	}
}
let dispose = createSignup(app)
route.addEventListener('click', () => {
	if (app.childElementCount) {
		dispose()
		route.textContent = 'Reopen signup'
	} else {
		dispose = createSignup(app)
		route.textContent = 'Close signup'
	}
})
