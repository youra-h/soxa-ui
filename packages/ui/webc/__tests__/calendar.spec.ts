/**
 * `<div is="so-calendar">` — календарь: сетки показанных месяцев, кнопки
 * листания и панели выбора месяца и года.
 *
 * Сценарии — те же, что у Vue (`calendar.spec.ts`), React и Solid, без сервера
 * и `act`. Модель — сетки, выбор, фокус, листание — проверяет ядро, клавиши и
 * указатель — тесты плагинов, раскладку и фокус в браузере —
 * `playground/vue/browser`. Здесь важно, что выходы коллекции доезжают туда,
 * куда должны: сетки — в таблицы, наборы дня — на его ячейку, выключенность —
 * на кнопки, а нажатия и клавиши на настоящей разметке доходят до модели и
 * возвращаются событиями `so:change:value` и `so:change:months`.
 *
 * Своё у Web Components — узлы. Сетки, недели и ячейки — выходы ядра, новые на
 * каждую смену, и петли идут по месту и по ключу: кнопка заголовка, её поповер
 * и живая область остаются теми же узлами при листании и выборе месяца, а
 * день, оставшийся на экране, — тем же узлом, и фокус с него не слетает.
 * Заголовок месяца — Popover на `div` (`<div is="so-popover-div">`), панель
 * выбора с `contained` — на месте, в корне поповера. Класс части шаблон пишет
 * детали до сборки, поэтому у элемента soxa он первый, а не последний, как у
 * Vue.
 *
 * Сегодня во всех тестах — суббота 2026-09-26, как в тестах ядра.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import {
	TCalendar,
	createEngineCalendar,
	type TCalendarDate,
	type TCalendarValue,
	type TValuePayload,
} from '@soxa-ui/core'
import { ruRU, type TLocale } from '@soxa-ui/plugins'
import { CalendarDescriptor } from '@soxa-ui/setup'
import {
	TButtonElement,
	TCalendarElement,
	TCalendarItemElement,
	TIconElement,
	TListBoxElement,
	TLocaleProviderElement,
	registerPopoverTag,
	type TCalendarElementProps,
	type TCalendarItemElementProps,
} from '@soxa-ui/webc'
import { CALENDAR_ITEM_SLOTS, calendarTemplate } from '../src/components/calendar/calendar.template'
import { bareContext } from './template-context'

/** Рендер коалесцируется в микротаске — ждём её перед проверкой. */
const flush = () => new Promise<void>((resolve) => queueMicrotask(() => resolve()))

/** `TElementPlugin` объявляет узел через кадр — после него встают слушатели плагинов. */
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/** Перерисовка и кадр: новые дни объявляют узлы кадром позже. */
async function settle(): Promise<void> {
	await flush()
	await nextFrame()
}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['Date'] })
	vi.setSystemTime(new Date(2026, 8, 26, 12))
})

afterEach(() => {
	vi.useRealTimers()
	vi.restoreAllMocks()
	document.body.innerHTML = ''
})

/** Заголовок месяца — Popover на `div`: тот же класс, что регистрирует фабрика поповера. */
const TPopoverDivElement = registerPopoverTag('div')

function isCalendar(node: Element | null): node is TCalendarElementProps {
	return node instanceof TCalendarElement
}

/** Календарь soxa в разметке. */
function calendarOf(root: ParentNode): TCalendarElementProps {
	const node = root.querySelector('[is="so-calendar"]')

	if (!isCalendar(node)) throw new Error('<div is="so-calendar"> нет')

	return node
}

/**
 * Календарь из разметки, вставленный в документ, — без ожидания: сборка прошла
 * внутри вставки, а отрисовки в микротаске и кадра ещё не было. `prepare` — до
 * вставки: слушатели, `ctrl`, движок. `locale` — провайдер вокруг календаря.
 */
function insert(
	html = '<div is="so-calendar"></div>',
	prepare: (el: TCalendarElementProps) => void = () => {},
	locale?: TLocale,
): TCalendarElementProps {
	const host = document.createElement('div')

	host.innerHTML = locale ? `<so-locale-provider>${html}</so-locale-provider>` : html

	const provider = host.firstElementChild

	if (locale) {
		if (!(provider instanceof TLocaleProviderElement)) throw new Error('провайдера нет')

		provider.locale = locale
	}

	const el = calendarOf(host)

	prepare(el)
	document.body.appendChild(host)

	return el
}

/**
 * Календарь из разметки, подключённый к документу, и кадр: корень плагины
 * получают через `requestAnimationFrame`. Параметры — как у `insert`.
 */
async function mount(
	html?: string,
	prepare?: (el: TCalendarElementProps) => void,
	locale?: TLocale,
): Promise<TCalendarElementProps> {
	const el = insert(html, prepare, locale)

	await settle()

	return el
}

