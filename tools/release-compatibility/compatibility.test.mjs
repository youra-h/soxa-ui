import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { compareSnapshots, hash, snapshotPackage } from './snapshot.mjs'
import { validateReviews } from './review.mjs'
import { verifyIntegrity } from './registry.mjs'

function fixture(run) {
	const root = mkdtempSync(join(tmpdir(), 'soxa-compat-test-'))
	const put = (name, value) => {
		const file = join(root, name)
		mkdirSync(join(file, '..'), { recursive: true })
		writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value))
	}
	put('package.json', {
		name: '@soxa-ui/test',
		version: '0.4.2',
		exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js' } },
	})
	try {
		return run(root, put)
	} finally {
		rmSync(root, { recursive: true, force: true })
	}
}
function changed(before, after, files = {}) {
	return fixture((root, put) => {
		for (const [file, value] of Object.entries(files)) put(file, value)
		put('dist/index.d.ts', before)
		const previous = snapshotPackage(root)
		put('dist/index.d.ts', after)
		return compareSnapshots(previous, snapshotPackage(root))
	})
}

test('same export names cannot hide a narrowed property or changed event payload', () => {
	for (const [before, after] of [
		[
			'export interface Props { value: string | number }',
			'export interface Props { value: string }',
		],
		['export type Event = { newValue: string }', 'export type Event = string'],
		[
			'export declare function open(value?: string): void;',
			'export declare function open(value: number): void;',
		],
		['export declare class State { getSnapshot(): string; }', 'export declare class State {}'],
		['export interface Props { label?: string }', 'export interface Props { label: string }'],
	])
		assert.ok(changed(before, after).length)
})

test('private storage and comments do not require a consumer migration; protected members do', () => {
	assert.equal(
		changed(
			'export declare class State { private a; run(): void; }',
			'/** docs */ export declare class State { private b; run(): void; }',
		).length,
		0,
	)
	assert.ok(
		changed(
			'export declare class State { protected value: string; }',
			'export declare class State { protected value: number; }',
		).length,
	)
})

test('removed aliases, namespace exports, overloads and literal whitespace stay visible', () => {
	assert.ok(
		changed(
			'export { Value as Old } from "./value";',
			'export { Value as New } from "./value";',
			{ 'dist/value.d.ts': 'export interface Value { a: string }' },
		).length,
	)
	assert.ok(
		changed('export * as values from "./value";', '', {
			'dist/value.d.ts': 'export interface Value { a: string }',
		}).length,
	)
	assert.ok(
		changed(
			'export declare function run(a: string): void; export declare function run(a: number): void;',
			'export declare function run(a: string): void;',
		).length,
	)
	assert.ok(changed('export type Label = "a b"', 'export type Label = "ab"').length)
})

test('follow relative reexports, imports and import() type dependencies', () => {
	for (const entry of [
		'export * from "./value";',
		'import type { Value } from "./value"; export type Props = Value;',
		'export type Props = import("./value").Value;',
	]) {
		fixture((root, put) => {
			put('dist/index.d.ts', entry)
			put('dist/value.d.ts', 'export interface Value { a: string }')
			const before = snapshotPackage(root)
			put('dist/value.d.ts', 'export interface Value { a: number }')
			assert.ok(compareSnapshots(before, snapshotPackage(root)).length)
		})
	}
})

test('new declarations are additive; incomplete builds fail instead of passing', () => {
	assert.equal(
		changed('export interface A {}', 'export interface A {} export interface B {}').length,
		0,
	)
	fixture((root, put) => {
		put('dist/index.d.ts', 'export * from "./missing"')
		assert.throws(() => snapshotPackage(root), /Missing published declaration/)
	})
})

test('component defaults, event metadata, slots and theme variables are compared', () => {
	fixture((root, put) => {
		put('dist/index.d.ts', 'export interface Props {}')
		const api = {
			schemaVersion: 1,
			components: [],
			contracts: {
				button: {
					props: [{ name: 'disabled', hasDefault: true, default: 'false' }],
					events: [],
					slots: [],
					frameworks: {},
				},
			},
			plugins: {},
		}
		put('dist/api.json', api)
		put('theme-variables.json', { reads: { '--so-gap': 'Default: 4px' } })
		const before = snapshotPackage(root)
		api.contracts.button.props[0].default = 'true'
		put('dist/api.json', api)
		put('theme-variables.json', { reads: { '--so-gap': 'Optional final override' } })
		const changes = compareSnapshots(before, snapshotPackage(root))
		assert.ok(changes.some((change) => change.key.includes('disabled')))
		assert.ok(changes.some((change) => change.key.includes('--so-gap')))
	})
})

