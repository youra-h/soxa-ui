import { documentationRelease } from './release.mjs'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { serve, checkPage, missingReferences } from './consumer-browser.mjs'
import { prepareDevelopment, verifyDevelopmentLock, digest } from './svelte-development.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const release = documentationRelease(root)
const { version, legacy } = release
const directory =
	process.env.SOXA_SVELTE_SMOKE_DIR || mkdtempSync(join(tmpdir(), 'soxa-svelte-docs-'))
const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Run with npm run check:ai-docs:svelte')
const run = (args, cwd) => execFileSync(process.execPath, args, { cwd, stdio: 'inherit' })
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
console.log('Svelte consumer workspace: ' + directory)
const failures = []
const development = process.argv.includes('--development')
const artifacts = development
	? prepareDevelopment(root, directory, npmCli, process.argv.includes('--skip-build'))
	: undefined
const evidence = {
	schemaVersion: 1,
	provenance: development ? 'unpublished-development-tarballs' : 'published-' + version,
	docsRevision: revision,
	nodeVersion: process.version,
	tools: ['svelte-smoke.mjs', 'svelte-development.mjs', 'consumer-browser.mjs'].map((file) => ({
		path: 'tools/ai-docs/' + file,
		sha256: digest(join(root, 'tools/ai-docs', file)),
	})),
	artifacts,
	consumers: [],
}

