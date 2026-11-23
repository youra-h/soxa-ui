import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { checkPage, checkReleaseAppearance, serve } from '../ai-docs/consumer-browser.mjs'
import { registryVersion } from '../release-notes/release-notes.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const directory = mkdtempSync(join(tmpdir(), 'soxa-mcp-package-'))
const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Run with npm run check:mcp-package')
const registry = process.argv.slice(2).includes('--registry')
if (process.argv.slice(2).some((arg) => arg !== '--registry')) throw new Error('Unknown argument')
const manifest = JSON.parse(readFileSync(join(root, 'packages/mcp/package.json')))
const npm = (args, cwd = directory, options = {}) =>
	execFileSync(process.execPath, [npmCli, ...args], {
		cwd,
		encoding: 'utf8',
		maxBuffer: 32 * 1024 * 1024,
		...options,
	})
const put = (file, value) =>
	writeFileSync(
		join(directory, file),
		typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n',
	)
let spec = manifest.name + '@' + manifest.version
let packed
if (registry) {
	// Registry propagation can lag publication; only an absent exact version is retried.
	for (let attempt = 0; ; attempt++) {
		const result = spawnSync(process.execPath, [npmCli, 'view', spec, 'version', '--json'], {
			encoding: 'utf8',
			timeout: 15000,
		})
		if (registryVersion(spec, result) === manifest.version) break
		if (attempt === 19) throw new Error('Published MCP version did not become visible')
		await new Promise((done) => setTimeout(done, 10000))
	}
}
if (!registry) {
	packed = JSON.parse(
		npm(['pack', '--workspace=@soxa-ui/mcp', '--pack-destination', directory, '--json'], root),
	)[0]
	assert.ok(packed.files.some((file) => file.path === 'dist/cli.mjs'))
	if (process.platform !== 'win32')
		assert.ok(packed.files.find((file) => file.path === 'dist/cli.mjs').mode & 0o111)
	assert.ok(packed.files.some((file) => file.path === 'LICENSE'))
	assert.ok(packed.files.some((file) => file.path === 'README.md'))
	const allowed =
		/^(?:package.json|README.md|LICENSE|CHANGELOG.md|dist\/(?:cli.mjs|mcp.mjs|mcp-catalog.mjs|mcp-tools.mjs|corpus.mjs|catalog.json|corpora\/[^/]+\/(?:index.json|documents\/[^/]+.json)))$/
	for (const file of packed.files) assert.match(file.path, allowed)
	assert.ok(packed.size < 4 * 1024 * 1024, 'Unexpected archive growth')
	spec = join(directory, packed.filename)
}
put('package.json', {
	private: true,
	type: 'module',
	dependencies: {
		'@soxa-ui/mcp': registry ? manifest.version : spec,
		'@modelcontextprotocol/sdk': '1.32.2',
	},
})
console.log(npm(['install', '--ignore-scripts', '--no-audit', '--no-fund']))
const installed = join(directory, 'node_modules/@soxa-ui/mcp')
const installedManifest = JSON.parse(readFileSync(join(installed, 'package.json')))
assert.equal(installedManifest.version, manifest.version)
if (registry) {
	const lock = JSON.parse(readFileSync(join(directory, 'package-lock.json')))
	assert.ok(
		lock.packages['node_modules/@soxa-ui/mcp'].resolved.startsWith(
			'https://registry.npmjs.org/',
		),
	)
}
assert.equal(Object.keys(installedManifest.dependencies ?? {}).length, 0)
const catalog = JSON.parse(readFileSync(join(installed, 'dist/catalog.json')))
assert.equal(catalog.packageVersion, manifest.version)
const libraryVersions = ['0.3.0', '0.4.1', '0.4.2', '0.6.0']
assert.deepEqual(
	catalog.versions.map((v) => v.libraryVersion),
	libraryVersions,
)
// Test the npm executable shim from an unrelated cwd, with stdin EOF and no network.
put('offline.mjs', "globalThis.fetch = () => { throw new Error('Unexpected runtime network') }\n")
const request = [
	{
		jsonrpc: '2.0',
		id: 1,
		method: 'initialize',
		params: {
			protocolVersion: '2025-11-25',
			capabilities: {},
			clientInfo: { name: 'package-check', version: '1' },
		},
	},
	{ jsonrpc: '2.0', method: 'notifications/initialized' },
	{
		jsonrpc: '2.0',
		id: 2,
		method: 'tools/call',
		params: { name: 'list_versions', arguments: {} },
	},
	{
		jsonrpc: '2.0',
		id: 3,
		method: 'tools/call',
		params: {
			name: 'get_component',
			arguments: {
				version: '9.9.9',
				audience: 'consumer',
				framework: 'vue',
				component: 'select',
			},
		},
	},
	{
		jsonrpc: '2.0',
		id: 4,
		method: 'tools/call',
		params: {
			name: 'get_component',
			arguments: {
				version: 'latest',
				audience: 'consumer',
				framework: 'vue',
				component: 'select',
			},
		},
	},
	{ jsonrpc: '2.0', id: 5, method: 'ping' },
	{ jsonrpc: '2.0', id: 6, method: 'tools/call', params: null },
	{ jsonrpc: '2.0', id: 7, method: 'unknown-method' },
]
const responses = npm(['exec', '--offline', '--', 'soxa-mcp'], directory, {
	input: 'malformed JSON\n' + request.map((v) => JSON.stringify(v)).join('\n') + '\n',
	timeout: 30000,
	env: {
		...process.env,
		NODE_OPTIONS: '--import=' + pathToFileURL(join(directory, 'offline.mjs')).href,
	},
})
	.trim()
	.split('\n')
	.map((line) => JSON.parse(line))
