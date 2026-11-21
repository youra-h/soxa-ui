import { describe, expect, it } from 'vitest'
import {
	publicationTag,
	releaseGroups,
	packagesOfPlan,
	assertPlannedUnpublished,
	registryVersion,
} from '../release-notes.mjs'

const shared = new Set(['@soxa-ui/core'])
const packages = [
	{ name: '@soxa-ui/core', version: '0.3.0', dir: 'packages/core' },
	{ name: '@soxa-ui/theme-oren', version: '0.3.0', dir: 'packages/themes/oren' },
	{ name: '@soxa-ui/icons-material', version: '0.3.0', dir: 'packages/icons/material' },
]
describe('release publication scope', () => {
	it('gives MCP an independent approved plan and GitHub history', () => {
		const mcp = { name: '@soxa-ui/mcp', version: '0.0.1', dir: 'packages/mcp' }
		expect(releaseGroups([...packages, mcp], shared).at(-1)).toEqual([mcp])
		expect(
			packagesOfPlan(
				{ schemaVersion: 1, scope: 'mcp', packages: [{ ...mcp, scope: 'mcp' }] },
				[...packages, mcp],
				shared,
			),
		).toEqual([mcp])
		expect(() => assertPlannedUnpublished(packages, [mcp])).toThrow('outside')
	})
	it('creates separate histories for components, themes and icons', () => {
		expect(releaseGroups(packages, shared)).toEqual(packages.map((pkg) => [pkg]))
	})
	it('validates exact versions, scope and duplicate entries', () => {
		const plan = {
			schemaVersion: 1,
			scope: 'icons',
			packages: [{ ...packages[2], scope: 'icons' }],
		}
		expect(packagesOfPlan(plan, packages, shared)).toEqual([packages[2]])
		expect(() =>
			packagesOfPlan(
				{ ...plan, packages: [{ ...plan.packages[0], version: '0.3.1' }] },
				packages,
				shared,
			),
		).toThrow('checkout')
		expect(() =>
			packagesOfPlan(
				{ ...plan, packages: [...plan.packages, ...plan.packages] },
				packages,
				shared,
			),
		).toThrow('checkout')
		expect(() => packagesOfPlan({ ...plan, scope: 'themes' }, packages, shared)).toThrow(
			'scope',
		)
	})
	it('blocks publication of an unrelated unpublished package', () => {
		expect(() => assertPlannedUnpublished([packages[2]], [packages[0], packages[2]])).toThrow(
			'outside',
		)
		expect(() => assertPlannedUnpublished([packages[2]], [])).not.toThrow()
	})
	it('treats only registry E404 as an unpublished version', () => {
		expect(registryVersion('pkg', { status: 0, stdout: '"0.3.0"' })).toBe('0.3.0')
		expect(
			registryVersion('pkg', { status: 1, stdout: '{"error":{"code":"E404"}}' }),
		).toBeUndefined()
		for (const code of ['E401', 'E403', 'ENOTFOUND', 'ETIMEDOUT']) {
			expect(() =>
				registryVersion('pkg', { status: 1, stdout: JSON.stringify({ error: { code } }) }),
			).toThrow('Cannot verify')
		}
		expect(() => registryVersion('pkg', { status: 1, stdout: '' })).toThrow('Cannot verify')
	})
})

it('keeps beta off latest and rejects mixed or unknown channels', () => {
	expect(publicationTag(packages)).toBe('latest')
	expect(publicationTag([{ version: '0.4.0-beta.0' }, { version: '0.3.1-beta.0' }])).toBe('beta')
	expect(() => publicationTag([{ version: '0.4.0-beta.0' }, { version: '0.3.0' }])).toThrow(
		'Mixed',
	)
	expect(() => publicationTag([{ version: '0.4.0-alpha.0' }])).toThrow('unsupported')
	expect(() =>
		packagesOfPlan(
			{
				schemaVersion: 1,
				scope: 'all',
				channel: 'beta',
				packages: [{ ...packages[0], scope: 'components' }],
			},
			packages,
			shared,
		),
	).toThrow('channel')
})
