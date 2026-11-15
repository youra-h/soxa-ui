/**
 * `<div is="so-date-input">` — поле даты из частей, чьё значение ведёт ядро.
 *
 * Сценарии — те же, что у Vue (`date-input.spec.ts`), React и Solid, без
 * сервера и `act`. Модель — набор, вставка, формат локали — проверяет ядро,
 * клавиши и буфер обмена — тест плагинов, протяжку мышью, выделение и
 * настоящий буфер — браузер (`playground/vue/browser/date-input.spec.ts`).
 * Здесь важно, что выходы ядра доезжают туда, куда должны: части и разделители
 * — в ряд в порядке формата, наборы части — на её узел, `dir` и `lang` — на
 * ряд, значение — в скрытое поле, а клавиши на настоящей разметке доходят до
 * модели и возвращаются `so:change:value`.
 *
 * Угол зрения здесь свой. Корень — элемент потребителя, и поля под атрибуты
 * разметки у него нет: они остаются на корне, как у Vue. Части — петля по
 * ключу: при наборе и при смене локали часть меняет текст и место, а узел
 * остаётся тем же, и текст в него пишется, только когда разошёлся с узлом.
 * Scope у слотов нет: команды поля содержимое слота берёт у элемента
 * (`el.ctrl`).
 *
 * Язык поля — тег локали поддерева (`<so-locale-provider>`), своего у поля нет:
 * здесь он русский, а тест на другом языке задаёт свою локаль провайдеру.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { TDateInput, type TTimePrecision, type TValuePayload } from '@soxa-ui/core'
import { arEG, enUS, ruRU, type TLocale } from '@soxa-ui/plugins'
import { DateInputDescriptor } from '@soxa-ui/setup'
import {
	TButtonElement,
	TDateInputElement,
	TIconElement,
	TLocaleProviderElement,
	type TButtonElementProps,
	type TDateInputElementProps,
} from '@soxa-ui/webc'
import { dateInputTemplate } from '../src/components/date-input/date-input.template'
import { bareContext } from './template-context'

/** Рендер коалесцируется в микротаске — ждём её перед проверкой. */
const flush = () => new Promise<void>((resolve) => queueMicrotask(() => resolve()))

/** `TElementPlugin` объявляет узел через кадр — после него встают слушатели плагинов. */
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

afterEach(() => {
	vi.restoreAllMocks()
	document.body.innerHTML = ''
})

/** Значение поля даты: строка или пусто. */
type TValue = string | undefined

function isDateInput(node: Element | null): node is TDateInputElementProps {
	return node instanceof TDateInputElement
}

function isButton(node: Element | null): node is TButtonElementProps {
	return node instanceof TButtonElement
}

/** Поле soxa в разметке. */
function dateInputOf(root: ParentNode): TDateInputElementProps {
	const node = root.querySelector('[is="so-date-input"]')

	if (!isDateInput(node)) throw new Error('<div is="so-date-input"> нет')

	return node
}

/**
 * Поле из разметки в провайдере локали `locale` (по умолчанию русской),
 * подключённое к документу, и кадр: корень плагины получают через
 * `requestAnimationFrame`. `prepare` — до вставки: слушатели, `ctrl`.
 */
async function mount(
	html: string,
	locale: TLocale = ruRU,
	prepare: (el: TDateInputElementProps) => void = () => {},
): Promise<TDateInputElementProps> {
	const host = document.createElement('div')

	host.innerHTML = `<so-locale-provider>${html}</so-locale-provider>`

	const provider = host.firstElementChild

	if (!(provider instanceof TLocaleProviderElement)) throw new Error('провайдера нет')

	provider.locale = locale

	const el = dateInputOf(host)

	prepare(el)
	document.body.appendChild(host)
	await flush()
	await nextFrame()

	return el
}

/**
 * Поле, чьё значение возвращает потребитель, — как `v-model` у Vue: на каждую
 * смену он пишет значение обратно в свойство элемента.
 */
