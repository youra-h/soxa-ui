/**
 * Shared list and grouping property declarations.
 * Literal keys are preserved with `satisfies` so descriptor types retain each property.
 * Public events are declared separately in each consuming descriptor.
 */

import type { TGroupEvents, TListEvents } from '@soxa-ui/core'
import type { IComponentPropDefinition } from '../../../protected/define'

export const LIST_PROPS = {
	maxRows: {
		type: Number,
		triggers: ['change:maxRows'],
	},
	contentFit: {
		type: String,
		triggers: ['change:contentFit'],
	},
	scrollBehavior: {
		type: String,
		triggers: ['change:scrollBehavior'],
	},
	indicator: {
		type: String,
		triggers: ['change:indicator'],
	},
	/** Separate data sections; use ListBox.Separator or Select.Separator for markup groups. */
	groupSeparators: {
		type: Boolean,
		triggers: ['change:groupSeparators'],
	},
} satisfies Record<string, IComponentPropDefinition<keyof TListEvents>>

export const GROUP_PROPS = {
	/** Ключ группы элемента. Не задан — метка `_.group` из данных */
	groupBy: { type: Function, triggers: ['change:groupBy'] },
	/** Порядок групп и их подписи. Сверка по содержимому */
	groups: { type: Array, triggers: ['change:groups'] },
} satisfies Record<string, IComponentPropDefinition<keyof TGroupEvents<object>>>
