import { createHash } from 'node:crypto'
import { readFileSync, realpathSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'

export const frameworks = ['vue', 'react', 'angular', 'solid', 'svelte', 'webc']
const audiences = ['consumer', 'contributor']
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const revision = /^[a-f0-9]{40}$/
const exactVersion = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/

function validSlug(value) {
	return typeof value === 'string' && slug.test(value)
}

function requireThat(condition, message) {
	if (!condition) throw new Error(message)
}

export function digest(bytes) {
	return createHash('sha256').update(bytes).digest('hex')
}

function localFile(root, path) {
	requireThat(
		typeof path === 'string' && !path.includes('\\') && !isAbsolute(path),
		'Expected a relative source path',
	)
	const absolute = realpathSync(resolve(root, path))
	const rel = relative(realpathSync(root), absolute)
	requireThat(
		rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel),
		'Source escapes documentation directory',
	)
	return absolute
}

function sourceLink(source) {
	requireThat(
		source &&
			revision.test(source.revision) &&
			typeof source.path === 'string' &&
			/^(?:README\.md|(?:docs|packages|\.github)\/[a-zA-Z0-9_./-]+)$/.test(source.path) &&
			!source.path.split('/').includes('..'),
		'Expected a public repository source with a full revision',
	)
	return `https://github.com/youra-h/soxa-ui/blob/${source.revision}/${source.path}`
}

function checkLink(href) {
	let url
	try {
		url = new URL(href)
	} catch {
		throw new Error(`Invalid external link: ${href}`)
	}
	requireThat(
		url.protocol === 'https:' && !url.username && !url.password,
		'Only public HTTPS links are supported',
	)
}

