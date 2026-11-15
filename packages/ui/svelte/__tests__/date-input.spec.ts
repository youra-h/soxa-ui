/**
 * DateInput в Svelte — проводка на настоящей разметке.
 *
 * Сценарии — те же, что у Vue (`date-input.spec.ts`) и Solid. Модель — набор,
 * вставка, формат локали — проверяет ядро, клавиши и буфер обмена — тест
 * плагинов, протяжку мышью, выделение и настоящий буфер — браузер
 * (`playground/vue/browser/date-input.spec.ts`). Здесь важно, что выходы ядра
 * доезжают туда, куда должны: части и разделители — в ряд в порядке формата,
 * наборы части — на её узел, `dir` и `lang` — на ряд, значение — в скрытое
 * поле, а клавиши на настоящей разметке доходят до модели и возвращаются
 * `onChangeValue`.
 *
 * Своё у Svelte — узлы частей. Части — выход ядра, новый на каждую смену, и
 * петля идёт по ключу части: узел части тот же при наборе и при смене локали.
 * Текст части пишет `TextSpan` адаптера, свойством `textContent`: часть,
 * которую браузер на касании оставил пустой, получает текст ядра целиком, а
 * своего текстового узла Svelte, чья запись ушла бы мимо, в части нет. Пробел
 * между узлами Svelte оставил бы текстом, и ряд частей проверяется целиком:
 * плагин буфера обмена копирует его текст.
 *
 * Язык поля — тег локали поддерева (`LocaleProvider`), своего у поля нет:
 * здесь он русский, а тест на другом языке задаёт свою локаль провайдеру.
 * Серверная разметка — `ssr.server.spec.ts`, гидратация —
 * `hydration/dates.hydration.spec.ts`.
 */

import { describe, it, expect, vi } from 'vitest'
import { createRawSnippet, flushSync } from 'svelte'
import type { IDateInput, TDateInputKind, TTimePrecision } from '@soxa-ui/core'
import { arEG, enUS, ruRU, type TLocale } from '@soxa-ui/plugins'
import type { DateInputProps } from '@soxa-ui/svelte'
import Surround from './Surround.test.svelte'
import { find, mount, nextFrame } from './mount'
import { reactiveProps } from './reactive-props.svelte'
import { markup } from './snippets.svelte'

/** Значение поля даты: строка даты или даты со временем, пусто — `undefined`. */
type TValue = string | undefined

/** Пропсы обёртки: поле даты под провайдером локали, пропсы поля — `dateInput`. */
type THarnessProps = {
	around: 'locale'
	control: 'date-input'
	locale: TLocale
	dateInput: DateInputProps
}

/**
 * Смонтировать поле в провайдере локали и дождаться кадра: корень плагины
 * получают через `requestAnimationFrame`. Пропсы — живые: смена локали или
 * пропа поля — присваивание полю пропсов.
 */
async function render(field: DateInputProps = {}, locale: TLocale = ruRU): Promise<THarnessProps> {
	const props = reactiveProps<THarnessProps>({
		around: 'locale',
		control: 'date-input',
		locale,
		dateInput: field,
	})

	mount(Surround, props)
	await nextFrame()

	return props
}

/**
 * Поле, чьё значение возвращается пропом, — как `v-model` у Vue: значение
 * держит родитель, а смена приходит `onChangeValue`.
 */
async function controlled(
	field: DateInputProps = {},
	onValue?: (value: TValue) => void,
): Promise<THarnessProps> {
	const props = await render({
		...field,
		onChangeValue: (payload) => {
			props.dateInput.value = payload.newValue
			onValue?.(payload.newValue)
		},
	})

	return props
}

/** Узел по селектору в документе. */
const node = (selector: string) => find(document, selector, HTMLElement)

const nodes = (selector: string): HTMLElement[] =>
	[...document.querySelectorAll(selector)].filter(
		(element): element is HTMLElement => element instanceof HTMLElement,
	)

/** Часть по типу. */
const segment = (type: string) => node(`.so-date-input__segment[data-type="${type}"]`)

/** Скрытое поле формы. */
const hidden = () => find(document, 'input[type="hidden"]', HTMLInputElement)