/** Пара «стало, было» события значения — вид проверяется здесь, а не берётся на веру. */
function payloadOf(detail: unknown): TValuePayload<TCalendarValue> {
	if (typeof detail !== 'object' || detail === null || !('newValue' in detail)) {
		throw new Error('у события нет пары значений')
	}

	const value = (item: unknown): TCalendarValue => {
		if (typeof item === 'string') return item
		if (Array.isArray(item)) return item.filter((date) => typeof date === 'string')

		return undefined
	}

	return {
		newValue: value(detail.newValue),
		oldValue: value('oldValue' in detail ? detail.oldValue : undefined),
	}
}

/**
 * Календарь, чьё значение возвращает потребитель, — как `v-model` у Vue: на
 * каждую смену он пишет значение обратно в свойство элемента.
 */
async function controlled(html = '<div is="so-calendar"></div>'): Promise<TCalendarElementProps> {
	return mount(html, (el) => {
		el.addEventListener('so:change:value', (event) => {
			if (event instanceof CustomEvent) el.value = payloadOf(event.detail).newValue
		})
	})
}

/**
 * The grid months the consumer returns as a property — like Vue's
 * `v-model:months`: it writes them back into the element on every change.
 */
function returnMonths(el: TCalendarElementProps): void {
	el.addEventListener('so:change:months', (event) => {
		if (!(event instanceof CustomEvent)) return
		const months: unknown = event.detail.newValue
		if (!Array.isArray(months)) return

		el.months = months.filter((month): month is TCalendarDate => typeof month === 'string')
	})
}

/** Календарь, чьи месяцы сеток возвращает потребитель (`returnMonths`). */
async function withMonths(): Promise<TCalendarElementProps> {
	return mount(undefined, returnMonths)
}

/** Узел по селектору в документе; нет его или он не того вида — тест падает здесь. */
function find<T extends Element>(root: ParentNode, selector: string, type: new () => T): T {
	const node = root.querySelector(selector)

	if (!(node instanceof type)) throw new Error(`${selector}: узла нет`)

	return node
}

const node = (selector: string) => find(document, selector, HTMLElement)

const nodes = (selector: string): HTMLElement[] =>
	[...document.querySelectorAll(selector)].filter(
		(element): element is HTMLElement => element instanceof HTMLElement,
	)

function isDay(node: Element | null): node is TCalendarItemElementProps {
	return node instanceof TCalendarItemElement
}

/** Ячейка дня по его имени — полной дате в локали, как её прочтёт скринридер. */
function dayCell(date: string): TCalendarItemElementProps {
	const label = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeZone: 'UTC' }).format(
		Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8))),
	)
	const day = document.querySelector(`.so-calendar-item[aria-label="${label}"]`)

	if (!isDay(day)) throw new Error(`дня ${date} нет`)

	return day
}

const titles = () => nodes('.so-calendar__title').map((title) => title.textContent?.trim())
const weekdays = () => nodes('.so-calendar__weekday').map((cell) => cell.textContent?.trim())

/** Короткие имена недели языка `locale`, с первого дня `first` (2026-09-20 — воскресенье). */
function shortWeek(locale: string, first: number): string[] {
	const short = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })

	return [0, 1, 2, 3, 4, 5, 6].map((offset) =>
		short.format(Date.UTC(2026, 8, 20 + first + offset)),
	)
}

const prev = () => node('.so-calendar__prev')
const next = () => node('.so-calendar__next')

/** Нажатие клавиши с узла, как у пользователя: событие всплывает до корня. */
function press(from: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })

	from.dispatchEvent(event)

	return event
}

/**
 * Часть узла — первый класс календаря на нём: у элемента soxa класс части
 * шаблон пишет до сборки, и он стоит перед классами компонента.
 */
const partOf = (element: Element) =>
	[...element.classList].find((name) => name.startsWith('so-calendar')) ?? element.localName

/** Части детей узла по порядку. */
const partsOf = (element: Element) => [...element.children].map(partOf)

