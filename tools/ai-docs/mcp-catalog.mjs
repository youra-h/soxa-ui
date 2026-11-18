import { readFileSync, realpathSync, statSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { digest, frameworks, selectDocuments } from './corpus.mjs'

const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const sha = /^[a-f0-9]{64}$/
const revision = /^[a-f0-9]{40}$/
const audiences = ['consumer', 'contributor']
const maxFileBytes = 4 * 1024 * 1024

function validSlug(value) {
	return typeof value === 'string' && slug.test(value)
}

function check(condition, message) {
	if (!condition) throw new Error(message)
}

function readJSON(file) {
	check(statSync(file).size <= maxFileBytes, 'Corpus file exceeds 4 MiB')
	return JSON.parse(readFileSync(file, 'utf8'))
}

function https(value) {
	const url = new URL(value)
	return url.protocol === 'https:' && !url.username && !url.password
}

/** Load indexes once; read and verify only the requested record, never bulk bundles. */
export function openCatalog(directories) {
	check(directories.length > 0, 'At least one corpus directory is required')
	const corpora = new Map()
	for (const directory of directories) {
		const root = realpathSync(directory)
		const index = readJSON(resolve(root, 'index.json'))
		check(index.schemaVersion === 1, 'Unsupported documentation schema')
		check(
			/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(index.libraryVersion),
			'Invalid library version',
		)
		check(
			revision.test(index.docsRevision) && revision.test(index.libraryRevision),
			'Invalid corpus revisions',
		)
		check(!corpora.has(index.libraryVersion), 'Duplicate library version')
		check(
			index.apiSource?.version === index.libraryVersion && sha.test(index.apiSource.sha256),
			'Invalid API provenance',
		)
		check(index.apiSource.package === '@soxa-ui/setup', 'Unknown API source')
		check(
			index.language === 'en' && index.packages && typeof index.packages === 'object',
			'Invalid corpus metadata',
		)
		check(
			['pending', 'sample', 'ready'].includes(index.contributorGuides),
			'Invalid contributor coverage',
		)
		check(
			index.coverage &&
				Object.keys(index.coverage).sort().join() === [...frameworks].sort().join(),
			'Coverage must name six adapters',
		)
		check(
			Array.isArray(index.documents) && index.documents.length > 0,
			'Missing document index',
		)
		const ids = new Set()
		for (const entry of index.documents) {
			check(validSlug(entry.id) && !ids.has(entry.id), 'Invalid or duplicate document ID')
			ids.add(entry.id)
			check(entry.file === `documents/${entry.id}.json`, 'Invalid document file')
			check(
				entry.version === index.libraryVersion && entry.language === index.language,
				'Document version mismatch',
			)
			check(
				audiences.includes(entry.audience) &&
					[...frameworks, 'all'].includes(entry.framework),
				'Invalid document boundary',
			)
			check(
				validSlug(entry.topic) && (entry.component === null || validSlug(entry.component)),
				'Invalid document topic/component',
			)
			check(
				typeof entry.title === 'string' && sha.test(entry.sha256),
				'Invalid document metadata',
			)
			check(
				['pending', 'sample', 'ready', 'generated'].includes(entry.status),
				'Invalid document status',
			)
			check(
				Array.isArray(entry.sources) && entry.sources.every(https),
				'Invalid document sources',
			)
			check(!entry.origin || https(entry.origin), 'Invalid document origin')
			check(
				Array.isArray(entry.related) && Array.isArray(entry.examples),
				'Invalid document relations/examples',
			)
			const examples = new Set()
			for (const example of entry.examples) {
				check(
					validSlug(example.id) && !examples.has(example.id) && sha.test(example.sha256),
					'Invalid example metadata',
				)
				examples.add(example.id)
			}
		}
		for (const entry of index.documents)
			check(
				entry.related.every((id) => ids.has(id)),
				'Missing related record',
			)
		for (const framework of frameworks) {
			const coverage = index.coverage[framework]
			check(
				coverage.api === 'generated' &&
					['pending', 'sample', 'ready'].includes(coverage.guides),
				'Invalid adapter coverage',
			)
			const guides = index.documents.filter(
				(d) => d.audience === 'consumer' && d.framework === framework && d.topic !== 'api',
			)
			check(
				coverage.guides === 'pending' ? guides.length === 0 : guides.length > 0,
				'Guide coverage disagrees with index',
			)
		}
		check(
			index.contributorGuides === 'pending'
				? !index.documents.some((d) => d.audience === 'contributor')
				: index.documents.some((d) => d.audience === 'contributor'),
			'Contributor coverage disagrees with index',
		)
		corpora.set(index.libraryVersion, { root, index })
	}

	function corpus(version) {
		const found = corpora.get(version)
		check(found, 'Requested documentation version is unavailable; call list_versions')
		return found
	}

	function provenance(index) {
		const {
			schemaVersion,
			libraryVersion,
			libraryRevision,
			docsRevision,
			language,
			packages,
			coverage,
			contributorGuides,
			apiSource,
		} = index
		return {
			schemaVersion,
			libraryVersion,
			libraryRevision,
			docsRevision,
			language,
			packages,
			coverage,
			contributorGuides,
			apiSource,
		}
	}

	function select(query) {
		const { index } = corpus(query.version)
		return { provenance: provenance(index), documents: selectDocuments(index, query) }
	}

	function document(query) {
		check(query.id, 'Choose a document ID')
		const { documents, provenance } = select(query)
		check(documents.length === 1, 'Choose one document')
		const entry = documents[0]
		const { root } = corpus(query.version)
		const file = realpathSync(resolve(root, entry.file))
		const path = relative(root, file)
		check(
			path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path),
			'Document escapes corpus directory',
		)
		const record = readJSON(file)
		const { content, api: _api, examples, ...metadata } = record
		const { file: _file, ...indexed } = entry
		check(Array.isArray(examples), 'Missing record examples')
		// The index is a startup snapshot; reject records changed underneath that snapshot.
		check(
			isDeepStrictEqual(
				{
					...metadata,
					examples: examples.map(({ content: _content, ...e }) => e),
				},
				indexed,
			),
			'Record metadata differs from index',
		)
		check(
			typeof content === 'string' && digest(content) === entry.sha256,
			'Document content digest mismatch',
		)
		for (const example of examples)
			check(
				typeof example.content === 'string' && digest(example.content) === example.sha256,
				'Example content digest mismatch',
			)
		if (record.topic === 'api') {
			check(
				record.api && record.api.component === record.component,
				'Missing or inconsistent API surface',
			)
			check(
				JSON.stringify(record.api, null, 2) + '\n' === content,
				'API differs from hashed content',
			)
		}
		return { provenance, record }
	}

	return {
		versions: () => [...corpora.values()].map(({ index }) => provenance(index)),
		select,
		document,
	}
}
