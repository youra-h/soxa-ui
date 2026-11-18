import { useTheme, useIcons } from '@soxa-ui/setup'
import oren from '@soxa-ui/theme-oren/setup'
import * as material from '@soxa-ui/icons-material'
import '@soxa-ui/theme-oren'

// Register static configuration once; mutable form state belongs to each component.
useTheme(oren)
useIcons(material)
