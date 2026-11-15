/**
 * Calendar в Svelte — проводка на настоящей разметке.
 *
 * Сценарии — те же, что у Vue (`calendar.spec.ts`) и Solid. Модель — сетки,
 * выбор, фокус, листание — проверяет ядро, клавиши и указатель — тесты
 * плагинов, раскладку и фокус в браузере — `playground/vue/browser`. Здесь
 * важно, что выходы коллекции доезжают туда, куда должны: сетки — в таблицы,
 * наборы дня — на его ячейку, выключенность — на кнопки, а нажатия и клавиши
 * на настоящей разметке доходят до модели и возвращаются колбэками
 * (`onChangeValue`, `onChangeMonths`).
 *
 * Своё у Svelte — узлы и такт. Сетки, недели и ячейки — выходы ядра, новые на
 * каждую смену, и петли идут по месту и по ключу: кнопка заголовка, её поповер
 * и живая область остаются теми же узлами при листании и выборе месяца, а
 * день, оставшийся на экране, — тем же узлом. Панель выбора месяца и года — с
 * `contained` на месте: `Teleport` Svelte рисует её прямым потомком корня
 * поповера. Смену состояния Svelte применяет к DOM на своём такте — тест
 * сбрасывает его `flushSync()`, а после нажатия ждёт кадр (`nextFrame`).
 * Пробел между узлами Svelte оставил бы текстом — месяц, строки таблицы, шапка
 * панели и подвал проверяются на текст между узлами.
 *
 * Сегодня во всех тестах — суббота 2026-09-26, как в тестах ядра.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { flushSync } from 'svelte'
import { TCalendar, createEngineCalendar } from '@soxa-ui/core'
import type { ICalendarItem, TCalendarDate, TCalendarValue } from '@soxa-ui/core'
import { ruRU, type TLocale } from '@soxa-ui/plugins'
import { Calendar, type CalendarProps } from '@soxa-ui/svelte'
import Surround from './Surround.test.svelte'
import { find, mount, nextFrame } from './mount'
import { reactiveProps } from './reactive-props.svelte'
import { markup, scopeMarkup } from './snippets.svelte'

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['Date'] })
	vi.setSystemTime(new Date(2026, 8, 26, 12))
})

afterEach(() => {
	vi.useRealTimers()
})

/**
 * Смонтировать календарь без провайдера локали — язык английский — и дождаться
 * кадра: корень плагины получают через `requestAnimationFrame`. Пропсы —
 * живые: смена пропа — присваивание полю.
 */
async function render(calendar: CalendarProps = {}): Promise<CalendarProps> {
	const props = reactiveProps<CalendarProps>(calendar)

	mount(Calendar, props)
	await nextFrame()

	return props
}

/** Календарь под провайдером локали `locale`. */
async function renderIn(locale: TLocale, calendar: CalendarProps = {}): Promise<void> {
	mount(Surround, { around: 'locale', control: 'calendar', locale, calendar })
	await nextFrame()
}

/** Узел по селектору в документе. */
const node = (selector: string) => find(document, selector, HTMLElement)

const nodes = (selector: string): HTMLElement[] =>
	[...document.querySelectorAll(selector)].filter(
		(element): element is HTMLElement => element instanceof HTMLElement,
	)

/** Ячейка дня по его имени — полной дате в локали, как её прочтёт скринридер. */
function dayCell(date: string): HTMLElement {
	const label = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeZone: 'UTC' }).format(
		Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8))),
	)

	return node(`.so-calendar-item[aria-label="${label}"]`)
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

/** Последний класс узла — его часть: у компонента soxa первым идёт блок. */
const partsOf = (element: Element) =>
	[...element.children].map((child) => child.classList[child.classList.length - 1])

/** Текст между узлами — пробел, который Svelte оставил бы в разметке. */
const textsOf = (element: Element) =>
	[...element.childNodes].filter((child) => child instanceof Text && child.data.length > 0)

/**
 * Календарь, чьё значение возвращается пропом, — как `v-model` у Vue: значение
 * держит родитель, а смена приходит `onChangeValue`.
 */
