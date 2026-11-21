import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname, basename } from 'node:path'
import { defaultConfig } from '@changesets/config'
import { planRelease, prepareRelease } from '../plan.mjs'

const roots = []
afterEach(() => {
	for (const root of roots.splice(0)) {
		if (
			dirname(resolve(root)) !== resolve(tmpdir()) ||
			!basename(root).startsWith('soxa-release-test-')
		)
			throw new Error('Unexpected fixture path')
		rmSync(root, { recursive: true, force: true })
	}
})

function fixture(version = '0.3.0', root = '/workspace') {
	const make = (name, dir, rest = {}) => ({
		dir: join(root, dir),
		packageJson: { name: '@soxa-ui/' + name, version, ...rest },
	})
	const packages = {
		rootDir: root,
		rootPackage: {
			dir: root,
			packageJson: { name: 'fixture', private: true, version: '0.0.0' },
		},
		packages: [
			make('core', 'packages/core'),
			make('vue', 'packages/ui/vue', { dependencies: { '@soxa-ui/core': version } }),
			make('theme-base', 'packages/themes/base', {
				peerDependencies: {
					'@soxa-ui/core': version.includes('-') ? '^0.3.0-beta.1' : '^0.3.0',
				},
			}),
			make('theme-oren', 'packages/themes/oren', {
				dependencies: { '@soxa-ui/theme-base': version },
				peerDependencies: {
					'@soxa-ui/core': version.includes('-') ? '^0.3.0-beta.1' : '^0.3.0',
				},
			}),
			make('icons-material', 'packages/icons/material', {
				peerDependencies: {
					'@soxa-ui/core': version.includes('-') ? '^0.3.0-beta.1' : '^0.3.0',
				},
			}),
			make('icons-lucide', 'packages/icons/lucide', {
				peerDependencies: {
					'@soxa-ui/core': version.includes('-') ? '^0.3.0-beta.1' : '^0.3.0',
				},
			}),
		],
	}
	const config = {
		...defaultConfig,
		fixed: [['@soxa-ui/core', '@soxa-ui/vue']],
		ignore: [],
		changelog: false,
	}
	return { packages, config, changesets: [] }
}
const cs = (id, names, type = 'patch') => ({
	id,
	summary: 'A compatible fix.',
	releases: names.map((name) => ({ name: '@soxa-ui/' + name, type })),
})
const namesOf = (release) => release.manifest.packages.map((pkg) => pkg.name).sort()

