/**
 * TItemGroupExtension — a group part enters the collection's grouping: the key to the items inside, the label to the grouping.
 *
 * A markup group (`Menu.Group`, `Menu.RadioGroup`, `ListBox.Group`,
 * `Select.Group`) goes the same channel as the `_.group` mark in data: it
 * lowers its key along with its collection's engine down the elevator
 * (`ITEM_GROUP_ELEVATOR`), and an item inside puts the key into its marks
 * when it joins the collection (`TCollectionItemExtension`). There is no
 * second membership storage — `meta` remembers the key, as the mark from
 * data.
 *
 * The key comes from the group's instance (`uid`): the consumer has no reason
 * to address a markup group by key, and there is no prop for it. The key does
 * not go into the document, so the server and the browser do not compare it.
 *
 * The group registers its label in the grouping (`register`): the sections
 * get it when `groups` has no label. The registration is separate from
 * `groups` — resetting the prop does not erase the markup group's — and sets
 * no order. The label changed — the group registers the new one over the old.
 *
 * Phases — as the field link's (`TFieldControlExtension`):
 *
 * - **assembly** — the link for the items: they read it at their assembly;
 * - **entry** — the label's registration and the subscription to its change.
 *   The grouping is someone else's storage, and the framework may throw an
 *   assembled group away without accepting it. The entry is the context's
 *   `attach` or the entry of the group's first item (`enter` of the link),
 *   whichever comes first: React accepts the children before their parent,
 *   and the items joined a group without its label — the sections came
 *   unlabelled first (benchmarks/parity/README.md). An accepted item has an
 *   accepted group above it, so the early entry registers no thrown-away
 *   group;
 * - **removal** (the context's `destroy`) — the unsubscriptions and the
 *   registration removed.
 *
 * A group whose items are all left out of the shown ones (Select's filter)
 * hides with its label: the owner draws no section for such a group from data
 * either. Only a group that has items hides — an empty one, or one whose items
 * have not joined yet, stays as it is. The group writes `visible` only when
 * its shown state flips, so the consumer's own `visible` stands otherwise.
 *
 * No collection above or it has no grouping — the group lowers an empty
 * link: the items need no key, and a group link from above does not reach
 * them. A group the owner draws for a section from data is the same part: no
 * item has its key — an item from data takes no group key — and the
 * registration does not change the sections.
 *
 * Usage:
 *   adapter.use(TItemGroupExtension, { elevator: VueElevatorFactory })
 */

import { batchOf, groupOf, metaOf } from '@soxa-ui/core'
import type { TInstanceContext } from '../../../protected/adapter/context'
import { ITEM_CONTEXT_ELEVATOR } from '../../../protected/adapter/elevator/keys'
import { ITEM_GROUP_ELEVATOR } from './keys'
import type { IItemGroupExtensionOptions, TItemGroupPart } from './types'

export class TItemGroupExtension {
	constructor(context: TInstanceContext<TItemGroupPart>, options: IItemGroupExtensionOptions) {
		const link = options.elevator(ITEM_GROUP_ELEVATOR)
		const engine = options.elevator(ITEM_CONTEXT_ELEVATOR).up()
		const grouping = groupOf(engine)

		if (!engine || !grouping) {
			link.down(null)

			return
		}

		const group = context.instance
		const key = `item-group:${group.uid}`
		const batch = batchOf<object>(engine)
		const meta = metaOf<object>(engine)
		/** Снятие последней регистрации: новая подпись регистрируется поверх прежней. */
		let release: (() => void) | undefined

		/** Whether the group has entered the grouping — see «entry» above. */
		let entered = false

		/** The shown state the group applied last; a group renders shown. */
		let shown = true

		const register = (): void => {
			release = grouping.register({ key, label: group.label })
		}

		const isMember = (item: object): boolean => meta?.get(item)?.group === key

		// The grouping recounts its sections on the same `change:shown`, before
		// this: it is installed with the engine
		const syncShown = (): void => {
			const next =
				grouping.sections.some((section) => section.group?.key === key) ||
				!(batch?.items.some(isMember) ?? false)

			if (next === shown) return

			shown = next
			group.visible = next
		}

		const enter = (): void => {
			if (entered) return

			entered = true
			register()
			group.events.on('change:label', register)
			batch?.events.on('change:shown', syncShown)
			syncShown()
		}

		link.down({ key, engine, enter })

		context.events.on('attach', enter)

		context.events.on('destroy', () => {
			entered = false
			group.events.off('change:label', register)
			batch?.events.off('change:shown', syncShown)
			release?.()
			release = undefined
		})
	}
}
