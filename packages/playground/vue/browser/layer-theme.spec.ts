import { afterEach, beforeEach, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createApp, h } from 'vue'
import { Button, Input, Popover } from '@soxa-ui/vue'
import type { DescriptorSlots, PopoverDescriptor } from '@soxa-ui/setup'
import type { IPreviewHandle } from '@soxa-ui/playground-shared'
import { loadHost } from '../src/hosts'
import '@soxa-ui/theme-oren'

let handle: IPreviewHandle | undefined
let unmountVue: (() => void) | undefined
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
	unmountVue?.()
	unmountVue = undefined
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

const adapters = ['vue', 'react', 'solid', 'svelte', 'angular', 'webc'] as const
const anchored = ['menu', 'popover', 'tooltip', 'select', 'date-picker'] as const
const cases = adapters.flatMap((adapter) =>
	anchored.map((component) => [adapter, component] as const),
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

it.each(adapters)(
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

it.each(cases)(
	'%s: %s first opens in the current local theme after a closed update',
	async (adapter, component) => {
		const host = await loadHost(adapter)
		handle = host.mount(scope, { component, props: { open: false } })
		await expect.poll(() => scope.querySelector('.so-' + component)).not.toBeNull()
		scope.dataset.soTheme = 'oren'
		document.documentElement.dataset.soTheme = 'oren-dark'
		handle.update({ open: true })

		await expect.poll(() => openPanel(component)?.dataset.soTheme).toBe('oren')
		const panel = openPanel(component)
		if (!panel) throw new Error('Missing open anchored panel')
		expect(scope.contains(panel)).toBe(false)
		expect(getComputedStyle(panel).getPropertyValue('--so-component-surface')).toBe(
			getComputedStyle(scope).getPropertyValue('--so-component-surface'),
		)

		handle.update({ open: false })
		await expect.poll(() => openPanel(component)).toBeUndefined()
		scope.dataset.soTheme = 'oren-dark'
		document.documentElement.dataset.soTheme = 'oren'
		handle.update({ open: true })
		await expect.poll(() => openPanel(component)?.dataset.soTheme).toBe('oren-dark')
	},
	30000,
)

it.each(adapters)(
	'%s: contained Popover keeps natural local theme inheritance',
	async (adapter) => {
		const component = 'popover'
		const host = await loadHost(adapter)
		handle = host.mount(scope, { component, props: { open: true, contained: true } })
		await expect.poll(() => openPanel(component)).toBeDefined()
		const panel = openPanel(component)
		if (!panel) throw new Error('Missing contained panel')
		expect(scope.contains(panel)).toBe(true)
		expect(panel.hasAttribute('data-so-theme')).toBe(false)
		for (const theme of ['oren-dark', 'oren']) {
			scope.dataset.soTheme = theme
			await expect
				.poll(() => getComputedStyle(panel).getPropertyValue('--so-component-surface'))
				.toBe(getComputedStyle(scope).getPropertyValue('--so-component-surface'))
		}
	},
	30000,
)

it.each(
	adapters.flatMap((adapter) =>
		['dialog', 'alert-dialog', 'drawer', 'toasts'].map(
			(component) => [adapter, component] as const,
		),
	),
)(
	'%s: %s inherits the explicit portal target theme',
	async (adapter, component) => {
		const host = await loadHost(adapter)
		const mount = document.createElement('div')
		const target = document.createElement('div')
		target.id = 'theme-audit-target'
		scope.append(mount, target)
		handle = host.mount(mount, {
			component,
			props: { visible: true, target: '#theme-audit-target' },
		})
		const root = () => target.querySelector('.so-' + component)
		await expect.poll(root).not.toBeNull()
		const panel = root()
		if (!panel) throw new Error('Missing layer in explicit target')
		for (const theme of ['oren-dark', 'oren']) {
			scope.dataset.soTheme = theme
			await expect
				.poll(() => getComputedStyle(panel).getPropertyValue('--so-component-surface'))
				.toBe(getComputedStyle(scope).getPropertyValue('--so-component-surface'))
		}
	},
	30000,
)

it.each(adapters)(
	'%s: a lazy Menu.PopoverItem retains the menu theme',
	async (adapter) => {
		const host = await loadHost(adapter)
		handle = host.mount(scope, { component: 'menu', props: { open: true } })
		await expect.poll(() => openPanel('menu')).toBeDefined()
		const trigger = openPanel('menu')?.querySelector('[aria-haspopup="dialog"]')
		if (!(trigger instanceof HTMLElement)) throw new Error('Missing calendar menu item')
		await userEvent.click(trigger)
		await expect.poll(() => openPanel('menu-item')).toBeDefined()
		const panel = openPanel('menu-item')
		if (!panel) throw new Error('Missing lazy menu item panel')
		expect(scope.contains(panel)).toBe(false)
		for (const theme of ['oren-dark', 'oren']) {
			scope.dataset.soTheme = theme
			await expect.poll(() => panel.dataset.soTheme).toBe(theme)
			await expect
				.poll(() => getComputedStyle(panel).getPropertyValue('--so-component-surface'))
				.toBe(getComputedStyle(scope).getPropertyValue('--so-component-surface'))
		}
	},
	30000,
)

it('Vue: issue #888 trigger slot and Input retain the local theme on first click', async () => {
	const app = createApp({
		render: () =>
			h(
				Popover,
				{ aria_label: 'Note' },
				{
					trigger: ({
						triggerAria,
						triggerDataset,
					}: DescriptorSlots<typeof PopoverDescriptor>['trigger']) =>
						h(Button, { ...triggerAria, ...triggerDataset, text: 'Note' }),
					default: () => h(Input, { aria_label: 'Note text' }),
				},
			),
	})
	app.mount(scope)
	unmountVue = () => app.unmount()
	const trigger = scope.querySelector('button')
	if (!trigger) throw new Error('Missing Popover trigger')
	await userEvent.click(trigger)
	await expect.poll(() => openPanel('popover')).toBeDefined()
	const panel = openPanel('popover')
	const input = panel?.querySelector('input')
	if (!panel || !input) throw new Error('Missing Popover input')
	expect(scope.contains(panel)).toBe(false)
	expect(panel.dataset.soTheme).toBe('oren-dark')
	const local = getComputedStyle(scope).getPropertyValue('--so-component-surface')
	expect(local.trim()).not.toBe('')
	expect(local).not.toBe(
		getComputedStyle(document.documentElement).getPropertyValue('--so-component-surface'),
	)
	expect(getComputedStyle(panel).getPropertyValue('--so-component-surface')).toBe(local)
	expect(getComputedStyle(input).getPropertyValue('--so-component-surface')).toBe(local)
})

it.each(adapters)(
	'%s: Breadcrumbs overflow Menu retains the local theme',
	async (adapter) => {
		const host = await loadHost(adapter)
		handle = host.mount(scope, { component: 'breadcrumbs', props: { maxItems: 3 } })
		await expect.poll(() => scope.querySelector('.so-breadcrumbs__trigger')).not.toBeNull()
		const trigger = scope.querySelector('.so-breadcrumbs__trigger')
		if (!(trigger instanceof HTMLElement)) throw new Error('Missing overflow trigger')
		await userEvent.click(trigger)
		await expect.poll(() => openPanel('menu')).toBeDefined()
		const panel = openPanel('menu')
		if (!panel) throw new Error('Missing overflow menu')
		expect(scope.contains(panel)).toBe(false)
		for (const theme of ['oren-dark', 'oren']) {
			scope.dataset.soTheme = theme
			await expect.poll(() => panel.dataset.soTheme).toBe(theme)
			await expect
				.poll(() => getComputedStyle(panel).getPropertyValue('--so-component-surface'))
				.toBe(getComputedStyle(scope).getPropertyValue('--so-component-surface'))
		}
	},
	30000,
)

it.each(
	adapters.flatMap((adapter) =>
		['calendar', 'date-picker'].map((component) => [adapter, component] as const),
	),
)(
	'%s: %s month/year picker keeps the local theme',
	async (adapter, component) => {
		const host = await loadHost(adapter)
		handle = host.mount(scope, {
			component,
			props: component === 'date-picker' ? { open: true } : {},
		})
		const calendar = () =>
			component === 'date-picker'
				? openPanel('date-picker')?.querySelector('.so-calendar')
				: scope.querySelector('.so-calendar')
		await expect
			.poll(() => calendar()?.querySelector('.so-calendar__title') ?? null)
			.not.toBeNull()
		const trigger = calendar()?.querySelector('.so-calendar__title')
		if (!(trigger instanceof HTMLElement)) throw new Error('Missing calendar title')
		await userEvent.click(trigger)
		await expect
			.poll(() => openPanel('popover')?.querySelector('.so-calendar__picker-list') ?? null)
			.not.toBeNull()
		const panel = openPanel('popover')
		if (!panel) throw new Error('Missing month/year picker')
		expect(calendar()?.contains(panel)).toBe(true)
		expect(panel.hasAttribute('data-so-theme')).toBe(false)
		for (const theme of ['oren-dark', 'oren']) {
			scope.dataset.soTheme = theme
			await expect
				.poll(() => getComputedStyle(panel).getPropertyValue('--so-component-surface'))
				.toBe(getComputedStyle(scope).getPropertyValue('--so-component-surface'))
		}
	},
	30000,
)
