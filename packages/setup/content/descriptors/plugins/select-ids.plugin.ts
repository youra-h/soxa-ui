/** Popup IDs and the internal Frame lifecycle hookup. */

import { definePlugin } from '../../../protected/define'
import { TSelectIdsPlugin } from '@soxa-ui/plugins'

export const SelectIdsPluginDescriptor = definePlugin({
	ctor: TSelectIdsPlugin,
	namespace: 'ids',
	contribution: {
		props: {
			bindPanel: { type: Function, protected: true, triggers: ['create'] },
		},
	},
})