/** Build only from the selected release's published artifact, never the current checkout API. */
export function buildCorpus({ manifestPath, packageRoot, docsRevision }) {
	requireThat(revision.test(docsRevision), 'docsRevision must be a full commit SHA')
	const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
	requireThat(manifest.schemaVersion === 1, 'Unsupported documentation schema')
	requireThat(exactVersion.test(manifest.libraryVersion), 'Expected an exact library version')
	requireThat(revision.test(manifest.libraryRevision), 'Expected a library release revision')
	requireThat(manifest.language === 'en', 'Source documentation must be English')
	requireThat(
		Array.isArray(manifest.documents) && manifest.documents.length > 0,
		'Documents are required',
	)
	requireThat(
		manifest.api.package === '@soxa-ui/setup' &&
			manifest.api.export === '@soxa-ui/setup/api.json',
		'Unsupported API source',
	)
	requireThat(
		manifest.api.version === manifest.libraryVersion,
		'API version does not match documentation',
	)
	requireThat(/^[a-f0-9]{64}$/.test(manifest.api.sha256), 'Expected API SHA-256')
	requireThat(/^sha512-[A-Za-z0-9+/]+=*$/.test(manifest.api.integrity), 'Expected npm integrity')
	checkLink(manifest.api.tarball)

	const pkg = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'))
	requireThat(
		pkg.name === manifest.api.package && pkg.version === manifest.libraryVersion,
		'Installed API package version mismatch',
	)
	requireThat(pkg.exports['./api.json'] === './dist/api.json', 'Missing published API export')
	const apiBytes = readFileSync(resolve(packageRoot, 'dist/api.json'))
	requireThat(digest(apiBytes) === manifest.api.sha256, 'API digest mismatch')
	const api = JSON.parse(apiBytes)
	requireThat(
		api.schemaVersion === 1 && api.libraryVersion === manifest.libraryVersion,
		'API schema or library version mismatch',
	)
	requireThat(api.typeContext === 'library-without-theme', 'Unknown API type context')

	requireThat(
		manifest.packages && Object.keys(manifest.packages).length > 0,
		'Exact example packages are required',
	)
	for (const [name, version] of Object.entries(manifest.packages))
		requireThat(
			/^@soxa-ui\/[a-z-]+$/.test(name) && exactVersion.test(version),
			'Invalid example package pin',
		)
	requireThat(
		['pending', 'sample', 'ready'].includes(manifest.contributorGuides),
		'Unknown contributor coverage',
	)

	const root = dirname(manifestPath)
	const docs = []
	const ids = new Set()
	for (const entry of manifest.documents) {
		requireThat(validSlug(entry.id) && !ids.has(entry.id), 'Invalid or duplicate document ID')
		ids.add(entry.id)
		requireThat(
			typeof entry.title === 'string' && entry.title.trim(),
			'Document title is required',
		)
		requireThat(audiences.includes(entry.audience), 'Unknown document audience')
		requireThat(
			entry.framework === 'all' || frameworks.includes(entry.framework),
			'Unknown document framework',
		)
		requireThat(validSlug(entry.topic), 'Invalid document topic')
		requireThat(['sample', 'ready'].includes(entry.status), 'Unknown document status')
		requireThat(
			Array.isArray(entry.sources) && entry.sources.length > 0,
			'Document sources are required',
		)
		const sources = entry.sources.map(sourceLink)
		requireThat(
			entry.sources.every((s) => s.revision === manifest.libraryRevision),
			'Sources must reference the documented release',
		)
		requireThat(
			Array.isArray(entry.related) && Array.isArray(entry.examples),
			'Related documents and examples are required',
		)
		for (const href of entry.links ?? []) checkLink(href)
		if (entry.component !== null) {
			const component = api.components.find((c) => c.id === entry.component)
			requireThat(component, 'Unknown component reference')
			requireThat(
				entry.framework === 'all' || component.frameworks[entry.framework],
				'Component is unavailable in this framework',
			)
		}

		const content = readFileSync(localFile(root, entry.path), 'utf8').replace(/\r\n/g, '\n')
		requireThat(content.trim(), 'Empty document')
		// Local prose links use document IDs, keeping website routes outside the source contract.
		for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
			requireThat(entry.links?.includes(match[1]), 'Prose link must be declared in links')
			checkLink(match[1])
		}
		const exampleIds = new Set()
		const examples = entry.examples.map((example) => {
			requireThat(
				validSlug(example.id) && !exampleIds.has(example.id),
				'Invalid or duplicate example ID',
			)
			exampleIds.add(example.id)
			const code = readFileSync(localFile(root, example.path), 'utf8').replace(/\r\n/g, '\n')
			requireThat(code.trim(), 'Empty example')
			requireThat(
				typeof example.language === 'string' && example.language.length,
				'Example language is required',
			)
			return { ...example, content: code, sha256: digest(code) }
		})
		docs.push({
			...entry,
			version: manifest.libraryVersion,
			language: 'en',
			content,
			sha256: digest(content),
			sources,
			examples,
			origin: `https://github.com/youra-h/soxa-ui/blob/${docsRevision}/docs/ai/${manifest.libraryVersion}/${entry.path}`,
		})
	}

	const apiSource = {
		package: manifest.api.package,
		version: manifest.api.version,
		sha256: manifest.api.sha256,
	}
	for (const component of api.components) {
		requireThat(validSlug(component.id), 'Invalid API component ID')
		for (const framework of frameworks) {
			if (!component.frameworks[framework]) continue
			const contract = api.contracts[component.contract]
			requireThat(contract?.frameworks[framework], 'Missing API contract bindings')
			const bindings = contract.frameworks[framework]
			const surface = {
				component: component.id,
				name: component.name,
				export: component.frameworks[framework],
				typeContext: api.typeContext,
				scopedSlots: framework !== 'webc',
				props: contract.props
					.filter((prop) => Object.hasOwn(bindings.props, prop.name))
					.map((prop) => ({ ...prop, binding: bindings.props[prop.name] })),
				events: contract.events.map((event) => ({
					...event,
					binding: bindings.events[event.name],
				})),
				models: bindings.models,
				slots: contract.slots.map((slot) => ({
					...slot,
					binding: bindings.slots[slot.name],
				})),
			}
			const content = JSON.stringify(surface, null, 2) + '\n'
			const id = `api-${framework}-${component.id}`
			requireThat(!ids.has(id), 'API document ID collision')
			ids.add(id)
			docs.push({
				id,
				title: `${component.name} API (${framework})`,
				version: manifest.libraryVersion,
				language: 'en',
				audience: 'consumer',
				framework,
				topic: 'api',
				component: component.id,
				status: 'generated',
				sources: component.sources.map((s) =>
					sourceLink({ revision: manifest.libraryRevision, path: s.source }),
				),
				apiSource,
				related: [],
				examples: [],
				api: surface,
				content,
				sha256: digest(content),
			})
		}
	}
	for (const entry of docs)
		for (const id of entry.related) requireThat(ids.has(id), `Missing related document: ${id}`)
	requireThat(
		manifest.coverage &&
			Object.keys(manifest.coverage).sort().join() === [...frameworks].sort().join(),
		'Coverage must name all six frameworks',
	)
	for (const fw of frameworks) {
		const coverage = manifest.coverage[fw]
		requireThat(
			['pending', 'sample', 'ready'].includes(coverage.guides),
			'Unknown guide coverage',
		)
		requireThat(coverage.api === 'generated', 'API coverage must be generated')
		const guides = docs.filter(
			(d) => d.framework === fw && d.audience === 'consumer' && d.topic !== 'api',
		)
		requireThat(
			coverage.guides === 'pending' ? guides.length === 0 : guides.length > 0,
			'Guide coverage disagrees with documents',
		)
	}
	const contributorDocs = docs.filter((d) => d.audience === 'contributor')
	requireThat(
		manifest.contributorGuides === 'pending'
			? contributorDocs.length === 0
			: contributorDocs.length > 0,
		'Contributor coverage disagrees with documents',
	)
	docs.sort((a, b) => a.id.localeCompare(b.id, 'en'))
	return {
		schemaVersion: 1,
		libraryVersion: manifest.libraryVersion,
		libraryRevision: manifest.libraryRevision,
		docsRevision,
		language: 'en',
		packages: manifest.packages,
		contributorGuides: manifest.contributorGuides,
		apiSource: manifest.api,
		coverage: manifest.coverage,
		documents: docs,
	}
}

/** No default version or audience: callers must choose the boundary before retrieving content. */
export function selectDocuments(corpus, query) {
	requireThat(
		query.version === corpus.libraryVersion,
		'Requested documentation version is unavailable',
	)
	requireThat(audiences.includes(query.audience), 'Choose consumer or contributor')
	requireThat(
		query.framework === 'all' || frameworks.includes(query.framework),
		'Unknown requested framework',
	)
	const allowed = ['version', 'audience', 'framework', 'topic', 'component', 'id']
	requireThat(
		Object.keys(query).every((key) => allowed.includes(key)),
		'Unknown query field',
	)
	for (const key of ['topic', 'component', 'id'])
		if (Object.hasOwn(query, key)) requireThat(validSlug(query[key]), 'Invalid query ' + key)
	const result = corpus.documents.filter(
		(d) =>
			d.audience === query.audience &&
			(d.framework === 'all' || d.framework === query.framework) &&
			(!query.topic || d.topic === query.topic) &&
			(!query.component || d.component === query.component) &&
			(!query.id || d.id === query.id),
	)
	requireThat(result.length > 0, 'No documents match the requested coverage')
	return result
}
