/**
 * DateInput в React — проводка на настоящей разметке.
 *
 * Сценарии — те же, что у Vue (`date-input.spec.ts`). Модель — набор,
 * вставка, формат локали — проверяет ядро, клавиши и буфер обмена — тест
 * плагинов, протяжку мышью, выделение и настоящий буфер — браузер
 * (`playground/vue/browser/date-input.spec.ts`). Здесь важно, что выходы ядра
 * доезжают туда, куда должны: части и разделители — в ряд в порядке формата,
 * наборы части — на её узел, `dir` и `lang` — на ряд, значение — в скрытое
 * поле, а клавиши на настоящей разметке доходят до модели и возвращаются
 * `onChangeValue`.
 *
 * Своё у React — текст и атрибуты части. Текст — единственный ребёнок части,
 * строка: React пишет его свойством узла и своих узлов-детей не держит, —
 * поэтому часть, которую браузер на касании оставил пустой, получает текст
 * ядра целиком. Атрибуты касания (`contenteditable`, `spellcheck`,
 * `autocorrect`, `inputmode`) уходят пропами React, а у редактируемой части с
 * текстом предупреждение о `contentEditable` снято: любое предупреждение в
 * консоли роняет тест (сторож консоли в `setup.ts`). Отсюда же группа
 * «React»: StrictMode, серверная разметка и гидратация.
 *
 * Язык поля — тег локали поддерева (`LocaleProvider`), своего у поля нет:
 * здесь он русский, а тест на другом языке задаёт свою локаль провайдеру.
 * Обновления — внутри `act`: событие, сменившее состояние мимо него, роняет
 * тест сторожем консоли.
 */

import { describe, it, expect, vi } from 'vitest'
import { StrictMode, act, useState, type ReactElement, type ReactNode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import type { IDateInput, TDateInputKind, TTimePrecision } from '@soxa-ui/core'
import { arEG, enUS, ruRU, type TLocale } from '@soxa-ui/plugins'
import { DateInput, LocaleProvider, type DateInputProps } from '@soxa-ui/react'
import { find, mount, nextFrame, track } from './mount'

/** Значение поля даты: строка даты или даты со временем, пусто — `undefined`. */
type TValue = string | undefined

/** Разметка в провайдере локали: здесь русской, тест на другом языке задаёт свою. */
const inLocale = (content: ReactNode, locale: TLocale = ruRU): ReactElement => (
	<LocaleProvider locale={locale}>{content}</LocaleProvider>
)

/**
 * Смонтировать разметку в провайдере локали и дождаться кадра: корень плагины
 * получают через `requestAnimationFrame`. Перерисовка — тем же корнем, так
 * родитель меняет пропсы и локаль.
 */
async function render(content: ReactNode, locale: TLocale = ruRU) {
	const mounted = mount(inLocale(content, locale))

	await nextFrame()

	return {
		rerender: (next: ReactNode, nextLocale: TLocale = locale) =>
			mounted.render(inLocale(next, nextLocale)),
	}
}

/**
 * Поле, чьё значение возвращается пропом, — как `v-model` у Vue: значение
 * держит состояние родителя, а смена приходит `onChangeValue`.
 */
function Controlled({
	onValue,
	...props
}: DateInputProps & { onValue?: (value: TValue) => void }): ReactElement {
	const [value, setValue] = useState<TValue>(props.value)

	return (
		<DateInput
			{...props}
			value={value}
			onChangeValue={(payload) => {
				setValue(payload.newValue)
				onValue?.(payload.newValue)
			}}
		/>
	)
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

/** Узлы ряда по порядку: класс и текст. */
const rowContent = () =>
	[...node('.so-date-input__segments').children].map((part) => [part.className, part.textContent])

/** Тексты ряда по порядку. */
const rowTexts = () => rowContent().map(([, text]) => text)

/** Фокус меняет состояние поля — внутри `act`. */
function focus(target: HTMLElement): void {
	act(() => target.focus())
}

/** Нажатие клавиши с узла, как у пользователя: событие всплывает до корня. */
function press(from: Element, key: string): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

	act(() => {
		from.dispatchEvent(event)
	})

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

/** Клик мышью — внутри `act`: он меняет состояние поля. */
function click(target: HTMLElement): void {
	act(() => target.click())
}

/** Нажатие указателем по узлу, как его шлёт браузер. */
function pointerDown(from: Element, pointerType: string): void {
	act(() => {
		from.dispatchEvent(new PointerEvent('pointerdown', { pointerType, bubbles: true }))
	})
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
		await render(<DateInput aria_label="Дата рождения" />)

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
		expect(node('.so-date-input__segments').getAttribute('dir')).toBe('ltr')
		expect(node('.so-date-input__segments').getAttribute('lang')).toBe('ru-RU')
	})

	it('часть — spinbutton со своей остановкой Tab, разделитель скрыт от скринридера', async () => {
		await render(<DateInput value="2026-05-12" />)

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
		await render(<DateInput value="2026-05-12" />, arEG)

		expect(node('.so-date-input__segments').getAttribute('dir')).toBe('rtl')
		expect(rowTexts()).toEqual(formatted('ar-EG', '2026-05-12'))
	})

	it('выключенное поле — частей вне порядка Tab, скрытое поле выключено', async () => {
		await render(<DateInput disabled name="birthday" value="2026-05-12" />)

		expect(nodes('.so-date-input__segment[tabindex]')).toEqual([])
		expect(node('.so-date-input').dataset['disabled']).toBe('true')
		expect(hidden().hasAttribute('disabled')).toBe(true)
	})

	it('дата вне min/max — data-invalid у корня и aria-invalid у частей', async () => {
		await render(<DateInput value="2026-05-12" max="2026-01-01" />)

		expect(node('.so-date-input').dataset['invalid']).toBe('true')
		expect(segment('year').getAttribute('aria-invalid')).toBe('true')
	})

	it('порядок узлов — как у Vue: leading, ряд частей, обёртка у конца, скрытое поле', async () => {
		await render(
			<DateInput
				clearable
				leading={<i>с</i>}
				trailing={<button className="so-test-calendar" />}
			/>,
		)

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
		await render(<DateInput id="when" className="mine" data-probe="1" title="Дата" />)

		const root = node('.so-date-input')

		expect(root.id).toBe('when')
		expect([...root.classList].at(-1)).toBe('mine')
		expect(root.dataset['probe']).toBe('1')
		expect(root.title).toBe('Дата')
	})
})

