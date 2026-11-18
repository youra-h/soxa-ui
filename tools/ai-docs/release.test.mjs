import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { documentationRelease } from './release.mjs'
import { fetchSource } from './fetch.mjs'

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
