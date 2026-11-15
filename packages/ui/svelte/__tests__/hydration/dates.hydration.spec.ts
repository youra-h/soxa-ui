/**
 * Даты после гидратации: DateInput, DatePicker и Calendar.
 *
 * Своё у Svelte — часть поля даты. Её текст в браузере пишет `TextSpan`
 * адаптера свойством `textContent`, а на сервере текст — содержимое узла:
 * ветка у сервера и браузера разная, и при гидратации Svelte пересобирает
 * часть сам, без предупреждения, — в ней текст ядра одним узлом. Остальное
 * поле — корень, ряд частей, разделители, скрытое поле — узлы сервера, а
 * `id` частей — от `$props.id()` сервера: его Svelte берёт из разметки.
 * Пересобранную часть плагины поля находят в корне по его `ready`, кадром
 * после гидратации, — и набор с клавиатуры доходит до значения.
 *
 * Панель выбора месяца и года у календаря — поповер с `contained`: сервер
 * рисует её на месте, `Teleport` начинает в фазе «на месте», и панель
 * сервера остаётся тем же узлом — прямым потомком корня поповера.
 *
 * Разметку сервера рисует перед прогоном его `globalSetup` (`server.ts`) теми
 * же страницами. «Сегодня» у сервера и браузера одно (`today.ts`): часы
 * браузера хуки ниже ставят на каждый тест, а после теста они снова
 * настоящие. Язык — английский: провайдера локали на страницах нет.
 */

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { flushSync } from 'svelte'
import { find, nextFrame } from '../mount'
import CalendarValue from './CalendarValue.test.svelte'
import DateInputValue from './DateInputValue.test.svelte'
import DatePickerValue from './DatePickerValue.test.svelte'
import { expectServedNodes, hydrateServed, markupOf, serve } from './serve'
import { TODAY } from './today'

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['Date'] })
	vi.setSystemTime(TODAY)
})

afterEach(() => {
	vi.useRealTimers()
})

/** Части поля даты по порядку. */
const segmentsOf = (scope: ParentNode) => [...scope.querySelectorAll('.so-date-input__segment')]

/** Элементы разметки, кроме частей поля даты: их пересобирает гидратация. */
const withoutSegments = (scope: ParentNode) =>
	[...scope.querySelectorAll('*')].filter(
		(element) => !element.matches('.so-date-input__segment'),
	)

/** Типы узлов-детей и текст каждой части. */
const contentOf = (segments: readonly Element[]) =>
	segments.map((segment) => ({
		nodes: [...segment.childNodes].map((child) => child.nodeType),
		text: segment.textContent,
	}))

/** `id` узлов и ссылки на них — по порядку документа. */
const idsOf = (scope: ParentNode) =>
	[...scope.querySelectorAll('[id], [aria-controls], [aria-labelledby]')].map((element) => [
		element.id,
		element.getAttribute('aria-controls'),
		element.getAttribute('aria-labelledby'),
	])

/** Нажатие клавиши с узла, как у пользователя: событие всплывает до корня. */
function press(from: Element, key: string): void {
	from.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
	flushSync()
}

describe('DateInput · гидратация', () => {
	it('корень, ряд частей, разделители и скрытое поле — узлы сервера', () => {
		const container = serve(markupOf('date-input-value'))
		const served = withoutSegments(container)

		hydrateServed(container, DateInputValue, {})

		expect(served.map((element) => element.className || element.localName)).toEqual([
			'so-date-input so-date-input--size-normal',
			'so-date-input__segments',
			'so-date-input__literal',
			'so-date-input__literal',
			'input',
		])
		expectServedNodes(withoutSegments(container), served)
	})

	it('в части — один текстовый узел с текстом ядра', () => {
		const container = serve(markupOf('date-input-value'))

		hydrateServed(container, DateInputValue, {})

		expect(contentOf(segmentsOf(container))).toEqual([
			{ nodes: [Node.TEXT_NODE], text: '05' },
			{ nodes: [Node.TEXT_NODE], text: '12' },
			{ nodes: [Node.TEXT_NODE], text: '2026' },
		])
	})

	it('id частей — от $props.id() сервера', () => {
		const container = serve(markupOf('date-input-value'))
		const served = segmentsOf(container).map((segment) => segment.id)

		hydrateServed(container, DateInputValue, {})

		expect(served.every((id) => id.length > 0)).toBe(true)
		expect(segmentsOf(container).map((segment) => segment.id)).toEqual(served)
	})

	it('после кадра набор в часть доходит до значения', async () => {
		const container = serve(markupOf('date-input-value'))

		hydrateServed(container, DateInputValue, {})
		await nextFrame()

		const day = find(container, '.so-date-input__segment[data-type="day"]', HTMLElement)

		day.focus()
		press(day, '1')
		press(day, '3')

		expect(day.textContent).toBe('13')
		expect(find(container, 'input[type="hidden"]', HTMLInputElement).value).toBe('2026-05-13')
		// Дописать в день нечего — фокус на следующей части
		expect(document.activeElement).toBe(
			find(container, '.so-date-input__segment[data-type="year"]', HTMLElement),
		)
	})
})

