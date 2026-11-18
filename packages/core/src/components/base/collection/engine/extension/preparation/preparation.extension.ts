import type { TNoEvents } from '../../../../../../common'
import type { ICollectionTransaction, ICollectionTransactions } from '../../transactions'
import { TBaseExtension } from '../base-extension.class'
import type { IPreparationExtension, IPreparationOptions } from './types'

/**
 * Collection policy for initial preparation. The driver owns pending item
 * references, expiry and rollback; this extension decides when initialization is allowed.
 */
export class TPreparationExtension<TItem extends object>
	extends TBaseExtension<TItem, TNoEvents>
	implements IPreparationExtension<TItem>
{
	public readonly name = 'preparation' as const

	private readonly _owners = new Set<object>()

	public accept(owner: object): void {
		this._owners.add(owner)
	}

	public release(owner: object): void {
		this._owners.delete(owner)

		this._transactions.rollbackOwner(owner)
	}

	/** Initialize once, keeping the same item for commit and full cleanup for rollback. */
	public prepare(item: TItem, options: IPreparationOptions): ICollectionTransaction {
		const transaction = this._transactions.begin(item, options)

		try {
			if (!this._owners.size) {
				options.initialize?.()
			}
		} catch (error) {
			transaction.rollback()

			throw error
		}

		return transaction
	}

	private get _transactions(): ICollectionTransactions<TItem> {
		const transactions = this._ctx.driver.transactions

		if (!transactions) {
			throw new Error('Collection preparation requires transaction support in the driver')
		}

		return transactions
	}
}
