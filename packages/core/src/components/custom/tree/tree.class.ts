import type { IValueControlProps, TValueControlEvents } from '../../base/value-control'
import { TValueControl } from '../../base/value-control'
import type { TSelectionMode, TSelectionValue } from '../../base/collection'
import type { TValuePayload } from '../../../common'
import type { TTreeCollectionFacadeEngine } from './collection/factory'
import type { ITreeNode, TTreeKey, TTreeLoadChildren } from './types'

export interface ITreeProps extends IValueControlProps<TSelectionValue> {
	items?: readonly ITreeNode[]
	expanded?: readonly TTreeKey[]
	mode?: TSelectionMode
	engine?: TTreeCollectionFacadeEngine
	loadChildren?: TTreeLoadChildren
	guides?: boolean
}

export type TTreeEvents = TValueControlEvents<TSelectionValue> & {
	'change:loadChildren': (payload: TValuePayload<TTreeLoadChildren | undefined>) => void
	'change:guides': (payload: TValuePayload<boolean>) => void
}

export class TTree extends TValueControl<TSelectionValue, ITreeProps, TTreeEvents> {
	static override baseClass = 'so-tree'
	static override defaultValues = {
		...TValueControl.defaultValues,
		tag: 'div',
		guides: false,
		loadChildren: undefined,
	}

	private _loadChildren: TTreeLoadChildren | undefined
	private _guides: boolean

	constructor(props: ITreeProps = {}) {
		super(props)

		const defaults = (new.target as typeof TTree).defaultValues
		this._loadChildren = props.loadChildren ?? defaults.loadChildren
		this._guides = props.guides ?? defaults.guides

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

	override getProps(): ITreeProps {
		return { ...super.getProps(), loadChildren: this.loadChildren, guides: this.guides }
	}
}
