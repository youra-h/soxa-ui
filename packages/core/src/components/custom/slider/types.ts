import type {
	IValueControl,
	IValueControlProps,
	TValueControlEvents,
} from '../../base/value-control'
import type {
	TAriaAttributes,
	TDatasetAttributes,
	TEvented,
	TOrientation,
	TValuePayload,
} from '../../../common'
import type { ISlidable, TSlideSnap } from '../slide'

/**
 * Значение ползунка: число — одна ручка, массив — по ручке на элемент.
 *
 * Форма сохраняется: ядро не превращает число в массив из одного элемента и
 * обратно, и `v-model` получает значение в той форме, в какой его задали.
 */
export type TSliderValue = number | number[]

/**
 * Шаг: число — ровная сетка от `min`, массив — список допустимых значений
 * (неравный шаг, вроде `1, 2, 5, 10, 20, 50`).
 */
export type TSliderStep = number | number[]

/** Метка шкалы, заданная списком: значение и необязательная подпись. */
export type TSliderMark = {
	/** Где стоит метка — значение шкалы */
	value: number
	/** Подпись под меткой; нет — метка одна точка */
	label?: string
}

/**
 * Метки на рельсе: `false` — нет, `true` — точки шкалы (узлы сетки или
 * элементы списка шага) без подписей, список — свои метки с подписями.
 */
export type TSliderMarks = boolean | TSliderMark[]

/**
 * Подсказка со значением у ручки:
 *
 * - `none` — подсказки нет (по умолчанию);
 * - `auto` — видна, пока ручку наводят, держат, тянут или она в фокусе с
 *   клавиатуры;
 * - `always` — видна всегда.
 *
 * Одно свойство, а не пара флагов «показывать» и «всегда»: пара давала бы
 * состояние, которого не бывает. Рисовать ли подсказку, ядро отдаёт выходом
 * `tooltipRendered`, а когда показывать в `auto`, решает тема — наведения,
 * нажатия и фокуса с клавиатуры ядро не знает, ему видно только
 * перетаскивание.
 * Смысл у значения один в любой теме, поэтому это union ядра, а не реестр
 * темы.
 */
export type TSliderTooltip = 'none' | 'auto' | 'always'

/**
 * CSS-переменные узла — и только они: позиция процентом от начала оси, с `%`,
 * уже с учётом `inverted`. Ось раскладывает тема: горизонталь — от начала
 * строки, вертикаль — снизу вверх, поэтому RTL разметке знать не нужно.
 */
export type TSliderStyle = Record<`--${string}`, string>

/**
 * Ручка — выход ядра для разметки. Своего экземпляра у ручки нет:
 * потребитель её не адресует, число ручек задаёт значение (AGENTS.md, «Часть
 * или слот»).
 */
export type TSliderThumb = {
	/** Значение ручки — `value` её поля */
	value: number
	/**
	 * Нижняя граница хода — `min` поля: предыдущая ручка плюс минимальный
	 * зазор, у первой — начало шкалы. Не больше значения: соседей ползунок не
	 * раздвигает, и поле не должно поправлять значение само.
	 */
	min: number
	/** Верхняя граница хода — `max` поля; не меньше значения */
	max: number
	/** `step` поля: шаг сетки или `any` у списка — неравного шага поле не знает */
	step: number | 'any'
	/** `--so-slider-position` — где центр ручки */
	style: TSliderStyle
	/** `data-dragging` — тянут эту ручку */
	dataset: TDatasetAttributes
	/**
	 * Набор поля — целиком. У одной ручки — `aria` ползунка: имя, описание,
	 * ориентация, ошибка; у нескольких — ориентация и ошибка, а имя и
	 * описание ползунка — у корня (`rootAria`). Поверх — имя ручки
	 * (`aria-label` из `thumbLabels`): оно сильнее имени ползунка
	 */
	aria: TAriaAttributes
}

/** Метка на рельсе — выход ядра для разметки. */
export type TSliderShownMark = {
	/** Значение метки */
	value: number
	/** Подпись; у точки шкалы и метки без подписи — `undefined` */
	label: string | undefined
	/** `--so-slider-position` — где метка */
	style: TSliderStyle
	/**
	 * `data-in-range` — метка внутри заливки, края включительно;
	 * `data-current` — на метке стоит ручка
	 */
	dataset: TDatasetAttributes
}

/**
 * Жест указателя — состояние ползунка от `grab` или `press` до `release`.
 * Наружу не отдаётся: это память между командами плагина указателя.
 */
export type TSliderGesture = {
	/** Доля хода, в которой нажали */
	from: number
	/** Смещение захвата: доля ручки минус доля указателя; у нажатия мимо ручек — ноль */
	offset: number
	/** Первая из ручек на одном значении с нажатой — её ведёт движение к меньшим */
	lo: number
	/** Последняя из них — её ведёт движение к большим */
	hi: number
	/** Значение до жеста — для `commit` */
	before: TSliderValue
}