describe('DateInput · скрытое поле формы', () => {
	it('имя и значение — дата строкой; недописанная дата — пусто', async () => {
		await render(<Controlled name="birthday" value="2026-05-12" />)

		expect(hidden().getAttribute('name')).toBe('birthday')
		expect(hidden().value).toBe('2026-05-12')

		focus(segment('day'))
		press(segment('day'), 'Delete')

		expect(hidden().value).toBe('')
	})
})

describe('DateInput · управляемое значение', () => {
	it('набор с клавиатуры возвращает дату через onChangeValue', async () => {
		const onValue = vi.fn()

		await render(<Controlled onValue={onValue} />)

		focus(segment('day'))
		type('12052026')

		expect(onValue).toHaveBeenLastCalledWith('2026-05-12')
		expect(rowTexts()).toEqual(['12', '.', '05', '.', '2026'])
		expect(document.activeElement).toBe(segment('year'))
	})

	it('значение снаружи — части из него', async () => {
		const { rerender } = await render(<DateInput value="2026-05-12" />)

		rerender(<DateInput value="2027-01-02" />)

		expect(rowTexts()).toEqual(['02', '.', '01', '.', '2027'])
	})

	it('набор не пересоздаёт узлы частей: часть и фокус на ней — те же', async () => {
		await render(<Controlled />)

		const [day, month] = [segment('day'), segment('month')]

		focus(day)
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

	/**
	 * На касании часть редактируемая, и браузер правит её сам — композиция,
	 * клавиатура, которая стирает и после погашенного Backspace, — оставляя
	 * часть пустой. Текст части — единственный ребёнок-строка: React пишет его
	 * свойством узла, и следующий текст ядра заменяет содержимое целиком, а не
	 * уходит в текстовый узел, которого уже нет.
	 */
	it('часть, которую браузер оставил пустой, получает текст ядра одним узлом', async () => {
		await render(<Controlled />)

		const day = segment('day')

		focus(day)
		type('1')
		day.replaceChildren()

		type('2')

		expect(day.textContent).toBe('12')
		expect(day.childNodes).toHaveLength(1)
	})
})

/**
 * Ноль, с которого день не начинается, числа не даёт, но виден в части, пока
 * фокус на ней. Ряд перечитывается по `change:segments` ядра, а не по смене
 * фокуса: ушёл фокус с нулей — ядро само сообщает, что их сменила подсказка.
 */
describe('DateInput · набранный ноль', () => {
	it('клавиша «0» на дне — в части «0»; фокус ушёл на месяц — у дня снова подсказка', async () => {
		await render(<DateInput />)

		focus(segment('day'))
		type('0')

		expect(segment('day').textContent).toBe('0')
		expect(segment('day').dataset['placeholder']).toBe('false')
		expect(segment('day').getAttribute('aria-valuetext')).toBe('0')
		expect(segment('day').hasAttribute('aria-valuenow')).toBe(false)
		expect(document.activeElement).toBe(segment('day'))

		focus(segment('month'))

		expect(segment('day').textContent).toBe('дд')
		expect(segment('day').dataset['placeholder']).toBe('true')
	})

	it('«00» на дне без validate — день 00, фокус уходит на месяц', async () => {
		await render(<DateInput />)

		focus(segment('day'))
		type('00')

		expect(segment('day').textContent).toBe('00')
		expect(document.activeElement).toBe(segment('month'))
	})

	it('«00» на дне с validate — фокус стоит, часть ждёт цифры', async () => {
		await render(<DateInput validate />)

		focus(segment('day'))
		type('00')

		expect(segment('day').textContent).toBe('00')
		expect(document.activeElement).toBe(segment('day'))
	})
})

describe('DateInput · время', () => {
	it('en-US: час, минута и период суток — в ряду в порядке формата, значение — в скрытом поле', async () => {
		await render(<DateInput kind="datetime" name="meeting" value="2026-05-12T14:30" />, enUS)

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
		await render(<DateInput kind="datetime" />)

		expect(rowTexts()).toEqual(['дд', '.', 'мм', '.', 'гггг', ', ', '––', ':', '––'])
		expect(document.querySelector('[data-type="dayPeriod"]')).toBeNull()
	})

	it('набор времени с клавиатуры возвращает дату со временем через onChangeValue', async () => {
		const onValue = vi.fn()

		await render(<Controlled kind="datetime" onValue={onValue} />)

		focus(segment('day'))
		type('120520261430')

		expect(onValue).toHaveBeenLastCalledWith('2026-05-12T14:30')
		expect(document.activeElement).toBe(segment('minute'))
	})

	it('смена вида: части времени появляются, значение — в новом виде', async () => {
		const values: TValue[] = []
		const view = (kind: TDateInputKind) => (
			<Controlled
				kind={kind}
				value="2026-05-12T14:30"
				onValue={(value) => values.push(value)}
			/>
		)
		const { rerender } = await render(view('datetime'))

		rerender(view('date'))

		expect(values.at(-1)).toBe('2026-05-12')
		expect(rowTexts()).toEqual(['12', '.', '05', '.', '2026'])

		// Время осталось в частях и вернулось
		rerender(view('datetime'))

		expect(values.at(-1)).toBe('2026-05-12T14:30')
		expect(segment('minute').textContent).toBe('30')
	})

	it('до секунды: секунда в ряду за минутой, значение — в скрытом поле', async () => {
		await render(
			<DateInput
				kind="datetime"
				timePrecision="second"
				name="meeting"
				value="2026-05-12T14:30:15"
			/>,
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

		await render(
			<Controlled
				kind="datetime"
				timePrecision="second"
				onValue={(value) => values.push(value)}
			/>,
		)

		focus(segment('day'))
		type('120520261430')

		expect(document.activeElement).toBe(segment('second'))
		expect(values).toEqual([])

		type('15')

		expect(values.at(-1)).toBe('2026-05-12T14:30:15')
	})

	it('смена точности: секунда появляется и пропадает, значение — в новой точности', async () => {
		const values: TValue[] = []
		const view = (timePrecision: TTimePrecision) => (
			<Controlled
				kind="datetime"
				timePrecision={timePrecision}
				value="2026-05-12T14:30:15"
				onValue={(value) => values.push(value)}
			/>
		)
		const { rerender } = await render(view('minute'))

		const minute = segment('minute')

		expect(document.querySelector('[data-type="second"]')).toBeNull()

		// Секунда записанного значения была скрыта в частях: значение то же, а
		// ряд перечитывается по смене точности
		rerender(view('second'))

		expect(values).toEqual([])
		expect(segment('second').textContent).toBe('15')
		// Узел минуты тот же: часть ключуется типом
		expect(segment('minute')).toBe(minute)

		rerender(view('minute'))

		expect(values.at(-1)).toBe('2026-05-12T14:30')
		expect(document.querySelector('[data-type="second"]')).toBeNull()

		// Секунда осталась в частях и вернулась
		rerender(view('second'))

		expect(values.at(-1)).toBe('2026-05-12T14:30:15')
		expect(segment('second').textContent).toBe('15')
	})
})

describe('DateInput · смена локали поддерева', () => {
	it('часть меняет место, а её узел остаётся тем же', async () => {
		const { rerender } = await render(<DateInput value="2026-05-12" />)

		const day = segment('day')
		const segments = node('.so-date-input__segments')

		rerender(<DateInput value="2026-05-12" />, enUS)

		expect(segment('day')).toBe(day)
		expect(node('.so-date-input__segments')).toBe(segments)
		expect(rowTexts()).toEqual(formatted('en-US', '2026-05-12'))
	})
})

describe('DateInput · сенсорный режим', () => {
	/**
	 * Атрибуты касания пишет плагин в наборы частей, а разметка отдаёт их React
	 * пропами (`contentEditable`, `spellCheck`, `autoCorrect`, `inputMode`):
	 * имена HTML React ругал бы в консоль, а у редактируемой части с текстом —
	 * ещё и `contentEditable` с детьми. Сторож консоли роняет тест на любое
	 * такое предупреждение.
	 */
	it('касание делает части редактируемыми без предупреждений, нажатие мышью — снова нет', async () => {
		await render(<DateInput value="2026-05-12" />)

		const month = segment('month')

		pointerDown(month, 'touch')

		expect(
			nodes('.so-date-input__segment').map((part) => [
				part.getAttribute('contenteditable'),
				part.getAttribute('inputmode'),
				part.getAttribute('spellcheck'),
				part.getAttribute('autocorrect'),
			]),
		).toEqual([
			['true', 'numeric', 'false', 'off'],
			['true', 'numeric', 'false', 'off'],
			['true', 'numeric', 'false', 'off'],
		])
		// Узел и текст части — те же: перерисовались только атрибуты
		expect(segment('month')).toBe(month)
		expect(month.textContent).toBe('05')

		pointerDown(month, 'mouse')

		expect(nodes('.so-date-input__segment[contenteditable]')).toEqual([])
		expect(nodes('.so-date-input__segment[inputmode]')).toEqual([])
		expect(nodes('.so-date-input__segment[spellcheck]')).toEqual([])
		expect(nodes('.so-date-input__segment[autocorrect]')).toEqual([])
	})

	it('ввод экранной клавиатуры возвращает дату через onChangeValue', async () => {
		const onValue = vi.fn()

		await render(<Controlled onValue={onValue} />)

		pointerDown(segment('day'), 'touch')
		focus(segment('day'))

		for (const data of ['12', '05', '2026']) {
			const active = document.activeElement

			if (!active) throw new Error('фокуса нет')

			const event = new InputEvent('beforeinput', {
				inputType: 'insertText',
				data,
				bubbles: true,
				cancelable: true,
			})

			act(() => {
				active.dispatchEvent(event)
			})
			expect(event.defaultPrevented).toBe(true)
		}

		expect(onValue).toHaveBeenLastCalledWith('2026-05-12')
		expect(rowTexts()).toEqual(['12', '.', '05', '.', '2026'])
	})

	it('у каждой части свой id — от монтирования и типа части', async () => {
		await render(<DateInput />)

		const parts = nodes('.so-date-input__segment')

		expect(parts.every((part) => part.id.endsWith(`-${part.dataset['type']}`))).toBe(true)
		expect(new Set(parts.map((part) => part.id)).size).toBe(3)
	})
})

describe('DateInput · слоты', () => {
	it('leading и trailing получают инстанс поля; без слота обёртки нет', async () => {
		const seen: IDateInput[] = []

		await render(
			<DateInput
				trailing={({ ctrl }: { ctrl: IDateInput }) => {
					seen.push(ctrl)

					return <button className="so-test-calendar">Календарь</button>
				}}
			/>,
		)

		expect(node('.so-date-input__trailing').querySelector('.so-test-calendar')).not.toBeNull()
		expect(document.querySelector('.so-date-input__leading')).toBeNull()
		expect(seen.at(-1)?.locale).toBe('ru-RU')
	})

	it('клавиши кнопки в слоте — не поля', async () => {
		await render(
			<DateInput
				value="2026-05-12"
				trailing={<button className="so-test-calendar">Календарь</button>}
			/>,
		)

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
		await render(<DateInput value="2026-05-12" />)

		expect(document.querySelector('.so-date-input__clear')).toBeNull()
		expect(document.querySelector('.so-date-input__trailing')).toBeNull()
	})

	it('по clearable — первой в обёртке у конца, перед кнопкой календаря', async () => {
		await render(
			<DateInput
				clearable
				name="Дата"
				trailing={<button className="so-test-calendar">Календарь</button>}
			/>,
		)

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

		await render(
			<Controlled clearable value="2026-05-12" onValue={onValue} onClick={rootClick} />,
		)

		click(node('.so-date-input__clear'))

		expect(onValue).toHaveBeenLastCalledWith(undefined)
		expect(nodes('.so-date-input__segment').map((part) => part.dataset['placeholder'])).toEqual(
			['true', 'true', 'true'],
		)
		expect(hidden().value).toBe('')
		expect(rootClick).not.toHaveBeenCalled()
	})

	it('выключена вместе с полем, readonly её не гасит', async () => {
		const view = (disabled: boolean) => (
			<DateInput clearable readonly disabled={disabled} value="2026-05-12" />
		)
		const { rerender } = await render(view(false))

		expect(node('.so-date-input__clear').hasAttribute('disabled')).toBe(false)

		rerender(view(true))

		expect(node('.so-date-input__clear').hasAttribute('disabled')).toBe(true)
	})

	it('своя кнопка — слот clear с командой очистки в scope, без clearable', async () => {
		await render(
			<DateInput
				value="2026-05-12"
				clear={({ clear }: { clear: () => void }) => (
					<button className="so-test-clear" onClick={() => clear()} />
				)}
			/>,
		)

		click(node('.so-test-clear'))

		expect(document.querySelector('.so-date-input__trailing > .so-test-clear')).not.toBeNull()
		expect(document.querySelector('.so-date-input__clear')).toBeNull()
		expect(
			nodes('.so-date-input__segment').every(
				(part) => part.dataset['placeholder'] === 'true',
			),
		).toBe(true)
	})
})

/**
 * Своё у React: сборка под StrictMode повторяется, а сервер рисует части без
 * плагинов узла — гидратация обязана сойтись с ним до узла.
 */
describe('DateInput · React', () => {
	it('StrictMode: набор доходит до значения, узлы частей те же', async () => {
		const onValue = vi.fn()

		mount(<StrictMode>{inLocale(<Controlled onValue={onValue} />)}</StrictMode>)
		await nextFrame()

		const day = segment('day')

		focus(day)
		type('12052026')

		expect(onValue).toHaveBeenLastCalledWith('2026-05-12')
		expect(segment('day')).toBe(day)
		expect(rowTexts()).toEqual(['12', '.', '05', '.', '2026'])
	})

	/**
	 * Сервер и браузер в одном процессе: рендер сервера и гидратация — одна
	 * разметка. `id` частей — от `useId`, и у сервера и браузера они одни;
	 * части сервер рисует нередактируемыми.
	 */
	it('сервер и гидратация: разметка сходится, id частей те же, части нередактируемы', async () => {
		const element = inLocale(<DateInput name="birthday" value="2026-05-12" />)
		const container = document.createElement('div')
		const onRecoverableError = vi.fn()

		container.innerHTML = renderToString(element)
		document.body.append(container)

		const server = nodes('.so-date-input__segment')
		const ids = server.map((part) => part.id)

		expect(ids.every((id) => id !== '')).toBe(true)
		expect(server.map((part) => part.textContent)).toEqual(['12', '05', '2026'])
		expect(nodes('.so-date-input__segment[contenteditable]')).toEqual([])

		act(() => {
			track(hydrateRoot(container, element, { onRecoverableError }))
		})
		await nextFrame()

		expect(onRecoverableError).not.toHaveBeenCalled()
		// Узлы — по ссылке: части сервера остались теми же узлами
		expect(
			nodes('.so-date-input__segment').every((part, index) => part === server[index]),
		).toBe(true)
		expect(nodes('.so-date-input__segment').map((part) => part.id)).toEqual(ids)
		expect(nodes('.so-date-input__segment[contenteditable]')).toEqual([])
		expect(hidden().value).toBe('2026-05-12')
	})
})
