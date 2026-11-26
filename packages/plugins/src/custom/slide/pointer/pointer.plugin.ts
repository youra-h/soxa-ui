import type { ISlidable, TSlideSnap, TValuePayload } from '@soxa-ui/core'
import { TBasePlugin } from '../../../base'
import type { IPluginContext } from '../../../base'
import { TElementPlugin } from '../../element'
import type { IDomEventTarget } from '../../../utils'
import { TPointerGesture } from '../../../utils/pointer-gesture'
import { fractionAt, lengthAlong, slideDirection } from '../direction'
import { fieldOf, thumbsOf, trackOf } from '../parts'
import type { TSlideDirection } from '../types'
import {
	THoldSnapStrategy,
	TMagnetSnapStrategy,
	TNoneSnapStrategy,
	TPlateauSnapStrategy,
	TSettleSnapStrategy,
} from './strategies'
import type { ISlideSnapStrategy, TSlideSnapStrategyCtor } from './strategies'
import type {
	ISlidePointerPluginOptions,
	TSlidePointerGesture,
	TSlidePointerPluginEvents,
	TSlidePointerStart,
} from './types'

/** Стратегия на каждый режим щелчка: режим выбирает класс, а не ветку в жесте. */
const SNAP_STRATEGIES: Readonly<Record<TSlideSnap, TSlideSnapStrategyCtor>> = {
	none: TNoneSnapStrategy,
	magnet: TMagnetSnapStrategy,
	plateau: TPlateauSnapStrategy,
	settle: TSettleSnapStrategy,
	hold: THoldSnapStrategy,
}

/** Стоянка ручки на метке в режиме `hold`, мс, — пока опция не задана. */
const HOLD_DELAY = 250

type TSlideGesture = Omit<TSlidePointerGesture, 'pointer'>
type TSlideStart = Omit<TSlidePointerStart, 'pointer'>

/**
 * Где ручка жеста была бы без щелчка: сдвинута от своего места при нажатии на
 * столько же, на сколько указатель.
 */
function unsnapped(gesture: TSlideGesture): number {
	return gesture.anchor + (gesture.at - gesture.origin)
}

/**
 * TSlidePointerPlugin — указатель перетаскивания: нажатие, протяжка и
 * отпускание мыши, пальца и пера.
 *
 * Операции над DOM — здесь, значение — у владельца: плагин переводит точку
 * указателя в долю хода по коробке дорожки и зовёт команды `ISlidable`
 * (`grab`, `press`, `drag`, `release`, `settle`). Какую ручку вести, куда её
 * поставить и когда слать `commit`, решает владелец. О ползунке плагин не
 * знает — только контракт, поэтому его возьмёт и следующий компонент с
 * перетаскиванием.
 *
 * Слушает корень, а не дорожку: полоса ручек, отступы под ореол и подписи
 * меток — тоже цель для пальца, а долю плагин всё равно считает по коробке
 * дорожки. Нажатие на ручке начинает жест с неё (значение не прыгает), мимо
 * ручек — ставит туда ближайшую.
 *
 * **Щелчок к меткам** — стратегия на режим владельца (`snap`, `strategies/`).
 * Стратегию выбирает подписка на `change:snap`, а не проверка режима в
 * обработчике, и жест держит ту, с которой начался. Стратегия видит ручку:
 * куда та встала бы без щелчка и куда ей встать. Радиус щелчка владелец
 * держит в px, в долю хода его переводит длина дорожки.
 *
 * Своих действий у нажатия нет (`preventDefault`): ни выделения текста, ни
 * своего фокуса браузера. Фокус получает поле той ручки, которую ведёт жест, —
 * так клавиши продолжают с того места, где отпустили указатель.
 *
 * `click`, которым кончается жест, тоже гасится. Внутри подписи `Label` он
 * запустил бы её действие — фокус на первое поле подписи, даже если тянули
 * вторую ручку. С захватом указателя этот `click` приходит в корень, где бы
 * его ни отпустили.
 */
