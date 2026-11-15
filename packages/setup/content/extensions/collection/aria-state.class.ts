/**
 * One standard state read for a mount with a prepared document relationship.
 */
import type { TStateListener, TStateSnapshot } from '../../../protected/adapter/exchange'
import type { ICollectionAriaStateOptions } from './aria-state.types'

function recordOf(value: unknown): Readonly<Record<string, unknown>> {
	return typeof value === 'object' && value !== null
		? Object.fromEntries(Object.entries(value))
		: {}
}

/**
 * The link is read-only mount data, not a second mutable ARIA store. Every consumer
 * still reads one aria snapshot; the core remains authoritative for all other attributes.
 */
export class TCollectionAriaState {
	private _base: TStateSnapshot | undefined
	private _link: Readonly<Record<string, unknown>> | undefined
	private _aria: unknown
	private _snapshot: TStateSnapshot | undefined

	constructor(private readonly _options: ICollectionAriaStateOptions) {}

	getSnapshot(): TStateSnapshot {
		const base = this._options.state.getSnapshot()
		const link = this._options.link.getSnapshot()

		if (this._snapshot && this._base === base && this._link === link) return this._snapshot

		if (!this._snapshot || this._base?.aria !== base.aria || this._link !== link) {
			this._aria = Object.freeze({ ...recordOf(base.aria), ...link })
		}

		this._base = base
		this._link = link
		this._snapshot = Object.freeze({ ...base, aria: this._aria })

		return this._snapshot
	}

	subscribe(listener: TStateListener): () => void {
		const releaseLink = this._options.link.subscribe(() => {
			listener('aria', this.getSnapshot().aria)
		})
		const releaseState = this._options.state.subscribe((name, value) => {
			listener(name, name === 'aria' ? this.getSnapshot().aria : value)
		})

		return () => {
			releaseState()
			releaseLink()
		}
	}
}
