import { documentationRelease } from './release.mjs'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { serve } from './consumer-browser.mjs'
import { buildCorpus, selectDocuments } from './corpus.mjs'
import { checkWebc } from './webc-browser.mjs'

if (process.argv.slice(2).some((arg) => arg !== '--webkit'))
	throw new Error('Only --webkit is supported')
const withWebkit = process.argv.includes('--webkit')
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const release = documentationRelease(root)
const { version, legacy } = release
const directory = process.env.SOXA_WEBC_SMOKE_DIR || mkdtempSync(join(tmpdir(), 'soxa-webc-docs-'))
const cwd = join(directory, 'webc')
const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Run with npm run check:ai-docs:webc')
const run = (args) => execFileSync(process.execPath, args, { cwd, stdio: 'inherit' })
const digest = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
const evidence = {
	provenance: 'published-' + version,
	docsRevision: execFileSync('git', ['rev-parse', 'HEAD'], {
		cwd: root,
		encoding: 'utf8',
	}).trim(),
	nodeVersion: process.version,
	tools: [
		'webc-smoke.mjs',
		'webc-browser.mjs',
		'webc-webkit-container.mjs',
		'consumer-browser.mjs',
		'corpus.mjs',
	].map((file) => ({
		path: 'tools/ai-docs/' + file,
		sha256: digest(join(root, 'tools/ai-docs', file)),
	})),
}
mkdirSync(directory, { recursive: true })
console.log('Web Components consumer workspace: ' + directory)
assert.ok(!readdirSync(directory).length, 'Use an empty smoke output directory')
cpSync(join(root, `docs/ai/${version}/examples/webc`), cwd, { recursive: true })
evidence.inputs = readdirSync(cwd).map((file) => ({
	path: 'examples/webc/' + file,
	sha256: digest(join(cwd, file)),
}))
run([npmCli, 'install', '--no-audit', '--no-fund'])
execFileSync(process.execPath, [npmCli, 'ls', '--all', '--omit=optional'], { cwd, stdio: 'pipe' })
evidence.npmPeers = true
const lock = JSON.parse(readFileSync(join(cwd, 'package-lock.json'), 'utf8'))
const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'))
for (const [name, version] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies }))
	assert.equal(lock.packages['node_modules/' + name].version, version)
evidence.packages = Object.entries(lock.packages)
	.filter(([path]) => path.includes('node_modules/@soxa-ui/'))
	.map(([path, entry]) => {
		const name = path.slice(path.lastIndexOf('node_modules/') + 13)
		assert.equal(entry.version, release.packages[name])
		assert.ok(entry.resolved.startsWith('https://registry.npmjs.org/'))
		assert.ok(entry.integrity)
		assert.equal(
			Object.keys(lock.packages).filter((p) => p.endsWith('node_modules/' + name)).length,
			1,
		)
		return {
			name,
			version: entry.version,
			resolved: entry.resolved,
			integrity: entry.integrity,
		}
	})
evidence.lockSha256 = digest(join(cwd, 'package-lock.json'))
evidence.apiSha256 = digest(join(cwd, 'node_modules/@soxa-ui/setup/dist/api.json'))
const corpus = buildCorpus({
	manifestPath: join(root, `docs/ai/${version}/manifest.json`),
	packageRoot: join(cwd, 'node_modules/@soxa-ui/setup'),
	docsRevision: evidence.docsRevision,
})
const selected = selectDocuments(corpus, {
	version,
	audience: 'consumer',
	framework: 'webc',
})
assert.ok(selected.every((doc) => ['all', 'webc'].includes(doc.framework)))
assert.ok(selected.some((doc) => doc.id === 'webc-start'))
assert.equal(selected.filter((doc) => doc.framework === 'webc' && doc.topic !== 'api').length, 8)
assert.equal(
	selected.find((doc) => doc.id === 'api-webc-input').api.export.selector,
	'div[is="so-input"]',
)
mkdirSync(join(directory, 'corpus'), { recursive: true })
for (const doc of selected)
	writeFileSync(join(directory, 'corpus', doc.id + '.json'), JSON.stringify(doc, null, 2) + '\n')
