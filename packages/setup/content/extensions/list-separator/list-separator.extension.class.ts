/**
 * Wires an accepted separator to its nearest collection without joining it.
 */

import type { IComponentView } from '@soxa-ui/core'
import { TListSeparatorPlugin } from '@soxa-ui/plugins'
import type { TInstanceContext } from '../../../protected/adapter/context'
import type { IListSeparatorExtensionOptions } from './types'
import { ITEM_CONTEXT_ELEVATOR } from '../../../protected/adapter/elevator/keys'

export class TListSeparatorExtension {
	constructor(
		context: TInstanceContext<IComponentView>,
		options: IListSeparatorExtensionOptions,
	) {
		const engine = options.elevator(ITEM_CONTEXT_ELEVATOR).up()

		if (!engine) return

		// An unaccepted framework render must not subscribe to a foreign engine.
		context.events.on('attach', () => {
			context.bundle?.get(TListSeparatorPlugin)?.bindCollection(engine)
		})
	}
}
