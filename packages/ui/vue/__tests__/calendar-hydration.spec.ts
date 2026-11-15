import { afterEach, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick, type App } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { TCalendar } from '@soxa-ui/core'
import { Calendar } from '@soxa-ui/vue'

let app: App | undefined

afterEach(() => {
	app?.unmount()
	app = undefined
	document.body.innerHTML = ''
	vi.restoreAllMocks()
})

it.each(['UTC', 'America/Los_Angeles'])(
	'refreshes SSG today attributes after hydration in %s',
	async (timeZone) => {
		const now = vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-14T12:00:00Z'))
		const createCalendar = () =>
			new TCalendar({ timeZone, months: ['2026-11-01'], value: '2026-11-15' })
		const html = await renderToString(
			createSSRApp({ render: () => h(Calendar, { ctrl: createCalendar(), mode: 'single' }) }),
		)
		const container = document.createElement('div')

		container.innerHTML = html
		document.body.append(container)
		const cells = [...container.querySelectorAll('.so-calendar-item')]
		const today = () =>
			[...container.querySelectorAll('.so-calendar-item[data-today="true"]')].map((cell) =>
				cell.textContent?.trim(),
			)
		const current = () =>
			[...container.querySelectorAll('.so-calendar-item[aria-current="date"]')].map((cell) =>
				cell.textContent?.trim(),
			)

		expect(today()).toEqual(['14'])
		expect(current()).toEqual(['14'])
		now.mockReturnValue(Date.parse('2026-11-15T02:00:00Z'))

		const warnings: string[] = []
		const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
		app = createSSRApp({
			render: () => h(Calendar, { ctrl: createCalendar(), mode: 'single' }),
		})
		app.config.warnHandler = (message) => warnings.push(message)
		app.mount(container)
		await nextTick()

		const expected = timeZone === 'UTC' ? '15' : '14'
		expect(today()).toEqual([expected])
		expect(current()).toEqual([expected])
		expect([...container.querySelectorAll('.so-calendar-item')]).toEqual(cells)
		cells.forEach((cell, index) =>
			expect(container.querySelectorAll('.so-calendar-item')[index]).toBe(cell),
		)
		expect(warnings).toEqual([])
		expect(errors).not.toHaveBeenCalled()
	},
)
