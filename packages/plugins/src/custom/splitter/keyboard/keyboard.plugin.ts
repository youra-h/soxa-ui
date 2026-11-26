import type { ISplitter } from '@soxa-ui/core'
import { TBasePlugin, type IPluginContext } from '../../../base'
import type { IDomEventTarget } from '../../../utils'
import { TElementPlugin } from '../../element'
import { slideKeyAction } from '../../slide/keys'
import { handleOf } from '../handle'

const CROSS_AXIS_KEYS = {
	horizontal: ['ArrowUp', 'ArrowDown'],
	vertical: ['ArrowLeft', 'ArrowRight'],
}

export class TSplitterKeyboardPlugin extends TBasePlugin<ISplitter> {
	private _owner: ISplitter | null = null
	private _root: Element | null = null

	override install(ctx: IPluginContext): void {
		super.install(ctx)

		this._owner = ctx.getInstance<ISplitter>()
		const element = ctx.get(TElementPlugin)

		element?.events.on('ready', (node) => this._attach(node))
		element?.events.on('removed', () => this._detach())
	}

	override destroy(): void {
		this._detach()
		this._owner = null

		super.destroy()
	}

	private _attach(root: Element): void {
		this._detach()
		this._root = root

		const target: IDomEventTarget = root
		target.addEventListener('keydown', this._onKeyDown)
	}

	private _detach(): void {
		const target: IDomEventTarget | null = this._root
		target?.removeEventListener('keydown', this._onKeyDown)
		this._root = null
	}

	private readonly _onKeyDown = (event: KeyboardEvent): void => {
		const owner = this._owner
		const root = this._root

		if (!owner || !root || owner.disabled || event.altKey || event.ctrlKey || event.metaKey)
			return

		const handle = handleOf(owner, root, event.target)

		if (!handle || event.target !== handle.element) return
		if (CROSS_AXIS_KEYS[owner.orientation].includes(event.key)) return

		const action =
			event.key === 'Enter'
				? (index: number) => owner.activate(index)
				: slideKeyAction(owner, root, event)

		if (!action) return

		event.preventDefault()
		action(handle.index)
	}
}
