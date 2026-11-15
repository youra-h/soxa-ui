// @vitest-environment jsdom

import { describe, it, expect } from 'vitest'
import { TDatePicker, TSelect } from '@soxa-ui/core'
import { TDatePickerIdsPlugin, TElementPlugin, TPluginBundle, TSelectIdsPlugin } from '../src'

function required<T>(value: T | undefined): T {
	if (value === undefined) throw new Error('Expected plugin is missing')
	return value
}

for (const kind of ['select', 'date-picker'] as const) {
	describe(kind + ' popup references', () => {
		function owner(open = false, id = 'm1') {
			const ctrl = kind === 'select' ? new TSelect({ open }) : new TDatePicker({ open })
			const bundle = new TPluginBundle(ctrl, id)
			const ids =
				kind === 'select'
					? required(bundle.use(TSelectIdsPlugin).get(TSelectIdsPlugin))
					: required(bundle.use(TDatePickerIdsPlugin).get(TDatePickerIdsPlugin))
			const aria = ctrl instanceof TSelect ? ctrl.field.aria : ctrl.triggerAria
			return { ctrl, bundle, ids, aria }
		}

		it('defers initial-open references until bind and removes them before the first frame', () => {
			const { ctrl, bundle, ids, aria } = owner(true)
			const panel = new TPluginBundle({}).use(TElementPlugin)
			const element = required(panel.get(TElementPlugin))
			ids.bindPanel(panel)
			expect(ctrl.open).toBe(true)
			expect(aria.has('aria-controls')).toBe(false)
			expect(aria.get('aria-expanded')).toBe('false')
			element.element = document.createElement('div')
			const id = aria.get('aria-controls')
			expect(id).toBe(kind === 'select' ? 'm1-list' : 'm1-panel')
			expect(aria.get('aria-expanded')).toBe('true')
			element.element = null
			expect(aria.has('aria-controls')).toBe(false)
			expect(aria.get('aria-expanded')).toBe('false')
			element.element = document.createElement('div')
			expect(aria.get('aria-controls')).toBe(id)
			ctrl.open = false
			expect(aria.get('aria-controls')).toBe(id)
			expect(aria.get('aria-expanded')).toBe('false')
			ctrl.open = true
			expect(aria.get('aria-expanded')).toBe('true')
			ctrl.visible = false
			expect(aria.get('aria-expanded')).toBe('false')
			ctrl.visible = true
			expect(aria.get('aria-expanded')).toBe('true')
			panel.destroy()
			expect(aria.has('aria-controls')).toBe(false)
			bundle.destroy()
		})

		it('ignores a replaced panel and an older mount of the same external control', () => {
			const { ctrl, bundle, ids, aria } = owner(true)
			const first = new TPluginBundle({}).use(TElementPlugin)
			const second = new TPluginBundle({}).use(TElementPlugin)
			ids.bindPanel(first)
			required(first.get(TElementPlugin)).element = document.createElement('div')
			ids.bindPanel(second)
			required(second.get(TElementPlugin)).element = document.createElement('div')
			first.destroy()
			expect(aria.get('aria-controls')).toBe(kind === 'select' ? 'm1-list' : 'm1-panel')
			const newer = new TPluginBundle(ctrl, 'm2')
			const nextIds =
				kind === 'select'
					? required(newer.use(TSelectIdsPlugin).get(TSelectIdsPlugin))
					: required(newer.use(TDatePickerIdsPlugin).get(TDatePickerIdsPlugin))
			nextIds.bindPanel(second)
			bundle.destroy()
			ctrl.open = false
			ctrl.open = true
			expect(aria.get('aria-controls')).toBe(kind === 'select' ? 'm2-list' : 'm2-panel')
			newer.destroy()
			second.destroy()
		})
	})
}
