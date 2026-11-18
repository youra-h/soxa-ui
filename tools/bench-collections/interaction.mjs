import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { serve } from '../bench-pages/serve.mjs'
const run = process.argv.find((arg) => arg.startsWith('--run='))?.slice(6) ?? '2026-11-18-1000'
const folder = resolve(import.meta.dirname, 'results', run)
const rows = JSON.parse(readFileSync(resolve(folder, 'index.json'), 'utf8')).filter((row) =>
	row.id.endsWith('-client'),
)
for (const row of rows) {
	const cell = JSON.parse(readFileSync(row.file, 'utf8'))
	if (cell.error || cell.protocol !== 'client-v3-isolated-phases') continue
	if (process.argv.includes('--resume') && cell.interaction) continue
	const { server, base } = serve(
		resolve(import.meta.dirname, `dist/${cell.variant}/${cell.framework}/client`),
	)
	const browser = await chromium.launch({ headless: true })
	const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
	let timedOut = false,
		stage = 'mount',
		tabEntry
	const errors = [],
		samples = []
	const deadline = setTimeout(() => {
		timedOut = true
		void browser.close()
	}, 180000)
	page.on('pageerror', (error) => errors.push(String(error)))
	page.on('console', (message) => {
		if (['error', 'warning'].includes(message.type())) errors.push(message.text())
	})
	try {
		await page.goto(base + cell.framework + '.html')
		await page.waitForFunction(() => Boolean(window.bench))
		await page.evaluate((c) => bench.prepare(c.n, c.kind, c.mode, c.library), cell)
		await page.evaluate(() => bench.mount())
		if (cell.kind === 'tabs') {
			stage = 'Tab entry'
			await page.evaluate(() => {
				const sentinel = document.createElement('button')
				sentinel.id = 'bench-sentinel'
				document.getElementById('root').before(sentinel)
				sentinel.focus()
			})
			await page.keyboard.press('Tab')
			await page.waitForTimeout(50)
			tabEntry = await page.evaluate(() => {
				const focused = document.activeElement
				const tabs = [...document.querySelectorAll('[role=tab]')]
				const result = {
					valid:
						focused?.getAttribute('role') === 'tab' &&
						focused.getAttribute('aria-selected') === 'true',
					index: tabs.indexOf(focused),
					role: focused?.getAttribute('role'),
				}
				document.getElementById('bench-sentinel').remove()
				return result
			})
		}
		stage = 'selection'
		for (let i = -2; i < 7; i++) {
			const sample = await page.evaluate(
				async ({ kind, index }) => {
					const target = document.querySelectorAll(
						kind === 'tabs' ? '[role=tab]' : '[role=option], [data-bench-option]',
					)[index]
					const selected = () =>
						['aria-selected', 'aria-pressed', 'aria-checked'].some(
							(name) => target.getAttribute(name) === 'true',
						)
					const started = performance.now()
					const changed = new Promise((resolve, reject) => {
						const timer = setTimeout(() => {
							observer.disconnect()
							reject(Error('Selection did not reach the target'))
						}, 5000)
						const check = () => {
							if (selected()) {
								clearTimeout(timer)
								observer.disconnect()
								resolve(performance.now() - started)
							}
						}
						const observer = new MutationObserver(check)
						observer.observe(document.getElementById('root'), {
							subtree: true,
							attributes: true,
							attributeFilter: ['aria-selected', 'aria-pressed', 'aria-checked'],
						})
						const event = { bubbles: true, cancelable: true, button: 0, buttons: 1 }
						target.dispatchEvent(
							new PointerEvent('pointerdown', {
								...event,
								pointerType: 'mouse',
								isPrimary: true,
							}),
						)
						target.dispatchEvent(new MouseEvent('mousedown', event))
						target.focus()
						target.dispatchEvent(
							new PointerEvent('pointerup', {
								...event,
								buttons: 0,
								pointerType: 'mouse',
								isPrimary: true,
							}),
						)
						target.dispatchEvent(new MouseEvent('mouseup', { ...event, buttons: 0 }))
						target.click()
						check()
					})
					const domUpdateMs = await changed
					await new Promise((resolve) =>
						requestAnimationFrame(() => requestAnimationFrame(resolve)),
					)
					return {
						domUpdateMs,
						paintMs: performance.now() - started,
						selected: selected(),
					}
				},
				{ kind: cell.kind, index: Math.abs(i) % 2 === 0 ? 0 : cell.n - 1 },
			)
			if (i >= 0) samples.push(sample)
		}
		cell.interaction = {
			protocol: 'selection-v1-separate-phase',
			tabEntry,
			errors,
			samples,
			medianDomMs: [...samples].map((s) => s.domUpdateMs).sort((a, b) => a - b)[3],
			medianPaintMs: [...samples].map((s) => s.paintMs).sort((a, b) => a - b)[3],
			method: 'Synthetic complete pointer/mouse chain; MutationObserver to selected DOM, then two animation frames. Two warmup changes and seven alternating changes.',
		}
		stage = 'unmount'
		await page.evaluate(() => bench.unmount())
	} catch (error) {
		cell.interaction = {
			protocol: 'selection-v1-separate-phase',
			error: String(error.stack ?? error),
			stage,
			timedOut,
			tabEntry,
			errors,
			partialSamples: samples,
		}
	} finally {
		clearTimeout(deadline)
		await browser.close()
		await new Promise((resolve) => server.close(resolve))
	}
	writeFileSync(row.file, JSON.stringify(cell, null, 2))
	process.stdout.write(row.id + ' ' + JSON.stringify(cell.interaction) + '\n')
}