describe('DatePicker · гидратация', () => {
	it('поле и кнопка календаря — узлы сервера, в частях — текст ядра одним узлом, id — от сервера', () => {
		const container = serve(markupOf('date-picker-value'))
		const served = withoutSegments(container)
		const ids = idsOf(container)

		hydrateServed(container, DatePickerValue, {})

		expectServedNodes(withoutSegments(container), served)
		expect(contentOf(segmentsOf(container))).toEqual([
			{ nodes: [Node.TEXT_NODE], text: '09' },
			{ nodes: [Node.TEXT_NODE], text: '10' },
			{ nodes: [Node.TEXT_NODE], text: '2026' },
		])
		expect(idsOf(container)).toEqual(ids)
	})

	/** No dangling SSR reference; hydration links the existing trigger to its panel. */
	it('connects the server trigger when its panel mounts', async () => {
		const container = serve(markupOf('date-picker-value'))
		const trigger = find(container, '.so-date-picker__trigger', HTMLElement)
		const controls = trigger.getAttribute('aria-controls')

		expect(document.querySelector('.so-date-picker__panel')).toBeNull()

		hydrateServed(container, DatePickerValue, {})
		await nextFrame()

		const panel = find(document, '.so-date-picker__panel', HTMLElement)

		expect(find(container, '.so-date-picker__trigger', HTMLElement)).toBe(trigger)
		expect(container.contains(panel)).toBe(false)
		expect(controls).toBeNull()
		expect(trigger.getAttribute('aria-controls')).toBe(panel.id)
		expect(panel.id).toBeTruthy()
	})

	it('после кадра набор в поле доходит до значения DatePicker', async () => {
		const container = serve(markupOf('date-picker-value'))

		hydrateServed(container, DatePickerValue, {})
		await nextFrame()

		const day = find(container, '.so-date-input__segment[data-type="day"]', HTMLElement)

		day.focus()
		press(day, '1')
		press(day, '5')

		expect(day.textContent).toBe('15')
		expect(find(container, 'input[type="hidden"]', HTMLInputElement).value).toBe('2026-09-15')
	})
})

describe('Calendar · гидратация', () => {
	/** Панель выбора месяца и года первой сетки. */
	const pickerPanel = (scope: ParentNode) =>
		find(
			scope,
			'.so-calendar__month > .so-calendar__heading > .so-popover__panel[data-contained="true"]',
			HTMLElement,
		)

	it('разметка календаря — узлы сервера', () => {
		const container = serve(markupOf('calendar-value'))
		const served = [...container.querySelectorAll('*')]

		hydrateServed(container, CalendarValue, {})

		expectServedNodes([...container.querySelectorAll('*')], served)
	})

	it('панель выбора месяца и года — узел сервера, прямой потомок корня поповера в заголовке', () => {
		const container = serve(markupOf('calendar-value'))
		const panel = pickerPanel(container)

		hydrateServed(container, CalendarValue, {})

		expect(pickerPanel(container)).toBe(panel)
	})

	it('id частей календаря и ссылки на них — от сервера', () => {
		const container = serve(markupOf('calendar-value'))
		const ids = idsOf(container)

		hydrateServed(container, CalendarValue, {})

		expect(ids.length).toBeGreaterThan(0)
		expect(idsOf(container)).toEqual(ids)
	})

	/** Панель сервера живая: заголовок открывает её на месте, тем же узлом. */
	it('после кадра заголовок открывает панель сервера на месте', async () => {
		const container = serve(markupOf('calendar-value'))
		const panel = pickerPanel(container)

		hydrateServed(container, CalendarValue, {})
		await nextFrame()

		find(container, '.so-calendar__title', HTMLElement).click()
		await nextFrame()

		expect(pickerPanel(container)).toBe(panel)
		expect(panel.dataset['open']).toBe('true')
		expect(panel.querySelectorAll('.so-calendar__picker-list .so-list-box-item')).toHaveLength(
			12,
		)
	})
})
