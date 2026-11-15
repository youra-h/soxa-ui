/**
 * Popup IDs and the internal Frame lifecycle hookup.
 */

import { definePlugin } from '../../../protected/define'
import { TDatePickerIdsPlugin } from '@soxa-ui/plugins'

export const DatePickerIdsPluginDescriptor = definePlugin({
	ctor: TDatePickerIdsPlugin,
	namespace: 'ids',
	contribution: {
		props: {
			bindPanel: { type: Function, protected: true, triggers: ['create'] },
		},
	},
})
