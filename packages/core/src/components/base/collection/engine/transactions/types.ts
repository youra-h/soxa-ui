/**
 * Pending collection operations keep one item reference until confirmation or rollback.
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
	/** An opaque owner token; releasing it must not affect another owner's attempts. */
	owner: object

	/** Time allowed for confirmation, in milliseconds. */
	timeout: number

	/** Release the attempt's resources through their existing ownership rules. */
	rollback(): void
}

export interface ICollectionTransactions<TItem> {
	begin(item: TItem, options: ICollectionTransactionOptions): ICollectionTransaction

	rollbackOwner(owner: object): void
}

export type TPendingTransaction<TItem> = {
	item: TItem
	owner: object
	deadline: number
	rollback: () => void
}
