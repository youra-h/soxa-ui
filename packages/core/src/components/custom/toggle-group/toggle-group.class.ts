import { TControl } from '../../base/control'
import type { TDefaultValues } from '../../base/component'
import type { TOrientation } from '../../../common'
import type { IToggleGroup, IToggleGroupProps, TToggleGroupEvents, TToggleGroupView } from './types'

/** Accessible group appearance and orientation; composition and selection live in its engine. */
export class TToggleGroup
	extends TControl<IToggleGroupProps, TToggleGroupEvents>
	implements IToggleGroup
{
	static override baseClass = 'so-toggle-group'

	static defaultValues: typeof TControl.defaultValues &
		TDefaultValues<IToggleGroupProps, 'orientation', 'view'> = {
		...TControl.defaultValues,
		view: undefined,
		orientation: 'horizontal',
	}

	protected _orientation: TOrientation

	protected _view: TToggleGroupView | undefined

	constructor(props: Partial<IToggleGroupProps> = {}) {
		super(props)

		const ctor = new.target as typeof TToggleGroup

		this._applyView(props.view ?? ctor.defaultValues.view)
		this._orientation = props.orientation ?? ctor.defaultValues.orientation
		this._classes.swap({ prefix: '--orientation-', newValue: this._orientation })
		this.aria.add('role', 'group')
	}

	get orientation(): TOrientation {
		return this._orientation
	}

	set orientation(value: TOrientation) {
		if (value === this._orientation) return

		const oldValue = this._orientation
		this._orientation = value
		this._classes.swap({ prefix: '--orientation-', oldValue, newValue: value })
		this.events.emit('change:orientation', { newValue: value, oldValue })
	}

	get view(): TToggleGroupView | undefined {
		return this._view
	}

	set view(value: TToggleGroupView | undefined) {
		const oldView = this.view

		if (this._view !== value) {
			this._applyView(value, this._view)
			this.events.emit('change:view', { newValue: value, oldValue: oldView })
		}
	}

	protected _applyView(newValue: TToggleGroupView | undefined, oldValue?: TToggleGroupView) {
		this._classes.swap({
			prefix: '--view-',
			oldValue,
			newValue,
		})
		this._view = newValue
	}

	override getProps(): IToggleGroupProps {
		return {
			...super.getProps(),
			view: this._view,
			orientation: this.orientation,
		}
	}
}
