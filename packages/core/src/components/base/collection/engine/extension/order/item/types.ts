import type { IItemExtension, TBaseItemEventsExtension } from '../../types'

/** События item-адаптера порядка. */
export type TOrderItemEventsExtension = TBaseItemEventsExtension & {
	'change:order': () => void
}

/**
 * Контракт item-адаптера порядка.
 * Предоставляет readonly order — индекс элемента в коллекции.
 */
export interface IOrderItemExtension<TItem extends object = any> extends IItemExtension<
	TItem,
	TOrderItemEventsExtension
> {
	/** Порядковый номер элемента. Вычисляется на лету у расширения порядка. */
	readonly order: number

	/** Called by the owner after an order change: emits `change:order` only if this position moved. */
	sync(): void
}
