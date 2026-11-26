import { TComponentView } from '../../../base/component-view'
import type { TDefaultValues } from '../../../base/component'
import type { TEventSink } from '../../../../common'
import type { ISplitterPartProps, TSplitterPartEvents } from './types'

export abstract class TSplitterPart<
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
