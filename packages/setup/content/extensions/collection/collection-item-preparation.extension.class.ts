/**
 * Confirms an item's engine transaction on attach and releases it on teardown.
 */
import type { ICollectionTransaction } from '@soxa-ui/core'
import type { TInstanceContext } from '../../../protected/adapter/context'
import { ITEM_CONTEXT_ELEVATOR } from '../../../protected/adapter/elevator/keys'
import { COLLECTION_PREPARATION_ELEVATOR } from './keys'
import { TCollectionItemExtension } from './collection-item.extension.class'
import type { TCollectionPreparationExtension } from './collection-preparation.extension.class'
import type { ICollectionItemExtensionOptions, TCollectionItemFacade } from './types'

export class TCollectionItemPreparationExtension {
	private _preparation: TCollectionPreparationExtension | undefined
	private _item: TCollectionItemExtension | undefined
	private _model: object | undefined
	private _transaction: ICollectionTransaction | undefined

	constructor(
		context: TInstanceContext<TCollectionItemFacade>,
		options: ICollectionItemExtensionOptions,
	) {
		const preparation = options.elevator(COLLECTION_PREPARATION_ELEVATOR).up()
		const engine = options.elevator(ITEM_CONTEXT_ELEVATOR).up()

		if (!preparation || preparation.closed || preparation.engine !== engine) return

		const item = context.get(TCollectionItemExtension)

		if (!item) {
			throw new Error('Collection item preparation requires the ordinary item extension')
		}

		this._preparation = preparation
		this._item = item
		this._model = options.adapter.instance

		// Ordinary attach runs first and installs the live subscriptions.
		context.events.on('attach', () => {
			this._transaction?.commit()
			this._transaction = undefined
		})

		context.events.on('destroy', () => {
			// The assembly is already being destroyed; forget its pending receipt.
			this._transaction?.cancel()
			this._transaction = undefined

			this._preparation = undefined
			this._item = undefined
			this._model = undefined
		})
	}

	/** The adapter supplies teardown for the whole assembly, including its own context. */
	public bindLifetime(destroy: () => void): void {
		if (!this._preparation || !this._item || !this._model || this._transaction) return

		const item = this._item

		this._transaction = this._preparation.prepare(this._model, () => item.prepare(), destroy)
	}
}