async function mountModel(html: string, locale: TLocale = ruRU): Promise<TDateInputElementProps> {
	return mount(html, locale, (el) => {
		el.addEventListener('so:change:value', (event) => {
			if (event instanceof CustomEvent) el.value = payloadOf(event.detail).newValue
		})
	})
}

/** Пара «стало, было» события значения — вид проверяется здесь, а не берётся на веру. */
function payloadOf(detail: unknown): TValuePayload<TValue> {
	if (typeof detail !== 'object' || detail === null || !('newValue' in detail)) {
		throw new Error('у события нет пары значений')
	}

	const value = (item: unknown): TValue => (typeof item === 'string' ? item : undefined)
	const oldValue = 'oldValue' in detail ? detail.oldValue : undefined

	return { newValue: value(detail.newValue), oldValue: value(oldValue) }
}

/** Узел по селектору; нет его или он не того вида — тест падает здесь. */
function find<T extends Element>(root: ParentNode, selector: string, type: new () => T): T {
	const node = root.querySelector(selector)

	if (!(node instanceof type)) throw new Error(`${selector}: узла нет`)

	return node
}

function findAll(selector: string): HTMLElement[] {
	return [...document.querySelectorAll(selector)].filter(
		(node): node is HTMLElement => node instanceof HTMLElement,
	)
}

/** Часть по типу. */
const segment = (type: string) =>
	find(document, `.so-date-input__segment[data-type="${type}"]`, HTMLElement)

/** Узлы ряда по порядку: класс и текст. */
const rowContent = () =>
	[...find(document, '.so-date-input__segments', HTMLElement).children].map((node) => [
		node.className,
		node.textContent,
	])

/** Тексты ряда по порядку. */
const rowTexts = () => rowContent().map(([, text]) => text)

const hidden = (root: ParentNode = document) => find(root, 'input[type="hidden"]', HTMLInputElement)

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
		await flush()
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
		const el = await mount('<div is="so-date-input" aria_label="Дата рождения"></div>')

		expect(el).toBeInstanceOf(HTMLDivElement)
		expect(el.ctrl?.tag).toBe('div')
		expect(el.classList.contains('so-date-input')).toBe(true)
		expect(el.getAttribute('role')).toBe('group')
		expect(el.getAttribute('aria-label')).toBe('Дата рождения')
		expect(el.dataset['invalid']).toBeUndefined()
		expect(rowContent()).toEqual([
			['so-date-input__segment', 'дд'],
			['so-date-input__literal', '.'],
			['so-date-input__segment', 'мм'],
			['so-date-input__literal', '.'],
			['so-date-input__segment', 'гггг'],
		])
		expect(find(el, '.so-date-input__segments', HTMLElement).getAttribute('dir')).toBe('ltr')
		expect(find(el, '.so-date-input__segments', HTMLElement).getAttribute('lang')).toBe('ru-RU')
	})

	it('часть — spinbutton со своей остановкой Tab, разделитель скрыт от скринридера', async () => {
		await mount('<div is="so-date-input" value="2026-05-12"></div>')

		const day = segment('day')

		expect(day.getAttribute('role')).toBe('spinbutton')
		expect(day.getAttribute('tabindex')).toBe('0')
		expect(day.getAttribute('aria-valuenow')).toBe('12')
		expect(day.getAttribute('aria-label')).toBe(
			new Intl.DisplayNames(['ru-RU', 'en-US'], { type: 'dateTimeField' }).of('day'),
		)
		expect(day.dataset['placeholder']).toBe('false')
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
		await mount('<div is="so-date-input" value="2026-05-12"></div>', arEG)

		expect(find(document, '.so-date-input__segments', HTMLElement).getAttribute('dir')).toBe(
			'rtl',
		)
		expect(rowTexts()).toEqual(formatted('ar-EG', '2026-05-12'))
	})

	it('выключенное поле — частей вне порядка Tab, скрытое поле выключено', async () => {
		const el = await mount(
			'<div is="so-date-input" disabled name="birthday" value="2026-05-12"></div>',
		)

		expect(findAll('.so-date-input__segment[tabindex]')).toEqual([])
		expect(el.dataset['disabled']).toBe('true')
		expect(hidden(el).disabled).toBe(true)
	})

	it('дата вне min/max — data-invalid у корня и aria-invalid у частей', async () => {
		const el = await mount('<div is="so-date-input" value="2026-05-12" max="2026-01-01"></div>')

		expect(el.dataset['invalid']).toBe('true')
		expect(segment('year').getAttribute('aria-invalid')).toBe('true')
	})

	it('порядок узлов — как у Vue: слоты, ряд частей, обёртка у конца, скрытое поле', async () => {
		const el = await mount(`<div is="so-date-input" clearable>
			<i slot="leading">★</i>
		</div>`)

		expect(
			[...el.children].map((node) =>
				node.localName === 'input' ? `input.${node.getAttribute('type')}` : node.className,
			),
		).toEqual([
			'so-date-input__leading',
			'so-date-input__segments',
			'so-date-input__trailing',
			'input.hidden',
		])
	})

	it('шаблон объявляет ровно те слоты, что и дескриптор, в порядке разметки Vue', () => {
		const root = document.createElement('div')
		const targets = dateInputTemplate.create(root, bareContext(root)).slots

		expect(Object.keys(targets)).toEqual(DateInputDescriptor().slots.map((slot) => slot.name))
		expect(Object.keys(targets)).toEqual(['leading', 'clear', 'trailing'])
	})
})

