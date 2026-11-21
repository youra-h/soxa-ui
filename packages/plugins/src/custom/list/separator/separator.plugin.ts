import { batchOf } from '@soxa-ui/core'
import type { IComponentView, TCollectionEngine } from '@soxa-ui/core'
import { TBasePlugin } from '../../../base'
import type { IPluginContext } from '../../../base'
import { TElementPlugin } from '../../element'

// Node identity keeps the rule independent of a theme's classes.
const separators = new WeakSet<Element>()

function contentShown(node: Element): boolean {
	return !node.hasAttribute('hidden') && getComputedStyle(node).display !== 'none'
}

/** A manual list line is useful only between two remaining sections. */
export class TListSeparatorPlugin extends TBasePlugin {
	private _node: Element | null = null
	private _owner: IComponentView | null = null
	private _frame: number | null = null
	private _shown = true

	override install(ctx: IPluginContext): void {
		super.install(ctx)
		this._owner = ctx.getInstance<IComponentView>()

		const element = ctx.get(TElementPlugin)

		element?.events.on('ready', (node) => {
			this._node = node
			separators.add(node)
			this._schedule()
		})
		element?.events.on('removed', () => this._remove())
	}

	/** The shared adapter extension supplies the nearest accepted collection. */
	bindCollection(engine: TCollectionEngine<any, any>): void {
		this._listenTo(batchOf<object>(engine)?.events, 'change:shown', () => this._schedule())
		this._schedule()
	}

	override destroy(): void {
		this._remove()
		this._owner = null
		super.destroy()
	}

	private _remove(): void {
		if (this._node) separators.delete(this._node)
		if (this._frame !== null) cancelAnimationFrame(this._frame)

		this._frame = null
		this._node = null
	}

	private _schedule(): void {
		// Collection events also arrive during server assembly and disposal.
		if (!this._node || this._frame !== null) return

		this._frame = requestAnimationFrame(() => {
			this._frame = null
			this._sync()
		})
	}

	private _sync(): void {
		const node = this._node
		const owner = this._owner

		if (!node || !owner) return

		// A previous separator is a boundary even when hidden. The forward scan
		// crosses separators to retain exactly one line before surviving content.
		let before = node.previousElementSibling

		while (before && !separators.has(before) && !contentShown(before)) {
			before = before.previousElementSibling
		}

		let after = node.nextElementSibling

		while (after && (separators.has(after) || !contentShown(after))) {
			after = after.nextElementSibling
		}

		const shown = before !== null && !separators.has(before) && after !== null

		// Preserve the consumer's visible input until the structural state changes.
		if (shown === this._shown) return

		this._shown = shown
		owner.visible = shown
	}
}
