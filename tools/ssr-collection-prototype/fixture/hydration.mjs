import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import * as react from './react.mjs'

/** Browser globals stay in this process; server-only benchmarks run separately. */
async function hydrationCheck() {
	const { html, element } = react.prototype({})
	const dom = new JSDOM('<div id="root">' + html + '</div>', {
		pretendToBeVisual: true,
		url: 'http://localhost',
	})
	const names = [
		'window',
		'document',
		'navigator',
		'Element',
		'HTMLElement',
		'Node',
		'Event',
		'MouseEvent',
		'MutationObserver',
		'getComputedStyle',
		'requestAnimationFrame',
		'cancelAnimationFrame',
	]
	const saved = new Map(
		names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
	)
	const errors = []
	const recoverable = []
	const savedError = console.error
	const savedWarn = console.warn
	let root

	for (const name of names) {
		const value = dom.window[name]
		Object.defineProperty(globalThis, name, {
			configurable: true,
			writable: true,
			value:
				typeof value === 'function' &&
				['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame'].includes(name)
					? value.bind(dom.window)
					: value,
		})
	}
	globalThis.IS_REACT_ACT_ENVIRONMENT = true
	console.error = (...args) => errors.push(args.map(String).join(' '))
	console.warn = (...args) => errors.push(args.map(String).join(' '))

	try {
		const { act } = await import('react')
		const { hydrateRoot } = await import('react-dom/client')
		const container = document.getElementById('root')
		const initialTab = container.querySelector('[role="tab"]')
		const initialPanel = container.querySelector('[role="tabpanel"]')

		await act(async () => {
			root = hydrateRoot(container, element, {
				onRecoverableError: (error) => recoverable.push(String(error)),
			})
			await new Promise((resolve) => setTimeout(resolve, 30))
		})

		assert.equal(container.querySelector('[role="tab"]'), initialTab)
		assert.equal(container.querySelector('[role="tabpanel"]'), initialPanel)
		assert.equal(container.querySelector('[aria-selected="true"]').textContent, 'Tab 1')

		await act(async () => initialTab.click())

		assert.equal(container.querySelector('[role="tabpanel"]').textContent, 'Panel 0')
		await act(async () => root.unmount())
		root = undefined
		assert.deepEqual(errors, [])
		assert.deepEqual(recoverable, [])

		return {
			sameTabNode: true,
			samePanelNode: true,
			switchedToFirst: true,
			errors,
			recoverable,
		}
	} finally {
		if (root) root.unmount()
		console.error = savedError
		console.warn = savedWarn
		delete globalThis.IS_REACT_ACT_ENVIRONMENT

		for (const [name, descriptor] of saved) {
			if (descriptor) Object.defineProperty(globalThis, name, descriptor)
			else Reflect.deleteProperty(globalThis, name)
		}
		dom.window.close()
	}
}

const result = await hydrationCheck()
writeFileSync(new URL('./hydration-report.json', import.meta.url), JSON.stringify(result, null, 2))
console.log(JSON.stringify({ hydration: result }))
