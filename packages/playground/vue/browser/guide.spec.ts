import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h } from 'vue'
import { TGuide, type IGuideStep } from '@soxa-ui/core'
import { Guide } from '@soxa-ui/vue'
import { cleanup, render } from './render'
import { find, style, systemColor } from './colors'
import { forcedColors } from './media'
import { renderStand } from './stand'
import { router } from '../src/router'

import orenStyles from '../src/themes/oren.css?inline'
import burgStyles from '../src/themes/burg.css?inline'
import '../src/styles.css'

const stylesheet = document.createElement('style')

beforeEach(() => {
	stylesheet.textContent = orenStyles
	document.head.append(stylesheet)
})

afterEach(() => stylesheet.remove())

describe('Guide', () => {
	it('centers the modal, leaves the DOM target clickable, and moves the WebGL spotlight', async () => {
		const events = new EventTarget()
		const point: IGuideStep = {
			id: 'point',
			title: 'WebGL object',
			anchor: { point: { x: 180, y: 220 } },
			placement: 'end',
			advanceOn: { source: events, event: 'selected' },
		}
		const ctrl = new TGuide({
			steps: [
				{ id: 'welcome', title: 'Welcome', mode: 'modal' },
				{
					id: 'toolbar',
					title: 'Toolbar',
					anchor: { element: () => document.querySelector('#guide-toolbar') },
				},
				point,
			],
		})
		let targetClicks = 0
		render({
			render: () => [
				h('button', { id: 'start-guide', onClick: () => ctrl.start() }, 'Start guide'),
				h(
					'button',
					{
						id: 'guide-toolbar',
						style: { position: 'fixed', left: '40px', top: '100px' },
						onClick: () => {
							targetClicks += 1
						},
					},
					'Editor toolbar',
				),
				h(Guide, { ctrl }),
			],
		})

		const dialog = page.getByRole('dialog')
		document.querySelector<HTMLButtonElement>('#start-guide')?.focus()
		await userEvent.keyboard('{Enter}')
		await expect.element(dialog).toHaveAttribute('aria-modal', 'true')
		await expect
			.poll(() => {
				const rect = dialog.element().getBoundingClientRect()
				return Math.abs((rect.left + rect.right - document.documentElement.clientWidth) / 2)
			})
			.toBeLessThan(2)
		await expect
			.poll(() => {
				const rect = dialog.element().getBoundingClientRect()
				return Math.abs(
					(rect.top + rect.bottom - document.documentElement.clientHeight) / 2,
				)
			})
			.toBeLessThan(2)

		await dialog.getByRole('button', { name: 'Next' }).click()
		await expect.element(dialog).toHaveAttribute('data-placement', 'bottom-start')
		await page.getByRole('button', { name: 'Editor toolbar' }).click()
		expect(targetClicks).toBe(1)

		await dialog.getByRole('button', { name: 'Next' }).click()
		const markerLeft = () =>
			document.querySelector('.so-guide__spotlight')?.getBoundingClientRect().left
		await expect.poll(markerLeft).toBe(176)
		ctrl.steps = [
			...ctrl.steps.slice(0, 2),
			{ ...point, anchor: { point: { x: 320, y: 260 } } },
		]
		await expect.poll(markerLeft).toBe(316)

		events.dispatchEvent(new Event('selected'))
		await expect
			.poll(() => document.querySelector<HTMLElement>('.so-guide')?.style.display)
			.toBe('none')
		await expect.element(page.getByRole('button', { name: 'Start guide' })).toHaveFocus()
	})
})

