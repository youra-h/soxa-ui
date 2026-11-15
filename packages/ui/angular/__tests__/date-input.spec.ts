/**
 * DateInput под Angular — проводка целиком, на настоящей разметке.
 *
 * Сценарии — те же, что у Vue (`date-input.spec.ts`), Svelte и React; `v-model`
 * Vue здесь — выход `(soChangeValue)`, который хост возвращает входом `value`.
 * Модель — набор, вставка, формат локали — проверяет ядро
 * (`core/__tests__/date-input.spec.ts`), клавиши и буфер обмена — тест
 * плагинов, протяжку мышью, выделение и настоящий буфер — браузер
 * (`playground/vue/browser/date-input.spec.ts`). Здесь важно, что выходы
 * ядра доезжают туда, куда должны: части и разделители — в ряд в порядке
 * формата, наборы части — на её узел, `dir` и `lang` — на ряд, значение — в
 * скрытое поле, а клавиши на настоящей разметке доходят до модели и
 * возвращаются выходом.
 *
 * Своё у Angular — запись атрибутом и текст части. Корень — сам
 * `<div so-date-input>`, и всё, что потребитель на нём написал, остаётся на
 * нём: поля ввода, между которым делить, у даты нет. `id` — вход, и на корень
 * его кладёт база (`TRootSpec.id`). Текст части и разделителя — свойство узла
 * (`[textContent]`): в части один текстовый узел, и часть, которую браузер на
 * касании оставил пустой, получает текст ядра целиком. Пустые текстовые узлы
 * шаблона Angular вырезает, и текст ряда — ровно дата с разделителями.
 *
 * Язык поля — тег локали поддерева (`LocaleProviderDirective`), своего у поля
 * нет: здесь он русский, а тест на другом языке задаёт свою локаль
 * провайдеру.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { Component, signal, type Type } from '@angular/core'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import type { TDateInputKind, TTimePrecision, TValuePayload } from '@soxa-ui/core'
import { arEG, enUS, ruRU, type TLocale } from '@soxa-ui/plugins'
import { LocaleProviderDirective, SlotDirective, TDateInputComponent } from '@soxa-ui/angular'
import { find, nextFrame } from './mount'

/** Значение поля даты: строка даты или даты со временем, пусто — `undefined`. */
type TValue = string | undefined

/** Смонтированный хост теста — его перепроверяют действия. */
let current: ComponentFixture<unknown> | null = null

afterEach(() => {
	current = null
	vi.restoreAllMocks()
})

/**
 * Смонтировать хост и дождаться кадра: корень плагины получают через
 * `requestAnimationFrame`, и клавиши, указатель и буфер слушаются с него.
 * `prepare` задаёт входы до первой отрисовки — так, как они стоят в разметке с
 * самого начала.
 */
async function render<T>(host: Type<T>, prepare?: (page: T) => void): Promise<ComponentFixture<T>> {
	const fixture = TestBed.createComponent(host)

	current = fixture
	prepare?.(fixture.componentInstance)
	fixture.detectChanges()

	await nextFrame()
	check()

	return fixture
}

/**
 * Перепроверить хост: событие дошло до ядра и его состояния, а разметку
 * приложение без Zone.js перепроверяет на своём такте — тест делает это сразу.
 */
function check(): void {
	current?.detectChanges()
}

/** Узел по селектору в документе. */
const node = (selector: string) => find(document, selector, HTMLElement)

function nodes(selector: string): HTMLElement[] {
	return [...document.querySelectorAll(selector)].filter(
		(element): element is HTMLElement => element instanceof HTMLElement,
	)
}

/** Корень поля — элемент потребителя. */
const root = () => node('.so-date-input')

/** Ряд частей. */
const row = () => node('.so-date-input__segments')

/** Часть по типу. */
const segment = (type: string) => node(`.so-date-input__segment[data-type="${type}"]`)

/** Скрытое поле формы. */
const hidden = () => find(document, 'input[type="hidden"]', HTMLInputElement)

/** Узлы ряда по порядку: класс и текст. */
const rowContent = () => [...row().children].map((child) => [child.className, child.textContent])

