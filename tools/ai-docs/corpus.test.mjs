import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { buildCorpus, digest, selectDocuments } from './corpus.mjs'

const revision = 'a'.repeat(40)
function fixture() {
	const root = mkdtempSync(join(tmpdir(), 'soxa-corpus-test-'))
	const manifest = JSON.parse(
		readFileSync(new URL('../../docs/ai/0.3.0/manifest.json', import.meta.url), 'utf8'),
	)
	manifest.documents = manifest.documents.slice(0, 2)
	manifest.coverage.react.guides = 'pending'
	manifest.coverage.angular.guides = 'pending'
	manifest.coverage.svelte.guides = 'pending'
	manifest.coverage.solid.guides = 'pending'
	manifest.coverage.webc.guides = 'pending'
	manifest.documents[0].related = ['vue-button']
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
		for (const example of doc.examples) {
			mkdirSync(dirname(join(root, example.path)), { recursive: true })
			writeFileSync(join(root, example.path), '<template>Example</template>\n')
		}
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

test('selective source delivery pins every request and fetches only declared public files', async () => {
	const f = fixture()
	const { fetchSource } = await import('./fetch.mjs')
	const requested = []
	const source = await fetchSource({
		revision,
		version: '0.3.0',
		out: join(f.root, 'downloaded'),
		fetchFile: async (url) => {
			requested.push(url)
			if (url.endsWith('manifest.json')) return new Response(JSON.stringify(f.manifest))
			return new Response('public content')
		},
	})
	assert.equal(source.files, 7)
	assert.equal(requested.length, 6)
	assert.ok(
		requested.every((url) =>
			url.startsWith('https://raw.githubusercontent.com/youra-h/soxa-ui/' + revision + '/'),
		),
	)
	assert.ok(!requested.some((url) => /AGENTS|memory|test|smoke/.test(url)))
	assert.ok(!requested.some((url) => /mcp/.test(url)))
	assert.deepEqual(JSON.parse(readFileSync(join(f.root, 'downloaded/revision.json'), 'utf8')), {
		schemaVersion: 1,
		docsRevision: revision,
		libraryVersion: '0.3.0',
	})
})

test('optional MCP delivery adds only runtime files without changing older pinned downloads', async () => {
	const f = fixture()
	const { fetchSource } = await import('./fetch.mjs')
	const requested = []
	const source = await fetchSource({
		revision,
		version: '0.3.0',
		out: join(f.root, 'mcp-source'),
		includeMcp: true,
		fetchFile: async (url) => {
			requested.push(url)
			return new Response(
				url.endsWith('manifest.json') ? JSON.stringify(f.manifest) : 'public content',
			)
		},
	})
	assert.equal(source.files, 10)
	assert.equal(requested.filter((url) => /mcp/.test(url)).length, 3)
	assert.ok(!requested.some((url) => /client|smoke|test/.test(url)))
})

test('source download rejects missing remote files, unsafe paths and wrong versions before writing', async () => {
	const { fetchSource } = await import('./fetch.mjs')
	for (const mode of ['missing', 'path', 'version']) {
		const f = fixture()
		if (mode === 'path') f.manifest.documents[0].path = '../private.md'
		if (mode === 'version') f.manifest.libraryVersion = '0.4.0'
		await assert.rejects(() =>
			fetchSource({
				revision,
				version: '0.3.0',
				out: join(f.root, 'failed'),
				fetchFile: async (url) =>
					url.endsWith('manifest.json')
						? new Response(JSON.stringify(f.manifest))
						: new Response('', { status: 404 }),
			}),
		)
		assert.equal(existsSync(join(f.root, 'failed')), false)
	}
})

test('Vue recipe registration retains nested Nuxt delivery without changing the schema', async () => {
	const manifest = JSON.parse(
		readFileSync(new URL('../../docs/ai/0.3.0/manifest.json', import.meta.url), 'utf8'),
	)
	assert.equal(manifest.schemaVersion, 1)
	for (const id of [
		'vue-start',
		'vue-installation',
		'vue-bindings',
		'vue-composition',
		'vue-controller',
		'vue-nuxt',
		'vue-errors',
	])
		assert.ok(manifest.documents.some((doc) => doc.id === id && doc.framework === 'vue'))
	const { fetchSource } = await import('./fetch.mjs')
	const root = mkdtempSync(join(tmpdir(), 'soxa-nested-delivery-'))
	const requested = []
	await fetchSource({
		revision,
		version: '0.3.0',
		out: join(root, 'source'),
		fetchFile: async (url) => {
			requested.push(url)
			return new Response(
				url.endsWith('manifest.json') ? JSON.stringify(manifest) : 'public file',
			)
		},
	})
	for (const entry of manifest.documents)
		for (const example of entry.examples) {
			assert.ok(existsSync(join(root, 'source/docs/ai/0.3.0', example.path)))
			assert.ok(requested.some((url) => url.endsWith('/' + example.path)))
		}
})

test('React guide registration and Next examples remain selectively deliverable', async () => {
	const manifest = JSON.parse(
		readFileSync(new URL('../../docs/ai/0.3.0/manifest.json', import.meta.url), 'utf8'),
	)
	assert.equal(manifest.packages['@soxa-ui/react'], '0.3.0')
	assert.equal(manifest.packages['@soxa-ui/vue'], '0.3.0')
	assert.equal(manifest.coverage.react.guides, 'sample')
	const guides = manifest.documents.filter((doc) => doc.framework === 'react')
	assert.deepEqual(
		guides.map((doc) => doc.id),
		[
			'react-start',
			'react-installation',
			'react-bindings',
			'react-composition',
			'react-controller',
			'react-next',
			'react-errors',
		],
	)
	assert.equal(guides.find((doc) => doc.id === 'react-next').topic, 'next')
	const { fetchSource } = await import('./fetch.mjs')
	const root = mkdtempSync(join(tmpdir(), 'soxa-react-delivery-'))
	await fetchSource({
		revision,
		version: '0.3.0',
		out: root,
		fetchFile: async (url) =>
			new Response(url.endsWith('manifest.json') ? JSON.stringify(manifest) : 'public file'),
	})
	for (const doc of guides)
		for (const example of doc.examples)
			assert.ok(existsSync(join(root, 'docs/ai/0.3.0', example.path)))
})

test('React topic selection returns its guide without leaking Vue recipes', () => {
	const f = fixture()
	f.manifest.coverage.react.guides = 'sample'
	f.manifest.documents.push({
		...f.manifest.documents[0],
		id: 'react-next-fixture',
		path: 'react.md',
		framework: 'react',
		topic: 'next',
		related: [],
	})
	writeFileSync(join(f.root, 'react.md'), '# React Next consumer fixture\n')
	const corpus = f.build()
	assert.deepEqual(
		selectDocuments(corpus, {
			version: '0.3.0',
			audience: 'consumer',
			framework: 'react',
			topic: 'next',
		}).map((doc) => doc.id),
		['react-next-fixture'],
	)
	assert.ok(
		selectDocuments(corpus, {
			version: '0.3.0',
			audience: 'consumer',
			framework: 'react',
		}).every((doc) => doc.framework === 'react' || doc.framework === 'all'),
	)
})

test('Angular recipes retain exact pins, API relations and standalone nested sources', async () => {
	const manifest = JSON.parse(
		readFileSync(new URL('../../docs/ai/0.3.0/manifest.json', import.meta.url), 'utf8'),
	)
	assert.equal(manifest.schemaVersion, 1)
	assert.equal(manifest.packages['@soxa-ui/angular'], '0.3.0')
	assert.equal(manifest.coverage.angular.guides, 'sample')
	const guides = manifest.documents.filter((doc) => doc.framework === 'angular')
	assert.deepEqual(
		guides.map((doc) => doc.id),
		[
			'angular-start',
			'angular-installation',
			'angular-bindings',
			'angular-composition',
			'angular-controller',
			'angular-ssr',
			'angular-errors',
		],
	)
	assert.ok(
		guides.find((doc) => doc.id === 'angular-bindings').related.includes('api-angular-input'),
	)
	assert.ok(
		guides
			.find((doc) => doc.id === 'angular-composition')
			.related.includes('api-angular-accordion-item'),
	)
	const examples = guides.flatMap((doc) => doc.examples)
	for (const file of [
		'package.json',
		'angular.json',
		'tsconfig.json',
		'tsconfig.app.json',
		'src/main.ts',
		'src/main.server.ts',
		'src/server.ts',
		'src/styles.css',
		'src/app/app.ts',
		'src/app/controller.ts',
		'src/app/app.config.ts',
		'src/app/app.config.server.ts',
		'src/app/app.routes.server.ts',
	])
		assert.ok(
			examples.some((example) => example.path === 'examples/angular/' + file),
			file,
		)
	const { fetchSource } = await import('./fetch.mjs')
	const root = mkdtempSync(join(tmpdir(), 'soxa-angular-delivery-'))
	const requested = []
	await fetchSource({
		revision,
		version: '0.3.0',
		out: root,
		fetchFile: async (url) => {
			requested.push(url)
			return new Response(
				url.endsWith('manifest.json') ? JSON.stringify(manifest) : 'public source',
			)
		},
	})
	for (const example of examples) {
		assert.ok(existsSync(join(root, 'docs/ai/0.3.0', example.path)))
		assert.ok(requested.some((url) => url.endsWith('/' + example.path)))
	}
})

test('Angular SSR selection excludes other framework recipes and keeps shared records', () => {
	const f = fixture()
	f.manifest.coverage.angular.guides = 'sample'
	f.manifest.documents.push({
		...f.manifest.documents[0],
		id: 'angular-ssr-fixture',
		path: 'angular.md',
		framework: 'angular',
		topic: 'ssr',
		related: [],
	})
	writeFileSync(join(f.root, 'angular.md'), '# Angular consumer fixture\n')
	const corpus = f.build()
	assert.deepEqual(
		selectDocuments(corpus, {
			version: '0.3.0',
			audience: 'consumer',
			framework: 'angular',
			topic: 'ssr',
		}).map((doc) => doc.id),
		['angular-ssr-fixture'],
	)
	const selected = selectDocuments(corpus, {
		version: '0.3.0',
		audience: 'consumer',
		framework: 'angular',
	})
	assert.ok(selected.some((doc) => doc.framework === 'all'))
	assert.ok(selected.every((doc) => doc.framework === 'angular' || doc.framework === 'all'))
	assert.ok(!selected.some((doc) => /vue|react/.test(doc.framework)))
})

test('SvelteKit plus-prefixed routes are selectively delivered without accepting traversal', async () => {
	const { fetchSource } = await import('./fetch.mjs')
	const manifest = JSON.parse(
		readFileSync(new URL('../../docs/ai/0.3.0/manifest.json', import.meta.url), 'utf8'),
	)
	const requests = []
	const out = mkdtempSync(join(tmpdir(), 'soxa-svelte-delivery-'))
	await fetchSource({
		revision,
		version: '0.3.0',
		out,
		fetchFile: async (url) => {
			const file = url.split('/' + revision + '/')[1]
			requests.push(file)
			return {
				ok: true,
				text: async () => readFileSync(new URL('../../' + file, import.meta.url), 'utf8'),
			}
		},
	})
	assert.ok(requests.includes('docs/ai/0.3.0/examples/sveltekit/src/routes/+page.svelte'))
	assert.ok(requests.includes('docs/ai/0.3.0/examples/sveltekit/src/routes/+layout.svelte'))
	assert.ok(requests.includes('docs/ai/0.3.0/examples/sveltekit/src/routes/away/+page.svelte'))
	assert.equal(manifest.coverage.svelte.guides, 'sample')
	for (const unsafe of [
		'examples/../secret',
		'examples/%2e%2e/secret',
		'examples/+page.svelte?query',
		'examples/+page.svelte#hash',
	]) {
		const bad = structuredClone(manifest)
		bad.documents.find((d) => d.id === 'svelte-installation').examples[0].path = unsafe
		await assert.rejects(
			() =>
				fetchSource({
					revision,
					version: '0.3.0',
					out: mkdtempSync(join(tmpdir(), 'soxa-svelte-rejected-')),
					fetchFile: async () => ({ ok: true, text: async () => JSON.stringify(bad) }),
				}),
			/Invalid documentation file path/,
		)
	}
})

test('development tarballs identify committed PR sources and reject uncommitted packages', async () => {
	const { committedLibraryRevision } = await import('./svelte-development.mjs')
	const root = mkdtempSync(join(tmpdir(), 'soxa-development-revision-'))
	const git = (...args) =>
		execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim()
	git('init', '--initial-branch=main')
	mkdirSync(join(root, 'packages'))
	const source = join(root, 'packages/source.txt')
	writeFileSync(source, 'main')
	git('add', '.')
	const commit = () =>
		git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'fixture')
	commit()
	git('update-ref', 'refs/remotes/origin/main', 'HEAD')
	git('switch', '-c', 'fix/local-theme')
	writeFileSync(source, 'PR fix')
	git('add', '.')
	commit()

	assert.notEqual(git('rev-parse', 'HEAD'), git('rev-parse', 'origin/main'))
	assert.equal(committedLibraryRevision(root), git('rev-parse', 'HEAD'))

	writeFileSync(source, 'dirty')
	assert.throws(() => committedLibraryRevision(root))
	git('add', '.')
	assert.throws(() => committedLibraryRevision(root))
	commit()
	writeFileSync(join(root, 'packages/untracked.txt'), 'untracked')
	assert.throws(() => committedLibraryRevision(root), /No untracked library sources/)
})

