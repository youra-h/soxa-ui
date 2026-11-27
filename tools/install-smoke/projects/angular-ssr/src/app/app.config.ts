import { provideBrowserGlobalErrorListeners } from '@angular/core'
import type { ApplicationConfig } from '@angular/core'
import { provideClientHydration } from '@angular/platform-browser'
import { provideAttrs } from '@soxa-ui/angular'
import { useIcons, useTheme } from '@soxa-ui/setup'
import {
	arrowDown,
	arrowRight,
	arrowsInward,
	arrowsOutward,
	arrowUpward,
	calendar,
	check,
	close,
} from '@soxa-ui/icons-material'
import oren from '@soxa-ui/theme-oren/setup'

// The registries are global: filled once in the browser and once on the
// server, which takes this config too — not once per request
// Register the roles used by this page and its nested components.
useIcons({
	arrowDown,
	arrowRight,
	arrowsInward,
	arrowsOutward,
	arrowUpward,
	calendar,
	check,
	close,
})
useTheme(oren)

export const appConfig: ApplicationConfig = {
	providers: [provideBrowserGlobalErrorListeners(), provideClientHydration(), provideAttrs()],
}