/** Ряд частей. */
const row = () => node('.so-date-input__segments')

/** Узлы ряда по порядку: класс и текст. */
const rowContent = () => [...row().children].map((part) => [part.className, part.textContent])

/** Тексты ряда по порядку. */
const rowTexts = () => rowContent().map(([, text]) => text)

/** Нажатие клавиши с узла, как у пользователя: событие всплывает до корня. */
function press(from: Element, key: string): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

	from.dispatchEvent(event)
	flushSync()

	return event
}

/** Набрать строку с узла под фокусом документа. */
function type(keys: string): void {
	for (const key of keys) {
		const active = document.activeElement

		if (!active) throw new Error('фокуса нет')

		press(active, key)
	}
}

/** Опции времени у форматтера для сверки — по точности, как у формата поля. */
const TIME_OPTIONS: Readonly<Record<TTimePrecision, Intl.DateTimeFormatOptions>> = {
	minute: { hour: '2-digit', minute: '2-digit' },
	second: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
}

/**
 * Части и литералы даты со временем `YYYY-MM-DDTHH:mm` или
 * `YYYY-MM-DDTHH:mm:ss` по форматтеру поля — с теми же опциями.
 */
function formattedTime(
	locale: string,
	dateTime: string,
	timePrecision: TTimePrecision = 'minute',
): Intl.DateTimeFormatPart[] {
	const [date = '', time = ''] = dateTime.split('T')
	const [year = 0, month = 1, day = 1] = date.split('-').map(Number)
	const [hour = 0, minute = 0, second = 0] = time.split(':').map(Number)
	const formatter = new Intl.DateTimeFormat([locale, 'en-US'], {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		...TIME_OPTIONS[timePrecision],
		calendar: 'gregory',
		timeZone: 'UTC',
	})

	return formatter
		.formatToParts(Date.UTC(year, month - 1, day, hour, minute, second))
		.map((part) =>
			part.type === 'literal'
				? { ...part, value: part.value.replace(/[\u00a0\u202f]/g, ' ') }
				: part,
		)
}

/** Части и литералы даты по форматтеру поля — с теми же опциями. */
function formatted(locale: string, date: string): string[] {
	const [year = 0, month = 1, day = 1] = date.split('-').map(Number)
	const formatter = new Intl.DateTimeFormat([locale, 'en-US'], {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		calendar: 'gregory',
		timeZone: 'UTC',
	})

	return formatter.formatToParts(Date.UTC(year, month - 1, day)).map(({ value }) => value)
}