test('Solid consumer files are delivered as complete standalone projects', async () => {
	const { fetchSource } = await import('./fetch.mjs')
	const out = mkdtempSync(join(tmpdir(), 'soxa-solid-delivery-'))
	const requests = []
	await fetchSource({
		revision,
		version: '0.3.0',
		out,
		fetchFile: async (url) => {
			const file = url.split('/' + revision + '/')[1]
			requests.push(file)
			return {
				ok: true,
				text: async () => readFileSync(new URL('../../' + file, import.meta.url), 'utf8'),
			}
		},
	})
	const manifest = JSON.parse(readFileSync(join(out, 'docs/ai/0.3.0/manifest.json'), 'utf8'))
	assert.equal(manifest.coverage.solid.guides, 'sample')
	assert.equal(manifest.packages['@soxa-ui/solid'], '0.3.0')
	for (const file of [
		'solid/package.json',
		'solid/Recipes.tsx',
		'solidstart/src/routes/away.tsx',
		'solidstart/src/entry-server.tsx',
	]) {
		assert.ok(requests.includes('docs/ai/0.3.0/examples/' + file))
	}
	const records = manifest.documents.filter((doc) => doc.framework === 'solid')
	assert.equal(records.length, 8)
	assert.ok(records.every((doc) => doc.audience === 'consumer'))
	assert.equal(
		readFileSync(join(out, 'docs/ai/0.3.0/examples/solid/Recipes.tsx'), 'utf8'),
		readFileSync(join(out, 'docs/ai/0.3.0/examples/solidstart/src/Recipes.tsx'), 'utf8'),
	)
})

