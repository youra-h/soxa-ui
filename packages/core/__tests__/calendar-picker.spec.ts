import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryObjects } from 'node:v8'
import { TCalendar, TCalendarCollectionFacade, TListBox, TPopover } from '@soxa-ui/core'
import type {
	ICalendarProps,
	IListBoxItem,
	TCalendarPicker,
	TCalendarPickerList,
} from '@soxa-ui/core'

/**
 * Панели выбора месяца и года — расширение `picker` коллекции календаря.
 *
 * Заголовок сетки открывает поповер места, в нём — ListBox: месяцы года или
 * годы страницы. Выбор приходит так, как его передаст разметка, — через
 * расширение списка (`chooseItem`), тем же путём, что клик по строке и Enter.
 * Поповер открывают и закрывают записью `open`, как его плагин указателя.
 *
 * Сегодня во всех тестах — суббота 2026-09-26.
 */

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['Date'] })
	vi.setSystemTime(new Date(2026, 8, 26, 12))
})

afterEach(() => {
	vi.useRealTimers()
})

/** Календарь и его коллекция — так их собирает адаптер. */
function calendar(props: Partial<ICalendarProps> = {}) {
	const owner = new TCalendar(props)
	const facade = new TCalendarCollectionFacade({}, { owner })
	const { view, picker } = facade.extensions

	return { owner, facade, view, picker }
}

type TCalendarSetup = ReturnType<typeof calendar>

/** Панель места `index`; места нет — тест падает здесь. */
function panel({ facade }: TCalendarSetup, index = 0): TCalendarPicker {
	const found = facade.pickers[index]

	if (!found) throw new Error(`панели на месте ${index} нет`)

	return found
}

/** Открыть панель места — как это делает нажатие на заголовок. */
function open(setup: TCalendarSetup, index = 0): TCalendarPicker {
	panel(setup, index).popover.open = true

	return panel(setup, index)
}

/**
 * The list of place `index` with its engine; before the first opening there is
 * none, and the test fails here.
 */
function pickerList(setup: TCalendarSetup, index = 0): TCalendarPickerList {
	const found = panel(setup, index).list

	if (!found) throw new Error(`у места ${index} нет списка`)

	return found
}

/** Элементы списка панели. */
function options(setup: TCalendarSetup, index = 0): readonly IListBoxItem[] {
	return pickerList(setup, index).engine.extensions.batch.items
}

/** Выбор пользователя в списке панели — по значению элемента. */
function choose(setup: TCalendarSetup, value: string | number, index = 0): boolean {
	const item = options(setup, index).find((candidate) => candidate.value === value)

	if (!item) throw new Error(`${value} нет в списке`)

	return pickerList(setup, index).engine.extensions.list.chooseItem(item)
}

const values = (setup: TCalendarSetup, index = 0) => options(setup, index).map((item) => item.value)

const disabled = (setup: TCalendarSetup, index = 0) =>
	options(setup, index)
		.filter((item) => item.disabled)
		.map((item) => item.value)

/** Год и отрезок лет — тем же форматтером, что календарь: строки Intl зависят от версии ICU. */
const year = (value: number, locale = 'en-US') =>
	new Intl.DateTimeFormat(locale, { year: 'numeric', timeZone: 'UTC' }).format(
		Date.UTC(value, 0, 1),
	)

const years = (from: number, to: number, locale = 'en-US') =>
	new Intl.DateTimeFormat(locale, { year: 'numeric', timeZone: 'UTC' }).formatRange(
		Date.UTC(from, 0, 1),
		Date.UTC(to, 0, 1),
	)

const MONTHS_2026 = Array.from(
	{ length: 12 },
	(_, index) => `2026-${String(index + 1).padStart(2, '0')}-01`,
)

