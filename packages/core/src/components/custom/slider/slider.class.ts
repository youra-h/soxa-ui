import { TValueControl } from '../../base/value-control'
import type { TDefaultValues } from '../../base/component'
import { createScale } from '../../../common'
import { sameValue } from '../../../common/utility/same-value'
import { percent } from '../../../common/utility/percent'
import type { IScale, TAriaAttributes, TOrientation } from '../../../common'
import type { TSlideEdge, TSlideSnap } from '../slide'
import type {
	ISlider,
	ISliderProps,
	TSliderEvents,
	TSliderGesture,
	TSliderMark,
	TSliderMarks,
	TSliderShownMark,
	TSliderStep,
	TSliderStyle,
	TSliderThumb,
	TSliderTooltip,
	TSliderValue,
} from './types'

/** Число в отрезке; `NaN` уходит в начало. */
function within(value: number, low: number, high: number): number {
	return value > low ? Math.min(value, high) : low
}

/**
 * Что ядро пишет в `aria` о поле ручки, а не о ползунке целиком: ориентацию
 * — по ней скринридер объявляет, какими стрелками двигать ручку, — и ошибку.
 * У нескольких ручек это стоит на каждом поле, а имя и описание — у группы:
 * на `group` ни ориентации, ни ошибки ARIA не объявляет.
 */
const FIELD_ARIA: ReadonlySet<string> = new Set(['aria-orientation', 'aria-invalid'])

/** Записи набора с именами из списка. */
function pick(aria: TAriaAttributes, names: ReadonlySet<string>): TAriaAttributes {
	return Object.fromEntries(Object.entries(aria).filter(([name]) => names.has(name)))
}

/** Записи набора без имён из списка. */
function omit(aria: TAriaAttributes, names: ReadonlySet<string>): TAriaAttributes {
	return Object.fromEntries(Object.entries(aria).filter(([name]) => !names.has(name)))
}

/**
 * Ползунок: число или несколько чисел, которые задают перетаскиванием,
 * клавишами и жестом скринридера.
 *
 * Ручка — нативный `input[type=range]` в разметке, по полю на значение: так
 * мобильный скринридер двигает её своим жестом, а `name`, `disabled` и
 * отправку формы даёт браузер. ARIA-дублей ядро полям не пишет, как CheckBox
 * и Switch (`_ariaTag` — `input`).
 *
 * Куда ложится `aria` ползунка, решает число ручек. У одной — её полю: оно
 * labelable, и подпись называет его `for`. У нескольких корень — группа
 * (`rootAria`) с именем и описанием ползунка, а поля держат только то, что
 * ядро пишет о поле, — ориентацию и ошибку, — и свои имена из `thumbLabels`:
 * подпись назвала бы `for` одно поле из нескольких. Набор поля каждой ручки
 * ядро отдаёт целиком (`thumbs`).
 *
 * Границы слоёв: **значение — здесь, операция — в плагине.**
 *
 * - Шкала (`IScale`) — границы, шаг числом или списком, перевод между
 *   значением и долей хода. Чистая математика из `common/scale`.
 * - Жест и клавиши приходят командами контракта `ISlidable` (`grab`, `press`,
 *   `drag`, `release`, `settle`, `shift`, `moveToEdge`): где указатель и какая
 *   клавиша, знают плагины `TSlidePointerPlugin` и `TSlideKeyboardPlugin`, а
 *   что от этого станет со значением — только ядро.
 * - Щелчок к меткам (`snap`) — стратегия плагина указателя. Ядро держит режим
 *   и радиус и отдаёт доли меток и ручек (`snapPoints`, `fractions`), а куда
 *   встать ручке, решает плагин: радиус в px он переводит в долю по длине
 *   дорожки.
 * - Всё, что зависит от значения, разметка получает выходами — ручки, края
 *   заливки, метки: позиции CSS-переменными, состояния наборами `data-*`.
 *   Считать их в шести адаптерах значило бы шесть раз повторить одну формулу.
 * - Подсказка со значением (`tooltip`) — разметка внутри ручки: ядро держит
 *   режим, отдаёт его теме модификатором и решает, рисовать ли подсказку
 *   (`tooltipRendered`). Когда её показывать в `auto`, решает тема по
 *   наведению и нажатию ручки, её `data-dragging` и фокусу с клавиатуры:
 *   наведения, нажатия и фокуса ядро не видит.
 *
 * **Значение хранится как задано**, итог отдаёт геттер по шкале: прижатое к
 * границам, приведённое к шагу и упорядоченное. Поэтому порядок записи не
 * важен — внешнему `ctrl` сборка пишет `value` раньше `max`, и прижатие к
 * прежнему `max` потеряло бы значение. Сменилась шкала — итог пересчитан,
 * `change:value` приходит, только если он сменился. Соседей геттер не
 * раздвигает: зазор между ручками (`minStepsBetweenThumbs`)
 * держат жест и клавиши, а поле получает границы, в которых его значение
 * всегда лежит.
 */