test('Web Components consumers are selectively delivered with complete browser-only inputs', async () => {
	const { fetchSource } = await import('./fetch.mjs')
	const out = mkdtempSync(join(tmpdir(), 'soxa-webc-delivery-'))
	const requested = []
	await fetchSource({
		revision,
		version: '0.3.0',
		out,
		fetchFile: async (url) => {
			const file = url.split('/' + revision + '/')[1]
			requested.push(file)
			return {
				ok: true,
				text: async () => readFileSync(new URL('../../' + file, import.meta.url), 'utf8'),
			}
		},
	})
	const manifest = JSON.parse(readFileSync(join(out, 'docs/ai/0.3.0/manifest.json'), 'utf8'))
	assert.equal(manifest.coverage.webc.guides, 'sample')
	assert.equal(manifest.packages['@soxa-ui/webc'], '0.3.0')
	const records = manifest.documents.filter((doc) => doc.framework === 'webc')
	assert.equal(records.length, 8)
	assert.ok(records.every((doc) => doc.audience === 'consumer'))
	for (const file of [
		'package.json',
		'tsconfig.json',
		'main.ts',
		'setup.ts',
		'index.html',
		'upgrade.html',
		'upgrade.ts',
		'vite.config.ts',
	]) {
		assert.ok(requested.includes('docs/ai/0.3.0/examples/webc/' + file), file)
	}
	const f = fixture()
	f.manifest.coverage.webc.guides = 'sample'
	f.manifest.documents.push({
		...f.manifest.documents[0],
		id: 'webc-fixture',
		framework: 'webc',
		path: 'webc.md',
		related: [],
	})
	writeFileSync(join(f.root, 'webc.md'), '# Browser application')
	const selected = selectDocuments(f.build(), {
		version: '0.3.0',
		audience: 'consumer',
		framework: 'webc',
	})
	assert.ok(selected.some((doc) => doc.framework === 'all'))
	assert.ok(selected.some((doc) => doc.id === 'webc-fixture'))
	assert.ok(selected.every((doc) => ['all', 'webc'].includes(doc.framework)))
})

