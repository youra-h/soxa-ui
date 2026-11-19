/**
 * The state adapters render for a prepared mount: the exchange's snapshot with
 * the mount-local document links and names merged in.
 */
import {
	TCollectionInitialPartPlugin,
	TCollectionInitialPlugin,
	TTabsItemIdsPlugin,
	TTabsItemNamesPlugin,
	TTagsItemNamesPlugin,
} from '@soxa-ui/plugins'

import type { IAdapterContext } from '../../../protected'
import { TCollectionAriaState } from './aria-state.class'
import type { TCollectionStatePort } from './aria-state.types'

/**
 * All adapters read the same single derived port; no adapter merges
 * relationships. An ordinary mount gets the exchange's own state back, and so
 * does a collection facade: it shares the part's bundle but renders no `aria`.
 */
export function collectionInitialState(
	context: Pick<IAdapterContext, 'bundle' | 'descriptor'>,
	state: TCollectionStatePort,
): TCollectionStatePort {
	const part = context.bundle?.get(TCollectionInitialPartPlugin)

	if (!part?.prepared) return state
	if (!context.descriptor.props.some((prop) => prop.name.name === 'aria')) return state

	const link = context.bundle?.get(TTabsItemIdsPlugin)?.link ?? part.aria
	const names = (
		context.bundle?.get(TTabsItemNamesPlugin) ?? context.bundle?.get(TTagsItemNamesPlugin)
	)?.names

	return link || names
		? new TCollectionAriaState({ state, link, outputs: names ? [names] : [] })
		: state
}

/** A prepared assembly can render its full source before the native mount accepts it. */
export function collectionInitialPrepared(context: Pick<IAdapterContext, 'bundle'>): boolean {
	return Boolean(
		context.bundle?.get(TCollectionInitialPlugin)?.pluginMount ??
		context.bundle?.get(TCollectionInitialPartPlugin)?.prepared,
	)
}
