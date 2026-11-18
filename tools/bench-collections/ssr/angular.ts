import { provideZonelessChangeDetection } from '@angular/core'
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser'
import { renderApplication, provideServerRendering } from '@angular/platform-server'
import { provideAttrs } from '@soxa-ui/angular'
import { Fixture, SPEC } from '$fixture'
import { TComponent } from '@soxa-ui/core'
import { TPluginBundle } from '@soxa-ui/plugins'
import '../setup'
export const prototypes = { component: TComponent, bundle: TPluginBundle }
export const render = (spec: never) =>
	renderApplication(
		(context: BootstrapContext) =>
			bootstrapApplication(
				Fixture,
				{
					providers: [
						provideAttrs(),
						provideZonelessChangeDetection(),
						provideServerRendering(),
						{ provide: SPEC, useValue: spec },
					],
				},
				context,
			),
		{
			document:
				'<!doctype html><html><head></head><body><bench-page></bench-page></body></html>',
		},
	)