describe('independent release plans', () => {
	it('releases MCP independently and preserves component changesets', () => {
		const input = fixture()
		input.packages.packages.push({
			dir: '/workspace/packages/mcp',
			packageJson: { name: '@soxa-ui/mcp', version: '0.0.0' },
		})
		input.changesets = [cs('mcp-docs', ['mcp']), cs('component', ['vue'])]
		const release = planRelease(input, 'mcp')
		expect(namesOf(release)).toEqual(['@soxa-ui/mcp'])
		expect(release.manifest.packages[0].scope).toBe('mcp')
		expect(namesOf(planRelease(input, 'components'))).not.toContain('@soxa-ui/mcp')
	})
	it('releases only the component fixed group for a component fix', () => {
		const input = fixture()
		input.changesets = [cs('component', ['vue']), cs('later-icons', ['icons-material'])]
		const release = planRelease(input, 'components')
		expect(namesOf(release)).toEqual(['@soxa-ui/core', '@soxa-ui/vue'])
		expect(release.plan.changesets.map((c) => c.id)).toEqual(['component'])
		expect(release.manifest.packages.every((pkg) => pkg.version === '0.3.1')).toBe(true)
	})
	it('does not release the other icon pack or components for one icon fix', () => {
		const input = fixture()
		input.changesets = [cs('icon', ['icons-material'])]
		expect(namesOf(planRelease(input, 'icons'))).toEqual(['@soxa-ui/icons-material'])
	})
	it('releases Oren when its bundled theme-base changes, but no components or icons', () => {
		const input = fixture()
		input.changesets = [cs('base', ['theme-base'])]
		expect(namesOf(planRelease(input, 'themes'))).toEqual([
			'@soxa-ui/theme-base',
			'@soxa-ui/theme-oren',
		])
	})
	it('releases Oren alone for an Oren appearance change', () => {
		const input = fixture()
		input.changesets = [cs('oren', ['theme-oren'])]
		expect(namesOf(planRelease(input, 'themes'))).toEqual(['@soxa-ui/theme-oren'])
	})
	it('blocks an incompatible dependency closure outside the selected scope', () => {
		const input = fixture()
		input.changesets = [cs('breaking', ['core'], 'minor')]
		expect(() => planRelease(input, 'components')).toThrow('outside components')
	})
	it('promotes all existing beta packages to their first stable version', () => {
		const input = fixture('0.3.0-beta.1')
		input.preState = { mode: 'pre', tag: 'beta' }
		input.changesets = [
			cs('pre/shipped-beta', ['core', 'theme-base', 'icons-material']),
			cs('new-fix', ['vue']),
		]
		const release = planRelease(input, 'all')
		expect(release.manifest.packages).toHaveLength(6)
		expect(release.manifest.packages.every((pkg) => pkg.version === '0.3.0')).toBe(true)
		expect(release.plan.preState.mode).toBe('exit')
		expect(() => planRelease(input, 'icons')).toThrow('global prerelease')
	})
	it('rejects an omitted or unknown release scope', () => {
		expect(() => planRelease(fixture(), undefined)).toThrow('Choose')
		expect(() => planRelease(fixture(), 'component')).toThrow('Choose')
	})
	it('keeps a mixed changeset pending for its unselected packages after versioning', async () => {
		const root = mkdtempSync(join(tmpdir(), 'soxa-release-test-'))
		roots.push(root)
		const input = fixture('0.3.0', root)
		input.changesets = [cs('shared-fix', ['vue', 'theme-oren'])]
		for (const pkg of input.packages.packages) {
			mkdirSync(pkg.dir, { recursive: true })
			writeFileSync(join(pkg.dir, 'package.json'), JSON.stringify(pkg.packageJson))
		}
		writeFileSync(
			join(root, 'package.json'),
			JSON.stringify(input.packages.rootPackage.packageJson),
		)
		mkdirSync(join(root, '.changeset'))
		writeFileSync(
			join(root, '.changeset/shared-fix.md'),
			'---\n"@soxa-ui/vue": patch\n"@soxa-ui/theme-oren": patch\n---\n\nA compatible fix.\n'.replaceAll(
				'\\n',
				'\n',
			),
		)
		const release = { ...input, ...planRelease(input, 'components') }
		await prepareRelease(root, release)
		const remaining = readFileSync(join(root, '.changeset/shared-fix.md'), 'utf8')
		expect(remaining).toContain('"@soxa-ui/theme-oren": patch')
		expect(remaining).not.toContain('@soxa-ui/vue')
		expect(remaining).toContain('A compatible fix.')
		expect(
			JSON.parse(readFileSync(join(root, 'packages/themes/oren/package.json'))).version,
		).toBe('0.3.0')
		expect(JSON.parse(readFileSync(join(root, '.release/plan.json'))).packages).toHaveLength(2)
	})
	it('refuses to prepare a scope with no pending changes', async () => {
		const input = fixture()
		await expect(
			prepareRelease(input.packages.rootDir, { ...input, ...planRelease(input, 'icons') }),
		).rejects.toThrow('No pending changes')
	})
})

it('consumes empty archived changesets and removes shared prerelease state on graduation', async () => {
	const root = mkdtempSync(join(tmpdir(), 'soxa-release-test-'))
	roots.push(root)
	const input = fixture('0.3.0-beta.1', root)
	input.preState = { mode: 'pre', tag: 'beta' }
	input.changesets = [
		cs('pre/shipped-beta', ['core']),
		{ id: 'pre/test-only', summary: '', releases: [] },
	]
	for (const pkg of input.packages.packages) {
		mkdirSync(pkg.dir, { recursive: true })
		writeFileSync(join(pkg.dir, 'package.json'), JSON.stringify(pkg.packageJson))
	}
	writeFileSync(
		join(root, 'package.json'),
		JSON.stringify(input.packages.rootPackage.packageJson),
	)
	mkdirSync(join(root, '.changeset/pre'), { recursive: true })
	writeFileSync(join(root, '.changeset/pre.json'), JSON.stringify(input.preState))
	writeFileSync(
		join(root, '.changeset/pre/shipped-beta.md'),
		'---\n"@soxa-ui/core": patch\n---\n\nA compatible fix.\n',
	)
	writeFileSync(join(root, '.changeset/pre/test-only.md'), '---\n---\n')
	const release = { ...input, ...planRelease(input, 'all') }
	await prepareRelease(root, release)
	expect(existsSync(join(root, '.changeset/pre.json'))).toBe(false)
	expect(existsSync(join(root, '.changeset/pre/test-only.md'))).toBe(false)
	expect(release.manifest.packages).toHaveLength(6)
	expect(
		JSON.parse(readFileSync(join(root, 'packages/icons/material/package.json'))).version,
	).toBe('0.3.0')
})

