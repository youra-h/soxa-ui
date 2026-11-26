/**
 * Connects keyboard resizing and collapse to the Splitter model.
 */

import { definePlugin } from '../../../protected/define'
import { TSplitterKeyboardPlugin } from '@soxa-ui/plugins'

export const SplitterKeyboardPluginDescriptor = definePlugin({
	ctor: TSplitterKeyboardPlugin,
	namespace: 'keyboard',
})
