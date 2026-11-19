import { describe, expect, it, vi } from 'vitest'
import { TTabsItem } from '@soxa-ui/core'
import { TIdPlugin, TPluginBundle, TTabsItemIdsPlugin } from '@soxa-ui/plugins'

describe('prepared tab document links', () => {
	it('tracks accepted custom IDs, replacement and cleanup without writing the shared item', () => {
		const item = new TTabsItem({ value: 'a' })
		const before = item.aria.toObject()
		const bundle = new TPluginBundle(item, 'tab-mount').use(TIdPlugin).use(TTabsItemIdsPlugin, {
			initial: {
				tabId: 'declared-tab',
				panelId: 'declared-panel',
				tabFallbackId: 'fallback-tab',
				panelFallbackId: 'fallback-panel',
			},
		})
		const own = bundle.get(TIdPlugin)
		const ids = bundle.get(TTabsItemIdsPlugin)
		const link = ids?.link
		const panelBundle = new TPluginBundle({}, 'panel-mount').use(TIdPlugin)
		const panel = panelBundle.get(TIdPlugin)
		const replacementBundle = new TPluginBundle({}, 'replacement-mount').use(TIdPlugin)
		const replacement = replacementBundle.get(TIdPlugin)

		if (!own || !ids || !link || !panel || !replacement) {
			throw new Error('Expected declared plugins')
		}

		const change = vi.fn()
		const stop = link.subscribe(change)

		own.id = 'declared-tab'
		panel.id = 'declared-panel'
		ids.bindPanel(panel)

		expect(link.getSnapshot()).toEqual({
			id: 'declared-tab',
			'aria-controls': 'declared-panel',
		})

		own.id = 'live-tab'
		panel.id = 'live-panel'

		expect(link.getSnapshot()).toEqual({ id: 'live-tab', 'aria-controls': 'live-panel' })

		replacement.id = 'replacement-panel'
		ids.bindPanel(replacement)
		panel.id = 'detached-panel'

		expect(link.getSnapshot()['aria-controls']).toBe('replacement-panel')

		ids.unbindPanel(panel)

		expect(link.getSnapshot()['aria-controls']).toBe('replacement-panel')

		replacement.id = undefined
		own.id = undefined

		expect(link.getSnapshot()).toEqual({
			id: 'fallback-tab',
			'aria-controls': 'fallback-panel',
		})

		ids.unbindPanel(replacement)

		expect(item.aria.toObject()).toEqual(before)

		stop()

		const calls = change.mock.calls.length

		own.id = 'silent'

		expect(change).toHaveBeenCalledTimes(calls)

		bundle.destroy()
		panelBundle.destroy()
		replacementBundle.destroy()
	})

	it('writes an ordinary mount into the tab model and keeps no link of its own', () => {
		const item = new TTabsItem({ value: 'a' })
		const bundle = new TPluginBundle(item, 'tab-mount').use(TIdPlugin).use(TTabsItemIdsPlugin)

		expect(bundle.get(TTabsItemIdsPlugin)?.link).toBeUndefined()
		expect(item.aria.get('id')).toBe('tab-mount-tab')
		expect(item.aria.get('aria-controls')).toBe('tab-mount-panel')

		bundle.destroy()
	})
})
