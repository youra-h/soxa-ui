import type { TValuePayload } from '../../../../../../common'
import { TBaseExtension } from '../../../../../base/collection'
import type { IExtensionContext } from '../../../../../base/collection'
import {
	TAria,
	calendarLocale,
	compareDates,
	dateFromParts,
	startOfMonth,
	yearOf,
} from '../../../../../../common'
import type { TCalendarDate } from '../../../../../../common'
import { TPopover } from '../../../../popover'
import type { IPopover } from '../../../../popover'
import { TListBox, createEngineListBox } from '../../../../list-box'
import type { IListBoxItem, IListBoxItemProps } from '../../../../list-box'
import { calendarBounds } from '../../../dates'
import type { ICalendarItem } from '../../../item/types'
import type { ICalendar } from '../../../types'
import { viewOf } from '../guards'
import type { TCalendarEngineOptions } from '../view'
import type {
	ICalendarPickerExtension,
	TCalendarPicker,
	TCalendarPickerEvents,
	TCalendarPickerLevel,
	TCalendarPickerList,
	TCalendarPickerSets,
} from './types'

/** Лет на странице — 4 колонки по 3 строки. */
const PAGE_SIZE = 12

/** Годы поддерживаемых дат: у года четыре цифры. */
const FIRST_YEAR = 1
const LAST_YEAR = 9999

/** Месяцы года — от 1. */
const MONTHS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

/**
 * A panel's place: what the panel shows and its instances. The level, the
 * year and the page are the place's memory rather than the owner's: every
 * grid has a panel of its own.
 */
type TPlace = {
	readonly popover: IPopover
	/** The list with its engine — from the first opening of the popover */
	list: TCalendarPickerList | undefined
	readonly sets: TCalendarPickerSets
	level: TCalendarPickerLevel
	/** The months' year — what the months level shows */
	year: number
	/** The page's first year — what the years level shows */
	page: number
}

/**
 * Month and year pickers: the grid's heading opens a popover with a list of
 * months, the header with the year switches the months to years, choosing a
 * year brings the months back, choosing a month shows it in the grid and
 * closes the panel.
 *
 * A collection extension rather than markup: the panels need both the owner —
 * the locale, the bounds, being disabled — and the view — the grid's month and
 * `showMonth`. The links "a month chosen → show it and close" and "a year
 * chosen → the months again" are made here once, not in the markup of every
 * adapter.
 *
 * **Ready instances, like the tags of Select.** A grid place gets a
 * `TPopover`, and with the popover's first opening a `TListBox` with its
 * engine. The extension creates and listens to them, the markup hands them to
 * components. The popover comes with the place: it is the trigger of the
 * grid's heading. The list waits for the first opening: the picker is opened
 * rarely, and without the wait every shown calendar would hold a list with
 * its collection per grid. The list is ListBox and its collection: the
 * calendar has no selection of its own over the months. Selected in the list
 * is what is shown now: the grid's month on the months level, the panel's
 * year on the years level. The user's choice comes with the list's `choose`
 * event — by `change:selection` it cannot be told from a deselection: in
 * `single` pressing the selected item again deselects it.
 *
 * **The place, not the month.** The panel belongs to the grid, like the
 * heading sets of the view (`gridSets`): paging changes the grid's month,
 * while the heading and its panel stay. There are as many places as grids; a
 * place left without a grid closes its panel.
 *
 * **The list's items — on opening.** An opened panel starts with the months
 * of its grid's year. While it is closed, the list is not rebuilt: the
 * panel's content is not mounted until the first opening (`lazyMount`), and
 * hidden afterwards. An open one is rebuilt on a change of the grid's month,
 * the locale and the bounds.
 *
 * **Pages of years — 12 in a row from `0001`** (`0001–0012`, …,
 * `2017–2028`), not around the current year: a page does not depend on the
 * year paging started from. Years outside `min`/`max` are disabled, there are
 * no items past `9999` — the last page is shorter.
 */
