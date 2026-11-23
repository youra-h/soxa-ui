import { TComponentView } from '../component-view'
import type { TBackdropView } from './types'

/** The modal layer owns visibility and stacking. The backdrop owns its appearance. */
export default class TBackdrop extends TComponentView {
	static override baseClass = 'so-backdrop'

	private _view: TBackdropView | undefined

	constructor(partClass: string | undefined, view: TBackdropView | undefined) {
		super()
		if (partClass) this._classes.add(partClass, false)
		this.view = view
	}

	get view(): TBackdropView | undefined {
		return this._view
	}

	set view(value: TBackdropView | undefined) {
		if (this._view === value) return

		this._classes.swap({ prefix: '--view-', oldValue: this._view, newValue: value })
		this._view = value
	}
}