async function controlled(
	initial: TCalendarValue,
	calendar: CalendarProps = {},
): Promise<CalendarProps> {
	const props = await render({
		...calendar,
		value: initial,
		onChangeValue: (payload) => {
			props.value = payload.newValue
		},
	})

	return props
}

/** Месяцы сеток, возвращённые пропом, — как `v-model:months` у Vue. */
async function withMonths(): Promise<() => TCalendarDate[] | undefined> {
	// The months shown at mount are the starting state: the handler hears the
	// changes after it
	const props = reactiveProps<CalendarProps>({})

	props.onChangeMonths = ({ newValue: months }) => {
		props.months = months
	}

	mount(Calendar, props)
	await nextFrame()

	return () => props.months
}

describe('Calendar · разметка', () => {
	it('кнопки листания — за заголовком первого месяца, сетка — таблица с шапкой дней недели', async () => {
		await render()

		const root = node('.so-calendar')

		// Подвала без слота нет
		expect(partsOf(root)).toEqual(['so-calendar__months'])
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

	it('заголовок называет сетку и объявляет смену месяца', async () => {
		await render()

		const title = node('.so-calendar__title-text')
		const grid = node('.so-calendar__grid')

		expect(title.textContent?.trim()).toBe('September 2026')
		expect(title.getAttribute('aria-live')).toBe('polite')
		expect(grid.getAttribute('role')).toBe('grid')
		expect(grid.getAttribute('aria-labelledby')).toBe(title.id)
		expect(title.id).not.toBe('')
	})

	it('день — ячейка с номером и именем; заполнитель — пустая ячейка, скрытая от скринридера', async () => {
		await render()

		const fillers = nodes('.so-calendar__filler')
		const days = nodes('.so-calendar-item')

		// Сентябрь 2026 с воскресенья: 2 дня августа, 3 дня октября
		expect(fillers).toHaveLength(5)
		expect(fillers.every((cell) => cell.getAttribute('aria-hidden') === 'true')).toBe(true)
		expect(fillers.every((cell) => cell.textContent === '')).toBe(true)
		expect(days).toHaveLength(30)
		expect(days.every((cell) => cell.tagName === 'TD')).toBe(true)
		expect(dayCell('2026-09-05').textContent?.trim()).toBe('5')
	})

	it('остановка Tab одна, у дня с фокусом; сегодня отмечено', async () => {
		await render()

		const stops = nodes('.so-calendar-item[tabindex="0"]')

		expect(stops).toEqual([dayCell('2026-09-26')])
		expect(dayCell('2026-09-26').dataset['today']).toBe('true')
		expect(dayCell('2026-09-26').getAttribute('aria-current')).toBe('date')
	})

	it('несколько месяцев — сетка на каждый, у каждого свой заголовок; кнопки листания — одни, у первого', async () => {
		await render({ months: ['2026-01-01', '2026-09-01'] })

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
		await render({
			months: ['2026-01-01', '2026-09-01'],
			footer: markup('<button class="so-test-action">Готово</button>'),
		})

		const footer = node('.so-calendar__footer')

		expect(partsOf(node('.so-calendar'))).toEqual([
			'so-calendar__months',
			'so-calendar__footer',
		])
		expect(partsOf(node('.so-calendar__months'))).toEqual([
			'so-calendar__month',
			'so-calendar__month',
		])
		expect(footer.querySelector('.so-test-action')?.textContent).toBe('Готово')
	})

	it('первый день недели по локали поддерева: у ru-RU колонки с понедельника', async () => {
		await renderIn(ruRU)

		// Короткие имена: у ru-RU они различимы, а узкие повторялись бы —
		// понедельник и пятница — «П»
		expect(weekdays()).toEqual(shortWeek('ru-RU', 1))
	})

	it('слот item — своё содержимое дня; scope — сам день', async () => {
		await render({
			item: scopeMarkup(
				(scope: { item: ICalendarItem }) =>
					`<span class="so-test-day">${scope.item.text}·${scope.item.date.slice(5)}</span>`,
			),
		})

		expect(dayCell('2026-09-05').querySelector('.so-test-day')?.textContent).toBe('5·09-05')
	})

	/**
	 * Слот `item` — проброс слота дня: рядом с днём в scope и то, что отдаёт
	 * слот самого дня, — номер в цифрах локали.
	 */
	it('слот item получает и номер дня — scope слота самого дня', async () => {
		await render({
			item: scopeMarkup(
				(scope: { text: string }) => `<span class="so-test-day">«${scope.text}»</span>`,
			),
		})

		expect(dayCell('2026-09-05').querySelector('.so-test-day')?.textContent).toBe('«5»')
	})

	it('без слота день рисует свой номер в плитке', async () => {
		await render()

		expect(
			dayCell('2026-09-05').querySelector('.so-calendar-item__day')?.textContent?.trim(),
		).toBe('5')
	})

	it('атрибуты снаружи — корню календаря', async () => {
		await render({ id: 'agenda', class: 'mine', title: 'Календарь' })

		const root = node('.so-calendar')

		expect(root.id).toBe('agenda')
		expect([...root.classList].at(-1)).toBe('mine')
		expect(root.title).toBe('Календарь')
	})

	/** Пробел между блоками Svelte оставил бы текстом в месяце, строке недели и подвале. */
	it('в корне, месяце, строке недели и подвале узлы вплотную', async () => {
		await render({ footer: markup('<button class="so-test-action">Готово</button>') })

		for (const scope of [
			'.so-calendar',
			'.so-calendar__month',
			'.so-calendar__weekdays',
			'.so-calendar__week',
			'.so-calendar__footer',
			'.so-calendar__grid',
		]) {
			expect(textsOf(node(scope))).toEqual([])
		}
	})
})

describe('Calendar · кнопки листания', () => {
	it('имена — от локали поддерева, без провайдера — английские', async () => {
		await render()

		expect(prev().getAttribute('aria-label')).toBe('Previous month')
		expect(next().getAttribute('aria-label')).toBe('Next month')
	})

	it('имена — на языке локали поддерева', async () => {
		await renderIn(ruRU)

		expect(prev().getAttribute('aria-label')).toBe('Предыдущий месяц')
		expect(next().getAttribute('aria-label')).toBe('Следующий месяц')
	})

	it('у границы кнопка гаснет, в другую сторону — нет', async () => {
		await render({ min: '2026-09-10', max: '2026-10-20' })

		expect(prev().hasAttribute('disabled')).toBe(true)
		expect(next().hasAttribute('disabled')).toBe(false)

		next().click()
		await nextFrame()

		expect(titles()).toEqual(['October 2026'])
		expect(prev().hasAttribute('disabled')).toBe(false)
		expect(next().hasAttribute('disabled')).toBe(true)
	})

	it('выключенный календарь гасит обе кнопки и дни', async () => {
		await render({ disabled: true })

		expect(prev().hasAttribute('disabled')).toBe(true)
		expect(next().hasAttribute('disabled')).toBe(true)
		expect(node('.so-calendar').dataset['disabled']).toBe('true')
		expect(nodes('.so-calendar-item[data-disabled="false"]')).toEqual([])
	})

	it('граница, заданная инстансу, гасит кнопку и без листания', async () => {
		const ctrl = new TCalendar()

		await render({ ctrl })
		expect(prev().hasAttribute('disabled')).toBe(false)

		ctrl.min = '2026-09-03'
		flushSync()

		expect(prev().hasAttribute('disabled')).toBe(true)
	})

	it('месяцы, показанные при монтировании, — начальное состояние, а не onChangeMonths', async () => {
		const onChangeMonths = vi.fn()

		await render({ onChangeMonths })

		expect(onChangeMonths).not.toHaveBeenCalled()

		next().click()
		await nextFrame()

		expect(onChangeMonths).toHaveBeenCalledExactlyOnceWith({
			newValue: ['2026-10-01'],
			oldValue: ['2026-09-01'],
		})
	})

	it('листание пишет months — onChangeMonths', async () => {
		const months = await withMonths()

		next().click()
		await nextFrame()

		expect(months()).toEqual(['2026-10-01'])
		expect(titles()).toEqual(['October 2026'])

		prev().click()
		await nextFrame()

		expect(months()).toEqual(['2026-09-01'])
	})

	it('листание не пересоздаёт заголовок месяца: кнопка, поповер и живая область — те же', async () => {
		await render()

		const title = node('.so-calendar__title')
		const heading = node('.so-calendar__heading')
		const live = node('.so-calendar__title-text')

		next().click()
		await nextFrame()

		expect(titles()).toEqual(['October 2026'])
		expect(node('.so-calendar__title')).toBe(title)
		expect(node('.so-calendar__heading')).toBe(heading)
		expect(node('.so-calendar__title-text')).toBe(live)
	})
})

describe('Calendar · выбор', () => {
	it('нажатие по дню выбирает его — onChangeValue', async () => {
		const props = await controlled(undefined)

		dayCell('2026-09-10').click()
		await nextFrame()

		expect(props.value).toBe('2026-09-10')
		expect(dayCell('2026-09-10').dataset['selected']).toBe('true')
		expect(dayCell('2026-09-10').getAttribute('aria-selected')).toBe('true')
		expect(dayCell('2026-09-11').getAttribute('aria-selected')).toBe('false')
	})

	it('значение снаружи выбирает день и уводит сетку на его месяц', async () => {
		const props = await render({ value: '2026-09-10' })

		expect(dayCell('2026-09-10').dataset['selected']).toBe('true')

		props.value = '2026-11-03'
		await nextFrame()

		expect(titles()).toEqual(['November 2026'])
		expect(dayCell('2026-11-03').dataset['selected']).toBe('true')
	})

	it('диапазон: два нажатия — пара дат, между ними — середина', async () => {
		const props = await controlled(undefined, { mode: 'range' })

		expect(node('.so-calendar__grid').getAttribute('aria-multiselectable')).toBe('true')

		dayCell('2026-09-14').click()
		dayCell('2026-09-10').click()
		await nextFrame()

		expect(props.value).toEqual(['2026-09-10', '2026-09-14'])
		expect(dayCell('2026-09-10').dataset['rangeStart']).toBe('true')
		expect(dayCell('2026-09-12').dataset['rangeMiddle']).toBe('true')
		expect(dayCell('2026-09-14').dataset['rangeEnd']).toBe('true')
	})

	it('предпросмотр диапазона — до дня под указателем', async () => {
		await render({ mode: 'range' })

		dayCell('2026-09-10').click()
		dayCell('2026-09-13').dispatchEvent(
			new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }),
		)
		await nextFrame()

		expect(nodes('.so-calendar-item[data-preview="true"]')).toHaveLength(4)
	})

	it('недоступный день не выбирается, но фокус на него встаёт', async () => {
		const props = await controlled(undefined, {
			unavailable: (date: string) => date === '2026-09-15',
		})

		const blocked = dayCell('2026-09-15')

		expect(blocked.dataset['unavailable']).toBe('true')
		expect(blocked.getAttribute('aria-disabled')).toBe('true')
		expect(blocked.getAttribute('tabindex')).toBe('-1')

		blocked.click()
		await nextFrame()

		expect(props.value).toBeUndefined()
	})

	it('день, оставшийся на экране при выборе, — тот же узел', async () => {
		await controlled(undefined)

		const day = dayCell('2026-09-10')

		day.click()
		dayCell('2026-09-12').click()
		await nextFrame()

		expect(dayCell('2026-09-10')).toBe(day)
	})
})

