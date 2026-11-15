import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core'
import { provideClientHydration } from '@angular/platform-browser'
import { provideAttrs } from '@soxa-ui/angular'
import { useIcons, useTheme } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'
import oren from '@soxa-ui/theme-oren/setup'

// Shared module registration runs once per process, outside request handlers.
useIcons(material)
useTheme(oren)

export const appConfig: ApplicationConfig = {
	providers: [provideBrowserGlobalErrorListeners(), provideAttrs(), provideClientHydration()],
}
