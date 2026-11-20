/**
 * The read side of an exchange state that a prepared mount's view wraps.
 */
import type { TStateStore } from '../../../protected/adapter/exchange'

export type TCollectionStatePort = Pick<TStateStore, 'getSnapshot' | 'subscribe'>
