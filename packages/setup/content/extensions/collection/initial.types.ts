/**
 * Contracts of the owner-local initial source, document links and materialization.
 */
import type { TElevatorFactory } from '../../../protected/adapter/elevator'
import type { TCollectionInitialSource } from './initial-source.class'
import type { TCollectionEngine } from '@soxa-ui/core'
import type { IPluginBundle } from '@soxa-ui/plugins'

export type { ICollectionInitialSource, ICollectionInitialPanel } from '@soxa-ui/plugins'

/** IDs describe document relationships, independently of the item's value or mount order. */
export interface ICollectionInitialLink {
	readonly tabId: string
	readonly panelId: string
	readonly tabFallbackId?: string
	readonly panelFallbackId?: string
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

/** Applied to a prepared part's props only: Vue tells explicit props from generated defaults. */
export type TInitialPropsNormalizer = (props: object) => object