describe('Calendar · клавиатура', () => {
	it('стрелка переносит фокус на соседний день, Enter его выбирает', async () => {
		const props = await controlled(undefined)

		const today = dayCell('2026-09-26')

		today.focus()
		press(today, 'ArrowLeft')
		await nextFrame()

		expect(document.activeElement).toBe(dayCell('2026-09-25'))
		expect(dayCell('2026-09-25').getAttribute('tabindex')).toBe('0')

		press(dayCell('2026-09-25'), 'Enter')
		await nextFrame()

		expect(props.value).toBe('2026-09-25')
	})

	it('PageDown уводит сетку в следующий месяц, а фокус — на новый день', async () => {
		await render()

		const today = dayCell('2026-09-26')

		today.focus()
		press(today, 'PageDown')
		await nextFrame()

		expect(titles()).toEqual(['October 2026'])
		expect(document.activeElement).toBe(dayCell('2026-10-26'))
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
		await nextFrame()
	}
	const openPicker = async () => {
		title().click()
		await nextFrame()
	}
	const panel = () => node('.so-calendar__picker')
	/** Нажатие мышью по узлу — нажатие, отпускание и `click`, как у браузера. */
	const pressOn = async (target: HTMLElement) => {
		target.dispatchEvent(
			new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
		)
		target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse' }))
		target.click()
		await nextFrame()
	}

	it('заголовок — кнопка, триггер панели; текст и живая область — внутри', async () => {
		await render()

		expect(title().tagName).toBe('BUTTON')
		expect(title().getAttribute('aria-haspopup')).toBe('dialog')
		expect(title().getAttribute('aria-expanded')).toBe('false')
		expect(title().contains(node('.so-calendar__title-text'))).toBe(true)
		// Содержимое панели не смонтировано до первого открытия
		expect(document.querySelector('.so-calendar__picker')).toBeNull()
	})

	it('keeps picker labels valid before mounting, through years, closing and reopening', async () => {
		await render()

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
		await nextFrame()
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
		await render()
		await openPicker()

		const dialog = node('.so-popover__panel')

		// Поповер внутри календаря: панель не телепортирована и накрывает его
		expect(node('.so-calendar').contains(dialog)).toBe(true)
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

	/**
	 * С `contained` `Teleport` Svelte рисует панель на месте, как сервер: между
	 * корнем поповера и панелью узлов нет, а корень поповера — прямой потомок
	 * месяца.
	 */
	it('панель — прямой потомок корня поповера, а он — прямой потомок месяца', async () => {
		await render()
		await openPicker()

		expect(
			document.querySelector(
				'.so-calendar__month > .so-calendar__heading > .so-popover__panel[data-contained="true"]',
			),
		).toBe(node('.so-popover__panel'))
	})

	it('полоса жеста — прямой потомок панели, немая для скринридера', async () => {
		await render()
		await openPicker()

		const handle = node('.so-popover__handle')

		// Плагин жеста узнаёт полосу только прямым потомком панели
		expect(handle.parentElement).toBe(node('.so-popover__panel'))
		expect(handle.getAttribute('aria-hidden')).toBe('true')
	})

	it('нажатие по подложке — самой панели — закрывает её, фокус — на заголовок', async () => {
		await render()
		await openPicker()
		await pressOn(node('.so-popover__panel'))

		expect(title().getAttribute('aria-expanded')).toBe('false')
		expect(document.activeElement).toBe(title())
		expect(titles()).toEqual(['September 2026'])
	})

	it('нажатие по карточке панель не закрывает', async () => {
		await render()
		await openPicker()
		await pressOn(panel())

		expect(title().getAttribute('aria-expanded')).toBe('true')
	})

	it('список в DOM раньше шапки: фокус при открытии встаёт на список', async () => {
		await render()
		await openPicker()

		expect(partsOf(panel())).toEqual(['so-calendar__picker-list', 'so-calendar__picker-header'])
	})

	it('в шапке год идёт перед стрелками — Tab за глазом; узлы вплотную', async () => {
		await render()
		await openPicker()

		expect(partsOf(node('.so-calendar__picker-header'))).toEqual([
			'so-calendar__picker-heading',
			'so-calendar__picker-prev',
			'so-calendar__picker-next',
		])
		expect(textsOf(node('.so-calendar__picker-header'))).toEqual([])
		expect(textsOf(panel())).toEqual([])
	})

	it('месяц → панель закрыта, сетка на нём — onChangeMonths', async () => {
		const months = await withMonths()

		await openPicker()
		await pick('Mar')

		expect(months()).toEqual(['2026-03-01'])
		expect(titles()).toEqual(['March 2026'])
		expect(title().getAttribute('aria-expanded')).toBe('false')
	})

	/**
	 * Блок месяца ключуется местом сетки: выбранный месяц меняет текст
	 * заголовка, а кнопка остаётся той же — фокус, который панель возвращает на
	 * неё, не падает на страницу.
	 */
	it('выбор месяца не пересоздаёт кнопку заголовка: фокус возвращается на неё', async () => {
		await render()

		const button = title()

		await openPicker()
		await pick('Mar')

		expect(title()).toBe(button)
		expect(document.activeElement).toBe(button)
	})

	it('год в шапке → годы страницы; выбор года → месяцы этого года; месяц → сетка', async () => {
		await render()
		await openPicker()

		heading().click()
		await nextFrame()

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
		await render()
		await openPicker()

		const fits = () => options().map((item) => item.dataset['contentFit'])
		const list = () => node('.so-calendar__picker-list')

		expect(list().dataset['contentFit']).toBe('wrap')
		expect(new Set(fits())).toEqual(new Set(['wrap']))

		heading().click()
		await nextFrame()

		expect(list().dataset['contentFit']).toBe('wrap')
		expect(new Set(fits())).toEqual(new Set(['wrap']))

		await pick('2028')

		expect(heading().textContent?.trim()).toBe('2028')
		expect(list().dataset['contentFit']).toBe('wrap')
		expect(new Set(fits())).toEqual(new Set(['wrap']))
	})

	it('стрелки шапки: имена по уровню, листание года и страницы', async () => {
		await render()
		await openPicker()

		const back = node('.so-calendar__picker-prev')
		const forward = node('.so-calendar__picker-next')

		expect(back.getAttribute('aria-label')).toBe('Previous year')
		expect(forward.getAttribute('aria-label')).toBe('Next year')

		forward.click()
		await nextFrame()

		expect(heading().textContent?.trim()).toBe('2027')

		heading().click()
		await nextFrame()

		expect(back.getAttribute('aria-label')).toBe('Previous 12 years')

		forward.click()
		await nextFrame()

		expect(options()[0]?.textContent?.trim()).toBe('2029')
	})

	it('у границы стрелка гаснет, опции вне min/max выключены', async () => {
		await render({ max: '2026-10-20' })
		await openPicker()

		expect(node('.so-calendar__picker-next').hasAttribute('disabled')).toBe(true)
		expect(node('.so-calendar__picker-prev').hasAttribute('disabled')).toBe(false)
		expect(option('Nov').dataset['disabled']).toBe('true')
		expect(option('Oct').dataset['disabled']).toBe('false')
	})

	it('выключенный календарь выключает заголовок', async () => {
		await render({ disabled: true })

		expect(title().hasAttribute('disabled')).toBe(true)
	})
})

describe('Calendar · движок снаружи', () => {
	it('календарь работает на переданном движке: его команды видны в разметке', async () => {
		const ctrl = new TCalendar()
		const engine = createEngineCalendar()
		const chosen = vi.fn()

		engine.extensions.selection.events.on('choose', chosen)

		await render({ ctrl, engine })

		// Принятый компонент пишет владельца в опции движка
		expect(engine.options.get('owner')).toBe(ctrl)

		engine.extensions.focus.focusDate('2026-11-03')
		await nextFrame()

		expect(titles()).toEqual(['November 2026'])
		expect(dayCell('2026-11-03').getAttribute('tabindex')).toBe('0')

		dayCell('2026-11-05').click()
		await nextFrame()

		expect(ctrl.value).toBe('2026-11-05')
		expect(chosen).toHaveBeenCalledWith('2026-11-05')
	})

	it('снятый календарь снимает владельца с движка', async () => {
		const ctrl = new TCalendar()
		const engine = createEngineCalendar()
		const { destroy } = mount(Calendar, { ctrl, engine })

		await nextFrame()
		destroy()

		expect(engine.options.get('owner')).toBeUndefined()
	})
})
