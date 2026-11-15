import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'

const framework = process.argv[2]
const fixtures = JSON.parse(readFileSync('./cross-' + framework + '.json', 'utf8'))
const dom = new JSDOM('<div id="root"></div>', {
	pretendToBeVisual: true,
	url: 'http://localhost',
	runScripts: 'outside-only',
})
// jsdom has no layout; this check covers node reuse and interaction only.
globalThis.ResizeObserver = class {
	observe() {}
	unobserve() {}
	disconnect() {}
}
for (const key of [
	'window',
	'document',
	'navigator',
	'Element',
	'HTMLElement',
	'SVGElement',
	'Node',
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
const diagnostics = []
console.warn = (...args) => diagnostics.push(args.map(String).join(' '))
console.error = (...args) => diagnostics.push(args.map(String).join(' '))
const { hydrate } = await import('./client/cross-client.js')
const results = []
for (const fixture of fixtures) {
	const container = document.getElementById('root')
	container.innerHTML = fixture.html
	if (framework === 'solid') {
		dom.window.eval(fixture.hydrationScript)
		globalThis._$HY = dom.window._$HY
	}
	const tabs = [...container.querySelectorAll('[role="tab"]')]
	const panels = [...container.querySelectorAll('[role="tabpanel"]')]
	const ids = [...tabs, ...panels].map((node) => node.id)
	const stop = await hydrate(framework, fixture.props, fixture.plan, container)
	await new Promise((resolve) => setTimeout(resolve, 50))
	assert.ok(tabs.every((node) => node.isConnected))
	assert.ok(panels.every((node) => node.isConnected))
	assert.deepEqual(
		[...tabs, ...panels].map((node) => node.id),
		ids,
	)
	const before = tabs.map((node) => node.getAttribute('tabindex'))
	assert.deepEqual(
		before,
		fixture.props.scenario === 'nested' ? ['-1', '0', '-1', '0'] : ['-1', '0'],
	)
	if (fixture.props.scenario === 'nested') {
		tabs[2].click()
		await new Promise((resolve) => setTimeout(resolve, 30))
		assert.equal(tabs[1].getAttribute('aria-selected'), 'true')
		assert.equal(tabs[2].getAttribute('aria-selected'), 'true')
	}
	tabs[0].click()
	await new Promise((resolve) => setTimeout(resolve, 30))
	assert.equal(container.querySelector('[role="tab"][aria-selected="true"]').textContent, 'Tab 0')
	assert.ok(container.querySelector('[role="tabpanel"]').textContent.includes('Panel 0'))
	results.push({
		scenario: fixture.props.scenario,
		sameTabs: true,
		samePanels: true,
		idsPreserved: true,
		stopsAfterHydration: before,
		switchedToFirst: true,
	})
	await stop()
}
assert.deepEqual(diagnostics, [])
writeFileSync(
	'./cross-hydration-' + framework + '.json',
	JSON.stringify({ results, diagnostics }, null, 2),
)
dom.window.close()
