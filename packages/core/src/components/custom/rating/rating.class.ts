import { TInputControl } from '../../base/input-control'
import type { TDefaultValues } from '../../base/component'
import { createScale } from '../../../common'
import { decimal } from '../../../common/utility/percent'
import type { IScale, TOrientation } from '../../../common'
import type { TSlideEdge, TSlideSnap } from '../slide'
import type { IRating, IRatingProps, TRatingEvents, TRatingStar } from './types'

/**
 * Оценка звёздами: число от 0 до `max`, которое задают нажатием и протяжкой по
 * звёздам, клавишами и жестом скринридера, — ползунок с одной ручкой (APG,
 * Rating Slider), а не группа радио. Звёзды — его зрительная шкала.
 *
 * Поле — нативный `input[type=range]` в разметке, как ручка Slider: так
 * мобильный скринридер двигает его своим жестом, а `name`, `disabled` и
 * отправку формы даёт браузер. ARIA-дублей ядро полю не пишет
 * (`_ariaTag` — `input`); `readonly` поле не знает, и его ядро сообщает
 * `aria-readonly`. Как звучит значение («4 из 5»), пишет плагин имён — это
 * строка языка.
 *
 * **`required` — 0 не отправляется**: 0 — «оценки нет», и обязательная оценка
 * с 0 — то же, что пустое обязательное поле. `required` range тоже не знает,
 * и у него всегда есть значение, поэтому оценку проверяет не ядро и не
 * браузер, а плагин обязательности: ставит полю ошибку со строкой языка, пока
 * оценка обязательна, равна 0 и не только для показа. Не отправить форму,
 * поставить фокус и показать сообщение — дальше браузер, как у любого
 * неверного поля. Свойства «неверно» здесь нет: когда показывать ошибку, тоже
 * решает браузер.
 *
 * Границы слоёв: **значение — здесь, операция — в плагине.**
 *
 * - Шкала (`IScale`) — от 0 до `max` с шагом `step`: перевод между значением
 *   и долей ряда. Чистая математика из `common/scale`.
 * - Нажатие, протяжка и клавиши приходят командами контракта `ISlidable` —
 *   их зовут плагины Slider (`TSlidePointerPlugin`, `TSlideKeyboardPlugin`).
 *   Доля указателя здесь округляется вверх, к шагу: нажатие в любом месте
 *   звезды ставит её целиком, на левой половине при шаге 0,5 — половину.
 *   Нажатием ставят хотя бы один шаг: 0 — «оценки нет», его ставят клавишей.
 * - Наведение — команда `hover`: где указатель, знает плагин наведения, а
 *   какую оценку поставит нажатие под ним, — ядро. Её звёзды и показывают,
 *   пока идёт предпросмотр.
 * - Всё, что зависит от значения, разметка получает выходом `stars`: долю
 *   заливки каждой звезды CSS-переменной. Считать её в шести адаптерах
 *   значило бы шесть раз повторить одну формулу.
 *
 * **Значение хранится как задано**, итог отдаёт геттер по шкале — прижатым к
 * границам и приведённым к шагу, как у Slider: внешнему `ctrl` сборка пишет
 * `value` раньше `max`.
 *
 * Перетаскиванию оценка отдаёт одну ручку во весь ряд: ось — строка,
 * обратного хода и щелчка к меткам нет. Крупный шаг — звезда: PageUp и
 * PageDown ставят соседнюю целую звезду и при половинках.
 */
