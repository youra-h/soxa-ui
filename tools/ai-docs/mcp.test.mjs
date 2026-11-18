import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import {
	mkdtempSync,
	mkdirSync,
	writeFileSync,
	readFileSync,
	symlinkSync,
	renameSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { digest, frameworks } from './corpus.mjs'
import { openCatalog } from './mcp-catalog.mjs'
import { callTool, readResource } from './mcp-tools.mjs'

function fixture(version = '0.3.0') {
	const root = mkdtempSync(join(tmpdir(), 'soxa-mcp-test-'))
	const source = 'https://github.com/youra-h/soxa-ui/blob/' + 'a'.repeat(40) + '/README.md'
	const records = [
		{
			id: 'vue-installation',
			topic: 'installation',
			framework: 'vue',
			component: null,
			status: 'sample',
			content: 'Install exact packages',
			examples: [
				{
					id: 'main',
					path: 'examples/main.ts',
					language: 'ts',
					content: 'console.log("🙂")\n',
				},
			],
		},
		{
			id: 'oren',
			topic: 'theming',
			framework: 'all',
			component: null,
			status: 'sample',
			content: 'Theme guide',
			examples: [],
		},
		{
			id: 'api-vue-select',
			topic: 'api',
			framework: 'vue',
			component: 'select',
			status: 'generated',
			content: JSON.stringify({ component: 'select', props: [] }, null, 2) + '\n',
			api: { component: 'select', props: [] },
			examples: [],
		},
	].map((record) => ({
		...record,
		title: record.id,
		version,
		language: 'en',
		audience: 'consumer',
		sources: [source],
		related: [],
		sha256: digest(record.content),
		examples: record.examples.map((e) => ({ ...e, sha256: digest(e.content) })),
	}))
	const index = {
		schemaVersion: 1,
		libraryVersion: version,
		libraryRevision: 'a'.repeat(40),
		docsRevision: 'b'.repeat(40),
		language: 'en',
		packages: { '@soxa-ui/vue': version },
		contributorGuides: 'pending',
		apiSource: { package: '@soxa-ui/setup', version, sha256: 'c'.repeat(64) },
		coverage: Object.fromEntries(
			frameworks.map((fw) => [
				fw,
				{ api: 'generated', guides: fw === 'vue' ? 'sample' : 'pending' },
			]),
		),
		documents: records.map(({ content: _content, api: _api, examples, ...entry }) => ({
			...entry,
			file: `documents/${entry.id}.json`,
			examples: examples.map(({ content: _content, ...e }) => e),
		})),
	}
	mkdirSync(join(root, 'documents'))
	for (const record of records)
		writeFileSync(join(root, `documents/${record.id}.json`), JSON.stringify(record))
	const save = () => writeFileSync(join(root, 'index.json'), JSON.stringify(index))
	save()
	return { root, index, save, catalog: () => openCatalog([root]) }
}

const boundary = { version: '0.3.0', audience: 'consumer', framework: 'vue' }
test('exact versions, truthful coverage, discovery, styling, resources and complete chunk reconstruction', () => {
	const f = fixture()
	const other = fixture('0.4.0')
	const catalog = openCatalog([f.root, other.root])
	assert.deepEqual(
		callTool(catalog, 'list_versions', {}).versions.map((v) => v.libraryVersion),
		['0.3.0', '0.4.0'],
	)
	assert.equal(
		callTool(catalog, 'list_versions', {}).versions[0].coverage.react.guides,
		'pending',
	)
	assert.equal(callTool(catalog, 'list_components', boundary).items[0].component, 'select')
	assert.equal(callTool(catalog, 'get_installation', boundary).items[0].id, 'vue-installation')
	assert.equal(callTool(catalog, 'styling_guide', boundary).items[0].id, 'oren')
	assert.equal(
		callTool(catalog, 'list_examples', boundary).items[0].documentId,
		'vue-installation',
	)
	assert.equal(callTool(catalog, 'list_documents', { ...boundary, limit: 1 }).nextOffset, 1)
	let text = ''
	let offset = 0
	do {
		const result = callTool(catalog, 'get_example', {
			...boundary,
			id: 'vue-installation',
			example: 'main',
			offset,
			limit: 1,
		})
		text += result.text
		offset = result.nextOffset
	} while (offset !== null)
	assert.equal(JSON.parse(text).content, 'console.log("🙂")\n')
	assert.equal(
		JSON.parse(callTool(catalog, 'get_component', { ...boundary, component: 'select' }).text)
			.api.component,
		'select',
	)
	assert.equal(
		readResource(catalog, 'soxa://docs/0.3.0/consumer/vue/vue-installation?offset=0&limit=10')
			.text.length,
		10,
	)
	assert.equal(readResource(catalog, 'soxa://versions').versions.length, 2)
})

test('unknown version/audience/adapter/arguments, unavailable data and invalid pagination fail explicitly', () => {
	const catalog = fixture().catalog()
	for (const args of [
		{ ...boundary, version: 'latest' },
		{ ...boundary, audience: 'contributor' },
		{ ...boundary, framework: 'nuxt' },
		{ version: '0.3.0', framework: 'vue' },
		{ ...boundary, surprise: true },
		{ ...boundary, component: 'missing' },
		{ ...boundary, limit: 51 },
		{ ...boundary, offset: -1 },
		{ ...boundary, offset: 100 },
		{ ...boundary, limit: '1' },
		{ ...boundary, offset: 0.5 },
	])
		assert.throws(() => callTool(catalog, 'list_documents', args))
	for (const key of ['constructor', 'toString', '__proto__'])
		assert.throws(
			() => callTool(catalog, 'list_versions', JSON.parse(`{"${key}":true}`)),
			/Unknown argument/,
		)
	assert.throws(() =>
		callTool(catalog, 'get_example', {
			...boundary,
			id: 'vue-installation',
			example: 'missing',
		}),
	)
	assert.throws(() => callTool(catalog, 'get_document', { ...boundary, id: '../secret' }))
	assert.throws(() =>
		callTool(catalog, 'get_document', { ...boundary, id: 'vue-installation', limit: 16001 }),
	)
	for (const uri of [
		'file:///etc/passwd',
		'soxa://docs/0.3.0/consumer/vue/oren?limit=-1',
		'soxa://docs/0.3.0/consumer/vue/oren?limit=1&limit=2',
		'soxa://docs/0.3.0/consumer/vue/oren?file=secret',
	])
		assert.throws(() => readResource(catalog, uri))
})

test('schema, coverage, duplicate versions and metadata/content corruption are rejected', () => {
	const f = fixture()
	assert.throws(() => openCatalog([f.root, f.root]), /Duplicate/)
	f.index.schemaVersion = 2
	f.save()
	assert.throws(f.catalog, /schema/)
	f.index.schemaVersion = 1
	f.index.coverage.react.guides = 'ready'
	f.save()
	assert.throws(f.catalog, /coverage disagrees/)
	f.index.coverage.react.guides = 'pending'
	f.save()
	const catalog = f.catalog()
	const file = join(f.root, 'documents/vue-installation.json')
	const record = JSON.parse(readFileSync(file, 'utf8'))
	record.content += 'changed'
	writeFileSync(file, JSON.stringify(record))
	assert.throws(() => callTool(catalog, 'get_document', { ...boundary, id: record.id }), /digest/)
	record.sha256 = digest(record.content)
	writeFileSync(file, JSON.stringify(record))
	assert.throws(
		() => callTool(catalog, 'get_document', { ...boundary, id: record.id }),
		/metadata/,
	)
})

test('record symlinks and Windows junctions cannot escape the configured corpus', () => {
	const f = fixture()
	const outside = mkdtempSync(join(tmpdir(), 'soxa-mcp-outside-'))
	writeFileSync(join(outside, 'vue-installation.json'), '{}')
	renameSync(join(f.root, 'documents'), join(f.root, 'retained-documents'))
	symlinkSync(
		outside,
		join(f.root, 'documents'),
		process.platform === 'win32' ? 'junction' : 'dir',
	)
	assert.throws(
		() => callTool(f.catalog(), 'get_document', { ...boundary, id: 'vue-installation' }),
		/escapes/,
	)
})

test('stdio lifecycle, negotiation, errors, size limits, unicode, request ordering and clean EOF', async () => {
	const f = fixture()
	const child = spawn(
		process.execPath,
		[fileURLToPath(new URL('./mcp.mjs', import.meta.url)), '--corpus', f.root],
		{ stdio: ['pipe', 'pipe', 'pipe'] },
	)
	let stdout = ''
	let stderr = ''
	child.stdout.on('data', (bytes) => {
		stdout += bytes
	})
	child.stderr.on('data', (bytes) => {
		stderr += bytes
	})
	const request = (id, method, params) =>
		JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n'
	child.stdin.write('{invalid}\n')
	child.stdin.write(request(0, 'tools/list'))
	child.stdin.write(
		request(1, 'initialize', {
			protocolVersion: 'unknown',
			capabilities: {},
			clientInfo: { name: 'test', version: '1' },
		}),
	)
	child.stdin.write(request(undefined, 'notifications/initialized'))
	child.stdin.write(request(2, 'tools/list'))
	child.stdin.write(request(3, 'tools/call', { name: 'list_versions', arguments: {} }))
	child.stdin.write(
		request(4, 'tools/call', {
			name: 'get_component',
			arguments: { ...boundary, component: 'select' },
		}),
	)
	child.stdin.write(
		request(5, 'tools/call', {
			name: 'list_documents',
			arguments: { ...boundary, version: 'latest' },
		}),
	)
	child.stdin.write(request(6, 'missing'))
	child.stdin.write(request(7, 'resources/read', { uri: 'soxa://versions' }))
	child.stdin.write(request(8, 'resources/templates/list'))
	child.stdin.write('x'.repeat(70000) + '\n')
	child.stdin.write(request(9, 'ping'))
	child.stdin.write(request(10, 'resources/read', { uri: 'file:///secret' }))
	child.stdin.write(request(11, 'tools/call', { name: 'missing' }))
	child.stdin.write(
		request(12, 'tools/call', {
			name: 'get_example',
			arguments: { ...boundary, id: 'vue-installation', example: 'main' },
		}),
	)
	child.stdin.end()
	const code = await new Promise((done, reject) => {
		child.on('error', reject)
		child.on('close', done)
	})
	assert.equal(code, 0)
	assert.equal(stderr, '')
	const messages = stdout
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line))
	const byId = (id) => messages.find((m) => m.id === id)
	assert.equal(messages[0].error.code, -32700)
	assert.equal(byId(0).error.code, -32000)
	assert.equal(byId(1).result.protocolVersion, '2025-11-25')
	assert.equal(byId(2).result.tools.length, 9)
	assert.ok(!byId(4).result.isError)
	assert.equal(byId(5).result.isError, true)
	assert.equal(byId(6).error.code, -32601)
	assert.equal(byId(7).result.contents[0].mimeType, 'application/json')
	assert.equal(byId(8).result.resourceTemplates.length, 1)
	assert.ok(messages.some((m) => m.error?.message === 'Request exceeds 64 KiB'))
	assert.deepEqual(byId(9).result, {})
	assert.equal(byId(10).error.code, -32002)
	assert.equal(byId(11).error.code, -32602)
	assert.equal(
		JSON.parse(JSON.parse(byId(12).result.content[0].text).text).content,
		'console.log("🙂")\n',
	)
	assert.ok(!stdout.includes(f.root))
})
