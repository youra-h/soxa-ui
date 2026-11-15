import { describe, it, expect } from 'vitest'
import { flushSync } from 'svelte'
import { TDatePicker, TSelect } from '@soxa-ui/core'
import PopupControls from './PopupControls.test.svelte'
import { hydrateServed, markupOf, serve } from './serve'
import { find, nextFrame } from '../mount'

function linked(): void {
	const triggers = document.querySelectorAll('[role="combobox"], .so-date-picker__trigger')
	expect(triggers).toHaveLength(2)
	const ids = [...triggers].map((trigger) => trigger.getAttribute('aria-controls'))
	expect(new Set(ids).size).toBe(2)
	for (const id of ids) {
		expect(id).toBeTruthy()
		expect(
			[...document.querySelectorAll('[id]')].filter((node) => node.id === id),
		).toHaveLength(1)
	}
}

function press(element: Element, key: string): void {
	element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
	flushSync()
}

describe('popup references across SSR and hydration', () => {
	for (const initialOpen of [false, true]) {
		it(
			'preserves server nodes and connects unique targets; initialOpen=' + initialOpen,
			async () => {
				const container = serve(
					markupOf(initialOpen ? 'popup-controls-open' : 'popup-controls-closed'),
				)
				const field = find(container, '[role="combobox"]', HTMLInputElement)
				const trigger = find(container, '.so-date-picker__trigger', HTMLButtonElement)
				for (const element of [field, trigger]) {
					expect(element.hasAttribute('aria-controls')).toBe(false)
					expect(element.getAttribute('aria-expanded')).toBe('false')
				}
				const select = new TSelect({ open: initialOpen })
				const picker = new TDatePicker({ open: initialOpen, value: '2026-09-10' })
				hydrateServed(container, PopupControls, { initialOpen, select, picker })
				expect(find(container, '[role="combobox"]', HTMLInputElement)).toBe(field)
				expect(find(container, '.so-date-picker__trigger', HTMLButtonElement)).toBe(trigger)
				await nextFrame()
				linked()
				expect(select.open).toBe(initialOpen)
				expect(picker.open).toBe(initialOpen)
				expect(field.getAttribute('aria-expanded')).toBe(String(initialOpen))
				expect(trigger.getAttribute('aria-expanded')).toBe(String(initialOpen))
				await nextFrame()
				picker.open = false
				select.open = false
				flushSync()
				field.focus()
				press(field, 'ArrowDown')
				await nextFrame()
				expect(field.getAttribute('aria-expanded')).toBe('true')
				press(field, 'Enter')
				expect(
					new FormData(find(container, 'form', HTMLFormElement)).get('destination'),
				).toBe('Alpha')
				expect(select.value).toBe('a')
				press(field, 'Escape')
				expect(document.activeElement).toBe(field)
				trigger.click()
				flushSync()
				await nextFrame()
				expect(trigger.getAttribute('aria-expanded')).toBe('true')
				const panel = find(document, '.so-date-picker__panel', HTMLElement)
				expect(panel.id).toBe(trigger.getAttribute('aria-controls'))
				press(panel, 'Escape')
				await nextFrame()
				expect(picker.open).toBe(false)
				expect(container.contains(document.activeElement)).toBe(true)
				expect(new FormData(find(container, 'form', HTMLFormElement)).get('trip')).toBe(
					'2026-09-10',
				)
				const id = field.getAttribute('aria-controls')
				select.rendered = false
				flushSync()
				expect(select.field.aria.has('aria-controls')).toBe(false)
				select.rendered = true
				flushSync()
				await nextFrame()
				linked()
				expect(field.isConnected).toBe(false)
				expect(
					find(container, '[role="combobox"]', HTMLInputElement).getAttribute(
						'aria-controls',
					),
				).toBe(id)
			},
		)
	}
})