test('shared theme and extension recipes deliver every standalone input and stay consumer-scoped', async () => {
	const { fetchSource } = await import('./fetch.mjs')
	const out = mkdtempSync(join(tmpdir(), 'soxa-recipes-delivery-'))
	await fetchSource({
		revision,
		version: '0.3.0',
		out,
		fetchFile: async (url) => {
			const path = url.split('/' + revision + '/')[1]
			return {
				ok: true,
				text: async () => readFileSync(new URL('../../' + path, import.meta.url), 'utf8'),
			}
		},
	})
	const manifest = JSON.parse(readFileSync(join(out, 'docs/ai/0.3.0/manifest.json'), 'utf8'))
	const ids = [
		'oren-configuration',
		'theme-authoring',
		'icon-replacement',
		'programmatic-control',
		'external-plugins',
		'public-recipes-validation',
	]
	const shared = manifest.documents.filter((doc) => ids.includes(doc.id))
	assert.equal(shared.length, 6)
	assert.ok(
		shared.every(
			(doc) =>
				doc.framework === 'all' && doc.audience === 'consumer' && doc.status === 'sample',
		),
	)
	const exampleRoot = new URL('../../docs/ai/0.3.0/examples/public-recipes/', import.meta.url)
	const { readdirSync } = await import('node:fs')
	const declared = new Set(shared.flatMap((doc) => doc.examples.map((entry) => entry.path)))
	for (const entry of readdirSync(exampleRoot, { recursive: true, withFileTypes: true })) {
		if (!entry.isFile()) continue
		const { relative } = await import('node:path')
		const path =
			'examples/public-recipes/' +
			relative(fileURLToPath(exampleRoot), join(entry.parentPath, entry.name)).replaceAll(
				'\\',
				'/',
			)
		assert.ok(declared.has(path), 'Missing downloadable input: ' + path)
		assert.ok(existsSync(join(out, 'docs/ai/0.3.0', path)))
	}
	const f = fixture()
	for (const doc of shared) {
		f.manifest.documents.push({ ...doc, related: [] })
		writeFileSync(join(f.root, doc.path), readFileSync(join(out, 'docs/ai/0.3.0', doc.path)))
		for (const example of doc.examples) {
			mkdirSync(dirname(join(f.root, example.path)), { recursive: true })
			writeFileSync(
				join(f.root, example.path),
				readFileSync(join(out, 'docs/ai/0.3.0', example.path)),
			)
		}
	}
	const corpus = f.build()
	for (const framework of ['vue', 'react', 'angular', 'svelte', 'solid', 'webc']) {
		const selected = selectDocuments(corpus, {
			version: '0.3.0',
			audience: 'consumer',
			framework,
		})
		for (const id of ids) assert.ok(selected.some((doc) => doc.id === id))
	}
	assert.equal(manifest.packages['@soxa-ui/icons-lucide'], '0.3.0')
})
