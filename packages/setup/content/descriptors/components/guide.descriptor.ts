/**
 * Guide descriptor, connecting navigation with the shared Frame layer and its plugins.
 */

import { TGuide } from '@soxa-ui/core'
import {
	TAnchorPlugin,
	TGuideAdvancePlugin,
	TGuideFocusPlugin,
	TGuideNamesPlugin,
	TGuidePositionPlugin,
} from '@soxa-ui/plugins'
import { defineComponent, defineDescriptor, definePlugin } from '../../../protected/define'
import {
	FrameLayoutPluginDescriptor,
	FrameThemePluginDescriptor,
	HideOutsidePluginDescriptor,
	ScrollLockPluginDescriptor,
} from '../plugins'
import { TPluginDefinition } from '../../../protected/define/plugin-definition.class'
import { LayerDescriptor } from './layer.descriptor'

// Guide takes its anchor from the current step, so Frame's anchor inputs stay private here.
const anchor = new TPluginDefinition(TAnchorPlugin, 'anchor', [], [], { offset: 12 })
const advance = definePlugin({ ctor: TGuideAdvancePlugin, namespace: 'advance' })
const focus = definePlugin({ ctor: TGuideFocusPlugin, namespace: 'focus' })

const position = definePlugin({
	ctor: TGuidePositionPlugin,
	namespace: 'position',
	contribution: {
		props: {
			spotlight: { type: Object, protected: true, triggers: ['change:position'] },
			layer: { type: Object, protected: true, triggers: ['change:position'] },
			backdrop: { type: Object, protected: true, triggers: ['change:position'] },
		},
	},
})

const names = definePlugin({
	ctor: TGuideNamesPlugin,
	namespace: 'names',
	contribution: {
		props: { labels: { type: Object, protected: true, triggers: ['change:labels'] } },
	},
})

export const GuideDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TGuide,
		extends: LayerDescriptor(),
		plugins: [
			FrameLayoutPluginDescriptor,
			anchor,
			FrameThemePluginDescriptor,
			position,
			advance,
			focus.with({ property: 'visible' }),
			HideOutsidePluginDescriptor.with({ property: 'visible', modal: true }),
			ScrollLockPluginDescriptor.with({ property: 'visible', modal: true }),
			names,
		],
		contribution: {
			props: {
				steps: { type: Array, triggers: ['change:steps'] },
				backdrop: { type: String, triggers: ['change:backdrop'] },
				closable: { type: Boolean, triggers: ['change:closable'] },
				backdropClasses: { type: Array, protected: true, triggers: ['change:backdrop'] },
				backdropRendered: {
					type: Boolean,
					protected: true,
					triggers: ['change:backdrop', 'change:modal'],
				},
				step: { type: Object, protected: true, triggers: ['change:step'] },
				stepNumber: {
					type: Number,
					protected: true,
					triggers: ['change:step', 'change:steps'],
				},
				stepCount: { type: Number, protected: true, triggers: ['change:steps'] },
				modal: { type: Boolean, protected: true, triggers: ['change:modal'] },
			},
			events: [
				'change:steps',
				'change:step',
				'change:backdrop',
				'change:closable',
				'close:before',
				'complete',
			],
		},
	}),
)
