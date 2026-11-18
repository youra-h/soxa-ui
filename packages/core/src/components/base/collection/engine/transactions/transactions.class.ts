import { TCollectionTransaction } from './transaction.class'
import type {
	ICollectionTransaction,
	ICollectionTransactionOptions,
	ICollectionTransactions,
	TPendingTransaction,
} from './types'

/**
 * Driver-owned pending operations. Storage stays on its normal command path;
 * rollback releases an attempt through the callback supplied by its creator.
 */
export class TCollectionTransactions<TItem> implements ICollectionTransactions<TItem> {
	private readonly _pending = new Map<TCollectionTransaction<TItem>, TPendingTransaction<TItem>>()
	private _timer: ReturnType<typeof setTimeout> | undefined
	private _deadline = Infinity
	private _sweeping = 0

	public begin(item: TItem, options: ICollectionTransactionOptions): ICollectionTransaction {
		const { owner, timeout, rollback } = options

		if (!Number.isFinite(timeout) || timeout < 0) {
			throw new Error('Collection transaction timeout must be finite and non-negative')
		}

		const transaction = new TCollectionTransaction(this)
		const deadline = Date.now() + timeout

		this._pending.set(transaction, { item, owner, deadline, rollback })

		this._schedule(deadline)

		return transaction
	}

	public commit(transaction: TCollectionTransaction<TItem>): void {
		this._take(transaction)
	}

	public cancel(transaction: TCollectionTransaction<TItem>): void {
		this._take(transaction)
	}

	public rollback(transaction: TCollectionTransaction<TItem>): void {
		// Forget first: cleanup may cancel this receipt or release another owner.
		const pending = this._take(transaction)

		pending?.rollback()
	}

	/** Release only this owner's unconfirmed attempts, including reentrant cleanup. */
	public rollbackOwner(owner: object): void {
		this._sweeping++

		try {
			for (const [transaction, pending] of [...this._pending]) {
				if (pending.owner === owner) {
					this.rollback(transaction)
				}
			}
		} finally {
			this._sweeping--
			this._schedule()
		}
	}

	/** Remove ownership before running callbacks; a completed receipt must retain nothing. */
	private _take(
		transaction: TCollectionTransaction<TItem>,
	): TPendingTransaction<TItem> | undefined {
		const pending = this._pending.get(transaction)

		this._pending.delete(transaction)
		transaction.release()

		this._schedule()

		return pending
	}

	/** Keep one timer; a newly added earlier deadline may bring the next sweep forward. */
	private _schedule(earlier = Infinity): void {
		if (this._sweeping) return

		if (!this._pending.size) {
			if (this._timer !== undefined) {
				clearTimeout(this._timer)
			}

			this._timer = undefined

			return
		}

		if (this._timer !== undefined) {
			if (earlier >= this._deadline) return

			clearTimeout(this._timer)
		}

		let deadline = Infinity

		for (const pending of this._pending.values()) {
			deadline = Math.min(deadline, pending.deadline)
		}

		this._deadline = deadline
		// A request-owned engine must remain collectible before expiry. The driver,
		// rather than the timer queue, owns its registry and pending attempts.
		this._timer = setTimeout(
			TCollectionTransactions._expirePending,
			Math.max(0, deadline - Date.now()),
			new WeakRef(this),
		)

		// Browsers return a number. Only Node's handle supports unref().
		const timer: unknown = this._timer

		if (
			timer !== null &&
			typeof timer === 'object' &&
			'unref' in timer &&
			typeof timer.unref === 'function'
		) {
			timer.unref()
		}
	}

	private static _expirePending<TItem>(registry: WeakRef<TCollectionTransactions<TItem>>): void {
		registry.deref()?._expire()
	}

	private readonly _expire = (): void => {
		this._timer = undefined
		this._sweeping++

		const now = Date.now()

		try {
			for (const [transaction, pending] of [...this._pending]) {
				if (pending.deadline <= now) {
					this.rollback(transaction)
				}
			}
		} finally {
			this._sweeping--
			this._schedule()
		}
	}
}
