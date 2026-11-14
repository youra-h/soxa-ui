import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stripVTControlCharacters } from 'node:util'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const directory = mkdtempSync(join(tmpdir(), 'soxa-ai-docs-smoke-'))
const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Run with npm run check:ai-docs')
const run = (file, args, cwd = directory) => execFileSync(file, args, { cwd, stdio: 'inherit' })
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

// Copy only the public delivery directories; the consumer has no monorepo or sibling checkout.
cpSync(join(root, 'docs/ai'), join(directory, 'docs/ai'), { recursive: true })
cpSync(join(root, 'tools/ai-docs'), join(directory, 'tools/ai-docs'), { recursive: true })
const manifest = JSON.parse(readFileSync(join(directory, 'docs/ai/0.3.0/manifest.json'), 'utf8'))
writeFileSync(
	join(directory, 'package.json'),
	JSON.stringify({
		private: true,
		type: 'module',
		dependencies: { ...manifest.packages, vue: '3.5.32' },
		devDependencies: {
			vite: '8.2.2',
			'@vitejs/plugin-vue': '6.0.8',
			typescript: '6.0.2',
			'vue-tsc': '3.3.11',
		},
	}),
)
run(process.execPath, [npmCli, 'install', '--ignore-scripts', '--no-audit', '--no-fund'])
run(process.execPath, [
	'tools/ai-docs/cli.mjs',
	'--manifest',
	'docs/ai/0.3.0/manifest.json',
	'--package',
	'node_modules/@soxa-ui/setup',
	'--revision',
	revision,
	'--out',
	'dist/corpus',
])
const lock = JSON.parse(readFileSync(join(directory, 'package-lock.json'), 'utf8'))
assert.equal(lock.packages['node_modules/@soxa-ui/setup'].integrity, manifest.api.integrity)
const releasePaths = new Set(
	execFileSync('git', ['ls-tree', '-r', '--name-only', manifest.libraryRevision], {
		cwd: root,
		encoding: 'utf8',
		maxBuffer: 8 * 1024 * 1024,
	})
		.trim()
		.split('\n'),
)
for (const doc of manifest.documents)
	for (const source of doc.sources)
		assert.ok(releasePaths.has(source.path), 'Missing release source: ' + source.path)
const index = JSON.parse(readFileSync(join(directory, 'dist/corpus/index.json'), 'utf8'))
assert.equal(index.libraryVersion, '0.3.0')
assert.equal(index.documents.filter((d) => d.topic === 'api' && d.framework === 'vue').length, 63)
assert.equal(index.coverage.react.guides, 'pending')
assert.ok(!index.documents.some((d) => d.id === 'api-vue-component'))
assert.ok(index.documents.some((d) => d.id === 'api-angular-component'))
for (const doc of index.documents)
	for (const source of doc.sources)
		assert.ok(
			releasePaths.has(source.split('/blob/' + manifest.libraryRevision + '/')[1]),
			'Missing API release source: ' + source,
		)
assert.ok(index.documents.every((d) => !JSON.stringify(d).includes(directory)))

