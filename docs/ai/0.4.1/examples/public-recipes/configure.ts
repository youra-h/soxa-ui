import { TButton } from '@soxa-ui/core'
import { useIcons, usePlugins } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'
import { close } from '@soxa-ui/icons-lucide'
import { TTextAuditPlugin } from './text-audit'

// Alternative trusted artwork; pass it to useIcons({ close: customClose }).
export const customClose = {
	viewBox: '0 0 24 24',
	body: '<path fill="none" stroke="currentColor" stroke-width="2" d="M6 6l12 12M18 6L6 18"/>',
} satisfies import('@soxa-ui/setup').TIconSource

export function configure() {
	useIcons(material)
	useIcons({ close })
	return usePlugins(TButton, [TTextAuditPlugin])
}
