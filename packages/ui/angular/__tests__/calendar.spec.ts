/**
 * Calendar под Angular — проводка целиком, на настоящей разметке.
 *
 * Сценарии — те же, что у Vue (`calendar.spec.ts`), Svelte и React; `v-model`
 * Vue здесь — выходы `(soChangeValue)` и `(soChangeMonths)`, которые хост
 * возвращает входами. Модель — сетки, выбор, фокус, листание — проверяет ядро,
 * клавиши и указатель — тесты плагинов, раскладку и фокус в браузере —
 * `playground/vue/browser`. Здесь важно, что выходы коллекции доезжают туда,
 * куда должны: сетки — в таблицы, наборы дня — на его ячейку, выключенность —
 * на кнопки, а нажатия и клавиши на настоящей разметке доходят до модели и
 * возвращаются выходами.
 *
 * Своё у Angular — разметка и узлы. Корень — сам `<div so-calendar>`, день —
 * `<td so-calendar-item>`, атрибутом на ячейке: чужой тег внутри `table`
 * браузер выкинул бы. Блок месяца ключуется местом сетки, поэтому кнопка
 * заголовка, её поповер и живая область — те же узлы при листании и выборе
 * месяца. Текст дня, подписей и заголовка — свойство узла (`[textContent]`),
 * без пробелов по краям. Слоты — шаблоны (`<ng-template slot="item"
 * let-item="item" let-text="text">`).
 *
 * Сегодня во всех тестах — суббота 2026-09-26, как в тестах ядра.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { Component, signal, type Type } from '@angular/core'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import {
	TCalendar,
	TListBox,
	createEngineCalendar,
	type TCalendarCollection,
	type TCalendarDate,
	type TCalendarMode,
	type TCalendarUnavailable,
	type TCalendarValue,
	type TValuePayload,
} from '@soxa-ui/core'
import { ruRU } from '@soxa-ui/plugins'
import { LocaleProviderDirective, SlotDirective, TCalendarComponent } from '@soxa-ui/angular'
import { countAssemblies, type TAssemblyProbe } from './assemblies'
import { find, nextFrame } from './mount'

/** Смонтированный хост теста — его перепроверяют действия. */
let current: ComponentFixture<unknown> | null = null

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['Date'] })
	vi.setSystemTime(new Date(2026, 8, 26, 12))
})

afterEach(() => {
	current = null
	vi.useRealTimers()
	vi.restoreAllMocks()
})

/**
 * Смонтировать хост и дождаться кадра: корень плагины получают через
 * `requestAnimationFrame`. `prepare` задаёт входы до первой отрисовки — так,
 * как они стоят в разметке с самого начала.
 */
async function render<T>(host: Type<T>, prepare?: (page: T) => void): Promise<ComponentFixture<T>> {
	const fixture = TestBed.createComponent(host)

	current = fixture
	prepare?.(fixture.componentInstance)
	fixture.detectChanges()

	await settle()

	return fixture
}

/**
 * Перепроверить хост: событие дошло до ядра и его состояния, а разметку
 * приложение без Zone.js перепроверяет на своём такте — тест делает это сразу.
 */
function check(): void {
	current?.detectChanges()
}

/** Перерисовка и кадр: новые дни объявляют узлы кадром позже. */
async function settle(): Promise<void> {
	check()
	await nextFrame()
	check()
}

/** Узел по селектору в документе. */
const node = (selector: string) => find(document, selector, HTMLElement)

function nodes(selector: string): HTMLElement[] {
	return [...document.querySelectorAll(selector)].filter(
		(element): element is HTMLElement => element instanceof HTMLElement,
	)
}

/** Ячейка дня по его имени — полной дате в локали, как её прочтёт скринридер. */
function dayCell(date: string): HTMLElement {
	const label = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeZone: 'UTC' }).format(
		Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8))),
	)

	return node(`.so-calendar-item[aria-label="${label}"]`)
}

/** Текст заголовков — как есть: пробелов по краям у него нет. */
const titles = () => nodes('.so-calendar__title').map((title) => title.textContent)
const weekdays = () => nodes('.so-calendar__weekday').map((cell) => cell.textContent)

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
	check()

	return event
}