describe('места', () => {
	it('панель на каждую сетку; экземпляры места переживают листание', () => {
		const setup = calendar({ months: ['2026-01-01', '2026-09-01'] })
		const [first, second] = setup.facade.pickers

		expect(setup.facade.pickers).toHaveLength(2)
		expect(first.popover).not.toBe(second.popover)

		open(setup, 0)
		open(setup, 1)

		const list = pickerList(setup, 0)

		expect(list.ctrl).not.toBe(pickerList(setup, 1).ctrl)
		expect(list.engine).not.toBe(pickerList(setup, 1).engine)

		setup.view.showNext()

		expect(panel(setup, 0).popover).toBe(first.popover)
		expect(panel(setup, 0).list).toBe(list)
	})

	it('поповер без кнопки закрытия, содержимое — до первого открытия не смонтировано', () => {
		const { popover } = panel(calendar())

		expect(popover.closable).toBe(false)
		expect(popover.lazyMount).toBe(true)
		expect(popover.open).toBe(false)
	})

	it('панель смахивают за полосу: жест у поповера места включён', () => {
		const { popover } = panel(calendar())

		expect(popover.swipe).toBe('handle')
		expect(popover.handleRendered).toBe(true)
	})

	it('сетки меньше — место без сетки закрывает свою панель', () => {
		const setup = calendar({ months: ['2026-01-01', '2026-09-01'] })
		const second = open(setup, 1)

		setup.owner.months = ['2026-01-01']

		expect(second.popover.open).toBe(false)
		expect(setup.facade.pickers).toHaveLength(1)
	})

	it('без календаря панелей нет', () => {
		const facade = new TCalendarCollectionFacade()

		expect(facade.pickers).toEqual([])
	})
})

/**
 * The list of a place with its engine comes with the first opening of the
 * place's popover: the picker is opened rarely, and a shown calendar holds no
 * list until then. The popover stays with the place — it is the trigger of
 * the grid's heading.
 */
describe('список места — с первого открытия', () => {
	it('до открытия у места нет списка, а поповер есть', () => {
		const setup = calendar({ months: ['2026-01-01', '2026-09-01'] })

		expect(setup.facade.pickers.map((picker) => picker.list)).toEqual([undefined, undefined])
		expect(setup.facade.pickers.every((picker) => picker.popover.open === false)).toBe(true)
	})

	it('открытие заводит список с движком — уже с составом — и шлёт change:pickers', () => {
		const setup = calendar({ months: ['2026-01-01', '2026-09-01'] })
		const changes = vi.fn()

		setup.facade.events.on('change:pickers', () => changes(panel(setup, 1).list))
		open(setup, 1)

		const list = pickerList(setup, 1)

		// The snapshot that announces the opening already carries the list
		expect(changes).toHaveBeenLastCalledWith(list)
		expect(list.engine.extensions.batch.items).toHaveLength(12)
		expect(list.ctrl.value).toBe('2026-09-01')
		// The other place has not been opened: no list there
		expect(panel(setup, 0).list).toBeUndefined()
	})

	it('повторное открытие — тот же список; снимки отдают ту же запись', () => {
		const setup = calendar()

		open(setup)

		const list = pickerList(setup)

		panel(setup).popover.open = false

		expect(panel(setup).list).toBe(list)

		open(setup)

		expect(panel(setup).list).toBe(list)
		expect(panel(setup).list).toBe(panel(setup).list)
	})

	it('у места без списка шапка и стрелки — ничего: ни списка, ни change:pickers', () => {
		const setup = calendar({ months: ['2026-09-01'] })
		const before = panel(setup)
		const changes = vi.fn()

		setup.facade.events.on('change:pickers', changes)
		setup.picker.toggleLevel(0)
		setup.picker.showNext(0)
		setup.picker.showPrev(0)

		expect(changes).not.toHaveBeenCalled()
		expect(panel(setup)).toEqual(before)
		expect(panel(setup).list).toBeUndefined()
	})

	it('листание, локаль, границы и чтение выхода список не заводят', () => {
		const setup = calendar({ months: ['2026-09-01'] })

		setup.view.showNext()
		setup.owner.locale = 'ru-RU'
		setup.owner.max = '2026-12-20'
		setup.picker.pickerSets(0).heading.add('id', 'heading-0')

		expect(setup.facade.pickers[0]?.list).toBeUndefined()
		expect(setup.picker.pickers[0]?.list).toBeUndefined()
	})

	it('после первого открытия шапка и стрелки работают и у закрытой панели', () => {
		const setup = calendar({ months: ['2026-09-01'] })

		open(setup)
		panel(setup).popover.open = false
		setup.picker.toggleLevel(0)
		setup.picker.showNext(0)

		expect(panel(setup).level).toBe('years')
		expect(values(setup)[0]).toBe(2029)
	})
})

