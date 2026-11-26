import { TProgress } from '../../base/progress'
import type { TDefaultValues } from '../../base/component'
import type { TOrientation } from '../../../common'
import { percent } from '../../../common/utility/percent'
import type {
	IProgressLinear,
	IProgressLinearProps,
	TProgressLinearEvents,
	TProgressLinearStyle,
} from './types'

/**
 * Linear progress shares value, scale, indeterminate state, progressbar ARIA
 * and fraction calculation with TProgress. Orientation is exposed through
 * --orientation-horizontal/--orientation-vertical, like Slider and Tabs.
 * Progressbar does not support aria-orientation. The fraction is a percentage
 * CSS variable; the theme draws motion from data-indeterminate.
 */
export default class TProgressLinear
	extends TProgress<IProgressLinearProps, TProgressLinearEvents>
	implements IProgressLinear
{
	static override baseClass = 'so-progress-linear'

	static defaultValues: typeof TProgress.defaultValues &
		TDefaultValues<IProgressLinearProps, 'orientation'> = {
		...TProgress.defaultValues,
		orientation: 'horizontal',
	}

	protected _orientation!: TOrientation

	constructor(props: Partial<IProgressLinearProps> = {}) {
		super(props)

		const ctor = new.target as typeof TProgressLinear

		this._applyOrientation(props.orientation ?? ctor.defaultValues.orientation)
	}

	/* ------------------------------------------------------------------ */
	/* Свойства                                                           */
	/* ------------------------------------------------------------------ */

	get orientation(): TOrientation {
		return this._orientation
	}

	set orientation(value: TOrientation) {
		const oldOrientation = this.orientation

		if (this._orientation === value) return

		this._applyOrientation(value, this._orientation)
		this.events.emit('change:orientation', { newValue: value, oldValue: oldOrientation })
	}

	/* ------------------------------------------------------------------ */
	/* Выходы для разметки                                                */
	/* ------------------------------------------------------------------ */

	/**
	 * `--so-progress-linear-percent` — доля готового процентом: вне шкалы —
	 * край, у пустой шкалы (`max` не больше `min`) — `0%`. Пока полоса бежит,
	 * переменной нет: заливка уходит к нулю, и долю, вернувшуюся после бега,
	 * тема ведёт от начала дорожки, а не с того места, где её оставили.
	 */
	get percentStyle(): TProgressLinearStyle {
		const fraction = this._fraction

		if (fraction === null) return {}

		return { '--so-progress-linear-percent': percent(fraction) }
	}

	/* ------------------------------------------------------------------ */
	/* Внутреннее                                                         */
	/* ------------------------------------------------------------------ */

	/** Orientation is a prop-prefixed class; progressbar has no aria-orientation. */
	protected _applyOrientation(newValue: TOrientation, oldValue?: TOrientation): void {
		this._classes.swap({ prefix: '--orientation-', oldValue, newValue })
		this._orientation = newValue
	}

	override getProps(): IProgressLinearProps {
		return {
			...super.getProps(),
			orientation: this._orientation,
		}
	}
}
