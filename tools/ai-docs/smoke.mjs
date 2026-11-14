import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stripVTControlCharacters } from 'node:util'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const directory = mkdtempSync(join(tmpdir(), 'soxa-ai-docs-smoke-'))
const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Run with npm run check:ai-docs')
const run = (file, args) => execFileSync(file, args, { cwd: directory, stdio: 'inherit' })
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
writeFileSync(
	join(directory, 'main.ts'),
	"import { createApp } from 'vue'\nimport App from './App.vue'\ncreateApp(App).mount('#app')\n",
)
writeFileSync(
	join(directory, 'index.html'),
	'<html lang="en"><head><title>Soxa example</title></head><body><div id="app"></div><script type="module" src="/main.ts"></script></body></html>',
)
writeFileSync(
	join(directory, 'vite.config.mjs'),
	"import vue from '@vitejs/plugin-vue'\nexport default { plugins: [vue()] }\n",
)
writeFileSync(
	join(directory, 'tsconfig.json'),
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
		include: ['main.ts', 'App.vue'],
	}),
)
run(process.execPath, ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit'])
run(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', 'dist/app'])

const server = spawn(
	process.execPath,
	[
		'node_modules/vite/bin/vite.js',
		'preview',
		'--outDir',
		'dist/app',
		'--host',
		'127.0.0.1',
		'--port',
		'0',
	],
	{ cwd: directory, stdio: ['ignore', 'pipe', 'pipe'] },
)
try {
	const url = await new Promise((resolveUrl, reject) => {
		let output = ''
		const timer = setTimeout(
			() =>
				reject(new Error('Preview startup timed out: ' + stripVTControlCharacters(output))),
			15000,
		)
		server.once('exit', (code) => {
			clearTimeout(timer)
			reject(new Error(`Preview exited ${code}`))
		})
		const read = (chunk) => {
			output += chunk.toString()
			const match = stripVTControlCharacters(output).match(/http:\/\/127\.0\.0\.1:\d+\//)
			if (match) {
				clearTimeout(timer)
				resolveUrl(match[0])
			}
		}
		server.stdout.on('data', read)
		server.stderr.on('data', read)
	})
	const browser = await chromium.launch({ headless: true })
	try {
		const page = await browser.newPage()
		const errors = []
		page.on('console', (msg) => {
			if (['warning', 'error'].includes(msg.type())) errors.push(msg.text())
		})
		page.on('pageerror', (error) => errors.push(error.message))
		page.on('requestfailed', (request) => errors.push(request.url()))
		await page.goto(url)
		await page.getByRole('button', { name: 'Increment', exact: true }).click()
		await page.getByText('Count: 1', { exact: true }).waitFor()
		await page.getByRole('button', { name: 'Increment', exact: true }).focus()
		await page.keyboard.press('Enter')
		await page.getByText('Count: 2', { exact: true }).waitFor()
		assert.deepEqual(errors, [])
	} finally {
		await browser.close()
	}
} finally {
	server.kill()
}
console.log(
	`Published 0.3.0: external corpus, Vue types/build, click and Enter passed (${directory})`,
)