for (const ssr of [false, true]) {
	const cwd = join(directory, ssr ? 'sveltekit' : 'svelte')
	cpSync(join(root, `docs/ai/${version}/examples`, ssr ? 'sveltekit' : 'svelte'), cwd, {
		recursive: true,
	})
	if (ssr)
		for (const file of ['Recipes.svelte', 'CtrlExample.svelte']) {
			assert.equal(
				readFileSync(join(cwd, 'src/lib', file), 'utf8'),
				readFileSync(join(root, `docs/ai/${version}/examples/svelte`, file), 'utf8'),
				'Both consumers use identical recipes',
			)
		}
	if (development) {
		const file = join(cwd, 'package.json')
		writeFileSync(
			file,
			JSON.stringify(
				artifacts.consumerManifest(JSON.parse(readFileSync(file, 'utf8'))),
				null,
				2,
			) + '\n',
		)
	}
	run([npmCli, 'install', '--no-audit', '--no-fund'], cwd)
	const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'))
	const lock = JSON.parse(readFileSync(join(cwd, 'package-lock.json'), 'utf8'))
	if (development) verifyDevelopmentLock(cwd, artifacts)
	if (!development)
		for (const name of Object.keys(lock.packages).filter((name) =>
			name.includes('node_modules/@soxa-ui/'),
		)) {
			const packageName = name.slice(name.lastIndexOf('node_modules/') + 13)
			assert.equal(
				Object.keys(lock.packages).filter((p) => p.endsWith('node_modules/' + packageName))
					.length,
				1,
				packageName,
			)
			assert.equal(lock.packages[name].version, release.packages[packageName])
		}
	if (!development)
		for (const [name, version] of Object.entries({
			...pkg.dependencies,
			...pkg.devDependencies,
		})) {
			const entries = Object.entries(lock.packages).filter(([p]) =>
				p.endsWith('node_modules/' + name),
			)
			if (name.startsWith('@soxa-ui/')) assert.equal(entries.length, 1, name)
			assert.equal(lock.packages['node_modules/' + name].version, version)
			assert.ok(
				lock.packages['node_modules/' + name].resolved.startsWith(
					'https://registry.npmjs.org/',
				),
			)
		}
	if (!ssr && !development) {
		cpSync(join(root, 'docs/ai'), join(directory, 'source/docs/ai'), { recursive: true })
		cpSync(join(root, 'tools/ai-docs'), join(directory, 'source/tools/ai-docs'), {
			recursive: true,
		})
		run(
			[
				join(directory, 'source/tools/ai-docs/cli.mjs'),
				'--manifest',
				join(directory, `source/docs/ai/${version}/manifest.json`),
				'--package',
				join(cwd, 'node_modules/@soxa-ui/setup'),
				'--revision',
				revision,
				'--out',
				mkdtempSync(join(directory, 'corpus-')),
			],
			directory,
		)
	}
	let strictTypes = true
	try {
		run([npmCli, 'run', 'check'], cwd)
	} catch {
		strictTypes = false
		failures.push(
			(ssr ? 'SvelteKit' : 'Svelte') + ' strict typecheck failed; see diagnostics above',
		)
	}

	// An invalid template prop must be rejected, not merely JavaScript syntax checked.
	const recipe = join(cwd, ssr ? 'src/lib/Recipes.svelte' : 'Recipes.svelte')
	const original = readFileSync(recipe, 'utf8')
	writeFileSync(recipe, original.replace('text="Reset name"', 'text={42}'))
	let rejected = false
	try {
		execFileSync(process.execPath, [npmCli, 'run', 'check'], {
			cwd,
			encoding: 'utf8',
			stdio: 'pipe',
		})
	} catch (error) {
		assert.match(error.stdout + error.stderr, /number.*not assignable.*string/s)
		rejected = true
	} finally {
		writeFileSync(recipe, original)
	}
	assert.ok(rejected, 'svelte-check rejects invalid component input')
	run([npmCli, 'run', 'build'], cwd)
	const browser = await chromium.launch({ headless: true })
	let production
	try {
		production = await serve(
			cwd,
			ssr
				? ['build/index.js']
				: [
						'node_modules/vite/bin/vite.js',
						'preview',
						'--host',
						'127.0.0.1',
						'--port',
						'0',
					],
		)
		await checkPage(browser, production.url, ssr, {
			afterInteractions: async (page, input) => {
				await page.getByRole('button', { name: 'Reset name', exact: true }).click()
				assert.equal(await input.inputValue(), 'Reset')
				await input.fill('Next')
				assert.equal(await page.getByTestId('old-value').textContent(), 'Reset')
				assert.equal(await page.getByTestId('change').textContent(), 'Next')
				assert.ok(
					(
						await page
							.locator('html')
							.evaluate((el) => getComputedStyle(el).colorScheme)
					).includes('light'),
				)
				// Bound the published hidden Calendar label gap; all other targets must exist.
				const broken = await missingReferences(page)
				if (development || !legacy)
					assert.deepEqual(broken, [], 'Development references after interactions')
				else {
					assert.equal(broken.length, 1, 'Exact known hidden Calendar label gap')
					const [gap] = broken
					assert.equal(gap.attr, 'aria-labelledby')
					assert.equal(gap.role, 'dialog')
					assert.equal(gap.label, null)
					assert.equal(gap.hidden, true)
					assert.equal(gap.withinDatePicker, true)
					assert.deepEqual(gap.classes.split(' ').sort(), [
						'so-frame',
						'so-popover__panel',
					])
					assert.match(gap.id, /^.+-picker-0$/)
				}
				if (ssr) {
					await page.getByRole('link', { name: 'Leave recipes' }).click()
					await page.getByRole('heading', { name: 'Another route' }).waitFor()
					assert.equal(await page.locator('.so-date-picker__panel').count(), 0)
					await page.getByRole('link', { name: 'Return to recipes' }).click()
					await page.getByTestId('mounted').waitFor()
					assert.equal(
						await page
							.getByRole('textbox', { name: 'Traveler name', exact: true })
							.inputValue(),
						'',
					)
					await page
						.getByRole('button', { name: 'Controller action', exact: true })
						.click()
					await page.getByText('Controller clicks: 1', { exact: true }).waitFor()
					if (development || !legacy)
						assert.deepEqual(
							await missingReferences(page),
							[],
							'References after route return',
						)
				}
			},
			validateSSRReferences: (broken) => {
				if (development || !legacy) {
					assert.deepEqual(broken, [], 'Development SSR references')
					return
				}

				assert.equal(
					broken.length,
					2,
					'Closed Select and DatePicker portals are browser mounted',
				)
				const [select, picker] = broken
				assert.equal(select.attr, 'aria-controls')
				assert.equal(select.role, 'combobox')
				assert.equal(select.label, 'Destination')
				assert.equal(select.classes, '')
				assert.equal(select.hidden, false)
				assert.equal(select.withinDatePicker, false)
				assert.match(select.id, /^.+-list$/)
				assert.equal(picker.attr, 'aria-controls')
				assert.equal(picker.role, null)
				assert.equal(picker.label, 'Choose date')
				assert.equal(
					picker.classes,
					'so-button so-button--size-normal so-date-picker__trigger',
				)
				assert.equal(picker.hidden, false)
				assert.equal(picker.withinDatePicker, false)
				assert.match(picker.id, /^.+-panel$/)
			},
		})
		if (development || !legacy) await checkPopupReferences(browser, production.url)
		evidence.consumers.push({
			framework: ssr ? 'sveltekit' : 'svelte',
			lockSha256: digest(join(cwd, 'package-lock.json')),
			strictTypes,
			frameworkVersions: Object.fromEntries(
				Object.entries({ ...pkg.dependencies, ...pkg.devDependencies }).filter(
					([name]) => !name.startsWith('@soxa-ui/'),
				),
			),
			negativeNumericPropRejected: rejected,
			production: true,
			runtime: true,
			ariaReferences:
				development || !legacy
					? ssr
						? 'zero dangling in SSR, hydrated, open and closed states'
						: 'zero dangling in hydrated, open and closed states'
					: 'exact published exceptions',
		})
		console.log((ssr ? 'SvelteKit' : 'Svelte') + ' runtime checks passed')
	} finally {
		production?.server.kill()
		await browser.close()
	}
}
writeFileSync(
	join(directory, 'evidence.json'),
	JSON.stringify(
		evidence,
		(key, value) => (['specs', 'consumerManifest'].includes(key) ? undefined : value),
		2,
	) + '\n',
)
assert.deepEqual(failures, [], 'All strict consumer type checks must pass')
console.log(
	'PASS: Svelte and SvelteKit ' +
		(development ? 'unpublished development tarballs' : 'exact published ' + version) +
		', templates, production, keyboard, controllers, SSR and navigation (' +
		directory +
		')',
)