describe('Calendar · разметка', () => {
	it('корень — div потребителя; кнопки листания — за заголовком первого месяца', async () => {
		const el = await mount()

		expect(el).toBeInstanceOf(HTMLDivElement)
		expect(el.ctrl?.tag).toBe('div')
		expect(el.classList.contains('so-calendar')).toBe(true)
		// Подвала без слота нет
		expect(partsOf(el)).toEqual(['so-calendar__months'])
		expect(partsOf(node('.so-calendar__months'))).toEqual(['so-calendar__month'])
		expect(partsOf(node('.so-calendar__month'))).toEqual([
			'so-calendar__heading',
			'so-calendar__prev',
			'so-calendar__next',
			'so-calendar__grid',
		])
		// Подписи колонок — короткие имена: у en-US в них не больше трёх букв
		expect(weekdays()).toEqual(shortWeek('en-US', 0))
		expect(node('.so-calendar__grid thead').getAttribute('aria-hidden')).toBe('true')
	})

	/**
	 * Заголовок месяца — Popover на `div`, кнопки — детали Button: элементы
	 * soxa с именами места. Поповер на `div` — свой элемент, `so-popover-div`.
	 */
	it('заголовок — Popover на div, кнопки и иконки — детали с именами места', async () => {
		await mount()

		const heading = node('.so-calendar__heading')

		expect(heading).toBeInstanceOf(TPopoverDivElement)
		expect(heading).toBeInstanceOf(HTMLDivElement)
		expect(heading.getAttribute('is')).toBeNull()
		expect(heading.classList.contains('so-popover')).toBe(true)
		expect(heading.getAttribute('embedded')).toBe('calendar.picker')
		expect(node('.so-calendar__title')).toBeInstanceOf(TButtonElement)
		expect(node('.so-calendar__title').getAttribute('embedded')).toBe('calendar.title')
		expect(node('.so-calendar__title').getAttribute('type')).toBe('button')
		expect(prev().getAttribute('embedded')).toBe('calendar.prev')
		expect(next().getAttribute('embedded')).toBe('calendar.next')

		const icon = prev().querySelector('.so-icon')

		expect(icon).toBeInstanceOf(TIconElement)
		expect(icon?.getAttribute('embedded')).toBe('calendar.prev-icon')
		expect(icon?.getAttribute('icon')).toBe('arrowRight')
		expect(next().querySelector('.so-icon')?.getAttribute('icon')).toBe('arrowRight')
	})

	it('заголовок называет сетку и объявляет смену месяца', async () => {
		await mount()

		const title = node('.so-calendar__title-text')
		const grid = node('.so-calendar__grid')

		expect(title.textContent?.trim()).toBe('September 2026')
		expect(title.getAttribute('aria-live')).toBe('polite')
		expect(grid.getAttribute('role')).toBe('grid')
		expect(grid.getAttribute('aria-labelledby')).toBe(title.id)
		expect(title.id).not.toBe('')
	})

	it('день — ячейка с номером и именем; заполнитель — пустая ячейка, скрытая от скринридера', async () => {
		await mount()

		const fillers = nodes('.so-calendar__filler')
		const days = nodes('.so-calendar-item')

		// Сентябрь 2026 с воскресенья: 2 дня августа, 3 дня октября
		expect(fillers).toHaveLength(5)
		expect(fillers.every((cell) => cell.getAttribute('aria-hidden') === 'true')).toBe(true)
		expect(fillers.every((cell) => cell.textContent === '')).toBe(true)
		expect(days).toHaveLength(30)
		expect(days.every((cell) => cell instanceof TCalendarItemElement)).toBe(true)
		expect(days.every((cell) => cell.tagName === 'TD')).toBe(true)
		expect(dayCell('2026-09-05').textContent?.trim()).toBe('5')
	})

	it('остановка Tab одна, у дня с фокусом; сегодня отмечено', async () => {
		await mount()

		expect(nodes('.so-calendar-item[tabindex="0"]')).toEqual([dayCell('2026-09-26')])
		expect(dayCell('2026-09-26').dataset['today']).toBe('true')
		expect(dayCell('2026-09-26').getAttribute('aria-current')).toBe('date')
	})

	it('несколько месяцев — сетка на каждый, у каждого свой заголовок; кнопки листания — одни, у первого', async () => {
		await mount(`<div is="so-calendar" months='["2026-01-01","2026-09-01"]'></div>`)

		const [january, september] = nodes('.so-calendar__month')

		expect(titles()).toEqual(['January 2026', 'September 2026'])
		expect(nodes('.so-calendar__grid')).toHaveLength(2)
		expect(nodes('.so-calendar__prev')).toHaveLength(1)
		expect(nodes('.so-calendar__next')).toHaveLength(1)
		expect(january?.contains(prev())).toBe(true)
		expect(september && partsOf(september)).toEqual([
			'so-calendar__heading',
			'so-calendar__grid',
		])
	})

	it('слот footer — подвал после ряда месяцев, своей строкой', async () => {
		const el = await mount(`<div is="so-calendar" months='["2026-01-01","2026-09-01"]'>
			<button slot="footer" class="so-test-action">Готово</button>
		</div>`)

		expect(partsOf(el)).toEqual(['so-calendar__months', 'so-calendar__footer'])
		expect(partsOf(node('.so-calendar__months'))).toEqual([
			'so-calendar__month',
			'so-calendar__month',
		])
		expect(node('.so-calendar__footer .so-test-action').textContent).toBe('Готово')
	})

	it('первый день недели по локали поддерева: у ru-RU колонки с понедельника', async () => {
		await mount(undefined, undefined, ruRU)

		// Короткие имена: у ru-RU они различимы, а узкие повторялись бы —
		// понедельник и пятница — «П»
		expect(weekdays()).toEqual(shortWeek('ru-RU', 1))
	})

	/**
	 * Слот со scope у Web Components — образец: копию получает каждый день, а
	 * данные копия берёт у элемента дня — `el.ctrl` ближайшего
	 * `.so-calendar-item`.
	 */
	it('слот item — образец: копия в каждом дне, день и номер — у элемента дня', async () => {
		await mount(`<div is="so-calendar">
			<template slot="item"><span class="so-test-day"></span></template>
		</div>`)

		const copies = nodes('.so-test-day')
		const day = dayCell('2026-09-05')
		const copy = day.querySelector('.so-test-day')

		expect(copies).toHaveLength(30)
		expect(copy?.closest('.so-calendar-item__day')).not.toBeNull()
		expect(day.ctrl?.date).toBe('2026-09-05')
		expect(day.ctrl?.text).toBe('5')
		// Слот задан — номера плитка не рисует
		expect(day.querySelector('.so-calendar-item__day')?.textContent).toBe('')
	})

	it('без слота день рисует свой номер в плитке', async () => {
		await mount()

		expect(
			dayCell('2026-09-05').querySelector('.so-calendar-item__day')?.textContent?.trim(),
		).toBe('5')
	})

	it('атрибуты разметки — корню календаря', async () => {
		const el = await mount(
			'<div is="so-calendar" id="agenda" class="mine" title="Календарь" data-probe="1"></div>',
		)

		expect(el.id).toBe('agenda')
		expect(el.classList.contains('mine')).toBe(true)
		expect(el.title).toBe('Календарь')
		expect(el.dataset['probe']).toBe('1')
	})

	it('шаблон объявляет ровно те слоты, что и дескриптор', () => {
		const root = document.createElement('div')
		const targets = calendarTemplate.create(root, bareContext(root)).slots

		expect(Object.keys(targets)).toEqual(CalendarDescriptor().slots.map((slot) => slot.name))
		expect(CALENDAR_ITEM_SLOTS).toEqual({ item: 'default' })
	})
})