/** Тексты узлов ряда по порядку. */
const rowTexts = () => [...row().children].map((child) => child.textContent)

/** Нажатие клавиши с узла, как у пользователя: событие всплывает до корня. */
function press(from: Element, key: string): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

	from.dispatchEvent(event)
	check()

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

/** Нажатие указателем по узлу, как его шлёт браузер. */
function pointerDown(from: Element, pointerType: string): void {
	from.dispatchEvent(new PointerEvent('pointerdown', { pointerType, bubbles: true }))
	check()
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

/**
 * Поле в провайдере локали, значение — по-настоящему: потребитель возвращает
 * его входом, как `v-model`. Входы — сигналы: хост `OnPush`, и смена входа —
 * смена сигнала; неопределённый сигнал — вход не задан. Клики по корню хост
 * пишет в журнал.
 */
@Component({
	selector: 'probe-date-input-page',
	standalone: true,
	imports: [TDateInputComponent, LocaleProviderDirective],
	template: `<ng-container so-locale-provider [locale]="locale()">
		<div
			so-date-input
			[id]="id()"
			[aria_label]="label()"
			[value]="value()"
			[name]="name()"
			[disabled]="disabled()"
			[readonly]="readonly()"
			[max]="max()"
			[kind]="kind()"
			[timePrecision]="timePrecision()"
			[validate]="validate()"
			[clearable]="clearable()"
			(soChangeValue)="change($event)"
			(click)="clicks.push($event)"
		></div>
	</ng-container>`,
})
class Page {
	readonly locale = signal<TLocale>(ruRU)
	readonly id = signal<string | undefined>(undefined)
	readonly label = signal<string | undefined>(undefined)
	readonly value = signal<TValue>(undefined)
	readonly name = signal<string | undefined>(undefined)
	readonly disabled = signal<boolean | undefined>(undefined)
	readonly readonly = signal<boolean | undefined>(undefined)
	readonly max = signal<string | undefined>(undefined)
	readonly kind = signal<TDateInputKind | undefined>(undefined)
	readonly timePrecision = signal<TTimePrecision | undefined>(undefined)
	readonly validate = signal<boolean | undefined>(undefined)
	readonly clearable = signal<boolean | undefined>(undefined)
	/** Значения, которые поле сообщило выходом. */
	readonly values: TValue[] = []
	/** Клики, дошедшие до корня. */
	readonly clicks: Event[] = []

	change(payload: TValuePayload<TValue>): void {
		this.values.push(payload.newValue)
		this.value.set(payload.newValue)
	}
}

/** Всё, что потребитель записал на корень, — статикой: поле ввода у даты нет. */
@Component({
	selector: 'probe-date-input-attrs',
	standalone: true,
	imports: [TDateInputComponent],
	template: `<div so-date-input id="when" class="mine" data-probe="1" title="Дата"></div>`,
})
class AttrsHost {}

/** Слоты по краям: `leading`, `trailing` со scope `{ ctrl }` и кнопка очистки. */
@Component({
	selector: 'probe-date-input-sides',
	standalone: true,
	imports: [TDateInputComponent, LocaleProviderDirective, SlotDirective],
	template: `<ng-container so-locale-provider [locale]="locale">
		<div so-date-input name="Дата" [clearable]="clearable()" [value]="value()">
			@if (lead()) {
				<ng-template slot="leading"><i class="so-test-lead">с</i></ng-template>
			}
			<ng-template slot="trailing" let-ctrl="ctrl"
				><button class="so-test-calendar" [title]="ctrl.locale">
					Календарь
				</button></ng-template
			>
		</div>
	</ng-container>`,
})
class SidesHost {
	readonly locale = ruRU
	readonly clearable = signal<boolean | undefined>(undefined)
	readonly value = signal<TValue>(undefined)
	readonly lead = signal(false)
}

/** Своя кнопка очистки — шаблон `clear` с командой очистки в scope. */
@Component({
	selector: 'probe-date-input-own-clear',
	standalone: true,
	imports: [TDateInputComponent, LocaleProviderDirective, SlotDirective],
	template: `<ng-container so-locale-provider [locale]="locale">
		<div so-date-input value="2026-05-12">
			<ng-template slot="clear" let-clear="clear"
				><button type="button" class="so-test-clear" (click)="clear()"></button
			></ng-template>
		</div>
	</ng-container>`,
})
class OwnClearHost {
	readonly locale = ruRU
}

describe('разметка', () => {
	it('ru: корень — группа, в ряду части и разделители в порядке формата', async () => {
		await render(Page, (page) => page.label.set('Дата рождения'))

		expect(root().getAttribute('role')).toBe('group')
		expect(root().getAttribute('aria-label')).toBe('Дата рождения')
		expect(root().dataset['invalid']).toBeUndefined()
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
		await render(Page, (page) => page.value.set('2026-05-12'))

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
		await render(Page, (page) => {
			page.locale.set(arEG)
			page.value.set('2026-05-12')
		})

		expect(row().getAttribute('dir')).toBe('rtl')
		expect(rowTexts()).toEqual(formatted('ar-EG', '2026-05-12'))
	})

	it('выключенное поле — частей вне порядка Tab, скрытое поле выключено', async () => {
		await render(Page, (page) => {
			page.disabled.set(true)
			page.name.set('birthday')
			page.value.set('2026-05-12')
		})

		expect(nodes('.so-date-input__segment[tabindex]')).toEqual([])
		expect(root().dataset['disabled']).toBe('true')
		expect(hidden().hasAttribute('disabled')).toBe(true)
	})

	it('дата вне min/max — data-invalid у корня и aria-invalid у частей', async () => {
		await render(Page, (page) => {
			page.value.set('2026-05-12')
			page.max.set('2026-01-01')
		})

		expect(root().dataset['invalid']).toBe('true')
		expect(segment('year').getAttribute('aria-invalid')).toBe('true')
	})

	it('порядок узлов — как у Vue: leading, ряд частей, обёртка у конца, скрытое поле', async () => {
		await render(SidesHost, (page) => {
			page.clearable.set(true)
			page.lead.set(true)
		})

		expect(
			[...root().children].map((child) =>
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
		await render(AttrsHost)

		expect(root().id).toBe('when')
		expect(root().classList.contains('mine')).toBe(true)
		expect(root().classList.contains('so-date-input')).toBe(true)
		expect(root().dataset['probe']).toBe('1')
		expect(root().title).toBe('Дата')
	})

	/**
	 * `id` — вход: статический атрибут с его именем база с хоста снимает, а на
	 * корень кладёт своим эффектом — значение и его смену, а снятое значение
	 * снимает и атрибут. На частях — свои `id`, от монтирования.
	 */
	it('id — на корне: смена доходит до атрибута, снятый вход снимает его', async () => {
		const fixture = await render(Page, (page) => page.id.set('birthday'))

		expect(root().id).toBe('birthday')

		fixture.componentInstance.id.set('arrival')
		check()

		expect(root().id).toBe('arrival')

		fixture.componentInstance.id.set(undefined)
		check()

		expect(root().hasAttribute('id')).toBe(false)
		expect(nodes('.so-date-input__segment').every((part) => part.id !== '')).toBe(true)
	})

	/**
	 * Копию плагин буфера обмена собирает из текста узлов ряда: пробел, который
	 * интерполяция с отступом оставила бы в части, испортил бы скопированную
	 * дату.
	 */
	it('текст ряда — ровно дата с разделителями: без текста между узлами', async () => {
		await render(Page, (page) => page.value.set('2026-05-12'))

		expect(row().textContent).toBe('12.05.2026')

		const texts = [...row().childNodes].filter(
			(child) => child instanceof Text && child.data.length > 0,
		)

		expect(texts).toEqual([])
	})
})

/**
 * Текст части — свойство узла: в части один текстовый узел с текстом ядра, и
 * своего узла рядом с ним Angular не держит.
 */
describe('текст части', () => {
	it('в части — один текстовый узел с текстом ядра', async () => {
		await render(Page, (page) => page.value.set('2026-05-12'))

		const day = segment('day')

		expect([...day.childNodes].map((child) => child.nodeType)).toEqual([Node.TEXT_NODE])
		expect(day.textContent).toBe('12')
	})

	/**
	 * На касании часть редактируемая, и браузер правит её сам — композиция,
	 * клавиатура, которая стирает и после погашенного Backspace, — оставляя
	 * часть пустой. Текст ядра узел получает свойством `textContent`, целиком.
	 */
	it('часть, которую браузер оставил пустой, получает текст ядра одним узлом', async () => {
		await render(Page)

		const day = segment('day')

		day.focus()
		type('1')
		day.replaceChildren()

		type('2')

		expect(day.textContent).toBe('12')
		expect(day.childNodes).toHaveLength(1)
	})

	it('набор не пересоздаёт узлы частей: часть и фокус на ней — те же', async () => {
		await render(Page)

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

describe('скрытое поле формы', () => {
	it('имя и значение — дата строкой; недописанная дата — пусто', async () => {
		await render(Page, (page) => {
			page.name.set('birthday')
			page.value.set('2026-05-12')
		})

		expect(hidden().getAttribute('name')).toBe('birthday')
		expect(hidden().value).toBe('2026-05-12')

		segment('day').focus()
		press(segment('day'), 'Delete')

		expect(hidden().value).toBe('')
	})
})

describe('управляемое значение', () => {
	it('набор с клавиатуры возвращает дату выходом soChangeValue', async () => {
		const fixture = await render(Page)

		segment('day').focus()
		type('12052026')

		expect(fixture.componentInstance.value()).toBe('2026-05-12')
		expect(rowTexts()).toEqual(['12', '.', '05', '.', '2026'])
		expect(document.activeElement).toBe(segment('year'))
	})

	it('значение снаружи — части из него', async () => {
		const fixture = await render(Page, (page) => page.value.set('2026-05-12'))

		fixture.componentInstance.value.set('2027-01-02')
		check()

		expect(rowTexts()).toEqual(['02', '.', '01', '.', '2027'])
	})
})

/**
 * Ноль, с которого день не начинается, числа не даёт, но виден в части, пока
 * фокус на ней. Ряд перечитывается по `change:segments` ядра, а не по смене
 * фокуса: ушёл фокус с нулей — ядро само сообщает, что их сменила подсказка.
 */
describe('набранный ноль', () => {
	it('клавиша «0» на дне — в части «0»; фокус ушёл на месяц — у дня снова подсказка', async () => {
		await render(Page)

		segment('day').focus()
		type('0')

		expect(segment('day').textContent).toBe('0')
		expect(segment('day').dataset['placeholder']).toBe('false')
		expect(segment('day').getAttribute('aria-valuetext')).toBe('0')
		expect(segment('day').hasAttribute('aria-valuenow')).toBe(false)
		expect(document.activeElement).toBe(segment('day'))

		segment('month').focus()
		check()

		expect(segment('day').textContent).toBe('дд')
		expect(segment('day').dataset['placeholder']).toBe('true')
	})

	it('«00» на дне без validate — день 00, фокус уходит на месяц', async () => {
		await render(Page)

		segment('day').focus()
		type('00')

		expect(segment('day').textContent).toBe('00')
		expect(document.activeElement).toBe(segment('month'))
	})

	it('«00» на дне с validate — фокус стоит, часть ждёт цифры', async () => {
		await render(Page, (page) => page.validate.set(true))

		segment('day').focus()
		type('00')

		expect(segment('day').textContent).toBe('00')
		expect(document.activeElement).toBe(segment('day'))
	})
})

describe('время', () => {
	it('en-US: час, минута и период суток — в ряду в порядке формата, значение — в скрытом поле', async () => {
		await render(Page, (page) => {
			page.locale.set(enUS)
			page.kind.set('datetime')
			page.name.set('meeting')
			page.value.set('2026-05-12T14:30')
		})

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
		await render(Page, (page) => page.kind.set('datetime'))

		expect(rowTexts()).toEqual(['дд', '.', 'мм', '.', 'гггг', ', ', '––', ':', '––'])
		expect(document.querySelector('[data-type="dayPeriod"]')).toBeNull()
	})

	it('набор времени с клавиатуры возвращает дату со временем выходом', async () => {
		const fixture = await render(Page, (page) => page.kind.set('datetime'))

		segment('day').focus()
		type('120520261430')

		expect(fixture.componentInstance.value()).toBe('2026-05-12T14:30')
		expect(document.activeElement).toBe(segment('minute'))
	})

	it('смена вида: части времени появляются, значение — в новом виде', async () => {
		const fixture = await render(Page, (page) => {
			page.kind.set('datetime')
			page.value.set('2026-05-12T14:30')
		})
		const page = fixture.componentInstance

		page.kind.set('date')
		check()

		expect(page.value()).toBe('2026-05-12')
		expect(rowTexts()).toEqual(['12', '.', '05', '.', '2026'])

		// Время осталось в частях и вернулось
		page.kind.set('datetime')
		check()

		expect(page.value()).toBe('2026-05-12T14:30')
		expect(segment('minute').textContent).toBe('30')
	})

	it('до секунды: секунда в ряду за минутой, значение — в скрытом поле', async () => {
		await render(Page, (page) => {
			page.locale.set(enUS)
			page.kind.set('datetime')
			page.timePrecision.set('second')
			page.name.set('meeting')
			page.value.set('2026-05-12T14:30:15')
		})

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

	it('набор секунды с клавиатуры возвращает время до секунды выходом', async () => {
		const fixture = await render(Page, (page) => {
			page.kind.set('datetime')
			page.timePrecision.set('second')
		})

		segment('day').focus()
		type('120520261430')

		expect(document.activeElement).toBe(segment('second'))
		expect(fixture.componentInstance.value()).toBeUndefined()

		type('15')

		expect(fixture.componentInstance.value()).toBe('2026-05-12T14:30:15')
	})

	it('смена точности: секунда появляется и пропадает, значение — в новой точности', async () => {
		const fixture = await render(Page, (page) => {
			page.kind.set('datetime')
			page.timePrecision.set('minute')
			page.value.set('2026-05-12T14:30:15')
		})
		const page = fixture.componentInstance

		const minute = segment('minute')

		expect(document.querySelector('[data-type="second"]')).toBeNull()

		// Секунда записанного значения была скрыта в частях: значение то же, а
		// ряд перечитывается по смене точности
		page.timePrecision.set('second')
		check()

		expect(page.values).toEqual([])
		expect(segment('second').textContent).toBe('15')
		// Узел минуты тот же: часть ключуется типом
		expect(segment('minute')).toBe(minute)

		page.timePrecision.set('minute')
		check()

		expect(page.value()).toBe('2026-05-12T14:30')
		expect(document.querySelector('[data-type="second"]')).toBeNull()

		// Секунда осталась в частях и вернулась
		page.timePrecision.set('second')
		check()

		expect(page.value()).toBe('2026-05-12T14:30:15')
		expect(segment('second').textContent).toBe('15')
	})
})

describe('смена локали поддерева', () => {
	it('часть меняет место, а её узел остаётся тем же', async () => {
		const fixture = await render(Page, (page) => page.value.set('2026-05-12'))

		const day = segment('day')

		fixture.componentInstance.locale.set(enUS)
		check()

		expect(segment('day')).toBe(day)
		expect(rowTexts()).toEqual(formatted('en-US', '2026-05-12'))
	})
})

describe('сенсорный режим', () => {
	it('касание делает части редактируемыми, нажатие мышью — снова нет', async () => {
		await render(Page, (page) => page.value.set('2026-05-12'))

		pointerDown(segment('month'), 'touch')

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
		expect(segment('month').textContent).toBe('05')

		pointerDown(segment('month'), 'mouse')

		expect(nodes('.so-date-input__segment[contenteditable]')).toEqual([])
		expect(nodes('.so-date-input__segment[inputmode]')).toEqual([])
	})

	it('ввод экранной клавиатуры возвращает дату выходом', async () => {
		const fixture = await render(Page)

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
			expect(event.defaultPrevented).toBe(true)
			check()
		}

		expect(fixture.componentInstance.value()).toBe('2026-05-12')
		expect(rowTexts()).toEqual(['12', '.', '05', '.', '2026'])
	})

	it('у каждой части свой id — от монтирования и типа части', async () => {
		await render(Page)

		const parts = nodes('.so-date-input__segment')

		expect(parts.every((part) => part.id.endsWith(`-${part.dataset['type']}`))).toBe(true)
		expect(new Set(parts.map((part) => part.id)).size).toBe(3)
	})
})

describe('слоты', () => {
	it('leading и trailing получают инстанс поля; без слота обёртки нет', async () => {
		await render(SidesHost)

		const calendar = find(node('.so-date-input__trailing'), '.so-test-calendar', HTMLElement)

		// Scope `trailing` — сам инстанс поля: его язык — от провайдера поддерева
		expect(calendar.title).toBe('ru-RU')
		expect(document.querySelector('.so-date-input__leading')).toBeNull()
	})

	it('клавиши кнопки в слоте — не поля', async () => {
		await render(SidesHost, (page) => page.value.set('2026-05-12'))

		expect(press(node('.so-test-calendar'), 'ArrowUp').defaultPrevented).toBe(false)
	})
})

/**
 * Кнопка очистки — та же, что у Input: часть поля (`ClearableDescriptor`). Что
 * очистка делает с частями, проверяет ядро (`core/__tests__/date-input.spec.ts`),
 * форму кнопки — браузерный прогон.
 */
describe('кнопка очистки', () => {
	it('без clearable кнопки нет, и обёртки без слотов тоже', async () => {
		await render(Page, (page) => page.value.set('2026-05-12'))

		expect(document.querySelector('.so-date-input__clear')).toBeNull()
		expect(document.querySelector('.so-date-input__trailing')).toBeNull()
	})

	it('по clearable — первой в обёртке у конца, перед кнопкой календаря', async () => {
		await render(SidesHost, (page) => page.clearable.set(true))

		const parts = ['.so-date-input__clear', '.so-test-calendar']

		expect(
			[...node('.so-date-input__trailing').children].map((child) =>
				parts.find((part) => child.matches(part)),
			),
		).toEqual(parts)
		expect(node('.so-date-input__clear').getAttribute('aria-label')).toBe('Очистить Дата')
	})

	it('клик очищает все части и значение, до корня не всплывает', async () => {
		const fixture = await render(Page, (page) => {
			page.clearable.set(true)
			page.value.set('2026-05-12')
		})

		node('.so-date-input__clear').click()
		check()

		expect(fixture.componentInstance.value()).toBeUndefined()
		expect(nodes('.so-date-input__segment').map((part) => part.dataset['placeholder'])).toEqual(
			['true', 'true', 'true'],
		)
		expect(hidden().value).toBe('')
		expect(fixture.componentInstance.clicks).toEqual([])
	})

	it('выключена вместе с полем, readonly её не гасит', async () => {
		const fixture = await render(Page, (page) => {
			page.clearable.set(true)
			page.readonly.set(true)
			page.disabled.set(false)
			page.value.set('2026-05-12')
		})

		expect(node('.so-date-input__clear').hasAttribute('disabled')).toBe(false)

		fixture.componentInstance.disabled.set(true)
		check()

		expect(node('.so-date-input__clear').hasAttribute('disabled')).toBe(true)
	})

	it('своя кнопка — слот clear с командой очистки в scope, без clearable', async () => {
		await render(OwnClearHost)

		node('.so-test-clear').click()
		check()

		expect(node('.so-date-input__trailing > .so-test-clear')).toBeTruthy()
		expect(document.querySelector('.so-date-input__clear')).toBeNull()
		expect(
			nodes('.so-date-input__segment').every(
				(part) => part.dataset['placeholder'] === 'true',
			),
		).toBe(true)
	})
})
