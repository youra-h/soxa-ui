export { TCollectionExtension } from './collection.extension.class'
export { TCollectionItemExtension } from './collection-item.extension.class'
export type {
	ICollectionExtensionOptions,
	ICollectionItemExtensionOptions,
	TCollectionItemFacade,
	TCollectionOwner,
	TMemberAdapter,
} from './types'

export { TCollectionInitialSource } from './initial-source.class'
export {
	TCollectionPreparation,
	TCollectionPreparationLifetime,
	collectionPreparedSource,
	collectionNeedsPreparation,
	collectionPreparationConfig,
} from './preparation.class'
export { TCollectionInitialExtension } from './initial.extension.class'
export {
	createCollectionInitialSource,
	collectionInitialOwnerOptions,
	collectionInitialSourceOf,
	resolveCollectionInitialItem,
	resolveCollectionInitialPanel,
} from './initial'
export { collectionInitialInputs } from './initial-inputs'
export { collectionInitialPrepared, collectionInitialState } from './initial-state'
export type {
	ICollectionInitialSource,
	ICollectionInitialPanel,
	ICollectionInitialLink,
	ICollectionInitialOptions,
	ICollectionInitialExtensionOptions,
	TCollectionInitialMount,
	TInitialPropsNormalizer,
} from './initial.types'

export { TCollectionAriaState } from './aria-state.class'
export type { ICollectionAriaStateOptions, TCollectionStatePort } from './aria-state.types'
