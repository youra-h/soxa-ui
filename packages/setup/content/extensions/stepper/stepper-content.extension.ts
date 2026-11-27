/**
 * Bind the Stepper panel to the active step of its nearest collection.
 */

import { TStepperContent, TStepperExtension, activationOf } from '@soxa-ui/core'
import type { IStepperContent, TStepperCollection, TCollectionEngine } from '@soxa-ui/core'
import type { TInstanceContext } from '../../../protected/adapter/context'
import { ITEM_CONTEXT_ELEVATOR, type TElevatorFactory } from '../../../protected/adapter/elevator'
import { COLLECTION_MEMBERS_ELEVATOR } from '../collection/keys'

function isStepperEngine(
	engine: TCollectionEngine<any, any> | undefined,
): engine is TStepperCollection {
	return engine?.extensions.stepper instanceof TStepperExtension
}

/** A panel listens to the nearest Stepper without becoming a member of its steps. */
export class TStepperContentExtension {
	constructor(
		context: TInstanceContext<IStepperContent>,
		options: { elevator: TElevatorFactory },
	) {
		const { elevator } = options
		const engine = elevator(ITEM_CONTEXT_ELEVATOR).up()
		if (!isStepperEngine(engine) || !(context.instance instanceof TStepperContent)) return

		const activation = activationOf(engine)
		const members = elevator(COLLECTION_MEMBERS_ELEVATOR).up()
		const panel = context.instance
		const sync = () => {
			const item = activation?.activeItem
			panel.setActive(item !== undefined && item.value === panel.value)
		}

		sync()
		context.events.on('attach', () => {
			members?.add(context)
			activation?.events.on('change:activation', sync)
			engine.extensions.stepper.events.on('change:steps', sync)
			panel.events.on('change:value', sync)
			sync()
		})
		context.events.on('destroy', () => {
			members?.delete(context)
			activation?.events.off('change:activation', sync)
			engine.extensions.stepper.events.off('change:steps', sync)
			panel.events.off('change:value', sync)
			panel.setActive(false)
		})
	}
}
