/**
 * Prepare and lower the initial source through the collection owner's lift.
 */
import { TCollectionInitialPlugin } from '@soxa-ui/plugins'

import type { TInstanceContext } from '../../../protected/adapter/context'
import { COLLECTION_INITIAL_ELEVATOR } from './keys'
import type { TCollectionOwner } from './types'
import type { ICollectionInitialExtensionOptions } from './initial.types'

/** Prepare a source once and lower its owner-local resolver before children assemble. */
export class TCollectionInitialExtension {
	constructor(
		context: TInstanceContext<TCollectionOwner>,
		{ source, elevator }: ICollectionInitialExtensionOptions,
	) {
		if (source) {
			if (!context.bundle) {
				throw new Error('Collection initial source needs its owner plugin bundle.')
			}

			source.materialize(context.instance.engine, context.bundle)
			context.events.on('attach', () =>
				context.bundle?.get(TCollectionInitialPlugin)?.pluginMount?.accept(),
			)
		}

		elevator(COLLECTION_INITIAL_ELEVATOR).down(source ?? null)
	}
}
