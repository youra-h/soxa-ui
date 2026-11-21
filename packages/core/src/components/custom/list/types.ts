import type { TValuePayload } from '../../../common'
import type { TScrollBehavior } from '../../../common'

/**
 * Общий контракт списочных компонентов — **только контракт**.
 *
 * Класса в этой папке нет и не будет. Здесь лежат props, события и интерфейс
 * свойств, одинаковых у `TListBox` и `TSelect`; реализацию каждый пишет у себя.
 *
 * Почему не общий предок. `TListBox` растёт от `TValueControl`, `TSelect` — от
 * `TInputControl`: список это значение, поле выбора это ввод. Единственное
 * наследование занято. Раньше здесь стоял компонент `TList`, но наследовать от
 * него мог только ListBox — Select всё равно оставался в стороне.
 *
 * Почему не плагин. Пробовали: свойства переехали в `TListLayoutPlugin`, и ядро
 * перестало быть самодостаточным — `new TListBox({ maxRows: 5 })` молчаливо не
 * срабатывал, а `list.maxRows = 6` писал в пустоту, потому что свойство лежало
 * в бандле, которого у голого инстанса нет. Плагины в этом проекте свойствами
 * не владеют: все восемь читают их у инстанса и подписываются на его события.
 * Тот плагин был единственным исключением, и сломался именно он.
 *
 * Почему не миксин. Классы параметризованы парой `TProps/TEvents`,
 * есть статический `defaultValues` и повсеместный `new.target as typeof X` —
 * дженерики через результат миксина не протаскиваются.
 *
 * Остаётся то, что здесь: общий контракт, две реализации. Расхождение копий
 * стережёт `core/__tests__/list-contract.spec.ts` — тем же приёмом, которым
 * `facade-props.spec.ts` стережёт фасады после истории с `mode`.
 */

/**
 * Что делать с текстом, который не помещается в строку.
 *
 * Одно свойство вместо пары `wordWrap`/`autoWidth`, и не ради краткости: два
 * булева давали четыре состояния при трёх осмысленных. Четвёртое
 * (`wordWrap` и `autoWidth` вместе) поведения не имело — `expand` делает
 * контейнер шириной с самую длинную неперенесённую строку, и переносить после
 * этого нечего. Перечисление убирает несуществующее состояние из типа.
 *
 * `clip` намеренно не используется как имя: в CSS `text-overflow: clip` — это
 * обрезка **без** многоточия, то есть противоположное тому, что делает тема.
 */
export type TListContentFit = 'truncate' | 'wrap' | 'expand'

/**
 * То же для отдельного элемента — без `expand`.
 *
 * Ширина у списка одна на всех: он ровно настолько широк, насколько широк его
 * самый широкий элемент. «Раздвинься ради меня» — решение контейнера, и
 * отдельный элемент его принять не может.
 */
export type TListItemContentFit = Exclude<TListContentFit, 'expand'>

/**
 * Где стоит отметка выбранного элемента — и стоит ли вообще.
 *
 * Стороны логические, а не `left`/`right`: строка элемента — flex, `dir` уже
 * стоит на его корне, поэтому в RTL `start` сам оказывается справа, и правила
 * в теме под это не нужно.
 *
 * `none` вместо пары «булев + сторона»: два свойства дали бы состояние
 * «индикатора нет, но сторона задана», которого не бывает.
 */
export type TListIndicator = 'none' | 'start' | 'end'

/** События списочных свойств. */
export type TListEvents = {
	/** change:maxRows */
	'change:maxRows': (payload: TValuePayload<number>) => void
	/** change:contentFit */
	'change:contentFit': (payload: TValuePayload<TListContentFit>) => void
	/** change:scrollBehavior */
	'change:scrollBehavior': (payload: TValuePayload<TScrollBehavior>) => void
	/** change:indicator */
	'change:indicator': (payload: TValuePayload<TListIndicator>) => void
	/** change:groupSeparators */
	'change:groupSeparators': (payload: TValuePayload<boolean>) => void
}

/** Props списочных свойств. */
export interface IListProps {
	/** Сколько строк показывать до появления прокрутки. `0` — все */
	maxRows?: number
	/** Что делать с не помещающимся текстом */
	contentFit?: TListContentFit
	/**
	 * Как прокручивать к элементу при навигации: `none` — не прокручивать,
	 * `instant` — сразу, `smooth` — плавно, если режим движения библиотеки
	 * движение не убрал, иначе сразу
	 */
	scrollBehavior?: TScrollBehavior
	/** Где показывать отметку выбранного элемента */
	indicator?: TListIndicator
	/**
	 * Draw separators between data sections (default: false). For markup groups,
	 * place ListBox.Separator or Select.Separator explicitly.
	 */
	groupSeparators?: boolean
}

/**
 * Списочные свойства на инстансе.
 *
 * Реализуют оба компонента, по нему же типизируются плагины: чтобы применить
 * `maxRows`, плагину нужен контракт, а не конкретный класс.
 */
export interface IList {
	/** Сколько строк показывать до появления прокрутки. `0` — все */
	maxRows: number
	/** Что делать с не помещающимся текстом */
	contentFit: TListContentFit
	/**
	 * Как прокручивать к элементу при навигации: `none` — не прокручивать,
	 * `instant` — сразу, `smooth` — плавно, если режим движения библиотеки
	 * движение не убрал, иначе сразу
	 */
	scrollBehavior: TScrollBehavior
	/** Где показывать отметку выбранного элемента */
	indicator: TListIndicator
	/**
	 * Draw separators between data sections (default: false). For markup groups,
	 * place ListBox.Separator or Select.Separator explicitly.
	 */
	groupSeparators: boolean
}

/** Значения по умолчанию — одни на обе реализации, чтобы копии не разошлись. */
export const LIST_DEFAULTS: Required<IListProps> = {
	maxRows: 0,
	contentFit: 'truncate',
	scrollBehavior: 'smooth',
	indicator: 'none',
	groupSeparators: false,
}

/**
 * Имя `data-*`, которым `contentFit` уезжает в тему.
 *
 * Ставится и на список, и на каждый элемент: у списка тема читает `expand`
 * (ширина контейнера), у элемента — `wrap` (перенос текста). Разрешение
 * «значение элемента поверх значения списка» делает расширение коллекции —
 * то есть один раз, а не в каждом из шести адаптеров.
 */
export const LIST_CONTENT_FIT_ATTRIBUTE = 'content-fit'

/**
 * Имя `data-*`, которым `indicator` уезжает в тему.
 *
 * Ставится и на список, и на каждый элемент: списку тема резервирует место под
 * отметку, элементу — выравнивает её. Значение у элемента всегда списочное:
 * своей стороны у элемента нет, иначе отметки в одном списке разъехались бы.
 */
export const LIST_INDICATOR_ATTRIBUTE = 'indicator'
