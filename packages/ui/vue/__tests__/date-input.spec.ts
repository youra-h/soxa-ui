/**
 * DateInput во Vue — проводка на настоящей разметке.
 *
 * Модель — набор, вставка, формат локали — проверяет ядро, клавиши и буфер
 * обмена — тест плагинов, протяжку мышью, выделение и настоящий буфер — браузер
 * (`playground/vue/browser/date-input.spec.ts`). Здесь важно, что выходы ядра
 * доезжают туда, куда должны: части и разделители — в ряд в порядке формата,
 * наборы части — на её узел, `dir` и `lang` — на ряд, значение — в скрытое
 * поле, а клавиши на настоящей разметке доходят до модели и возвращаются
 * `v-model`.
 *
 * Язык поля — тег локали поддерева (`LocaleProvider`), своего у поля нет:
 * здесь он русский, а тест на другом языке задаёт свою локаль провайдеру.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref, type VNode } from 'vue'
import { DateInput, LocaleProvider } from '@soxa-ui/vue'
import type { IDateInput, TTimePrecision } from '@soxa-ui/core'
import { arEG, enUS, ruRU } from '@soxa-ui/plugins'
import type { TLocale } from '@soxa-ui/plugins'

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

let wrapper: ReturnType<typeof mount> | null = null

/** Локаль провайдера, в котором монтируется поле: по умолчанию русская. */
const locale = ref<TLocale>(ruRU)

beforeEach(() => {
	locale.value = ruRU
})

afterEach(() => {
	wrapper?.unmount()
	wrapper = null
	document.body.innerHTML = ''
})

/** Смонтировать и дождаться кадра: корень плагины получают через `requestAnimationFrame`. */
async function render(content: () => VNode): Promise<void> {
	wrapper = mount(
		defineComponent({ render: () => h(LocaleProvider, { locale: locale.value }, content) }),
		{ attachTo: document.body },
	)

	await nextTick()
	await nextFrame()
}

/** Узел по селектору; нет его — тест падает здесь, а не на чтении свойства. */
function find(selector: string): HTMLElement {
	const element = document.querySelector(selector)

	if (!(element instanceof HTMLElement)) throw new Error(`${selector}: HTML-узла нет`)

	return element
}

function findAll(selector: string): HTMLElement[] {
	return [...document.querySelectorAll(selector)].filter(
		(node): node is HTMLElement => node instanceof HTMLElement,
	)
}

/** Часть по типу. */
const segment = (type: string) => find(`.so-date-input__segment[data-type="${type}"]`)

/** Узлы ряда по порядку: класс и текст. */
const rowContent = () =>
	[...find('.so-date-input__segments').children].map((node) => [node.className, node.textContent])

/** Нажатие клавиши с узла, как у пользователя: событие всплывает до корня. */
function press(from: Element, key: string): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

	from.dispatchEvent(event)

	return event
}

