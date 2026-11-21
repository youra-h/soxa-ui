import { useIcons, useTheme } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'
import oren from '@soxa-ui/theme-oren/setup'
// Register once per module, on both server and client; never per request.
useIcons(material)
useTheme(oren)
export default defineNuxtPlugin(() => {})
