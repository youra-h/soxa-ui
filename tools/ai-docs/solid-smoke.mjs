import { documentationRelease } from './release.mjs'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { serve, checkPage, missingReferences } from './consumer-browser.mjs'
import { buildCorpus, selectDocuments } from './corpus.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const release = documentationRelease(root)
const { version, legacy } = release
const directory =
	process.env.SOXA_SOLID_SMOKE_DIR || mkdtempSync(join(tmpdir(), 'soxa-solid-docs-'))
const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Run with npm run check:ai-docs:solid')
const run = (args, cwd) => execFileSync(process.execPath, args, { cwd, stdio: 'inherit' })
const digest = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const evidence = {
	provenance: 'published-' + version,
	docsRevision: execFileSync('git', ['rev-parse', 'HEAD'], {
		cwd: root,
		encoding: 'utf8',
	}).trim(),
	nodeVersion: process.version,
	tools: ['solid-smoke.mjs', 'consumer-browser.mjs', 'corpus.mjs'].map((file) => ({
		path: 'tools/ai-docs/' + file,
		sha256: digest(join(root, 'tools/ai-docs', file)),
	})),
	consumers: [],
}
const failures = []
console.log('Solid consumer workspace: ' + directory)
for (const ssr of [false, true]) {
	const name = ssr ? 'solidstart' : 'solid'
	const cwd = join(directory, name)
	cpSync(join(root, `docs/ai/${version}/examples`, name), cwd, { recursive: true })
	const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'))
	run([npmCli, 'install', '--no-audit', '--no-fund'], cwd)
	execFileSync(process.execPath, [npmCli, 'ls', '--all', '--omit=optional'], {
		cwd,
		stdio: 'pipe',
	})
	const lock = JSON.parse(readFileSync(join(cwd, 'package-lock.json'), 'utf8'))
	for (const [dependency, version] of Object.entries({
		...pkg.dependencies,
		...pkg.devDependencies,
	})) {
		assert.equal(lock.packages['node_modules/' + dependency].version, version)
	}
	const packages = Object.entries(lock.packages)
		.filter(([path]) => path.includes('node_modules/@soxa-ui/'))
		.map(([path, entry]) => {
			const dependency = path.slice(path.lastIndexOf('node_modules/') + 13)
			assert.equal(entry.version, release.packages[dependency])
			assert.ok(entry.resolved.startsWith('https://registry.npmjs.org/'))
			assert.ok(entry.integrity)
			assert.equal(
				Object.keys(lock.packages).filter((p) => p.endsWith('node_modules/' + dependency))
					.length,
				1,
			)
			return {
				name: dependency,
				version: entry.version,
				resolved: entry.resolved,
				integrity: entry.integrity,
			}
		})
	const result = {
		name,
		packages,
		lockSha256: digest(join(cwd, 'package-lock.json')),
		strictTypes: false,
		browser: false,
	}
	evidence.consumers.push(result)
	result.inputs = readdirSync(join(root, `docs/ai/${version}/examples`, name), {
		recursive: true,
	})
		.filter((file) => /\.(?:tsx?|json|html)$/.test(file))
		.map((file) => ({
			path: name + '/' + file.replaceAll('\\', '/'),
			sha256: digest(join(cwd, file)),
		}))
	result.apiSha256 = digest(join(cwd, 'node_modules/@soxa-ui/setup/dist/api.json'))
	if (!ssr) {
		cpSync(join(root, 'docs/ai'), join(directory, 'source/docs/ai'), { recursive: true })
		cpSync(join(root, 'tools/ai-docs'), join(directory, 'source/tools/ai-docs'), {
			recursive: true,
		})
		const corpus = buildCorpus({
			manifestPath: join(directory, `source/docs/ai/${version}/manifest.json`),
			packageRoot: join(cwd, 'node_modules/@soxa-ui/setup'),
			docsRevision: evidence.docsRevision,
		})
		const selected = selectDocuments(corpus, {
			version,
			audience: 'consumer',
			framework: 'solid',
		})
		assert.ok(selected.some((doc) => doc.id === 'solid-start'))
		assert.ok(selected.every((doc) => ['all', 'solid'].includes(doc.framework)))
		mkdirSync(join(directory, 'corpus'), { recursive: true })
		for (const doc of selected)
			writeFileSync(
				join(directory, 'corpus', doc.id + '.json'),
				JSON.stringify(doc, null, 2) + '\n',
			)
		evidence.corpusInputs = selected.map((doc) => ({
			id: doc.id,
			sha256: digest(join(directory, 'corpus', doc.id + '.json')),
		}))
	}
	try {
		run([npmCli, 'run', 'check'], cwd)
		result.strictTypes = true
	} catch {
		failures.push(name + ' strict typecheck failed')
	}
	run([npmCli, 'run', 'build'], cwd)
	result.productionBuild = true
	const browser = await chromium.launch({ headless: true })
	let production
	try {
		production = await serve(
			cwd,
			ssr
				? ['.output/server/index.mjs']
				: [
						'node_modules/vite/bin/vite.js',
						'preview',
						'--host',
						'127.0.0.1',
						'--port',
						'0',
					],
			{ probe: !ssr },
		)
		if (ssr) {
			// Do not warm the lazy home route before checking its first no-JS response.
			const cold = await browser.newContext({ javaScriptEnabled: false })
			try {
				const page = await cold.newPage()
				await page.goto(production.url)
				assert.equal(
					await page.getByRole('textbox', { name: 'Traveler name', exact: true }).count(),
					1,
					'First SSR request contains the form',
				)
				assert.equal(
					await page
						.getByRole('textbox', { name: 'Traveler name', exact: true })
						.inputValue(),
					'',
				)
				result.coldSSR = true
			} finally {
				await cold.close()
			}
		}
		await checkPage(browser, production.url, ssr, {
			afterInteractions: async (page, input) => {
				await page.getByRole('button', { name: 'Reset name', exact: true }).click()
				assert.equal(await input.inputValue(), 'Reset')
				await page.getByRole('button', { name: 'Focus controller', exact: true }).click()
				assert.equal(
					await page
						.getByRole('button', { name: /^Controller action/ })
						.evaluate((el) => el === document.activeElement),
					true,
				)
				result.hydratedReferenceGaps = await missingReferences(page)
				assertHiddenPickerGap(result.hydratedReferenceGaps)
				await page.locator('.so-date-picker button').last().click()
				await page.locator('.so-calendar').waitFor({ state: 'visible' })
				assertHiddenPickerGap(await missingReferences(page))
				await page.keyboard.press('Escape')
				await page.locator('.so-calendar').waitFor({ state: 'hidden' })
				assertHiddenPickerGap(await missingReferences(page))
				if (ssr) {
					await page.getByRole('link', { name: 'Leave recipes', exact: true }).click()
					await page.getByRole('heading', { name: 'Away', exact: true }).waitFor()
					await page.getByRole('link', { name: 'Back to recipes', exact: true }).click()
					await page.getByTestId('mounted').waitFor()
					assert.equal(await input.inputValue(), '')
					await page.getByRole('button', { name: /^Controller action/ }).click()
					await page.getByText('Controller clicks: 1', { exact: true }).waitFor()
				}
			},
			validateSSRReferences: (broken) => {
				result.ssrReferenceGaps = broken
				if (!legacy) {
					assert.deepEqual(broken, [])
					return
				}
				assert.equal(broken.length, 2, 'Exact published raw SSR portal gaps')
				assert.ok(broken.every((entry) => entry.attr === 'aria-controls' && !entry.hidden))
				assert.equal(
					broken.filter(
						(entry) =>
							entry.role === 'combobox' &&
							entry.label === 'Destination' &&
							entry.id.endsWith('-list'),
					).length,
					1,
				)
				assert.equal(
					broken.filter(
						(entry) =>
							entry.classes.includes('so-date-picker__trigger') &&
							entry.label === 'Choose date' &&
							entry.id.endsWith('-panel'),
					).length,
					1,
				)
			},
		})
		result.browser = true
	} catch (error) {
		failures.push(name + ': ' + error.message)
		console.error(error)
	} finally {
		production?.server.kill()
		await browser.close()
		writeFileSync(join(directory, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n')
	}
}
if (failures.length) throw new Error(failures.join('\n') + '\nEvidence: ' + directory)
console.log('Published Solid recipes passed: ' + directory)

function assertHiddenPickerGap(broken) {
	if (!legacy) {
		assert.deepEqual(broken, [])
		return
	}
	assert.equal(broken.length, 1, 'Only the published hidden Calendar label gap remains')
	const entry = broken[0]
	assert.equal(entry.attr, 'aria-labelledby')
	assert.equal(entry.role, 'dialog')
	assert.equal(entry.classes, 'so-frame so-popover__panel')
	assert.ok(entry.hidden && entry.withinDatePicker && entry.id.endsWith('-picker-0'))
}