describe('DateInput · разметка', () => {
	it('ru: корень — группа, в ряду части и разделители в порядке формата', async () => {
		await render({ aria_label: 'Дата рождения' })

		const root = node('.so-date-input')

		expect(root.getAttribute('role')).toBe('group')
		expect(root.getAttribute('aria-label')).toBe('Дата рождения')
		expect(root.dataset['invalid']).toBeUndefined()
		expect(rowContent()).toEqual([
			['so-date-input__segment', 'дд'],
			['so-date-input__literal', '.'],
			['so-date-input__segment', 'мм'],
			['so-date-input__literal', '.'],
			['so-date-input__segment', 'гггг'],
		])
		expect(row().getAttribute('dir')).toBe('ltr')
		expect(row().getAttribute('lang')).toBe('ru-RU')
	})

	it('часть — spinbutton со своей остановкой Tab, разделитель скрыт от скринридера', async () => {
		await render({ value: '2026-05-12' })

		const day = segment('day')

		expect(day.getAttribute('role')).toBe('spinbutton')
		expect(day.getAttribute('tabindex')).toBe('0')
		expect(day.getAttribute('aria-valuenow')).toBe('12')
		expect(day.getAttribute('aria-label')).toBe(
			new Intl.DisplayNames(['ru-RU', 'en-US'], { type: 'dateTimeField' }).of('day'),
		)
		expect(day.dataset['placeholder']).toBe('false')
		expect(
			nodes('.so-date-input__literal').every(
				(literal) => literal.getAttribute('aria-hidden') === 'true',
			),
		).toBe(true)
		// Ни `contenteditable`, ни `inputmode`: часть нередактируемая
		expect(day.hasAttribute('contenteditable')).toBe(false)
		expect(day.hasAttribute('inputmode')).toBe(false)
	})

	it('ar-EG: ряд справа налево, цифры арабские, разделители с метками направления', async () => {
		await render({ value: '2026-05-12' }, arEG)

		expect(row().getAttribute('dir')).toBe('rtl')
		expect(rowTexts()).toEqual(formatted('ar-EG', '2026-05-12'))
	})

	it('выключенное поле — частей вне порядка Tab, скрытое поле выключено', async () => {
		await render({ disabled: true, name: 'birthday', value: '2026-05-12' })

		expect(nodes('.so-date-input__segment[tabindex]')).toEqual([])
		expect(node('.so-date-input').dataset['disabled']).toBe('true')
		expect(hidden().hasAttribute('disabled')).toBe(true)
	})

	it('дата вне min/max — data-invalid у корня и aria-invalid у частей', async () => {
		await render({ value: '2026-05-12', max: '2026-01-01' })

		expect(node('.so-date-input').dataset['invalid']).toBe('true')
		expect(segment('year').getAttribute('aria-invalid')).toBe('true')
	})

	it('порядок узлов — как у Vue: leading, ряд частей, обёртка у конца, скрытое поле', async () => {
		await render({
			clearable: true,
			leading: markup('<i>с</i>'),
			trailing: markup('<button class="so-test-calendar"></button>'),
		})

		expect(
			[...node('.so-date-input').children].map((child) =>
				child.localName === 'input'
					? `input.${child.getAttribute('type')}`
					: child.className,
			),
		).toEqual([
			'so-date-input__leading',
			'so-date-input__segments',
			'so-date-input__trailing',
			'input.hidden',
		])
	})

	it('атрибуты снаружи — корню, id — тоже', async () => {
		await render({ id: 'when', class: 'mine', 'data-probe': '1', title: 'Дата' })

		const root = node('.so-date-input')

		expect(root.id).toBe('when')
		expect([...root.classList].at(-1)).toBe('mine')
		expect(root.dataset['probe']).toBe('1')
		expect(root.title).toBe('Дата')
	})

	/**
	 * Копию плагин буфера обмена собирает из текста узлов ряда: пробел, который
	 * Svelte оставил бы текстом между частями, испортил бы скопированную дату.
	 */
	it('текст ряда — ровно дата с разделителями: без текста между узлами', async () => {
		await render({ value: '2026-05-12' })

		expect(row().textContent).toBe('12.05.2026')

		const texts = [...row().childNodes].filter(
			(child) => child instanceof Text && child.data.length > 0,
		)

		expect(texts).toEqual([])
	})

	/** Пробел между блоками Svelte оставил бы в корне и в обёртке текстом. */
	it('в корне и в обёртке узлы вплотную: без текста между ними', async () => {
		await render({
			clearable: true,
			leading: markup('<i>с</i>'),
			trailing: markup('<i>шт</i>'),
		})

		for (const scope of ['.so-date-input', '.so-date-input__trailing']) {
			const texts = [...node(scope).childNodes].filter(
				(child) => child instanceof Text && child.data.length > 0,
			)

			expect(texts).toEqual([])
		}
	})
})