function reviewFixture(run) {
	return fixture((root, put) => {
		put(
			'docs/upgrade/example.md',
			'## Who is affected\nConsumers\n## Before\nold()\n## After\nnext()\n## Verification\nBuild',
		)
		const baseline = {
			schemaVersion: 1,
			packages: [{ name: '@soxa-ui/test', version: '0.4.2' }],
		}
		const change = { id: 'exact-delta', package: '@soxa-ui/test', key: 'Props' }
		const review = {
			id: 'review',
			baseline: hash(baseline),
			impact: 'breaking',
			reason: 'Old method removed',
			guide: 'docs/upgrade/example.md',
			changeset: 'migration',
			changes: [change.id],
		}
		const packages = [{ name: change.package, version: '0.4.2' }]
		const changesets = [
			{
				id: 'migration',
				summary: 'Upgrade: docs/upgrade/example.md',
				releases: [{ name: change.package, type: 'minor' }],
			},
		]
		const check = (changes = [change], reviews = [review]) =>
			validateReviews(changes, reviews, packages, changesets, root, baseline)
		return run({ put, change, review, packages, changesets, check })
	})
}

test('breaking changes require the exact review, upgrade document and linked minor changeset', () => {
	reviewFixture(({ check, changesets, put }) => {
		assert.deepEqual(check(), [])
		changesets[0].releases[0].type = 'patch'
		assert.ok(check().some((error) => error.includes('needs minor')))
		put('docs/upgrade/example.md', 'No migration instructions')
		assert.ok(check().some((error) => error.includes('Missing ## Before')))
	})
})

test('reviews cannot cover future changes or remain valid after the baseline advances', () => {
	reviewFixture(({ check, change, review }) => {
		assert.ok(
			check([{ ...change, id: 'another-delta' }]).some((error) =>
				error.includes('Unreviewed'),
			),
		)
		assert.ok(check([]).some((error) => error.includes('Stale compatibility review')))
		review.baseline = 'old'
		assert.ok(check().some((error) => error.includes('Stale baseline')))
	})
})

test('prepared minor releases still enforce upgrade documentation', () => {
	reviewFixture(({ packages, changesets, check, review, put }) => {
		packages[0].version = '0.5.0'
		changesets.length = 0
		assert.ok(check().some((error) => error.includes('needs minor')))
		packages[0].dir = '.'
		put(
			'CHANGELOG.md',
			'## 0.5.0\n\n### Minor Changes\n\n- abcdef1: Upgrade: docs/upgrade/example.md\n',
		)
		assert.deepEqual(check(), [])
		review.guide = '../outside.md'
		assert.ok(check().some((error) => error.includes('upgrade guide under')))
	})
})

test('corrupted archive bytes never become a published baseline', () => {
	assert.throws(
		() => verifyIntegrity(Buffer.from('corrupt'), 'sha512-wrong'),
		/integrity mismatch/,
	)
})

test('compiler alias renumbering and object-property order do not create migrations', () => {
	assert.equal(
		changed(
			'import { Descriptor as descriptor$2 } from "framework"; export type Props = { z: string; a: typeof descriptor$2 }',
			'import { Descriptor as descriptor$7 } from "framework"; export type Props = { a: typeof descriptor$7; z: string }',
		).length,
		0,
	)
})

test('package entry conditions and supported environment changes require review', () => {
	fixture((root, put) => {
		put('dist/index.d.ts', 'export interface Props {}')
		const before = snapshotPackage(root)
		put('package.json', {
			name: '@soxa-ui/test',
			version: '0.4.2',
			exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js' } },
			peerDependencies: { vue: '^4.0.0' },
			engines: { node: '>=24' },
		})
		// A new environment constraint narrows an existing implicit contract too.
		assert.ok(Object.keys(snapshotPackage(root).records).includes('peer:vue'))
		const constrained = snapshotPackage(root)
		assert.ok(
			compareSnapshots(before, constrained).some((change) => change.key === 'environments'),
		)
		put('package.json', {
			name: '@soxa-ui/test',
			version: '0.4.2',
			exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js' } },
			peerDependencies: { vue: '^5.0.0' },
			engines: { node: '>=26' },
		})
		assert.ok(
			compareSnapshots(constrained, snapshotPackage(root)).some(
				(change) => change.key === 'environments',
			),
		)
	})
})

