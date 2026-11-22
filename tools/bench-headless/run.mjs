import { build, version as esbuildVersion } from 'esbuild'
import { chromium } from 'playwright'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { gzipSync, brotliCompressSync, constants } from 'node:zlib'
import { createHash } from 'node:crypto'
import { cpus, platform, release } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'

const root = path.dirname(fileURLToPath(import.meta.url))
const outputArg = process.argv.indexOf('--out')
const runName = new Date().toISOString().replace(/[:.]/g, '-')
const output =
	outputArg === -1
		? path.resolve(root, '../../benchmarks/headless/results', runName)
		: path.resolve(process.argv[outputArg + 1])
const cache = path.join(root, '.cache')
await mkdir(output, { recursive: true })
try {
	await readFile(path.join(output, 'run.json'))
	throw new Error('Choose a new --out directory; an existing run must not be overwritten')
} catch (error) {
	if (error.code !== 'ENOENT') throw error
}
await mkdir(cache, { recursive: true })
const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'))
const matrix = {
	empty: ['baseline'],
	soxa: ['form', 'tabs', 'dialog', 'select', 'combobox', 'app'],
	ark: ['form', 'tabs', 'dialog', 'select', 'combobox', 'app'],
	radix: ['form', 'tabs', 'dialog', 'select', 'app'],
}
const versions = Object.fromEntries(
	Object.entries(lock.packages)
		.filter(([key]) => key.startsWith('node_modules/'))
		.map(([key, info]) => [
			key.slice(13),
			{ version: info.version, resolved: info.resolved, integrity: info.integrity },
		]),
)
const report = {
	date: new Date().toISOString(),
	protocol: 'supported-recipes-v2',
	environment: {
		node: process.version,
		os: platform(),
		release: release(),
		cpu: cpus()[0]?.model,
		esbuild: esbuildVersion,
	},
	policy: {
		themes: false,
		icons: false,
		applicationCSS: false,
		production: true,
		builds: 3,
		ssr: 'renderToString',
		hydration: 'hydrateRoot',
		size: 'full standalone entry including React and ReactDOM, not baseline-subtracted',
		compression: 'per file: gzip level 9, Brotli quality 11',
	},
	versions,
	fixtures: [],
}
const responses = new Map()

function snapshot() {
	const tabs = [...document.querySelectorAll('[role="tab"]')].map((node) => ({
		id: node.id,
		text: node.textContent,
		selected: node.getAttribute('aria-selected'),
		tabIndex: node.getAttribute('tabindex'),
		controls: node.getAttribute('aria-controls'),
	}))
	const panels = [...document.querySelectorAll('[role="tabpanel"]')].map((node) => ({
		text: node.textContent,
		hidden: node.hidden,
		display: getComputedStyle(node).display,
		id: node.id,
		labelledby: node.getAttribute('aria-labelledby'),
	}))
	const brokenReferences = [
		...document.querySelectorAll('[aria-controls],[aria-labelledby],[aria-describedby]'),
	].flatMap((node) =>
		['aria-controls', 'aria-labelledby', 'aria-describedby'].flatMap((attr) =>
			(node.getAttribute(attr) || '')
				.split(/\s+/)
				.filter(Boolean)
				.filter((id) => !document.getElementById(id))
				.map((id) => ({ attr, id, text: node.textContent?.slice(0, 80) })),
		),
	)
	return {
		tabs,
		panels,
		tablists: [...document.querySelectorAll('[role=tablist]')].map((node) => ({
			tabIndex: node.getAttribute('tabindex'),
		})),
		brokenReferences,
		stylesheets: document.styleSheets.length,
		title: document.title,
	}
}