export class TCalendarPickerExtension
	extends TBaseExtension<ICalendarItem, TCalendarPickerEvents, TCalendarEngineOptions>
	implements ICalendarPickerExtension
{
	readonly name = 'picker' as const

	private readonly _places: TPlace[] = []

	override install(ctx: IExtensionContext<ICalendarItem, TCalendarEngineOptions>): void {
		super.install(ctx)

		// Месяцы сеток сменились: мест бывает больше или меньше, а открытая
		// панель показывает выбранным месяц своей сетки
		viewOf(ctx)?.events.on('change:months', () => this._refresh())

		// Календарь — опция движка: приходит и уходит после сборки. Подписки на
		// него живут в области наблюдателя — сменился календарь, прежние сняты
		ctx.options.watch('owner', (owner, scope) => {
			if (!owner) return

			this._refresh()

			// Подписи и границы — открытая панель пересобирается
			scope.on(owner.events, 'change:locale', () => this._refresh())
			scope.on(owner.events, 'change:min', () => this._refresh())
			scope.on(owner.events, 'change:max', () => this._refresh())

			// Выключенный календарь выбирать не даёт: заголовок выключен, а
			// открытая панель закрывается
			scope.on(
				owner.events,
				'change:disabled',
				({ newValue: off }: TValuePayload<boolean>) => {
					if (off) this._places.forEach((place) => (place.popover.open = false))
				},
			)
		})
	}

	/** Панели мест — по одной на сетку. Календаря нет — сеток и панелей тоже. */
	get pickers(): TCalendarPicker[] {
		const owner = this._ctx.options.get('owner')
		const months = viewOf(this._ctx)?.months ?? []

		if (!owner) return []

		return months.map((_, index) => this._snapshot(owner, this._place(index)))
	}

	/**
	 * Наборы места `index`: в них пишет плагин связок. У нового места наборы
	 * заводятся вместе с ним; их смена — `change:pickers`.
	 */
	pickerSets(index: number): TCalendarPickerSets {
		return this._place(index).sets
	}

	toggleLevel(index: number): void {
		const place = this._places[index]

		if (!place?.list) return

		if (place.level === 'months') {
			place.level = 'years'
			place.page = pageOf(place.year)
		} else {
			place.level = 'months'
		}

		this._fill(place, index)
		this._notify()
	}

	showPrev(index: number): void {
		this._page(index, -1)
	}

	showNext(index: number): void {
		this._page(index, 1)
	}

	/**
	 * Нажатие по подложке — по самой панели вокруг её содержимого: панель
	 * накрывает календарь, а выбирают в содержимом. Закрывает записью `open`,
	 * как выбор месяца, и фокус на заголовок возвращает плагин фокуса поповера.
	 */
	close(index: number): void {
		const place = this._places[index]

		if (place) place.popover.open = false
	}

	/* ------------------------------------------------------------------ */
	/* Внутреннее                                                         */
	/* ------------------------------------------------------------------ */

	/**
	 * Place `index`; when there is none yet, it is set up with its popover and
	 * sets. The list waits for the first opening of the popover (`_list`).
	 */
	private _place(index: number): TPlace {
		const existing = this._places[index]

		if (existing) return existing

		// No close button: a cross in the corner of a small panel is noise. The
		// panel is closed by choosing a month, a press outside, Escape, pressing
		// the heading again, a press on the backdrop (`close`) and the gesture
		// past the handle — the panel is swiped towards its edge, up (the
		// markup sets the edge). The content is not mounted until the first
		// opening
		const popover = new TPopover({ closable: false, lazyMount: true, swipe: 'handle' })
		const month = this._gridMonth(index)
		const year = month === undefined ? FIRST_YEAR : yearOf(month)
		const sets = { heading: new TAria(), prev: new TAria(), next: new TAria() }

		// The three sets of the place report one change of the picker
		const changed = () => this._notify()

		sets.heading.subscribe(changed)
		sets.prev.subscribe(changed)
		sets.next.subscribe(changed)

		const place: TPlace = {
			popover,
			list: undefined,
			sets,
			level: 'months',
			year,
			page: pageOf(year),
		}

		// The place's instances are its own and live with the extension: the
		// subscriptions are direct
		popover.events.on('change:open', ({ newValue: open }: TValuePayload<boolean>) => {
			if (open) this._open(place, index)
		})

		this._places[index] = place

		return place
	}

	/**
	 * The list of a place and its engine — with the first opening of its
	 * popover, by the same `change:open` that fills the list. They live as
	 * long as the place, and so does the subscription to the list's choice.
	 */
	private _list(place: TPlace, index: number): TCalendarPickerList {
		// A label wider than its tile wraps between words — on both levels. A
		// month's name can be several words (`vi-VN` — "Tháng 10"), a year's
		// label carries an era (`th-TH` — "พ.ศ. 2569"), and an ellipsis would
		// cut the number — the very thing the tiles differ by. A word wider
		// than the tile has nowhere to wrap: the theme cuts it at the tile's edge
		const ctrl = new TListBox({ contentFit: 'wrap' })
		const engine = createEngineListBox({ owner: ctrl })

		// The items are matched by value: rebuilding the same year does not
		// recreate them, and the keyboard highlight stays in place
		engine.extensions.batch.trackBy = (item) => item.value
		engine.extensions.list.events.on('choose', (item: IListBoxItem) =>
			this._choose(place, index, item),
		)

		return { ctrl, engine }
	}

	/** The panel opened — with the months of its grid's year; the first opening makes the list. */
	private _open(place: TPlace, index: number): void {
		const month = this._gridMonth(index)

		if (month !== undefined) place.year = yearOf(month)

		place.level = 'months'
		place.page = pageOf(place.year)
		place.list ??= this._list(place, index)

		this._fill(place, index)
		this._notify()
	}

	/**
	 * Выбор пользователя. Месяц — в сетку, и панель закрывается; закрывается
	 * она раньше: открытой панели пришлось бы пересобрать список под новый
	 * месяц сетки. Год — снова месяцы, уже этого года, панель открыта.
	 */
	private _choose(place: TPlace, index: number, item: IListBoxItem): void {
		const value = item.value

		if (place.level === 'months') {
			if (typeof value !== 'string') return

			place.popover.open = false
			viewOf(this._ctx)?.showMonth(index, value)

			return
		}

		if (typeof value !== 'number') return

		place.year = value
		place.level = 'months'

		this._fill(place, index)
		this._notify()
	}

	/**
	 * An arrow: a year on months, a page on years. Nowhere further to page, or
	 * a place without a list — nothing.
	 */
	private _page(index: number, step: -1 | 1): void {
		const place = this._places[index]
		const owner = this._ctx.options.get('owner')

		if (!place?.list || !owner) return

		const snapshot = this._snapshot(owner, place)

		if (step < 0 ? snapshot.prevDisabled : snapshot.nextDisabled) return

		if (place.level === 'months') {
			place.year += step
		} else {
			place.page += step * PAGE_SIZE
		}

		this._fill(place, index)
		this._notify()
	}

	/**
	 * Месяцы сеток или владелец сменились: заводятся новые места, место без
	 * сетки закрывает панель, открытые панели пересобираются.
	 */
	private _refresh(): void {
		const count = viewOf(this._ctx)?.months.length ?? 0

		for (let index = 0; index < count; index++) this._place(index)

		this._places.forEach((place, index) => {
			if (index >= count) {
				place.popover.open = false
			} else if (place.popover.open) {
				this._fill(place, index)
			}
		})

		this._notify()
	}

	/**
	 * The list's items by level and what is selected in it — what is shown
	 * now: the grid's month among the months, the panel's year among the
	 * years. The list's value is written after the items: the `value`
	 * extension matches it with the selection by the items' values. A place
	 * without a list — nothing: there is nothing to fill before the first
	 * opening.
	 */
	private _fill(place: TPlace, index: number): void {
		const owner = this._ctx.options.get('owner')
		const list = place.list

		if (!owner || !list) return

		const locale = calendarLocale(owner.locale)
		const bounds = this._yearBounds(owner)

		if (place.level === 'months') {
			const dates = calendarBounds(owner.min, owner.max)
			const low = startOfMonth(dates.low)
			const high = startOfMonth(dates.high)
			const sources: Partial<IListBoxItemProps>[] = MONTHS.map((month) => {
				const date = dateFromParts(place.year, month, 1)

				return {
					value: date,
					text: locale.monthName(date),
					disabled: compareDates(date, low) < 0 || compareDates(date, high) > 0,
				}
			})
			const shown = this._gridMonth(index)

			list.engine.extensions.batch.update(sources)
			list.ctrl.value =
				shown !== undefined && yearOf(shown) === place.year ? shown : undefined

			return
		}

		const sources: Partial<IListBoxItemProps>[] = []

		for (let year = place.page; year < place.page + PAGE_SIZE; year++) {
			if (year < FIRST_YEAR || year > LAST_YEAR) continue

			sources.push({
				value: year,
				text: locale.yearTitle(dateFromParts(year, 1, 1)),
				disabled: year < bounds.low || year > bounds.high,
			})
		}

		list.engine.extensions.batch.update(sources)
		list.ctrl.value =
			place.year >= place.page && place.year < place.page + PAGE_SIZE ? place.year : undefined
	}

	/** Выход места — снимок, новые объекты на каждое чтение. */
	private _snapshot(owner: ICalendar, place: TPlace): TCalendarPicker {
		const locale = calendarLocale(owner.locale)
		const bounds = this._yearBounds(owner)
		const months = place.level === 'months'
		const first = months ? place.year : place.page
		const last = months ? place.year : place.page + PAGE_SIZE - 1

		return {
			popover: place.popover,
			list: place.list,
			level: place.level,
			heading: months
				? locale.yearTitle(dateFromParts(place.year, 1, 1))
				: locale.yearsTitle(
						dateFromParts(Math.max(first, FIRST_YEAR), 1, 1),
						dateFromParts(Math.min(last, LAST_YEAR), 1, 1),
					),
			headingAria: place.sets.heading.toObject(),
			// The frame exists before its lazy heading; after opening, both stay mounted.
			labelledBy: place.popover.contentRendered ? place.sets.heading.get('id') : undefined,
			prevAria: place.sets.prev.toObject(),
			nextAria: place.sets.next.toObject(),
			prevDisabled: first - 1 < bounds.low,
			nextDisabled: last + 1 > bounds.high,
		}
	}

	/** Годы, которые можно выбрать: от года `min` до года `max`. */
	private _yearBounds(owner: ICalendar): { low: number; high: number } {
		const { low, high } = calendarBounds(owner.min, owner.max)

		return { low: yearOf(low), high: yearOf(high) }
	}

	/** Месяц сетки на месте `index`; сетки нет — `undefined`. */
	private _gridMonth(index: number): TCalendarDate | undefined {
		return viewOf(this._ctx)?.months[index]
	}

	private _notify(): void {
		this.events.emit('change:pickers')
	}
}

/** Первый год страницы, на которой лежит `year`: страницы — по 12 лет от `0001`. */
function pageOf(year: number): number {
	return year - ((((year - FIRST_YEAR) % PAGE_SIZE) + PAGE_SIZE) % PAGE_SIZE)
}
