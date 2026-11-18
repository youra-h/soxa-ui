import { provideZonelessChangeDetection } from '@angular/core'
import { bootstrapApplication } from '@angular/platform-browser'
import { provideAttrs } from '@soxa-ui/angular'
import { Fixture, SPEC } from '$fixture'
import { install } from './client'
install(async (element, spec) => {
	element.innerHTML = '<bench-page></bench-page>'
	const app = await bootstrapApplication(Fixture, {
		providers: [
			provideAttrs(),
			provideZonelessChangeDetection(),
			{ provide: SPEC, useValue: spec },
		],
	})
	return () => app.destroy()
})
