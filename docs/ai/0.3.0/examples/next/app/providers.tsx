'use client'

import type { ReactNode } from 'react'
import { useIcons, useTheme } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'
import oren from '@soxa-ui/theme-oren/setup'

// Client modules also execute during HTML rendering, in the components' registry.
useIcons(material)
useTheme(oren)

export function Providers({ children }: { children: ReactNode }) {
	return children
}