describe.each(['burg', 'burg-dark'])('Guide in %s', (scheme) => {
	it('styles the teleported panel, navigation, and spotlight in the local scheme', async () => {
		stylesheet.textContent = burgStyles
		const target = document.createElement('div')
		target.id = 'burg-guide-layer'
		target.dataset.soTheme = scheme
		document.body.append(target)

		const ctrl = new TGuide({
			target: '#burg-guide-layer',
			steps: [
				{ id: 'welcome', title: 'Welcome', description: 'Choose a source.', mode: 'modal' },
				{ id: 'point', title: 'Saved sources', anchor: { point: { x: 120, y: 100 } } },
			],
		})
		const origin = 'Open the guide'

		try {
			render({
				render: () => [
					h('button', { id: 'burg-guide-start', onClick: () => ctrl.start() }, origin),
					h(Guide, { ctrl }),
				],
			})

			const opener = page.getByRole('button', { name: origin })
			const dialog = page.getByRole('dialog')
			find('#burg-guide-start').focus()
			await userEvent.keyboard('{Enter}')

			await expect.element(dialog).toHaveAttribute('aria-modal', 'true')
			const panel = dialog.element()
			expect(panel.parentElement).toBe(target)
			expect(style(panel).width).toBe('320px')
			expect(style(panel).backgroundColor).toBe(
				scheme === 'burg' ? 'rgb(255, 255, 255)' : 'rgb(32, 34, 38)',
			)
			expect(style(find('.so-guide__title', panel)).fontSize).toBe('16px')
			expect(style(find('.so-guide__progress', panel)).fontSize).toBe('12px')
			expect(style(find('.so-guide__description', panel)).fontSize).toBe('13px')

			const back = dialog.getByRole('button', { name: 'Back' })
			const next = dialog.getByRole('button', { name: 'Next' })
			const close = dialog.getByRole('button', { name: 'Close' })
			expect(style(close.element()).width).toBe('28px')
			await expect.element(back).toBeDisabled()
			expect(style(back.element(), '::after').backgroundColor).toBe('rgba(0, 0, 0, 0)')
			await expect.element(next).toHaveFocus()
			expect(style(next.element()).outlineWidth).toBe('3px')
			expect(style(next.element()).outlineOffset).toBe('0px')
			await userEvent.keyboard('{Tab}')
			await expect.element(close).toHaveFocus()
			await userEvent.keyboard('{Tab}')
			await expect.element(next).toHaveFocus()

			await userEvent.keyboard('{Enter}')
			await expect.element(dialog).toHaveAccessibleName('Saved sources')
			const spotlight = find('.so-guide__spotlight', target)
			expect(style(spotlight).borderRadius).toBe('50%')
			expect(style(spotlight).outlineWidth).toBe('1px')

			await forcedColors('active')
			expect(style(spotlight).outlineColor).toBe(systemColor('Highlight'))
			await userEvent.keyboard('{Escape}')
			await expect.element(opener).toHaveFocus()
		} finally {
			await forcedColors('none')
			cleanup()
			target.remove()
		}
	})
})

