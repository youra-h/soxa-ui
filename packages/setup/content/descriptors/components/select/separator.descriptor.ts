/**
 * Describes the silent manual separator of Select.
 */

import { TSelectSeparator } from '@soxa-ui/core'
import { defineComponent, defineDescriptor } from '../../../../protected/define'
import { ComponentViewDescriptor } from '../component-view.descriptor'
import { ListSeparatorPluginDescriptor } from '../../plugins/list-separator.plugin'

export const SelectSeparatorDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TSelectSeparator,
		extends: ComponentViewDescriptor(),
		plugins: [ListSeparatorPluginDescriptor],
	}),
)
