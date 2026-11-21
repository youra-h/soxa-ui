import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { openCatalog } from '../ai-docs/mcp-catalog.mjs'

const dist = fileURLToPath(new URL('../../packages/mcp/dist/', import.meta.url))
const catalog = JSON.parse(readFileSync(join(dist, 'catalog.json'), 'utf8'))
assert.equal(catalog.schemaVersion, 1)
const manifest = JSON.parse(
	readFileSync(new URL('../../packages/mcp/package.json', import.meta.url)),
)
assert.equal(catalog.packageVersion, manifest.version, 'Rebuild MCP after version changes')
for (const file of ['cli.mjs', 'mcp.mjs', 'mcp-catalog.mjs', 'mcp-tools.mjs', 'corpus.mjs'])
	assert.ok(readFileSync(join(dist, file), 'utf8').length > 0)
assert.deepEqual(
	catalog.versions.map((v) => v.libraryVersion),
	['0.3.0', '0.4.1', '0.4.2'],
)
const loaded = openCatalog(catalog.versions.map((v) => join(dist, v.directory)))
for (const version of loaded.versions()) {
	const query = { version: version.libraryVersion, audience: 'consumer', framework: 'all' }
	const index = JSON.parse(
		readFileSync(join(dist, 'corpora', version.libraryVersion, 'index.json'), 'utf8'),
	)
	for (const entry of index.documents)
		loaded.document({
			...query,
			framework: entry.framework,
			audience: entry.audience,
			id: entry.id,
		})
	const { directory: _directory, ...metadata } = catalog.versions.find(
		(v) => v.libraryVersion === version.libraryVersion,
	)
	assert.deepEqual(metadata, version)
}
for (const file of readdirSync(dist, { recursive: true }))
	assert.ok(!/\.(md|txt|ts|tsx|vue|svelte)$/.test(file), 'Unexpected delivery file: ' + file)
console.error('MCP corpora and record hashes verified')