/**
 * Часть узла — его класс элемента БЭМ (`so-calendar__prev`). Классы ядра база
 * Angular кладёт после статики разметки, и последний класс у детали — её
 * модификатор (`so-button--size-normal`), а не часть, как у Vue.
 */
const partsOf = (element: Element) =>
	[...element.children].map((child) => [...child.classList].find((name) => name.includes('__')))

/** Текст между узлами — пробел, который интерполяция с отступом оставила бы. */
const textsOf = (element: Element) =>
	[...element.childNodes].filter((child) => child instanceof Text && child.data.length > 0)

/**
 * Календарь: значение и месяцы сеток — по-настоящему, потребитель возвращает
 * их входами, как `v-model` и `v-model:months`. Входы — сигналы: хост
 * `OnPush`, и смена входа — смена сигнала; неопределённый сигнал — вход не
 * задан.
 */
@Component({
	selector: 'probe-calendar-page',
	standalone: true,
	imports: [TCalendarComponent],
	template: `<div
		so-calendar
		[ctrl]="ctrl()"
		[engine]="engine()"
		[value]="value()"
		[mode]="mode()"
		[months]="months()"
		[min]="min()"
		[max]="max()"
		[disabled]="disabled()"
		[unavailable]="unavailable()"
		(soChangeValue)="change($event)"
		(soChangeMonths)="months.set($event.newValue)"
	></div>`,
})
class Page {
	readonly ctrl = signal<TCalendar | undefined>(undefined)
	readonly engine = signal<TCalendarCollection | undefined>(undefined)
	readonly value = signal<TCalendarValue>(undefined)
	readonly mode = signal<TCalendarMode | undefined>(undefined)
	readonly months = signal<TCalendarDate[] | undefined>(undefined)
	readonly min = signal<string | undefined>(undefined)
	readonly max = signal<string | undefined>(undefined)
	readonly disabled = signal<boolean | undefined>(undefined)
	readonly unavailable = signal<TCalendarUnavailable | undefined>(undefined)

	change(payload: TValuePayload<TCalendarValue>): void {
		this.value.set(payload.newValue)
	}
}

/** Календарь, который хост снимает: `@if` вокруг него. */
@Component({
	selector: 'probe-calendar-removable',
	standalone: true,
	imports: [TCalendarComponent],
	template: `@if (shown()) {
		<div so-calendar [ctrl]="ctrl" [engine]="engine"></div>
	}`,
})
class RemovableHost {
	readonly ctrl = new TCalendar()
	readonly engine = createEngineCalendar()
	readonly shown = signal(true)
}

/** Календарь в провайдере русской локали. */
@Component({
	selector: 'probe-calendar-russian',
	standalone: true,
	imports: [TCalendarComponent, LocaleProviderDirective],
	template: `<ng-container so-locale-provider [locale]="locale">
		<div so-calendar></div>
	</ng-container>`,
})
class RussianHost {
	readonly locale = ruRU
}

/** Атрибуты потребителя на корне: `id` у календаря — не вход, а атрибут. */
@Component({
	selector: 'probe-calendar-attrs',
	standalone: true,
	imports: [TCalendarComponent],
	template: `<div so-calendar id="agenda" class="mine" title="Календарь"></div>`,
})
class AttrsHost {}

/** Подвал — шаблон `footer`, два месяца. */
@Component({
	selector: 'probe-calendar-footer',
	standalone: true,
	imports: [TCalendarComponent, SlotDirective],
	template: `<div so-calendar [months]="months">
		<ng-template slot="footer"
			><button type="button" class="so-test-action">Готово</button></ng-template
		>
	</div>`,
})
class FooterHost {
	readonly months = ['2026-01-01', '2026-09-01']
}

/** Содержимое дня — шаблон `item`: scope — сам день. */
@Component({
	selector: 'probe-calendar-item-scope',
	standalone: true,
	imports: [TCalendarComponent, SlotDirective],
	template: `<div so-calendar>
		<ng-template slot="item" let-item="item"
			><span class="so-test-day">{{ item.text }}·{{ item.date.slice(5) }}</span></ng-template
		>
	</div>`,
})
class ItemScopeHost {}

