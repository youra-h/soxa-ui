/**
 * Pending acceptance of one assembly, released by confirmation or rollback.
 */
export interface ICollectionTransaction {
	/** Confirm the operation and release its rollback resources. */
	commit(): void

	/** Forget the operation before releasing everything acquired by its attempt. */
	rollback(): void

	/** Forget an operation whose resources are already being released by their owner. */
	cancel(): void
}

export interface ICollectionTransactionOptions {
	/** Time allowed for confirmation, in milliseconds. */
	timeout: number

	/** Release the attempt's resources through their existing ownership rules. */
	rollback(): void
}

export interface ICollectionTransactions {
	begin(options: ICollectionTransactionOptions): ICollectionTransaction
}

export type TPendingTransaction = {
	deadline: number
	rollback: () => void
}
