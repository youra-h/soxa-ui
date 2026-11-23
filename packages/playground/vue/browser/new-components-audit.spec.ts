import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { TAlertDialog, createEngineBreadcrumbs } from '@soxa-ui/core'
import { enUS, ruRU } from '@soxa-ui/plugins'
import { FRAMEWORKS, loadHost } from '../src/hosts'
import type { IPreviewHandle, IPreviewHost } from '@soxa-ui/playground-shared'
import '@soxa-ui/theme-oren'
import { contrast, opacity } from './colors'

let host: IPreviewHost | undefined
const handles: IPreviewHandle[] = []
const scenes: HTMLElement[] = []
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

function find(selector: string): HTMLElement {
	const found = document.querySelector(selector)

	if (!(found instanceof HTMLElement)) throw new Error('Missing audit target: ' + selector)

	return found
}

async function mount(component: string, props: Record<string, unknown> = {}) {
	if (!host) throw new Error('Missing audit host')

	const scene = document.createElement('div')

	document.body.append(scene)
	scenes.push(scene)
	const handle = host.mount(scene, { component, props })

	handles.push(handle)
	await frame()
	await frame()

	return handle
}

function breadcrumbProps() {
	return {
		maxItems: 3,
		items: [
			{ text: 'Home', href: '#home' },
			{ text: 'Catalog', href: '#catalog' },
			{ text: 'Disabled', href: '#disabled', disabled: true },
			{ text: 'Phones', href: '#phones' },
			{ text: 'Current', _: { active: true } },
		],
	}
}

afterEach(async () => {
	for (const handle of handles.splice(0).reverse()) handle.unmount()
	for (const scene of scenes.splice(0)) scene.remove()

	host?.setLocale(ruRU)
	document.documentElement.removeAttribute('data-so-theme')
	await expect.poll(() => document.querySelector('.so-alert-dialog,.so-menu__panel')).toBeNull()
})

