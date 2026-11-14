import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { buildCorpus, digest, selectDocuments } from './corpus.mjs'

const revision = 'a'.repeat(40)
function fixture() {
	const root = mkdtempSync(join(tmpdir(), 'soxa-corpus-test-'))
	const manifest = JSON.parse(
		readFileSync(new URL('../../docs/ai/0.3.0/manifest.json', import.meta.url), 'utf8'),
	)
	const source = {
		revision: manifest.libraryRevision,
		path: 'packages/setup/content/descriptors/components/button.descriptor.ts',
	}
	const api = {
		schemaVersion: 1,
		libraryVersion: '0.3.0',
		typeContext: 'library-without-theme',
		components: [
			{
				id: 'button',
				name: 'Button',
				contract: 'button',
				sources: [{ source: source.path }],
				frameworks: { vue: { exportName: 'Button' } },
			},
		],
		contracts: {
			button: {
				props: [{ name: 'text', type: 'string', hasDefault: true, default: '""' }],
				events: [{ name: 'action:click', type: '(event: MouseEvent) => void' }],
				slots: [{ name: 'default', scope: {} }],
				frameworks: {
					vue: {
						props: { text: 'text' },
						events: { 'action:click': '@action:click' },
						models: { text: '@update:text' },
						slots: { default: { name: 'default', syntax: '#default' } },
					},
				},
			},
		},
	}
	const packageRoot = join(root, 'package')
	mkdirSync(join(packageRoot, 'dist'), { recursive: true })
	writeFileSync(
		join(packageRoot, 'package.json'),
		JSON.stringify({
			name: '@soxa-ui/setup',
			version: '0.3.0',
			exports: { './api.json': './dist/api.json' },
		}),
	)
	const bytes = JSON.stringify(api)
	writeFileSync(join(packageRoot, 'dist/api.json'), bytes)
	manifest.api.sha256 = digest(bytes)
	for (const doc of manifest.documents) {
		const file = join(root, doc.path)
		mkdirSync(join(root, 'examples'), { recursive: true })
		writeFileSync(file, '# Example\n')
		for (const example of doc.examples)
			writeFileSync(join(root, example.path), '<template>Example</template>\n')
	}
	const manifestPath = join(root, 'manifest.json')
	const save = () => writeFileSync(manifestPath, JSON.stringify(manifest))
	save()
	return {
		root,
		manifest,
		manifestPath,
		packageRoot,
		save,
		build: () => {
			save()
			return buildCorpus({ manifestPath, packageRoot, docsRevision: revision })
		},
	}
}

test('builds deterministic versioned records with real adapter bindings and examples', () => {
	const f = fixture()
	const corpus = f.build()
	assert.deepEqual(corpus, f.build())
	const [doc] = selectDocuments(corpus, {
		version: '0.3.0',
		audience: 'consumer',
		framework: 'vue',
		component: 'button',
		topic: 'api',
	})
	assert.equal(doc.api.events[0].binding, '@action:click')
	assert.equal(doc.api.props[0].default, '""')
	assert.equal(doc.api.models.text, '@update:text')
	assert.equal(doc.api.slots[0].binding.syntax, '#default')
	assert.equal(
		corpus.documents.find((d) => d.id === 'vue-button').examples[0].sha256,
		digest('<template>Example</template>\n'),
	)
	assert.ok(!JSON.stringify(corpus).includes(f.root))
})

test('selection requires exact version, known framework and explicit audience', () => {
	const corpus = fixture().build()
	for (const query of [
		{ version: '0.4.0', audience: 'consumer', framework: 'vue' },
		{ version: '0.3.0', framework: 'vue' },
		{ version: '0.3.0', audience: 'consumer', framework: 'nuxt' },
		{ version: '0.3.0', audience: 'consumer', framework: 'react', topic: 'installation' },
		{ version: '0.3.0', audience: 'consumer', framework: 'vue', component: 'nonexistent' },
		{ version: '0.3.0', audience: 'contributor', framework: 'vue' },
		{ version: '0.3.0', audience: 'consumer', framework: 'vue', surprise: true },
	])
		assert.throws(() => selectDocuments(corpus, query))
	assert.equal(
		selectDocuments(corpus, { version: '0.3.0', audience: 'consumer', framework: 'react' })
			.length,
		1,
	)
})

