import type { IValueControlProps, TValueControlEvents } from '../../base/value-control'
import { TValueControl } from '../../base/value-control'
import type { TSelectionMode, TSelectionValue } from '../../base/collection'
import type { TValuePayload } from '../../../common'
import { LIST_DEFAULTS } from '../list'
import type { TListIndicator } from '../list'
import type { TTreeCollectionFacadeEngine } from './collection/factory'
import type { ITreeNode, TTreeKey, TTreeLoadChildren } from './types'

export interface ITreeProps extends IValueControlProps<TSelectionValue> {
	items?: readonly ITreeNode[]
	expanded?: readonly TTreeKey[]
	mode?: TSelectionMode
	engine?: TTreeCollectionFacadeEngine
	loadChildren?: TTreeLoadChildren
	guides?: boolean
	/** Logical side of the selection mark in single and multiple modes. */
	indicator?: TListIndicator
}

export type TTreeEvents = TValueControlEvents<TSelectionValue> & {
	'change:loadChildren': (payload: TValuePayload<TTreeLoadChildren | undefined>) => void
	'change:guides': (payload: TValuePayload<boolean>) => void
	'change:indicator': (payload: TValuePayload<TListIndicator>) => void
}

export class TTree extends TValueControl<TSelectionValue, ITreeProps, TTreeEvents> {
	static override baseClass = 'so-tree'
	static override defaultValues = {
		...TValueControl.defaultValues,
		tag: 'div',
		guides: false,
		indicator: LIST_DEFAULTS.indicator,
		loadChildren: undefined,
	}

	private _loadChildren: TTreeLoadChildren | undefined
	private _guides: boolean
	private _indicator: TListIndicator

	constructor(props: ITreeProps = {}) {
		super(props)

		const defaults = (new.target as typeof TTree).defaultValues
		this._loadChildren = props.loadChildren ?? defaults.loadChildren
		this._guides = props.guides ?? defaults.guides
		this._indicator = props.indicator ?? defaults.indicator

		this.aria.add('role', 'tree')
		this.dataset.add('guides', this._guides)
	}

	get loadChildren(): TTreeLoadChildren | undefined {
		return this._loadChildren
	}

	set loadChildren(value: TTreeLoadChildren | undefined) {
		const oldValue = this._loadChildren

		if (value === oldValue) return

		this._loadChildren = value
		this.events.emit('change:loadChildren', { oldValue, newValue: value })
	}

	get guides(): boolean {
		return this._guides
	}

	set guides(value: boolean) {
		const oldValue = this._guides

		if (value === oldValue) return

		this._guides = value
		this.dataset.add('guides', value)
		this.events.emit('change:guides', { oldValue, newValue: value })
	}

	get indicator(): TListIndicator {
		return this._indicator
	}

	set indicator(value: TListIndicator) {
		const oldValue = this._indicator
		if (value === oldValue) return
		this._indicator = value
		this.events.emit('change:indicator', { oldValue, newValue: value })
	}

	override getProps(): ITreeProps {
		return {
			...super.getProps(),
			loadChildren: this.loadChildren,
			guides: this.guides,
			indicator: this.indicator,
		}
	}
}