describe('owner-requested beta releases', () => {
	it('keeps independent versions and requires the complete dependency closure', () => {
		const input = fixture()
		input.changesets = [cs('train', ['core'], 'minor')]
		expect(() => planRelease(input, 'components', { beta: true })).toThrow('outside components')

		const release = planRelease(input, 'all', { beta: true })
		expect(release.manifest.channel).toBe('beta')
		expect(
			release.manifest.packages
				.filter((pkg) => pkg.scope === 'components')
				.map((pkg) => pkg.version),
		).toEqual(['0.4.0-beta.0', '0.4.0-beta.0'])
		expect(
			release.manifest.packages
				.filter((pkg) => pkg.scope !== 'components')
				.every((pkg) => pkg.version === '0.3.1-beta.0'),
		).toBe(true)
	})

	it('archives beta notes without a global pre.json and can graduate them later', async () => {
		const root = mkdtempSync(join(tmpdir(), 'soxa-release-test-'))
		roots.push(root)
		const input = fixture('0.3.0', root)
		input.changesets = [cs('train', ['core'], 'minor')]
		for (const pkg of input.packages.packages) {
			mkdirSync(pkg.dir, { recursive: true })
			writeFileSync(join(pkg.dir, 'package.json'), JSON.stringify(pkg.packageJson))
		}
		writeFileSync(
			join(root, 'package.json'),
			JSON.stringify(input.packages.rootPackage.packageJson),
		)
		mkdirSync(join(root, '.changeset'))
		writeFileSync(
			join(root, '.changeset/train.md'),
			'---\n"@soxa-ui/core": minor\n---\n\nA compatible fix.\n',
		)

		const beta = { ...input, ...planRelease(input, 'all', { beta: true }) }
		await prepareRelease(root, beta)
		expect(existsSync(join(root, '.changeset/pre.json'))).toBe(false)
		expect(existsSync(join(root, '.changeset/train.md'))).toBe(false)
		expect(readFileSync(join(root, '.changeset/pre/train.md'), 'utf8')).toContain(
			'A compatible fix.',
		)

		for (const pkg of input.packages.packages)
			pkg.packageJson = JSON.parse(readFileSync(join(pkg.dir, 'package.json')))
		input.changesets = [{ ...input.changesets[0], id: 'pre/train' }]
		expect(planRelease(input, 'all', { beta: true }).manifest.packages).toEqual([])
		const stable = planRelease(input, 'all')
		expect(
			stable.manifest.packages
				.filter((pkg) => pkg.scope === 'components')
				.every((pkg) => pkg.version === '0.4.0'),
		).toBe(true)
		expect(
			stable.manifest.packages
				.filter((pkg) => pkg.scope !== 'components')
				.every((pkg) => pkg.version === '0.3.1'),
		).toBe(true)
		await prepareRelease(root, { ...input, ...stable })
		expect(existsSync(join(root, '.changeset/pre/train.md'))).toBe(false)
	})

	it('advances beta counters only for new work', () => {
		const input = fixture('0.4.0-beta.0')
		input.changesets = [cs('pre/shipped', ['core']), cs('new', ['vue'])]
		const release = planRelease(input, 'all', { beta: true })
		expect(release.plan.changesets.map((entry) => entry.id)).toEqual(['new'])
		expect(release.manifest.packages.every((pkg) => pkg.version === '0.4.0-beta.1')).toBe(true)
	})
})
