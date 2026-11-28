import type { TDefaultValues } from '../../base/component'
import { TComponentView } from '../../base/component-view'
import type {
	ISidebar,
	ISidebarProps,
	TSidebarCollapse,
	TSidebarEvents,
	TSidebarSide,
} from './types'

export class TSidebar extends TComponentView<ISidebarProps, TSidebarEvents> implements ISidebar {
	static override baseClass = 'so-sidebar'

	static defaultValues: typeof TComponentView.defaultValues &
		TDefaultValues<ISidebarProps, 'side' | 'collapse' | 'collapsed'> = {
		...TComponentView.defaultValues,
		tag: 'aside',
		side: 'left',
		collapse: 'icon',
		collapsed: false,
	}

	private _side: TSidebarSide
	private _collapse: TSidebarCollapse
	private _collapsed: boolean

	constructor(props: Partial<ISidebarProps> = {}) {
		super(props)

		const defaults = (new.target as typeof TSidebar).defaultValues
		this._side = props.side ?? defaults.side
		this._collapse = props.collapse ?? defaults.collapse
		this._collapsed = props.collapsed ?? defaults.collapsed
		this.dataset.add('side', this._side)
		this.dataset.add('collapse', this._collapse)
		this.dataset.add('collapsed', this._collapsed ? '' : null)
	}

	get side(): TSidebarSide {
		return this._side
	}

	set side(value: TSidebarSide) {
		const oldValue = this._side
		if (oldValue === value) return

		this._side = value
		this.dataset.add('side', value)
		this.events.emit('change:side', { oldValue, newValue: value })
	}

	get collapse(): TSidebarCollapse {
		return this._collapse
	}

	set collapse(value: TSidebarCollapse) {
		const oldValue = this._collapse
		if (oldValue === value) return

		this._collapse = value
		this.dataset.add('collapse', value)
		this.events.emit('change:collapse', { oldValue, newValue: value })
	}

	get collapsed(): boolean {
		return this._collapsed
	}

	set collapsed(value: boolean) {
		const oldValue = this._collapsed
		if (oldValue === value) return

		this._collapsed = value
		this.dataset.add('collapsed', value ? '' : null)
		this.events.emit('change:collapsed', { oldValue, newValue: value })
	}

	get offcanvasHidden(): boolean {
		return this.collapsed && this.collapse === 'offcanvas'
	}

	toggle(): void {
		this.collapsed = !this.collapsed
	}

	override getProps(): ISidebarProps {
		return {
			...super.getProps(),
			side: this.side,
			collapse: this.collapse,
			collapsed: this.collapsed,
		}
	}
}
