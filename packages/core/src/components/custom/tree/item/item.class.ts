import { TValueControl } from '../../../base/value-control'
import type { TTreeKey } from '../types'
import type { ITreeItemPlacement, ITreeItemProps, TTreeItemEvents } from './types'

/** A collection node whose identity survives collapsing, reordering, and Virtual unmounts. */
export class TTreeItem extends TValueControl<TTreeKey, ITreeItemProps, TTreeItemEvents> {
	static override baseClass = 'so-tree-item'
	static override defaultValues = {
		...TValueControl.defaultValues,
		tag: 'div',
		value: '',
		text: '',
		href: undefined,
		hasChildren: false,
		parentValue: null,
		siblingOrder: 0,
	}

	private _text: string
	private _href: string | undefined

	hasChildren: boolean
	parentValue: TTreeKey | null
	siblingOrder: number

	constructor(props: ITreeItemProps & ITreeItemPlacement = {}) {
		super(props)

		const defaults = (new.target as typeof TTreeItem).defaultValues
		this._text = props.text ?? defaults.text
		this._href = props.href ?? defaults.href
		this.hasChildren = props.hasChildren ?? defaults.hasChildren
		this.parentValue = props.parentValue ?? defaults.parentValue
		this.siblingOrder = props.siblingOrder ?? defaults.siblingOrder

		this.aria.add('role', 'treeitem')
	}

	get text(): string {
		return this._text
	}

	set text(value: string) {
		const oldValue = this._text

		if (value === oldValue) return

		this._text = value
		this.events.emit('change:text', { oldValue, newValue: value })
	}

	get href(): string | undefined {
		return this._href
	}

	set href(value: string | undefined) {
		const oldValue = this._href

		if (value === oldValue) return

		this._href = value
		this.events.emit('change:href', { oldValue, newValue: value })
	}

	override getProps(): ITreeItemProps {
		return {
			...super.getProps(),
			text: this.text,
			href: this.href,
		}
	}
}