for (const [library, scenarios] of Object.entries(matrix)) {
	for (const scenario of scenarios) {
		const key = `${library}-${scenario}`
		console.log(`Build ${key}`)
		const symbol =
			library === 'empty' ? 'Demo' : `${scenario[0].toUpperCase()}${scenario.slice(1)}Demo`
		const source = `import { ${symbol} as Demo } from './src/${library}.tsx';`
		const ssrEntry = `${source} export { Demo };`
		const serverPath = path.join(cache, `${key}.mjs`)
		await build({
			stdin: { contents: ssrEntry, resolveDir: root, loader: 'tsx' },
			bundle: true,
			packages: 'external',
			platform: 'node',
			format: 'esm',
			jsx: 'automatic',
			outfile: serverPath,
			logLevel: 'silent',
		})
		const { Demo } = await import(pathToFileURL(serverPath).href)
		const { createElement } = await import('react')
		const { renderToString } = await import('react-dom/server')
		const ssrWarnings = []
		const originalError = console.error
		const originalWarn = console.warn
		console.error = (...args) => ssrWarnings.push(args.map(String).join(' '))
		console.warn = (...args) => ssrWarnings.push(args.map(String).join(' '))
		let html
		try {
			html = renderToString(createElement(Demo))
		} finally {
			console.error = originalError
			console.warn = originalWarn
		}
		await writeFile(path.join(output, `${key}.html`), html)
		const contents = `${source} import { createElement } from 'react'; import { hydrateRoot } from 'react-dom/client'; const initialNodes = [...document.getElementById('root').querySelectorAll('*')]; hydrateRoot(document.getElementById('root'), createElement(Demo), { onRecoverableError(error) { console.error('HYDRATION', error.message) } }); requestAnimationFrame(() => requestAnimationFrame(() => { window.preservedServerNodes = initialNodes.every(node => node.isConnected); window.fixtureReady = true }));`
		const sizes = []
		let files
		let inputs
		let attribution
		let bundleHash
		for (let repeat = 0; repeat < 3; repeat++) {
			const built = await build({
				stdin: { contents, resolveDir: root, loader: 'tsx' },
				bundle: true,
				platform: 'browser',
				format: 'esm',
				jsx: 'automatic',
				minify: true,
				treeShaking: true,
				target: 'es2022',
				define: { 'process.env.NODE_ENV': '"production"' },
				write: false,
				outfile: path.join(cache, `${key}.js`),
				metafile: true,
				logLevel: 'silent',
			})
			files = built.outputFiles
			inputs = Object.keys(built.metafile.inputs)
			attribution = Object.entries(built.metafile.outputs)
				.flatMap(([output, details]) =>
					Object.entries(details.inputs)
						.filter(([, info]) => info.bytesInOutput > 0)
						.map(([input, info]) => ({
							output: path.basename(output),
							input,
							bytes: info.bytesInOutput,
						})),
				)
				.sort((left, right) => right.bytes - left.bytes)
			bundleHash = createHash('sha256')
				.update(built.outputFiles.find((file) => file.path.endsWith('.js')).contents)
				.digest('hex')
			assert(
				!inputs.some((input) => /theme-oren|icons-material/.test(input)),
				'Theme or icon input in headless fixture',
			)
			const size = { js: { raw: 0, gzip: 0, brotli: 0 }, css: { raw: 0, gzip: 0, brotli: 0 } }
			for (const file of files) {
				const kind = file.path.endsWith('.css') ? 'css' : 'js'
				size[kind].raw += file.contents.length
				size[kind].gzip += gzipSync(file.contents, { level: 9 }).length
				size[kind].brotli += brotliCompressSync(file.contents, {
					params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
				}).length
			}
			sizes.push(size)
		}
		assert(
			sizes.every((size) => JSON.stringify(size) === JSON.stringify(sizes[0])),
			'Non-deterministic bundle sizes',
		)
		assert.equal(sizes[0].css.raw, 0, 'Unexpected stylesheet')
		const js = files.find((file) => file.path.endsWith('.js')).text
		responses.set(`/${key}.js`, ['text/javascript', js])
		responses.set(`/${key}`, [
			'text/html',
			`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${key}</title></head><body><main id="root">${html}</main><script type="module" src="/${key}.js"></script></body></html>`,
		])
		report.fixtures.push({
			library,
			scenario,
			key,
			sizes,
			ssrWarnings,
			inputs,
			attribution,
			bundleHash,
		})
	}
}