describe('Guide properties in Playground', () => {
	async function open(): Promise<void> {
		await page.viewport(1440, 860)
		await router.push('/vue')
		renderStand()
		await page.getByRole('option', { name: 'Guide', exact: true }).click()
		await expect
			.element(page.getByRole('heading', { name: 'Guide', exact: true }))
			.toBeVisible()
	}

	function rowOf(name: string): HTMLElement {
		const row = Array.from(document.querySelectorAll<HTMLElement>('.pg-prop')).find(
			(section) => section.querySelector('.pg-prop__name')?.textContent?.trim() === name,
		)
		if (!row) throw new Error(`Missing Guide property ${name}`)
		return row
	}

	it('edits the JSON used by both previews and closes via the top icon', async () => {
		await open()
		expect(document.querySelector('.pg__header button[aria-haspopup="dialog"]')).toBeNull()
		const row = rowOf('steps')
		const editor = page.elementLocator(row).getByRole('textbox')
		const code = () => row.querySelector('.so-code-block code')?.textContent
		await expect.poll(code).toContain('Знакомство с Playground')
		const sample = [
			{ id: 'test', title: 'Edited guide', anchor: { point: { x: 300, y: 240 } } },
		]
		await editor.fill(JSON.stringify(sample))
		await expect.poll(code).toContain('Edited guide')
		await editor.fill('[{')
		await expect.poll(() => row.textContent).toContain('Введите корректный JSON')
		await expect.poll(code).toContain('Edited guide')

		const buttons = row.querySelectorAll<HTMLButtonElement>('.pg-col button')
		const starters = Array.from(buttons).filter(
			(button) => button.textContent?.trim() === 'Запустить Guide',
		)
		expect(starters).toHaveLength(2)

		for (const starter of starters) {
			await userEvent.click(page.elementLocator(starter))
			const dialog = page.getByRole('dialog', { name: 'Edited guide' })
			await expect.element(dialog).toBeVisible()
			const spot = () =>
				document.querySelector('.so-guide__spotlight')?.getBoundingClientRect()
			await expect.poll(() => spot()?.left).toBe(296)
			await expect.poll(() => spot()?.top).toBe(236)
			await expect
				.poll(() => {
					const marker = document.querySelector('.so-guide__spotlight')
					return marker && getComputedStyle(marker).borderRadius
				})
				.toBe('50%')
			const button = dialog.getByRole('button', { name: /^(Close|Закрыть)$/ })
			await expect.element(button).toHaveClass('so-guide__close')
			expect(button.element().querySelector('svg')).not.toBeNull()
			const panel = dialog.element().getBoundingClientRect()
			expect(button.element().getBoundingClientRect().top - panel.top).toBeLessThan(20)
			await button.click()
			await expect.poll(() => dialog.query()).toBeNull()
		}
	})

	it.each(['react', 'solid', 'svelte', 'angular', 'webc'])(
		'opens and closes the steps preview on %s',
		async (framework) => {
			await router.push('/' + framework + '/guide')
			renderStand()
			const row = page.elementLocator(rowOf('steps'))
			await row.getByRole('button', { name: 'Запустить Guide' }).first().click()
			const dialog = page.getByRole('dialog', { name: 'Знакомство с Playground' })
			await expect.element(dialog).toHaveAttribute('aria-modal', 'true')
			const close = dialog.getByRole('button', { name: /^(Close|Закрыть)$/ })
			await expect.element(close).toHaveClass('so-guide__close')
			expect(close.element().querySelector('svg')).not.toBeNull()
			await close.click()
			await expect.poll(() => dialog.query()).toBeNull()
		},
	)

	it('keeps the backdrop between steps when testing closable', async () => {
		await open()
		const row = page.elementLocator(rowOf('closable'))
		const control = row.getByRole('switch')
		await expect.element(control).toBeChecked()
		await control.click()
		await row.getByRole('button', { name: 'Запустить Guide' }).first().click()
		const welcome = page.getByRole('dialog', { name: 'Знакомство с Playground' })
		const backdrop = () => document.querySelector('.so-guide__decoration > .so-backdrop')
		await expect.element(welcome).toBeVisible()
		await expect.poll(() => backdrop()?.classList.contains('so-backdrop--view-dim')).toBe(true)
		expect(welcome.element().querySelector('.so-guide__close')).toBeNull()
		await welcome.getByRole('button', { name: /^(Next|Далее)$/ }).click()
		const settings = page.getByRole('dialog', { name: 'Настройки стенда' })
		await expect.element(settings).toBeVisible()
		await expect.poll(() => backdrop()?.classList.contains('so-backdrop--view-dim')).toBe(true)
		expect(settings.element().querySelector('.so-guide__close')).toBeNull()
		await userEvent.keyboard('{Escape}')
		await expect.poll(() => settings.query()).toBeNull()
	})

	it('changes the shared backdrop from the property row', async () => {
		await open()
		const row = page.elementLocator(rowOf('backdrop'))
		const select = row.getByRole('combobox')
		await select.click()
		await page.getByRole('option', { name: 'blur', exact: true }).click()
		await row.getByRole('button', { name: 'Запустить Guide' }).first().click()
		const dialog = page.getByRole('dialog', { name: 'Знакомство с Playground' })
		await expect.element(dialog).toBeVisible()
		const backdrop = () =>
			document.querySelector<HTMLElement>('.so-guide__decoration > .so-backdrop')
		await expect.poll(() => backdrop()?.classList.contains('so-backdrop--view-blur')).toBe(true)
		await dialog.getByRole('button', { name: /^(Next|Далее)$/ }).click()
		await expect.element(page.getByRole('dialog', { name: 'Настройки стенда' })).toBeVisible()
		await expect.poll(() => backdrop()?.style.clipPath).toContain('polygon')
		await expect
			.poll(() => {
				const element = backdrop()
				return element && getComputedStyle(element).pointerEvents
			})
			.toBe('none')

		const layer = backdrop()
		const target = document.querySelector('.pg__header [data-guide-anchor="framework"]')
		if (!layer || !target) throw new Error('Missing backdrop or highlighted header control')

		const rect = target.getBoundingClientRect()
		layer.style.pointerEvents = 'auto'
		try {
			expect(document.elementFromPoint(rect.left - 3, rect.top - 3)).toBe(layer)
			expect(document.elementFromPoint(rect.left + rect.width / 2, rect.top - 3)).not.toBe(
				layer,
			)
		} finally {
			layer.style.removeProperty('pointer-events')
		}
	})
})
