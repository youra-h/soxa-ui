import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { commands, page, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick } from 'vue'
import { AlertDialog, Button } from '@soxa-ui/vue'
import { TAlertDialog } from '@soxa-ui/core'
import { render, cleanup } from './render'
import { forcedColors } from './media'
import { contrast, settled } from './colors'
import '@soxa-ui/theme-oren'
const node = (selector: string) => {
	const found = document.querySelector(selector)
	if (!(found instanceof HTMLElement)) throw new Error(selector)
	return found
}
let previousTheme: string | null = null
beforeEach(() => {
	previousTheme = document.documentElement.getAttribute('data-so-theme')
})
afterEach(async () => {
	if (previousTheme === null) document.documentElement.removeAttribute('data-so-theme')
	else document.documentElement.setAttribute('data-so-theme', previousTheme)
	cleanup()
	await forcedColors('none')
})
async function show(footer?: () => ReturnType<typeof h>[]) {
	const ctrl = new TAlertDialog()
	const confirm = vi.fn()
	const cancel = vi.fn()
	render(
		defineComponent({
			render: () =>
				h('div', [
					h(
						'button',
						{
							class: 'open',
							onClick: () => {
								ctrl.visible = true
							},
						},
						'Open',
					),
					h(
						AlertDialog,
						{ ctrl, onConfirm: confirm, onCancel: cancel },
						{
							title: () => 'Delete record?',
							default: () => 'This cannot be undone.',
							...(footer ? { footer } : {}),
						},
					),
				]),
		}),
	)
	await userEvent.click(page.getByRole('button', { name: 'Open', exact: true }))
	await expect
		.poll(() => document.activeElement)
		.toBe(footer ? node('.so-alert-dialog') : node('.so-alert-dialog__cancel'))
	return { ctrl, confirm, cancel }
}
describe('AlertDialog browser', () => {
	it.each(['oren', 'oren-dark'])(
		'%s keeps destructive text readable at rest, on hover and while pressed',
		async (theme) => {
			document.documentElement.dataset.soTheme = theme
			await show()
			const action = node('.so-alert-dialog__action')
			const readable = () => {
				const style = getComputedStyle(action)
				return contrast(style.color, [style.backgroundColor])
			}
			await settled(action)
			expect(readable()).toBeGreaterThanOrEqual(4.5)
			await userEvent.hover(page.elementLocator(action))
			await settled(action)
			expect(readable()).toBeGreaterThanOrEqual(4.5)
			await commands.mouseDown()
			await settled(action)
			expect(readable()).toBeGreaterThanOrEqual(4.5)
			await commands.mouseUp()
		},
	)
	it('names/describes the modal, starts on cancel, traps Tab, ignores backdrop and returns focus on Escape', async () => {
		const { ctrl, cancel, confirm } = await show()
		const panel = node('.so-alert-dialog')
		expect(panel.getAttribute('role')).toBe('alertdialog')
		expect(panel.getAttribute('aria-modal')).toBe('true')
		expect(
			document.getElementById(panel.getAttribute('aria-labelledby') ?? '')?.textContent,
		).toBe('Delete record?')
		expect(
			document.getElementById(panel.getAttribute('aria-describedby') ?? '')?.textContent,
		).toBe('This cannot be undone.')
		await userEvent.keyboard('{Tab}')
		expect(document.activeElement).toBe(node('.so-alert-dialog__action'))
		await userEvent.keyboard('{Tab}')
		expect(document.activeElement).toBe(node('.so-alert-dialog__close'))
		await userEvent.keyboard('{Tab}')
		expect(document.activeElement).toBe(node('.so-alert-dialog__cancel'))
		await userEvent.click(page.elementLocator(node('.so-backdrop:has(+ .so-alert-dialog)')), {
			position: { x: 5, y: 5 },
		})
		expect(ctrl.visible).toBe(true)
		expect(document.activeElement).toBe(node('.so-alert-dialog__cancel'))
		await userEvent.keyboard('{Escape}')
		await expect.poll(() => ctrl.visible).toBe(false)
		expect(cancel).toHaveBeenCalledTimes(1)
		expect(confirm).not.toHaveBeenCalled()
		expect(document.activeElement).toBe(node('.open'))
	})
	it('a keyboard activation confirms exactly once and reopening restores safe focus', async () => {
		const { ctrl, confirm } = await show()
		await userEvent.keyboard('{Tab}{Enter}')
		expect(confirm).toHaveBeenCalledTimes(1)
		expect(ctrl.visible).toBe(false)
		await userEvent.click(page.getByRole('button', { name: 'Open', exact: true }))
		await expect.poll(() => document.activeElement).toBe(node('.so-alert-dialog__cancel'))
	})
	it('custom footer starts at the panel and explicit empty footer leaves the close control', async () => {
		await show(() => [])
		expect(document.querySelectorAll('.so-alert-dialog__footer button')).toHaveLength(0)
		await userEvent.keyboard('{Tab}')
		expect(document.activeElement).toBe(node('.so-alert-dialog__close'))
	})
	it('uses destructive theme color, logical RTL order and a bounded narrow layout', async () => {
		const { ctrl } = await show()
		const action = node('.so-alert-dialog__action')
		const color = getComputedStyle(action)
		expect(color.getPropertyValue('--so-tone-filled').trim()).toBe(
			color.getPropertyValue('--so-alert-dialog-action-fill').trim(),
		)
		ctrl.direction = 'rtl'
		ctrl.width = 280
		await nextTick()
		const panel = node('.so-alert-dialog')
		expect(panel.getBoundingClientRect().width).toBe(280)
		expect(node('.so-alert-dialog__cancel').getBoundingClientRect().x).toBeGreaterThan(
			action.getBoundingClientRect().x,
		)
		await forcedColors('active')
		expect(getComputedStyle(panel).outlineStyle).toBe('solid')
	})
	it('nested Escape cancels only the top modal and restores its opener', async () => {
		const outer = new TAlertDialog({ visible: true })
		const inner = new TAlertDialog()
		render(
			defineComponent({
				render: () =>
					h(
						AlertDialog,
						{ ctrl: outer },
						{
							title: () => 'Outer',
							default: () => [
								h(
									Button,
									{
										class: 'nested-open',
										onClick: () => {
											inner.visible = true
										},
									},
									() => 'Nested',
								),
								h(
									AlertDialog,
									{ ctrl: inner },
									{ title: () => 'Inner', default: () => 'Nested question' },
								),
							],
						},
					),
			}),
		)
		await userEvent.click(page.getByRole('button', { name: 'Nested', exact: true }))
		await expect
			.poll(() => document.activeElement?.closest('.so-alert-dialog')?.textContent)
			.toContain('Inner')
		await userEvent.keyboard('{Escape}')
		expect(inner.visible).toBe(false)
		expect(outer.visible).toBe(true)
		expect(document.activeElement).toBe(node('.nested-open'))
	})
})
