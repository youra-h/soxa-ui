import type { IGuide } from '@soxa-ui/core'
import { TBasePlugin, type IPluginContext, type TPluginEvents } from '../../base'
import { TElementPlugin } from '../element'
import { TAnchorPlugin } from '../frame/anchor'
import type { TAnchorRect } from '../frame/anchor/types'

type TStyles = Record<string, number | string>
type TGuidePositionEvents = TPluginEvents & { 'change:position': () => void }

export class TGuidePositionPlugin extends TBasePlugin<IGuide, TGuidePositionEvents> {
	private _owner: IGuide | null = null
	private _anchor: TAnchorPlugin | undefined
	private _root: Element | null = null
	private _observing: MutationObserver | null = null
	private _spotlight: TStyles | null = null

	get spotlight(): TStyles | null {
		return this._spotlight
	}

	get layer(): TStyles {
		return { 'z-index': this._owner?.zIndex ?? 0 }
	}

	override install(ctx: IPluginContext): void {
		super.install(ctx)

		const owner = ctx.getInstance<IGuide>()
		const anchor = ctx.get(TAnchorPlugin)
		const element = ctx.get(TElementPlugin)
		if (!owner || !anchor || !element) return

		this._owner = owner
		this._anchor = anchor
		this._listenTo(element.events, 'bind', (root) => {
			this._root = root
			this._sync()
		})
		this._listenTo(owner.events, 'change:step', () => this._sync())
		this._listenTo(owner.events, 'change:visible', () => this._sync())
		this._listenTo(owner.events, 'change:zIndex', () => this._publish(anchor.rect))
		this._listenTo(anchor.rectEvents, 'change', ({ newValue }) => this._publish(newValue))
		this._root = element.element
		this._sync()
	}

	override destroy(): void {
		this._observing?.disconnect()
		this._observing = null
		this._root = null
		this._owner = null
		this._anchor = undefined

		super.destroy()
	}

	private _sync(): void {
		this._observing?.disconnect()
		this._observing = null

		const owner = this._owner
		const anchor = this._anchor
		const root = this._root
		if (!owner || !anchor) return

		const step = root && owner.visible ? owner.step : undefined
		const reference = step?.anchor
		anchor.placement = step?.placement ?? 'bottom-start'

		if (root && reference && 'element' in reference) {
			anchor.point = null
			this._resolveElement(reference.element)

			// The target can mount after this step, or be replaced by a route or conditional.
			this._observing = new MutationObserver(() => this._resolveElement(reference.element))
			this._observing.observe(root.ownerDocument, { childList: true, subtree: true })
			return
		}

		anchor.removeAnchor()
		anchor.point = reference && 'point' in reference ? reference.point : null
		if (!anchor.point) this._center()
	}

	private _resolveElement(resolve: () => Element | null): void {
		const anchor = this._anchor
		const target = resolve()

		if (target?.isConnected && target.ownerDocument === this._root?.ownerDocument) {
			if (anchor?.anchor === target) return

			target.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
			anchor?.setAnchor(target)
		} else {
			anchor?.removeAnchor()
			this._center()
		}
	}

	private _center(): void {
		const owner = this._owner
		if (!owner) return

		owner.strategy = 'fixed'
		owner.x = 0
		owner.y = 0
	}

	private _publish(rect: TAnchorRect | null): void {
		const owner = this._owner

		this._spotlight =
			rect && owner?.visible
				? {
						left: `${rect.left}px`,
						top: `${rect.top}px`,
						width: `${rect.width}px`,
						height: `${rect.bottom - rect.top}px`,
						...(rect.width === 0 && rect.bottom === rect.top
							? {
									width: '8px',
									height: '8px',
									'border-radius': '50%',
									translate: '-50% -50%',
								}
							: {}),
					}
				: null
		this.events.emit('change:position')
	}
}