export default class TSlider
	extends TValueControl<TSliderValue, ISliderProps, TSliderEvents>
	implements ISlider
{
	static override baseClass = 'so-slider'

	static defaultValues: typeof TValueControl.defaultValues &
		TDefaultValues<
			ISliderProps,
			| 'min'
			| 'max'
			| 'step'
			| 'largeStep'
			| 'orientation'
			| 'inverted'
			| 'marks'
			| 'minStepsBetweenThumbs'
			| 'snap'
			| 'snapRadius'
			| 'tooltip',
			'origin' | 'thumbLabels'
		> = {
		...TValueControl.defaultValues,
		// Ползунок кладут в подпись `Label`, а внутри `label` HTML разрешает
		// только строчную разметку
		tag: 'span',
		value: 0,
		min: 0,
		max: 100,
		step: 1,
		largeStep: 10,
		orientation: 'horizontal',
		inverted: false,
		origin: undefined,
		marks: false,
		minStepsBetweenThumbs: 0,
		thumbLabels: undefined,
		snap: 'none',
		// Зона метки — 16 px: шире притяжения поля с `<datalist>` в Chromium
		// (5 px), но уже промежутка между метками на ползунке обычной длины
		snapRadius: 8,
		// Число у ручки нужно не всякому ползунку: значение часто стоит рядом
		// своим полем или подписью
		tooltip: 'none',
	}

	protected _min: number
	protected _max: number
	protected _step: TSliderStep
	protected _scale: IScale
	protected _largeStep: number
	protected _orientation!: TOrientation
	protected _inverted: boolean
	protected _origin: number | undefined
	protected _marks: TSliderMarks
	protected _minStepsBetweenThumbs: number
	protected _thumbLabels: string[] | undefined
	protected _snap: TSlideSnap
	protected _snapRadius: number
	protected _tooltip!: TSliderTooltip
	protected _dragging = false
	protected _activeThumb: number | undefined = undefined
	protected _gesture: TSliderGesture | undefined = undefined

	constructor(props: Partial<ISliderProps> = {}) {
		const ctor = new.target as typeof TSlider

		super(props)

		this._min = props.min ?? ctor.defaultValues.min
		this._max = props.max ?? ctor.defaultValues.max
		this._step = props.step ?? ctor.defaultValues.step
		this._scale = this._createScale()
		this._largeStep = props.largeStep ?? ctor.defaultValues.largeStep
		this._inverted = props.inverted ?? ctor.defaultValues.inverted
		this._origin = props.origin ?? ctor.defaultValues.origin
		this._marks = props.marks ?? ctor.defaultValues.marks
		this._minStepsBetweenThumbs =
			props.minStepsBetweenThumbs ?? ctor.defaultValues.minStepsBetweenThumbs
		this._thumbLabels = props.thumbLabels ?? ctor.defaultValues.thumbLabels
		this._snap = props.snap ?? ctor.defaultValues.snap
		this._snapRadius = props.snapRadius ?? ctor.defaultValues.snapRadius

		this._applyOrientation(props.orientation ?? ctor.defaultValues.orientation)
		this._applyTooltip(props.tooltip ?? ctor.defaultValues.tooltip)

		// С первой отрисовки и значением `"false"`: тема отличает «не тянут»
		// от «неприменимо»
		this._dataset.add('dragging', this._dragging)
	}

	/* ------------------------------------------------------------------ */
	/* Свойства                                                           */
	/* ------------------------------------------------------------------ */

	/**
	 * Итог: своё значение на шкале — прижатое, приведённое к шагу и
	 * упорядоченное. Массив собирается заново на каждое чтение, поэтому смену
	 * итога база сверяет поэлементно (`sameValue`).
	 */
	override get value(): TSliderValue {
		return this._normalize(this._value)
	}
	/**
	 * Число ручек задаёт значение, а от него зависит labelable: сменилось оно
	 * — `change:labelable` уходит за `change:value`.
	 */
	override set value(value: TSliderValue) {
		const before = this.labelable

		super.value = value
		this._labelableChanged(before)
	}

	/**
	 * Labelable — пока ручка одна: подпись поля формы называет её поле своим
	 * `for`. У нескольких ручек `for` назвал бы одно поле из них, а ссылка на
	 * подпись в их наборе перекрыла бы имена ручек (`thumbLabels`), — подпись
	 * называет корень, группу полей (`rootAria`).
	 */
	override get labelable(): boolean {
		return this.values.length === 1 && super.labelable
	}

	get min(): number {
		return this._min
	}

	set min(value: number) {
		const oldMin = this.min

		if (this._min === value) return

		this._rescale(() => {
			this._min = value
		})
		this.events.emit('change:min', { newValue: value, oldValue: oldMin })
	}

	get max(): number {
		return this._max
	}

	set max(value: number) {
		const oldMax = this.max

		if (this._max === value) return

		this._rescale(() => {
			this._max = value
		})
		this.events.emit('change:max', { newValue: value, oldValue: oldMax })
	}

	get step(): TSliderStep {
		return this._step
	}

	set step(value: TSliderStep) {
		const oldStep = this.step

		if (sameValue(this._step, value)) return

		this._rescale(() => {
			this._step = value
		})
		this.events.emit('change:step', { newValue: value, oldValue: oldStep })
	}

	get largeStep(): number {
		return this._largeStep
	}

	set largeStep(value: number) {
		const oldLargeStep = this.largeStep

		if (this._largeStep === value) return

		this._largeStep = value
		this.events.emit('change:largeStep', { newValue: value, oldValue: oldLargeStep })
	}

	get orientation(): TOrientation {
		return this._orientation
	}

	set orientation(value: TOrientation) {
		const oldOrientation = this.orientation

		if (this._orientation === value) return

		this._applyOrientation(value, this._orientation)
		this.events.emit('change:orientation', { newValue: value, oldValue: oldOrientation })
	}

	get inverted(): boolean {
		return this._inverted
	}

	set inverted(value: boolean) {
		const oldInverted = this.inverted

		if (this._inverted === value) return

		this._inverted = value
		this.events.emit('change:inverted', { newValue: value, oldValue: oldInverted })
	}

	get origin(): number | undefined {
		return this._origin
	}

	set origin(value: number | undefined) {
		const oldOrigin = this.origin

		if (this._origin === value) return

		this._origin = value
		this.events.emit('change:origin', { newValue: value, oldValue: oldOrigin })
	}

	/**
	 * Список меток принадлежит потребителю и сверяется по ссылке: менять его
	 * на месте нельзя (AGENTS.md, «Контракт границы core → ui»).
	 */
	get marks(): TSliderMarks {
		return this._marks
	}

	set marks(value: TSliderMarks) {
		const oldMarks = this.marks

		if (this._marks === value) return

		this._marks = value
		this.events.emit('change:marks', { newValue: value, oldValue: oldMarks })
	}

	get minStepsBetweenThumbs(): number {
		return this._minStepsBetweenThumbs
	}

	set minStepsBetweenThumbs(value: number) {
		const oldMinStepsBetweenThumbs = this.minStepsBetweenThumbs

		if (this._minStepsBetweenThumbs === value) return

		this._minStepsBetweenThumbs = value
		this.events.emit('change:minStepsBetweenThumbs', {
			newValue: value,
			oldValue: oldMinStepsBetweenThumbs,
		})
	}

	get thumbLabels(): string[] | undefined {
		return this._thumbLabels
	}

	set thumbLabels(value: string[] | undefined) {
		const oldThumbLabels = this.thumbLabels

		if (sameValue(this._thumbLabels, value)) return

		this._thumbLabels = value
		this.events.emit('change:thumbLabels', { newValue: value, oldValue: oldThumbLabels })
	}

	get snap(): TSlideSnap {
		return this._snap
	}

	set snap(value: TSlideSnap) {
		const oldSnap = this.snap

		if (this._snap === value) return

		this._snap = value
		this.events.emit('change:snap', { newValue: value, oldValue: oldSnap })
	}

	get snapRadius(): number {
		return this._snapRadius
	}

	set snapRadius(value: number) {
		const oldSnapRadius = this.snapRadius

		if (this._snapRadius === value) return

		this._snapRadius = value
		this.events.emit('change:snapRadius', { newValue: value, oldValue: oldSnapRadius })
	}

	get tooltip(): TSliderTooltip {
		return this._tooltip
	}

	set tooltip(value: TSliderTooltip) {
		const oldTooltip = this.tooltip

		if (this._tooltip === value) return

		this._applyTooltip(value, this._tooltip)
		this.events.emit('change:tooltip', { newValue: value, oldValue: oldTooltip })
	}

	/**
	 * Рисовать ли у ручек подсказку со значением. Когда её показывать в
	 * `auto`, решает тема: наведения, нажатия и фокуса с клавиатуры ядро не
	 * видит.
	 */
	get tooltipRendered(): boolean {
		return this._tooltip !== 'none'
	}

	/** Идёт перетаскивание: с первого движения после нажатия до отпускания. */
	get dragging(): boolean {
		return this._dragging
	}

	/* ------------------------------------------------------------------ */
	/* Перетаскивание (`ISlidable`)                                       */
	/* ------------------------------------------------------------------ */

	/** Значения ручек по возрастанию. Снимок: итог собирается заново на каждое чтение. */
	get values(): number[] {
		const value = this.value

		return Array.isArray(value) ? value : [value]
	}

	/** Доли хода ручек в направлении роста: `inverted` их не переворачивает. */
	get fractions(): number[] {
		return this.values.map((value) => this._scale.fraction(value))
	}

	/**
	 * Точки щелчка — доли показанных меток: вне хода метки нет и на экране.
	 * Список меток задаёт потребитель в любом порядке и с повторами, а
	 * стратегиям щелчка нужен упорядоченный.
	 */
	get snapPoints(): number[] {
		const fractions = this._markList().map(({ value }) => this._scale.fraction(value))

		return [...new Set(fractions)].sort((a, b) => a - b)
	}

	get activeThumb(): number | undefined {
		return this._activeThumb
	}

	grab(index: number, fraction: number): boolean {
		const values = this.values

		if (this.disabled || !isIndexOf(values, index)) return false

		// Ручка идёт за указателем со смещением захвата: взялись за её край —
		// значение не прыгает к точке нажатия
		const offset = this._scale.fraction(values[index]) - fraction
		const [lo, hi] = this._group(values, index)

		this._begin(fraction, offset, index, lo, hi)

		return true
	}

	press(fraction: number): boolean {
		const values = this.values

		if (this.disabled || values.length === 0) return false

		const target = this._scale.valueAt(fraction)
		const [lo, hi] = this._group(values, this._nearest(values, target))
		const shared = values[lo]

		// У ручек на одном значении направление видно по точке нажатия: к
		// меньшим идёт первая из них, к большим — последняя. Нажали ровно в их
		// значение — решит первое движение
		if (target === shared) {
			this._begin(fraction, 0, hi, lo, hi)
		} else {
			const index = target < shared ? lo : hi

			this._begin(fraction, 0, index, index, index)
			this._moveThumb(values, index, target)
		}

		return true
	}

	drag(fraction: number): void {
		const gesture = this._gesture

		if (!gesture || this._activeThumb === undefined) return

		// До первого движения жест — ещё нажатие: `dragging` не стоит, и прыжок
		// ручки к месту нажатия тема анимирует
		if (!this._dragging) {
			if (fraction === gesture.from) return

			this._activeThumb = fraction < gesture.from ? gesture.lo : gesture.hi
			this._setDragging(true)
		}

		this._moveThumb(
			this.values,
			this._activeThumb,
			this._scale.valueAt(fraction + gesture.offset),
		)
	}

	release(): void {
		const gesture = this._finish()

		if (gesture) this._commit(gesture.before)
	}

	settle(fraction: number): void {
		const index = this._activeThumb
		const gesture = this._finish()

		if (!gesture || index === undefined) return

		// Перетаскивания уже нет: ручку до метки довозит переход темы
		this._moveThumb(this.values, index, this._scale.valueAt(fraction))
		this._commit(gesture.before)
	}

	shift(index: number, count: number): void {
		const values = this.values

		if (this.disabled || !isIndexOf(values, index)) return

		const before = this.value

		this._moveThumb(values, index, this._scale.shift(values[index], count))
		this._commit(before)
	}

	moveToEdge(index: number, edge: TSlideEdge): void {
		const values = this.values

		if (this.disabled || !isIndexOf(values, index)) return

		const [lower, upper] = this._bounds(values, index)
		const before = this.value

		this._moveThumb(values, index, edge === 'start' ? lower : upper)
		this._commit(before)
	}

	/* ------------------------------------------------------------------ */
	/* Выходы для разметки                                                */
	/* ------------------------------------------------------------------ */

	/**
	 * Набор корня. У одной ручки корню ARIA не нужна: `aria` ползунка уходит её
	 * полю (`thumbs`). У нескольких корень — группа полей: роль и `aria`
	 * ползунка — имя и описание, от подписи поля формы тоже, — кроме того, что
	 * ядро пишет о самом поле: это остаётся на каждой ручке.
	 */
	get rootAria(): TAriaAttributes {
		return this.labelable ? {} : { role: 'group', ...omit(this._aria.toObject(), FIELD_ARIA) }
	}

	/**
	 * Ручки: значение, границы и шаг поля, позиция, состояние и набор поля.
	 * Своего экземпляра у ручки нет, поэтому её наборы отдаются значением, и
	 * набор поля — целиком: какой атрибут ползунка ложится на поле и чьё имя
	 * сильнее, решает ядро, а не порядок слияния в разметке.
	 */
	get thumbs(): TSliderThumb[] {
		const values = this.values
		const dragged = this._dragging ? this._activeThumb : undefined
		const step = this._scale.interval ?? 'any'
		const field = this._fieldAria()

		return values.map((value, index) => {
			const [min, max] = this._bounds(values, index)
			const label = this._thumbLabels?.[index]

			return {
				value,
				min,
				max,
				step,
				style: { '--so-slider-position': this._position(value) },
				dataset: { 'data-dragging': String(index === dragged) },
				// Имя ручки сильнее имени ползунка
				aria: label === undefined ? { ...field } : { ...field, 'aria-label': label },
			}
		})
	}

	/** Края заливки — начало не дальше конца, от начала оси. */
	get rangeStyle(): TSliderStyle {
		const [from, to] = this._range(this.values)
		const start = this._axis(from)
		const end = this._axis(to)

		return {
			'--so-slider-range-start': percent(Math.min(start, end)),
			'--so-slider-range-end': percent(Math.max(start, end)),
		}
	}

	/**
	 * Метки на рельсе: позиция, подпись и состояния. Метка списка вне хода не
	 * показывается — ей негде стоять.
	 */
	get shownMarks(): TSliderShownMark[] {
		const values = this.values
		const [from, to] = this._range(values)

		return this._markList().map(({ value, label }) => ({
			value,
			label,
			style: { '--so-slider-position': this._position(value) },
			dataset: {
				'data-in-range': String(value >= from && value <= to),
				'data-current': String(values.includes(value)),
			},
		}))
	}

	/* ------------------------------------------------------------------ */
	/* Внутреннее                                                         */
	/* ------------------------------------------------------------------ */

	protected _createScale(): IScale {
		return createScale({ min: this._min, max: this._max, step: this._step })
	}

	/**
	 * Сменить шкалу. Хранимое значение не трогается — пересчитывается итог, и
	 * `change:value` приходит, только если он сменился.
	 */
	protected _rescale(apply: () => void): void {
		const before = this.value

		apply()
		this._scale = this._createScale()
		this._valueChanged(before)
	}

	/** Итог значения: форма та же, значения на шкале и по возрастанию. */
	protected _normalize(raw: TSliderValue): TSliderValue {
		if (!Array.isArray(raw)) return this._scale.snap(raw)

		return raw.map((value) => this._scale.snap(value)).sort((a, b) => a - b)
	}

	protected _applyOrientation(newValue: TOrientation, oldValue?: TOrientation): void {
		this._classes.swap({ prefix: '--orientation-', oldValue, newValue })
		// Не для вида: по ориентации скринридер объявляет, какими стрелками
		// двигать ручку. Уходит на каждое поле и у нескольких ручек (`_fieldAria`)
		this._aria.add('aria-orientation', newValue)
		this._orientation = newValue
	}

	/**
	 * Режим подсказки — модификатором корня `--tooltip-<режим>`, с первой
	 * отрисовки: по нему тема прячет подсказку `auto` в покое и держит место
	 * под подсказку `always`. Не `data-tooltip`: по этому атрибуту рисуют свои
	 * подсказки CSS-библиотеки (Bulma и другие), и на ползунке всплыла бы
	 * чужая.
	 */
	protected _applyTooltip(newValue: TSliderTooltip, oldValue?: TSliderTooltip): void {
		this._classes.swap({ prefix: '--tooltip-', oldValue, newValue })
		this._tooltip = newValue
	}

	protected _setDragging(value: boolean): void {
		const oldDragging = this.dragging

		if (this._dragging === value) return

		this._dragging = value
		this._dataset.add('dragging', value)
		this.events.emit('change:dragging', { newValue: value, oldValue: oldDragging })
	}

	protected _begin(from: number, offset: number, index: number, lo: number, hi: number): void {
		// Указатель у ползунка один: новый жест закрывает незаконченный
		this.release()

		this._gesture = { from, offset, lo, hi, before: this.value }
		this._activeThumb = index
	}

	/**
	 * Закончить жест: ручку отпустили, перетаскивания нет. Отдаёт законченный
	 * жест — с ним значение до жеста для `commit`; жеста не было — `undefined`.
	 */
	protected _finish(): TSliderGesture | undefined {
		const gesture = this._gesture

		this._gesture = undefined
		this._activeThumb = undefined
		this._setDragging(false)

		return gesture
	}

	/**
	 * Поставить ручку в `target` в пределах её хода. Значение пишется в той
	 * форме, в какой задано: число остаётся числом.
	 */
	protected _moveThumb(values: readonly number[], index: number, target: number): void {
		const [lower, upper] = this._bounds(values, index)
		const next = within(target, lower, upper)

		if (next === values[index]) return

		const moved = [...values]

		moved[index] = next
		this.value = Array.isArray(this._value) ? moved : next
	}

	/**
	 * Ход ручки: от соседа слева до соседа справа с зазором
	 * `minStepsBetweenThumbs`, у крайних — до края шкалы. Значение ручки лежит
	 * внутри всегда: если соседи уже ближе зазора, ручка не прыгает, а только
	 * не может подойти ближе.
	 */
	protected _bounds(values: readonly number[], index: number): [number, number] {
		const value = values[index]
		const gap = Math.max(0, this._minStepsBetweenThumbs)
		const lower = index > 0 ? this._scale.shift(values[index - 1], gap) : this._scale.first
		const upper =
			index < values.length - 1
				? this._scale.shift(values[index + 1], -gap)
				: this._scale.last

		return [Math.min(lower, value), Math.max(upper, value)]
	}

	/** Ручки на одном значении с ручкой `index` — первая и последняя: список упорядочен. */
	protected _group(values: readonly number[], index: number): [number, number] {
		let lo = index
		let hi = index

		while (lo > 0 && values[lo - 1] === values[index]) lo--
		while (hi < values.length - 1 && values[hi + 1] === values[index]) hi++

		return [lo, hi]
	}

	/** Ближайшая к значению ручка; поровну от двух — меньшая. */
	protected _nearest(values: readonly number[], target: number): number {
		let nearest = 0

		for (let index = 1; index < values.length; index++) {
			if (Math.abs(values[index] - target) < Math.abs(values[nearest] - target)) {
				nearest = index
			}
		}

		return nearest
	}

	/** Края заливки значениями: у одной ручки — от `origin`, у нескольких — между крайними. */
	protected _range(values: readonly number[]): [number, number] {
		if (values.length > 1) return [values[0], values[values.length - 1]]

		const origin = within(this._origin ?? this._scale.min, this._scale.min, this._scale.max)
		const value = values.length === 1 ? values[0] : origin

		return [Math.min(origin, value), Math.max(origin, value)]
	}

	/** Метки, которым есть где стоять: точки шкалы или свой список в пределах хода. */
	protected _markList(): TSliderMark[] {
		const marks = this._marks

		if (marks === true) return this._scale.points.map((value) => ({ value }))
		if (marks === false) return []

		return marks.filter(({ value }) => value >= this._scale.min && value <= this._scale.max)
	}

	/** Доля хода от начала оси: `inverted` её переворачивает. */
	protected _axis(value: number): number {
		const fraction = this._scale.fraction(value)

		return this._inverted ? 1 - fraction : fraction
	}

	protected _position(value: number): string {
		return percent(this._axis(value))
	}

	/**
	 * Что из `aria` ползунка ложится на поля ручек. У одной ручки — весь
	 * набор: имя, описание, ориентация, ошибка, `id` от поля формы. У
	 * нескольких — только то, что ядро пишет о самом поле, ориентация и ошибка:
	 * имя и описание ползунка — у группы (`rootAria`).
	 */
	protected _fieldAria(): TAriaAttributes {
		const aria = this._aria.toObject()

		return this.labelable ? aria : pick(aria, FIELD_ARIA)
	}

	protected _commit(before: TSliderValue): void {
		const after = this.value

		if (sameValue(before, after)) return

		this.events.emit('commit', { newValue: after, oldValue: before })
	}

	/**
	 * `aria` стоит на полях ручек, а не на корне: `disabled` у них нативный, и
	 * `aria-disabled` рядом был бы дублем. Группе нескольких ручек он тоже не
	 * нужен: выключено каждое её поле.
	 */
	protected override get _ariaTag(): string {
		return 'input'
	}

	override getProps(): ISliderProps {
		return {
			...super.getProps(),
			min: this._min,
			max: this._max,
			step: this._step,
			largeStep: this._largeStep,
			orientation: this._orientation,
			inverted: this._inverted,
			origin: this._origin,
			marks: this._marks,
			minStepsBetweenThumbs: this._minStepsBetweenThumbs,
			thumbLabels: this._thumbLabels,
			snap: this._snap,
			snapRadius: this._snapRadius,
			tooltip: this._tooltip,
		}
	}
}

/** Есть ли у списка ручка с таким номером. */
function isIndexOf(values: readonly number[], index: number): boolean {
	return Number.isInteger(index) && index >= 0 && index < values.length
}
