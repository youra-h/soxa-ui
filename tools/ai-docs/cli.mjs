import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { buildCorpus, frameworks } from './corpus.mjs'

const args = process.argv.slice(2)
const options = {}
for (let i = 0; i < args.length; i += 2) {
	if (
		!['--manifest', '--package', '--revision', '--out'].includes(args[i]) ||
		!args[i + 1] ||
		options[args[i]]
	)
		throw new Error(
			'Usage: build:ai-docs --manifest <file> --package <installed-setup-dir> --revision <docs-SHA> --out <dir>',
		)
	options[args[i]] = args[i + 1]
}
if (Object.keys(options).length !== 4) throw new Error('All four options are required')
const corpus = buildCorpus({
	manifestPath: resolve(options['--manifest']),
	packageRoot: resolve(options['--package']),
	docsRevision: options['--revision'],
})
const out = resolve(options['--out'])
if (existsSync(out) && readdirSync(out).length)
	throw new Error('Output directory must be empty; use one directory per build')
function write(path, content) {
	const file = resolve(out, path)
	mkdirSync(dirname(file), { recursive: true })
	writeFileSync(file, content)
}
const { documents, ...metadata } = corpus
const index = documents.map(({ content: _content, api: _api, examples, ...entry }) => ({
	...entry,
	file: `documents/${entry.id}.json`,
	examples: examples.map(({ content: _content, ...example }) => example),
}))
// Index and individual files are the retrieval interface; bundles are optional bulk views.
write('index.json', JSON.stringify({ ...metadata, documents: index }, null, 2) + '\n')
for (const doc of documents) write(`documents/${doc.id}.json`, JSON.stringify(doc, null, 2) + '\n')
for (const audience of ['consumer', 'contributor'])
	for (const fw of frameworks) {
		const docs = documents.filter(
			(d) => d.audience === audience && (d.framework === fw || d.framework === 'all'),
		)
		if (docs.length)
			write(
				`bundles/${audience}-${fw}.txt`,
				`# Soxa ${corpus.libraryVersion} / ${fw} / ${audience}\n\n` +
					docs
						.map(
							(d) =>
								`## ${d.title} [${d.status}]\n\n${d.content}` +
								d.examples
									.map(
										(e) =>
											`\n\n### ${e.id}\n\n\`\`\`${e.language}\n${e.content}\`\`\`\n`,
									)
									.join(''),
						)
						.join('\n\n'),
			)
	}
console.log(`${corpus.libraryVersion}: ${documents.length} documents built`)
