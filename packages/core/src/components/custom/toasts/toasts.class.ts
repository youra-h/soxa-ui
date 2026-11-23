import type { TToastsItemView } from './item/types'
import { TLayer } from '../../base/layer'
import type { TDefaultValues } from '../../base/component'
import type { IToasts, IToastsProps, TToastsEvents, TToastsLayout, TToastsPlacement } from './types'

/**
 * Toast manager and its interactive notification region.
 * Placement, layout, maximum visible count and default duration configure
 * the collection. The region is a named landmark (F8 reaches its items).
 * TToastsAnnouncePlugin provides persistent, text-only polite/assertive
 * regions; the interactive list itself has aria-live=off.
 */
export default class TToasts extends TLayer<IToastsProps, TToastsEvents> implements IToasts {
	static override baseClass = 'so-toasts'

	static defaultValues: typeof TLayer.defaultValues &
		TDefaultValues<IToastsProps, 'placement' | 'layout' | 'max' | 'duration', 'view'> = {
		...TLayer.defaultValues,
		// Регион виден всегда: открыт или закрыт — у самого тоста
		visible: true,
		tag: 'section',
		placement: 'bottom-end',
		layout: 'list',
		view: undefined,
		max: 3,
		duration: 5000,
	}

	protected _placement!: TToastsPlacement
	protected _layout!: TToastsLayout
	protected _view: TToastsItemView | undefined
	protected _max: number
	protected _duration: number

	constructor(props: Partial<IToastsProps> = {}) {
		super(props)

		const ctor = new.target as typeof TToasts

		this._max = props.max ?? ctor.defaultValues.max
		this._duration = props.duration ?? ctor.defaultValues.duration

		this._applyPlacement(props.placement ?? ctor.defaultValues.placement)
		this._applyLayout(props.layout ?? ctor.defaultValues.layout)
		this._view = props.view ?? ctor.defaultValues.view
		this._classes.swap({ prefix: '--view-', newValue: this._view })

		// The interactive region stays quiet; the shared plugin announces message text.
		this._aria.add('role', 'region')
		this._aria.add('aria-live', 'off')
	}

	/** Где регион тостов. */
	get placement(): TToastsPlacement {
		return this._placement
	}

	set placement(value: TToastsPlacement) {
		const oldPlacement = this.placement

		if (this._placement === value) return

		this._applyPlacement(value, this._placement)
		this.events.emit('change:placement', { newValue: value, oldValue: oldPlacement })
	}

	/** Как тосты стоят в регионе: столбцом (`list`) или стопкой (`cascade`). */
	get layout(): TToastsLayout {
		return this._layout
	}

	set layout(value: TToastsLayout) {
		const oldLayout = this.layout

		if (this._layout === value) return

		this._applyLayout(value, this._layout)
		this.events.emit('change:layout', { newValue: value, oldValue: oldLayout })
	}

	get view(): TToastsItemView | undefined {
		return this._view
	}

	set view(value: TToastsItemView | undefined) {
		if (value === this._view) return

		const oldValue = this._view
		this._classes.swap({ prefix: '--view-', oldValue, newValue: value })
		this._view = value
		this.events.emit('change:view', { newValue: value, oldValue })
	}
	/** Сколько тостов видно разом; остальные ждут, пока место освободится. */
	get max(): number {
		return this._max
	}

	set max(value: number) {
		const oldMax = this.max

		if (this._max === value) return

		this._max = value
		this.events.emit('change:max', { newValue: value, oldValue: oldMax })
	}

	/** Длительность тоста без своей, мс; `0` — держится, пока не закроют. */
	get duration(): number {
		return this._duration
	}

	set duration(value: number) {
		const oldDuration = this.duration

		if (this._duration === value) return

		this._duration = value
		this.events.emit('change:duration', { newValue: value, oldValue: oldDuration })
	}

	protected _applyPlacement(newValue: TToastsPlacement, oldValue?: TToastsPlacement): void {
		this._classes.swap({
			prefix: '--placement-',
			oldValue,
			newValue,
		})

		this._placement = newValue
	}

	protected _applyLayout(newValue: TToastsLayout, oldValue?: TToastsLayout): void {
		this._classes.swap({
			prefix: '--layout-',
			oldValue,
			newValue,
		})

		this._layout = newValue
	}

	override getProps(): IToastsProps {
		return {
			...super.getProps(),
			placement: this._placement,
			layout: this._layout,
			view: this._view,
			max: this._max,
			duration: this._duration,
		}
	}
}
