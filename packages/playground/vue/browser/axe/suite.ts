import { ruRU } from '@soxa-ui/plugins'
import { createEngineToasts } from '@soxa-ui/core'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { commands, page, server, userEvent } from 'vitest/browser'
import axe from 'axe-core'
import {
	A11Y_ADAPTERS,
	auditCasesFor,
	COMPONENTS,
	PREVIEW_PROPS,
	auditInventoryErrors,
	type IPreviewHandle,
	type IPreviewHost,
	type TAuditCase,
} from '@soxa-ui/playground-shared'
import { FRAMEWORKS, loadHost } from '../../src/hosts'
import { auditGate } from './gate'
import { settled, waitForAuditState } from './ready'
import '@soxa-ui/theme-oren'

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
const shown = (selector: string) =>
	[...document.querySelectorAll(selector)].some(
		(node) =>
			node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden',
	)

async function confirmState(entry: TAuditCase) {
	if (entry.component === 'badge') {
		const badge = document.querySelector('.so-badge')
		const indicator = badge?.querySelector('.so-badge__indicator')
		if (!badge || !indicator) throw new Error(entry.id + ': missing actual badge parts')

		expect(badge.getAttribute('role'), 'anchor wrapper stays neutral').toBeNull()
		expect(badge.getAttribute('aria-label'), 'name belongs to the indicator').toBeNull()
		expect(badge.getAttribute('aria-hidden'), 'anchor is not hidden').toBeNull()

		const text =
			entry.state === 'text'
				? 'New'
				: entry.state === 'zero'
					? '0'
					: entry.state === 'capped'
						? '99+'
						: entry.state.endsWith('dot')
							? ''
							: '5'
		expect(indicator.textContent?.trim(), entry.id + ': actual display value').toBe(text)
		if (typeof entry.props.aria_label === 'string')
			expect(indicator.getAttribute('aria-label')).toBe(entry.props.aria_label)

		if (entry.state === 'anchor') {
			const anchor = badge.querySelector('.so-badge__anchor button')
			if (!(anchor instanceof HTMLButtonElement))
				throw new Error('Badge anchor is not a native button')

			expect(anchor.textContent).toContain('Inbox')
			expect(anchor.disabled).toBe(false)
			expect(anchor.tabIndex).toBe(0)
			expect(anchor.closest('[aria-hidden="true"]')).toBeNull()
		}
	}

	for (const selector of entry.exists ?? [])
		expect(
			document.querySelector(selector),
			entry.id + ': required component/announcer ' + selector,
		).not.toBeNull()
	for (const selector of entry.visible)
		await expect
			.poll(() => shown(selector), {
				message: entry.id + ': expected visible ' + selector,
				timeout: 4000,
			})
			.toBe(true)
	for (const selector of entry.absent ?? [])
		await expect
			.poll(() => shown(selector), {
				message: entry.id + ': expected closed ' + selector,
				timeout: 4000,
			})
			.toBe(false)
	if (entry.count) {
		const count = document.querySelectorAll(entry.count.selector).length
		expect(count, entry.id + ': actual part count').toBeGreaterThanOrEqual(entry.count.min)
		expect(count, entry.id + ': actual window/part count').toBeLessThanOrEqual(entry.count.max)
	}
	if (entry.id === 'calendar/months' || entry.id === 'calendar/years') {
		const labels = [...document.querySelectorAll('.so-calendar__picker [role="option"]')].map(
			(node) => node.textContent?.trim() ?? '',
		)
		expect(labels).toHaveLength(12)
		expect(
			labels.every((text) => /^\d{4}$/.test(text)),
			entry.id + ': months and years are different actual states',
		).toBe(entry.state === 'years')
	}
	if (entry.id === 'code-block/second-active') {
		expect(
			document.querySelector('.so-code-block [role="tab"][aria-selected="true"]')
				?.textContent,
		).toContain('Two')
		expect(document.querySelector('.so-code-block__pre')?.textContent).toContain(
			'const two = 2;',
		)
	}
	if (entry.id === 'avatar/error') expect(document.querySelector('.so-avatar img')).toBeNull()
	if (entry.id === 'tabs/second-active')
		expect(document.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toContain(
			'Второй',
		)
	if (entry.id === 'menu/submenu' || entry.id === 'menu/item-panel') {
		const role = entry.state === 'submenu' ? 'menu' : 'dialog'
		const triggerSelector =
			'[role="menuitem"][aria-haspopup="' + role + '"][aria-expanded="true"]'
		await expect
			.poll(() => document.querySelector(triggerSelector), {
				message: entry.id + ': actual expanded item',
			})
			.not.toBeNull()
		const trigger = document.querySelector(triggerSelector)
		const id = trigger?.getAttribute('aria-controls')
		const panel = id ? document.getElementById(id) : null
		if (!panel) throw new Error(entry.id + ': expanded item has no actual controlled panel')
		expect(panel.getAttribute('role')).toBe(role)
		expect(panel.getClientRects().length, entry.id + ': own panel is visible').toBeGreaterThan(
			0,
		)
		if (role === 'menu') expect(panel.textContent).toContain('Ссылка')
		else expect(panel.querySelector('.so-calendar [role="grid"]')).not.toBeNull()
	}
	if (['slider', 'rating'].includes(entry.component) && typeof entry.props.value === 'number') {
		const field = document.querySelector('.so-' + entry.component + ' input[type="range"]')
		if (!(field instanceof HTMLInputElement))
			throw new Error(entry.id + ': missing actual range field')
		expect(field.value, entry.id + ': actual numeric state').toBe(String(entry.props.value))
	}
	if (entry.component.startsWith('progress-') && entry.state === 'determinate')
		expect(document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe(
			'40',
		)
	if (entry.state === 'multiple-selected' || entry.state === 'single-selected') {
		const root = entry.component === 'select' ? '.so-select__panel' : '.so-' + entry.component
		expect(
			document.querySelectorAll(root + ' [role="option"][aria-selected="true"]').length,
			entry.id + ': actual selection count',
		).toBe(entry.state === 'multiple-selected' ? 2 : 1)
	}
	if (entry.component === 'toasts' && ['ordinary', 'error', 'loading'].includes(entry.state)) {
		expect(
			document.querySelector('.so-toasts-item[role="listitem"]'),
			'native list item semantics',
		).not.toBeNull()
		const priority = entry.state === 'error' ? 'assertive' : 'polite'
		await expect
			.poll(
				() =>
					document
						.querySelector('[data-so-toasts-announcer="' + priority + '"]')
						?.textContent?.trim(),
				{ message: entry.id + ': actual message in the correct live region' },
			)
			.toBeTruthy()
		if (entry.state === 'error')
			expect(
				document.querySelector('.so-toasts-item__card[role="alert"][aria-live="off"]'),
			).not.toBeNull()
	}
	if (entry.state === 'invalid') {
		const input = document.querySelector('[aria-invalid="true"][aria-describedby]')
		if (!input) throw new Error('Invalid field has no described control')
		const ids = input.getAttribute('aria-describedby')?.split(/\s+/) ?? []
		expect(
			ids.some((id) =>
				document.getElementById(id)?.textContent?.includes('Enter a valid email'),
			),
			'visible error is actually referenced',
		).toBe(true)
	}
}

export function auditSuite(adapter: string) {
	let host: IPreviewHost
	let handle: IPreviewHandle | undefined
	let scene: HTMLElement | undefined
	let originalTitle = ''
	let originalLang: string | null = null
	let originalTheme: string | null = null
	let originalDir: string | null = null
	let previousFocus: Element | null = null
	let overflowRoot = ''
	let overflowBody = ''
	let paddingBody = ''
	beforeAll(async () => {
		host = await loadHost(adapter)

		host.setLocale(ruRU)
	})
	beforeEach(async () => {
		// A stationary pointer can open a tooltip mounted under the previous case's cursor.
		await userEvent.unhover(document.body)

		originalTitle = document.title
		originalLang = document.documentElement.getAttribute('lang')
		originalTheme = document.documentElement.getAttribute('data-so-theme')
		originalDir = document.documentElement.getAttribute('dir')
		previousFocus = document.activeElement
		overflowRoot = document.documentElement.style.overflow
		overflowBody = document.body.style.overflow
		paddingBody = document.body.style.paddingInlineEnd
	})
	afterEach(async () => {
		try {
			handle?.unmount()
			handle = undefined
			await settled()

			expect(
				document.querySelector(
					'.so-select__panel, .so-alert-dialog, .so-dialog, .so-drawer, .so-toasts, .so-menu__panel, .so-menu-item__panel, .so-popover__panel, .so-tooltip__panel, .so-date-picker__panel',
				),
				'host removed teleported nodes',
			).toBeNull()
			expect(document.documentElement.style.overflow, 'root scroll lock released').toBe(
				overflowRoot,
			)
			expect(document.body.style.overflow, 'body scroll lock released').toBe(overflowBody)
			expect(document.body.style.paddingInlineEnd, 'scrollbar compensation released').toBe(
				paddingBody,
			)
		} finally {
			scene?.remove()
			scene = undefined

			document.title = originalTitle
			for (const [name, value] of [
				['lang', originalLang],
				['data-so-theme', originalTheme],
				['dir', originalDir],
			] as const) {
				if (value === null) document.documentElement.removeAttribute(name)
				else document.documentElement.setAttribute(name, value)
			}

			if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
				previousFocus.focus()
		}
	})
	describe('axe ' + adapter, () => {
		it('covers the complete registry and all six hosts', () => {
			expect(FRAMEWORKS.map((value) => value.id).sort()).toEqual([...A11Y_ADAPTERS].sort())
			expect(
				auditInventoryErrors(
					host,
					COMPONENTS.map((entry) => entry.id),
					adapter,
				),
			).toEqual([])
		})
		for (const entry of auditCasesFor(adapter))
			it(
				entry.id,
				async () => {
					originalTitle = document.title
					originalLang = document.documentElement.getAttribute('lang')
					originalTheme = document.documentElement.getAttribute('data-so-theme')
					originalDir = document.documentElement.getAttribute('dir')
					document.title = 'Soxa accessibility audit'
					document.documentElement.lang = 'ru'
					document.documentElement.dataset.soTheme = 'oren'
					document.documentElement.dir = 'ltr'
					scene = document.createElement('main')
					scene.id = 'axe-scene'
					scene.style.cssText = 'padding:24px;max-width:1100px;box-sizing:border-box'
					const heading = document.createElement('h1')
					heading.textContent = 'Component accessibility audit'
					scene.append(heading)
					// Hosts replace their mount target's children; the document heading stays outside it.
					const mountPoint = document.createElement('div')
					mountPoint.style.display = 'contents'
					scene.append(mountPoint)
					document.body.append(scene)

					const context = {
						locale: ruRU.tag,
						theme: 'oren',
						direction: 'ltr',
						adapter,
						case: entry.id,
						component: entry.component,
						consumer: entry.consumer,
						coverage: entry.coverage,
						state: entry.state,
						axe: axe.version,
					}

					let reported = false
					try {
						const engine =
							entry.fixture === 'a11y-persistent-toasts'
								? createEngineToasts()
								: undefined
						handle = host.mount(mountPoint, {
							component: entry.consumer,
							fixture: entry.fixture,
							props: {
								...PREVIEW_PROPS[entry.consumer],
								...entry.props,
								...(engine ? { engine } : {}),
							},
						})

						await frame()
						await frame()

						if (engine) {
							const toast = engine.extensions.toasts.show({
								text: 'Сохраняем…',
								loading: true,
								duration: 0,
							})
							if (!toast)
								throw new Error('Persistent loading fixture did not create a toast')
						}

						for (const selector of entry.click ?? []) {
							if (selector.startsWith('tab:'))
								await userEvent.click(
									page.getByRole('tab', { name: selector.slice(4), exact: true }),
								)
							else if (selector.startsWith('text:'))
								await userEvent.click(
									page.getByRole('button', {
										name: selector.slice(5),
										exact: true,
									}),
								)
							else {
								await expect
									.poll(() => document.querySelector(selector), {
										timeout: 4000,
										message: entry.id + ': action target ' + selector,
									})
									.toBeTruthy()
								const node = document.querySelector(selector)
								if (!(node instanceof HTMLElement))
									throw new Error(
										'Action target is not an HTML element: ' + selector,
									)
								await userEvent.click(node)
							}
							await settled()
						}
						await waitForAuditState(() => confirmState(entry))
						expect(
							document.querySelector('.pg__header, #vitest-ui'),
							'audit scope excludes the shell and runner UI',
						).toBeNull()

						const result = await axe.run(document, { absolutePaths: true, xpath: true })

						const classification = (() => {
							try {
								return {
									gate: auditGate(result.violations, {
										browser: server.browser,
										adapter,
										case: entry.id,
									}),
								}
							} catch (error) {
								return { gateError: String(error) }
							}
						})()

						// Persist the original findings and checks before any assertion can fail.
						await commands.saveA11yReport({
							...context,
							violations: result.violations,
							incomplete: result.incomplete,
							passes: result.passes,
							inapplicable: result.inapplicable,
							...classification,
						})
						reported = true

						try {
							await confirmState(entry)
						} catch (error) {
							await commands.saveA11yReport({
								...context,
								setupError: String(error),
								phase: 'post-axe-state',
								html: document.body.innerHTML,
							})
							throw error
						}

						if (!classification.gate)
							throw new Error(classification.gateError ?? 'Axe classification failed')

						const gate = classification.gate
						expect(gate.stale, 'stale scoped axe exceptions').toEqual([])
						expect(
							gate.failures,
							'unresolved serious/critical axe nodes; original report saved',
						).toEqual([])
					} catch (error) {
						if (!reported)
							await commands.saveA11yReport({
								...context,
								setupError: String(error),
								html: document.body.innerHTML,
							})
						throw error
					}
				},
				30000,
			)
	})
}
