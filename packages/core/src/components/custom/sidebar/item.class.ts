import type { TDefaultValues } from '../../base/component'
import { TTextable } from '../../base/textable'
import type { ISidebarItem, ISidebarItemProps, TSidebarItemEvents } from './types'

export class TSidebarItem
	extends TTextable<ISidebarItemProps, TSidebarItemEvents>
	implements ISidebarItem
{
	static override baseClass = 'so-sidebar-item'

	static defaultValues: typeof TTextable.defaultValues &
		TDefaultValues<ISidebarItemProps, never, 'href'> = {
		...TTextable.defaultValues,
		tag: 'button',
		href: undefined,
	}

	private _href: string | undefined

	constructor(props: Partial<ISidebarItemProps> = {}) {
		super(props)

		this._href = props.href ?? (new.target as typeof TSidebarItem).defaultValues.href
		this._syncTag()
	}

	get href(): string | undefined {
		return this._href
	}

	set href(value: string | undefined) {
		const oldValue = this._href
		if (oldValue === value) return

		const oldTag = this.tag
		this._href = value
		this._syncTag()
		if (oldTag !== this.tag)
			this.events.emit('change:tag', { oldValue: oldTag, newValue: this.tag })
		this.events.emit('change:href', { oldValue, newValue: value })
	}

	override get tag(): string | object {
		return super.tag === 'button' && this._href !== undefined ? 'a' : super.tag
	}

	override set tag(value: string | object) {
		super.tag = value
	}

	protected override _syncTag(): void {
		super._syncTag()
		this.attrs.add('type', this.tag === 'button' ? 'button' : null)
	}

	protected override _syncDisabled(): void {
		super._syncDisabled()
		this.attrs.add('href', this.disabled ? null : (this.href ?? null))
		this.aria.add('role', this.tag === 'a' && this.disabled ? 'link' : null)
	}

	override getProps(): ISidebarItemProps {
		return { ...super.getProps(), href: this.href }
	}
}
