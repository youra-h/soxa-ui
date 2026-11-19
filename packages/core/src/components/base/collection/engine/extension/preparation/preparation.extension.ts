import type { TNoEvents } from '../../../../../../common'
import type { ICollectionTransaction, ICollectionTransactions } from '../../transactions'
import { TBaseExtension } from '../base-extension.class'
import type { IPreparationExtension } from './types'
import type { ICollectionTransactionOptions } from '../../transactions'

/**
 * The collection's gateway to the driver's pending attempts for prepared
 * assemblies: only an extension reaches the driver. The driver owns the
 * attempts, their expiry and rollback.
 */
export class TPreparationExtension<TItem extends object>
	extends TBaseExtension<TItem, TNoEvents>
	implements IPreparationExtension<TItem>
{
	public readonly name = 'preparation' as const

	public prepare(options: ICollectionTransactionOptions): ICollectionTransaction {
		return this._transactions.begin(options)
	}

	private get _transactions(): ICollectionTransactions {
		const transactions = this._ctx.driver.transactions

		if (!transactions) {
			throw new Error('Collection preparation requires transaction support in the driver')
		}

		return transactions
	}
}
