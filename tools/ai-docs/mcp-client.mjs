import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

// Executed in a fresh external consumer. All library instructions and code arrive over MCP.
const [server, corpus, version = '0.3.0'] = process.argv.slice(2)
const transport = new StdioClientTransport({
	command: process.execPath,
	args: corpus === '--bundled' ? [server] : [server, '--corpus', corpus],
	stderr: 'pipe',
	cwd: process.cwd(),
})
let diagnostics = ''
transport.stderr?.on('data', (bytes) => {
	diagnostics += bytes
})
const client = new Client({ name: 'soxa-docs-empty-consumer', version: '1.0.0' })
const transcript = []
const boundary = { version, audience: 'consumer', framework: 'vue' }

async function call(name, args) {
	const response = await client.callTool({ name, arguments: args })
	assert.ok(!response.isError, JSON.stringify(response))
	const value = JSON.parse(response.content[0].text)
	transcript.push({ tool: name, arguments: args, result: value })
	return value
}

async function read(name, args) {
	let offset = 0
	let text = ''
	do {
		const value = await call(name, { ...boundary, ...args, offset, limit: 2048 })
		assert.equal(value.offset, text.length)
		text += value.text
		offset = value.nextOffset
	} while (offset !== null)
	return JSON.parse(text)
}

function put(path, text) {
	const file = resolve('consumer', path)
	mkdirSync(dirname(file), { recursive: true })
	writeFileSync(file, text)
}

try {
	await client.connect(transport)
	assert.equal(client.getServerVersion().name, 'soxa-ui-docs')
	assert.equal((await client.listTools()).tools.length, 9)
	await client.ping()
	const versions = await call('list_versions', {})
	const selected = versions.versions.find((v) => v.libraryVersion === version)
	assert.ok(selected)
	assert.equal(selected.contributorGuides, 'pending')
	const provenance = selected
	const resources = await client.listResources()
	assert.equal(resources.resources[0].uri, 'soxa://versions')
	assert.equal(
		JSON.parse(
			(await client.readResource({ uri: 'soxa://versions' })).contents[0].text,
		).versions.find((v) => v.libraryVersion === version).docsRevision,
		provenance.docsRevision,
	)
	assert.equal((await client.listResourceTemplates()).resourceTemplates.length, 1)
	await client.readResource({
		uri: `soxa://docs/${version}/consumer/vue/vue-start?offset=0&limit=100`,
	})
	await call('list_components', { ...boundary, limit: 2 })
	for (const component of ['select', 'date-picker']) {
		const record = await read('get_component', { component })
		assert.equal(record.api.component, component)
		assert.ok(record.api.props.some((p) => p.name === 'value'))
	}
	if (version !== '0.3.0')
		for (const framework of ['vue', 'react', 'angular', 'solid', 'svelte', 'webc'])
			for (const component of [
				'alert',
				'alert-dialog',
				'avatar',
				'avatar-group',
				'separator',
			]) {
				const record = await read('get_component', { framework, component })
				assert.equal(record.api.component, component)
				assert.equal(record.framework, framework)
			}
	const installation = await call('get_installation', boundary)
	assert.ok(installation.items.some((entry) => entry.id === 'vue-installation'))
	await read('get_document', { id: 'vue-installation' })
	const styling = await call('styling_guide', boundary)
	assert.ok(styling.items.some((entry) => entry.id === 'oren-configuration'))
	await read('get_document', { id: 'oren-configuration' })
	const examples = []
	let exampleOffset = 0
	do {
		const result = await call('list_examples', { ...boundary, offset: exampleOffset })
		examples.push(...result.items)
		exampleOffset = result.nextOffset
	} while (exampleOffset !== null)
	const sources = []
	for (const [id, exampleId, target] of [
		['vue-installation', 'vue-main', 'src/main.ts'],
		['vue-bindings', 'recipes', 'TravelRecipes.vue'],
		['vue-controller', 'controller', 'CtrlExample.vue'],
	]) {
		assert.ok(examples.some((entry) => entry.documentId === id && entry.id === exampleId))
		const example = await read('get_example', { id, example: exampleId })
		const hash = createHash('sha256').update(example.content).digest('hex')
		assert.equal(hash, example.sha256)
		put(target, example.content)
		sources.push({ documentId: id, exampleId, target, sha256: hash })
	}
	for (const framework of ['react', 'angular', 'solid', 'svelte', 'webc'])
		await call('list_documents', { ...boundary, framework, limit: 1 })
	for (const args of [
		{ ...boundary, version: 'latest' },
		{ ...boundary, audience: 'contributor' },
		{ ...boundary, framework: 'nuxt' },
	])
		assert.equal(
			(await client.callTool({ name: 'list_documents', arguments: args })).isError,
			true,
		)
	put(
		'package.json',
		JSON.stringify(
			{
				private: true,
				type: 'module',
				dependencies: { ...provenance.packages, vue: '3.5.32' },
				devDependencies: {
					vite: '8.2.2',
					'@vitejs/plugin-vue': '6.0.8',
					typescript: '6.0.2',
					'vue-tsc': '3.3.11',
				},
			},
			null,
			2,
		),
	)
	put(
		'index.html',
		'<html lang="en"><head><link rel="icon" href="data:,"><title>MCP consumer</title></head><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>',
	)
	put(
		'vite.config.mjs',
		"import vue from '@vitejs/plugin-vue'\nexport default { plugins: [vue()] }\n",
	)
	put(
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
			include: ['src/**/*.ts', '*.vue'],
		}),
	)
	writeFileSync('mcp-transcript.json', JSON.stringify(transcript, null, 2) + '\n')
	writeFileSync(
		'mcp-evidence.json',
		JSON.stringify(
			{
				sdk: '1.32.2',
				protocol: client.getServerCapabilities(),
				server: client.getServerVersion(),
				provenance,
				sources,
				calls: transcript.length,
				context:
					'Fresh scripted SDK client. Reads no corpus/source files; receives library code and instructions only through MCP.',
			},
			null,
			2,
		) + '\n',
	)
} finally {
	await client.close()
}
assert.equal(diagnostics, '')
console.log('SDK stdio discovery/retrieval/resources/error checks passed')