test('consumer retrieval excludes contributor instructions', () => {
	const f = fixture()
	f.manifest.contributorGuides = 'sample'
	f.manifest.documents.push({
		...f.manifest.documents[0],
		id: 'contributing',
		audience: 'contributor',
		related: [],
	})
	const corpus = f.build()
	assert.ok(
		selectDocuments(corpus, { version: '0.3.0', audience: 'consumer', framework: 'vue' }).every(
			(d) => d.audience === 'consumer',
		),
	)
	assert.deepEqual(
		selectDocuments(corpus, {
			version: '0.3.0',
			audience: 'contributor',
			framework: 'vue',
		}).map((d) => d.id),
		['contributing'],
	)
})

test('rejects a current-checkout package or corrupt published artifact', () => {
	const f = fixture()
	const file = join(f.packageRoot, 'package.json')
	const pkg = JSON.parse(readFileSync(file, 'utf8'))
	pkg.version = '0.4.0'
	writeFileSync(file, JSON.stringify(pkg))
	assert.throws(f.build, /version mismatch/)
	pkg.version = '0.3.0'
	writeFileSync(file, JSON.stringify(pkg))
	writeFileSync(join(f.packageRoot, 'dist/api.json'), '{}')
	assert.throws(f.build, /digest mismatch/)
})

for (const [name, mutate] of [
	['missing document ID', (f) => delete f.manifest.documents[0].id],
	['missing topic', (f) => delete f.manifest.documents[0].topic],
	['false contributor coverage', (f) => (f.manifest.contributorGuides = 'ready')],
	[
		'duplicate example',
		(f) => f.manifest.documents[1].examples.push(f.manifest.documents[1].examples[0]),
	],
	['duplicate document', (f) => f.manifest.documents.push(f.manifest.documents[0])],
	['missing document', (f) => (f.manifest.documents[0].path = 'absent.md')],
	['unknown component', (f) => (f.manifest.documents[1].component = 'made-up')],
	['unsupported component adapter', (f) => (f.manifest.documents[1].framework = 'angular')],
	['unknown framework', (f) => (f.manifest.documents[1].framework = 'nuxt')],
	['missing related document', (f) => (f.manifest.documents[0].related = ['absent'])],
	['unversioned source', (f) => (f.manifest.documents[0].sources[0].revision = 'main')],
	['wrong source revision', (f) => (f.manifest.documents[0].sources[0].revision = revision)],
	['false guide coverage', (f) => (f.manifest.coverage.react.guides = 'ready')],
	['omitted framework coverage', (f) => delete f.manifest.coverage.webc],
	['unknown schema', (f) => (f.manifest.schemaVersion = 2)],
	['floating library version', (f) => (f.manifest.libraryVersion = 'latest')],
	['unsafe source', (f) => (f.manifest.documents[0].sources[0].path = 'docs/../private.md')],
	[
		'escaping local file',
		(f) => {
			writeFileSync(join(f.root, '..', 'outside.md'), '# outside')
			f.manifest.documents[0].path = '../outside.md'
		},
	],
	[
		'unregistered prose link',
		(f) => writeFileSync(join(f.root, 'overview.md'), '[Missing](absent.md)'),
	],
	['non-HTTPS external link', (f) => (f.manifest.documents[0].links = ['file:///private.md'])],
])
	test(`rejects ${name}`, () => {
		const f = fixture()
		mutate(f)
		assert.throws(f.build)
	})

test('CLI writes a selective index and prevents mixing outputs from different builds', () => {
	const f = fixture()
	const out = join(f.root, 'dist')
	const args = [
		fileURLToPath(new URL('./cli.mjs', import.meta.url)),
		'--manifest',
		f.manifestPath,
		'--package',
		f.packageRoot,
		'--revision',
		revision,
		'--out',
		out,
	]
	execFileSync(process.execPath, args)
	const index = JSON.parse(readFileSync(join(out, 'index.json'), 'utf8'))
	const [entry] = selectDocuments(index, {
		version: '0.3.0',
		audience: 'consumer',
		framework: 'vue',
		topic: 'api',
	})
	assert.equal(entry.content, undefined)
	assert.equal(entry.api, undefined)
	const full = JSON.parse(readFileSync(join(out, entry.file), 'utf8'))
	assert.equal(full.sha256, digest(full.content))
	assert.equal(full.api.export.exportName, 'Button')
	const bundle = readFileSync(join(out, 'bundles/consumer-vue.txt'), 'utf8')
	assert.ok(bundle.includes('@action:click') && bundle.includes('<template>Example</template>'))
	assert.throws(
		() => execFileSync(process.execPath, args, { stdio: 'pipe' }),
		/Output directory must be empty/,
	)
})
