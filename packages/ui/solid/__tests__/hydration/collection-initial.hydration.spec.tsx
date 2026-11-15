import { describe, it, expect } from 'vitest'
import { CollectionInitial } from './pages'
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
		hydrateServed(container, () => <CollectionInitial automatic={automatic} />)
		expectServedNodes([...container.querySelectorAll('[role=tab]')], tabs)
		expect(container.querySelector('#panel-b')).toBe(panel)
		expect(panel?.getAttribute('aria-labelledby')).toBe('tab-b')
		expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '0'])
	})
})