describe('DateInput · текст части', () => {
	/**
	 * Текст части пишет только `TextSpan`: в части один текстовый узел, и
	 * своего узла Svelte рядом с ним нет.
	 */
	it('в части — один текстовый узел с текстом ядра', async () => {
		await render({ value: '2026-05-12' })

		const day = segment('day')

		expect([...day.childNodes].map((child) => child.nodeType)).toEqual([Node.TEXT_NODE])
		expect(day.textContent).toBe('12')
	})

	/**
	 * На касании часть редактируемая, и браузер правит её сам — композиция,
	 * клавиатура, которая стирает и после погашенного Backspace, — оставляя
	 * часть пустой. Текст ядра узел получает свойством `textContent`, целиком:
	 * запись в данные текстового узла, которого в части уже нет, ушла бы мимо.
	 */
	it('часть, которую браузер оставил пустой, получает текст ядра', async () => {
		await controlled()

		const day = segment('day')

		day.focus()
		type('1')
		day.replaceChildren()

		type('2')

		expect(day.textContent).toBe('12')
		expect(day.childNodes).toHaveLength(1)
	})

	/**
	 * Сенсорный плагин возвращает части текст ядра записью `textContent`, когда
	 * браузер набрал в ней своё: узлы, которые положил браузер, пропадают, и
	 * дальше часть идёт за ядром.
	 */
	it('после записи textContent мимо разметки часть идёт за ядром', async () => {
		await controlled()

		const day = segment('day')

		day.focus()
		type('1')
		day.textContent = 'x'
		day.append('y')

		type('2')

		expect(day.textContent).toBe('12')
		expect(day.childNodes).toHaveLength(1)
	})

	/** Перерисовка с тем же текстом узел не трогает: текстовый узел — тот же. */
	it('текст не сменился — текстовый узел части тот же', async () => {
		const props = await render({ value: '2026-05-12' })

		const text = segment('day').firstChild

		props.dateInput.max = '2027-01-01'
		flushSync()

		expect(segment('day').firstChild).toBe(text)
	})
})

describe('DateInput · скрытое поле формы', () => {
	it('имя и значение — дата строкой; недописанная дата — пусто', async () => {
		await controlled({ name: 'birthday', value: '2026-05-12' })

		expect(hidden().getAttribute('name')).toBe('birthday')
		expect(hidden().value).toBe('2026-05-12')

		segment('day').focus()
		press(segment('day'), 'Delete')

		expect(hidden().value).toBe('')
	})
})

describe('DateInput · управляемое значение', () => {
	it('набор с клавиатуры возвращает дату через onChangeValue', async () => {
		const onValue = vi.fn()

		await controlled({}, onValue)

		segment('day').focus()
		type('12052026')

		expect(onValue).toHaveBeenLastCalledWith('2026-05-12')
		expect(rowTexts()).toEqual(['12', '.', '05', '.', '2026'])
		expect(document.activeElement).toBe(segment('year'))
	})

	it('значение снаружи — части из него', async () => {
		const props = await render({ value: '2026-05-12' })

		props.dateInput.value = '2027-01-02'
		flushSync()

		expect(rowTexts()).toEqual(['02', '.', '01', '.', '2027'])
	})

	it('набор не пересоздаёт узлы частей: часть и фокус на ней — те же', async () => {
		await controlled()

		const [day, month] = [segment('day'), segment('month')]

		day.focus()
		type('1')

		expect(segment('day')).toBe(day)
		expect(day.textContent).toBe('01')
		expect(document.activeElement).toBe(day)

		type('2')

		expect(segment('day')).toBe(day)
		expect(day.textContent).toBe('12')
		expect(segment('month')).toBe(month)
		expect(document.activeElement).toBe(month)
	})
})

/**
 * Ноль, с которого день не начинается, числа не даёт, но виден в части, пока
 * фокус на ней. Ряд перечитывается по `change:segments` ядра, а не по смене
 * фокуса: ушёл фокус с нулей — ядро само сообщает, что их сменила подсказка.
 */
describe('DateInput · набранный ноль', () => {
	it('клавиша «0» на дне — в части «0»; фокус ушёл на месяц — у дня снова подсказка', async () => {
		await render()

		segment('day').focus()
		type('0')

		expect(segment('day').textContent).toBe('0')
		expect(segment('day').dataset['placeholder']).toBe('false')
		expect(segment('day').getAttribute('aria-valuetext')).toBe('0')
		expect(segment('day').hasAttribute('aria-valuenow')).toBe(false)
		expect(document.activeElement).toBe(segment('day'))

		segment('month').focus()
		flushSync()

		expect(segment('day').textContent).toBe('дд')
		expect(segment('day').dataset['placeholder']).toBe('true')
	})

	it('«00» на дне без validate — день 00, фокус уходит на месяц', async () => {
		await render()

		segment('day').focus()
		type('00')

		expect(segment('day').textContent).toBe('00')
		expect(document.activeElement).toBe(segment('month'))
	})

	it('«00» на дне с validate — фокус стоит, часть ждёт цифры', async () => {
		await render({ validate: true })

		segment('day').focus()
		type('00')

		expect(segment('day').textContent).toBe('00')
		expect(document.activeElement).toBe(segment('day'))
	})
})

