import { useIcons, useTheme } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'
import oren from '@soxa-ui/theme-oren/setup'
import '@soxa-ui/theme-oren'

// Run synchronously after registration, before inserting the application.
useIcons(material)
useTheme(oren)
