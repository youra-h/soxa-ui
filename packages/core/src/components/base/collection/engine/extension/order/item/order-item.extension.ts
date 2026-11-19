import type { TOrderExtension } from '../order.extension'
import type { IOrderItemExtension, TOrderItemEventsExtension } from './types'
import { TBaseItemExtension } from '../../base-item-extension.class'

/**
 * TOrderItemExtension — item delegate for the item's order.
 *
 * It reads the order from the parent TOrderExtension and keeps only the last
 * number it gave out, so the item's `change:order` sounds only when its own
 * position moved.
 *
 * @template TItem — тип элемента (пользователь может расширить)
 */
export class TOrderItemExtension<TItem extends object = any>
	extends TBaseItemExtension<TItem, TOrderExtension<TItem>, TOrderItemEventsExtension>
	implements IOrderItemExtension<TItem>
{
	private _order: number

	constructor(item: TItem, parent: TOrderExtension<TItem>) {
		super(item, parent)

		this._order = parent.getItemOrder(item)
	}

	/** The item's current index in its collection. */
	get order(): number {
		return (this._order = this._parent.getItemOrder(this._item))
	}

	/** @inheritdoc IOrderItemExtension.sync */
	sync(): void {
		const order = this._parent.getItemOrder(this._item)

		if (order === this._order) return

		this._order = order
		this.events.emit('change:order')
	}
}
