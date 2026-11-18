import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { buildCorpus, digest, selectDocuments } from './corpus.mjs'
import { fetchSource } from './fetch.mjs'
import { serve } from './consumer-browser.mjs'
import { checkRecipes } from './recipes-browser.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const directory =
	process.env.SOXA_RECIPES_SMOKE_DIR || mkdtempSync(join(tmpdir(), 'soxa-recipes-docs-'))
mkdirSync(directory, { recursive: true })
assert.equal(readdirSync(directory).length, 0, 'Use an empty smoke directory')
console.log('Public recipes workspace: ' + directory)
const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Run with npm run check:ai-docs:recipes')
const npm = (cwd, ...args) =>
	execFileSync(process.execPath, [npmCli, ...args], { cwd, stdio: 'inherit' })
const json = (file) => JSON.parse(readFileSync(file, 'utf8'))
const hash = (file) => digest(readFileSync(file))
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const source = join(directory, 'source')
// Use the public downloader's allowlist, with local bytes before this docs commit is pushed.
await fetchSource({
	revision,
	version: '0.3.0',
	out: source,
	fetchFile: async (url) => {
		const path = url.split('/' + revision + '/')[1]
		return new Response(readFileSync(join(root, path)), { status: 200 })
	},
})
const example = join(source, 'docs/ai/0.3.0/examples/public-recipes')
const staging = join(directory, 'theme-build')
cpSync(example, staging, { recursive: true })
npm(staging, 'install', '--no-audit', '--no-fund')
npm(staging, 'run', 'build:theme')
assert.ok(
	readFileSync(join(staging, 'theme/dist/setup.d.ts'), 'utf8').includes(
		'reference types="@example/soxa-theme" preserve="true"',
	),
)
npm(staging, 'pack', '--workspace=@example/soxa-theme', '--pack-destination', directory)
const cwd = join(directory, 'consumer')
cpSync(example, cwd, { recursive: true, filter: (path) => path !== join(example, 'theme') })
const pkg = json(join(cwd, 'package.json'))
delete pkg.workspaces
delete pkg.scripts['build:theme']
pkg.dependencies['@example/soxa-theme'] = 'file:../example-soxa-theme-1.0.0.tgz'
writeFileSync(join(cwd, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
npm(cwd, 'install', '--no-audit', '--no-fund')
execFileSync(process.execPath, [npmCli, 'ls', '--all', '--omit=optional'], { cwd, stdio: 'pipe' })
npm(cwd, 'run', 'check')
npm(cwd, 'run', 'build')
const inspection = execFileSync(process.execPath, ['inspect-contracts.mjs'], {
	cwd,
	encoding: 'utf8',
})
writeFileSync(join(directory, 'installed-contracts.json'), inspection)
const lock = json(join(cwd, 'package-lock.json'))
const packages = Object.entries(lock.packages)
	.filter(([path]) => path.includes('node_modules/@soxa-ui/'))
	.map(([path, value]) => {
		assert.equal(value.version, '0.3.0')
		assert.ok(value.resolved.startsWith('https://registry.npmjs.org/'))
		assert.ok(value.integrity)
		const name = path.slice(path.lastIndexOf('node_modules/') + 13)
		assert.equal(
			Object.keys(lock.packages).filter((p) => p.endsWith('node_modules/' + name)).length,
			1,
		)
		return {
			name,
			version: value.version,
			resolved: value.resolved,
			integrity: value.integrity,
		}
	})
assert.equal(lock.packages['node_modules/@example/soxa-theme'].link, undefined)
const manifestPath = join(source, 'docs/ai/0.3.0/manifest.json')
const corpus = buildCorpus({
	manifestPath,
	packageRoot: join(cwd, 'node_modules/@soxa-ui/setup'),
	docsRevision: revision,
})
const ids = [
	'oren-configuration',
	'theme-authoring',
	'icon-replacement',
	'programmatic-control',
	'external-plugins',
	'public-recipes-validation',
]
for (const framework of ['vue', 'react', 'angular', 'solid', 'svelte', 'webc']) {
	const selected = selectDocuments(corpus, { version: '0.3.0', audience: 'consumer', framework })
	for (const id of ids) assert.ok(selected.some((d) => d.id === id))
}
const release = json(manifestPath).libraryRevision
const releasePaths = new Set(
	execFileSync('git', ['ls-tree', '-r', '--name-only', release], {
		cwd: root,
		encoding: 'utf8',
		maxBuffer: 8 * 1024 * 1024,
	})
		.trim()
		.split('\n'),
)
for (const doc of json(manifestPath).documents)
	for (const entry of doc.sources) assert.ok(releasePaths.has(entry.path), entry.path)
const evidence = {
	provenance: 'published-0.3.0',
	docsRevision: revision,
	node: process.version,
	apiSha256: hash(join(cwd, 'node_modules/@soxa-ui/setup/dist/api.json')),
	exampleInputHashes: corpus.documents
		.filter((doc) => ids.includes(doc.id))
		.flatMap((doc) => doc.examples.map(({ path, sha256 }) => ({ path, sha256 }))),
	inputHashes: ids.map((id) => {
		const doc = corpus.documents.find((d) => d.id === id)
		return { id, sha256: doc.sha256 }
	}),
	manifestSha256: hash(manifestPath),
	packages,
	lockSha256: hash(join(cwd, 'package-lock.json')),
	themeTarballSha256: hash(join(directory, 'example-soxa-theme-1.0.0.tgz')),
	strictTypes: true,
	customThemeNegativeTypes: true,
	productionBuild: true,
	npmPeers: true,
	sourceIsolation:
		'Only manifest documents/examples and public builder files copied; npm packages; packed custom theme; no Soxa workspace aliases',
	inventorySha256: hash(join(directory, 'installed-contracts.json')),
	tools: [
		'recipes-smoke.mjs',
		'recipes-browser.mjs',
		'consumer-browser.mjs',
		'corpus.mjs',
		'fetch.mjs',
	].map((path) => ({
		path: 'tools/ai-docs/' + path,
		sha256: hash(join(root, 'tools/ai-docs', path)),
	})),
}
const browser = await chromium.launch()
let server
try {
	evidence.browser = browser.version()
	server = await serve(cwd, [
		join(cwd, 'node_modules/vite/bin/vite.js'),
		'preview',
		'--host',
		'127.0.0.1',
		'--port',
		'0',
	])
	evidence.oren = await checkRecipes(
		browser,
		server.url,
		false,
		JSON.parse(inspection).replacementIcon,
	)
	evidence.custom = await checkRecipes(
		browser,
		server.url,
		true,
		JSON.parse(inspection).replacementIcon,
	)
	assert.equal(evidence.oren.iconBody, evidence.custom.iconBody)
} finally {
	server?.server.kill()
	await browser.close()
	writeFileSync(join(directory, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n')
}
console.log('Published public recipes checks passed: ' + directory)
