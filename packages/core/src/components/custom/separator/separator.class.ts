import { TComponentView } from '../../base/component-view'
import type { TDefaultValues } from '../../base/component'
import type { TOrientation } from '../../../common'
import type { ISeparator, ISeparatorProps, TSeparatorEvents } from './types'

/** A non-interactive boundary between adjacent sections of content. */
export default class TSeparator
	extends TComponentView<ISeparatorProps, TSeparatorEvents>
	implements ISeparator
{
	static override baseClass = 'so-separator'

	static defaultValues: typeof TComponentView.defaultValues &
		TDefaultValues<ISeparatorProps, 'orientation' | 'decorative'> = {
		...TComponentView.defaultValues,
		orientation: 'horizontal',
		decorative: false,
	}

	protected _orientation: TOrientation
	protected _decorative: boolean

	constructor(props: Partial<ISeparatorProps> = {}) {
		super(props)

		const ctor = new.target as typeof TSeparator
		this._orientation = props.orientation ?? ctor.defaultValues.orientation
		this._decorative = props.decorative ?? ctor.defaultValues.decorative
		this._classes.swap({ prefix: '--orientation-', newValue: this._orientation })
		this._syncAria()
	}

	get orientation(): TOrientation {
		return this._orientation
	}

	set orientation(value: TOrientation) {
		const oldValue = this._orientation
		if (oldValue === value) return

		this._orientation = value
		this._classes.swap({ prefix: '--orientation-', oldValue, newValue: value })
		this._syncAria()
		this.events.emit('change:orientation', { newValue: value, oldValue })
	}

	get decorative(): boolean {
		return this._decorative
	}

	set decorative(value: boolean) {
		const oldValue = this._decorative
		if (oldValue === value) return

		this._decorative = value
		this._syncAria()
		this.events.emit('change:decorative', { newValue: value, oldValue })
	}

	protected _syncAria(): void {
		// Keep the axis in the model while the boundary has no semantic role.
		this._aria.add('role', this._decorative ? 'none' : 'separator')
		this._aria.add('aria-orientation', this._decorative ? null : this._orientation)
	}

	override getProps(): ISeparatorProps {
		return { ...super.getProps(), orientation: this._orientation, decorative: this._decorative }
	}
}