/**
 * Поля под атрибуты разметки у DateInput нет: группа частей — сам корень, и
 * атрибуты потребителя остаются на нём, как у Vue.
 */
describe('DateInput · атрибуты разметки', () => {
	it('класс, стиль, id, aria-label и data-* — на корне', async () => {
		const el = await mount(
			'<div is="so-date-input" id="birthday" class="mine" style="width: 200px" aria-label="Своё" data-probe="1"></div>',
		)

		expect(el.id).toBe('birthday')
		expect(el.state).toMatchObject({ id: 'birthday' })
		expect(el.classList.contains('mine')).toBe(true)
		expect(el.style.width).toBe('200px')
		expect(el.getAttribute('aria-label')).toBe('Своё')
		expect(el.dataset['probe']).toBe('1')
		expect(el.querySelector('.so-date-input__segments [aria-label="Своё"]')).toBeNull()
	})

	/**
	 * У DateInput `id` — наблюдаемый атрибут корня: записанный из кода, он
	 * уходит в проп `id` (`TIdPlugin`), и шаблон держит на корне то же, как
	 * `:id` у Vue.
	 */
	it('id из кода — проп id, на корне; снятый — снят', async () => {
		const el = await mount('<div is="so-date-input"></div>')

		el.id = 'meeting'
		await flush()

		expect(el.id).toBe('meeting')
		expect(el.state).toMatchObject({ id: 'meeting' })

		el.removeAttribute('id')
		await flush()

		expect(el.hasAttribute('id')).toBe(false)
		expect(el.state).toMatchObject({ id: undefined })
	})

	/**
	 * Пустой `id` снимает проп, как у поля: `el.id = undefined` записал бы
	 * строку "undefined", и снять `id` из кода иначе, чем пустым, нельзя.
	 */
	it('пустой id — снят: из кода и из разметки', async () => {
		const el = await mount('<div is="so-date-input" id="meeting"></div>')

		el.id = ''
		await flush()

		expect(el.state).toMatchObject({ id: undefined })
		expect(el.hasAttribute('id')).toBe(false)

		const empty = await mount('<div is="so-date-input" id=""></div>')

		expect(empty.state).toMatchObject({ id: undefined })
	})
})

