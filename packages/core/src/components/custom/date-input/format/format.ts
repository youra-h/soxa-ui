import { DEFAULT_LOCALE, calendarLocale, digitsOf, directionOf } from '../../../../common'
import { groupSpecsOf } from '../date-time'
import type { TFieldPart } from '../segments'
import type { TDateFieldPart, TDateInputKind, TTimePrecision } from '../types'
import type { IDateFieldFormat, TDateFieldToken, TPartGroup } from './types'

/**
 * Опорный момент формата — 12 мая 2026, 14:30:15 UTC. По нему видно
 * направление ряда и сдвиг года календаря поля: число дня не совпадает с
 * номером месяца, а час, минута и секунда — ни с днём, ни друг с другом, и
 * части не спутать.
 */
const SAMPLE = Date.UTC(2026, 4, 12, 14, 30, 15)
const SAMPLE_YEAR = 2026

/**
 * Форматы по тегу, как его задали, виду поля и точности времени. Карта
 * заводится при первом обращении, а не при загрузке модуля: приложению без
 * поля даты она не нужна.
 */
let formats: Map<string, Map<TDateInputKind, Map<TTimePrecision, IDateFieldFormat>>> | undefined

/**
 * Формат поля в локали `locale`, виде `kind` и точности времени
 * `timePrecision` — один на тег, вид и точность: форматтеры Intl создаются
 * один раз и служат всем полям с ними. Невалидный и пустой тег — `en-US`.
 */
export function fieldFormat(
	locale: string | undefined,
	kind: TDateInputKind,
	timePrecision: TTimePrecision,
): IDateFieldFormat {
	formats ??= new Map()

	const byKind = cached(formats, locale ?? '', () => new Map())
	const byPrecision = cached(byKind, kind, () => new Map())

	return cached(byPrecision, timePrecision, () => createFormat(locale, kind, timePrecision))
}

/** Значение карты по ключу; нет — создаётся и запоминается. */
function cached<K, V>(map: Map<K, V>, key: K, create: () => NoInfer<V>): V {
	let value = map.get(key)

	if (value === undefined) {
		value = create()
		map.set(key, value)
	}

	return value
}

/**
 * Формат Intl с частями групп вида поля в точности времени. Тег и календарь —
 * у локали календаря (`calendarLocale`): календарь поля буддийский, если
 * буддийский календарь подписей, иначе григорианский — эры у поля нет, а
 * японская эра меняется посреди года. Цикл часов — только от локали, с ключом
 * `-u-hc-` тоже.
 *
 * Группы узнают у форматтера своё (сдвиг года, цикл часов) и отдают части;
 * Intl отдал не ровно по одной части каждого типа — формат собирается из
 * запасных форматов групп. У известных движков такой локали нет.
 */
function createFormat(
	tag: string | undefined,
	kind: TDateInputKind,
	timePrecision: TTimePrecision,
): IDateFieldFormat {
	const { locale, calendar } = calendarLocale(tag)
	const specs = groupSpecsOf(kind, timePrecision)
	const formatter = new Intl.DateTimeFormat([locale, DEFAULT_LOCALE], {
		...specs.reduce<Intl.DateTimeFormatOptions>(
			(all, spec) => ({ ...all, ...spec.options }),
			{},
		),
		calendar: calendar === 'buddhist' ? 'buddhist' : 'gregory',
		timeZone: 'UTC',
	})
	const resolved = formatter.resolvedOptions()
	const sample = formatter.formatToParts(SAMPLE)
	const digits = digitsOf(resolved.numberingSystem)
	const groups = specs.map((spec) =>
		spec.create({ resolved, sample, sampleYear: SAMPLE_YEAR, digits }),
	)
	const tokens = tokensOf(sample, groups) ?? isoTokensOf(groups)

	return {
		kind,
		timePrecision,
		tokens,
		parts: tokens.flatMap((token) => (token.type === 'literal' ? [] : [token])),
		groups,
		direction: directionOf(sample.map((part) => part.value).join('')),
		lang: resolved.locale,
		digits,
		names: namesOf(locale),
	}
}

/**
 * Части и литералы формата. Соседние литералы склеиваются, всё, что не часть
 * групп, — тоже литерал. Не ровно по одной части каждого типа — `undefined`.
 */
function tokensOf(
	sample: readonly Intl.DateTimeFormatPart[],
	groups: readonly TPartGroup[],
): readonly TDateFieldToken[] | undefined {
	const expected = groups.flatMap((group) => group.parts)
	const tokens: TDateFieldToken[] = []
	const seen = new Set<TFieldPart>()

	for (const { type, value } of sample) {
		const last = tokens[tokens.length - 1]
		const part = expected.find((candidate) => candidate.type === type)

		if (part !== undefined && !seen.has(part)) {
			seen.add(part)
			tokens.push(part)
		} else {
			// ICU versions disagree on non-breaking spaces; stabilize SSR literals without changing bidi marks.
			const text = value.replace(/[\u00a0\u202f]/g, ' ')

			if (last?.type === 'literal') {
				tokens[tokens.length - 1] = { type: 'literal', text: last.text + text }
			} else {
				tokens.push({ type: 'literal', text })
			}
		}
	}

	return seen.size === expected.length ? tokens : undefined
}

/** Запасной формат — ISO: запасные форматы групп через пробел. */
function isoTokensOf(groups: readonly TPartGroup[]): readonly TDateFieldToken[] {
	return groups.flatMap((group, index): readonly TDateFieldToken[] =>
		index === 0 ? group.isoTokens : [{ type: 'literal', text: ' ' }, ...group.isoTokens],
	)
}

/**
 * Имена частей для скринридера — `Intl.DisplayNames` с типом
 * `dateTimeField`, локали списком `[тег, 'en-US']`, как у подписей. Движок без
 * таких имён — имена типов частей: своих строк у библиотеки нет.
 */
function namesOf(locale: string): Readonly<Record<TDateFieldPart, string>> {
	let of = (part: TDateFieldPart): string => part

	try {
		const names = new Intl.DisplayNames([locale, DEFAULT_LOCALE], { type: 'dateTimeField' })

		of = (part) => names.of(part) ?? part
	} catch {
		// Движок без имён — имена типов
	}

	return {
		day: of('day'),
		month: of('month'),
		year: of('year'),
		hour: of('hour'),
		minute: of('minute'),
		second: of('second'),
		dayPeriod: of('dayPeriod'),
	}
}