describe('DateInput · время', () => {
	it('en-US: час, минута и период суток — в ряду в порядке формата, значение — в скрытом поле', async () => {
		await render({ kind: 'datetime', name: 'meeting', value: '2026-05-12T14:30' }, enUS)

		const parts = formattedTime('en-US', '2026-05-12T14:30')

		expect(rowTexts()).toEqual(parts.map(({ value }) => value))
		expect(nodes('.so-date-input__segment').map((part) => part.dataset['type'])).toEqual([
			'month',
			'day',
			'year',
			'hour',
			'minute',
			'dayPeriod',
		])
		expect(segment('hour').getAttribute('aria-valuemin')).toBe('1')
		expect(segment('hour').getAttribute('aria-valuemax')).toBe('12')
		expect(segment('dayPeriod').getAttribute('role')).toBe('spinbutton')
		expect(segment('dayPeriod').getAttribute('aria-valuetext')).toBe(
			parts.find(({ type }) => type === 'dayPeriod')?.value,
		)
		expect(hidden().value).toBe('2026-05-12T14:30')
	})

	it('ru: 24 часа, периода суток нет; пустое время — черта', async () => {
		await render({ kind: 'datetime' })

		expect(rowTexts()).toEqual(['дд', '.', 'мм', '.', 'гггг', ', ', '––', ':', '––'])
		expect(document.querySelector('[data-type="dayPeriod"]')).toBeNull()
	})

	it('набор времени с клавиатуры возвращает дату со временем через onChangeValue', async () => {
		const onValue = vi.fn()

		await controlled({ kind: 'datetime' }, onValue)

		segment('day').focus()
		type('120520261430')

		expect(onValue).toHaveBeenLastCalledWith('2026-05-12T14:30')
		expect(document.activeElement).toBe(segment('minute'))
	})

	it('смена вида: части времени появляются, значение — в новом виде', async () => {
		const values: TValue[] = []
		const props = await controlled({ kind: 'datetime', value: '2026-05-12T14:30' }, (value) =>
			values.push(value),
		)

		props.dateInput.kind = 'date' satisfies TDateInputKind
		flushSync()

		expect(values.at(-1)).toBe('2026-05-12')
		expect(rowTexts()).toEqual(['12', '.', '05', '.', '2026'])

		// Время осталось в частях и вернулось
		props.dateInput.kind = 'datetime'
		flushSync()

		expect(values.at(-1)).toBe('2026-05-12T14:30')
		expect(segment('minute').textContent).toBe('30')
	})

	it('до секунды: секунда в ряду за минутой, значение — в скрытом поле', async () => {
		await render(
			{
				kind: 'datetime',
				timePrecision: 'second',
				name: 'meeting',
				value: '2026-05-12T14:30:15',
			},
			enUS,
		)

		const parts = formattedTime('en-US', '2026-05-12T14:30:15', 'second')

		expect(rowTexts()).toEqual(parts.map(({ value }) => value))
		expect(nodes('.so-date-input__segment').map((part) => part.dataset['type'])).toEqual([
			'month',
			'day',
			'year',
			'hour',
			'minute',
			'second',
			'dayPeriod',
		])
		expect(segment('second').getAttribute('role')).toBe('spinbutton')
		expect(segment('second').getAttribute('aria-valuenow')).toBe('15')
		expect(segment('second').getAttribute('aria-valuemax')).toBe('59')
		expect(segment('second').getAttribute('aria-label')).toBe(
			new Intl.DisplayNames(['en-US'], { type: 'dateTimeField' }).of('second'),
		)
		expect(segment('second').getAttribute('tabindex')).toBe('0')
		expect(hidden().value).toBe('2026-05-12T14:30:15')
	})

	it('набор секунды с клавиатуры возвращает время до секунды через onChangeValue', async () => {
		const values: TValue[] = []

		await controlled({ kind: 'datetime', timePrecision: 'second' }, (value) =>
			values.push(value),
		)

		segment('day').focus()
		type('120520261430')

		expect(document.activeElement).toBe(segment('second'))
		expect(values).toEqual([])

		type('15')

		expect(values.at(-1)).toBe('2026-05-12T14:30:15')
	})

	it('смена точности: секунда появляется и пропадает, значение — в новой точности', async () => {
		const values: TValue[] = []
		const props = await controlled(
			{ kind: 'datetime', timePrecision: 'minute', value: '2026-05-12T14:30:15' },
			(value) => values.push(value),
		)

		const minute = segment('minute')

		expect(document.querySelector('[data-type="second"]')).toBeNull()

		// Секунда записанного значения была скрыта в частях: значение то же, а
		// ряд перечитывается по смене точности
		props.dateInput.timePrecision = 'second'
		flushSync()

		expect(values).toEqual([])
		expect(segment('second').textContent).toBe('15')
		// Узел минуты тот же: часть ключуется типом
		expect(segment('minute')).toBe(minute)

		props.dateInput.timePrecision = 'minute'
		flushSync()

		expect(values.at(-1)).toBe('2026-05-12T14:30')
		expect(document.querySelector('[data-type="second"]')).toBeNull()

		// Секунда осталась в частях и вернулась
		props.dateInput.timePrecision = 'second'
		flushSync()

		expect(values.at(-1)).toBe('2026-05-12T14:30:15')
		expect(segment('second').textContent).toBe('15')
	})
})

