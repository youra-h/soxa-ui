import type { IItemExtension, TBaseItemEventsExtension } from '../../types'

/** Events of the order item adapter. */
export type TOrderItemEventsExtension = TBaseItemEventsExtension & {
	'change:order': () => void
}

/**
 * Contract of the order item adapter: the item's index in its collection.
 */
export interface IOrderItemExtension<TItem extends object = any> extends IItemExtension<
	TItem,
	TOrderItemEventsExtension
> {
	/** The item's index, read from the order extension on every access. */
	readonly order: number
}