describe.each(FRAMEWORKS)('new component audit / $id', ({ id }) => {
	it.each(['ltr', 'rtl'])(
		'ToggleButton native keyboard and disabled in %s',
		async (direction) => {
			host = await loadHost(id)
			const handle = await mount('toggle-button', { text: 'Bold', direction })
			const button = find('.so-toggle-button')

			expect(button.getAttribute('type')).toBe('button')
			expect(button.getAttribute('aria-pressed')).toBe('false')
			await userEvent.click(button)
			await expect.poll(() => button.getAttribute('aria-pressed')).toBe('true')
			button.focus()
			await userEvent.keyboard(' ')
			await expect.poll(() => button.getAttribute('aria-pressed')).toBe('false')
			await userEvent.keyboard('{Enter}')
			await expect.poll(() => button.getAttribute('aria-pressed')).toBe('true')
			handle.update({ text: 'Bold', direction, disabled: true })
			await expect.poll(() => button.getAttribute('disabled')).not.toBeNull()
			await userEvent.keyboard('{Enter}')
			expect(button.getAttribute('aria-pressed')).toBe('true')
		},
	)

	for (const orientation of ['horizontal', 'vertical'])
		for (const direction of ['ltr', 'rtl'])
			for (const mode of ['single', 'multiple'])
				it('ToggleGroup ' + [orientation, direction, mode].join('/'), async () => {
					host = await loadHost(id)
					const props = {
						orientation,
						direction,
						mode,
						aria_label: 'Formatting',
						items: [
							{ text: 'Bold' },
							{ text: 'Disabled', disabled: true },
							{ text: 'Italic' },
						],
					}
					const handle = await mount('toggle-group', props)
					const items = [
						...document.querySelectorAll<HTMLElement>('.so-toggle-group-item'),
					]

					expect(items).toHaveLength(3)
					expect(items.filter((item) => item.tabIndex === 0)).toHaveLength(1)
					items[0].focus()
					const arrow =
						orientation === 'vertical'
							? '{ArrowDown}'
							: direction === 'rtl'
								? '{ArrowLeft}'
								: '{ArrowRight}'

					await userEvent.keyboard(arrow)
					expect(document.activeElement).toBe(items[2])
					await userEvent.keyboard(' ')
					await expect.poll(() => items[2].getAttribute('aria-pressed')).toBe('true')
					await userEvent.keyboard('{Home}')
					expect(document.activeElement).toBe(items[0])
					await userEvent.keyboard('{Enter}')
					await expect.poll(() => items[0].getAttribute('aria-pressed')).toBe('true')
					expect(items[2].getAttribute('aria-pressed')).toBe(
						mode === 'multiple' ? 'true' : 'false',
					)
					await userEvent.keyboard('{End}')
					expect(document.activeElement).toBe(items[2])
					handle.update({ ...props, disabled: true })
					await expect
						.poll(() => items.every((item) => item.hasAttribute('disabled')))
						.toBe(true)
				})

	it.each(['oren', 'oren-dark'])('CodeBlock gutter contrast in %s', async (scheme) => {
		document.documentElement.setAttribute('data-so-theme', scheme)
		host = await loadHost(id)
		await mount('code-block', { code: 'first line\nsecond line\n', lineNumbers: true })
		const root = find('.so-code-block')
		const gutter = find('.so-code-block__gutter')
		const foreground = getComputedStyle(gutter).color
		const background = getComputedStyle(root).backgroundColor
		const ratio = contrast(foreground, [background])

		console.info(
			'audit-codeblock-contrast',
			JSON.stringify({
				adapter: id,
				scheme,
				foreground,
				background,
				ratio,
				gutterOpacity: getComputedStyle(gutter).opacity,
				rootOpacity: getComputedStyle(root).opacity,
			}),
		)
		expect(opacity(background)).toBe(1)
		expect(getComputedStyle(root).opacity).toBe('1')
		expect(getComputedStyle(gutter).opacity).toBe('1')
		expect(ratio).toBeGreaterThanOrEqual(4.5)
	})

	it('AlertDialog updates default locale labels and preserves consumer action text', async () => {
		host = await loadHost(id)
		host.setLocale(enUS)
		await mount('alert-dialog', { visible: true })
		await expect.poll(() => find('.so-alert-dialog__cancel').textContent).toContain('Cancel')
		const consumerAction = find('.so-alert-dialog__action').textContent

		expect(consumerAction?.trim()).toBeTruthy()
		host.setLocale(ruRU)
		await expect.poll(() => find('.so-alert-dialog__cancel').textContent).toContain('Отмена')
		expect(find('.so-alert-dialog__action').textContent).toBe(consumerAction)
		host.setLocale(enUS)
		await expect.poll(() => find('.so-alert-dialog__cancel').textContent).toContain('Cancel')
		expect(find('.so-alert-dialog__action').textContent).toBe(consumerAction)
	})

	it('AlertDialog safe focus, trap, backdrop, choices, nested layer and locale', async () => {
		host = await loadHost(id)
		host.setLocale(enUS)
		const ctrl = new TAlertDialog()
		let confirms = 0
		let cancels = 0

		ctrl.events.on('confirm', () => confirms++)
		ctrl.events.on('cancel', () => cancels++)
		await mount('alert-dialog', { ctrl })
		const opener = find('.so-button')

		await userEvent.click(opener)
		await expect.poll(() => document.activeElement).toBe(find('.so-alert-dialog__cancel'))
		const panel = find('.so-alert-dialog')

		expect(panel.getAttribute('role')).toBe('alertdialog')
		expect(panel.getAttribute('aria-modal')).toBe('true')
		for (const attribute of ['aria-labelledby', 'aria-describedby']) {
			const referenced = document.getElementById(panel.getAttribute(attribute) ?? '')

			expect(referenced?.textContent?.trim()).toBeTruthy()
		}
		expect(find('.so-alert-dialog__cancel').textContent).toContain('Cancel')
		await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
		expect(panel.contains(document.activeElement)).toBe(true)
		await userEvent.keyboard('{Tab}{Tab}{Tab}{Tab}')
		expect(panel.contains(document.activeElement)).toBe(true)
		await userEvent.click(find('.so-backdrop:has(+ .so-alert-dialog)'), {
			position: { x: 5, y: 5 },
		})
		expect(ctrl.visible).toBe(true)
		find('.so-alert-dialog__cancel').focus()
		await userEvent.keyboard('{Escape}')
		await expect.poll(() => ctrl.visible).toBe(false)
		expect(cancels).toBe(1)
		expect(confirms).toBe(0)
		await expect.poll(() => document.activeElement).toBe(opener)
		await userEvent.click(opener)
		await userEvent.click(find('.so-alert-dialog__action'))
		await expect.poll(() => ctrl.visible).toBe(false)
		expect(confirms).toBe(1)
		await userEvent.click(opener)
		const safe = find('.so-alert-dialog__cancel')

		safe.focus()
		const nested = new TAlertDialog({ visible: true })

		await mount('alert-dialog', { ctrl: nested, visible: true })
		await expect
			.poll(() => document.querySelectorAll('.so-alert-dialog[data-open="true"]').length)
			.toBe(2)
		await userEvent.keyboard('{Escape}')
		await expect.poll(() => nested.visible).toBe(false)
		expect(ctrl.visible).toBe(true)
		await expect.poll(() => document.activeElement).toBe(safe)
		await userEvent.click(safe)
		await expect.poll(() => ctrl.visible).toBe(false)
		expect(cancels).toBe(2)
	})

	it('Breadcrumbs restores a ready overflow menu after maxItems changes', async () => {
		host = await loadHost(id)
		const props = breadcrumbProps()
		const handle = await mount('breadcrumbs', props)

		handle.update({ ...props, maxItems: 0 })
		await expect.poll(() => document.querySelector('.so-breadcrumbs__trigger')).toBeNull()
		expect(find('.so-breadcrumbs__link[aria-disabled="true"]').hasAttribute('href')).toBe(false)
		handle.update(props)
		await frame()
		await frame()
		await expect
			.poll(() => {
				const trigger = document.querySelector('.so-breadcrumbs__trigger')
				return Boolean(
					document.getElementById(trigger?.getAttribute('aria-controls') ?? ''),
				)
			})
			.toBe(true)

		const state = () => ({
			open: document.querySelectorAll('.so-menu__panel[data-open="true"]').length,
			expanded: find('.so-breadcrumbs__trigger').getAttribute('aria-expanded'),
			focused: document.activeElement?.tagName,
		})
		find('.so-breadcrumbs__trigger').focus()
		await userEvent.keyboard('{Enter}')
		await frame()
		const keyboard = state()

		await userEvent.keyboard('{Escape}')
		await expect.poll(() => state().open).toBe(0)
		await userEvent.click(find('.so-breadcrumbs__trigger'))
		await frame()
		const pointer = state()

		console.info(
			'audit-breadcrumb-restored',
			JSON.stringify({ adapter: id, keyboard, pointer }),
		)
		expect(keyboard.open).toBe(1)
		expect(keyboard.expanded).toBe('true')
		expect(pointer.open).toBe(1)
		expect(pointer.expanded).toBe('true')
	})

	it('Breadcrumbs native links, disabled/current, overflow keyboard', async () => {
		host = await loadHost(id)
		const engine = createEngineBreadcrumbs()
		const props = { ...breadcrumbProps(), engine }
		const handle = await mount('breadcrumbs', props)

		expect(find('.so-breadcrumbs__link[href="#home"]').tagName).toBe('A')
		expect(find('[aria-current="page"]').textContent).toContain('Current')

		for (let composition = 0; composition < 2; composition++) {
			await expect.poll(() => engine.extensions.breadcrumbs.menu.ready).toBe(true)
			const trigger = find('.so-breadcrumbs__trigger')
			expect(trigger.getAttribute('aria-expanded')).toBe('false')

			for (let cycle = 0; cycle < 2; cycle++) {
				trigger.focus()
				await userEvent.keyboard('{Enter}')
				await expect
					.poll(() => trigger.getAttribute('aria-expanded'), {
						message: id + ' composition=' + composition + ' cycle=' + cycle,
					})
					.toBe('true')
				expect(trigger.getAttribute('data-selected')).toBe('true')
				expect(find('.so-breadcrumbs__trigger')).toBe(trigger)
				expect(trigger.getAttribute('aria-controls')).toBe(find('.so-menu__panel').id)
				await expect
					.poll(() => document.activeElement)
					.toBe(find('a[role="menuitem"][href="#catalog"]'))
				await userEvent.keyboard('{End}')
				await expect
					.poll(() => document.activeElement)
					.toBe(find('a[role="menuitem"][href="#phones"]'))
				await userEvent.keyboard('{Home}')
				await expect
					.poll(() => document.activeElement)
					.toBe(find('a[role="menuitem"][href="#catalog"]'))
				await userEvent.keyboard('{Escape}')
				await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false')
				expect(trigger.getAttribute('data-selected')).toBe('false')
				expect(find('.so-breadcrumbs__trigger')).toBe(trigger)
				await expect.poll(() => document.activeElement).toBe(trigger)
			}

			if (composition === 0) {
				handle.update({ ...props, maxItems: 0 })
				await expect
					.poll(() => document.querySelector('.so-breadcrumbs__trigger'))
					.toBeNull()
				expect(
					find('.so-breadcrumbs__link[aria-disabled="true"]').hasAttribute('href'),
				).toBe(false)
				handle.update(props)
				await expect
					.poll(() => document.querySelector('.so-breadcrumbs__trigger'))
					.not.toBeNull()
			}
		}
	})
})
