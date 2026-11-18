import { useIcons, useTheme } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'
import oren from '@soxa-ui/theme-oren/setup'
import '@soxa-ui/theme-oren'

// Configure static registries once in each server/browser module graph.
useIcons(material)
useTheme(oren)
