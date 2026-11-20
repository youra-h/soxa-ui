/**
 * Контракты проводки группы элементов: что группа опускает по лифту, какой её видит проводка, и опции расширения.
 */

import type { TCollectionEngine, TItemGroupEvents } from '@soxa-ui/core'
import type { IListenable } from '@soxa-ui/plugins'
import type { TElevatorFactory } from '../../../protected/adapter/elevator'

/**
 * The link of a group with the items inside: the group's key in the
 * collection's grouping and the engine of that collection. An item takes the
 * key only if it is an item of the same engine: the items of a submenu in a
 * menu group are items of their own collection.
 *
 * `enter` — the group enters the grouping, at the latest before its first
 * item does (see `TItemGroupExtension`); a repeat does nothing.
 */
export interface IItemGroupLink {
	readonly key: string
	readonly engine: TCollectionEngine<any, any>
	enter(): void
}

/**
 * The instance the extension attaches to: a group part — `Menu.Group`,
 * `Menu.RadioGroup`, `ListBox.Group`, `Select.Group`. The key in the grouping
 * comes from the instance (`uid`), the label — with the event of its change:
 * the event maps of the forms differ, but every one has the label change.
 * `visible` — the group hides when none of its items is shown.
 */
export type TItemGroupPart = {
	readonly uid: number
	readonly label: string
	visible: boolean
	readonly events: IListenable<Pick<TItemGroupEvents, 'change:label'>>
}

export interface IItemGroupExtensionOptions {
	elevator: TElevatorFactory
}
