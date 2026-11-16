import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const fixture = process.argv[2]
if (!fixture) throw new Error('Pass the temporary fixture directory printed by compare.mjs')
const output = new URL('./results/browser.json', import.meta.url)
writeFileSync(
	path.join(fixture, 'index.html'),
	'<!doctype html><html><body><div id="app"></div><script type="module" src="/browser-app.tsx"></script></body></html>',
)
const server = await createServer({
	root: fixture,
	configFile: false,
	plugins: [react()],
	cacheDir: path.join(fixture, 'vite-cache'),
	server: { host: '127.0.0.1', port: 0 },
})
await server.listen()
const address = server.httpServer.address()
const browser = await chromium.launch({ headless: true })
const source = JSON.parse(readFileSync(path.join(fixture, 'server-results.json'), 'utf8'))
const rows = []
try {
	for (const library of ['ark', 'radix', 'shadcn-radix', 'shadcn-base']) {
		const page = await browser.newPage()
		const diagnostics = []
		page.on('console', (message) => {
			if (['error', 'warning'].includes(message.type()))
				diagnostics.push(message.type() + ': ' + message.text())
		})
		page.on('pageerror', (error) => diagnostics.push(String(error)))
		try {
			await page.goto(`http://127.0.0.1:${address.port}/`)
			await page.waitForFunction(() => !!window.harness)
			const html = source.find(
				(row) => row.library === library && row.name === 'sync' && row.selected === 'b',
			).html
			await page.evaluate(({ library, html }) => window.harness.mount(library, html), {
				library,
				html,
			})
			await page.getByRole('tabpanel').filter({ hasText: 'PANEL-b' }).waitFor()
			const hydrated = await page.evaluate(() => window.harness.snapshot())
			await page.getByRole('tab', { name: 'A', exact: true }).click()
			await page.getByRole('tabpanel').filter({ hasText: 'PANEL-a' }).waitFor()
			const afterClick = await page.evaluate(() => window.harness.snapshot())
			await page.reload()
			await page.waitForFunction(() => !!window.harness)
			await page.evaluate((library) => window.harness.mount(library), library)
			await page.locator('[data-fallback]').waitFor()
			await page.getByRole('tab', { name: 'A', exact: true }).focus()
			await page.keyboard.press('ArrowRight')
			await page.waitForFunction(() => document.activeElement?.textContent === 'C')
			const duringFallback = await page.evaluate(() => window.harness.snapshot())
			await page.evaluate(() => window.harness.resolve())
			await page.getByRole('tab', { name: 'B', exact: true }).waitFor()
			await page.getByRole('tab', { name: 'B', exact: true }).click()
			await page.getByRole('tabpanel').filter({ hasText: 'PANEL-b' }).waitFor()
			const resolved = await page.evaluate(() => window.harness.snapshot())
			await page.reload()
			await page.waitForFunction(() => !!window.harness)
			await page.evaluate((library) => window.harness.mount(library), library)
			await page.locator('[data-fallback]').waitFor()
			await page.evaluate(() => window.harness.remove())
			await page.locator('[data-fallback]').waitFor({ state: 'detached' })
			await page.getByRole('tab', { name: 'A', exact: true }).focus()
			await page.keyboard.press('ArrowRight')
			await page.waitForFunction(() => document.activeElement?.textContent === 'C')
			const removed = await page.evaluate(() => window.harness.snapshot())
			rows.push({
				library,
				hydrated,
				afterClick,
				duringFallback,
				resolved,
				removed,
				diagnostics,
			})
		} catch (error) {
			rows.push({ library, error: String(error), diagnostics })
		}
		await page.close()
	}
	writeFileSync(output, JSON.stringify({ browser: await browser.version(), rows }, null, 2))
	console.log(
		JSON.stringify(
			rows.map((row) => ({
				library: row.library,
				error: row.error,
				diagnostics: row.diagnostics,
				focusedWhileSuspended: row.duringFallback?.focused,
				focusedAfterRemoval: row.removed?.focused,
			})),
			null,
			2,
		),
	)
} finally {
	await browser.close()
	await server.close()
}