/**
 * What a shown calendar holds: a popover per grid place, and no list until
 * its picker is opened. `queryObjects` from `node:v8` collects garbage itself
 * and counts live instances of a class; the counters are global to the
 * worker, so `2N` calendars are counted against `N`, as the weight of a
 * closed DatePicker in `date-picker.spec.ts`.
 */
describe('вес показанного календаря', () => {
	const COUNT = 10

	/** Live lists and popovers right now. */
	function census() {
		return {
			lists: queryObjects(TListBox, { format: 'count' }),
			popovers: queryObjects(TPopover, { format: 'count' }),
		}
	}

	type TCensus = ReturnType<typeof census>

	/** What `count` calendars built by `build` add while they are alive. */
	function added(count: number, build: () => TCalendarSetup): TCensus {
		const before = census()
		const held = Array.from({ length: count }, build)
		const after = census()

		expect(held).toHaveLength(count)

		return { lists: after.lists - before.lists, popovers: after.popovers - before.popovers }
	}

	/** The price of `COUNT` calendars: `2N` against `N`. */
	function perCount(build: () => TCalendarSetup): TCensus {
		const once = added(COUNT, build)
		const twice = added(2 * COUNT, build)

		return { lists: twice.lists - once.lists, popovers: twice.popovers - once.popovers }
	}

	it('две сетки — по поповеру на место и ни одного списка', () => {
		expect(perCount(() => calendar({ months: ['2026-01-01', '2026-09-01'] }))).toEqual({
			lists: 0,
			popovers: 2 * COUNT,
		})
	})

	it('открыли панель одного места — список только у него', () => {
		const opened = () => {
			const setup = calendar({ months: ['2026-01-01', '2026-09-01'] })

			open(setup, 1)

			return setup
		}

		expect(perCount(opened)).toEqual({ lists: COUNT, popovers: 2 * COUNT })
	})
})

describe('месяцы', () => {
	it('открытие — 12 месяцев года сетки, выбран месяц сетки, в шапке год', () => {
		const setup = calendar({ months: ['2026-09-01'] })
		const picker = open(setup)

		expect(picker.level).toBe('months')
		expect(picker.heading).toBe(year(2026))
		expect(values(setup)).toEqual(MONTHS_2026)
		expect(options(setup).map((item) => item.text)).toEqual(
			MONTHS_2026.map((month) =>
				new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(
					Date.UTC(2026, Number(month.slice(5, 7)) - 1, 1),
				),
			),
		)
		expect(pickerList(setup).ctrl.value).toBe('2026-09-01')
		expect(
			pickerList(setup).engine.extensions.selection.selected.map((item) => item.value),
		).toEqual(['2026-09-01'])
	})

	it('выбор месяца показывает его в сетке и закрывает панель', () => {
		const setup = calendar({ months: ['2026-09-01'] })
		const picker = open(setup)

		expect(choose(setup, '2026-03-01')).toBe(true)

		expect(setup.owner.months).toEqual(['2026-03-01'])
		expect(picker.popover.open).toBe(false)
	})

	it('выбор показанного месяца тоже закрывает панель, сетка на месте', () => {
		const setup = calendar({ months: ['2026-09-01'] })
		const picker = open(setup)

		choose(setup, '2026-09-01')

		expect(setup.owner.months).toEqual(['2026-09-01'])
		expect(picker.popover.open).toBe(false)
	})

	it('месяц другой сетки — сетки меняются местами', () => {
		const setup = calendar({ months: ['2026-01-01', '2026-09-01'] })

		open(setup, 1)
		choose(setup, '2026-01-01', 1)

		expect(setup.owner.months).toEqual(['2026-09-01', '2026-01-01'])
	})

	it('открытая панель идёт за месяцем своей сетки и за локалью', () => {
		const setup = calendar({ months: ['2026-09-01'] })

		open(setup)
		setup.view.showNext()

		expect(pickerList(setup).ctrl.value).toBe('2026-10-01')

		setup.owner.locale = 'ru-RU'

		expect(options(setup)[2].text).toBe(
			new Intl.DateTimeFormat('ru-RU', { month: 'short', timeZone: 'UTC' }).format(
				Date.UTC(2026, 2, 1),
			),
		)
	})
})

