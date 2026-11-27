import { TTreeItem } from '@soxa-ui/core'
import { defineComponent, defineDescriptor } from '../../../../protected/define'
import { ValueControlDescriptor } from '../value-control.descriptor'
import { treeSlotScopes } from './slot-scopes'

/** Describes the internal, data-backed item mounted by each adapter. */
export const TreeItemDescriptor = defineDescriptor(() => {
	const { icon, row } = treeSlotScopes()

	return defineComponent({
		ctor: TTreeItem,
		extends: ValueControlDescriptor(),
		contribution: {
			props: {
				text: { type: String, triggers: ['change:text'] },
				href: { type: String, triggers: ['change:href'] },
			},
			slots: {
				default: { scope: row, description: 'Content of the row' },
				icon: { scope: icon, description: 'Icon beside the node label' },
				'indicator-icon': {
					scope: icon,
					description: 'Branch disclosure indicator',
				},
			},
			events: ['change:text', 'change:href'],
		},
	})
})