test('preparation refuses missing or incomplete guides before versioning', async () => {
	const { requireUpgradeGuide, upgradeGuideFor } = await import('./upgrade.mjs')
	fixture((root, put) => {
		const manifest = {
			packages: [{ name: '@soxa-ui/vue', version: '0.5.0', scope: 'components' }],
		}
		assert.equal(upgradeGuideFor(manifest), 'docs/upgrade/0.5.0.md')
		assert.throws(() => requireUpgradeGuide(root, manifest), /before versioning/)
		put('docs/upgrade/0.5.0.md', '## Who is affected')
		assert.throws(() => requireUpgradeGuide(root, manifest), /## Before/)
		put('docs/upgrade/0.5.0.md', '## Who is affected\n## Before\n## After\n## Verification')
		put('docs/upgrade/README.md', '[Next](./0.5.0.md)')
		assert.equal(requireUpgradeGuide(root, manifest), 'docs/upgrade/0.5.0.md')
		assert.equal(
			upgradeGuideFor({
				packages: [{ name: '@soxa-ui/theme-base', version: '0.5.1', scope: 'themes' }],
			}),
			'docs/upgrade/theme-base-0.5.1.md',
		)
	})
})

test('release notes retain the upgrade link when long changelogs are folded', async () => {
	const { notesOf } = await import('../release-notes/release-notes.mjs')
	const entries = Array.from({ length: 18 }, (_, i) => '- abcdef' + i.toString(16) + ': Fix ' + i)
	entries[0] += '. Upgrade: docs/upgrade/0.5.0.md'
	const notes = notesOf(
		[
			{
				name: '@soxa-ui/core',
				version: '0.5.0',
				file: 'core/CHANGELOG.md',
				changelog: '## 0.5.0\n\n### Minor Changes\n\n' + entries.join('\n'),
			},
		],
		new Set(['@soxa-ui/core']),
		'https://example.com/blob/sha',
	)
	assert.match(notes, /https:\/\/example.com\/blob\/sha\/docs\/upgrade\/0.5.0.md/)
	assert.match(notes, /What changed is in the changelogs/)
})

test('overload ordering and constructor access remain part of compatibility', () => {
	assert.ok(
		changed(
			'export declare function run(a: string): "first"; export declare function run(a: string): "last";',
			'export declare function run(a: string): "last"; export declare function run(a: string): "first";',
		).length,
	)
	assert.ok(
		changed(
			'export declare class Factory { constructor(); }',
			'export declare class Factory { private constructor(); }',
		).length,
	)
})

test('consumer slot fields named file or source are never treated as provenance', () => {
	fixture((root, put) => {
		put('dist/index.d.ts', 'export interface Props {}')
		const api = {
			schemaVersion: 1,
			components: [],
			contracts: {
				code: {
					props: [],
					events: [],
					slots: [
						{
							name: 'default',
							scope: {
								file: { type: 'string', required: true },
								source: { type: 'string', required: true },
							},
						},
					],
					frameworks: {},
				},
			},
			plugins: {},
		}
		put('dist/api.json', api)
		const before = snapshotPackage(root)
		api.contracts.code.slots[0].scope.file.type = 'number'
		put('dist/api.json', api)
		assert.ok(
			compareSnapshots(before, snapshotPackage(root)).some((change) =>
				change.key.includes('slots'),
			),
		)
	})
})

test('compiler alias normalization never hides a renamed public property', () => {
	assert.ok(
		changed(
			'import { Descriptor as descriptor$2 } from "framework"; export type Props = { descriptor$2: string; value: typeof descriptor$2 }',
			'import { Descriptor as descriptor$7 } from "framework"; export type Props = { descriptor$7: string; value: typeof descriptor$7 }',
		).length,
	)
})

test('compatible-only releases link the approved manifest guide without breaking changesets', async () => {
	const { notesOf } = await import('../release-notes/release-notes.mjs')
	const notes = notesOf(
		[
			{
				name: '@soxa-ui/vue',
				version: '0.5.1',
				file: 'vue/CHANGELOG.md',
				changelog: '## 0.5.1\n\n### Patch Changes\n\n- abcdef1: Preserve focus.\n',
			},
		],
		new Set(['@soxa-ui/vue']),
		'https://example.com/blob/sha',
		'docs/upgrade/0.5.1.md',
	)
	assert.match(notes, /https:\/\/example.com\/blob\/sha\/docs\/upgrade\/0.5.1.md/)
	assert.match(notes, /Preserve focus/)
})
