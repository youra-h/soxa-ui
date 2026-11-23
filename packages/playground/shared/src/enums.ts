/// <reference types="@soxa-ui/theme-oren" />

import type {
	TComponentSize,
	TComponentVariant,
	TButtonView,
	TBadgeView,
	TAlertView,
	TAvatarShape,
	TCheckBoxView,
	TLabelPosition,
	TFieldPosition,
	TRadioGroupView,
	TAccordionArrowPlacement,
	TListContentFit,
	TListIndicator,
	TSkeletonShape,
	TSkeletonAnimation,
	TProgressLinearOrientation,
	TSlideOrientation,
	TSlideSnap,
	TSliderTooltip,
	TTabsOrientation,
	TTabsAlignment,
	TTabsPosition,
	TTabsView,
	TFrameStrategy,
	TDirection,
	TScrollBehavior,
	TCalendarMode,
	TDateInputKind,
	TDatePickerMode,
	TTimePrecision,
	TSelectionMode,
	TSelectEditableMode,
	TSelectPlacement,
	TTableColumnFit,
	TTableReorderPreview,
	TTableResizePreview,
	TTableSortMode,
	TTagsOverflow,
	TPopoverEdge,
	TPopoverPlacement,
	TMenuPlacement,
	TMenuOpenOn,
	TTooltipPlacement,
	TTooltipType,
	TDialogPlacement,
	TDrawerPlacement,
	TSwipe,
	TToastsItemType,
	TToastsItemView,
	TToastsLayout,
	TToastsPlacement,
} from '@soxa-ui/core'
import type { TFramePlacement } from '@soxa-ui/plugins'

/**
 * Списки допустимых значений перечислимых пропов.
 *
 * **Почему здесь, а не в библиотеке.** В рантайме у таких пропов лежит просто
 * `String`, а значения существуют только как TS-типы — типы же стираются. То
 * есть массив придётся написать руками в любом случае, вопрос лишь где.
 * Проверка показала: рантайм-потребителей у этих списков в библиотеке нет ни
 * одного (единственное исключение — шкала размеров, она нужна `shiftSize` и
 * потому живёт в ядре). Класть остальные пятнадцать в компоненты значило бы
 * усложнять их ради стенда.
 *
 * **Почему это не разъедется с библиотекой.** Каждый список сверяется с
 * исходным типом на компиляции — см. `enumOf` ниже. Добавили значение в
 * `TTabsAlignment` и забыли сюда — `vue-tsc` покажет, какого именно не хватает.
 * Ровно этой сверки не было у прежнего демо, где такие же списки лежали в
 * `playgrounds/Tabs.vue` и тихо устаревали.
 *
 * **Значения оформления — из темы.** `variant`, `view`, `shape` и `animation`
 * объявляет не библиотека, а тема (корневой `AGENTS.md`, «Оформление: значения
 * объявляет тема»): реестры ядра пусты. Стенд рисует тему oren, поэтому её
 * объявление подключено к программе типов директивой выше, и эти списки
 * сверяются с ним. Тема добавила вид — `vue-tsc` попросит его и здесь.
 */

/**
 * Требует, чтобы список покрыл union целиком.
 *
 * Лишние значения ловит констрейнт `readonly TUnion[]`, недостающие —
 * пересечение с кортежем-подсказкой: если что-то из union не попало в список,
 * тип аргумента становится невыполнимым и компилятор называет пропущенное.
 */
function enumOf<TUnion extends string>() {
	return <const TList extends readonly TUnion[]>(
		values: TList &
			([Exclude<TUnion, TList[number]>] extends [never]
				? unknown
				: { 'не хватает значения': Exclude<TUnion, TList[number]> }),
	): TList => values as TList
}

/**
 * Шкала размеров объявлена и в ядре (`COMPONENT_SIZES` — её читает `shiftSize`),
 * но наружу оттуда не выводится: экспортировать значение ради стенда значило бы
 * менять библиотеку под инструмент. Здесь список свой, а от расхождения
 * страхует `enumOf<TComponentSize>()` — тип-то в ядре из массива и выведен.
 */
export const COMPONENT_SIZES = enumOf<TComponentSize>()(['sm', 'normal', 'lg', 'xl', '2xl'])

export const COMPONENT_VARIANTS = enumOf<TComponentVariant>()([
	'normal',
	'accent',
	'positive',
	'negative',
	'caution',
])

/**
 * Вид кнопки — он же вид строк, которые рисует Button: у ListBox, Accordion и
 * Tags `view` — псевдоним `TButtonView`, и список у них этот же.
 */
export const BUTTON_VIEWS = enumOf<TButtonView>()(['filled', 'plain', 'outlined', 'none'])

export const CHECK_BOX_VIEWS = enumOf<TCheckBoxView>()(['outlined', 'filled', 'plain'])

