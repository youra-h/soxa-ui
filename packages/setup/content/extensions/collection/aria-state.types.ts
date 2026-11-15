/**
 * Read-only state ports used to derive one mount's ARIA without writing its data model.
 */
import type { TStateStore } from '../../../protected/adapter/exchange'

export type TCollectionStatePort = Pick<TStateStore, 'getSnapshot' | 'subscribe'>

export interface ICollectionAriaLink {
	getSnapshot(): Readonly<Record<string, unknown>>
	subscribe(listener: () => void): () => void
}

export interface ICollectionAriaStateOptions {
	readonly state: TCollectionStatePort
	readonly link: ICollectionAriaLink
}
