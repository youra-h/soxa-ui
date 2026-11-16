/**
 * Frame theme descriptor: preserves the anchor's theme on teleported panels.
 * No props or events are added to the component's public surface.
 */

import { definePlugin } from '../../../protected/define'
import { TFrameThemePlugin } from '@soxa-ui/plugins'

export const FrameThemePluginDescriptor = definePlugin({
	ctor: TFrameThemePlugin,
	namespace: 'frameTheme',
})
