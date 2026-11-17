import { createServer } from 'vite'
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import config from './vitest.config.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const rows = []
const server = await createServer({
	root: here,
	configFile: false,
	resolve: config.resolve,
	server: { host: '127.0.0.1', port: 0, fs: { allow: [path.resolve(here, '../../..')] } },
	plugins: [
		{
			name: 'transaction-test-page',
			configureServer(server) {
				server.middlewares.use(async (request, response, next) => {
					if (request.url !== '/') return next()
					response.setHeader('content-type', 'text/html')
					response.end(
						await server.transformIndexHtml(
							'/',
							'<!doctype html><html><body><div id="app"></div><script type="module" src="/browser-app.tsx"></script></body></html>',
						),
					)
				})
			},
		},
		...config.plugins,
	],
})
await server.listen()
const address = server.httpServer.address()
const browser = await chromium.launch({ headless: true })
try {
	const page = await browser.newPage()
	const diagnostics = []
	page.on('console', (message) => {
		if (['error', 'warning'].includes(message.type()))
			diagnostics.push(message.type() + ': ' + message.text())
	})
	page.on('pageerror', (error) => diagnostics.push(String(error)))
	await page.goto(`http://127.0.0.1:${address.port}/`)
	await page.waitForFunction(() => !!Reflect.get(window, 'transactionHarness'))
	for (let round = 0; round < 3; round++) {
		await page.evaluate(() => Reflect.get(window, 'transactionHarness').mount())
		await page.locator('[data-waiting]').waitFor()
		await page.waitForFunction(() => {
			const state = Reflect.get(window, 'transactionHarness').snapshot()
			return (
				state.counters.rollback > 0 && state.pending === 0 && state.values.join(',') === 'a'
			)
		})
		const afterRollback = await page.evaluate(() =>
			Reflect.get(window, 'transactionHarness').snapshot(),
		)
		await page.evaluate(() => Reflect.get(window, 'transactionHarness').resolve())
		await page.getByRole('tab', { name: 'B', exact: true }).waitFor()
		await page.waitForFunction(
			() => Reflect.get(window, 'transactionHarness').snapshot().pending === 0,
		)
		const afterRetry = await page.evaluate(() =>
			Reflect.get(window, 'transactionHarness').snapshot(),
		)
		assert.deepEqual(afterRetry.values, ['a', 'b'])
		await page.getByRole('tab', { name: 'A', exact: true }).click()
		await page.getByRole('tabpanel').filter({ hasText: 'PANEL-a' }).waitFor()
		await page.getByRole('tab', { name: 'B', exact: true }).click()
		await page.getByRole('tabpanel').filter({ hasText: 'PANEL-b' }).waitFor()
		rows.push({ name: 'late-suspense-retry', round, afterRollback, afterRetry })
		await page.evaluate(() => Reflect.get(window, 'transactionHarness').unmount())
	}
	await page.evaluate(() => Reflect.get(window, 'transactionHarness').mount(true))
	await page.waitForFunction(() => {
		const state = Reflect.get(window, 'transactionHarness').snapshot()
		return state.pending === 0 && state.values.join(',') === 'a,b' && state.counters.rebuild > 0
	})
	rows.push({
		name: 'rollback-before-attach',
		state: await page.evaluate(() => Reflect.get(window, 'transactionHarness').snapshot()),
	})
	await page.evaluate(() => Reflect.get(window, 'transactionHarness').unmount())
	rows.push({ name: 'diagnostics', messages: diagnostics })
	assert.deepEqual(diagnostics, [])
	console.log(
		JSON.stringify(
			{ browser: await browser.version(), cases: rows.length - 1, diagnostics },
			null,
			2,
		),
	)
} catch (error) {
	rows.push({ name: 'failure', error: String(error) })
	process.exitCode = 1
} finally {
	mkdirSync(path.join(here, 'results'), { recursive: true })
	writeFileSync(
		path.join(here, 'results/browser.json'),
		JSON.stringify({ browser: await browser.version(), rows }, null, 2),
	)
	await browser.close()
	await server.close()
}