describe('Calendar · кнопки листания', () => {
	it('имена — от локали поддерева, без провайдера — английские', async () => {
		await mount()

		expect(prev().getAttribute('aria-label')).toBe('Previous month')
		expect(next().getAttribute('aria-label')).toBe('Next month')

		document.body.innerHTML = ''

		await mount(undefined, undefined, ruRU)

		expect(prev().getAttribute('aria-label')).toBe('Предыдущий месяц')
		expect(next().getAttribute('aria-label')).toBe('Следующий месяц')
	})

	it('у границы кнопка гаснет, в другую сторону — нет', async () => {
		await mount('<div is="so-calendar" min="2026-09-10" max="2026-10-20"></div>')

		expect(prev().hasAttribute('disabled')).toBe(true)
		expect(next().hasAttribute('disabled')).toBe(false)

		next().click()
		await settle()

		expect(titles()).toEqual(['October 2026'])
		expect(prev().hasAttribute('disabled')).toBe(false)
		expect(next().hasAttribute('disabled')).toBe(true)
	})

	it('выключенный календарь гасит обе кнопки и дни', async () => {
		const el = await mount('<div is="so-calendar" disabled></div>')

		expect(prev().hasAttribute('disabled')).toBe(true)
		expect(next().hasAttribute('disabled')).toBe(true)
		expect(el.dataset['disabled']).toBe('true')
		expect(nodes('.so-calendar-item[data-disabled="false"]')).toEqual([])
	})

	it('граница, заданная инстансу, гасит кнопку и без листания', async () => {
		const ctrl = new TCalendar()

		await mount(undefined, (el) => {
			el.ctrl = ctrl
		})
		expect(prev().hasAttribute('disabled')).toBe(false)

		ctrl.min = '2026-09-03'
		await settle()

		expect(prev().hasAttribute('disabled')).toBe(true)
	})

	it('листание пишет months — so:change:months', async () => {
		const el = await withMonths()

		next().click()
		await settle()

		expect(el.months).toEqual(['2026-10-01'])
		expect(titles()).toEqual(['October 2026'])

		prev().click()
		await settle()

		expect(el.months).toEqual(['2026-09-01'])
	})

	it('листание не пересоздаёт заголовок месяца: кнопка, поповер и живая область — те же', async () => {
		await mount()

		const title = node('.so-calendar__title')
		const heading = node('.so-calendar__heading')
		const live = node('.so-calendar__title-text')

		next().click()
		await settle()

		expect(titles()).toEqual(['October 2026'])
		expect(node('.so-calendar__title')).toBe(title)
		expect(node('.so-calendar__heading')).toBe(heading)
		expect(node('.so-calendar__title-text')).toBe(live)
	})

	it('значки — свои слоты, кнопка остаётся своей', async () => {
		await mount(`<div is="so-calendar">
			<i slot="prev-icon" class="so-test-prev">‹</i>
			<i slot="next-icon" class="so-test-next">›</i>
		</div>`)

		expect(prev().querySelector('.so-test-prev')).not.toBeNull()
		expect(prev().querySelector('.so-icon')).toBeNull()
		expect(next().querySelector('.so-test-next')).not.toBeNull()
		expect(next().querySelector('.so-icon')).toBeNull()
	})
})