describe('DateInput · скрытое поле формы', () => {
	it('имя и значение — дата строкой; недописанная дата — пусто', async () => {
		const el = await mount('<div is="so-date-input" name="birthday" value="2026-05-12"></div>')

		expect(hidden(el).name).toBe('birthday')
		expect(hidden(el).value).toBe('2026-05-12')

		segment('day').focus()
		press(segment('day'), 'Delete')
		await flush()

		expect(hidden(el).value).toBe('')
	})

	/** Форма видит поле сама: скрытое поле лежит в обычном DOM страницы. */
	it('FormData получает дату строкой', async () => {
		await mount(
			`<form><div is="so-date-input" name="birthday" value="2026-05-12"></div></form>`,
		)

		expect([...new FormData(find(document, 'form', HTMLFormElement))]).toEqual([
			['birthday', '2026-05-12'],
		])
	})
})

describe('DateInput · значение', () => {
	it('набор с клавиатуры возвращает дату через so:change:value', async () => {
		const el = await mountModel('<div is="so-date-input"></div>')

		segment('day').focus()
		await type('12052026')

		expect(el.value).toBe('2026-05-12')
		expect(rowTexts()).toEqual(['12', '.', '05', '.', '2026'])
		expect(document.activeElement).toBe(segment('year'))
	})

	it('значение снаружи — части из него', async () => {
		const el = await mount('<div is="so-date-input" value="2026-05-12"></div>')

		el.value = '2027-01-02'
		await flush()

		expect(rowTexts()).toEqual(['02', '.', '01', '.', '2027'])
	})

	it('внешний ctrl: части и значение — его', async () => {
		const ctrl = new TDateInput({ value: '2026-05-12' })

		await mount('<div is="so-date-input"></div>', ruRU, (el) => {
			el.ctrl = ctrl
		})

		expect(rowTexts()).toEqual(['12', '.', '05', '.', '2026'])

		ctrl.value = '2027-01-02'
		await flush()

		expect(rowTexts()).toEqual(['02', '.', '01', '.', '2027'])
	})
})

/**
 * Ноль, с которого день не начинается, числа не даёт, но виден в части, пока
 * фокус на ней. Ряд перечитывается по `change:segments` ядра, а не по смене
 * фокуса: ушёл фокус с нулей — ядро само сообщает, что их сменила подсказка.
 */
describe('DateInput · набранный ноль', () => {
	it('клавиша «0» на дне — в части «0»; фокус ушёл на месяц — у дня снова подсказка', async () => {
		await mount('<div is="so-date-input"></div>')

		segment('day').focus()
		await type('0')

		expect(segment('day').textContent).toBe('0')
		expect(segment('day').dataset['placeholder']).toBe('false')
		expect(segment('day').getAttribute('aria-valuetext')).toBe('0')
		expect(segment('day').hasAttribute('aria-valuenow')).toBe(false)
		expect(document.activeElement).toBe(segment('day'))

		segment('month').focus()
		await flush()

		expect(segment('day').textContent).toBe('дд')
		expect(segment('day').dataset['placeholder']).toBe('true')
	})

	it('«00» на дне без validate — день 00, фокус уходит на месяц', async () => {
		await mount('<div is="so-date-input"></div>')

		segment('day').focus()
		await type('00')

		expect(segment('day').textContent).toBe('00')
		expect(document.activeElement).toBe(segment('month'))
	})

	it('«00» на дне с validate — фокус стоит, часть ждёт цифры', async () => {
		await mount('<div is="so-date-input" validate></div>')

		segment('day').focus()
		await type('00')

		expect(segment('day').textContent).toBe('00')
		expect(document.activeElement).toBe(segment('day'))
	})
})