describe('DateInput · смена локали поддерева', () => {
	it('часть меняет место, а её узел остаётся тем же', async () => {
		const props = await render({ value: '2026-05-12' })

		const day = segment('day')
		const segments = row()

		props.locale = enUS
		flushSync()

		expect(segment('day')).toBe(day)
		expect(row()).toBe(segments)
		expect(rowTexts()).toEqual(formatted('en-US', '2026-05-12'))
		expect(row().textContent).toBe(formatted('en-US', '2026-05-12').join(''))
	})
})

describe('DateInput · сенсорный режим', () => {
	/** Нажатие указателем по узлу, как его шлёт браузер. */
	const pointerDown = (from: Element, pointerType: string): void => {
		from.dispatchEvent(new PointerEvent('pointerdown', { pointerType, bubbles: true }))
		flushSync()
	}

	it('касание делает части редактируемыми, нажатие мышью — снова нет', async () => {
		await render({ value: '2026-05-12' })

		const month = segment('month')

		pointerDown(month, 'touch')

		expect(
			nodes('.so-date-input__segment').map((part) => [
				part.getAttribute('contenteditable'),
				part.getAttribute('inputmode'),
			]),
		).toEqual([
			['true', 'numeric'],
			['true', 'numeric'],
			['true', 'numeric'],
		])
		// Узел и текст части — те же: перерисовались только атрибуты
		expect(segment('month')).toBe(month)
		expect(month.textContent).toBe('05')

		pointerDown(month, 'mouse')

		expect(nodes('.so-date-input__segment[contenteditable]')).toEqual([])
		expect(nodes('.so-date-input__segment[inputmode]')).toEqual([])
	})

	it('ввод экранной клавиатуры возвращает дату через onChangeValue', async () => {
		const onValue = vi.fn()

		await controlled({}, onValue)

		pointerDown(segment('day'), 'touch')
		segment('day').focus()

		for (const data of ['12', '05', '2026']) {
			const active = document.activeElement

			if (!active) throw new Error('фокуса нет')

			const event = new InputEvent('beforeinput', {
				inputType: 'insertText',
				data,
				bubbles: true,
				cancelable: true,
			})

			active.dispatchEvent(event)
			flushSync()
			expect(event.defaultPrevented).toBe(true)
		}

		expect(onValue).toHaveBeenLastCalledWith('2026-05-12')
		expect(rowTexts()).toEqual(['12', '.', '05', '.', '2026'])
	})

	it('у каждой части свой id — от монтирования и типа части', async () => {
		await render()

		const parts = nodes('.so-date-input__segment')

		expect(parts.every((part) => part.id.endsWith(`-${part.dataset['type']}`))).toBe(true)
		expect(new Set(parts.map((part) => part.id)).size).toBe(3)
	})
})

