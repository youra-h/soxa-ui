import { TComponentView } from '../../../base/component-view'
import type { IComponentViewProps, TComponentViewEvents } from '../../../base/component-view'

/** Silent list line outside collection membership; listbox children cannot use a separator role. */
export class TListSeparator extends TComponentView<IComponentViewProps, TComponentViewEvents> {
	constructor(props: Partial<IComponentViewProps> = {}) {
		super(props)

		this._aria.add('aria-hidden', 'true')
	}
}
