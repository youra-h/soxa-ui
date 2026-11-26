import { TComponentView } from '../../base/component-view'
import type { TDefaultValues } from '../../base/component'
import type { TEventSink } from '../../../common'
import type {
	ISplitter,
	ISplitterHandle,
	ISplitterHandleProps,
	ISplitterPanel,
	ISplitterPartProps,
	TSplitterHandleEvents,
	TSplitterPartEvents,
	TSplitterPanelEvents,
} from './types'

abstract class TSplitterPart<
	Props extends ISplitterPartProps,
	Events extends TSplitterPartEvents,
> extends TComponentView<Props, Events> {
	static defaultValues: typeof TComponentView.defaultValues &
		TDefaultValues<ISplitterPartProps, 'panel'> = {
		...TComponentView.defaultValues,
		panel: '',
	}

	private _panel: string

	constructor(props: Partial<Props> = {}) {
		super(props)
		this._panel = props.panel ?? TSplitterPart.defaultValues.panel
	}

	get panel(): string {
		return this._panel
	}

	set panel(value: string) {
		const oldValue = this._panel

		if (value === oldValue) return

		this._panel = value
		const events: TEventSink<TSplitterPartEvents> = this.events
		events.emit('change:panel', { newValue: value, oldValue })
	}

	override getProps(): Props {
		return { ...super.getProps(), panel: this.panel }
	}
}

export class TSplitterPanel
	extends TSplitterPart<ISplitterPartProps, TSplitterPanelEvents>
	implements ISplitterPanel
{
	static override baseClass = 'so-splitter__panel'

	private _panelStyle: Record<string, number> = {}

	constructor(props: Partial<ISplitterPartProps> = {}) {
		super(props)

		// Scrollable panels need a keyboard entry point even when they contain only text.
		this._attrs.add('tabindex', '0')
	}

	get panelStyle(): Record<string, number> {
		return this._panelStyle
	}

	sync(owner: ISplitter | null): void {
		const index = owner?.indexOf(this.panel) ?? -1
		const size = owner?.sizes[index]
		const collapsed = size === 0

		this._dataset.add('collapsed', collapsed ? '' : null)

		const oldValue = this._panelStyle

		if (oldValue['--so-splitter-panel-size'] === size) return

		const newValue: Record<string, number> =
			size === undefined ? {} : { '--so-splitter-panel-size': size }
		this._panelStyle = newValue
		this.events.emit('change:panelStyle', { newValue, oldValue })
	}
}

export class TSplitterHandle
	extends TSplitterPart<ISplitterHandleProps, TSplitterHandleEvents>
	implements ISplitterHandle
{
	static override baseClass = 'so-splitter__thumb'

	static defaultValues: typeof TSplitterPart.defaultValues &
		TDefaultValues<ISplitterHandleProps, 'size'> = {
		...TSplitterPart.defaultValues,
		size: 'normal',
	}

	private _size: string
	private _thumbShown = true

	constructor(props: Partial<ISplitterHandleProps> = {}) {
		super(props)
		this._size = props.size ?? TSplitterHandle.defaultValues.size
		this._classes.add(`--size-${this.size}`)
		this._aria.add('role', 'separator')
		this.sync(null)
	}

	get size(): string {
		return this._size
	}

	set size(value: string) {
		const oldValue = this._size

		if (value === oldValue) return

		this._size = value
		this._classes.swap({ prefix: '--size-', oldValue, newValue: value })
		this.events.emit('change:size', { newValue: value, oldValue })
	}

	get thumbShown(): boolean {
		return this._thumbShown
	}

	sync(owner: ISplitter | null): void {
		const oldValue = this._thumbShown
		const newValue = owner?.thumb ?? true

		if (oldValue !== newValue) {
			this._thumbShown = newValue
			this.events.emit('change:thumbShown', { newValue, oldValue })
		}

		const index = owner?.indexOf(this.panel) ?? -1
		const valid = owner && index >= 0 && index < owner.sizes.length - 1
		const [min, max] = valid ? owner.rangeOf(index) : [0, 0]
		const disabled = !valid || owner.disabled || max - min <= 1e-8

		this._aria.add(
			'aria-orientation',
			owner?.orientation === 'vertical' ? 'horizontal' : 'vertical',
		)
		this._aria.add('aria-valuemin', valid ? String(min) : null)
		this._aria.add('aria-valuemax', valid ? String(max) : null)
		this._aria.add(
			'aria-valuenow',
			valid ? String(Number(owner.sizes[index].toFixed(8))) : null,
		)
		this._aria.add('aria-disabled', disabled ? 'true' : null)
		this._attrs.add('tabindex', disabled ? '-1' : '0')
		this._dataset.add('index', valid ? String(index) : null)
		this._dataset.add('disabled', disabled ? '' : null)
		this._dataset.add('dragging', valid && owner.activeThumb === index ? '' : null)
	}

	override getProps(): ISplitterHandleProps {
		return { ...super.getProps(), size: this.size }
	}
}
