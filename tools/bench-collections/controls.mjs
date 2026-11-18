import assert from 'node:assert/strict'
import { queryObjects } from 'node:v8'
import { setImmediate as turn } from 'node:timers/promises'
import { chromium } from 'playwright'
import { serve } from '../bench-pages/serve.mjs'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
const module = await import('./dist/after/react/server/react.js')
const ctor = module.prototypes.component
await turn()
global.gc()
const before = queryObjects(ctor)
const retained = Array.from({ length: 9 }, () => new ctor())
await turn()
global.gc()
const pinned = queryObjects(ctor)
assert.equal(pinned - before, 9, 'The Node object probe must detect a planted retained model')
retained.length = 0
await turn()
global.gc()
await turn()
const released = queryObjects(ctor)
assert.equal(released, before)
const { server, base } = serve(resolve(import.meta.dirname, 'dist/after/react/client'))
const browser = await chromium.launch({ headless: true })
let client
try {
	const page = await browser.newPage()
	await page.goto(base + 'react.html')
	await page.waitForFunction(() => Boolean(window.bench))
	const cdp = await page.context().newCDPSession(page)
	const count = async () => {
		await cdp.send('HeapProfiler.collectGarbage')
		return (await cdp.send('Memory.getDOMCounters')).nodes
	}
	await page.evaluate(() => bench.prepare(10, 'tabs', 'initial', 'soxa'))
	await page.evaluate(() => bench.mount())
	await page.evaluate(() => bench.unmount())
	const baseline = await count()
	await page.evaluate(async () => {
		await bench.mount()
		window.retainedNodes = [...document.querySelectorAll('#root *')]
		await bench.unmount()
	})
	const held = await count()
	assert.ok(held > baseline + 20, 'The browser probe must detect a planted DOM retention')
	await page.evaluate(() => {
		window.retainedNodes = []
	})
	await page.waitForTimeout(1200)
	const freed = await count()
	assert.ok(freed < held - 20)
	client = { baseline, held, freed }
} finally {
	await browser.close()
	await new Promise((resolve) => server.close(resolve))
}
writeFileSync(
	resolve(import.meta.dirname, 'results/controls.json'),
	JSON.stringify({ node: { before, pinned, released }, client }, null, 2),
)
