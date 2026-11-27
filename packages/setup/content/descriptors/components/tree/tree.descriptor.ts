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
	CollectionBundlesPluginDescriptor,
	CollectionElementsPluginDescriptor,
} from '../../plugins'
import { ActionPluginDescriptor } from '../../plugins'

const item = defineType<TTreeItem>(Object)

const treeIconScope = {
	item,
	expanded: defineType<boolean>(Boolean),
	branch: defineType<boolean>(Boolean),
	loading: defineType<boolean>(Boolean),
}

const treeItemScope = {
	...treeIconScope,
	text: defineType<string>(String),
	selected: defineType<boolean>(Boolean),
}

export const TreeDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TTree,
		extends: ValueControlDescriptor(),
		contribution: {
			props: {
				loadChildren: { type: Function, triggers: ['change:loadChildren'] },
				guides: { type: Boolean, triggers: ['change:guides'] },
			},
			slots: {
				item: { scope: treeItemScope, description: 'Content of a tree row' },
				'item-icon': { scope: treeIconScope, description: 'Icon beside the node label' },
				'item-indicator-icon': {
					scope: treeIconScope,
					description: 'Branch disclosure indicator',
				},
				empty: { description: 'Content when the tree is empty' },
			},
			events: ['change:guides', 'change:loadChildren'],
		},
		plugins: [
			ActionPluginDescriptor.with({ focusTarget: treeFocusTarget }),
			CollectionBundlesPluginDescriptor,
			CollectionElementsPluginDescriptor,
			definePlugin({ ctor: TTreeKeyboardPlugin, namespace: 'treeKeyboard' }),
		],
	}),
)

export const TreeItemDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TTreeItem,
		extends: ValueControlDescriptor(),
		contribution: {
			props: {
				text: { type: String, triggers: ['change:text'] },
				href: { type: String, triggers: ['change:href'] },
			},
			slots: {
				default: { scope: treeItemScope, description: 'Content of the row' },
				icon: { scope: treeIconScope, description: 'Icon beside the node label' },
				'indicator-icon': {
					scope: treeIconScope,
					description: 'Branch disclosure indicator',
				},
			},
			events: ['change:text', 'change:href'],
		},
	}),
)
