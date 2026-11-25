import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { once } from 'node:events'
import { createReadStream, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { chromium } from 'playwright'
import { build, loadConfigFromFile } from 'vite'
import { types, urlOf } from './pages.mjs'

const directory = path.resolve('results/angular-table-parity')
const { config } = await loadConfigFromFile(
	{ command: 'build', mode: 'production' },
	'vite.config.ts',
)
config.configFile = false
config.logLevel = 'error'
config.build.rollupOptions.input = { angular: path.resolve('angular.html') }
config.build.outDir = directory
await build(config)
const server = createServer((req, res) => {
	const file = path.join(directory, new URL(req.url, 'http://localhost').pathname)
	const stream = createReadStream(file)
	stream.on('error', () => res.writeHead(404).end())
	res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream')
	stream.pipe(res)
}).listen(0, '127.0.0.1')
await once(server, 'listening')
const base = 'http://127.0.0.1:' + server.address().port + '/'
const production = 'soxa+fit=none+width=3248+track'
const libs = ['material', 'soxa-direct', 'soxa-cdk', production]
const n = Number(process.argv[2] ?? 5000)
const repeats = Number(process.argv[3] ?? 3)
let browser
const packageVersion = (name) =>
	JSON.parse(readFileSync('node_modules/' + name + '/package.json', 'utf8')).version
const result = {
	commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
	date: new Date().toISOString(),
	angular: packageVersion('@angular/core'),
	material: packageVersion('@angular/material'),
	n,
	columns: 20,
	repeats,
	measurements: [],
	parity: {},
	parityPassed: false,
}
const save = () =>
	writeFileSync('results/angular-table-parity.json', JSON.stringify(result, null, 2))
const viewport = { width: 1600, height: 1000 }

async function withPage(lib, action) {
	const page = await browser.newPage({ viewport })
	const errors = []
	page.on('pageerror', (err) => errors.push(err.message))
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text())
	})
	try {
		await page.goto(base + urlOf('angular:' + lib))
		await page.waitForFunction(() => 'bench' in window)
		await action(page)
		assert.deepEqual(errors, [], lib)
	} finally {
		await page.close()
	}
}

try {
	browser = await chromium.launch({
		args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'],
	})
	result.browser = browser.version()
	for (let run = 0; run < repeats; run++) {
		const rotation = [...libs.slice(run % libs.length), ...libs.slice(0, run % libs.length)]
		for (const lib of rotation) {
			await withPage(lib, async (page) => {
				const before = await page.evaluate(() => (gc(), bench.info().heap))
				const render = await page.evaluate((n) => bench.render(n), n)
				const memory = (await page.evaluate(() => (gc(), bench.info().heap))) - before
				const cells = await page.locator('tbody td').count()
				assert.equal(cells, n * 21, lib)
				const select = await page.evaluate(() => bench.selectAll())
				assert.equal(await page.evaluate(() => bench.info().checked), n, lib)
				const deselect = await page.evaluate(() => bench.selectAll())
				assert.equal(await page.evaluate(() => bench.info().checked), 0, lib)
				const asc = await page.evaluate(() => bench.sort())
				const firstAsc = await page.evaluate(() => bench.info().first)
				const desc = await page.evaluate(() => bench.sort())
				const firstDesc = await page.evaluate(() => bench.info().first)
				assert.notEqual(firstAsc, firstDesc, lib)
				const replace = await page.evaluate((n) => bench.replace(n, 7), n)
				assert.equal(await page.evaluate(() => bench.info().rows), n, lib)
				const unmount = await page.evaluate(() => bench.clear())
				assert.equal(await page.evaluate(() => bench.info().rows), 0, lib)
				const after = await page.evaluate(async () => {
					await gc({ type: 'major', execution: 'async' })
					return bench.info().heap
				})
				const entry = {
					run,
					lib,
					memory,
					render,
					select,
					deselect,
					asc,
					desc,
					replace,
					unmount,
					afterUnmount: after - before,
					cells,
					firstAsc,
					firstDesc,
				}
				result.measurements.push(entry)
				save()
				console.log(JSON.stringify(entry))
			})
		}
	}

	for (const lib of ['material', 'soxa-direct', 'soxa-cdk']) {
		await withPage(lib, async (page) => {
			const fingerprint = () =>
				page.evaluate(async () => {
					const content = Array.from(document.querySelectorAll('tbody tr'), (row) =>
						Array.from(row.cells)
							.slice(1)
							.map((cell) => cell.textContent.trim())
							.join('\t'),
					).join('\n')
					const bytes = await crypto.subtle.digest(
						'SHA-256',
						new TextEncoder().encode(content),
					)
					return Array.from(new Uint8Array(bytes), (byte) =>
						byte.toString(16).padStart(2, '0'),
					).join('')
				})
			await page.evaluate((n) => bench.render(n), n)
			const initial = await fingerprint()
			const firstInput = page.locator('tbody tr:first-child input[type="checkbox"]')
			const headerInput = page.locator('thead input[type="checkbox"]')
			await firstInput.press('Space')
			await page.waitForFunction(() => bench.info().checked === 1)
			assert.equal(await headerInput.evaluate((input) => input.indeterminate), true, lib)
			await firstInput.press('Space')
			await page.waitForFunction(() => bench.info().checked === 0)
			const sortButton = page.locator('th.mat-column-name [role="button"]')
			await sortButton.press('Enter')
			await page.waitForFunction(
				() =>
					document.querySelector('th.mat-column-name').getAttribute('aria-sort') ===
					'ascending',
			)
			const asc = await fingerprint()
			await sortButton.press('Enter')
			await page.waitForFunction(
				() =>
					document.querySelector('th.mat-column-name').getAttribute('aria-sort') ===
					'descending',
			)
			const desc = await fingerprint()
			await page.evaluate((n) => bench.replace(n, 7), n)
			const replaced = await fingerprint()
			await sortButton.press('Enter')
			await page.waitForFunction(() =>
				['none', null].includes(
					document.querySelector('th.mat-column-name').getAttribute('aria-sort'),
				),
			)
			const reset = await fingerprint()
			result.parity[lib] = {
				initial,
				asc,
				desc,
				replaced,
				reset,
				keyboardAndIndeterminate: true,
			}
			save()
			console.log(lib, 'parity', JSON.stringify(result.parity[lib]))
		})
	}
	assert.deepEqual(result.parity['soxa-direct'], result.parity.material)
	assert.deepEqual(result.parity['soxa-cdk'], result.parity.material)
	result.parityPassed = true
	save()
} finally {
	await browser?.close()
	server.close()
}
