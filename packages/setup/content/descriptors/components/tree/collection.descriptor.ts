/**
 * Collection inputs and view state shared by all Tree adapters.
 */
import { TTreeCollectionFacade, TTreeItemCollectionFacade } from '@soxa-ui/core'
import { defineComponent, defineDescriptor } from '../../../../protected/define'

export const TreeCollectionDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TTreeCollectionFacade,
		contribution: {
			props: {
				engine: { type: Object },
				items: { type: Array, triggers: ['change:items'] },
				mode: { type: String, triggers: ['change:mode'] },
				expanded: { type: Array, triggers: ['change:expanded'] },
				// Each adapter draws the same hierarchy and Virtual gaps.
				layout: {
					type: Array,
					protected: true,
					triggers: ['change:drawn', 'change:shown'],
				},
			},
			events: ['change:items', 'change:mode', 'change:expanded', 'load:error'],
		},
	}),
)

export const TreeItemCollectionDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TTreeItemCollectionFacade,
		contribution: {
			props: { selected: { type: Boolean, triggers: ['change:selected'] } },
			events: ['change:selected'],
		},
	}),
)