describe('Calendar · выбор', () => {
	it('нажатие по дню выбирает его — so:change:value', async () => {
		const el = await controlled()

		dayCell('2026-09-10').click()
		await settle()

		expect(el.value).toBe('2026-09-10')
		expect(dayCell('2026-09-10').dataset['selected']).toBe('true')
		expect(dayCell('2026-09-10').getAttribute('aria-selected')).toBe('true')
		expect(dayCell('2026-09-11').getAttribute('aria-selected')).toBe('false')
	})

	it('значение снаружи выбирает день и уводит сетку на его месяц', async () => {
		const el = await mount('<div is="so-calendar" value="2026-09-10"></div>')

		expect(dayCell('2026-09-10').dataset['selected']).toBe('true')

		el.value = '2026-11-03'
		await settle()

		expect(titles()).toEqual(['November 2026'])
		expect(dayCell('2026-11-03').dataset['selected']).toBe('true')
	})

	it('диапазон: два нажатия — пара дат, между ними — середина', async () => {
		const el = await controlled('<div is="so-calendar" mode="range"></div>')

		expect(node('.so-calendar__grid').getAttribute('aria-multiselectable')).toBe('true')

		dayCell('2026-09-14').click()
		dayCell('2026-09-10').click()
		await settle()

		expect(el.value).toEqual(['2026-09-10', '2026-09-14'])
		expect(dayCell('2026-09-10').dataset['rangeStart']).toBe('true')
		expect(dayCell('2026-09-12').dataset['rangeMiddle']).toBe('true')
		expect(dayCell('2026-09-14').dataset['rangeEnd']).toBe('true')
	})

	it('предпросмотр диапазона — до дня под указателем', async () => {
		await mount('<div is="so-calendar" mode="range"></div>')

		dayCell('2026-09-10').click()
		dayCell('2026-09-13').dispatchEvent(
			new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }),
		)
		await settle()

		expect(nodes('.so-calendar-item[data-preview="true"]')).toHaveLength(4)
	})

	it('недоступный день не выбирается, но фокус на него встаёт', async () => {
		const el = await controlled()

		el.unavailable = (date: string) => date === '2026-09-15'
		await settle()

		const blocked = dayCell('2026-09-15')

		expect(blocked.dataset['unavailable']).toBe('true')
		expect(blocked.getAttribute('aria-disabled')).toBe('true')
		expect(blocked.getAttribute('tabindex')).toBe('-1')

		blocked.click()
		await settle()

		expect(el.value).toBeUndefined()
	})

	it('день, оставшийся на экране при выборе, — тот же узел', async () => {
		await controlled()

		const day = dayCell('2026-09-10')

		day.click()
		dayCell('2026-09-12').click()
		await settle()

		expect(dayCell('2026-09-10')).toBe(day)
	})

	/** Дни — разметка календаря: их события не всплывают, выбор сообщает календарь. */
	it('события дня до календаря не всплывают, выбор — so:change:value календаря', async () => {
		const el = await mount()
		const heard: string[] = []

		el.addEventListener('so:change:selected', () => heard.push('day'))
		el.addEventListener('so:change:value', () => heard.push('calendar'))

		dayCell('2026-09-10').click()
		await settle()

		expect(heard).toEqual(['calendar'])
	})
})

describe('Calendar · клавиатура', () => {
	it('стрелка переносит фокус на соседний день, Enter его выбирает', async () => {
		const el = await controlled()

		const today = dayCell('2026-09-26')

		today.focus()
		press(today, 'ArrowLeft')
		await settle()

		expect(document.activeElement).toBe(dayCell('2026-09-25'))
		expect(dayCell('2026-09-25').getAttribute('tabindex')).toBe('0')

		press(dayCell('2026-09-25'), 'Enter')
		await settle()

		expect(el.value).toBe('2026-09-25')
	})

	it('PageDown уводит сетку в следующий месяц, а фокус — на новый день', async () => {
		await mount()

		const today = dayCell('2026-09-26')

		today.focus()
		press(today, 'PageDown')
		await settle()

		expect(titles()).toEqual(['October 2026'])
		expect(document.activeElement).toBe(dayCell('2026-10-26'))
	})

	/**
	 * Листание месяца клавишей, когда месяц уже на экране — во второй сетке:
	 * сетки не сдвигаются, и фокус встаёт на тот же узел дня, что был до
	 * листания, а день под прежним фокусом остаётся своим узлом.
	 */
	it('день под фокусом переживает листание месяца тем же узлом', async () => {
		await mount(`<div is="so-calendar" months='["2026-09-01","2026-10-01"]'></div>`)

		const today = dayCell('2026-09-26')
		const target = dayCell('2026-10-26')

		today.focus()
		press(today, 'PageDown')
		await settle()

		expect(titles()).toEqual(['September 2026', 'October 2026'])
		expect(document.activeElement).toBe(target)
		expect(dayCell('2026-10-26')).toBe(target)
		expect(dayCell('2026-09-26')).toBe(today)

		press(target, 'PageUp')
		await settle()

		expect(document.activeElement).toBe(today)
		expect(dayCell('2026-09-26')).toBe(today)
	})
})