export default class TRating
	extends TInputControl<number, IRatingProps, TRatingEvents>
	implements IRating
{
	static override baseClass = 'so-rating'

	static defaultValues: typeof TInputControl.defaultValues &
		TDefaultValues<IRatingProps, 'max' | 'step'> = {
		...TInputControl.defaultValues,
		// Оценку кладут в строку текста и в подпись `Label`, а внутри `label`
		// HTML разрешает только строчную разметку
		tag: 'span',
		value: 0,
		max: 5,
		step: 1,
	}

	protected _max: number
	protected _step: number
	protected _scale: IScale
	protected _preview: number | undefined = undefined
	/** Значение до нажатия — для `commit`; вне нажатия — `undefined` */
	protected _gesture: { before: number } | undefined = undefined

	constructor(props: Partial<IRatingProps> = {}) {
		const ctor = new.target as typeof TRating

		super(props)

		this._max = props.max ?? ctor.defaultValues.max
		this._step = props.step ?? ctor.defaultValues.step
		this._scale = this._createScale()

		// Оценку стало нельзя менять — предпросмотр той оценки, которую
		// поставило бы нажатие, больше не правда
		this.events.on('change:disabled', () => this._resetPreview())
		this.events.on('change:readonly', () => this._resetPreview())
	}

	/* ------------------------------------------------------------------ */
	/* Свойства                                                           */
	/* ------------------------------------------------------------------ */

	/** Итог: своё значение на шкале — прижатое к границам и приведённое к шагу. */
	override get value(): number {
		return this._scale.snap(this._value)
	}
	override set value(value: number) {
		super.value = value
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

	get step(): number {
		return this._step
	}

	set step(value: number) {
		const oldStep = this.step

		if (this._step === value) return

		this._rescale(() => {
			this._step = value
		})
		this.events.emit('change:step', { newValue: value, oldValue: oldStep })
	}

	get preview(): number | undefined {
		return this._preview
	}

	/* ------------------------------------------------------------------ */
	/* Перетаскивание (`ISlidable`)                                       */
	/* ------------------------------------------------------------------ */

	get orientation(): TOrientation {
		return 'horizontal'
	}

	get inverted(): boolean {
		return false
	}

	/**
	 * Крупный шаг — звезда: сколько шагов в одной звезде, но не меньше одного.
	 * У целых звёзд он равен шагу, у половинок — две половины.
	 */
	get largeStep(): number {
		return Math.max(1, Math.round(1 / (this._scale.interval ?? 1)))
	}

	get values(): number[] {
		return [this.value]
	}

	get fractions(): number[] {
		return [this._scale.fraction(this.value)]
	}

	get snap(): TSlideSnap {
		return 'none'
	}

	get snapRadius(): number {
		return 0
	}

	get snapPoints(): number[] {
		return []
	}

	get activeThumb(): number | undefined {
		return this._gesture ? 0 : undefined
	}

	/**
	 * Ручка оценки — весь ряд звёзд, и смещения захвата у неё нет: нажатие на
	 * ручке — то же нажатие, что мимо неё.
	 */
	grab(index: number, fraction: number): boolean {
		return index === 0 && this.press(fraction)
	}

	press(fraction: number): boolean {
		if (!this._editable) return false

		// Указатель у оценки один: новое нажатие закрывает незаконченное
		this.release()

		this._gesture = { before: this.value }
		this.value = this._valueAt(fraction)

		return true
	}

	drag(fraction: number): void {
		if (!this._gesture) return

		this.value = this._valueAt(fraction)
	}

	release(): void {
		const gesture = this._gesture

		this._gesture = undefined

		if (gesture) this._commit(gesture.before)
	}

	settle(fraction: number): void {
		const gesture = this._gesture

		if (!gesture) return

		this._gesture = undefined
		this.value = this._valueAt(fraction)
		this._commit(gesture.before)
	}

	shift(index: number, count: number): void {
		if (!this._editable || index !== 0) return

		this._stepTo(this._scale.shift(this.value, count))
	}

	moveToEdge(index: number, edge: TSlideEdge): void {
		if (!this._editable || index !== 0) return

		this._stepTo(edge === 'start' ? this._scale.first : this._scale.last)
	}

	/* ------------------------------------------------------------------ */
	/* Наведение                                                          */
	/* ------------------------------------------------------------------ */

	hover(fraction: number | undefined): void {
		this._setPreview(
			fraction === undefined || !this._editable ? undefined : this._valueAt(fraction),
		)
	}

	/* ------------------------------------------------------------------ */
	/* Выходы для разметки                                                */
	/* ------------------------------------------------------------------ */

	/**
	 * Звёзды: номер и доля заливки — от предпросмотра, пока он идёт, иначе от
	 * значения. Доля, а не состояния «пустая, половина, полная»: шаг бывает
	 * мельче половины, и оценка только для показа рисует и 4,3.
	 */
	get stars(): TRatingStar[] {
		const shown = this._preview ?? this.value

		return Array.from({ length: this._scale.max }, (_, index) => ({
			value: index + 1,
			style: {
				'--so-rating-fraction': decimal(Math.min(Math.max(shown - index, 0), 1)),
			},
		}))
	}

	/* ------------------------------------------------------------------ */
	/* Внутреннее                                                         */
	/* ------------------------------------------------------------------ */

	/** Оценку можно менять: не выключена и не только для показа. */
	protected get _editable(): boolean {
		return !this.disabled && !this.readonly
	}

	/**
	 * Шкала — от 0 до целого числа звёзд: дорожка — звёзды встык, и доля её
	 * коробки ложится на звёзды без остатка. Число звёзд конечно: бесконечность
	 * шкала сочла бы открытым концом, а ряд без конца не нарисовать — такой
	 * `max` даёт пустой ряд, как и не число.
	 */
	protected _createScale(): IScale {
		const stars = Math.floor(this._max)

		return createScale({
			min: 0,
			max: Number.isFinite(stars) ? stars : 0,
			step: this._step,
		})
	}

	/**
	 * Сменить шкалу. Хранимое значение не трогается — пересчитывается итог, и
	 * `change:value` приходит, только если он сменился. Предпросмотр считан по
	 * прежней шкале и снимается: следующее движение указателя поставит новый.
	 */
	protected _rescale(apply: () => void): void {
		const before = this.value

		apply()
		this._scale = this._createScale()
		this._resetPreview()
		this._valueChanged(before)
	}

	/**
	 * Оценка в доле ряда: вверх, к шагу, — нажатие на звезде ставит её до
	 * конца (до конца её половины при шаге 0,5), — и не меньше одного шага.
	 */
	protected _valueAt(fraction: number): number {
		const scale = this._scale
		const target = scale.min + fraction * (scale.max - scale.min)
		const nearest = scale.snap(target)
		const above = nearest < target ? scale.shift(nearest, 1) : nearest

		return Math.max(above, scale.shift(scale.first, 1))
	}

	/**
	 * Шаг клавишей — законченное действие: значение, `commit`. Предпросмотр
	 * снимается — клавиша новее указателя, и звёзды показывают то, что она
	 * поставила, хотя указатель стоит над ними.
	 */
	protected _stepTo(target: number): void {
		const before = this.value

		this._resetPreview()
		this.value = target
		this._commit(before)
	}

	protected _setPreview(value: number | undefined): void {
		const oldPreview = this.preview

		if (this._preview === value) return

		this._preview = value
		this.events.emit('change:preview', { newValue: value, oldValue: oldPreview })
	}

	protected _resetPreview(): void {
		this._setPreview(undefined)
	}

	protected _commit(before: number): void {
		const after = this.value

		if (before === after) return

		this.events.emit('commit', { newValue: after, oldValue: before })
	}

	/**
	 * `aria` стоит на поле, а не на корне: `disabled` у него нативный, и
	 * `aria-disabled` рядом был бы дублем.
	 */
	protected override get _ariaTag(): string {
		return 'input'
	}

	/**
	 * Поле — `input[type=range]`: `readonly` и `required` HTML у него не знает.
	 * Только для показа скринридеру сообщает `aria-readonly` — у роли
	 * `slider` он есть. `aria-required` у неё нет, и об обязательности говорит
	 * подпись потребителя, а не ARIA; не поставленную обязательную оценку не
	 * пускает в форму плагин обязательности — ошибкой поля.
	 */
	protected override _syncInputAccessibility(): void {
		this._aria.add('aria-readonly', this.readonly ? 'true' : null)
	}

	override getProps(): IRatingProps {
		return {
			...super.getProps(),
			max: this._max,
			step: this._step,
		}
	}
}
