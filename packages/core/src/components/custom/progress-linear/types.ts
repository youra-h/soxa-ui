import type { TOrientation, TValuePayload } from '../../../common'
import type { IProgress, IProgressProps, TProgressEvents } from '../../base/progress'

/**
 * CSS-переменные корня — и только они: доля готового процентом от `min` до
 * `max`, с `%`. Дорожку, заливку и бег раскладывает тема, логическими
 * свойствами, поэтому RTL разметке знать не нужно.
 */
export type TProgressLinearStyle = Record<`--${string}`, string>

/**
 * Ось полосы: `horizontal` — вдоль строки, от её начала; `vertical` — снизу
 * вверх, как вертикальный Slider.
 */
export type TProgressLinearOrientation = TOrientation

export interface IProgressLinearProps extends IProgressProps {
	/** Ось полосы */
	orientation?: TOrientation
}

export type TProgressLinearEvents = TProgressEvents & {
	/** change:orientation */
	'change:orientation': (payload: TValuePayload<TOrientation>) => void
}

export interface IProgressLinear extends IProgress<IProgressLinearProps, TProgressLinearEvents> {
	/** Ось полосы */
	orientation: TOrientation
	/**
	 * `--so-progress-linear-percent` — доля готового, прижатая к 0–100 %. Пока
	 * полоса бежит, переменной нет
	 */
	readonly percentStyle: TProgressLinearStyle
}