/**
 * Выбор месяца и года: заголовок сетки — кнопка-триггер поповера, в панели —
 * ListBox и шапка. Модель панели проверяет ядро (`calendar-picker.spec.ts`),
 * здесь — что её выходы доезжают до разметки, а нажатия — до модели.
 */
describe('Calendar · выбор месяца и года', () => {
	const title = () => node('.so-calendar__title')
	const heading = () => node('.so-calendar__picker-heading')
	const options = () => nodes('.so-calendar__picker-list .so-list-box-item')
	const option = (text: string) => {
		const found = options().find((item) => item.textContent?.trim() === text)

		if (!found) throw new Error(`опции «${text}» нет`)

		return found
	}
	/** Строка опции: на ней набор `aria` элемента и обработчик нажатия. */
	const row = (text: string) => find(option(text), '.so-button', HTMLElement)
	/** Нажатие по строке опции — тем же путём, что клик пользователя. */
	const pick = async (text: string) => {
		row(text).click()
		await settle()
	}
	const openPicker = async () => {
		title().click()
		await settle()
	}
	const panel = () => node('.so-calendar__picker')
	/** Нажатие мышью по узлу — нажатие, отпускание и `click`, как у браузера. */
	const pressOn = async (target: HTMLElement) => {
		target.dispatchEvent(
			new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
		)
		target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse' }))
		target.click()
		await settle()
	}

	it('заголовок — кнопка, триггер панели; текст и живая область — внутри', async () => {
		await mount()

		expect(title().tagName).toBe('BUTTON')
		expect(title().getAttribute('aria-haspopup')).toBe('dialog')
		expect(title().getAttribute('aria-expanded')).toBe('false')
		expect(title().contains(node('.so-calendar__title-text'))).toBe(true)
		// Содержимое панели не смонтировано до первого открытия
		expect(document.querySelector('.so-calendar__picker')).toBeNull()
	})

	it('keeps picker labels valid before mounting, through years, closing and reopening', async () => {
		await mount()

		const dialog = node('.so-popover__panel')

		expect(dialog.getAttribute('aria-labelledby')).toBeNull()
		expect(document.querySelector('.so-calendar__picker-heading')).toBeNull()

		await openPicker()

		const label = heading()
		const list = node('.so-calendar__picker-list [role="listbox"]')
		const expectLabel = () => {
			expect(label.id).not.toBe('')
			expect(document.getElementById(label.id)).toBe(label)
			expect(label.textContent?.trim()).not.toBe('')
			expect(dialog.getAttribute('aria-labelledby')).toBe(label.id)
			expect(list.getAttribute('aria-labelledby')).toBe(label.id)
		}

		expectLabel()
		heading().click()
		await settle()
		expectLabel()

		await pick('2026')
		expectLabel()
		await pick('Mar')

		expect(title().getAttribute('aria-expanded')).toBe('false')
		expectLabel()

		await openPicker()

		expect(heading()).toBe(label)
		expect(node('.so-calendar__picker-list [role="listbox"]')).toBe(list)
		expectLabel()
	})

	it('нажатие на заголовок открывает панель: 12 месяцев, выбран месяц сетки, в шапке год', async () => {
		const el = await mount()

		await openPicker()

		const dialog = node('.so-popover__panel')

		// Поповер внутри календаря: панель не телепортирована и накрывает его
		expect(el.contains(dialog)).toBe(true)
		expect(dialog.dataset['contained']).toBe('true')
		expect(title().getAttribute('aria-expanded')).toBe('true')
		expect(title().getAttribute('aria-controls')).toBe(dialog.id)
		expect(heading().textContent?.trim()).toBe('2026')
		expect(dialog.getAttribute('aria-labelledby')).toBe(heading().id)
		// Имя списка — у узла списка ListBox, где его роль, а не у корня
		expect(
			node('.so-calendar__picker-list [role="listbox"]').getAttribute('aria-labelledby'),
		).toBe(heading().id)
		expect(heading().id).not.toBe('')
		expect(options()).toHaveLength(12)
		expect(row('Sep').getAttribute('aria-selected')).toBe('true')
		expect(row('Mar').getAttribute('aria-selected')).toBe('false')
	})

	it('панель — в корне поповера, а он — прямой потомок месяца; список — ListBox', async () => {
		await mount()
		await openPicker()

		expect(
			document.querySelector(
				'.so-calendar__month > .so-calendar__heading > .so-popover__panel[data-contained="true"]',
			),
		).toBe(node('.so-popover__panel'))
		expect(node('.so-calendar__picker-list')).toBeInstanceOf(TListBoxElement)
		expect(node('.so-calendar__picker-list').getAttribute('embedded')).toBe(
			'calendar.picker-list',
		)
		expect(node('.so-calendar__picker-heading').getAttribute('embedded')).toBe(
			'calendar.picker-heading',
		)
	})

	it('полоса жеста — прямой потомок панели, немая для скринридера', async () => {
		await mount()
		await openPicker()

		const handle = node('.so-popover__handle')

		// Плагин жеста узнаёт полосу только прямым потомком панели
		expect(handle.parentElement).toBe(node('.so-popover__panel'))
		expect(handle.getAttribute('aria-hidden')).toBe('true')
	})

	it('нажатие по подложке — самой панели — закрывает её, фокус — на заголовок', async () => {
		await mount()
		await openPicker()
		await pressOn(node('.so-popover__panel'))

		expect(title().getAttribute('aria-expanded')).toBe('false')
		expect(document.activeElement).toBe(title())
		expect(titles()).toEqual(['September 2026'])
	})

	it('нажатие по карточке панель не закрывает', async () => {
		await mount()
		await openPicker()
		await pressOn(panel())

		expect(title().getAttribute('aria-expanded')).toBe('true')
	})

	it('список в DOM раньше шапки: фокус при открытии встаёт на список', async () => {
		await mount()
		await openPicker()

		expect(partsOf(panel())).toEqual(['so-calendar__picker-list', 'so-calendar__picker-header'])
	})

	it('в шапке год идёт перед стрелками — Tab за глазом', async () => {
		await mount()
		await openPicker()

		expect(partsOf(node('.so-calendar__picker-header'))).toEqual([
			'so-calendar__picker-heading',
			'so-calendar__picker-prev',
			'so-calendar__picker-next',
		])
	})

	it('месяц → панель закрыта, сетка на нём — so:change:months', async () => {
		const el = await withMonths()

		await openPicker()
		await pick('Mar')

		expect(el.months).toEqual(['2026-03-01'])
		expect(titles()).toEqual(['March 2026'])
		expect(title().getAttribute('aria-expanded')).toBe('false')
	})

	/**
	 * Блок месяца ключуется местом сетки: выбранный месяц меняет текст
	 * заголовка, а кнопка остаётся той же — фокус, который панель возвращает на
	 * неё, не падает на страницу.
	 */
	it('выбор месяца не пересоздаёт кнопку заголовка: фокус возвращается на неё', async () => {
		await mount()

		const button = title()

		await openPicker()
		await pick('Mar')

		expect(title()).toBe(button)
		expect(document.activeElement).toBe(button)
	})

	it('год в шапке → годы страницы; выбор года → месяцы этого года; месяц → сетка', async () => {
		await mount()
		await openPicker()

		heading().click()
		await settle()

		expect(heading().textContent?.trim()).toBe(
			new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'UTC' }).formatRange(
				Date.UTC(2017, 0, 1),
				Date.UTC(2028, 0, 1),
			),
		)
		expect(options().map((item) => item.textContent?.trim())).toEqual([
			'2017',
			'2018',
			'2019',
			'2020',
			'2021',
			'2022',
			'2023',
			'2024',
			'2025',
			'2026',
			'2027',
			'2028',
		])
		expect(row('2026').getAttribute('aria-selected')).toBe('true')

		await pick('2028')

		expect(heading().textContent?.trim()).toBe('2028')
		expect(options()).toHaveLength(12)
		expect(title().getAttribute('aria-expanded')).toBe('true')

		await pick('Feb')

		expect(titles()).toEqual(['February 2028'])
		expect(title().getAttribute('aria-expanded')).toBe('false')
	})

	/**
	 * Подпись шире плитки список переносит между словами — у месяцев и у лет:
	 * `contentFit` ставит расширение календаря, и разметка его не перебивает.
	 */
	it('подпись шире плитки переносится — у месяцев и у лет', async () => {
		await mount()
		await openPicker()

		const fits = () => options().map((item) => item.dataset['contentFit'])
		const list = () => node('.so-calendar__picker-list')

		expect(list().dataset['contentFit']).toBe('wrap')
		expect(new Set(fits())).toEqual(new Set(['wrap']))

		heading().click()
		await settle()

		expect(list().dataset['contentFit']).toBe('wrap')
		expect(new Set(fits())).toEqual(new Set(['wrap']))

		await pick('2028')

		expect(heading().textContent?.trim()).toBe('2028')
		expect(list().dataset['contentFit']).toBe('wrap')
		expect(new Set(fits())).toEqual(new Set(['wrap']))
	})

	it('стрелки шапки: имена по уровню, листание года и страницы', async () => {
		await mount()
		await openPicker()

		const back = node('.so-calendar__picker-prev')
		const forward = node('.so-calendar__picker-next')

		expect(back.getAttribute('aria-label')).toBe('Previous year')
		expect(forward.getAttribute('aria-label')).toBe('Next year')

		forward.click()
		await settle()

		expect(heading().textContent?.trim()).toBe('2027')

		heading().click()
		await settle()

		expect(back.getAttribute('aria-label')).toBe('Previous 12 years')

		forward.click()
		await settle()

		expect(options()[0]?.textContent?.trim()).toBe('2029')
	})

	it('у границы стрелка гаснет, опции вне min/max выключены', async () => {
		await mount('<div is="so-calendar" max="2026-10-20"></div>')
		await openPicker()

		expect(node('.so-calendar__picker-next').hasAttribute('disabled')).toBe(true)
		expect(node('.so-calendar__picker-prev').hasAttribute('disabled')).toBe(false)
		expect(option('Nov').dataset['disabled']).toBe('true')
		expect(option('Oct').dataset['disabled']).toBe('false')
	})

	it('выключенный календарь выключает заголовок', async () => {
		await mount('<div is="so-calendar" disabled></div>')

		expect(title().hasAttribute('disabled')).toBe(true)
	})
})