export class TSlidePointerPlugin extends TBasePlugin<ISlidable, TSlidePointerPluginEvents> {
	private _owner: ISlidable | null = null
	private _root: Element | null = null
	private _gesture: TSlideGesture | null = null
	private readonly _pointer = new TPointerGesture()
	/** Класс стратегии щелчка для следующего жеста — по режиму владельца */
	private _snapStrategy: TSlideSnapStrategyCtor = TNoneSnapStrategy
	private _holdDelay = HOLD_DELAY
	/** Конец стоянки ручки на метке: стратегии снова нужна ручка, хотя указатель стоит */
	private _wakeTimer: ReturnType<typeof setTimeout> | null = null

	override install(ctx: IPluginContext, options?: ISlidePointerPluginOptions): void {
		super.install(ctx, options)

		this._holdDelay = options?.holdDelay ?? this._holdDelay
		this._owner = ctx.getInstance<ISlidable>()

		const element = ctx.get(TElementPlugin)

		element?.events.on('ready', (node) => this._attach(node))
		element?.events.on('removed', () => this._detach())

		// Владелец бывает долговечнее плагина — свой `ctrl` переживает
		// перемонтирование, — поэтому подписку плагин снимает сам (`destroy`)
		this._snapStrategy = SNAP_STRATEGIES[this._owner?.snap ?? 'none']
		this._owner?.events.on('change:snap', this._onSnapChange)
	}

	override destroy(): void {
		this._detach()
		this._owner?.events.off('change:snap', this._onSnapChange)
		this._owner = null

		super.destroy()
	}

	private readonly _onSnapChange = ({ newValue: snap }: TValuePayload<TSlideSnap>): void => {
		this._snapStrategy = SNAP_STRATEGIES[snap]
	}

	private _attach(root: Element): void {
		this._detach()

		this._root = root

		const target: IDomEventTarget = root

		target.addEventListener('pointerdown', this._onPointerDown)
		target.addEventListener('pointermove', this._onPointerMove)
		target.addEventListener('pointerup', this._onPointerUp)
		target.addEventListener('pointercancel', this._onPointerUp)
		target.addEventListener('lostpointercapture', this._onPointerUp)
		target.addEventListener('click', this._onClick)
	}

	private _detach(): void {
		this._pointer.finish()
		this._end()

		const target: IDomEventTarget | null = this._root

		target?.removeEventListener('pointerdown', this._onPointerDown)
		target?.removeEventListener('pointermove', this._onPointerMove)
		target?.removeEventListener('pointerup', this._onPointerUp)
		target?.removeEventListener('pointercancel', this._onPointerUp)
		target?.removeEventListener('lostpointercapture', this._onPointerUp)
		target?.removeEventListener('click', this._onClick)

		this._root = null
	}

	private readonly _onPointerDown = (event: PointerEvent): void => {
		const owner = this._owner
		const root = this._root

		if (!owner || !root || !this._pointer.canStart(event)) return

		const track = trackOf(owner, root)

		if (!track) return

		const direction = slideDirection(owner, root)
		const box = track.getBoundingClientRect()
		const fraction = fractionAt(direction, box, event)
		const thumb = thumbsOf(owner, track).findIndex(
			(node) => event.target instanceof Node && node.contains(event.target),
		)
		const start: TSlideStart = {
			track,
			direction,
			origin: fraction,
		}
		const gesture =
			thumb >= 0 ? this._grab(owner, thumb, start, box) : this._press(owner, start, box)

		if (!gesture) return

		this._gesture = gesture
		this._scheduleWake(gesture.snap.wakeAt)
		this._pointer.start(root, event)

		this._focusActive()
	}

	/**
	 * Нажали на ручку: жест с неё. Ручка не двигается, и стратегия начинает
	 * с того места, где она стоит.
	 */
	private _grab(
		owner: ISlidable,
		thumb: number,
		start: TSlideStart,
		box: DOMRectReadOnly,
	): TSlideGesture | null {
		if (!owner.grab(thumb, start.origin)) return null

		const anchor = owner.fractions[thumb]
		const snap = this._snapFor(owner, start.direction, box, anchor)

		return { ...start, snap, anchor, at: start.origin, placed: anchor }
	}

	/**
	 * Нажали мимо ручек: ближайшая встаёт туда, куда её ставит щелчок, — в
	 * точку нажатия или на метку рядом с ней.
	 */
	private _press(
		owner: ISlidable,
		start: TSlideStart,
		box: DOMRectReadOnly,
	): TSlideGesture | null {
		const anchor = start.origin
		const snap = this._snapFor(owner, start.direction, box, anchor)
		const placed = snap.follow(anchor, performance.now())

		if (!owner.press(placed)) return null

		return { ...start, snap, anchor, at: start.origin, placed }
	}

