/// <reference types="@example/soxa-theme" preserve="true" />
import { TTable, TTabs, TToasts } from '@soxa-ui/core'
import { defineTheme } from '@soxa-ui/setup'
import { TTableHeadPlugin, TTabsViewPlugin, TToastsFrontPlugin } from '@soxa-ui/theme-base/setup'

export default defineTheme({
	name: 'studio',
	plugins: [
		{ type: TTabs, plugins: [TTabsViewPlugin] },
		{ type: TTable, plugins: [TTableHeadPlugin] },
		{ type: TToasts, plugins: [TToastsFrontPlugin] },
	],
})
