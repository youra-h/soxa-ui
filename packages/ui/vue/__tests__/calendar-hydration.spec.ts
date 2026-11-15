import { afterEach, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import { TCalendar } from '@soxa-ui/core'
import { Calendar } from '@soxa-ui/vue'
import { hydrate, unmountHydrated } from './hydrate'

afterEach(() => {
	unmountHydrated()
	vi.restoreAllMocks()
})

const dates = (root: HTMLElement, selector: string) =>
	[...root.querySelectorAll(selector)].map((cell) => cell.textContent?.trim())

it.each(['UTC', 'America/Los_Angeles'])(
	'refreshes SSG today attributes after hydration in %s',
	async (timeZone) => {
		const now = vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-14T12:00:00Z'))
		const createCalendar = () =>
			new TCalendar({ timeZone, months: ['2026-11-01'], value: '2026-11-15' })
		const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
		let cells: Element[] = []
		const { server, client, warnings } = await hydrate(
			() => h(Calendar, { ctrl: createCalendar(), mode: 'single' }),
			(root) => {
				cells = [...root.querySelectorAll('.so-calendar-item')]
				now.mockReturnValue(Date.parse('2026-11-15T02:00:00Z'))
			},
		)
		await nextTick()

		const expected = timeZone === 'UTC' ? '15' : '14'

		expect(dates(server, '.so-calendar-item[data-today="true"]')).toEqual(['14'])
		expect(dates(server, '.so-calendar-item[aria-current="date"]')).toEqual(['14'])
		expect(dates(client, '.so-calendar-item[data-today="true"]')).toEqual([expected])
		expect(dates(client, '.so-calendar-item[aria-current="date"]')).toEqual([expected])
		const hydratedCells = [...client.querySelectorAll('.so-calendar-item')]

		expect(hydratedCells).toHaveLength(cells.length)
		cells.forEach((cell, index) => expect(hydratedCells[index]).toBe(cell))
		expect(warnings).toEqual([])
		expect(errors).not.toHaveBeenCalled()
	},
)
