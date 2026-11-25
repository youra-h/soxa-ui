/**
 * Shares prepared sources between collection owners and their facades by plugin bundle.
 */
import type { IPluginBundle } from '@soxa-ui/plugins'
import type { TCollectionInitialSource } from './initial-source.class'

const sources = new WeakMap<IPluginBundle, TCollectionInitialSource>()

/** A facade reads the source of its own bundle. */
export function collectionPreparedSource(
	bundle: IPluginBundle | null | undefined,
): TCollectionInitialSource | undefined {
	return bundle ? sources.get(bundle) : undefined
}

export function rememberCollectionPreparedSource(
	bundle: IPluginBundle,
	source: TCollectionInitialSource,
): void {
	sources.set(bundle, source)
}
