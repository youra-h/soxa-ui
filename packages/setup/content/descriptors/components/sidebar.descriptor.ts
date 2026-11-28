/**
 * Defines the sidebar panel and its optional navigation items.
 */

import { TSidebar, TSidebarItem } from '@soxa-ui/core'
import { defineComponent, defineDescriptor, defineType } from '../../../protected/define'
import { AriaPluginDescriptor } from '../plugins'
import { ComponentViewDescriptor } from './component-view.descriptor'
import { TextableDescriptor } from './textable.descriptor'

export const SidebarDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TSidebar,
		extends: ComponentViewDescriptor(),
		contribution: {
			props: {
				side: { type: String, triggers: ['change:side'] },
				collapse: { type: String, triggers: ['change:collapse'] },
				collapsed: { type: Boolean, triggers: ['change:collapsed'] },
				offcanvasHidden: {
					type: Boolean,
					protected: true,
					triggers: ['change:collapsed', 'change:collapse'],
				},
			},
			events: ['change:side', 'change:collapse', 'change:collapsed'],
			slots: {
				default: {
					description: 'Sidebar contents',
					scope: { collapsed: defineType<boolean>(Boolean) },
				},
			},
		},
		plugins: [AriaPluginDescriptor],
	}),
)

export const SidebarItemDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TSidebarItem,
		extends: TextableDescriptor(),
		contribution: {
			props: {
				href: { type: String, triggers: ['change:href'] },
			},
			events: ['change:href'],
			slots: {
				leading: { description: 'Icon shown in both expanded and compact states' },
				default: { description: 'Item label', scope: { text: defineType<string>(String) } },
			},
		},
	}),
)