describe('Calendar · движок снаружи', () => {
	it('календарь работает на переданном движке: его команды видны в разметке', async () => {
		const ctrl = new TCalendar()
		const engine = createEngineCalendar()
		const chosen = vi.fn()

		engine.extensions.selection.events.on('choose', chosen)

		await mount(undefined, (el) => {
			el.ctrl = ctrl
			el.engine = engine
		})

		// Принятый компонент пишет владельца в опции движка
		expect(engine.options.get('owner')).toBe(ctrl)

		engine.extensions.focus.focusDate('2026-11-03')
		await settle()

		expect(titles()).toEqual(['November 2026'])
		expect(dayCell('2026-11-03').getAttribute('tabindex')).toBe('0')

		dayCell('2026-11-05').click()
		await settle()

		expect(ctrl.value).toBe('2026-11-05')
		expect(chosen).toHaveBeenCalledWith('2026-11-05')
	})

	it('снятый календарь снимает владельца с движка', async () => {
		const ctrl = new TCalendar()
		const engine = createEngineCalendar()
		const el = await mount(undefined, (node) => {
			node.ctrl = ctrl
			node.engine = engine
		})

		el.remove()

		expect(engine.options.get('owner')).toBeUndefined()
	})

	/**
	 * Переставленный календарь собирается заново: без движка снаружи — новый
	 * движок, новые дни и новые поповеры мест. Заголовок места — новая деталь
	 * над новым поповером, дни — новые узлы над новыми днями.
	 */
	it('переставленный без движка снаружи — дни и поповеры мест над новыми экземплярами', async () => {
		const el = await mount()
		const day = dayCell('2026-09-10')
		const heading = node('.so-calendar__heading')

		document.body.appendChild(el)
		await settle()

		expect(titles()).toEqual(['September 2026'])
		expect(dayCell('2026-09-10')).not.toBe(day)
		expect(node('.so-calendar__heading')).not.toBe(heading)
		expect(nodes('.so-calendar__heading')).toHaveLength(1)

		dayCell('2026-09-12').click()
		await settle()

		expect(el.ctrl?.value).toBe('2026-09-12')
		expect(dayCell('2026-09-12').dataset['selected']).toBe('true')
	})
})

/**
 * The months shown at assembly are the starting state: the view writes them
 * into the component when the facade is accepted, and the facade is bound
 * before the component — as in React and Angular
 * (benchmarks/parity/README.md).
 */
describe('Calendar · сборка — начальное состояние', () => {
	it('месяцы, показанные при сборке, событием не приходят', async () => {
		const heard = vi.fn()
		const el = insert(undefined, (node) => node.addEventListener('so:change:months', heard))

		expect(el.ctrl?.months).toEqual(['2026-09-01'])

		await settle()

		expect(heard).not.toHaveBeenCalled()

		next().click()
		await settle()

		expect(heard).toHaveBeenCalledOnce()
	})

	it('возвращённые месяцы не затеняют ядро — ни после листания, ни после перестановки', async () => {
		const el = insert(undefined, returnMonths)

		await settle()
		next().click()
		await settle()

		expect(el.months).toEqual(['2026-10-01'])
		expect(el.ctrl?.months).toEqual(['2026-10-01'])

		document.body.appendChild(el)
		await settle()

		expect(el.months).toEqual(['2026-10-01'])
		expect(el.ctrl?.months).toEqual(['2026-10-01'])
		expect(titles()).toEqual(['October 2026'])
	})
})
