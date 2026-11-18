import { describe, it, expect } from 'vitest'
import Example from '../CollectionInitial.test.svelte'
import { expectServedNodes, hydrateServed, markupOf, serve } from './serve'

describe('explicit initial source hydration', () => {
	it.each([false, true])('keeps server nodes, ids and roving stop, automatic=%s', (automatic) => {
		const container = serve(
			markupOf(automatic ? 'collection-initial-auto' : 'collection-initial'),
		)
		const tabs = [...container.querySelectorAll('[role=tab]')]
		const panel = container.querySelector('#panel-b')
		expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '0'])
		expect(tabs[1].getAttribute('aria-controls')).toBe('panel-b')
		hydrateServed(container, Example, { automatic })
		expectServedNodes([...container.querySelectorAll('[role=tab]')], tabs)
		expect(container.querySelector('#panel-b')).toBe(panel)
		expect(panel?.getAttribute('aria-labelledby')).toBe('tab-b')
		expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '0'])
	})
	it('keeps the prepared Tags selection during hydration', () => {
		const container = serve(markupOf('collection-initial-tags'))
		const rows = [...container.querySelectorAll('[role=option]')]
		expect(rows.map((row) => row.getAttribute('tabindex'))).toEqual(['-1', '0'])
		hydrateServed(container, Example, { tags: true })
		expectServedNodes([...container.querySelectorAll('[role=option]')], rows)
		expect(rows.map((row) => row.getAttribute('tabindex'))).toEqual(['-1', '0'])
	})
})
