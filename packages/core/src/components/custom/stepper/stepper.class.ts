import { TValueControl } from '../../base/value-control'
import type { TDefaultValues } from '../../base/component'
import type { TOrientation } from '../../../common'
import type { IStepper, IStepperProps, TStepperEvents, TStepperValue } from './types'

export class TStepper
	extends TValueControl<TStepperValue, IStepperProps, TStepperEvents>
	implements IStepper
{
	static override baseClass = 'so-stepper'

	static defaultValues: typeof TValueControl.defaultValues &
		TDefaultValues<IStepperProps, 'linear' | 'interactive' | 'orientation'> = {
		...TValueControl.defaultValues,
		linear: false,
		interactive: true,
		orientation: 'horizontal',
	}

	private _linear: boolean
	private _interactive: boolean
	private _orientation: TOrientation

	constructor(props: Partial<IStepperProps> = {}) {
		super(props)

		const defaults = (new.target as typeof TStepper).defaultValues
		this._linear = props.linear ?? defaults.linear
		this._interactive = props.interactive ?? defaults.interactive
		this._orientation = props.orientation ?? defaults.orientation
		this._aria.add('role', 'group')
		this._dataset.add('orientation', this._orientation)
	}

	get linear(): boolean {
		return this._linear
	}

	set linear(value: boolean) {
		const oldValue = this._linear
		if (value === oldValue) return

		this._linear = value
		this.events.emit('change:linear', { oldValue, newValue: value })
	}

	get interactive(): boolean {
		return this._interactive
	}

	set interactive(value: boolean) {
		const oldValue = this._interactive
		if (value === oldValue) return

		this._interactive = value
		this.events.emit('change:interactive', { oldValue, newValue: value })
	}

	get orientation(): TOrientation {
		return this._orientation
	}

	set orientation(value: TOrientation) {
		const oldValue = this._orientation
		if (value === oldValue) return

		this._orientation = value
		this._dataset.add('orientation', value)
		this.events.emit('change:orientation', { oldValue, newValue: value })
	}

	override getProps(): IStepperProps {
		return {
			...super.getProps(),
			linear: this.linear,
			interactive: this.interactive,
			orientation: this.orientation,
		}
	}
}
