import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'

const fixture = JSON.parse(readFileSync('./cross-angular.json', 'utf8')).find(
	(f) => f.scenario === process.argv[2],
)
const dom = new JSDOM(fixture.html, { pretendToBeVisual: true, url: 'http://localhost' })
for (const key of [
	'window',
	'document',
	'navigator',
	'Element',
	'HTMLElement',
	'Node',
	'NodeFilter',
	'Text',
	'Comment',
	'Event',
	'MouseEvent',
	'MutationObserver',
	'getComputedStyle',
	'requestAnimationFrame',
	'cancelAnimationFrame',
]) {
	const value = dom.window[key]
	Object.defineProperty(globalThis, key, {
		configurable: true,
		value:
			typeof value === 'function' &&
			['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame'].includes(key)
				? value.bind(dom.window)
				: value,
	})
}
globalThis.ResizeObserver = class {
	observe() {}
	unobserve() {}
	disconnect() {}
}
const diagnostics = []
console.warn = (...args) => diagnostics.push(args.map(String).join(' '))
console.error = (...args) => diagnostics.push(args.map(String).join(' '))
const { createApp, providers } = await import('./cross-angular-app.mjs')
const { bootstrapApplication } = await import('@angular/platform-browser')
const { destroyPlatform } = await import('@angular/core')
const tabs = [...document.querySelectorAll('[role="tab"]')]
const panels = [...document.querySelectorAll('[role="tabpanel"]')]
const app = await bootstrapApplication(createApp(fixture.scenario), { providers: providers() })
await app.whenStable()
assert.ok(tabs.every((t) => t.isConnected))
assert.ok(panels.every((t) => t.isConnected))
tabs[0].click()
await app.whenStable()
assert.equal(document.querySelector('[role="tab"][aria-selected="true"]').textContent, 'Tab 0')
assert.ok(document.querySelector('[role="tabpanel"]').textContent.includes('Panel 0'))
destroyPlatform()
assert.deepEqual(diagnostics, [])
writeFileSync(
	'./cross-hydration-angular-' + fixture.scenario + '.json',
	JSON.stringify(
		{
			scenario: fixture.scenario,
			sameTabs: true,
			samePanels: true,
			switchedToFirst: true,
			diagnostics,
		},
		null,
		2,
	),
)
dom.window.close()
