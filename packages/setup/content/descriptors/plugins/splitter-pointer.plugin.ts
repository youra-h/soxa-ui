/**
 * Connects pointer resizing to the Splitter model.
 */

import { definePlugin } from '../../../protected/define'
import { TSplitterPointerPlugin } from '@soxa-ui/plugins'

export const SplitterPointerPluginDescriptor = definePlugin({
	ctor: TSplitterPointerPlugin,
	namespace: 'pointer',
})
