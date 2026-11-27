/**
 * Describes the Tree control, its slots, and keyboard behavior.
 */

import { TTree } from '@soxa-ui/core'
import { TTreeKeyboardPlugin, treeFocusTarget } from '@soxa-ui/plugins'
import { defineComponent, defineDescriptor, definePlugin } from '../../../../protected/define'
import { ValueControlDescriptor } from '../value-control.descriptor'
import {
	ActionPluginDescriptor,
	CollectionBundlesPluginDescriptor,
	CollectionElementsPluginDescriptor,
} from '../../plugins'
import { treeSlotScopes } from './slot-scopes'

export const TreeDescriptor = defineDescriptor(() => {
	const { icon, row } = treeSlotScopes()

	return defineComponent({
		ctor: TTree,
		extends: ValueControlDescriptor(),
		contribution: {
			props: {
				loadChildren: { type: Function, triggers: ['change:loadChildren'] },
				guides: { type: Boolean, triggers: ['change:guides'] },
				indicator: { type: String, triggers: ['change:indicator'] },
			},
			slots: {
				item: { scope: row, description: 'Content of a tree row' },
				'item-icon': { scope: icon, description: 'Icon beside the node label' },
				'item-indicator-icon': {
					scope: icon,
					description: 'Branch disclosure indicator',
				},
				empty: { description: 'Content when the tree is empty' },
			},
			events: ['change:guides', 'change:indicator', 'change:loadChildren'],
		},
		plugins: [
			ActionPluginDescriptor.with({ focusTarget: treeFocusTarget }),
			CollectionBundlesPluginDescriptor,
			CollectionElementsPluginDescriptor,
			definePlugin({ ctor: TTreeKeyboardPlugin, namespace: 'treeKeyboard' }),
		],
	})
})
