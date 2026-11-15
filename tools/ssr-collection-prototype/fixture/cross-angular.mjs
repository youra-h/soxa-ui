import '@angular/compiler'
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { bootstrapApplication } from '@angular/platform-browser'
import { renderApplication, provideServerRendering } from '@angular/platform-server'
import { createApp, providers } from './cross-angular-app.mjs'

const results = []
for (const scenario of ['sync', 'conditional', 'nested']) {
	const App = createApp(scenario)
	const html = await renderApplication(
		(context) =>
			bootstrapApplication(
				App,
				{ providers: [provideServerRendering(), ...providers()] },
				context,
			),
		{
			document: `<html><head></head><body><cross-${scenario}></cross-${scenario}></body></html>`,
		},
	)
	const dom = new JSDOM(html)
	const tabs = [...dom.window.document.querySelectorAll('[role="tab"]')]
	const stops = tabs.map((t) => t.getAttribute('tabindex'))
	assert.equal(stops.filter((s) => s === '0').length, scenario === 'nested' ? 2 : 1)
	const activeLinks = tabs
		.filter((t) => t.getAttribute('aria-selected') === 'true')
		.every(
			(t) =>
				dom.window.document
					.getElementById(t.getAttribute('aria-controls'))
					?.getAttribute('role') === 'tabpanel',
		)
	assert.equal(activeLinks, true)
	results.push({ scenario, html, stops, activeLinks })
	dom.window.close()
}
writeFileSync('./cross-angular.json', JSON.stringify(results, null, 2))
