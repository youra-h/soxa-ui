import type { TValuePayload } from '../../../common'
import type { ILayer, ILayerProps, TLayerEvents } from '../../base/layer'

export type TFrameStrategy = 'fixed' | 'absolute'

export interface IFrameProps extends ILayerProps {
	/** Позиция по оси X (px) */
	x?: number
	/** Позиция по оси Y (px) */
	y?: number
	/** Ширина (px или CSS-значение) */
	width?: number | string
	/** Высота (px или CSS-значение) */
	height?: number | string
	/**
	 * CSS positioning strategy: fixed (viewport) or absolute (containing block).
	 * For anchored panels, the anchor plugin chooses it along with coordinates.
	 */
	strategy?: TFrameStrategy
	/**
	 * Панель внутри своего контейнера: не телепортируется, а остаётся в
	 * разметке на месте и встаёт в ближайшем позиционированном предке. Где
	 * именно в нём — решает тема; координаты и якорь тогда не действуют
	 */
	contained?: boolean
}

export type TFrameEvents = TLayerEvents & {
	/** change:x */
	'change:x': (payload: TValuePayload<number>) => void
	/** change:y */
	'change:y': (payload: TValuePayload<number>) => void
	/** change:width */
	'change:width': (payload: TValuePayload<number | string>) => void
	/** change:height */
	'change:height': (payload: TValuePayload<number | string>) => void
	/** change:strategy */
	'change:strategy': (payload: TValuePayload<TFrameStrategy>) => void
	/** change:contained */
	'change:contained': (payload: TValuePayload<boolean>) => void
}

export interface IFrame<
	TProps extends IFrameProps = IFrameProps,
	TEvents extends TFrameEvents = TFrameEvents,
> extends ILayer<TProps, TEvents> {
	/** Позиция по оси X */
	x: number
	/** Позиция по оси Y */
	y: number
	/** Ширина */
	width: number | string
	/** Высота */
	height: number | string
	/** CSS-позиционирование */
	strategy: TFrameStrategy
	/** Панель внутри своего контейнера, а не поверх страницы */
	contained: boolean
}
