/**
 * Describes the Splitter layout, its panels and its interactive handles.
 */

import { TSplitter, TSplitterHandle, TSplitterPanel } from '@soxa-ui/core'
import { defineComponent, defineDescriptor } from '../../../protected/define'
import {
	AriaPluginDescriptor,
	SplitterKeyboardPluginDescriptor,
	SplitterPointerPluginDescriptor,
} from '../plugins'
import { ComponentViewDescriptor } from './component-view.descriptor'

export const SplitterDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TSplitter,
		extends: ComponentViewDescriptor(),
		contribution: {
			slots: { default: { description: 'Panels and handles in layout order' } },
			props: {
				panels: { type: Array, triggers: ['change:panels'] },
				orientation: { type: String, triggers: ['change:orientation'] },
				offset: { type: Number, triggers: ['change:offset'] },
				width: { type: Number, triggers: ['change:width'] },
				thumb: { type: Boolean, triggers: ['change:thumb'] },
				splitterStyle: {
					type: Object,
					protected: true,
					triggers: ['change:offset', 'change:width'],
				},
				disabled: { type: Boolean, triggers: ['change:disabled'] },
			},
			events: [
				'change:panels',
				'change:orientation',
				'change:offset',
				'change:width',
				'change:thumb',
				'change:disabled',
				'change:sizes',
				'commit',
			],
		},
		plugins: [SplitterPointerPluginDescriptor, SplitterKeyboardPluginDescriptor],
	}),
)

export const SplitterPanelDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TSplitterPanel,
		extends: ComponentViewDescriptor(),
		contribution: {
			slots: { default: { description: 'Panel contents' } },
			props: {
				panel: { type: String, triggers: ['change:panel'] },
				panelStyle: { type: Object, protected: true, triggers: ['change:panelStyle'] },
			},
			events: ['change:panel'],
		},
	}),
)

export const SplitterHandleDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TSplitterHandle,
		extends: ComponentViewDescriptor(),
		contribution: {
			slots: {
				icon: { description: 'Optional decorative icon inside the grip' },
			},
			props: {
				panel: { type: String, triggers: ['change:panel'] },
				size: { type: String, triggers: ['change:size'] },
				thumbShown: { type: Boolean, protected: true, triggers: ['change:thumbShown'] },
			},
			events: ['change:panel', 'change:size'],
		},
		plugins: [AriaPluginDescriptor],
	}),
)
