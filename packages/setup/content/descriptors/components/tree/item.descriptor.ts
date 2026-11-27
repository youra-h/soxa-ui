/**
 * Describes the internal Tree item mounted by each adapter.
 */

import { TTreeItem } from '@soxa-ui/core'
import { defineComponent, defineDescriptor } from '../../../../protected/define'
import { ValueControlDescriptor } from '../value-control.descriptor'
import { treeSlotScopes } from './slot-scopes'

export const TreeItemDescriptor = defineDescriptor(() => {
	const { icon, row } = treeSlotScopes()

	return defineComponent({
		ctor: TTreeItem,
		extends: ValueControlDescriptor(),
		contribution: {
			props: {
				branch: { type: Boolean, protected: true, triggers: ['change:aria'] },
				expanded: { type: Boolean, protected: true, triggers: ['change:aria'] },
				loading: { type: Boolean, protected: true, triggers: ['change:aria'] },
				indicator: { type: String, protected: true, triggers: ['change:dataset'] },
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