describe('годы', () => {
	it('кнопка шапки — годы страницы, выбран год панели; в шапке отрезок', () => {
		const setup = calendar({ months: ['2026-09-01'] })

		open(setup)
		setup.picker.toggleLevel(0)

		const picker = panel(setup)

		expect(picker.level).toBe('years')
		expect(picker.heading).toBe(years(2017, 2028))
		expect(values(setup)).toEqual([
			2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028,
		])
		expect(pickerList(setup).ctrl.value).toBe(2026)
		expect(picker.popover.open).toBe(true)
	})

	it('выбор года — снова месяцы, уже этого года; панель открыта, выбранного нет', () => {
		const setup = calendar({ months: ['2026-09-01'] })

		open(setup)
		setup.picker.toggleLevel(0)
		choose(setup, 2028)

		const picker = panel(setup)

		expect(picker.level).toBe('months')
		expect(picker.heading).toBe(year(2028))
		expect(values(setup)[0]).toBe('2028-01-01')
		expect(pickerList(setup).ctrl.value).toBeUndefined()
		expect(picker.popover.open).toBe(true)
		expect(setup.owner.months).toEqual(['2026-09-01'])

		choose(setup, '2028-03-01')

		expect(setup.owner.months).toEqual(['2028-03-01'])
		expect(picker.popover.open).toBe(false)
	})

	it('выбор выбранного года — тоже месяцы, хотя в single он снимает выбор', () => {
		const setup = calendar({ months: ['2026-09-01'] })

		open(setup)
		setup.picker.toggleLevel(0)
		choose(setup, 2026)

		expect(panel(setup).level).toBe('months')
		expect(pickerList(setup).ctrl.value).toBe('2026-09-01')
	})

	it('кнопка шапки на годах возвращает месяцы того же года', () => {
		const setup = calendar({ months: ['2026-09-01'] })

		open(setup)
		setup.picker.toggleLevel(0)
		setup.picker.toggleLevel(0)

		expect(panel(setup).level).toBe('months')
		expect(pickerList(setup).ctrl.value).toBe('2026-09-01')
	})

	it('страницы — по 12 лет от 0001, а не вокруг года', () => {
		const setup = calendar({ months: ['2028-09-01'] })

		open(setup)
		setup.picker.toggleLevel(0)

		expect(values(setup)[0]).toBe(2017)

		const first = calendar({ months: ['0005-09-01'] })

		open(first)
		first.picker.toggleLevel(0)

		expect(values(first)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
		expect(panel(first).prevDisabled).toBe(true)
	})

	it('последняя страница — до 9999: лет за ним нет', () => {
		const setup = calendar({ months: ['9999-12-01'] })

		open(setup)
		setup.picker.toggleLevel(0)

		expect(values(setup)).toEqual([9997, 9998, 9999])
		expect(panel(setup).heading).toBe(years(9997, 9999))
		expect(panel(setup).nextDisabled).toBe(true)
	})
})

/**
 * Подпись шире плитки список переносит между словами — на обоих уровнях: имя
 * месяца бывает в несколько слов (`vi-VN` — «Tháng 10»), подпись года — с эрой
 * (`th-TH`), и многоточие срезало бы номер — то, чем плитки и различаются.
 * Решает расширение, а не разметка: список создаёт оно.
 */
describe('подпись шире плитки', () => {
	const fits = (setup: TCalendarSetup) =>
		options(setup).map((item) => item.dataset.get('content-fit'))

	it('переносится у месяцев и у лет — у списка и у каждой его плитки', () => {
		const setup = calendar({ months: ['2026-09-01'] })

		// The list comes with the first opening, already wrapping
		open(setup)

		expect(pickerList(setup).ctrl.contentFit).toBe('wrap')
		expect(new Set(fits(setup))).toEqual(new Set(['wrap']))

		setup.picker.toggleLevel(0)

		expect(pickerList(setup).ctrl.contentFit).toBe('wrap')
		expect(new Set(fits(setup))).toEqual(new Set(['wrap']))

		// Другая страница лет, и выбор года — снова месяцы
		setup.picker.showNext(0)
		choose(setup, 2030)

		expect(panel(setup).level).toBe('months')
		expect(pickerList(setup).ctrl.contentFit).toBe('wrap')
		expect(new Set(fits(setup))).toEqual(new Set(['wrap']))
	})
})

describe('стрелки', () => {
	it('на месяцах — год, на годах — страница из 12 лет', () => {
		const setup = calendar({ months: ['2026-09-01'] })

		open(setup)
		setup.picker.showNext(0)

		expect(panel(setup).heading).toBe(year(2027))
		expect(values(setup)[0]).toBe('2027-01-01')
		expect(pickerList(setup).ctrl.value).toBeUndefined()

		setup.picker.toggleLevel(0)
		setup.picker.showNext(0)

		expect(values(setup)[0]).toBe(2029)

		setup.picker.showPrev(0)
		setup.picker.showPrev(0)

		expect(values(setup)[0]).toBe(2005)
		expect(panel(setup).heading).toBe(years(2005, 2016))
	})

	it('имён стрелок ядро не строит: наборы места пусты, их пишет плагин имён', () => {
		const setup = calendar()

		open(setup)

		expect(panel(setup).prevAria).toEqual({})
		expect(panel(setup).nextAria).toEqual({})
	})

	it('запись в набор стрелки — change:pickers и новый снимок; то же значение — не смена', () => {
		const setup = calendar()
		const changes = vi.fn()

		open(setup)
		setup.facade.events.on('change:pickers', changes)
		setup.picker.pickerSets(0).prev.add('aria-label', 'Предыдущий год')

		expect(changes).toHaveBeenCalledTimes(1)
		expect(panel(setup).prevAria).toEqual({ 'aria-label': 'Предыдущий год' })

		setup.picker.pickerSets(0).prev.add('aria-label', 'Предыдущий год')

		expect(changes).toHaveBeenCalledTimes(1)
	})
})

describe('границы', () => {
	it('месяцы вне min/max выключены и не выбираются; стрелка к ним гаснет', () => {
		const setup = calendar({ months: ['2026-09-01'], min: '2025-05-10', max: '2026-10-20' })

		open(setup)

		expect(disabled(setup)).toEqual(['2026-11-01', '2026-12-01'])
		expect(panel(setup).nextDisabled).toBe(true)
		expect(panel(setup).prevDisabled).toBe(false)
		expect(choose(setup, '2026-11-01')).toBe(false)
		expect(setup.owner.months).toEqual(['2026-09-01'])

		setup.picker.showNext(0)

		expect(panel(setup).heading).toBe(year(2026))

		setup.picker.showPrev(0)

		expect(disabled(setup)).toEqual(['2025-01-01', '2025-02-01', '2025-03-01', '2025-04-01'])
		expect(panel(setup).prevDisabled).toBe(true)
	})

	it('годы вне min/max выключены; листать страницы некуда', () => {
		const setup = calendar({ months: ['2026-09-01'], min: '2025-05-10', max: '2026-10-20' })

		open(setup)
		setup.picker.toggleLevel(0)

		expect(values(setup).filter((value) => !disabled(setup).includes(value))).toEqual([
			2025, 2026,
		])
		expect(panel(setup).prevDisabled).toBe(true)
		expect(panel(setup).nextDisabled).toBe(true)
	})

	it('смена границы пересобирает открытую панель', () => {
		const setup = calendar({ months: ['2026-09-01'] })

		open(setup)

		expect(disabled(setup)).toEqual([])

		setup.owner.max = '2026-10-20'

		expect(disabled(setup)).toEqual(['2026-11-01', '2026-12-01'])
		expect(panel(setup).nextDisabled).toBe(true)
	})

	it('выключенный календарь закрывает панели', () => {
		const setup = calendar()
		const picker = open(setup)

		setup.owner.disabled = true

		expect(picker.popover.open).toBe(false)
	})
})

/**
 * Нажатие по подложке — по самой панели вокруг её содержимого — плагин
 * указателя переводит в команду `close` места.
 */
describe('закрытие', () => {
	it('close закрывает панель своего места, соседняя остаётся открытой', () => {
		const setup = calendar({ months: ['2026-01-01', '2026-09-01'] })
		const first = open(setup, 0)
		const second = open(setup, 1)

		setup.picker.close(1)

		expect(second.popover.open).toBe(false)
		expect(first.popover.open).toBe(true)
		expect(setup.owner.months).toEqual(['2026-01-01', '2026-09-01'])
	})

	it('месту без сетки — ничего: мест не прибавилось, открытая панель не тронута', () => {
		const setup = calendar({ months: ['2026-09-01'] })
		const picker = open(setup)
		const changes = vi.fn()

		setup.facade.events.on('change:pickers', changes)
		setup.picker.close(1)

		expect(picker.popover.open).toBe(true)
		expect(setup.facade.pickers).toHaveLength(1)
		expect(changes).not.toHaveBeenCalled()
	})
})

describe('повторное открытие', () => {
	it('начинается с месяцев года сетки, что бы панель ни показывала до закрытия', () => {
		const setup = calendar({ months: ['2026-09-01'] })
		const picker = open(setup)

		setup.picker.toggleLevel(0)
		setup.picker.showNext(0)
		picker.popover.open = false
		open(setup)

		expect(panel(setup).level).toBe('months')
		expect(panel(setup).heading).toBe(year(2026))
		expect(pickerList(setup).ctrl.value).toBe('2026-09-01')
	})
})

describe('шапка', () => {
	it('labels follow lazy content independently for each grid place', () => {
		const setup = calendar({ months: ['2026-01-01', '2026-09-01'] })

		setup.picker.pickerSets(0).heading.add('id', 'heading-0')
		setup.picker.pickerSets(1).heading.add('id', 'heading-1')

		const first = panel(setup, 0)
		const second = panel(setup, 1)
		const changes = vi.fn()

		setup.facade.events.on('change:pickers', () => changes(setup.facade.pickers))

		expect(first.headingAria).toEqual({ id: 'heading-0' })
		expect(first.labelledBy).toBeUndefined()
		expect(second.labelledBy).toBeUndefined()
		expect(setup.facade.pickers.every((picker) => picker.list === undefined)).toBe(true)

		open(setup, 1)

		const list = pickerList(setup, 1)

		expect(changes).toHaveBeenLastCalledWith([
			expect.objectContaining({ labelledBy: undefined, list: undefined }),
			expect.objectContaining({ labelledBy: 'heading-1', list }),
		])

		second.popover.open = false

		expect(panel(setup, 1).labelledBy).toBe('heading-1')
		expect(panel(setup, 1).list).toBe(list)

		open(setup, 1)

		expect(panel(setup, 1).labelledBy).toBe('heading-1')
		expect(panel(setup, 1).popover).toBe(second.popover)
		expect(panel(setup, 1).list).toBe(list)
		expect(panel(setup, 0).labelledBy).toBeUndefined()
		expect(panel(setup, 0).list).toBeUndefined()
	})

	it('id шапки — из наборов места; его смена — change:pickers', () => {
		const setup = calendar()
		const changes = vi.fn()

		expect(panel(setup).labelledBy).toBeUndefined()

		setup.facade.events.on('change:pickers', changes)
		setup.picker.pickerSets(0).heading.add('id', 'heading-0')

		expect(changes).toHaveBeenCalledTimes(1)
		expect(panel(setup).labelledBy).toBeUndefined()

		open(setup)

		expect(panel(setup).labelledBy).toBe('heading-0')
		expect(panel(setup).headingAria).toEqual({ id: 'heading-0' })
	})

	it('шапка в календаре локали: у th-TH год буддийский', () => {
		const setup = calendar({ months: ['2026-09-01'], locale: 'th-TH' })

		open(setup)

		expect(panel(setup).heading).toBe(
			new Intl.DateTimeFormat(['th-TH', 'en-US'], {
				year: 'numeric',
				calendar: 'buddhist',
				timeZone: 'UTC',
			}).format(Date.UTC(2026, 0, 1)),
		)
	})
})