/** С какой стороны от контрола стоит текст подписи. */
export const LABEL_POSITIONS = enumOf<TLabelPosition>()(['start', 'end', 'top', 'bottom'])

/** С какой стороны от контрола стоит подпись поля формы. */
export const FIELD_POSITIONS = enumOf<TFieldPosition>()(['top', 'start', 'end'])

/** Чем отмечено выбранное радио: точкой внутри кольца или утолщённым кольцом. */
export const RADIO_GROUP_VIEWS = enumOf<TRadioGroupView>()(['dot', 'ring'])

export const ACCORDION_ARROW_PLACEMENTS = enumOf<TAccordionArrowPlacement>()(['start', 'end'])

/** Общее для ListBox и Select: что делать с не помещающимся текстом. */
export const LIST_CONTENT_FITS = enumOf<TListContentFit>()(['truncate', 'wrap', 'expand'])

/** Общее для ListBox и Select: где стоит отметка выбранного — и стоит ли. */
export const LIST_INDICATORS = enumOf<TListIndicator>()(['none', 'start', 'end'])

export const SKELETON_SHAPES = enumOf<TSkeletonShape>()(['rect', 'rounded', 'circle'])

export const SKELETON_ANIMATIONS = enumOf<TSkeletonAnimation>()(['pulse', 'wave', 'none'])

export const TABS_ORIENTATIONS = enumOf<TTabsOrientation>()(['horizontal', 'vertical'])

/** Ось хода ползунка — общая у всего, что задают перетаскиванием. */
export const SLIDE_ORIENTATIONS = enumOf<TSlideOrientation>()(['horizontal', 'vertical'])

/** Ось полосы ProgressLinear: вдоль строки или снизу вверх. */
export const PROGRESS_LINEAR_ORIENTATIONS = enumOf<TProgressLinearOrientation>()([
	'horizontal',
	'vertical',
])

/** Щелчок к меткам: как метки притягивают ручку, которую тянут указателем. */
export const SLIDE_SNAPS = enumOf<TSlideSnap>()(['none', 'magnet', 'plateau', 'settle', 'hold'])

/** Подсказка со значением у ручки ползунка: нет, пока с ручкой работают, всегда. */
export const SLIDER_TOOLTIPS = enumOf<TSliderTooltip>()(['none', 'auto', 'always'])

export const TABS_ALIGNMENTS = enumOf<TTabsAlignment>()(['start', 'center', 'end', 'stretch'])

export const TABS_POSITIONS = enumOf<TTabsPosition>()(['start', 'end'])

export const TABS_VIEWS = enumOf<TTabsView>()(['line', 'contained', 'outline'])

/** Что делать с тегами, которым не хватило ширины ряда. */
export const TAGS_OVERFLOWS = enumOf<TTagsOverflow>()(['wrap', 'scroll'])

export const FRAME_STRATEGIES = enumOf<TFrameStrategy>()(['fixed', 'absolute'])

export const DIRECTIONS = enumOf<TDirection>()(['ltr', 'rtl', 'inherit'])

export const SCROLL_BEHAVIORS = enumOf<TScrollBehavior>()(['none', 'instant', 'smooth'])

export const SELECTION_MODES = enumOf<TSelectionMode>()(['none', 'single', 'multiple'])

/**
 * Режим выбора календаря — свой, а не общий `SELECTION_MODES`: выбирают даты,
 * а не элементы, и «ничего» у календаря нет, зато есть диапазон.
 */
export const CALENDAR_MODES = enumOf<TCalendarMode>()(['single', 'multiple', 'range'])

/** Вид поля даты: дата или дата со временем. */
export const DATE_INPUT_KINDS = enumOf<TDateInputKind>()(['date', 'datetime'])

/** Точность времени поля даты: до минуты или до секунды. */
export const TIME_PRECISIONS = enumOf<TTimePrecision>()(['minute', 'second'])

/**
 * Режим DatePicker — свой, а не календаря: несколько разных дат поле не
 * покажет, поэтому режимов два — одна дата или диапазон.
 */
export const DATE_PICKER_MODES = enumOf<TDatePickerMode>()(['single', 'range'])

/** Сколько колонок сортируют строки таблицы: одна или несколько. */
export const TABLE_SORT_MODES = enumOf<TTableSortMode>()(['single', 'multiple'])

/** Как колонки таблицы без своей ширины делят место: стоят, растут или заполняют его. */
export const TABLE_COLUMN_FITS = enumOf<TTableColumnFit>()(['none', 'auto', 'contain'])

/** Что идёт за жестом перестановки колонки: шапка или колонка целиком. */
export const TABLE_REORDER_PREVIEWS = enumOf<TTableReorderPreview>()(['none', 'head', 'column'])