/** Набрать строку с узла под фокусом документа. */
async function type(keys: string): Promise<void> {
	for (const key of keys) {
		const active = document.activeElement

		if (!active) throw new Error('фокуса нет')

		press(active, key)
		await nextTick()
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
	const [date, time] = dateTime.split('T')
	const [year, month, day] = date.split('-').map(Number)
	const [hour, minute, second = 0] = time.split(':').map(Number)
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
	const [year, month, day] = date.split('-').map(Number)
	const formatter = new Intl.DateTimeFormat([locale, 'en-US'], {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		calendar: 'gregory',
		timeZone: 'UTC',
	})

	return formatter.formatToParts(Date.UTC(year, month - 1, day)).map(({ value }) => value)
}

describe('разметка', () => {
	it('ru: корень — группа, в ряду части и разделители в порядке формата', async () => {
		await render(() => h(DateInput, { aria_label: 'Дата рождения' }))

		const root = find('.so-date-input')

		expect(root.getAttribute('role')).toBe('group')
		expect(root.getAttribute('aria-label')).toBe('Дата рождения')
		expect(root.dataset.invalid).toBeUndefined()
		expect(rowContent()).toEqual([
			['so-date-input__segment', 'дд'],
			['so-date-input__literal', '.'],
			['so-date-input__segment', 'мм'],
			['so-date-input__literal', '.'],
			['so-date-input__segment', 'гггг'],
		])
		expect(find('.so-date-input__segments').getAttribute('dir')).toBe('ltr')
		expect(find('.so-date-input__segments').getAttribute('lang')).toBe('ru-RU')
	})

	it('часть — spinbutton со своей остановкой Tab, разделитель скрыт от скринридера', async () => {
		await render(() => h(DateInput, { value: '2026-05-12' }))

		const day = segment('day')

		expect(day.getAttribute('role')).toBe('spinbutton')
		expect(day.getAttribute('tabindex')).toBe('0')
		expect(day.getAttribute('aria-valuenow')).toBe('12')
		expect(day.getAttribute('aria-label')).toBe(
			new Intl.DisplayNames(['ru-RU', 'en-US'], { type: 'dateTimeField' }).of('day'),
		)
		expect(day.dataset.placeholder).toBe('false')
		expect(
			findAll('.so-date-input__literal').every(
				(node) => node.getAttribute('aria-hidden') === 'true',
			),
		).toBe(true)
		// Ни `contenteditable`, ни `inputmode`: часть нередактируемая
		expect(day.hasAttribute('contenteditable')).toBe(false)
		expect(day.hasAttribute('inputmode')).toBe(false)
	})

	it('ar-EG: ряд справа налево, цифры арабские, разделители с метками направления', async () => {
		locale.value = arEG

		await render(() => h(DateInput, { value: '2026-05-12' }))

		expect(find('.so-date-input__segments').getAttribute('dir')).toBe('rtl')
		expect(rowContent().map(([, text]) => text)).toEqual(formatted('ar-EG', '2026-05-12'))
	})

	it('выключенное поле — частей вне порядка Tab, скрытое поле выключено', async () => {
		await render(() => h(DateInput, { disabled: true, name: 'birthday', value: '2026-05-12' }))

		expect(findAll('.so-date-input__segment[tabindex]')).toEqual([])
		expect(find('.so-date-input').dataset.disabled).toBe('true')
		expect(find('input[type="hidden"]').hasAttribute('disabled')).toBe(true)
	})

	it('дата вне min/max — data-invalid у корня и aria-invalid у частей', async () => {
		await render(() => h(DateInput, { value: '2026-05-12', max: '2026-01-01' }))

		expect(find('.so-date-input').dataset.invalid).toBe('true')
		expect(segment('year').getAttribute('aria-invalid')).toBe('true')
	})
})

describe('скрытое поле формы', () => {
	it('имя и значение — дата строкой; недописанная дата — пусто', async () => {
		await render(() => h(DateInput, { name: 'birthday', value: '2026-05-12' }))

		const hidden = find('input[type="hidden"]')

		expect(hidden.getAttribute('name')).toBe('birthday')
		expect(hidden).toHaveProperty('value', '2026-05-12')

		segment('day').focus()
		press(segment('day'), 'Delete')
		await nextTick()

		expect(hidden).toHaveProperty('value', '')
	})
})

describe('v-model', () => {
	it('набор с клавиатуры возвращает дату через update:value', async () => {
		const date = ref<string | undefined>()

		await render(() =>
			h(DateInput, {
				value: date.value,
				'onUpdate:value': (value: string | undefined) => {
					date.value = value
				},
			}),
		)

		segment('day').focus()
		await type('12052026')

		expect(date.value).toBe('2026-05-12')
		expect(rowContent().map(([, text]) => text)).toEqual(['12', '.', '05', '.', '2026'])
		expect(document.activeElement).toBe(segment('year'))
	})

	it('значение снаружи — части из него', async () => {
		const date = ref<string | undefined>('2026-05-12')

		await render(() => h(DateInput, { value: date.value }))

		date.value = '2027-01-02'
		await nextTick()

		expect(rowContent().map(([, text]) => text)).toEqual(['02', '.', '01', '.', '2027'])
	})
})

/**
 * Ноль, с которого день не начинается, числа не даёт, но виден в части, пока
 * фокус на ней. Ряд перечитывается по `change:segments` ядра, а не по смене
 * фокуса: ушёл фокус с нулей — ядро само сообщает, что их сменила подсказка.
 */
describe('набранный ноль', () => {
	it('клавиша «0» на дне — в части «0»; фокус ушёл на месяц — у дня снова подсказка', async () => {
		await render(() => h(DateInput))

		segment('day').focus()
		await type('0')

		expect(segment('day').textContent).toBe('0')
		expect(segment('day').dataset.placeholder).toBe('false')
		expect(segment('day').getAttribute('aria-valuetext')).toBe('0')
		expect(segment('day').hasAttribute('aria-valuenow')).toBe(false)
		expect(document.activeElement).toBe(segment('day'))

		segment('month').focus()
		await nextTick()

		expect(segment('day').textContent).toBe('дд')
		expect(segment('day').dataset.placeholder).toBe('true')
	})

	it('«00» на дне без validate — день 00, фокус уходит на месяц', async () => {
		await render(() => h(DateInput))

		segment('day').focus()
		await type('0')
		await type('0')

		expect(segment('day').textContent).toBe('00')
		expect(document.activeElement).toBe(segment('month'))
	})

	it('«00» на дне с validate — фокус стоит, часть ждёт цифры', async () => {
		await render(() => h(DateInput, { validate: true }))

		segment('day').focus()
		await type('0')
		await type('0')

		expect(segment('day').textContent).toBe('00')
		expect(document.activeElement).toBe(segment('day'))
	})
})

describe('время', () => {
	it('en-US: час, минута и период суток — в ряду в порядке формата, значение — в скрытом поле', async () => {
		locale.value = enUS

		await render(() =>
			h(DateInput, {
				kind: 'datetime',
				name: 'meeting',
				value: '2026-05-12T14:30',
			}),
		)

		const parts = formattedTime('en-US', '2026-05-12T14:30')

		expect(rowContent().map(([, text]) => text)).toEqual(parts.map(({ value }) => value))
		expect(findAll('.so-date-input__segment').map((node) => node.dataset.type)).toEqual([
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
		expect(find('input[type="hidden"]')).toHaveProperty('value', '2026-05-12T14:30')
	})

	it('ru: 24 часа, периода суток нет; пустое время — черта', async () => {
		await render(() => h(DateInput, { kind: 'datetime' }))

		expect(rowContent().map(([, text]) => text)).toEqual([
			'дд',
			'.',
			'мм',
			'.',
			'гггг',
			', ',
			'––',
			':',
			'––',
		])
		expect(document.querySelector('[data-type="dayPeriod"]')).toBeNull()
	})

	it('набор времени с клавиатуры возвращает дату со временем через update:value', async () => {
		const date = ref<string | undefined>()

		await render(() =>
			h(DateInput, {
				kind: 'datetime',
				value: date.value,
				'onUpdate:value': (value: string | undefined) => {
					date.value = value
				},
			}),
		)

		segment('day').focus()
		await type('120520261430')

		expect(date.value).toBe('2026-05-12T14:30')
		expect(document.activeElement).toBe(segment('minute'))
	})

	it('смена вида: части времени появляются, значение — в новом виде', async () => {
		const date = ref<string | undefined>('2026-05-12T14:30')
		const kind = ref<'date' | 'datetime'>('datetime')

		await render(() =>
			h(DateInput, {
				kind: kind.value,
				value: date.value,
				'onUpdate:value': (value: string | undefined) => {
					date.value = value
				},
			}),
		)

		kind.value = 'date'
		await nextTick()

		expect(date.value).toBe('2026-05-12')
		expect(rowContent().map(([, text]) => text)).toEqual(['12', '.', '05', '.', '2026'])

		// Время осталось в частях и вернулось
		kind.value = 'datetime'
		await nextTick()

		expect(date.value).toBe('2026-05-12T14:30')
		expect(segment('minute').textContent).toBe('30')
	})

	it('до секунды: секунда в ряду за минутой, значение — в скрытом поле', async () => {
		locale.value = enUS

		await render(() =>
			h(DateInput, {
				kind: 'datetime',
				timePrecision: 'second',
				name: 'meeting',
				value: '2026-05-12T14:30:15',
			}),
		)

		const parts = formattedTime('en-US', '2026-05-12T14:30:15', 'second')

		expect(rowContent().map(([, text]) => text)).toEqual(parts.map(({ value }) => value))
		expect(findAll('.so-date-input__segment').map((node) => node.dataset.type)).toEqual([
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
		expect(find('input[type="hidden"]')).toHaveProperty('value', '2026-05-12T14:30:15')
	})

	it('набор секунды с клавиатуры возвращает время до секунды через update:value', async () => {
		const date = ref<string | undefined>()

		await render(() =>
			h(DateInput, {
				kind: 'datetime',
				timePrecision: 'second',
				value: date.value,
				'onUpdate:value': (value: string | undefined) => {
					date.value = value
				},
			}),
		)

		segment('day').focus()
		await type('120520261430')

		expect(document.activeElement).toBe(segment('second'))
		expect(date.value).toBeUndefined()

		await type('15')

		expect(date.value).toBe('2026-05-12T14:30:15')
	})

	it('смена точности: секунда появляется и пропадает, значение — в новой точности', async () => {
		const date = ref<string | undefined>('2026-05-12T14:30:15')
		const timePrecision = ref<TTimePrecision>('minute')
		const updates: Array<string | undefined> = []

		await render(() =>
			h(DateInput, {
				kind: 'datetime',
				timePrecision: timePrecision.value,
				value: date.value,
				'onUpdate:value': (value: string | undefined) => {
					updates.push(value)
					date.value = value
				},
			}),
		)

		const minute = segment('minute')

		expect(document.querySelector('[data-type="second"]')).toBeNull()

		// Секунда записанного значения была скрыта в частях: значение то же, а
		// ряд перечитывается по смене точности
		timePrecision.value = 'second'
		await nextTick()

		expect(updates).toEqual([])
		expect(segment('second').textContent).toBe('15')
		// Узел минуты тот же: часть ключуется типом
		expect(segment('minute')).toBe(minute)

		timePrecision.value = 'minute'
		await nextTick()

		expect(date.value).toBe('2026-05-12T14:30')
		expect(document.querySelector('[data-type="second"]')).toBeNull()

		// Секунда осталась в частях и вернулась
		timePrecision.value = 'second'
		await nextTick()

		expect(date.value).toBe('2026-05-12T14:30:15')
		expect(segment('second').textContent).toBe('15')
	})
})

describe('смена локали поддерева', () => {
	it('часть меняет место, а её узел остаётся тем же', async () => {
		await render(() => h(DateInput, { value: '2026-05-12' }))

		const day = segment('day')

		locale.value = enUS
		await nextTick()

		expect(segment('day')).toBe(day)
		expect(rowContent().map(([, text]) => text)).toEqual(formatted('en-US', '2026-05-12'))
	})
})

describe('сенсорный режим', () => {
	/** Нажатие указателем по узлу, как его шлёт браузер. */
	const pointerDown = (from: Element, pointerType: string): void => {
		from.dispatchEvent(new PointerEvent('pointerdown', { pointerType, bubbles: true }))
	}

	it('касание делает части редактируемыми, нажатие мышью — снова нет', async () => {
		await render(() => h(DateInput, { value: '2026-05-12' }))

		pointerDown(segment('month'), 'touch')
		await nextTick()

		expect(
			findAll('.so-date-input__segment').map((part) => [
				part.getAttribute('contenteditable'),
				part.getAttribute('inputmode'),
			]),
		).toEqual([
			['true', 'numeric'],
			['true', 'numeric'],
			['true', 'numeric'],
		])
		// Узел и текст части — те же: перерисовались только атрибуты
		expect(segment('month').textContent).toBe('05')

		pointerDown(segment('month'), 'mouse')
		await nextTick()

		expect(findAll('.so-date-input__segment[contenteditable]')).toEqual([])
		expect(findAll('.so-date-input__segment[inputmode]')).toEqual([])
	})

	it('ввод экранной клавиатуры возвращает дату через update:value', async () => {
		const date = ref<string | undefined>()

		await render(() =>
			h(DateInput, {
				value: date.value,
				'onUpdate:value': (value: string | undefined) => {
					date.value = value
				},
			}),
		)

		pointerDown(segment('day'), 'touch')
		await nextTick()
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
			expect(event.defaultPrevented).toBe(true)
			await nextTick()
		}

		expect(date.value).toBe('2026-05-12')
		expect(rowContent().map(([, text]) => text)).toEqual(['12', '.', '05', '.', '2026'])
	})

	it('у каждой части свой id — от монтирования и типа части', async () => {
		await render(() => h(DateInput))

		const parts = findAll('.so-date-input__segment')

		expect(parts.every((part) => part.id.endsWith(`-${part.dataset.type}`))).toBe(true)
		expect(new Set(parts.map((part) => part.id)).size).toBe(3)
	})
})

describe('слоты', () => {
	it('leading и trailing получают инстанс поля; без слота обёртки нет', async () => {
		const seen: IDateInput[] = []

		await render(() =>
			h(DateInput, null, {
				trailing: ({ ctrl }: { ctrl: IDateInput }) => {
					seen.push(ctrl)

					return h('button', { class: 'so-test-calendar' }, 'Календарь')
				},
			}),
		)

		expect(find('.so-date-input__trailing').querySelector('.so-test-calendar')).not.toBeNull()
		expect(document.querySelector('.so-date-input__leading')).toBeNull()
		expect(seen[0]?.locale).toBe('ru-RU')
	})

	it('клавиши кнопки в слоте — не поля', async () => {
		await render(() =>
			h(
				DateInput,
				{ value: '2026-05-12' },
				{ trailing: () => h('button', { class: 'so-test-calendar' }, 'Календарь') },
			),
		)

		expect(press(find('.so-test-calendar'), 'ArrowUp').defaultPrevented).toBe(false)
	})
})

/**
 * Кнопка очистки — та же, что у Input: часть поля (`ClearableDescriptor`). Что
 * очистка делает с частями, проверяет ядро (`core/__tests__/date-input.spec.ts`),
 * форму кнопки — браузерный прогон.
 */
describe('кнопка очистки', () => {
	it('без clearable кнопки нет, и обёртки без слотов тоже', async () => {
		await render(() => h(DateInput, { value: '2026-05-12' }))

		expect(document.querySelector('.so-date-input__clear')).toBeNull()
		expect(document.querySelector('.so-date-input__trailing')).toBeNull()
	})

	it('по clearable — первой в обёртке у конца, перед кнопкой календаря', async () => {
		await render(() =>
			h(
				DateInput,
				{ clearable: true, name: 'Дата' },
				{ trailing: () => h('button', { class: 'so-test-calendar' }, 'Календарь') },
			),
		)

		const parts = ['.so-date-input__clear', '.so-test-calendar']

		expect(
			[...find('.so-date-input__trailing').children].map((node) =>
				parts.find((part) => node.matches(part)),
			),
		).toEqual(parts)
		expect(find('.so-date-input__clear').getAttribute('aria-label')).toBe('Очистить Дата')
	})

	it('клик очищает все части и значение, до корня не всплывает', async () => {
		const date = ref<string | undefined>('2026-05-12')
		const rootClick = vi.fn()

		await render(() =>
			h(DateInput, {
				clearable: true,
				value: date.value,
				'onUpdate:value': (value: string | undefined) => {
					date.value = value
				},
				onClick: rootClick,
			}),
		)

		find('.so-date-input__clear').click()
		await nextTick()

		expect(date.value).toBeUndefined()
		expect(findAll('.so-date-input__segment').map((part) => part.dataset.placeholder)).toEqual([
			'true',
			'true',
			'true',
		])
		expect(find('input[type="hidden"]')).toHaveProperty('value', '')
		expect(rootClick).not.toHaveBeenCalled()
	})

	it('выключена вместе с полем, readonly её не гасит', async () => {
		const disabled = ref(false)

		await render(() =>
			h(DateInput, {
				clearable: true,
				readonly: true,
				disabled: disabled.value,
				value: '2026-05-12',
			}),
		)

		expect(find('.so-date-input__clear').hasAttribute('disabled')).toBe(false)

		disabled.value = true
		await nextTick()

		expect(find('.so-date-input__clear').hasAttribute('disabled')).toBe(true)
	})

	it('своя кнопка — слот clear с командой очистки в scope, без clearable', async () => {
		await render(() =>
			h(
				DateInput,
				{ value: '2026-05-12' },
				{
					clear: ({ clear }: { clear: () => void }) =>
						h('button', { class: 'so-test-clear', onClick: () => clear() }),
				},
			),
		)

		find('.so-test-clear').click()
		await nextTick()

		expect(find('.so-date-input__trailing > .so-test-clear')).toBeTruthy()
		expect(document.querySelector('.so-date-input__clear')).toBeNull()
		expect(
			findAll('.so-date-input__segment').every((part) => part.dataset.placeholder === 'true'),
		).toBe(true)
	})
})
