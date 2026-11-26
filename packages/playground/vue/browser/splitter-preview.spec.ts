import { expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { useIcons, useTheme } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'
import oren from '@soxa-ui/theme-oren/setup'
import { router } from '../src/router'
import { pixel } from './colors'
import { renderStand } from './stand'

import '@soxa-ui/theme-oren'
import '../src/styles.css'

useIcons(material)
useTheme(oren)

it('selects the shared Splitter orientation in both Playground columns', async () => {
	await page.viewport(1440, 960)
	await router.push('/vue/splitter')
	renderStand()

	const orientation = (): HTMLElement | undefined =>
		[...document.querySelectorAll<HTMLElement>('.pg-prop')].find(
			(row) => row.querySelector('.pg-prop__name')?.textContent?.trim() === 'orientation',
		)

	await expect.poll(() => orientation()?.querySelectorAll('.so-splitter').length).toBe(2)

	const row = orientation()
	const combobox = row?.querySelector<HTMLElement>('.pg-prop__head [role="combobox"]')

	if (!row || !combobox) throw new Error('Missing orientation Select')

	const options = (): HTMLElement[] => {
		const listId = combobox.getAttribute('aria-controls')

		return listId
			? [
					...(document
						.getElementById(listId)
						?.querySelectorAll<HTMLElement>('[role="option"]') ?? []),
				]
			: []
	}
	const layouts = () => [...row.querySelectorAll<HTMLElement>('.so-splitter')]
	expect(layouts().map(({ dataset }) => dataset.orientation)).toEqual([
		'horizontal',
		'horizontal',
	])

	await userEvent.click(combobox)
	await expect
		.poll(() => options().map((option) => option.textContent?.trim()))
		.toEqual(['horizontal', 'vertical'])

	await userEvent.click(options()[1])
	await expect
		.poll(() => layouts().map(({ dataset }) => dataset.orientation))
		.toEqual(['vertical', 'vertical'])

	const [sample] = layouts()
	expect(getComputedStyle(sample).flexDirection).toBe('column')
	for (const panel of sample.querySelectorAll<HTMLElement>('.so-splitter__panel')) {
		expect(panel.scrollHeight).toBe(panel.clientHeight)
	}
})

it('edits panel settings as JSON and keeps the last valid layout during correction', async () => {
	await page.viewport(1440, 960)
	await router.push('/vue/splitter')
	renderStand()

	const row = (): HTMLElement | undefined =>
		[...document.querySelectorAll<HTMLElement>('.pg-prop')].find(
			(element) => element.querySelector('.pg-prop__name')?.textContent?.trim() === 'panels',
		)

	await expect.poll(() => row()?.querySelectorAll('.so-splitter').length).toBe(2)

	const panelsRow = row()
	const field = panelsRow?.querySelector<HTMLTextAreaElement>('textarea')
	const notice = panelsRow?.querySelector('.pg-prop__notice')

	if (!panelsRow || !field || !notice) throw new Error('Missing panels JSON editor or notice')

	expect(notice.textContent).toContain('до половины minSize')
	expect(document.querySelectorAll('.pg-prop__notice')).toHaveLength(1)
	const [red, green, blue] = pixel([getComputedStyle(notice).color])
	expect(red).toBeGreaterThan(Math.max(green, blue))

	const otherRows = [...document.querySelectorAll('.pg-prop')].filter(
		(element) => element !== panelsRow,
	)
	const minimums = (element: Element) =>
		Array.from(element.querySelectorAll('.so-splitter__thumb[data-index="0"]'), (handle) =>
			handle.getAttribute('aria-valuemin'),
		)
	expect(minimums(panelsRow)).toEqual(['0', '0'])
	await expect.poll(() => otherRows.map(minimums)).toEqual(otherRows.map(() => ['15', '15']))

	const initial = field.value
	expect(initial).toContain('\n    "id": "files",')
	expect(initial).toContain('"collapsible": true')
	const firstPanelSizes = () =>
		[
			...(row()?.querySelectorAll('.so-splitter .so-splitter__thumb[data-index="0"]') ?? []),
		].map((handle) => handle.getAttribute('aria-valuenow'))

	await expect.poll(firstPanelSizes).toEqual(['25', '25'])

	await userEvent.fill(field, '{')
	await expect.poll(() => field.getAttribute('aria-invalid')).toBe('true')
	expect(field.value).toBe('{')
	expect(firstPanelSizes()).toEqual(['25', '25'])

	await userEvent.fill(field, initial.replace('"minSize": 15', '"minSize": 90'))
	await expect.poll(() => row()?.textContent).toContain('Проверьте уникальность id')
	expect(firstPanelSizes()).toEqual(['25', '25'])

	const revised = initial.replace('"minSize": 15', '"minSize": 35').trimEnd() + '\n'
	await userEvent.fill(field, revised)
	await expect.poll(firstPanelSizes).toEqual(['35', '35'])
	await expect.poll(() => field.getAttribute('aria-invalid')).not.toBe('true')
	expect(field.value).toBe(revised)
})
