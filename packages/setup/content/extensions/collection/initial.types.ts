/**
 * Contracts of the owner-local initial source, document links and materialization.
 */
import type { TElevatorFactory } from '../../../protected/adapter/elevator'
import type { TCollectionInitialSource } from './initial-source.class'
import type { TCollectionEngine } from '@soxa-ui/core'
import type { IPluginBundle } from '@soxa-ui/plugins'

/** Plain declarations; materialized models belong to one owner, never to this source. */
export interface ICollectionInitialSource {
	readonly items: readonly Readonly<Record<string, unknown>>[]
	readonly panels?: readonly ICollectionInitialPanel[]
}

export interface ICollectionInitialPanel {
	readonly value?: string | number
	readonly id?: string
}

/** IDs describe document relationships, independently of the item's value or mount order. */
export interface ICollectionInitialLink {
	readonly tabId: string
	readonly panelId: string
}

export interface ICollectionInitialOptions {
	readonly initial: unknown
	readonly items?: unknown
	readonly engine?: TCollectionEngine<any, any>
	readonly panelDefaultValue?: string | number
}

export type TCollectionInitialMount = Pick<IPluginBundle, 'createId'>

export interface ICollectionInitialExtensionOptions {
	source?: TCollectionInitialSource
	elevator: TElevatorFactory
}
