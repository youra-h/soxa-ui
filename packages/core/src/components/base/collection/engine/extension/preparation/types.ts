import type { TNoEvents } from '../../../../../../common'
import type { ICollectionTransaction, ICollectionTransactionOptions } from '../../transactions'
import type { IExtension } from '../types'

export interface IPreparationOptions extends ICollectionTransactionOptions {
	/** Prepared data already exists; tracking its mount needs no membership mutation. */
	initialize?(): void
}

/**
 * Initial membership preparation is opt-in. Once an owner is accepted, new
 * attempts wait for ordinary acceptance instead of mutating a live collection.
 */
export interface IPreparationExtension<TItem extends object> extends IExtension<TItem, TNoEvents> {
	accept(owner: object): void

	release(owner: object): void

	prepare(item: TItem, options: IPreparationOptions): ICollectionTransaction
}
