/**
 * Connects an opted-in collection owner to the engine's preparation lifecycle.
 */
import { preparationOf, TPreparationExtension } from '@soxa-ui/core'
import type { ICollectionTransaction, IPreparationExtension } from '@soxa-ui/core'
import type { TInstanceContext } from '../../../protected/adapter/context'
import { COLLECTION_PREPARATION_ELEVATOR } from './keys'
import type { ICollectionPreparationOptions, TCollectionOwner } from './types'

export class TCollectionPreparationExtension {
	public readonly engine: TCollectionOwner['engine']

	private readonly _preparation: IPreparationExtension<object>
	private readonly _timeout: number
	private _closed = false

	constructor(
		private readonly _context: TInstanceContext<TCollectionOwner>,
		options: ICollectionPreparationOptions,
	) {
		this.engine = _context.instance.engine
		this._timeout = options.timeout ?? 1_000

		const preparation = preparationOf<object>(this.engine)

		if (preparation) {
			this._preparation = preparation
		} else {
			const extension = new TPreparationExtension<object>()

			this.engine.use(extension)
			this._preparation = extension
		}

		options.elevator(COLLECTION_PREPARATION_ELEVATOR).down(this)

		_context.events.on('attach', () => {
			this._preparation.accept(_context)
		})

		_context.events.on('destroy', () => {
			this._closed = true

			this._preparation.release(_context)
		})
	}

	public get closed(): boolean {
		return this._closed
	}

	/** Supply the engine with initialization and full teardown for this mount attempt. */
	public prepare(
		item: object,
		initialize: () => void,
		rollback: () => void,
	): ICollectionTransaction {
		if (this._closed) {
			throw new Error('Cannot prepare an item for a destroyed collection owner')
		}

		return this._preparation.prepare(item, {
			owner: this._context,
			timeout: this._timeout,
			initialize,
			rollback,
		})
	}
}
