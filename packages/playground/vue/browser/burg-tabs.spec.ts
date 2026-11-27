import { afterEach, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h } from 'vue'
import { Tabs, TabsItem } from '@soxa-ui/vue'
import { find, style, systemColor } from './colors'
import { forcedColors } from './media'
import { render } from './render'

import '@soxa-ui/theme-burg'

const labels = ['Account', 'Password', 'Settings']

const mountTabs = (view: 'line' | 'contained', { theme = 'burg', width = 480 } = {}) =>
	render({
		render: () =>
			h('div', { 'data-so-theme': theme, style: { width: width + 'px' } }, [
				h(Tabs, { view }, () =>
					labels.map((text, index) =>
						h(TabsItem, { key: text, value: text, text, active: index === 0 }),
					),
				),
			]),
	})

afterEach(async () => {
	if (matchMedia('(forced-colors: active)').matches) await forcedColors('none')
})

it('draws a marker only under the selected line tab', async () => {
	const scene = mountTabs('line')
	const bar = find('.so-tabs__bar', scene)
	const [first, second] = scene.querySelectorAll('.so-tabs-item')

	expect(style(bar).borderBlockEndWidth).toBe('0px')
	expect(style(first, '::after').blockSize).toBe('2px')
	expect(style(second, '::after').content).toBe('none')

	await page.getByRole('tab', { name: 'Password' }).click()

	expect(style(first, '::after').content).toBe('none')
	expect(style(second, '::after').blockSize).toBe('2px')
})

it.each(['burg', 'burg-dark'])(
	'fits the contained track and moves selection in %s',
	async (theme) => {
		const scene = mountTabs('contained', { theme })
		const root = find('.so-tabs', scene)
		const bar = find('.so-tabs__bar', scene)
		const [first, second] = scene.querySelectorAll('.so-tabs-item')

		expect(bar.clientWidth).toBeLessThan(root.clientWidth)
		expect(style(first).backgroundColor).not.toBe(style(bar).backgroundColor)
		expect(style(first).boxShadow).not.toBe('none')
		expect(style(second).boxShadow).toBe('none')

		await page.getByRole('tab', { name: 'Account' }).click()
		await userEvent.keyboard('{ArrowRight}')
		const password = page.getByRole('tab', { name: 'Password' })
		await expect.element(password).toHaveFocus()
		await expect.element(password).toHaveAttribute('aria-selected', 'true')
		expect(style(first).boxShadow).toBe('none')
		expect(style(second).boxShadow).not.toBe('none')
	},
)

it('keeps an overflowing contained track scrollable', async () => {
	const scene = mountTabs('contained', { width: 120 })
	const bar = find('.so-tabs__bar', scene)

	expect(bar.clientWidth).toBe(120)
	expect(bar.scrollWidth).toBeGreaterThan(bar.clientWidth)
	await page.getByRole('tab', { name: 'Account' }).click()
	await userEvent.keyboard('{End}')
	await expect.element(page.getByRole('tab', { name: 'Settings' })).toHaveFocus()
	await expect.poll(() => bar.scrollLeft).toBeGreaterThan(0)
})

it('outlines the selected contained tab in forced colors', async () => {
	await forcedColors('active')
	const scene = mountTabs('contained')
	const selected = find('.so-tabs-item[data-selected="true"]', scene)

	expect(style(selected).outlineStyle).toBe('solid')
	expect(style(selected).outlineColor).toBe(systemColor('Highlight'))
})