evidence.corpusInputs = selected.map((doc) => ({
	id: doc.id,
	sha256: digest(join(directory, 'corpus', doc.id + '.json')),
}))
run([npmCli, 'run', 'check'])
evidence.strictTypes = true
run([npmCli, 'run', 'build'])
evidence.productionBuild = true
evidence.buildWarning =
	'Root import produces a chunk above the default Vite 500 kB warning threshold.'
const probe = spawnSync(
	process.execPath,
	['--input-type=module', '-e', "await import('@soxa-ui/webc')"],
	{ cwd, encoding: 'utf8' },
)
assert.notEqual(probe.status, 0)
const domError = probe.stderr.match(/ReferenceError: [^\r\n]+/)
assert.ok(domError, 'Browser entry fails on a missing DOM global in Node')
evidence.nodeImport = { supported: false, error: domError[0] }
const browser = await chromium.launch()
let production
try {
	evidence.browserVersion = browser.version()
	production = await serve(cwd, [
		join(cwd, 'node_modules/vite/bin/vite.js'),
		'preview',
		'--host',
		'127.0.0.1',
		'--port',
		'0',
	])
	const noJS = await browser.newContext({ javaScriptEnabled: false })
	try {
		const raw = await noJS.newPage()
		await raw.goto(production.url + '/upgrade.html')
		await raw.getByRole('button', { name: 'Native server button', exact: true }).waitFor()
		assert.equal(await raw.getByRole('textbox').count(), 0)
		assert.equal(await raw.locator('.so-button').count(), 0)
		evidence.serverHTMLWithoutJavaScript = {
			nativeButton: true,
			generatedInput: false,
			hydrationClaim: false,
		}
	} finally {
		await noJS.close()
	}
	const upgraded = await browser.newPage()
	const diagnostics = []
	upgraded.on('pageerror', (error) => diagnostics.push(error.message))
	upgraded.on('console', (message) => {
		if (['warning', 'error'].includes(message.type())) diagnostics.push(message.text())
	})
	upgraded.on('requestfailed', (request) => diagnostics.push(request.url()))
	try {
		await upgraded.goto(production.url + '/upgrade.html')
		await upgraded.getByText('Enhanced in browser', { exact: true }).waitFor()
		assert.equal(
			await upgraded
				.getByRole('textbox', { name: 'Enhanced field', exact: true })
				.inputValue(),
			'Server seed',
		)
		assert.equal(await upgraded.locator('button.so-button').count(), 1)
		assert.deepEqual(diagnostics, [])
		evidence.serverHTMLClientUpgrade = true
	} finally {
		await upgraded.close()
	}
	evidence.browser = await checkWebc(browser, production.url, { legacy })
} finally {
	production?.server.kill()
	await browser.close()
	writeFileSync(join(directory, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n')
}
if (withWebkit) {
	const corePath = join(root, 'node_modules/playwright-core')
	const version = JSON.parse(readFileSync(join(corePath, 'package.json'), 'utf8')).version
	const installedLock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'))
	assert.equal(version, installedLock.packages['node_modules/playwright-core'].version)
	const image = 'mcr.microsoft.com/playwright:v' + version + '-noble'
	const output = execFileSync(
		'docker',
		[
			'run',
			'--rm',
			'--init',
			'--shm-size=1g',
			'--env',
			'SOXA_DOCS_VERSION=' + release.version,
			'--mount',
			'type=bind,source=' + corePath + ',target=/playwright-core,readonly',
			'--mount',
			'type=bind,source=' + join(root, 'tools/ai-docs') + ',target=/checks,readonly',
			'--mount',
			'type=bind,source=' + join(cwd, 'dist') + ',target=/consumer,readonly',
			image,
			'node',
			'/checks/webc-webkit-container.mjs',
		],
		{ encoding: 'utf8', timeout: 120000 },
	)
	evidence.webkit = { image, ...JSON.parse(output) }
	writeFileSync(join(directory, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n')
}
console.log('Published Web Components recipes passed: ' + directory)
