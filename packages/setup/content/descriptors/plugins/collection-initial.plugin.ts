/**
 * Descriptor carriers for initial collection owners and their ordinal parts.
 */
import { TCollectionInitialPlugin, TCollectionInitialPartPlugin } from '@soxa-ui/plugins'
import { definePlugin } from '../../../protected/define'

export const CollectionInitialPluginDescriptor = definePlugin({
	ctor: TCollectionInitialPlugin,
	contribution: { props: { initial: { type: Object } } },
})
export const CollectionInitialPartPluginDescriptor = definePlugin({
	ctor: TCollectionInitialPartPlugin,
	contribution: { props: { initial: { type: Number } } },
})
