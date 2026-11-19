import type { TOrderExtension } from '../order.extension'
import type { IOrderItemExtension, TOrderItemEventsExtension } from './types'
import { TBaseItemExtension } from '../../base-item-extension.class'

/**
 * TOrderItemExtension — item delegate for the item's order.
 *
 * It reads the order from the parent TOrderExtension and keeps only the last
 * number it gave out: on the parent's `change:order` the item's own
 * `change:order` sounds only when its position moved. Appending an item moves
 * no one else, and a relay to every item made a mount of N items N² updates.
 * The parent is followed only while the adapter is listened to (`follow`): an
 * adapter over an external engine leaves nothing on it, and whoever starts
 * listening reads the current `order` first.
 *
 * @template TItem — the item type (a user may extend it)
 */
export class TOrderItemExtension<TItem extends object = any>
	extends TBaseItemExtension<TItem, TOrderExtension<TItem>, TOrderItemEventsExtension>
	implements IOrderItemExtension<TItem>
{
	private _order: number

	constructor(item: TItem, parent: TOrderExtension<TItem>) {
		super(item, parent)

		this._order = parent.getItemOrder(item)

		this.events.follow(parent.events, 'change:order', () => this._sync())
	}

	/** The item's current index in its collection. */
	get order(): number {
		return (this._order = this._parent.getItemOrder(this._item))
	}

	private _sync(): void {
		const order = this._parent.getItemOrder(this._item)

		if (order === this._order) return

		this._order = order
		this.events.emit('change:order')
	}
}
