import type { ISplitter } from '@soxa-ui/core'
import { TBasePlugin, type IPluginContext } from '../../../base'
import type { IDomEventTarget } from '../../../utils'
import { TPointerGesture } from '../../../utils/pointer-gesture'
import { TElementPlugin } from '../../element'
import { lengthAlong, offsetAlong, slideDirection } from '../../slide/direction'
import type { TSlideDirection } from '../../slide/types'
import { handleOf } from '../handle'
import type { TSplitterDrag } from './types'

function panelLength(owner: ISplitter, root: Element, direction: TSlideDirection): number {
	const panelClass = owner.classes.resolve('__panel')
	let length = 0

	for (const child of root.children) {
		if (child.classList.contains(panelClass)) {
			length += lengthAlong(direction, child.getBoundingClientRect())
		}
	}

	return length
}

export class TSplitterPointerPlugin extends TBasePlugin<ISplitter> {
	private _owner: ISplitter | null = null
	private _root: Element | null = null
	private _drag: TSplitterDrag | null = null
	private readonly _pointer = new TPointerGesture()

	override install(ctx: IPluginContext): void {
		super.install(ctx)

		this._owner = ctx.getInstance<ISplitter>()
		const element = ctx.get(TElementPlugin)

		element?.events.on('ready', (node) => this._attach(node))
		element?.events.on('removed', () => this._detach())
		this._listenTo(this._owner?.events, 'change:activeThumb', ({ newValue }) => {
			if (newValue !== undefined || !this._drag) return

			this._drag = null
			this._pointer.finish()
		})
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
		target.addEventListener('pointerdown', this._onPointerDown)
		target.addEventListener('pointermove', this._onPointerMove)
		target.addEventListener('pointerup', this._onPointerUp)
		target.addEventListener('pointercancel', this._onPointerUp)
		target.addEventListener('lostpointercapture', this._onPointerUp)
		target.addEventListener('click', this._onClick)
	}

	private _detach(): void {
		this._pointer.finish()
		this._end()

		const target: IDomEventTarget | null = this._root
		target?.removeEventListener('pointerdown', this._onPointerDown)
		target?.removeEventListener('pointermove', this._onPointerMove)
		target?.removeEventListener('pointerup', this._onPointerUp)
		target?.removeEventListener('pointercancel', this._onPointerUp)
		target?.removeEventListener('lostpointercapture', this._onPointerUp)
		target?.removeEventListener('click', this._onClick)
		this._root = null
	}

	private readonly _onPointerDown = (event: PointerEvent): void => {
		const owner = this._owner
		const root = this._root

		if (!owner || !root || owner.disabled || !this._pointer.canStart(event)) return

		const handle = handleOf(owner, root, event.target)

		if (!handle) return

		const direction = slideDirection(owner, root)
		const box = root.getBoundingClientRect()
		// Measure the panels once. The gaps are outside the percentage layout.
		const length = panelLength(owner, root, direction)

		if (length <= 0) return

		const fraction = offsetAlong(direction, box, event) / length

		if (!owner.grab(handle.index, fraction) || owner.activeThumb !== handle.index) return

		this._drag = { direction, box, length }
		this._pointer.start(root, event)
		handle.element.focus({ preventScroll: true, focusVisible: false })
	}

	private readonly _onPointerMove = (event: PointerEvent): void => {
		const drag = this._drag

		if (!drag || !this._pointer.owns(event)) return

		this._owner?.drag(offsetAlong(drag.direction, drag.box, event) / drag.length)
	}

	private readonly _onPointerUp = (event: PointerEvent): void => {
		if (this._pointer.finish(event)) this._end()
	}

	private readonly _onClick = (event: MouseEvent): void => {
		this._pointer.preventTrailingClick(event)
	}

	private _end(): void {
		if (!this._drag) return

		this._drag = null
		this._owner?.release()
	}
}
