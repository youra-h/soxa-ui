import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'
import { quality } from './quality.mjs'

export async function browserCase(base, entry, cell, output) {
	const browser = await chromium.launch({ headless: true })
	const page = await browser.newPage({
		viewport: { width: 1440, height: 900 },
		deviceScaleFactor: 1,
	})
	const started = Date.now(),
		errors = [],
		times = [],
		rounds = []
	let stage = 'load',
		timedOut = false,
		verified,
		baseline,
		settled
	const deadline = setTimeout(() => {
		timedOut = true
		void browser.close()
	}, 180000)
	page.on('pageerror', (error) => errors.push(String(error)))
	page.on('crash', () => errors.push('Renderer crashed'))
	page.on('console', (message) => {
		if (['error', 'warning'].includes(message.type())) errors.push(message.text())
	})
	try {
		await page.goto(base + entry)
		await page.waitForFunction(() => Boolean(window.bench), null, { timeout: 60000 })
		await page.addScriptTag({ content: `window.benchQuality=${quality.toString()}` })
		await page.evaluate((c) => bench.prepare(c.n, c.kind, c.mode, c.library), cell)
		stage = 'warmup'
		for (let i = 0; i < 3; i++) {
			await page.evaluate(() => bench.mount())
			await page.evaluate(() => bench.unmount())
		}
		// Latency has no heap collection or prototype inspection between samples.
		stage = 'latency'
		for (let i = 0; i < 7; i++) {
			times.push(await page.evaluate(() => bench.mount()))
			if (i === 0) {
				verified = await page.evaluate(
					(c) => benchQuality(document, c.n, c.kind, c.library),
					cell,
				)
			}
			await page.evaluate(() => bench.unmount())
		}
		stage = 'memory'
		const cdp = await page.context().newCDPSession(page)
		await cdp.send('Performance.enable')
		// queryObjects can stall fine-grained reactive graphs; all client participants
		// use the same non-enumerating heap/DOM/listener protocol instead.
		async function measure() {
			await cdp.send('HeapProfiler.collectGarbage')
			await cdp.send('HeapProfiler.collectGarbage')
			const { metrics } = await cdp.send('Performance.getMetrics')
			const val = (name) => metrics.find((m) => m.name === name)?.value
			return {
				heapUsed: val('JSHeapUsedSize'),
				nodes: val('Nodes'),
				listeners: val('JSEventListeners'),
			}
		}
		baseline = await measure()
		for (let i = 0; i < 7; i++) {
			await page.evaluate(() => bench.mount())
			const mounted = await measure()
			await page.evaluate(() => bench.unmount())
			await page.waitForTimeout(50)
			rounds.push({ cycle: i + 1, mounted, afterUnmount: await measure() })
		}
		await page.waitForTimeout(1200)
		settled = await measure()
		writeFileSync(
			output,
			JSON.stringify(
				{
					...cell,
					protocol: 'client-v3-isolated-phases',
					quality: verified,
					errors,
					latency: {
						samples: times,
						medianDomMs: [...times].map((t) => t.domMs).sort((a, b) => a - b)[3],
						medianPaintMs: [...times].map((t) => t.paintMs).sort((a, b) => a - b)[3],
					},
					baseline,
					rounds,
					settled,
					browser: browser.version(),
				},
				null,
				2,
			),
		)
	} catch (error) {
		writeFileSync(
			output,
			JSON.stringify(
				{
					...cell,
					protocol: 'client-v3-isolated-phases',
					stage,
					timedOut,
					elapsedMs: Date.now() - started,
					error: String(error.stack ?? error),
					errors,
					partialLatency: times,
					rounds,
					quality: verified,
				},
				null,
				2,
			),
		)
	} finally {
		clearTimeout(deadline)
		await browser.close()
	}
}
