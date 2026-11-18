import { documentationRelease } from './release.mjs'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { serve, checkPage } from './consumer-browser.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const release = documentationRelease(root)
const { version } = release
const directory = mkdtempSync(join(tmpdir(), 'soxa-mcp-consumer-'))
const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Run with npm run check:ai-docs:mcp')
const run = (file, args, cwd = directory) => execFileSync(file, args, { cwd, stdio: 'inherit' })
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

// The server gets only public delivery files and npm's published API, outside the checkout.
cpSync(join(root, 'docs/ai'), join(directory, 'source/docs/ai'), { recursive: true })
mkdirSync(join(directory, 'source/tools/ai-docs'), { recursive: true })
for (const file of ['cli.mjs', 'corpus.mjs', 'mcp.mjs', 'mcp-catalog.mjs', 'mcp-tools.mjs'])
	cpSync(join(root, 'tools/ai-docs', file), join(directory, 'source/tools/ai-docs', file))
writeFileSync(
	join(directory, 'package.json'),
	JSON.stringify({
		private: true,
		type: 'module',
		dependencies: { '@soxa-ui/setup': version, '@modelcontextprotocol/sdk': '1.32.2' },
	}),
)
run(process.execPath, [npmCli, 'install', '--ignore-scripts', '--no-audit', '--no-fund'])
run(process.execPath, [
	'source/tools/ai-docs/cli.mjs',
	'--manifest',
	`source/docs/ai/${version}/manifest.json`,
	'--package',
	'node_modules/@soxa-ui/setup',
	'--revision',
	revision,
	'--out',
	'corpus',
])
cpSync(join(root, 'tools/ai-docs/mcp-client.mjs'), join(directory, 'mcp-client.mjs'))
run(process.execPath, [
	'mcp-client.mjs',
	join(directory, 'source/tools/ai-docs/mcp.mjs'),
	join(directory, 'corpus'),
	version,
])

const consumer = join(directory, 'consumer')
run(process.execPath, [npmCli, 'install', '--ignore-scripts', '--no-audit', '--no-fund'], consumer)
const lock = JSON.parse(readFileSync(join(consumer, 'package-lock.json'), 'utf8'))
const evidence = JSON.parse(readFileSync(join(directory, 'mcp-evidence.json'), 'utf8'))
for (const [name, version] of Object.entries(evidence.provenance.packages)) {
	assert.equal(lock.packages['node_modules/' + name].version, version)
	assert.ok(
		lock.packages['node_modules/' + name].resolved.startsWith('https://registry.npmjs.org/'),
	)
}
run(process.execPath, ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit'], consumer)
run(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], consumer)
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
		await checkPage(browser, production.url, false)
	} finally {
		production.server.kill()
	}
} finally {
	await browser.close()
}
evidence.validation = {
	types: 'passed',
	productionBuild: 'passed',
	chromium: 'passed',
	interactions: [
		'Select keyboard choice/Escape/model',
		'DatePicker keyboard choice/Escape/model',
		'Input events',
		'Checkbox',
		'Accordion slots',
		'Controller remount',
		'Submit',
		'Unique ids',
		'No console/page/request errors',
	],
}
writeFileSync(join(directory, 'mcp-evidence.json'), JSON.stringify(evidence, null, 2) + '\n')
console.log('MCP-delivered Vue Select + DatePicker types/build/browser passed (' + directory + ')')