describe('DateInput · слоты', () => {
	it('leading и trailing получают инстанс поля; без слота обёртки нет', async () => {
		const seen: IDateInput[] = []

		await render({
			trailing: createRawSnippet((scope: () => { ctrl: IDateInput }) => ({
				render: () => {
					seen.push(scope().ctrl)

					return '<button class="so-test-calendar">Календарь</button>'
				},
			})),
		})

		expect(node('.so-date-input__trailing').querySelector('.so-test-calendar')).not.toBeNull()
		expect(document.querySelector('.so-date-input__leading')).toBeNull()
		expect(seen[0]?.locale).toBe('ru-RU')
	})

	it('клавиши кнопки в слоте — не поля', async () => {
		await render({
			value: '2026-05-12',
			trailing: markup('<button class="so-test-calendar">Календарь</button>'),
		})

		expect(press(node('.so-test-calendar'), 'ArrowUp').defaultPrevented).toBe(false)
	})
})

/**
 * Кнопка очистки — та же, что у Input: часть поля (`ClearableDescriptor`). Что
 * очистка делает с частями, проверяет ядро (`core/__tests__/date-input.spec.ts`),
 * форму кнопки — браузерный прогон.
 */
describe('DateInput · кнопка очистки', () => {
	it('без clearable кнопки нет, и обёртки без слотов тоже', async () => {
		await render({ value: '2026-05-12' })

		expect(document.querySelector('.so-date-input__clear')).toBeNull()
		expect(document.querySelector('.so-date-input__trailing')).toBeNull()
	})

	it('по clearable — первой в обёртке у конца, перед кнопкой календаря', async () => {
		await render({
			clearable: true,
			name: 'Дата',
			trailing: markup('<button class="so-test-calendar">Календарь</button>'),
		})

		const parts = ['.so-date-input__clear', '.so-test-calendar']

		expect(
			[...node('.so-date-input__trailing').children].map((child) =>
				parts.find((part) => child.matches(part)),
			),
		).toEqual(parts)
		expect(node('.so-date-input__clear').getAttribute('aria-label')).toBe('Очистить Дата')
	})

	it('клик очищает все части и значение, до корня не всплывает', async () => {
		const onValue = vi.fn()
		const rootClick = vi.fn()

		await controlled({ clearable: true, value: '2026-05-12', onclick: rootClick }, onValue)

		node('.so-date-input__clear').click()
		flushSync()

		expect(onValue).toHaveBeenLastCalledWith(undefined)
		expect(nodes('.so-date-input__segment').map((part) => part.dataset['placeholder'])).toEqual(
			['true', 'true', 'true'],
		)
		expect(hidden().value).toBe('')
		expect(rootClick).not.toHaveBeenCalled()
	})

	it('выключена вместе с полем, readonly её не гасит', async () => {
		const props = await render({
			clearable: true,
			readonly: true,
			disabled: false,
			value: '2026-05-12',
		})

		expect(node('.so-date-input__clear').hasAttribute('disabled')).toBe(false)

		props.dateInput.disabled = true
		flushSync()

		expect(node('.so-date-input__clear').hasAttribute('disabled')).toBe(true)
	})

	it('своя кнопка — слот clear с командой очистки в scope, без clearable', async () => {
		await render({
			value: '2026-05-12',
			clear: createRawSnippet((scope: () => { clear: () => void }) => ({
				render: () => '<button class="so-test-clear"></button>',
				setup(button) {
					button.addEventListener('click', () => scope().clear())
				},
			})),
		})

		node('.so-test-clear').click()
		flushSync()

		expect(document.querySelector('.so-date-input__trailing > .so-test-clear')).not.toBeNull()
		expect(document.querySelector('.so-date-input__clear')).toBeNull()
		expect(
			nodes('.so-date-input__segment').every(
				(part) => part.dataset['placeholder'] === 'true',
			),
		).toBe(true)
	})
})
