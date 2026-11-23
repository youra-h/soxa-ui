import { bootstrapApplication } from '@angular/platform-browser'
import { useIcons, useTheme } from '@soxa-ui/setup'
import {
	arrowDown,
	arrowRight,
	arrowUpward,
	arrowsInward,
	arrowsOutward,
	calendar,
	check,
	checkIndeterminate,
	close,
	error,
} from '@soxa-ui/icons-material'
import oren from '@soxa-ui/theme-oren/setup'
import { appConfig } from './app/app.config'
import { App } from './app/app'

useIcons({
	arrowDown,
	arrowRight,
	arrowUpward,
	arrowsInward,
	arrowsOutward,
	calendar,
	check,
	checkIndeterminate,
	close,
	error,
})
useTheme(oren)

bootstrapApplication(App, appConfig).catch((error: unknown) => console.error(error))
