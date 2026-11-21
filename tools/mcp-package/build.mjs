import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import {
	chmodSync,
	cpSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCorpus } from '../ai-docs/corpus.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const destination = join(root, 'packages/mcp/dist')
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const temporary = mkdtempSync(join(tmpdir(), 'soxa-mcp-build-'))
const packageVersion = JSON.parse(readFileSync(join(root, 'packages/mcp/package.json'))).version
const catalog = { schemaVersion: 1, packageVersion, versions: [] }
function put(file, value) {
	const target = join(destination, file)
	mkdirSync(dirname(target), { recursive: true })
	writeFileSync(target, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n')
}
try {
	// Only this package's generated output is replaced; source documents are immutable inputs.
	if (resolve(destination) !== resolve(root, 'packages/mcp/dist'))
		throw new Error('Unexpected output')
	rmSync(destination, { recursive: true, force: true })
	mkdirSync(destination, { recursive: true })
	for (const version of ['0.3.0', '0.4.1', '0.4.2']) {
		const manifestPath = join(root, 'docs/ai', version, 'manifest.json')
		const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
		const response = await fetch(manifest.api.tarball, { signal: AbortSignal.timeout(60000) })
		if (!response.ok) throw new Error('Cannot fetch published API: ' + version)
		const bytes = Buffer.from(await response.arrayBuffer())
		const integrity = 'sha512-' + createHash('sha512').update(bytes).digest('base64')
		if (integrity !== manifest.api.integrity)
			throw new Error('Published tarball integrity mismatch')
		const directory = join(temporary, version)
		mkdirSync(directory)
		writeFileSync(join(directory, 'setup.tgz'), bytes)
		execFileSync('tar', [
			'-xzf',
			join(directory, 'setup.tgz'),
			'-C',
			directory,
			'package/package.json',
			'package/dist/api.json',
		])
		const corpus = buildCorpus({
			manifestPath,
			packageRoot: join(directory, 'package'),
			docsRevision: revision,
		})
		const { documents, ...metadata } = corpus
		const entries = documents.map(({ content: _content, api: _api, examples, ...entry }) => ({
			...entry,
			file: 'documents/' + entry.id + '.json',
			examples: examples.map(({ content: _content, ...example }) => example),
		}))
		const directoryName = 'corpora/' + version
		put(directoryName + '/index.json', { ...metadata, documents: entries })
		for (const record of documents)
			put(directoryName + '/documents/' + record.id + '.json', record)
		catalog.versions.push({ ...metadata, directory: directoryName })
	}
	put('catalog.json', catalog)
	for (const file of ['mcp.mjs', 'mcp-catalog.mjs', 'mcp-tools.mjs', 'corpus.mjs']) {
		let source = readFileSync(join(root, 'tools/ai-docs', file), 'utf8')
		if (file === 'mcp.mjs') {
			const marker = "serverInfo: { name: 'soxa-ui-docs', version: '1.0.0' }"
			if (!source.includes(marker)) throw new Error('Transport metadata marker changed')
			const version = packageVersion
			source = source.replace(
				marker,
				"serverInfo: { name: 'soxa-ui-docs', version: '" + version + "' }",
			)
		}
		put(file, source)
	}
	cpSync(join(root, 'packages/mcp/cli.mjs'), join(destination, 'cli.mjs'))
	chmodSync(join(destination, 'cli.mjs'), 0o755)
	console.log('Built @soxa-ui/mcp with ' + catalog.versions.length + ' exact corpora')
} finally {
	if (
		dirname(temporary) !== resolve(tmpdir()) ||
		!temporary.split(/[\\/]/).at(-1).startsWith('soxa-mcp-build-')
	)
		throw new Error('Unexpected build temporary directory')
	rmSync(temporary, { recursive: true, force: true })
}
