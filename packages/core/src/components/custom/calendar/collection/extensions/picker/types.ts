import type { IExtension } from '../../../../../base/collection'
import type { TAria, TAriaAttributes } from '../../../../../../common'
import type { IPopover } from '../../../../popover'
import type { IListBox, TListBoxCollection } from '../../../../list-box'
import type { ICalendarItem } from '../../../item/types'

/** Уровень панели выбора: месяцы одного года или годы одной страницы. */
export type TCalendarPickerLevel = 'months' | 'years'

/**
 * Наборы места панели — то, что пишут в панель снаружи расширения: `id`
 * шапки (плагин связок), по которому панель и её список называются шапкой, и
 * имена стрелок (плагин имён) — по уровню панели: год или страница лет.
 */
export type TCalendarPickerSets = {
	/** Шапка панели: год или отрезок лет */
	heading: TAria
	/** Стрелка «назад» */
	prev: TAria
	/** Стрелка «вперёд» */
	next: TAria
}

/**
 * The list of a place's panel and its engine. They come together, with the
 * first opening of the place's popover, and live as long as the place: the
 * markup hands them to ListBox as `ctrl` and `engine`.
 */
export type TCalendarPickerList = {
	/** The list of months or years */
	readonly ctrl: IListBox
	/** The list's engine */
	readonly engine: TListBoxCollection
}

/**
 * The month and year picker of a grid — the markup's output, one per grid
 * place.
 *
 * The instances belong to the place and live as long as the calendar's
 * engine; the markup hands them to components as `ctrl` and `engine`. The
 * popover comes with the place: it is the trigger of the grid's heading. The
 * list comes with the first opening of the popover — a shown calendar holds
 * no list until its picker is opened, and the markup draws ListBox by the
 * presence of `list`. The rest is a snapshot of what the panel shows now.
 */
export type TCalendarPicker = {
	/** The panel's popover; its trigger is the grid's heading */
	popover: IPopover
	/** The list of months or years with its engine; `undefined` until the first opening */
	list: TCalendarPickerList | undefined
	/** What the list holds: the months of a year or the years of a page */
	level: TCalendarPickerLevel
	/** The header text: the year on months, the page's span on years */
	heading: string
	/** The header's set: its `id` */
	headingAria: TAriaAttributes
	/**
	 * The header's `id` — it names the panel and the list (`aria_labelledBy`).
	 * Undefined until the ids plugin writes it and the lazy content is first rendered.
	 */
	labelledBy: string | undefined
	/** The "back" arrow's set: the name by level — a year or a page of years — is written by the names plugin */
	prevAria: TAriaAttributes
	/** The "forward" arrow's set */
	nextAria: TAriaAttributes
	/** Nowhere to page back: only years before `min` or `0001` lie behind */
	prevDisabled: boolean
	/** Nowhere to page forward: only years after `max` or `9999` lie ahead */
	nextDisabled: boolean
}

export type TCalendarPickerEvents = {
	/**
	 * Панели надо перечитать: сменились уровень, год или страница, состав
	 * мест (месяцы сеток), подписи, границы, `id` шапки или имена стрелок. Без аргумента —
	 * выход собирается из владельца, вида и мест
	 */
	'change:pickers': () => void
}

/**
 * Контракт расширения панелей выбора месяца и года.
 *
 * Панель — на месте сетки, а не на месяце: листание меняет месяц сетки, а
 * заголовок, его поповер и список остаются.
 */
export interface ICalendarPickerExtension extends IExtension<ICalendarItem, TCalendarPickerEvents> {
	/** Панели мест — по одной на сетку, в порядке сеток */
	readonly pickers: TCalendarPicker[]
	/** Наборы места `index`: пишут в них плагины связок и имён */
	pickerSets(index: number): TCalendarPickerSets
	/** The header button: months ⇄ years. A place whose panel was never opened has no list — nothing */
	toggleLevel(index: number): void
	/**
	 * The "back" arrow: a year back on months, a page of 12 years on years. A
	 * place whose panel was never opened — nothing
	 */
	showPrev(index: number): void
	/** The "forward" arrow */
	showNext(index: number): void
	/** Закрыть панель места — нажатие по её подложке. Места нет — ничего */
	close(index: number): void
}
