import { expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { DateInput, LocaleProvider } from '@soxa-ui/vue'
import { enUS } from '@soxa-ui/plugins'

it.each(['minute', 'second'] as const)(
	'hydrates DateInput with %s precision across ICU spaces',
	async (timePrecision) => {
		const original = Intl.DateTimeFormat.prototype.formatToParts
		let space = '\u202f'
		const formatter = vi
			.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts')
			.mockImplementation(function (this: Intl.DateTimeFormat, date) {
				return original
					.call(this, date)
					.map((part) =>
						part.type === 'literal'
							? { ...part, value: part.value.replace(/[ \u00a0\u202f]/g, space) }
							: part,
					)
			})
		// Private subtags isolate the format caches while resolving to the same English locale.
		const tree = (phase: string) =>
			h(
				LocaleProvider,
				{ locale: { ...enUS, tag: `en-x-${phase}-${timePrecision}` } },
				{
					default: () =>
						h(DateInput, {
							kind: 'datetime',
							timePrecision,
							value: '2026-11-15T14:30:45',
						}),
				},
			)
		const host = document.createElement('div')
		const app = createSSRApp({ render: () => tree('client') })
		const warnings: string[] = []
		app.config.warnHandler = (message) => warnings.push(message)
		const error = vi.spyOn(console, 'error').mockImplementation(() => {})

		try {
			host.innerHTML = await renderToString(createSSRApp({ render: () => tree('server') }))
			document.body.append(host)
			const literals = [...host.querySelectorAll('.so-date-input__literal')]
			const text = host.textContent
			expect(text).toContain(' PM')
			expect(text).not.toContain('\u202f')
			space = ' '
			app.mount(host)
			await nextTick()

			expect(warnings).toEqual([])
			expect(error).not.toHaveBeenCalled()
			expect(host.textContent).toBe(text)
			expect(
				[...host.querySelectorAll('.so-date-input__literal')].every(
					(node, index) => node === literals[index],
				),
			).toBe(true)
		} finally {
			app.unmount()
			host.remove()
			formatter.mockRestore()
			error.mockRestore()
		}
	},
)
