import type { TCollectionTransactions } from './transactions.class'
import type { ICollectionTransaction } from './types'

/**
 * One attempt's receipt. Finishing it releases its link to the driver registry.
 */
export class TCollectionTransaction<TItem> implements ICollectionTransaction {
	constructor(private _registry: TCollectionTransactions<TItem> | undefined) {}

	public commit(): void {
		this._registry?.commit(this)
	}

	public rollback(): void {
		this._registry?.rollback(this)
	}

	public cancel(): void {
		this._registry?.cancel(this)
	}

	public release(): void {
		this._registry = undefined
	}
}