assert.equal(responses.find((v) => v.id === 1).result.serverInfo.version, manifest.version)
assert.equal(responses[0].error.code, -32700)
assert.equal(responses.find((v) => v.id === 6).error.code, -32602)
assert.equal(responses.find((v) => v.id === 7).error.code, -32601)
assert.deepEqual(
	JSON.parse(responses.find((v) => v.id === 2).result.content[0].text).versions.map(
		(v) => v.libraryVersion,
	),
	libraryVersions,
)
assert.equal(responses.find((v) => v.id === 3).result.isError, true)
assert.equal(responses.find((v) => v.id === 4).result.isError, true)
assert.deepEqual(responses.find((v) => v.id === 5).result, {})
const server = join(installed, 'dist/cli.mjs')
const sdk = []
cpSync(join(root, 'tools/ai-docs/mcp-client.mjs'), join(directory, 'mcp-client.mjs'))
for (const version of libraryVersions) {
	console.log(
		execFileSync(process.execPath, ['mcp-client.mjs', server, '--bundled', version], {
			cwd: directory,
			encoding: 'utf8',
			maxBuffer: 8 * 1024 * 1024,
		}),
	)
	sdk.push(JSON.parse(readFileSync(join(directory, 'mcp-evidence.json'))))
}
const consumer = join(directory, 'consumer')
console.log(npm(['install', '--ignore-scripts', '--no-audit', '--no-fund'], consumer))
for (const args of [
	['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit'],
	['node_modules/vite/bin/vite.js', 'build'],
])
	console.log(execFileSync(process.execPath, args, { cwd: consumer, encoding: 'utf8' }))
const browser = await chromium.launch({ headless: true })
try {
	const production = await serve(consumer, [
		'node_modules/vite/bin/vite.js',
		'preview',
		'--host',
		'127.0.0.1',
		'--port',
		'0',
	])
	try {
		await checkPage(browser, production.url, false, {
			afterInteractions: checkReleaseAppearance,
		})
	} finally {
		production.server.kill()
	}
} finally {
	await browser.close()
}
const evidence = {
	schemaVersion: 1,
	date: new Date().toISOString(),
	package: {
		name: manifest.name,
		version: manifest.version,
		source: registry ? 'npm' : 'local-tarball',
		...(packed
			? {
					integrity: packed.integrity,
					size: packed.size,
					unpackedSize: packed.unpackedSize,
					fileCount: packed.files.length,
				}
			: {}),
	},
	node: process.version,
	platform: process.platform,
	sdk,
	checks: {
		bin: 'passed',
		offlineRuntime: 'passed',
		unknownVersions: 'passed',
		sdk: 'passed',
		vue060Types: 'passed',
		vue060Production: 'passed',
		vue060Chromium: 'passed',
	},
	editor: 'not-tested',
	directory,
}
put('package-evidence.json', evidence)
console.log('MCP package checks passed: ' + directory)
