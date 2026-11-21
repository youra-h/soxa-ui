// Changesets owns version and changelog generation; this module selects a release scope.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { relative, join } from 'node:path'
import { getPackages } from '@manypkg/get-packages'
import { readConfig } from '@changesets/config'
import { readChangesets } from '@changesets/read'
import { readPreState } from '@changesets/pre'
import { assembleReleasePlan } from '@changesets/assemble-release-plan'
import { applyReleasePlan } from '@changesets/apply-release-plan'

import { SCOPES, scopeOfPackage } from './scopes.mjs'
export { SCOPES } from './scopes.mjs'
export const PLAN_PATH = '.release/plan.json'

export function packageScope(pkg, root, shared) {
	return scopeOfPackage(
		{ name: pkg.packageJson.name, dir: relative(root, pkg.dir).replaceAll('\\', '/') },
		shared,
	)
}

/** Keep unrelated changesets pending, including the other half of a mixed changeset. */
export function planRelease(
	{ packages, config, changesets, preState },
	scope,
	{ beta = false } = {},
) {
	if (![...SCOPES, 'all'].includes(scope))
		throw new Error('Choose components, themes, icons, mcp or all')
	if (preState && scope !== 'all')
		throw new Error(
			'The existing global prerelease must first graduate with release:prepare -- all',
		)
	const shared = new Set(config.fixed.flat())
	const publishable = packages.packages.filter(
		(pkg) => !pkg.packageJson.private && !config.ignore.includes(pkg.packageJson.name),
	)
	const byName = new Map(publishable.map((pkg) => [pkg.packageJson.name, pkg]))
	const included = new Set(
		publishable
			.filter(
				(pkg) => scope === 'all' || packageScope(pkg, packages.rootDir, shared) === scope,
			)
			.map((pkg) => pkg.packageJson.name),
	)
	const selected = changesets
		.map((cs) => ({ ...cs, releases: cs.releases.filter((r) => included.has(r.name)) }))
		.filter((cs) => scope === 'all' || cs.releases.length)
	// Keep new beta state local to this plan; legacy global state still graduates together.
	const channel = beta
		? { mode: 'pre', tag: 'beta' }
		: preState
			? { ...preState, mode: 'exit' }
			: undefined
	if (!beta && !preState) {
		const graduating = publishable.filter(
			(pkg) => included.has(pkg.packageJson.name) && pkg.packageJson.version.includes('-'),
		)
		if (graduating.length)
			selected.push({
				id: 'graduate-beta',
				summary: 'Graduate the approved beta packages to stable versions.',
				releases: graduating.map((pkg) => ({ name: pkg.packageJson.name, type: 'patch' })),
			})
	}
	const plan = assembleReleasePlan(selected, packages, config, channel)
	const bumped = plan.releases.filter((r) => r.newVersion !== r.oldVersion)
	const outside = bumped.filter((r) => !included.has(r.name))
	if (outside.length)
		throw new Error(
			'Release needs packages outside ' +
				scope +
				': ' +
				outside.map((r) => r.name).join(', ') +
				'. Review an all-scope plan instead.',
		)
	if (!beta && bumped.some((r) => r.newVersion.includes('-')))
		throw new Error(
			'This command prepares stable releases; a new prerelease requires a separate owner decision',
		)
	const used = new Set(plan.changesets.map((cs) => cs.id))
	const remaining = changesets
		.filter((cs) => used.has(cs.id))
		.map((cs) => ({ ...cs, releases: cs.releases.filter((r) => !included.has(r.name)) }))
		.filter((cs) => cs.releases.length)
	const manifest = {
		schemaVersion: 1,
		scope,
		...(beta ? { channel: 'beta' } : {}),
		packages: bumped.map((r) => ({
			name: r.name,
			version: r.newVersion,
			previousVersion: r.oldVersion,
			scope: packageScope(byName.get(r.name), packages.rootDir, shared),
		})),
	}
	return { plan, remaining, manifest }
}

export async function loadRelease(root, scope, options) {
	const packages = await getPackages(root)
	const { config, errors } = await readConfig(root, packages)
	if (!config) throw new Error('Invalid Changesets configuration: ' + JSON.stringify(errors))
	const changesets = await readChangesets(root)
	const preState = await readPreState(root)
	return {
		packages,
		config,
		...planRelease({ packages, config, changesets, preState }, scope, options),
	}
}

export async function prepareRelease(root, release) {
	if (!release.manifest.packages.length)
		throw new Error('No pending changes in the selected scope')
	await applyReleasePlan(release.plan, release.packages, release.config, undefined, root)
	for (const cs of release.remaining) {
		const header = cs.releases.map((r) => JSON.stringify(r.name) + ': ' + r.type).join('\n')
		await writeFile(
			join(root, '.changeset', cs.id + '.md'),
			'---\n' + header + '\n---\n\n' + cs.summary.trim() + '\n',
		)
	}
	await mkdir(join(root, '.release'), { recursive: true })
	await writeFile(join(root, PLAN_PATH), JSON.stringify(release.manifest, null, 2) + '\n')
	// Check the actual files after Changesets ran, including dependency-only updates.
	const approved = new Map(release.manifest.packages.map((pkg) => [pkg.name, pkg.version]))
	for (const pkg of release.packages.packages) {
		const next = JSON.parse(await readFile(join(pkg.dir, 'package.json'), 'utf8'))
		const expected = approved.get(pkg.packageJson.name) ?? pkg.packageJson.version
		if (next.version !== expected)
			throw new Error('Unexpected version after preparing release: ' + pkg.packageJson.name)
	}
}
