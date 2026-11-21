import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { documentationRelease } from './release.mjs'
import { fetchSource } from './fetch.mjs'
import { libraryClosure, libraryNamesOf } from '../install-smoke/install-smoke.ts'

const root = fileURLToPath(new URL('../../', import.meta.url))
test('release selection separates exact package pins and rejects absent or floating corpora', () => {
	const old = documentationRelease(root, '0.3.0')
	const current = documentationRelease(root, '0.4.1')
	assert.equal(old.packages['@soxa-ui/icons-material'], '0.3.0')
	assert.equal(current.packages['@soxa-ui/icons-material'], '0.3.1')
	assert.equal(current.packages['@soxa-ui/setup'], '0.4.1')
	assert.notEqual(old.manifest.api.sha256, current.manifest.api.sha256)
	for (const version of ['latest', '^0.4.1', '../0.3.0', '0.4.0', '9.9.9'])
		assert.throws(() => documentationRelease(root, version))
})

test('0.4.2 selects published API while retaining independent theme and icon versions', () => {
	const release = documentationRelease(root, '0.4.2')
	assert.equal(
		release.manifest.api.sha256,
		'85aa9b20e93d9a1ed045f866d70e310505df536b337d7b73a9974d3492861e13',
	)
	assert.equal(release.packages['@soxa-ui/react'], '0.4.2')
	assert.equal(release.packages['@soxa-ui/theme-oren'], '0.4.1')
	assert.equal(release.packages['@soxa-ui/icons-material'], '0.3.1')
	assert.ok(release.manifest.documents.every((doc) => doc.status === 'sample'))
	assert.ok(
		release.manifest.documents.every((doc) =>
			doc.sources.every((source) => source.revision === release.manifest.libraryRevision),
		),
	)
})

test('0.4.1 public delivery contains complete recipes and no historical validation apps', async () => {
	const revision = 'a'.repeat(40)
	const requested = []
	const output = mkdtempSync(join(tmpdir(), 'soxa-release-delivery-'))
	await fetchSource({
		revision,
		version: '0.4.1',
		includeMcp: true,
		out: output,
		fetchFile: async (url) => {
			const path = url.split('/' + revision + '/')[1]
			requested.push(path)
			return new Response(readFileSync(join(root, path)), { status: 200 })
		},
	})
	const tracked = new Set(
		execFileSync('git', ['ls-files', '--', 'docs/ai', 'tools/ai-docs'], {
			cwd: root,
			encoding: 'utf8',
		})
			.trim()
			.split('\n'),
	)
	for (const path of requested)
		assert.ok(tracked.has(path), 'Public delivery input must be tracked: ' + path)
	assert.ok(requested.includes('docs/ai/0.4.1/release-changes.md'))
	assert.ok(requested.includes('docs/ai/0.4.1/examples/sveltekit/src/routes/+page.svelte'))
	assert.ok(
		requested.every(
			(path) =>
				!path.includes('docs/ai/0.3.0') &&
				!path.includes('validation-') &&
				!path.includes('package-lock'),
		),
	)
	const { manifest } = documentationRelease(root, '0.4.1')
	assert.equal(manifest.contributorGuides, 'pending')
	for (const framework of ['vue', 'react', 'angular', 'svelte', 'solid', 'webc']) {
		assert.equal(manifest.coverage[framework].guides, 'sample')
		for (const component of ['alert', 'alert-dialog', 'avatar', 'avatar-group', 'separator'])
			assert.ok(
				manifest.documents
					.find((d) => d.id === 'release-changes')
					.related.includes('api-' + framework + '-' + component),
			)
	}
})

test('every consumer example pins each Soxa peer of its tree to the corpus release', () => {
	const read = (file) => JSON.parse(readFileSync(file, 'utf8'))
	const manifests = new Map(
		execFileSync(
			'git',
			['ls-files', '--', 'packages/*/package.json', 'packages/*/*/package.json'],
			{
				cwd: root,
				encoding: 'utf8',
			},
		)
			.trim()
			.split('\n')
			.map((file) => read(join(root, file)))
			.filter((manifest) => manifest.name?.startsWith('@soxa-ui/') && !manifest.private)
			.map((manifest) => [manifest.name, manifest]),
	)
	const versions = readdirSync(join(root, 'docs/ai')).filter((name) =>
		/^\d+\.\d+\.\d+$/.test(name),
	)
	assert.ok(versions.includes('0.4.1'))

	for (const version of versions) {
		const { packages } = documentationRelease(root, version)
		const examples = join(root, 'docs/ai', version, 'examples')
		for (const example of readdirSync(examples)) {
			const file = join(examples, example, 'package.json')
			if (!existsSync(file)) continue
			const recipe = read(file)
			const direct = libraryNamesOf(recipe)
			const label = version + '/' + example
			for (const name of direct)
				assert.equal(
					{ ...recipe.dependencies, ...recipe.devDependencies }[name],
					packages[name],
					label + ': ' + name,
				)

			// npm resolves a peer by its range at the top of the tree and takes the newest
			// release, so a peer missing from the example drifts once a patch is published.
			const peers = libraryClosure(direct, manifests).flatMap((name) =>
				Object.keys(manifests.get(name).peerDependencies ?? {}).filter((peer) =>
					peer.startsWith('@soxa-ui/'),
				),
			)
			for (const peer of new Set(peers))
				assert.ok(direct.includes(peer), label + ' pins peer ' + peer)
		}
	}
})