	/** Стратегия щелчка на жест: точки — метки владельца, радиус — доля длины дорожки. */
	private _snapFor(
		owner: ISlidable,
		direction: TSlideDirection,
		box: DOMRectReadOnly,
		anchor: number,
	): ISlideSnapStrategy {
		const length = lengthAlong(direction, box)

		return new this._snapStrategy({
			points: owner.snapPoints,
			radius: length > 0 ? owner.snapRadius / length : 0,
			anchor,
			holdDelay: this._holdDelay,
		})
	}

	private readonly _onPointerMove = (event: PointerEvent): void => {
		const gesture = this._gesture

		if (!gesture || !this._pointer.owns(event)) return

		gesture.at = fractionAt(gesture.direction, gesture.track.getBoundingClientRect(), event)

		this._follow(gesture)
	}

	/**
	 * Повести ручку за указателем жеста — через стратегию щелчка.
	 *
	 * Ядро ведёт ручку за указателем со смещением захвата, поэтому место от
	 * щелчка уходит ему поправкой к указателю: доля, при которой ручка встанет
	 * туда, куда её поставил щелчок. Без щелчка поправка — ноль, и ядро
	 * получает указатель как есть: «ещё не двигали» оно узнаёт по точному
	 * равенству с точкой нажатия. Щелчок оставил ручку на том же месте —
	 * сообщать нечего.
	 */
	private _follow(gesture: TSlideGesture): void {
		const target = unsnapped(gesture)
		const placed = gesture.snap.follow(target, performance.now())

		this._scheduleWake(gesture.snap.wakeAt)

		if (placed === gesture.placed) return

		gesture.placed = placed
		this._owner?.drag(gesture.at + (placed - target))

		// У ручек на одном значении ведомую выбирает первое движение
		this._focusActive()
	}

	/** Стоянка на метке кончается — стратегии снова нужна ручка, хотя указатель стоит. */
	private _scheduleWake(at: number | undefined): void {
		this._cancelWake()

		if (at === undefined) return

		this._wakeTimer = setTimeout(this._onWake, Math.max(0, at - performance.now()))
	}

	private readonly _onWake = (): void => {
		this._wakeTimer = null

		if (this._gesture) this._follow(this._gesture)
	}

	private _cancelWake(): void {
		if (this._wakeTimer === null) return

		clearTimeout(this._wakeTimer)
		this._wakeTimer = null
	}

	private readonly _onPointerUp = (event: PointerEvent): void => {
		if (this._pointer.finish(event)) this._end()
	}

	private readonly _onClick = (event: MouseEvent): void => {
		this._pointer.preventTrailingClick(event)
	}

	/**
	 * Закончить жест: отпустили, браузер отнял указатель или корень ушёл.
	 * Стратегия решает, довести ли ручку: доводку владелец делает сам, уже без
	 * перетаскивания (`settle`).
	 */
	private _end(): void {
		const gesture = this._gesture

		if (!gesture) return

		this._gesture = null
		this._cancelWake()

		const settle = gesture.snap.release(unsnapped(gesture))

		if (settle === undefined) {
			this._owner?.release()
		} else {
			this._owner?.settle(settle)
		}
	}

	/**
	 * Фокус — полю ведомой ручки. Без прокрутки: страница не должна прыгать к
	 * ручке, которую пользователь и так держит.
	 *
	 * И без кольца (`focusVisible: false`). Фокус ставит скрипт, а видимость
	 * такого фокуса браузер берёт у прошлого: пришёл тот не от мыши — свежая
	 * страница, Tab, — и нажатие мышью включило бы `:focus-visible` поля, а с
	 * ним кольцо ручки и подсказку `auto`. Их держит только фокус с
	 * клавиатуры.
	 */
	private _focusActive(): void {
		const owner = this._owner
		const gesture = this._gesture
		const index = owner?.activeThumb

		if (!owner || !gesture || index === undefined) return

		const field = fieldOf(thumbsOf(owner, gesture.track)[index])

		if (field && field.ownerDocument.activeElement !== field)
			field.focus({ preventScroll: true, focusVisible: false })
	}
}
