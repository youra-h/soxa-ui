import { TSplitterPart } from '../part/part.class'
import type { ISplitterPartProps } from '../part/types'
import type { ISplitter } from '../types'
import type { ISplitterPanel, TSplitterPanelEvents } from './types'

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
