/**
 * Describes the silent manual separator of ListBox.
 */

import { TListBoxSeparator } from '@soxa-ui/core'
import { defineComponent, defineDescriptor } from '../../../../protected/define'
import { ComponentViewDescriptor } from '../component-view.descriptor'
import { ListSeparatorPluginDescriptor } from '../../plugins/list-separator.plugin'

export const ListBoxSeparatorDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TListBoxSeparator,
		extends: ComponentViewDescriptor(),
		plugins: [ListSeparatorPluginDescriptor],
	}),
)