export type TSliderEvents = TValueControlEvents<TSliderValue> & {
	/** change:min */
	'change:min': (payload: TValuePayload<number>) => void
	/** change:max */
	'change:max': (payload: TValuePayload<number>) => void
	/** change:step */
	'change:step': (payload: TValuePayload<TSliderStep>) => void
	/** change:largeStep */
	'change:largeStep': (payload: TValuePayload<number>) => void
	/** change:orientation */
	'change:orientation': (payload: TValuePayload<TOrientation>) => void
	/** change:inverted */
	'change:inverted': (payload: TValuePayload<boolean>) => void
	/** change:origin */
	'change:origin': (payload: TValuePayload<number | undefined>) => void
	/** change:marks */
	'change:marks': (payload: TValuePayload<TSliderMarks>) => void
	/** change:minStepsBetweenThumbs */
	'change:minStepsBetweenThumbs': (payload: TValuePayload<number>) => void
	/** change:thumbLabels */
	'change:thumbLabels': (payload: TValuePayload<string[] | undefined>) => void
	/** change:snap */
	'change:snap': (payload: TValuePayload<TSlideSnap>) => void
	/** change:snapRadius */
	'change:snapRadius': (payload: TValuePayload<number>) => void
	/** change:tooltip */
	'change:tooltip': (payload: TValuePayload<TSliderTooltip>) => void
	/** Идёт перетаскивание: с первого движения после нажатия до отпускания */
	'change:dragging': (payload: TValuePayload<boolean>) => void
	/**
	 * Пользователь закончил менять значение: отпустил ручку, если за жест
	 * значение сменилось, или сдвинул его клавишей. `change:value` приходит на
	 * каждом кадре протяжки, а это событие — одно на действие: по нему
	 * сохраняют и отправляют. Значения — в форме значения ползунка.
	 */
	commit: (payload: TValuePayload<TSliderValue>) => void
}

export interface ISliderProps extends IValueControlProps<TSliderValue> {
	/** Начало хода */
	min?: number
	/** Конец хода. Вне сетки шага недостижим, как у нативного поля */
	max?: number
	/** Шаг числом или список допустимых значений */
	step?: TSliderStep
	/** Сколько шагов в крупном шаге (Shift со стрелкой, PageUp и PageDown); у списка — позиций */
	largeStep?: number
	/** Ось хода */
	orientation?: TOrientation
	/** Значение растёт в обратную сторону: справа налево или сверху вниз */
	inverted?: boolean
	/**
	 * Откуда растёт заливка одной ручки. Не задано — от `min`; середина хода —
	 * заливка от центра. У нескольких ручек заливка всегда между крайними.
	 */
	origin?: number
	/** Метки на рельсе: точки шкалы (`true`) или свой список с подписями */
	marks?: TSliderMarks
	/** Минимальный зазор между соседними ручками — в шагах шкалы */
	minStepsBetweenThumbs?: number
	/**
	 * Имена ручек для скринридера, по порядку (APG, Multi-Thumb Slider).
	 *
	 * Одной ручке имя даёт подпись `Label`, подпись поля формы `Field` или
	 * `aria_label`. У нескольких ручек имя каждой — отсюда, первой тоже, и
	 * пишется полностью: ни текст подписи, ни `aria_label` в него не входят.
	 * Подпись поля формы и `aria_label` называют группу ручек — корень, — а
	 * подпись `Label` называет первое поле своим содержимым, и значение второго
	 * поля внутри неё вошло бы в его имя («80 Цена»): имя ручки его перекрывает.
	 */
	thumbLabels?: string[]
	/**
	 * Щелчок: как метки притягивают ручку, которую тянут указателем. Опорные
	 * точки — метки (`marks`): без меток режим ничего не делает. Клавиши ходят
	 * по шагу при любом режиме
	 */
	snap?: TSlideSnap
	/** Радиус щелчка в px вдоль оси */
	snapRadius?: number
	/**
	 * Подсказка со значением у ручки: нет, видна, пока ручку наводят, держат,
	 * тянут или она в фокусе с клавиатуры (`auto`), или видна всегда
	 */
	tooltip?: TSliderTooltip
}

export interface ISlider
	extends IValueControl<TSliderValue, ISliderProps, TSliderEvents>, ISlidable {
	/** Начало хода */
	min: number
	/** Конец хода */
	max: number
	/** Шаг числом или список допустимых значений */
	step: TSliderStep
	/** Сколько шагов в крупном шаге */
	largeStep: number
	/** Ось хода */
	orientation: TOrientation
	/** Значение растёт в обратную сторону */
	inverted: boolean
	/** Откуда растёт заливка одной ручки; `undefined` — от `min` */
	origin: number | undefined
	/** Метки на рельсе */
	marks: TSliderMarks
	/** Минимальный зазор между соседними ручками — в шагах шкалы */
	minStepsBetweenThumbs: number
	/** Имена ручек для скринридера */
	thumbLabels: string[] | undefined
	/** Щелчок: как метки притягивают ручку, которую тянут указателем */
	snap: TSlideSnap
	/** Радиус щелчка в px вдоль оси */
	snapRadius: number
	/** Подсказка со значением у ручки */
	tooltip: TSliderTooltip
	/**
	 * Рисовать ли у ручек подсказку со значением: режим не `none`. Когда её
	 * показывать, решает тема
	 */
	readonly tooltipRendered: boolean
	/**
	 * Шина ползунка. Объявлена здесь, потому что предки объявляют её
	 * по-разному: компонент — полной картой, перетаскивание — подпиской на
	 * смену щелчка. Полная карта подходит под обе.
	 */
	readonly events: TEvented<TSliderEvents>
	/** Идёт перетаскивание */
	readonly dragging: boolean
	/**
	 * Набор корня: у нескольких ручек корень — группа полей с именем и
	 * описанием ползунка, у одной — пусто
	 */
	readonly rootAria: TAriaAttributes
	/** Ручки — выход для разметки: с набором поля каждой ручки целиком */
	readonly thumbs: TSliderThumb[]
	/** Края заливки — `--so-slider-range-start` и `--so-slider-range-end` */
	readonly rangeStyle: TSliderStyle
	/** Метки на рельсе — выход для разметки; меток нет — пусто */
	readonly shownMarks: TSliderShownMark[]
}
