/**
 * Enables initial collection preparation only for owners that explicitly install it.
 */
import type { TInstanceContext } from '../../../protected/adapter/context'
import type { TCollectionOwner } from './types'
import { COLLECTION_PREPARATION_ELEVATOR } from './keys'
import { preparationState } from './preparation-state.class'
import type { TCollectionPreparationState } from './preparation-state.class'
import type { ICollectionPreparationOptions, ICollectionPreparationRegistration } from './types'

/** Opt-in initial preparation. This does not accept components or replace attach. */
export class TCollectionPreparationExtension {
	readonly engine: TCollectionOwner['engine']
	private readonly _state: TCollectionPreparationState
	private _closed = false
	private readonly _timeout: number

	constructor(
		private readonly _context: TInstanceContext<TCollectionOwner>,
		options: ICollectionPreparationOptions,
	) {
		const timeout = options.timeout ?? 1_000
		if (!Number.isFinite(timeout) || timeout < 0)
			throw new Error('Collection preparation timeout must be finite and non-negative')
		this._timeout = timeout
		this.engine = _context.instance.engine
		this._state = preparationState(this.engine)
		options.elevator(COLLECTION_PREPARATION_ELEVATOR).down(this)
		_context.events.on('attach', () => this._state.accept(_context))
		_context.events.on('destroy', () => {
			this._closed = true
			this._state.release(_context)
		})
	}

	get closed(): boolean {
		return this._closed
	}

	prepare(initialize: () => void, destroy: () => void): ICollectionPreparationRegistration {
		if (this._closed) throw new Error('Cannot prepare an item for a destroyed collection owner')
		return this._state.prepare(this._context, this._timeout, initialize, destroy)
	}
}