/** Содержимое дня — шаблон `item`: в scope и номер дня — scope слота самого дня. */
@Component({
	selector: 'probe-calendar-item-text',
	standalone: true,
	imports: [TCalendarComponent, SlotDirective],
	template: `<div so-calendar>
		<ng-template slot="item" let-text="text"
			><span class="so-test-day">«{{ text }}»</span></ng-template
		>
	</div>`,
})
class ItemTextHost {}

/** Значки кнопок листания — свои шаблоны. */
@Component({
	selector: 'probe-calendar-icons',
	standalone: true,
	imports: [TCalendarComponent, SlotDirective],
	template: `<div so-calendar>
		<ng-template slot="prev-icon"><i class="so-test-prev"></i></ng-template>
		<ng-template slot="next-icon"><i class="so-test-next"></i></ng-template>
	</div>`,
})
class IconsHost {}

describe('разметка', () => {
	it('кнопки листания — за заголовком первого месяца, сетка — таблица с шапкой дней недели', async () => {
		await render(Page)

		const root = node('.so-calendar')

		// Подвала без шаблона нет
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
		await render(Page)

		const title = node('.so-calendar__title-text')
		const grid = node('.so-calendar__grid')

		expect(title.textContent).toBe('September 2026')
		expect(title.getAttribute('aria-live')).toBe('polite')
		expect(grid.getAttribute('role')).toBe('grid')
		expect(grid.getAttribute('aria-labelledby')).toBe(title.id)
		expect(title.id).not.toBe('')
	})

	it('день — ячейка с номером и именем; заполнитель — пустая ячейка, скрытая от скринридера', async () => {
		await render(Page)

		const fillers = nodes('.so-calendar__filler')
		const days = nodes('.so-calendar-item')

		// Сентябрь 2026 с воскресенья: 2 дня августа, 3 дня октября
		expect(fillers).toHaveLength(5)
		expect(fillers.every((cell) => cell.getAttribute('aria-hidden') === 'true')).toBe(true)
		expect(fillers.every((cell) => cell.textContent === '')).toBe(true)
		expect(days).toHaveLength(30)
		expect(days.every((cell) => cell.localName === 'td')).toBe(true)
		expect(dayCell('2026-09-05').textContent).toBe('5')
	})

	it('остановка Tab одна, у дня с фокусом; сегодня отмечено', async () => {
		await render(Page)

		const stops = nodes('.so-calendar-item[tabindex="0"]')

		expect(stops).toEqual([dayCell('2026-09-26')])
		expect(dayCell('2026-09-26').dataset['today']).toBe('true')
		expect(dayCell('2026-09-26').getAttribute('aria-current')).toBe('date')
	})

	it('несколько месяцев — сетка на каждый, у каждого свой заголовок; кнопки листания — одни, у первого', async () => {
		await render(Page, (page) => page.months.set(['2026-01-01', '2026-09-01']))

		const [january, september] = nodes('.so-calendar__month')

		expect(titles()).toEqual(['January 2026', 'September 2026'])
		expect(nodes('.so-calendar__grid')).toHaveLength(2)
		expect(nodes('.so-calendar__prev')).toHaveLength(1)
		expect(nodes('.so-calendar__next')).toHaveLength(1)
		expect(january?.contains(prev())).toBe(true)
		expect(partsOf(september ?? node('.so-calendar'))).toEqual([
			'so-calendar__heading',
			'so-calendar__grid',
		])
	})

	it('слот footer — подвал после ряда месяцев, своей строкой', async () => {
		await render(FooterHost)

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
		await render(RussianHost)

		// Короткие имена: у ru-RU они различимы, а узкие повторялись бы —
		// понедельник и пятница — «П»
		expect(weekdays()).toEqual(shortWeek('ru-RU', 1))
	})

	it('слот item — своё содержимое дня; scope — сам день', async () => {
		await render(ItemScopeHost)

		expect(dayCell('2026-09-05').querySelector('.so-test-day')?.textContent).toBe('5·09-05')
	})

	/**
	 * Слот `item` — проброс слота дня: рядом с днём в scope и то, что отдаёт
	 * слот самого дня, — номер в цифрах локали.
	 */
	it('слот item получает и номер дня — scope слота самого дня', async () => {
		await render(ItemTextHost)

		expect(dayCell('2026-09-05').querySelector('.so-test-day')?.textContent).toBe('«5»')
	})

	it('без слота день рисует свой номер в плитке', async () => {
		await render(Page)

		expect(dayCell('2026-09-05').querySelector('.so-calendar-item__day')?.textContent).toBe('5')
	})

	it('атрибуты снаружи — корню календаря', async () => {
		await render(AttrsHost)

		const root = node('.so-calendar')

		expect(root.id).toBe('agenda')
		expect(root.classList.contains('mine')).toBe(true)
		expect(root.classList.contains('so-calendar')).toBe(true)
		expect(root.title).toBe('Календарь')
	})

	/**
	 * Текст заголовка, подписей колонок и номера дня — свойство узла: от
	 * интерполяции с отступом Angular оставил бы пробелы по краям.
	 */
	it('текст дня, подписей и заголовка — без пробелов, между узлами текста нет', async () => {
		await render(FooterHost)

		expect(nodes('.so-calendar__title-text').map((title) => title.textContent)).toEqual([
			'January 2026',
			'September 2026',
		])
		// Подписи колонок — у каждой сетки свои, по месту
		expect(weekdays()).toEqual([...shortWeek('en-US', 0), ...shortWeek('en-US', 0)])
		expect(
			nodes('.so-calendar-item__day').every(
				(day) => day.textContent === day.textContent?.trim(),
			),
		).toBe(true)

		for (const scope of [
			'.so-calendar',
			'.so-calendar__months',
			'.so-calendar__month',
			'.so-calendar__weekdays',
			'.so-calendar__week',
			'.so-calendar__footer',
		]) {
			expect(textsOf(node(scope))).toEqual([])
		}
	})
})