cpSync(join(directory, 'docs/ai/0.3.0/examples/App.vue'), join(directory, 'App.vue'))
const examples = join(directory, 'docs/ai/0.3.0/examples')
const put = (cwd, file, text) => {
	mkdirSync(dirname(join(cwd, file)), { recursive: true })
	writeFileSync(join(cwd, file), text)
}
function verifyLock(cwd) {
	const lock = JSON.parse(readFileSync(join(cwd, 'package-lock.json'), 'utf8'))
	for (const [name, version] of Object.entries(manifest.packages)) {
		const entries = Object.entries(lock.packages).filter(([path]) =>
			path.endsWith('node_modules/' + name),
		)
		assert.equal(entries.length, 1, 'One installed copy: ' + name)
		assert.equal(entries[0][1].version, version)
		assert.ok(entries[0][1].resolved.startsWith('https://registry.npmjs.org/'))
	}
}
verifyLock(directory)
cpSync(join(examples, 'TravelRecipes.vue'), join(directory, 'TravelRecipes.vue'))
cpSync(join(examples, 'CtrlExample.vue'), join(directory, 'CtrlExample.vue'))
put(
	directory,
	'main.ts',
	readFileSync(join(examples, 'vue/main.ts'), 'utf8').replace(
		"'../TravelRecipes.vue'",
		"'./Harness.vue'",
	),
)
put(
	directory,
	'Harness.vue',
	"<script setup lang=\"ts\">\nimport Recipes from './TravelRecipes.vue'\nimport Minimal from './App.vue'\n</script>\n<template><Recipes /><Minimal /></template>\n",
)
put(
	directory,
	'index.html',
	'<html lang="en"><head><link rel="icon" href="data:,"><title>Soxa recipes</title></head><body><div id="app"></div><script type="module" src="/main.ts"></script></body></html>',
)
put(
	directory,
	'vite.config.mjs',
	"import vue from '@vitejs/plugin-vue'\nexport default { plugins: [vue()] }\n",
)
put(
	directory,
	'tsconfig.json',
	JSON.stringify({
		compilerOptions: {
			target: 'ES2022',
			module: 'ESNext',
			moduleResolution: 'Bundler',
			strict: true,
			skipLibCheck: true,
			lib: ['ES2022', 'DOM'],
			noEmit: true,
		},
		include: ['main.ts', 'TravelRecipes.vue', 'CtrlExample.vue', 'App.vue', 'Harness.vue'],
	}),
)
run(process.execPath, ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit'])
run(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', 'dist/app'])

async function serve(cwd, args) {
	const server = spawn(process.execPath, args, {
		cwd,
		env: { ...process.env, PORT: '0', HOST: '127.0.0.1' },
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	let output = ''
	server.stdout.on('data', (chunk) => {
		output += chunk
	})
	server.stderr.on('data', (chunk) => {
		output += chunk
	})
	try {
		const deadline = Date.now() + 30000
		while (Date.now() < deadline) {
			// Both servers announce the actual ephemeral port after binding it.
			const url = stripVTControlCharacters(output).match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]
			if (url) {
				try {
					if ((await fetch(url)).ok) return { server, url }
				} catch {}
			}
			if (server.exitCode !== null) throw new Error('Server exited: ' + output)
			await new Promise((done) => setTimeout(done, 100))
		}
		throw new Error('Server startup timeout: ' + output)
	} catch (error) {
		server.kill()
		throw error
	}
}

async function checkPage(browser, url, ssr) {
	const page = await browser.newPage()
	const errors = []
	page.on('console', (msg) => {
		if (['warning', 'error'].includes(msg.type())) errors.push(msg.text())
	})
	page.on('pageerror', (error) => errors.push(error.message))
	page.on('requestfailed', (request) => errors.push(request.url()))
	try {
		await page.goto(url)
		await page.getByTestId('mounted').waitFor()
		const input = page.getByRole('textbox', { name: 'Traveler name', exact: true })
		await page.getByText('Traveler name', { exact: true }).click()
		assert.equal(await input.evaluate((el) => el === document.activeElement), true)
		await input.fill('Anna')
		assert.equal(await page.getByTestId('change').textContent(), 'Anna')

		const checkbox = page.getByRole('checkbox', { name: 'Accept travel policy' })
		await checkbox.focus()
		await page.keyboard.press('Space')
		assert.equal(await checkbox.isChecked(), true)

		const select = page.getByRole('combobox', { name: 'Destination', exact: true })
		await select.focus()
		await page.keyboard.press('ArrowDown')
		await page.getByRole('option', { name: 'Moscow', exact: true }).waitFor()
		await page.keyboard.press('End')
		await page.keyboard.press('Enter')
		await page.getByRole('option', { name: 'Moscow', exact: true }).waitFor({ state: 'hidden' })
		assert.ok((await page.getByTestId('values').textContent()).includes('|msk|'))
		await select.click()
		await page.keyboard.press('Escape')
		await page.getByRole('option', { name: 'Moscow', exact: true }).waitFor({ state: 'hidden' })

		await page.getByRole('button', { name: 'Travel help: closed', exact: true }).focus()
		await page.keyboard.press('Enter')
		await page.getByRole('button', { name: 'Travel help: open', exact: true }).waitFor()
		await page.getByText('Bring your travel documents.', { exact: true }).waitFor()

		const picker = page.locator('.so-date-picker')
		await picker.locator('button').last().click()
		await page.locator('.so-calendar').waitFor({ state: 'visible' })
		await page
			.getByRole('gridcell', { name: 'Saturday, November 14, 2026', exact: true })
			.focus()
		await page.keyboard.press('ArrowRight')
		await page.keyboard.press('Enter')
		await page.locator('.so-calendar').waitFor({ state: 'hidden' })
		assert.ok((await page.getByTestId('values').textContent()).includes('|2026-11-15'))
		await page.getByRole('group', { name: 'Departure', exact: true }).waitFor()
		await picker.locator('button').last().click()
		await page.keyboard.press('Escape')
		await page.locator('.so-calendar').waitFor({ state: 'hidden' })

		for (let i = 0; i < 3; i++) {
			await page.getByRole('button', { name: /^Controller action/ }).click()
			await page.getByText('Controller clicks: 1', { exact: true }).waitFor()
			await page.getByRole('button', { name: 'Toggle controller', exact: true }).click()
			await page.getByRole('button', { name: 'Toggle controller', exact: true }).click()
			await page.getByText('Controller clicks: 0', { exact: true }).waitFor()
		}

		await page.getByRole('button', { name: 'Save preferences', exact: true }).focus()
		await page.keyboard.press('Enter')
		await page.getByText('Preferences saved', { exact: true }).waitFor()
		await input.focus()
		await page.keyboard.press('Tab')
		assert.equal(await checkbox.evaluate((el) => el === document.activeElement), true)

		if (!ssr) {
			const increment = page.getByRole('button', { name: 'Increment', exact: true })
			await increment.click()
			await page.getByText('Count: 1', { exact: true }).waitFor()
			await increment.focus()
			await page.keyboard.press('Enter')
			await page.getByText('Count: 2', { exact: true }).waitFor()
		}
		assert.deepEqual(errors, [])
	} finally {
		await page.close()
	}

	// A fresh SSR request must not reuse the mutated hydrated form/controller.
	if (ssr) {
		const context = await browser.newContext({ javaScriptEnabled: false })
		const raw = await context.newPage()
		try {
			for (let i = 0; i < 2; i++) {
				await raw.goto(url)
				assert.equal(
					await raw
						.getByRole('textbox', { name: 'Traveler name', exact: true })
						.inputValue(),
					'',
				)
				assert.equal(
					await raw.getByRole('checkbox', { name: 'Accept travel policy' }).isChecked(),
					false,
				)
				assert.ok(
					(await raw.getByTestId('values').textContent()).includes('|kzn|2026-11-14'),
				)
				await raw.getByText('Controller clicks: 0', { exact: true }).waitFor()
				assert.equal((await raw.locator('.so-select svg path').count()) > 0, true)
				const ids = await raw.locator('[id]').evaluateAll((els) => els.map((el) => el.id))
				assert.equal(new Set(ids).size, ids.length, 'SSR ids are unique')
				const broken = await raw.evaluate(() =>
					Array.from(
						document.querySelectorAll(
							'[aria-labelledby],[aria-describedby],[aria-controls]',
						),
					).flatMap((el) =>
						['aria-labelledby', 'aria-describedby', 'aria-controls'].flatMap((attr) =>
							(el.getAttribute(attr) || '')
								.split(/\s+/)
								.filter(Boolean)
								.filter((id) => !document.getElementById(id)),
						),
					),
				)
				assert.deepEqual(broken, [])
			}
		} finally {
			await context.close()
		}
	}
}
const browser = await chromium.launch({ headless: true })
try {
	const vite = await serve(directory, [
		'node_modules/vite/bin/vite.js',
		'preview',
		'--outDir',
		'dist/app',
		'--host',
		'127.0.0.1',
		'--port',
		'0',
	])
	try {
		await checkPage(browser, vite.url, false)
	} finally {
		vite.server.kill()
	}
	const nuxt = join(directory, 'nuxt-consumer')
	mkdirSync(nuxt)
	cpSync(join(examples, 'nuxt'), nuxt, { recursive: true })
	put(nuxt, 'app/components/TravelRecipes.vue', readFileSync(join(examples, 'TravelRecipes.vue')))
	put(nuxt, 'app/components/CtrlExample.vue', readFileSync(join(examples, 'CtrlExample.vue')))
	put(
		nuxt,
		'package.json',
		JSON.stringify({
			private: true,
			type: 'module',
			dependencies: {
				...manifest.packages,
				nuxt: '4.6.3',
				vue: '3.5.44',
				'vue-router': '5.4.0',
			},
			devDependencies: { typescript: '6.0.3', 'vue-tsc': '3.3.13' },
		}),
	)
	put(nuxt, 'tsconfig.json', JSON.stringify({ extends: './.nuxt/tsconfig.json' }))
	run(process.execPath, [npmCli, 'install', '--no-audit', '--no-fund'], nuxt)
	verifyLock(nuxt)
	run(process.execPath, ['node_modules/nuxt/bin/nuxt.mjs', 'typecheck'], nuxt)
	run(process.execPath, ['node_modules/nuxt/bin/nuxt.mjs', 'build'], nuxt)
	const production = await serve(nuxt, ['.output/server/index.mjs'])
	try {
		await checkPage(browser, production.url, true)
	} finally {
		production.server.kill()
	}
} finally {
	await browser.close()
}
console.log('Published 0.3.0: Vue and Nuxt types/build/browser/SSR passed (' + directory + ')')