const server = createServer((request, response) => {
	const item = responses.get(request.url)
	response.writeHead(item ? 200 : 404, { 'Content-Type': item?.[0] || 'text/plain' })
	response.end(item?.[1] || 'Not found')
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true })
report.environment.browser = browser.version()
try {
	for (const fixture of report.fixtures) {
		console.log(`Browser ${fixture.key}`)
		const staticContext = await browser.newContext({ javaScriptEnabled: false })
		const staticPage = await staticContext.newPage()
		await staticPage.goto(`${base}/${fixture.key}`)
		fixture.beforeHydration = await staticPage.evaluate(snapshot)
		await staticContext.close()
		const context = await browser.newContext()
		const page = await context.newPage()
		page.setDefaultTimeout(3500)
		const diagnostics = []
		page.on('console', (msg) => {
			if (['error', 'warning'].includes(msg.type()))
				diagnostics.push({ type: msg.type(), text: msg.text() })
		})
		page.on('pageerror', (error) =>
			diagnostics.push({ type: 'pageerror', text: error.message }),
		)
		fixture.checks = []
		async function check(name, action) {
			try {
				await action()
				fixture.checks.push({ name, pass: true })
			} catch (error) {
				fixture.checks.push({
					name,
					pass: false,
					error: error.message.split('\n').slice(0, 5).join('\n'),
				})
			}
		}
		await page.goto(`${base}/${fixture.key}`)
		await page.waitForFunction(() => window.fixtureReady === true)
		await page.waitForTimeout(100)
		fixture.afterHydration = await page.evaluate(snapshot)
		fixture.preservedServerNodes = await page.evaluate(() => window.preservedServerNodes)
		if (['tabs', 'app'].includes(fixture.scenario)) {
			await check(
				'SSR: selected Alpha, active panel and reciprocal active references',
				async () => {
					const state = fixture.beforeHydration
					fixture.ssrTabStops = state.tabs.filter((tab) => tab.tabIndex === '0').length
					assert.equal(state.tabs.find((tab) => tab.text === 'Alpha')?.selected, 'true')
					assert(
						state.panels.some(
							(panel) =>
								panel.text === 'Alpha panel' &&
								!panel.hidden &&
								panel.display !== 'none',
						),
					)
					assert(
						state.tabs.find((tab) => tab.selected === 'true')?.controls ===
							state.panels.find((panel) => !panel.hidden)?.id,
					)
					assert(
						state.panels.find((panel) => !panel.hidden)?.labelledby ===
							state.tabs.find((tab) => tab.selected === 'true')?.id,
					)
				},
			)
			await check('Tab enters the tab strip after hydration', async () => {
				if (fixture.scenario === 'app')
					await page.getByRole('checkbox', { name: 'Accept', exact: true }).focus()
				await page.keyboard.press('Tab')
				assert.equal(
					await page.evaluate(() => document.activeElement?.getAttribute('role')),
					'tab',
				)
			})
			await check('ArrowRight selects Beta and shows Beta panel', async () => {
				await page.getByRole('tab', { name: 'Alpha', exact: true }).focus()
				await page.keyboard.press('ArrowRight')
				await page.waitForFunction(() =>
					[...document.querySelectorAll('[role="tab"]')].some(
						(node) =>
							node.textContent === 'Beta' &&
							node.getAttribute('aria-selected') === 'true',
					),
				)
				assert(
					await page.getByRole('tabpanel').filter({ hasText: 'Beta panel' }).isVisible(),
				)
			})
		}
		if (['form', 'app'].includes(fixture.scenario)) {
			await check('Labelled Name input accepts text', async () => {
				const field = page.getByRole('textbox', { name: 'Name', exact: true })
				await field.fill('Ada')
				assert.equal(await field.inputValue(), 'Ada')
			})
			await check('Labelled Accept checkbox toggles by Space', async () => {
				const checkbox = page.getByRole('checkbox', { name: 'Accept', exact: true })
				await checkbox.focus()
				await page.keyboard.press('Space')
				assert(await checkbox.isChecked())
				fixture.formData = await page
					.locator('form')
					.evaluate((form) => Object.fromEntries(new FormData(form)))
				assert.equal(fixture.formData.name, 'Ada')
				assert(Object.hasOwn(fixture.formData, 'accept'))
			})
		}
		if (['dialog', 'app'].includes(fixture.scenario)) {
			await check(
				'Open labelled dialog, Escape closes and returns trigger focus',
				async () => {
					const trigger = page.getByRole('button', { name: 'Open', exact: true })
					await trigger.click()
					const dialog = page.getByRole('dialog', { name: 'Settings', exact: true })
					await dialog.waitFor({ state: 'visible' })
					fixture.openDialog = await page.evaluate(() => ({
						focusInside: !!document.activeElement?.closest('[role="dialog"]'),
						dialogs: document.querySelectorAll('[role="dialog"]').length,
					}))
					await page.waitForFunction(
						() => !!document.activeElement?.closest('[role=dialog]'),
					)
					fixture.openDialog.focusInside = true
					await page.keyboard.press('Escape')
					await dialog.waitFor({ state: 'hidden' })
					await page.waitForFunction(() => document.activeElement?.textContent === 'Open')
				},
			)
		}
		if (['select', 'combobox', 'app'].includes(fixture.scenario)) {
			await check('Choice has accessible name; choose Beta', async () => {
				const control = page.getByRole('combobox', { name: 'Choice', exact: true })
				await control.click()
				await page.keyboard.press('ArrowDown')
				const option = page.getByRole('option', { name: 'Beta', exact: true })
				await option.click()
				const value = await control.evaluate((node) =>
					node instanceof HTMLInputElement ? node.value : node.textContent,
				)
				assert.match(value || '', /Beta/)
			})
			if (fixture.scenario === 'combobox')
				await check('Typing Bet filters out Alpha', async () => {
					const input = page.getByRole('combobox', { name: 'Choice', exact: true })
					await input.fill('Bet')
					await page.keyboard.press('ArrowDown')
					await page
						.getByRole('option', { name: 'Beta', exact: true })
						.waitFor({ state: 'visible' })
					assert.equal(
						await page.getByRole('option', { name: 'Alpha', exact: true }).count(),
						0,
					)
				})
		}
		await check('Hydration without diagnostics', async () => {
			assert.equal(fixture.ssrWarnings.length, 0)
			assert.equal(diagnostics.length, 0)
		})
		fixture.diagnostics = diagnostics
		await page.screenshot({ path: path.join(cache, `${fixture.key}.png`) })
		await context.close()
	}
} finally {
	await browser.close()
	await new Promise((resolve) => server.close(resolve))
}
report.summary = {
	fixtures: report.fixtures.length,
	checks: report.fixtures.flatMap((item) => item.checks).length,
	findings: report.fixtures.flatMap((item) =>
		item.checks
			.filter((check) => !check.pass)
			.map((check) => ({ fixture: item.key, check: check.name })),
	),
	diagnostics: report.fixtures.flatMap((item) => item.diagnostics).length,
}
await writeFile(path.join(output, 'run.json'), JSON.stringify(report, null, 2) + '\n')
console.log(
	JSON.stringify(
		report.fixtures.map(({ key, sizes, checks, diagnostics }) => ({
			key,
			size: sizes[0],
			checks,
			diagnostics,
		})),
		null,
		2,
	),
)
