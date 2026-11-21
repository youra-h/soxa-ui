/**
 * Declares the DOM plugin shared by manual list separators.
 */

import { TListSeparatorPlugin } from '@soxa-ui/plugins'
import { definePlugin } from '../../../protected/define'

export const ListSeparatorPluginDescriptor = definePlugin({
	ctor: TListSeparatorPlugin,
	namespace: 'listSeparator',
})