describe('DateInput · время', () => {
	it('en-US: час, минута и период суток — в ряду в порядке формата, значение — в скрытом поле', async () => {
		const el = await mount(
			'<div is="so-date-input" kind="datetime" name="meeting" value="2026-05-12T14:30"></div>',
			enUS,
		)

		const parts = formattedTime('en-US', '2026-05-12T14:30')

		expect(rowTexts()).toEqual(parts.map(({ value }) => value))
		expect(findAll('.so-date-input__segment').map((node) => node.dataset['type'])).toEqual([
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
		expect(hidden(el).value).toBe('2026-05-12T14:30')
	})

	it('ru: 24 часа, периода суток нет; пустое время — черта', async () => {
		await mount('<div is="so-date-input" kind="datetime"></div>')

		expect(rowTexts()).toEqual(['дд', '.', 'мм', '.', 'гггг', ', ', '––', ':', '––'])
		expect(document.querySelector('[data-type="dayPeriod"]')).toBeNull()
	})

	it('набор времени с клавиатуры возвращает дату со временем через so:change:value', async () => {
		const el = await mountModel('<div is="so-date-input" kind="datetime"></div>')

		segment('day').focus()
		await type('120520261430')

		expect(el.value).toBe('2026-05-12T14:30')
		expect(document.activeElement).toBe(segment('minute'))
	})

	it('смена вида: части времени появляются, значение — в новом виде', async () => {
		const el = await mountModel(
			'<div is="so-date-input" kind="datetime" value="2026-05-12T14:30"></div>',
		)

		el.kind = 'date'
		await flush()

		expect(el.value).toBe('2026-05-12')
		expect(rowTexts()).toEqual(['12', '.', '05', '.', '2026'])

		// Время осталось в частях и вернулось
		el.kind = 'datetime'
		await flush()

		expect(el.value).toBe('2026-05-12T14:30')
		expect(segment('minute').textContent).toBe('30')
	})

	it('до секунды: секунда в ряду за минутой, значение — в скрытом поле', async () => {
		const el = await mount(
			'<div is="so-date-input" kind="datetime" time-precision="second" name="meeting" value="2026-05-12T14:30:15"></div>',
			enUS,
		)

		const parts = formattedTime('en-US', '2026-05-12T14:30:15', 'second')

		expect(rowTexts()).toEqual(parts.map(({ value }) => value))
		expect(findAll('.so-date-input__segment').map((node) => node.dataset['type'])).toEqual([
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
		expect(hidden(el).value).toBe('2026-05-12T14:30:15')
	})

	it('набор секунды с клавиатуры возвращает время до секунды через so:change:value', async () => {
		const el = await mountModel(
			'<div is="so-date-input" kind="datetime" time-precision="second"></div>',
		)

		segment('day').focus()
		await type('120520261430')

		expect(document.activeElement).toBe(segment('second'))
		expect(el.value).toBeUndefined()

		await type('15')

		expect(el.value).toBe('2026-05-12T14:30:15')
	})

	it('смена точности: секунда появляется и пропадает, значение — в новой точности', async () => {
		const updates: TValue[] = []
		const el = await mount(
			'<div is="so-date-input" kind="datetime" value="2026-05-12T14:30:15"></div>',
			ruRU,
			(node) => {
				node.addEventListener('so:change:value', (event) => {
					if (!(event instanceof CustomEvent)) return

					const next = payloadOf(event.detail).newValue

					updates.push(next)
					node.value = next
				})
			},
		)

		const minute = segment('minute')

		expect(document.querySelector('[data-type="second"]')).toBeNull()

		// Секунда записанного значения была скрыта в частях: значение то же, а
		// ряд перечитывается по смене точности
		el.timePrecision = 'second'
		await flush()

		expect(updates).toEqual([])
		expect(segment('second').textContent).toBe('15')
		// Узел минуты тот же: часть ключуется типом
		expect(segment('minute')).toBe(minute)

		el.timePrecision = 'minute'
		await flush()

		expect(el.value).toBe('2026-05-12T14:30')
		expect(document.querySelector('[data-type="second"]')).toBeNull()

		// Секунда осталась в частях и вернулась
		el.timePrecision = 'second'
		await flush()

		expect(el.value).toBe('2026-05-12T14:30:15')
		expect(segment('second').textContent).toBe('15')
	})
})

describe('DateInput · смена локали поддерева', () => {
	it('часть меняет место, а её узел остаётся тем же', async () => {
		await mount('<div is="so-date-input" value="2026-05-12"></div>')

		const day = segment('day')
		const provider = document.querySelector('so-locale-provider')

		if (!(provider instanceof TLocaleProviderElement)) throw new Error('провайдера нет')

		provider.locale = enUS
		await flush()

		expect(segment('day')).toBe(day)
		expect(rowTexts()).toEqual(formatted('en-US', '2026-05-12'))
	})
})

describe('DateInput · сенсорный режим', () => {
	/** Нажатие указателем по узлу, как его шлёт браузер. */
	const pointerDown = (from: Element, pointerType: string): void => {
		from.dispatchEvent(new PointerEvent('pointerdown', { pointerType, bubbles: true }))
	}

	it('касание делает части редактируемыми, нажатие мышью — снова нет', async () => {
		await mount('<div is="so-date-input" value="2026-05-12"></div>')

		const month = segment('month')

		pointerDown(month, 'touch')
		await flush()

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
		expect(segment('month')).toBe(month)
		expect(month.textContent).toBe('05')

		pointerDown(month, 'mouse')
		await flush()

		expect(findAll('.so-date-input__segment[contenteditable]')).toEqual([])
		expect(findAll('.so-date-input__segment[inputmode]')).toEqual([])
	})

	it('ввод экранной клавиатуры возвращает дату через so:change:value', async () => {
		const el = await mountModel('<div is="so-date-input"></div>')

		pointerDown(segment('day'), 'touch')
		await flush()
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
			await flush()
		}

		expect(el.value).toBe('2026-05-12')
		expect(rowTexts()).toEqual(['12', '.', '05', '.', '2026'])
	})

	/**
	 * Часть, которую браузер на касании оставил пустой, получает текст ядра
	 * целиком: текст пишется, когда разошёлся с узлом.
	 */
	it('часть, опустошённая браузером, получает текст ядра обратно', async () => {
		const el = await mount('<div is="so-date-input" value="2026-05-12"></div>')

		segment('day').textContent = ''

		el.value = '2026-05-13'
		await flush()

		expect(segment('day').textContent).toBe('13')
		expect(segment('day').childNodes).toHaveLength(1)
	})

	it('у каждой части свой id — от монтирования и типа части', async () => {
		await mount('<div is="so-date-input"></div>')

		const parts = findAll('.so-date-input__segment')

		expect(parts.every((part) => part.id.endsWith(`-${part.dataset['type']}`))).toBe(true)
		expect(new Set(parts.map((part) => part.id)).size).toBe(3)
	})
})

describe('DateInput · слоты', () => {
	it('leading и trailing — по сторонам ряда; без слота обёртки нет', async () => {
		const el = await mount(`<div is="so-date-input">
			<button slot="trailing" class="so-test-calendar">Календарь</button>
		</div>`)

		expect(el.querySelector('.so-date-input__trailing > .so-test-calendar')).not.toBeNull()
		expect(el.querySelector('.so-date-input__leading')).toBeNull()
		// Данные поля содержимое берёт у элемента
		expect(el.ctrl?.locale).toBe('ru-RU')
	})

	it('клавиши кнопки в слоте — не поля', async () => {
		const el = await mount(`<div is="so-date-input" value="2026-05-12">
			<button slot="trailing" class="so-test-calendar">Календарь</button>
		</div>`)

		expect(
			press(find(el, '.so-test-calendar', HTMLButtonElement), 'ArrowUp').defaultPrevented,
		).toBe(false)
	})
})

/**
 * Кнопка очистки — та же, что у Input: часть поля (`ClearableDescriptor`). Что
 * очистка делает с частями, проверяет ядро (`core/__tests__/date-input.spec.ts`),
 * форму кнопки — браузерный прогон.
 */
describe('DateInput · кнопка очистки', () => {
	const clearButton = () => {
		const node = document.querySelector('.so-date-input__clear')

		if (!isButton(node)) throw new Error('кнопки очистки нет')

		return node
	}

	it('без clearable кнопки нет, и обёртки без слотов тоже', async () => {
		await mount('<div is="so-date-input" value="2026-05-12"></div>')

		expect(document.querySelector('.so-date-input__clear')).toBeNull()
		expect(document.querySelector('.so-date-input__trailing')).toBeNull()
	})

	it('по clearable — первой в обёртке у конца, перед trailing; деталь с иконкой', async () => {
		const el = await mount(`<div is="so-date-input" clearable name="Дата">
			<button slot="trailing" class="so-test-calendar">Календарь</button>
		</div>`)

		const parts = ['.so-date-input__clear', '.so-test-calendar']

		expect(
			[...find(el, '.so-date-input__trailing', HTMLElement).children].map((node) =>
				parts.find((part) => node.matches(part)),
			),
		).toEqual(parts)
		expect(clearButton().getAttribute('aria-label')).toBe('Очистить Дата')
		expect(clearButton().getAttribute('embedded')).toBe('date-input.clear')
		expect(clearButton().getAttribute('type')).toBe('button')

		const icon = clearButton().querySelector('.so-icon')

		expect(icon).toBeInstanceOf(TIconElement)
		expect(icon?.getAttribute('embedded')).toBe('date-input.clear-icon')
		expect(icon?.getAttribute('icon')).toBe('close')
	})

	it('clearable поставлен позже — обёртка перед скрытым полем, снят — уходит', async () => {
		const el = await mount('<div is="so-date-input"></div>')

		el.clearable = true
		await flush()

		expect([...el.children].map((node) => node.className).slice(1, 3)).toEqual([
			'so-date-input__trailing',
			'',
		])
		expect(el.lastElementChild).toBe(hidden(el))

		el.clearable = false
		await flush()

		expect(el.querySelector('.so-date-input__trailing')).toBeNull()
	})

	it('клик очищает все части и значение, до корня не всплывает', async () => {
		const el = await mountModel('<div is="so-date-input" clearable value="2026-05-12"></div>')
		const rootClick = vi.fn()

		el.addEventListener('click', rootClick)

		clearButton().click()
		await flush()

		expect(el.value).toBeUndefined()
		expect(
			findAll('.so-date-input__segment').map((part) => part.dataset['placeholder']),
		).toEqual(['true', 'true', 'true'])
		expect(hidden(el).value).toBe('')
		expect(rootClick).not.toHaveBeenCalled()
	})

	it('выключена вместе с полем, readonly её не гасит', async () => {
		const el = await mount(
			'<div is="so-date-input" clearable readonly value="2026-05-12"></div>',
		)

		expect(clearButton().hasAttribute('disabled')).toBe(false)

		el.disabled = true
		await flush()

		expect(clearButton().hasAttribute('disabled')).toBe(true)
	})

	it('своя кнопка — слот clear вместо встроенной; команду берёт у элемента', async () => {
		const el = await mount(`<div is="so-date-input" value="2026-05-12" clearable>
			<button slot="clear" type="button" class="so-test-clear"></button>
		</div>`)

		const own = find(el, '.so-test-clear', HTMLButtonElement)

		own.addEventListener('click', () => el.ctrl?.clear())
		own.click()
		await flush()

		expect(el.querySelector('.so-date-input__trailing > .so-test-clear')).not.toBeNull()
		expect(document.querySelector('.so-date-input__clear')).toBeNull()
		expect(
			findAll('.so-date-input__segment').every(
				(part) => part.dataset['placeholder'] === 'true',
			),
		).toBe(true)
	})
})
