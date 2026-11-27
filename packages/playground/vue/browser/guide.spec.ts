import { describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h } from 'vue'
import { TGuide, type IGuideStep } from '@soxa-ui/core'
import { Guide } from '@soxa-ui/vue'
import { render } from './render'

import '@soxa-ui/theme-oren'

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
