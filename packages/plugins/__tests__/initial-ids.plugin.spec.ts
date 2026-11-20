import { describe, expect, it } from 'vitest'
import { TTabsItem } from '@soxa-ui/core'
import { TIdPlugin, TPluginBundle, TPluginMount, TTabsItemIdsPlugin } from '@soxa-ui/plugins'

const initial = {
	tabId: 'declared-tab',
	panelId: 'declared-panel',
	tabFallbackId: 'fallback-tab',
	panelFallbackId: 'fallback-panel',
}

function prepared(item: TTabsItem) {
	const mount = new TPluginMount()
	const bundle = new TPluginBundle(item, 'tab-mount', undefined, mount)
		.use(TIdPlugin)
		.use(TTabsItemIdsPlugin, { initial })
	const own = bundle.get(TIdPlugin)
	const ids = bundle.get(TTabsItemIdsPlugin)

	if (!own || !ids) throw new Error('Expected declared plugins')

	return { mount, bundle, own, ids }
}

describe('prepared tab document links', () => {
	it('render from the mount patch until acceptance, leaving the shared item alone', () => {
		const item = new TTabsItem({ value: 'a' })
		const before = item.aria.toObject()
		const { mount, bundle } = prepared(item)

		expect(mount.patches.aria).toEqual({
			id: 'fallback-tab',
			'aria-controls': 'declared-panel',
		})
		expect(item.aria.toObject()).toEqual(before)

		bundle.destroy()

		expect(item.aria.toObject()).toEqual(before)
	})

	it('move into the model on acceptance and follow custom ids and panels there', () => {
		const item = new TTabsItem({ value: 'a' })
		const { mount, bundle, own, ids } = prepared(item)
		const panelBundle = new TPluginBundle({}, 'panel-mount').use(TIdPlugin)
		const panel = panelBundle.get(TIdPlugin)
		const replacementBundle = new TPluginBundle({}, 'replacement-mount').use(TIdPlugin)
		const replacement = replacementBundle.get(TIdPlugin)

		if (!panel || !replacement) throw new Error('Expected declared plugins')

		mount.accept()

		expect(mount.patches).toEqual({})
		expect(item.aria.get('id')).toBe('fallback-tab')
		expect(item.aria.get('aria-controls')).toBe('declared-panel')

		own.id = 'live-tab'
		panel.id = 'live-panel'
		ids.bindPanel(panel)

		expect(item.aria.get('id')).toBe('live-tab')
		expect(item.aria.get('aria-controls')).toBe('live-panel')

		replacement.id = 'replacement-panel'
		ids.bindPanel(replacement)
		panel.id = 'detached-panel'
		ids.unbindPanel(panel)

		expect(item.aria.get('aria-controls')).toBe('replacement-panel')

		replacement.id = undefined
		own.id = undefined

		expect(item.aria.get('id')).toBe('fallback-tab')
		expect(item.aria.get('aria-controls')).toBe('fallback-panel')

		bundle.destroy()
		panelBundle.destroy()
		replacementBundle.destroy()
	})
})
