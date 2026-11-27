import type { TEventSink } from '../../../common'
import { TLayer } from '../../base/layer'
import type { TDefaultValues } from '../../base/component'
import type { IFrame, IFrameProps, TFrameEvents, TFrameStrategy } from './types'

/**
 * Headless-контейнер для всплывающего контента.
 *
 * Слой (`TLayer`) — телепорт, видимость и место в общем стеке z-index с
 * номером в `data-layer`. Сверху Frame держит свою раскладку: позицию
 * (x, y), размер (width, height) и способ позиционирования. Не имеет
 * привязки к DOM — только логика; стили из этих значений собирает
 * `TFrameLayoutPlugin`.
 *
 * @example
 * const frame = new TFrame({ x: 100, y: 200, width: 300, height: 'auto' })
 * frame.show() // получает z-index, становится visible
 * frame.hide() // скрывается
 */
export default class TFrame<
	TProps extends IFrameProps = IFrameProps,
	TEvents extends TFrameEvents = TFrameEvents,
>
	extends TLayer<TProps, TEvents>
	implements IFrame<TProps, TEvents>
{
	static baseClass = 'so-frame'

	static defaultValues: typeof TLayer.defaultValues &
		TDefaultValues<IFrameProps, 'x' | 'y' | 'width' | 'height' | 'strategy' | 'contained'> = {
		...TLayer.defaultValues,
		x: 0,
		y: 0,
		// Слой по умолчанию берёт размер по содержимому — число задаётся осознанно.
		width: 'auto',
		height: 'auto',
		strategy: 'fixed',
		contained: false,
	}

	private _strategy: TFrameStrategy
	protected _x: number
	protected _y: number
	protected _width: number | string
	protected _height: number | string
	protected _contained!: boolean

	constructor(props: Partial<TProps> = {}) {
		const ctor = new.target as typeof TFrame

		super(props)

		this._x = props.x ?? ctor.defaultValues.x
		this._y = props.y ?? ctor.defaultValues.y
		this._width = props.width ?? ctor.defaultValues.width
		this._height = props.height ?? ctor.defaultValues.height

		this._strategy = props.strategy ?? ctor.defaultValues.strategy
		this._applyContained(props.contained ?? ctor.defaultValues.contained)
	}

	protected override get _sink(): TEventSink<TFrameEvents> {
		return this.events
	}

	get x(): number {
		return this._x
	}
	set x(value: number) {
		const oldX = this.x

		if (this._x === value) return
		this._x = value
		this._sink.emit('change:x', { newValue: value, oldValue: oldX })
	}

	get y(): number {
		return this._y
	}
	set y(value: number) {
		const oldY = this.y

		if (this._y === value) return
		this._y = value
		this._sink.emit('change:y', { newValue: value, oldValue: oldY })
	}

	get width(): number | string {
		return this._width
	}
	set width(value: number | string) {
		const oldWidth = this.width

		if (this._width === value) return
		this._width = value
		this._sink.emit('change:width', { newValue: value, oldValue: oldWidth })
	}

	get height(): number | string {
		return this._height
	}
	set height(value: number | string) {
		const oldHeight = this.height

		if (this._height === value) return
		this._height = value
		this._sink.emit('change:height', { newValue: value, oldValue: oldHeight })
	}

	get strategy(): TFrameStrategy {
		return this._strategy
	}
	set strategy(value: TFrameStrategy) {
		const oldStrategy = this.strategy

		if (this._strategy === value) return
		this._strategy = value
		this._sink.emit('change:strategy', { newValue: value, oldValue: oldStrategy })
	}

	/**
	 * Панель внутри своего контейнера, а не поверх страницы. Внутри контейнера
	 * панель не телепортируется — разметка оставляет её на месте, — и
	 * раскладка ставит её `absolute` от ближайшего позиционированного предка,
	 * без координат: где в нём встать, решает тема по `data-contained`. Якорь
	 * такую панель не двигает. Так же устроена выезжающая панель (Drawer).
	 */
	get contained(): boolean {
		return this._contained
	}

	set contained(value: boolean) {
		const oldContained = this.contained

		if (this._contained === value) return

		this._applyContained(value)
		this._sink.emit('change:contained', { newValue: value, oldValue: oldContained })
	}

	getProps(): TProps {
		return {
			...super.getProps(),
			x: this.x,
			y: this.y,
			width: this.width,
			height: this.height,
			strategy: this.strategy,
			contained: this.contained,
		}
	}

	protected _applyContained(value: boolean): void {
		this._contained = value

		// Тема по нему ставит панель в контейнер, а не на экран
		this._dataset.add('contained', value)
	}
}
