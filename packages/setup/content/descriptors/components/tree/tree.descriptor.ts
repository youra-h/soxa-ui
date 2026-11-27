/**
 * Descriptors for the tree widget and its rendered item, including scoped icons.
 */
import { TTree, TTreeItem } from '@soxa-ui/core'
import { TTreeKeyboardPlugin, treeFocusTarget } from '@soxa-ui/plugins'
import {
	defineComponent,
	defineDescriptor,
	definePlugin,
	defineType,
} from '../../../../protected/define'
import { ValueControlDescriptor } from '../value-control.descriptor'
import {
	ActionPluginDescriptor,
	CollectionBundlesPluginDescriptor,
	CollectionElementsPluginDescriptor,
} from '../../plugins'

function treeSlotScopes() {
	const icon = {
		item: defineType<TTreeItem>(Object),
		expanded: defineType<boolean>(Boolean),
		branch: defineType<boolean>(Boolean),
		loading: defineType<boolean>(Boolean),
	}

	return {
		icon,
		row: {
			...icon,
			text: defineType<string>(String),
			selected: defineType<boolean>(Boolean),
		},
	}
}

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