describe('кнопки листания', () => {
	it('имена — от локали поддерева, без провайдера — английские', async () => {
		await render(Page)

		expect(prev().getAttribute('aria-label')).toBe('Previous month')
		expect(next().getAttribute('aria-label')).toBe('Next month')
	})

	it('имена — на языке локали поддерева', async () => {
		await render(RussianHost)

		expect(prev().getAttribute('aria-label')).toBe('Предыдущий месяц')
		expect(next().getAttribute('aria-label')).toBe('Следующий месяц')
	})

	it('значки — свои шаблоны prev-icon и next-icon вместо иконки роли', async () => {
		await render(IconsHost)

		expect(prev().querySelector('.so-test-prev')).not.toBeNull()
		expect(next().querySelector('.so-test-next')).not.toBeNull()
		expect(prev().querySelector('svg')).toBeNull()
	})

	it('у границы кнопка гаснет, в другую сторону — нет', async () => {
		await render(Page, (page) => {
			page.min.set('2026-09-10')
			page.max.set('2026-10-20')
		})

		expect(prev().hasAttribute('disabled')).toBe(true)
		expect(next().hasAttribute('disabled')).toBe(false)

		next().click()
		await settle()

		expect(titles()).toEqual(['October 2026'])
		expect(prev().hasAttribute('disabled')).toBe(false)
		expect(next().hasAttribute('disabled')).toBe(true)
	})

	it('выключенный календарь гасит обе кнопки и дни', async () => {
		await render(Page, (page) => page.disabled.set(true))

		expect(prev().hasAttribute('disabled')).toBe(true)
		expect(next().hasAttribute('disabled')).toBe(true)
		expect(node('.so-calendar').dataset['disabled']).toBe('true')
		expect(nodes('.so-calendar-item[data-disabled="false"]')).toEqual([])
	})

	it('граница, заданная инстансу, гасит кнопку и без листания', async () => {
		const ctrl = new TCalendar()

		await render(Page, (page) => page.ctrl.set(ctrl))
		expect(prev().hasAttribute('disabled')).toBe(false)

		ctrl.min = '2026-09-03'
		await settle()

		expect(prev().hasAttribute('disabled')).toBe(true)
	})

	it('листание пишет months — выход soChangeMonths', async () => {
		const fixture = await render(Page)

		next().click()
		await settle()

		expect(fixture.componentInstance.months()).toEqual(['2026-10-01'])
		expect(titles()).toEqual(['October 2026'])

		prev().click()
		await settle()

		expect(fixture.componentInstance.months()).toEqual(['2026-09-01'])
	})

	it('листание не пересоздаёт заголовок месяца: кнопка, поповер и живая область — те же', async () => {
		await render(Page)

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
})

describe('выбор', () => {
	it('нажатие по дню выбирает его — выход soChangeValue', async () => {
		const fixture = await render(Page)

		dayCell('2026-09-10').click()
		await settle()

		expect(fixture.componentInstance.value()).toBe('2026-09-10')
		expect(dayCell('2026-09-10').dataset['selected']).toBe('true')
		expect(dayCell('2026-09-10').getAttribute('aria-selected')).toBe('true')
		expect(dayCell('2026-09-11').getAttribute('aria-selected')).toBe('false')
	})

	it('значение снаружи выбирает день и уводит сетку на его месяц', async () => {
		const fixture = await render(Page, (page) => page.value.set('2026-09-10'))

		expect(dayCell('2026-09-10').dataset['selected']).toBe('true')

		fixture.componentInstance.value.set('2026-11-03')
		await settle()

		expect(titles()).toEqual(['November 2026'])
		expect(dayCell('2026-11-03').dataset['selected']).toBe('true')
	})

	it('диапазон: два нажатия — пара дат, между ними — середина', async () => {
		const fixture = await render(Page, (page) => page.mode.set('range'))

		expect(node('.so-calendar__grid').getAttribute('aria-multiselectable')).toBe('true')

		dayCell('2026-09-14').click()
		dayCell('2026-09-10').click()
		await settle()

		expect(fixture.componentInstance.value()).toEqual(['2026-09-10', '2026-09-14'])
		expect(dayCell('2026-09-10').dataset['rangeStart']).toBe('true')
		expect(dayCell('2026-09-12').dataset['rangeMiddle']).toBe('true')
		expect(dayCell('2026-09-14').dataset['rangeEnd']).toBe('true')
	})

	it('предпросмотр диапазона — до дня под указателем', async () => {
		await render(Page, (page) => page.mode.set('range'))

		dayCell('2026-09-10').click()
		dayCell('2026-09-13').dispatchEvent(
			new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }),
		)
		await settle()

		expect(nodes('.so-calendar-item[data-preview="true"]')).toHaveLength(4)
	})

	it('недоступный день не выбирается, но фокус на него встаёт', async () => {
		const fixture = await render(Page, (page) =>
			page.unavailable.set((date) => date === '2026-09-15'),
		)

		const blocked = dayCell('2026-09-15')

		expect(blocked.dataset['unavailable']).toBe('true')
		expect(blocked.getAttribute('aria-disabled')).toBe('true')
		expect(blocked.getAttribute('tabindex')).toBe('-1')

		blocked.click()
		await settle()

		expect(fixture.componentInstance.value()).toBeUndefined()
	})

	it('день, оставшийся на экране при выборе, — тот же узел', async () => {
		await render(Page)

		const day = dayCell('2026-09-10')

		day.click()
		dayCell('2026-09-12').click()
		await settle()

		expect(dayCell('2026-09-10')).toBe(day)
	})
})

