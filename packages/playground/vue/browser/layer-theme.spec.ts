import { afterEach, beforeEach, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { IPreviewHandle } from '@soxa-ui/playground-shared'
import { loadHost } from '../src/hosts'
import '@soxa-ui/theme-oren'

let handle: IPreviewHandle | undefined
let scope: HTMLDivElement
let previousTheme: string | undefined

beforeEach(() => {
	previousTheme = document.documentElement.dataset.soTheme
	document.documentElement.dataset.soTheme = 'oren'
	scope = document.createElement('div')
	scope.dataset.soTheme = 'oren-dark'
	document.body.append(scope)
})

afterEach(() => {
	handle?.unmount()
	handle = undefined
	scope.remove()

	if (previousTheme === undefined) delete document.documentElement.dataset.soTheme
	else document.documentElement.dataset.soTheme = previousTheme
})

function openPanel(component: string): HTMLElement | undefined {
	// A preview also mounts hidden submenu panels; their DOM order differs across adapters.
	return [...document.querySelectorAll('.so-' + component + '__panel')].find(
		(node): node is HTMLElement =>
			node instanceof HTMLElement && getComputedStyle(node).display !== 'none',
	)
}

const cases = ['vue', 'react', 'solid', 'svelte', 'angular', 'webc'].flatMap((adapter) =>
	['menu', 'popover', 'tooltip', 'select'].map((component) => [adapter, component] as const),
)

it.each(cases)(
	'%s: a teleported %s retains its local theme',
	async (adapter, component) => {
		const host = await loadHost(adapter)
		const mount = document.createElement('div')
		scope.append(mount)

		handle = host.mount(mount, { component, props: { open: true } })
		await expect.poll(() => openPanel(component)).toBeDefined()

		const panel = openPanel(component)
		if (panel === undefined) throw new Error('Missing open anchored panel')

		expect(scope.contains(panel)).toBe(false)

		const localSurface = getComputedStyle(scope).getPropertyValue('--so-component-surface')
		expect(localSurface.trim()).not.toBe('')
		expect(getComputedStyle(panel).getPropertyValue('--so-component-surface')).toBe(
			localSurface,
		)

		scope.dataset.soTheme = 'oren'
		await expect
			.poll(() => getComputedStyle(panel).getPropertyValue('--so-component-surface'))
			.toBe(getComputedStyle(scope).getPropertyValue('--so-component-surface'))

		panel.dataset.soTheme = 'oren-dark'
		await expect
			.poll(() => getComputedStyle(panel).getPropertyValue('--so-component-surface'))
			.toBe(localSurface)

		document.documentElement.dataset.soTheme = 'oren-dark'
		delete scope.dataset.soTheme
		await expect.poll(() => panel.dataset.soTheme).toBe('oren-dark')

		panel.dataset.soTheme = 'oren'
		scope.dataset.soTheme = 'oren-dark'
		await expect
			.poll(() => getComputedStyle(panel).getPropertyValue('--so-component-surface'))
			.not.toBe(localSurface)

		delete panel.dataset.soTheme
		await expect
			.poll(() => getComputedStyle(panel).getPropertyValue('--so-component-surface'))
			.toBe(localSurface)
	},
	30000,
)

it.each(['vue', 'react', 'solid', 'svelte', 'angular', 'webc'])(
	'%s: a nested Menu follows its owner theme',
	async (adapter) => {
		const host = await loadHost(adapter)
		handle = host.mount(scope, { component: 'menu', props: { open: true } })
		await expect.poll(() => openPanel('menu')).toBeDefined()

		const panel = openPanel('menu')
		const trigger = panel?.querySelector('[aria-haspopup="menu"]')
		if (!(trigger instanceof HTMLElement)) throw new Error('Missing submenu trigger')

		await userEvent.click(trigger)
		const visiblePanels = () =>
			[...document.querySelectorAll('.so-menu__panel')].filter(
				(node) => getComputedStyle(node).display !== 'none',
			)
		await expect.poll(() => visiblePanels().length).toBe(2)

		for (const theme of ['oren', 'oren-dark']) {
			scope.dataset.soTheme = theme
			const surface = getComputedStyle(scope).getPropertyValue('--so-component-surface')
			await expect
				.poll(() =>
					visiblePanels().map((node) =>
						getComputedStyle(node).getPropertyValue('--so-component-surface'),
					),
				)
				.toEqual([surface, surface])
		}
	},
	30000,
)
