// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { TFrame } from '@soxa-ui/core'
import { TAnchorPlugin, TElementPlugin, TFrameThemePlugin, TPluginBundle } from '../src'

const bundles: TPluginBundle[] = []
const flush = () => new Promise<void>((resolve) => queueMicrotask(() => resolve()))

function setup({ contained = false, explicit = false } = {}) {
	const scope = document.createElement('div')
	const anchor = document.createElement('button')
	const panel = document.createElement('div')
	scope.dataset.soTheme = 'oren-dark'
	scope.append(anchor)
	document.body.append(scope, panel)
	if (explicit) panel.dataset.soTheme = 'custom'

	const frame = new TFrame({ visible: false, contained })
	const bundle = new TPluginBundle(frame)
		.use(TElementPlugin)
		.use(TAnchorPlugin)
		.use(TFrameThemePlugin)
	bundles.push(bundle)

	const element = bundle.get(TElementPlugin)
	const position = bundle.get(TAnchorPlugin)
	if (!element || !position) throw new Error('Missing Frame plugins')

	position.setAnchor(anchor)
	element.element = panel

	return { scope, anchor, panel, frame, bundle, element, position }
}

afterEach(() => {
	for (const bundle of bundles) bundle.destroy()
	bundles.length = 0
	document.body.innerHTML = ''
})

describe('Frame theme inheritance', () => {
	it('copies the nearest theme before the deferred ready event', () => {
		const { panel } = setup()

		expect(panel.dataset.soTheme).toBe('oren-dark')
	})

	it('follows changes, nearer scopes, removals and anchor moves', async () => {
		const { scope, anchor, panel } = setup()
		scope.dataset.soTheme = 'custom-dark'
		await flush()
		expect(panel.dataset.soTheme).toBe('custom-dark')

		anchor.dataset.soTheme = 'oren'
		await flush()
		expect(panel.dataset.soTheme).toBe('oren')

		delete anchor.dataset.soTheme
		delete scope.dataset.soTheme
		await flush()
		expect(panel.hasAttribute('data-so-theme')).toBe(false)

		const other = document.createElement('div')
		other.dataset.soTheme = 'other'
		document.body.append(other)
		other.append(anchor)
		await flush()
		expect(panel.dataset.soTheme).toBe('other')
	})

	it('preserves explicit themes and resumes inheritance after their removal', async () => {
		const { scope, panel } = setup({ explicit: true })
		scope.dataset.soTheme = 'oren'
		await flush()
		expect(panel.dataset.soTheme).toBe('custom')

		delete panel.dataset.soTheme
		await flush()
		expect(panel.dataset.soTheme).toBe('oren')

		panel.dataset.soTheme = 'application'
		await flush()
		scope.dataset.soTheme = 'oren-dark'
		await flush()
		expect(panel.dataset.soTheme).toBe('application')
	})

	it('respects an explicit write equal to the inherited value, including before teardown', async () => {
		const { panel, scope, bundle } = setup()
		panel.dataset.soTheme = 'oren-dark'
		scope.dataset.soTheme = 'oren'
		await flush()
		expect(panel.dataset.soTheme).toBe('oren-dark')

		const other = setup()
		other.panel.dataset.soTheme = 'oren-dark'
		other.bundle.destroy()
		expect(other.panel.dataset.soTheme).toBe('oren-dark')

		bundle.destroy()
		expect(panel.dataset.soTheme).toBe('oren-dark')
	})

	it('releases only its own attribute on unbind and destroy', async () => {
		const { scope, panel, element, bundle } = setup()
		element.element = null
		expect(panel.hasAttribute('data-so-theme')).toBe(false)

		element.element = panel
		panel.dataset.soTheme = 'explicit'
		bundle.destroy()
		scope.dataset.soTheme = 'changed'
		await flush()
		expect(panel.dataset.soTheme).toBe('explicit')
	})

	it('restores natural inheritance when contained and resumes when teleported', () => {
		const { panel, frame } = setup({ contained: true })
		expect(panel.hasAttribute('data-so-theme')).toBe(false)

		frame.contained = false
		expect(panel.dataset.soTheme).toBe('oren-dark')

		frame.contained = true
		expect(panel.hasAttribute('data-so-theme')).toBe(false)
	})

	it('follows anchor replacement and removes the inherited theme without an anchor', () => {
		const { panel, position } = setup()
		const anchor = document.createElement('button')
		anchor.dataset.soTheme = 'replacement'
		document.body.append(anchor)

		position.setAnchor(anchor)
		expect(panel.dataset.soTheme).toBe('replacement')

		position.removeAnchor()
		expect(panel.hasAttribute('data-so-theme')).toBe(false)
	})

	it('inherits through a shadow host and follows changes to that host', async () => {
		const { scope, anchor, panel } = setup()
		const root = scope.attachShadow({ mode: 'open' })
		root.append(anchor)
		await flush()
		expect(panel.dataset.soTheme).toBe('oren-dark')

		scope.dataset.soTheme = 'oren'
		await flush()
		expect(panel.dataset.soTheme).toBe('oren')

		const inner = document.createElement('div')
		inner.dataset.soTheme = 'shadow-scope'
		root.append(inner)
		inner.append(anchor)
		await flush()
		expect(panel.dataset.soTheme).toBe('shadow-scope')
	})

	it('supports installation after the panel is already bound', () => {
		const { bundle, panel } = setup()
		bundle.remove(TFrameThemePlugin)
		expect(panel.hasAttribute('data-so-theme')).toBe(false)

		bundle.use(TFrameThemePlugin)
		expect(panel.dataset.soTheme).toBe('oren-dark')
	})

	it('propagates theme changes to a nested panel through its anchor', async () => {
		const outer = setup()
		const inner = setup()
		outer.panel.append(inner.anchor)
		await flush()
		expect(inner.panel.dataset.soTheme).toBe('oren-dark')

		outer.scope.dataset.soTheme = 'oren'
		await flush()
		await flush()
		expect(inner.panel.dataset.soTheme).toBe('oren')
	})
})