describe('клавиатура', () => {
	it('стрелка переносит фокус на соседний день, Enter его выбирает', async () => {
		const fixture = await render(Page)

		const today = dayCell('2026-09-26')

		today.focus()
		press(today, 'ArrowLeft')
		await settle()

		expect(document.activeElement).toBe(dayCell('2026-09-25'))
		expect(dayCell('2026-09-25').getAttribute('tabindex')).toBe('0')

		press(dayCell('2026-09-25'), 'Enter')
		await settle()

		expect(fixture.componentInstance.value()).toBe('2026-09-25')
	})

	it('PageDown уводит сетку в следующий месяц, а фокус — на новый день', async () => {
		await render(Page)

		const today = dayCell('2026-09-26')

		today.focus()
		press(today, 'PageDown')
		await settle()

		expect(titles()).toEqual(['October 2026'])
		expect(document.activeElement).toBe(dayCell('2026-10-26'))
	})
})

/**
 * Выбор месяца и года: заголовок сетки — кнопка-триггер поповера, в панели —
 * ListBox и шапка. Модель панели проверяет ядро (`calendar-picker.spec.ts`),
 * здесь — что её выходы доезжают до разметки, а нажатия — до модели.
 */
describe('выбор месяца и года', () => {
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
		await render(Page)

		expect(title().localName).toBe('button')
		expect(title().getAttribute('aria-haspopup')).toBe('dialog')
		expect(title().getAttribute('aria-expanded')).toBe('false')
		expect(title().contains(node('.so-calendar__title-text'))).toBe(true)
		// Содержимое панели в документ не вставлено до первого открытия
		expect(document.querySelector('.so-calendar__picker')).toBeNull()
	})

	it('keeps picker labels valid before mounting, through years, closing and reopening', async () => {
		await render(Page)

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
		await render(Page)
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
	 * С `contained` слой Angular остаётся на месте: панель — Frame в шаблоне
	 * поповера, прямой потомок его корня, а корень поповера — прямой потомок
	 * месяца. По этой цепочке тема находит панель выбора.
	 */
	it('панель — прямой потомок корня поповера, а он — прямой потомок месяца', async () => {
		await render(Page)
		await openPicker()

		expect(
			document.querySelector(
				'.so-calendar__month > .so-calendar__heading > .so-popover__panel[data-contained="true"]',
			),
		).toBe(node('.so-popover__panel'))
	})

	it('полоса жеста — прямой потомок панели, немая для скринридера', async () => {
		await render(Page)
		await openPicker()

		const handle = node('.so-popover__handle')

		// Плагин жеста узнаёт полосу только прямым потомком панели
		expect(handle.parentElement).toBe(node('.so-popover__panel'))
		expect(handle.getAttribute('aria-hidden')).toBe('true')
	})

	it('нажатие по подложке — самой панели — закрывает её, фокус — на заголовок', async () => {
		await render(Page)
		await openPicker()
		await pressOn(node('.so-popover__panel'))

		expect(title().getAttribute('aria-expanded')).toBe('false')
		expect(document.activeElement).toBe(title())
		expect(titles()).toEqual(['September 2026'])
	})

	it('нажатие по карточке панель не закрывает', async () => {
		await render(Page)
		await openPicker()
		await pressOn(panel())

		expect(title().getAttribute('aria-expanded')).toBe('true')
	})

	it('список в DOM раньше шапки: фокус при открытии встаёт на список', async () => {
		await render(Page)
		await openPicker()

		expect(partsOf(panel())).toEqual(['so-calendar__picker-list', 'so-calendar__picker-header'])
	})

	it('в шапке год идёт перед стрелками — Tab за глазом; текста между узлами нет', async () => {
		await render(Page)
		await openPicker()

		expect(partsOf(node('.so-calendar__picker-header'))).toEqual([
			'so-calendar__picker-heading',
			'so-calendar__picker-prev',
			'so-calendar__picker-next',
		])
		expect(textsOf(node('.so-calendar__picker-header'))).toEqual([])
		expect(textsOf(panel())).toEqual([])
	})

	it('месяц → панель закрыта, сетка на нём — выход soChangeMonths', async () => {
		const fixture = await render(Page)

		await openPicker()
		await pick('Mar')

		expect(fixture.componentInstance.months()).toEqual(['2026-03-01'])
		expect(titles()).toEqual(['March 2026'])
		expect(title().getAttribute('aria-expanded')).toBe('false')
	})

	/**
	 * Блок месяца ключуется местом сетки: выбранный месяц меняет текст
	 * заголовка, а кнопка, её поповер и живая область остаются теми же — фокус,
	 * который панель возвращает на кнопку, не падает на страницу.
	 */
	it('выбор месяца не пересоздаёт заголовок: кнопка, поповер, живая область — те же, фокус — на кнопке', async () => {
		await render(Page)

		const button = title()
		const popover = node('.so-calendar__heading')
		const live = node('.so-calendar__title-text')

		await openPicker()
		await pick('Mar')

		expect(title()).toBe(button)
		expect(node('.so-calendar__heading')).toBe(popover)
		expect(node('.so-calendar__title-text')).toBe(live)
		expect(document.activeElement).toBe(button)
	})

	it('год в шапке → годы страницы; выбор года → месяцы этого года; месяц → сетка', async () => {
		await render(Page)
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
		await render(Page)
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
		await render(Page)
		await openPicker()

		const prevYear = node('.so-calendar__picker-prev')
		const nextYear = node('.so-calendar__picker-next')

		expect(prevYear.getAttribute('aria-label')).toBe('Previous year')
		expect(nextYear.getAttribute('aria-label')).toBe('Next year')

		nextYear.click()
		await settle()

		expect(heading().textContent?.trim()).toBe('2027')

		heading().click()
		await settle()

		expect(prevYear.getAttribute('aria-label')).toBe('Previous 12 years')

		nextYear.click()
		await settle()

		expect(options()[0]?.textContent?.trim()).toBe('2029')
	})

	it('у границы стрелка гаснет, опции вне min/max выключены', async () => {
		await render(Page, (page) => page.max.set('2026-10-20'))
		await openPicker()

		expect(node('.so-calendar__picker-next').hasAttribute('disabled')).toBe(true)
		expect(node('.so-calendar__picker-prev').hasAttribute('disabled')).toBe(false)
		expect(option('Nov').dataset['disabled']).toBe('true')
		expect(option('Oct').dataset['disabled']).toBe('false')
	})

	it('выключенный календарь выключает заголовок', async () => {
		await render(Page, (page) => page.disabled.set(true))

		expect(title().hasAttribute('disabled')).toBe(true)
	})

	/**
	 * The card is the `default` template of the place popover: with its
	 * `lazyMount` the ListBox comes with the first open of the panel of its
	 * place, not with every month, and closing does not tear it down. The list
	 * is a detail of library markup, so the probe counts with `scope: 'all'`.
	 */
	describe('список панели', () => {
		let probe: TAssemblyProbe

		beforeEach(() => {
			probe = countAssemblies(TListBox, { scope: 'all' })
		})

		afterEach(() => probe.dispose())

		it('собирается с первым открытием своего места, закрытие его не снимает', async () => {
			await render(Page, (page) => page.months.set(['2026-09-01', '2026-10-01']))

			expect(probe.counts).toEqual({ install: 0, destroy: 0 })
			expect(document.querySelector('.so-calendar__picker-list')).toBeNull()

			await openPicker()

			expect(probe.counts).toEqual({ install: 1, destroy: 0 })
			expect(options()).toHaveLength(12)

			await pressOn(node('.so-popover__panel'))

			expect(title().getAttribute('aria-expanded')).toBe('false')

			await openPicker()

			expect(title().getAttribute('aria-expanded')).toBe('true')
			expect(probe.counts).toEqual({ install: 1, destroy: 0 })

			// The second place builds its own list with its own first open
			const [, second] = nodes('.so-calendar__title')

			second?.click()
			await settle()

			expect(probe.counts).toEqual({ install: 2, destroy: 0 })
		})
	})
})

describe('движок снаружи', () => {
	it('календарь работает на переданном движке: его команды видны в разметке', async () => {
		const ctrl = new TCalendar()
		const engine = createEngineCalendar()
		const chosen = vi.fn()

		engine.extensions.selection.events.on('choose', chosen)

		await render(Page, (page) => {
			page.ctrl.set(ctrl)
			page.engine.set(engine)
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
		const fixture = await render(RemovableHost)
		const { engine } = fixture.componentInstance

		expect(engine.options.get('owner')).toBe(fixture.componentInstance.ctrl)

		fixture.componentInstance.shown.set(false)
		check()

		expect(engine.options.get('owner')).toBeUndefined()
	})
})
