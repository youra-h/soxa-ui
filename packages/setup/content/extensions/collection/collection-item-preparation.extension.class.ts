/**
 * Owns an opt-in item's unaccepted assembly until attach or expiry.
 */
import type { TInstanceContext } from '../../../protected/adapter/context'
import { ITEM_CONTEXT_ELEVATOR } from '../../../protected/adapter/elevator/keys'
import { COLLECTION_PREPARATION_ELEVATOR } from './keys'
import { TCollectionItemExtension } from './collection-item.extension.class'
import type { TCollectionPreparationExtension } from './collection-preparation.extension.class'
import type { ICollectionPreparationRegistration } from './types'
import type { ICollectionItemExtensionOptions, TCollectionItemFacade } from './types'

/** A pending mount, enabled only below an owner that explicitly opted into preparation. */
export class TCollectionItemPreparationExtension {
	private _preparation: TCollectionPreparationExtension | undefined
	private _item: TCollectionItemExtension | undefined
	private _registration: ICollectionPreparationRegistration | undefined

	constructor(
		context: TInstanceContext<TCollectionItemFacade>,
		options: ICollectionItemExtensionOptions,
	) {
		const preparation = options.elevator(COLLECTION_PREPARATION_ELEVATOR).up()
		const engine = options.elevator(ITEM_CONTEXT_ELEVATOR).up()
		if (!preparation || preparation.closed || preparation.engine !== engine) return
		this._preparation = preparation
		this._item = context.get(TCollectionItemExtension)
		if (!this._item)
			throw new Error('Collection item preparation requires the ordinary item extension')
		// Ordinary attach is installed first: it supplies the live subscriptions and any deferred entry.
		context.events.on('attach', () => {
			this._registration?.commit()
			this._registration = undefined
		})
		context.events.on('destroy', () => {
			this._registration?.cancel()
			this._registration = undefined
			this._preparation = undefined
			this._item = undefined
		})
	}

	/** The adapter supplies teardown for the whole assembly, not only the item facade. */
	bindLifetime(destroy: () => void): void {
		if (!this._preparation || !this._item || this._registration) return
		const item = this._item
		this._registration = this._preparation.prepare(() => item.prepare(), destroy)
	}
}
