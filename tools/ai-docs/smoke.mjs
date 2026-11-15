import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { serve, checkPage } from './consumer-browser.mjs'

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
assert.equal(index.coverage.react.guides, 'sample')
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
		await checkPage(browser, vite.url, false, {
			afterInteractions: async (page) => {
				const increment = page.getByRole('button', { name: 'Increment', exact: true })
				await increment.click()
				await page.getByText('Count: 1', { exact: true }).waitFor()
				await increment.focus()
				await page.keyboard.press('Enter')
				await page.getByText('Count: 2', { exact: true }).waitFor()
			},
		})
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
