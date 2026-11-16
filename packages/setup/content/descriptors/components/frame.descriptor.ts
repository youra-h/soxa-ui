/**
 * Frame descriptor, extending LayerDescriptor with coordinates, dimensions,
 * positioning strategy, contained layout and a default slot.
 * Layer supplies visibility, teleport target and the shared stacking order;
 * plugins supply layout, anchoring, local theme inheritance and the accessible name.
 */

import { defineComponent, defineDescriptor } from '../../../protected/define'
import { TFrame } from '@soxa-ui/core'
import {
	FrameLayoutPluginDescriptor,
	FrameThemePluginDescriptor,
	AnchorPluginDescriptor,
	AriaPluginDescriptor,
} from '../plugins'
import { LayerDescriptor } from './layer.descriptor'

export const FrameDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TFrame,

		extends: LayerDescriptor(),

		contribution: {
			slots: {
				default: { description: 'Содержимое панели' },
			},
			props: {
				x: { type: Number, triggers: ['change:x'] },
				y: { type: Number, triggers: ['change:y'] },
				width: { type: [Number, String], triggers: ['change:width'] },
				height: { type: [Number, String], triggers: ['change:height'] },
				strategy: { type: String, triggers: ['change:strategy'] },
				/**
				 * Панель внутри контейнера: разметка не телепортирует её, раскладка
				 * ставит `absolute` без координат, якорь не двигает.
				 */
				contained: { type: Boolean, triggers: ['change:contained'] },
			},
			events: [
				'change:x',
				'change:y',
				'change:width',
				'change:height',
				'change:strategy',
				'change:contained',
			],
		},

		plugins: [
			FrameLayoutPluginDescriptor,
			AnchorPluginDescriptor,
			FrameThemePluginDescriptor,
			AriaPluginDescriptor,
		],
	}),
)
