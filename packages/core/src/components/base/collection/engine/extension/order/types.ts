import type { IExtension, IExtensionItems } from '../types'
import type { IOrderItemExtension } from './item/types'

export type TOrderEvents = {
	'change:order': () => void
}

/** Контракт расширения порядка. Реализуется TOrderExtension. */
export interface IOrderExtension<TItem extends object = any>
	extends IExtension<TItem, TOrderEvents>, IExtensionItems<TItem, IOrderItemExtension<TItem>> {
	/**
	 * Returns the item's current index in the raw storage, -1 when it is absent.
	 * Positions are memoized for one storage revision.
	 */
	getItemOrder(item: TItem): number

	/** @inheritdoc IExtensionItems.createItem */
	createItem(owner: TItem): IOrderItemExtension<TItem>
}