/** Что идёт за протяжкой ручки ширины колонки: сама колонка или призрак границы. */
export const TABLE_RESIZE_PREVIEWS = enumOf<TTableResizePreview>()(['live', 'deferred'])

/** Что делает ввод текста в поле Select при `editable: true`. */
export const SELECT_EDITABLE_MODES = enumOf<TSelectEditableMode>()(['none', 'search', 'filter'])

/** С какой стороны поля Select открывается панель. */
export const SELECT_PLACEMENTS = enumOf<TSelectPlacement>()(['auto', 'top', 'bottom'])

/**
 * Сторона и выравнивание панели Popover у триггера. Значения — четыре из
 * шести у `anchor_placement`, без центра; тип свой — ядра: проп принадлежит
 * поповеру.
 */
export const POPOVER_PLACEMENTS = enumOf<TPopoverPlacement>()([
	'bottom-start',
	'bottom-end',
	'top-start',
	'top-end',
])

/** Край контейнера, к которому прижата панель поповера внутри него. */
export const POPOVER_EDGES = enumOf<TPopoverEdge>()(['top', 'bottom', 'start', 'end'])

/**
 * Сторона и выравнивание панели меню у триггера — те же четыре значения, что у
 * Popover; тип свой — ядра: проп принадлежит меню.
 */
export const MENU_PLACEMENTS = enumOf<TMenuPlacement>()([
	'bottom-start',
	'bottom-end',
	'top-start',
	'top-end',
])

/** Чем меню открывают: кнопкой или как контекстное меню области. */
export const MENU_OPEN_ONS = enumOf<TMenuOpenOn>()(['press', 'contextmenu'])

/**
 * Сторона и выравнивание подсказки у триггера. Значения те же, что у
 * `anchor_placement`, но тип свой — ядра: проп принадлежит подсказке.
 */
export const TOOLTIP_PLACEMENTS = enumOf<TTooltipPlacement>()([
	'bottom-start',
	'bottom',
	'bottom-end',
	'top-start',
	'top',
	'top-end',
])

/** Чем подсказка служит триггеру: описанием или именем. */
export const TOOLTIP_TYPES = enumOf<TTooltipType>()(['description', 'label'])

/** Где стоит модальное окно: по центру или у стороны экрана. */
export const DIALOG_PLACEMENTS = enumOf<TDialogPlacement>()([
	'center',
	'start',
	'end',
	'top',
	'bottom',
])

/** У какого края экрана стоит выезжающая панель. */
export const DRAWER_PLACEMENTS = enumOf<TDrawerPlacement>()(['start', 'end', 'top', 'bottom'])

/** Где регион тостов: у верхнего или нижнего края — у начала строки, по центру или у конца. */
export const TOASTS_PLACEMENTS = enumOf<TToastsPlacement>()([
	'top-start',
	'top',
	'top-end',
	'bottom-start',
	'bottom',
	'bottom-end',
])

/** Как тосты стоят в регионе: столбцом или стопкой. */
export const TOASTS_LAYOUTS = enumOf<TToastsLayout>()(['list', 'cascade'])

export const TOASTS_VIEWS = enumOf<TToastsItemView>()(['outlined', 'filled', 'soft'])

/**
 * Вид сообщения тоста — значок вида в начале строки. Обычного сообщения в
 * списке нет: это тост без вида, а не значение вида.
 */
export const TOASTS_ITEM_TYPES = enumOf<TToastsItemType>()(['info', 'success', 'warning', 'error'])

/** За что слой смахивают, чтобы закрыть: выезжающую панель и поповер. */
export const SWIPES = enumOf<TSwipe>()(['none', 'handle', 'panel'])

/**
 * Сторона и выравнивание панели у якоря — `anchor_placement`. Тип объявляет не
 * ядро, а `TAnchorPlugin`: проп принадлежит плагину.
 */
export const FRAME_PLACEMENTS = enumOf<TFramePlacement>()([
	'bottom-start',
	'bottom',
	'bottom-end',
	'top-start',
	'top',
	'top-end',
	'end-start',
	'end',
	'end-end',
	'start-start',
	'start',
	'start-end',
])

/**
 * Теги, которыми осмысленно подменять корень компонента через `tag`. `label` —
 * умолчание корня подписи Label: без него строка `tag` на её странице не
 * нашла бы умолчания среди значений.
 */
export const HTML_TAGS = ['div', 'span', 'label', 'button', 'a', 'section', 'li'] as const

export const ALERT_VIEWS = enumOf<TAlertView>()(['outlined', 'soft', 'filled'])

export const BADGE_VIEWS = enumOf<TBadgeView>()(['filled', 'outlined'])

export const AVATAR_SHAPES = enumOf<TAvatarShape>()(['circle', 'rounded', 'rect'])
