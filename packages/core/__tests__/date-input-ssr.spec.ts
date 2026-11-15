import { afterEach, describe, expect, it, vi } from 'vitest'
import { TDateInput } from '@soxa-ui/core'
import type { TTimePrecision } from '@soxa-ui/core'

const formatToParts = Intl.DateTimeFormat.prototype.formatToParts

afterEach(() => vi.restoreAllMocks())

/** Model the literal spaces returned by different ICU versions in isolated format caches. */
function segmentsWithSpace(
	locale: string,
	timePrecision: TTimePrecision,
	space: string,
	cacheKey: string,
	value?: string,
) {
	const spy = vi
		.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts')
		.mockImplementation(function (this: Intl.DateTimeFormat, date) {
			return formatToParts
				.call(this, date)
				.map((part) =>
					part.type === 'literal'
						? { ...part, value: part.value.replace(/[ \u00a0\u202f]/g, space) }
						: part,
				)
		})

	try {
		return new TDateInput({
			locale: `${locale}-x-${cacheKey}`,
			kind: 'datetime',
			timePrecision,
			value,
		}).segments
	} finally {
		spy.mockRestore()
	}
}

describe('DateInput SSR literal stability', () => {
	it.each(['minute', 'second'] as const)(
		'%s precision matches across ICU space variants',
		(precision) => {
			for (const locale of ['en', 'ar-EG', 'en-u-hc-h23']) {
				for (const value of [undefined, '2026-11-15T14:30:45']) {
					const ascii = segmentsWithSpace(locale, precision, ' ', 'ascii', value)

					for (const [cacheKey, space] of [
						['nbsp', '\u00a0'],
						['narrow', '\u202f'],
					]) {
						const segments = segmentsWithSpace(
							locale,
							precision,
							space,
							cacheKey,
							value,
						)

						expect(segments).toEqual(ascii)
						expect(
							segments
								.filter((part) => part.type === 'literal')
								.map((part) => part.text)
								.join(''),
						).not.toMatch(/[\u00a0\u202f]/)
					}
				}
			}
		},
	)

	it('preserves punctuation and RTL direction marks in literals', () => {
		const input = new TDateInput({
			locale: 'ar-EG',
			kind: 'datetime',
			timePrecision: 'second',
			value: '2026-11-15T14:30:45',
		})
		const literals = input.segments
			.filter((part) => part.type === 'literal')
			.map((part) => part.text)
		const expected = new Intl.DateTimeFormat('ar-EG', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			timeZone: 'UTC',
		})
			.formatToParts(Date.UTC(2026, 10, 15, 14, 30, 45))
			.filter((part) => part.type === 'literal')
			.map((part) => part.value.replace(/[\u00a0\u202f]/g, ' '))

		expect(literals).toEqual(expected)
		expect(literals.join('')).toContain('\u200f')
	})
})
