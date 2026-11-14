import { mkdirSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const commit = /^[a-f0-9]{40}$/
const versionPattern = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/
function relativePath(path) {
	if (
		typeof path !== 'string' ||
		!/^[a-zA-Z0-9_./-]+$/.test(path) ||
		path.startsWith('/') ||
		path.split('/').some((part) => !part || part === '.' || part === '..')
	)
		throw new Error('Invalid documentation file path')
	return path
}

/** Fetch only public documentation files from one immutable repository revision. */
export async function fetchSource({ revision, version, out, fetchFile = fetch }) {
	if (!commit.test(revision) || !versionPattern.test(version))
		throw new Error('Choose an exact version and full documentation commit SHA')
	const directory = resolve(out)
	if (existsSync(directory) && readdirSync(directory).length)
		throw new Error('Source output directory must be empty')
	const base = `https://raw.githubusercontent.com/youra-h/soxa-ui/${revision}/`
	async function get(path) {
		const response = await fetchFile(base + relativePath(path), {
			signal: AbortSignal.timeout(30000),
		})
		if (!response.ok)
			throw new Error(`Documentation download failed (${response.status}): ${path}`)
		return response.text()
	}
	const manifestPath = `docs/ai/${version}/manifest.json`
	const manifestText = await get(manifestPath)
	const manifest = JSON.parse(manifestText)
	if (
		manifest.schemaVersion !== 1 ||
		manifest.libraryVersion !== version ||
		!Array.isArray(manifest.documents)
	)
		throw new Error('Downloaded manifest schema/version mismatch')
	const paths = new Set(['tools/ai-docs/cli.mjs', 'tools/ai-docs/corpus.mjs'])
	for (const doc of manifest.documents) {
		paths.add(`docs/ai/${version}/${relativePath(doc.path)}`)
		if (!Array.isArray(doc.examples)) throw new Error('Missing example metadata')
		for (const example of doc.examples)
			paths.add(`docs/ai/${version}/${relativePath(example.path)}`)
	}
	// Complete all downloads before writing, so a missing file never leaves a usable partial source.
	const files = [[manifestPath, manifestText]]
	for (const path of [...paths].sort()) files.push([path, await get(path)])
	files.push([
		'revision.json',
		JSON.stringify({ schemaVersion: 1, docsRevision: revision, libraryVersion: version }) +
			'\n',
	])
	for (const [path, text] of files) {
		const file = resolve(directory, path)
		mkdirSync(dirname(file), { recursive: true })
		writeFileSync(file, text)
	}
	return {
		files: files.length,
		bytes: files.reduce((sum, [, text]) => sum + Buffer.byteLength(text), 0),
	}
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const args = process.argv.slice(2)
	const options = {}
	for (let i = 0; i < args.length; i += 2) {
		if (
			!['--revision', '--version', '--out'].includes(args[i]) ||
			!args[i + 1] ||
			options[args[i]]
		)
			throw new Error(
				'Usage: fetch.mjs --revision <docs-SHA> --version <library-version> --out <empty-dir>',
			)
		options[args[i]] = args[i + 1]
	}
	if (Object.keys(options).length !== 3)
		throw new Error('Revision, version and output are required')
	console.log(
		await fetchSource({
			revision: options['--revision'],
			version: options['--version'],
			out: options['--out'],
		}),
	)
}
