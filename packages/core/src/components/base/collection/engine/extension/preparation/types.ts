import type { TNoEvents } from '../../../../../../common'
import type { ICollectionTransaction, ICollectionTransactionOptions } from '../../transactions'
import type { IExtension } from '../types'

/**
 * Pending acceptance of a prepared assembly is opt-in: the adapter that may
 * discard an assembly (React) installs it on the prepared engine.
 */
export interface IPreparationExtension<TItem extends object> extends IExtension<TItem, TNoEvents> {
	/** Track one assembly until its framework accepts it or the deadline rolls it back. */
	prepare(options: ICollectionTransactionOptions): ICollectionTransaction
}