/** Check each popup state independently, including before the first open. */
async function checkPopupReferences(browser, url) {
	const page = await browser.newPage()
	const errors = []
	page.on('console', (message) => {
		if (['warning', 'error'].includes(message.type())) errors.push(message.text())
	})
	page.on('pageerror', (error) => errors.push(error.message))
	page.on('requestfailed', (request) => errors.push(request.url()))
	try {
		await page.goto(url)
		await page.getByTestId('mounted').waitFor()
		assert.deepEqual(
			await missingReferences(page),
			[],
			'Hydrated references before interaction',
		)
		for (const trigger of [
			page.getByRole('combobox', { name: 'Destination', exact: true }),
			page.locator('.so-date-picker__trigger'),
		]) {
			assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
			await trigger.click()
			await page.waitForFunction(() => document.querySelector('[aria-expanded="true"]'))
			assert.equal(await trigger.getAttribute('aria-expanded'), 'true')
			assert.ok(
				await trigger.getAttribute('aria-controls'),
				'Open popup has a controlled target',
			)
			assert.deepEqual(await missingReferences(page), [], 'Open popup references')
			await page.keyboard.press('Escape')
			await page.waitForFunction(() => !document.querySelector('[aria-expanded="true"]'))
			assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
			assert.deepEqual(await missingReferences(page), [], 'Closed popup references')
		}
		assert.deepEqual(errors, [], 'Popup interaction diagnostics')
	} finally {
		await page.close()
	}
}
