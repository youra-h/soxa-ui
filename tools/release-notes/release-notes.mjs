// What a release publishes and its GitHub Release notes
// (.github/workflows/release.yml, docs/agents/build.md, «Версии пакетов»).
//
// The library — core, setup, plugins and the adapters — goes out as one
// `fixed` group with one version, while every theme and icon pack has its own.
// So a release is named by the version of the library, and without it by the
// packages it publishes; each package is read at its own version, from the
// section `## <version>` of its CHANGELOG.md.
//
// Only Node built-ins: the workflow runs the tool before `npm ci`.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SCOPES, scopeOfPackage } from '../release-plan/scopes.mjs'

/** More items than this, and the notes link to the changelogs instead. */
export const INLINE_LIMIT = 15

const SCOPE = '@soxa-ui/'

const KINDS = ['Major Changes', 'Minor Changes', 'Patch Changes']

/** `@soxa-ui/theme-oren` → `theme-oren`. */
export function shortName(name) {
	return name.startsWith(SCOPE) ? name.slice(SCOPE.length) : name
}

/**
 * `name@version` → `{ name, version }`; the `@` of the scope is not the
 * separator.
 */
export function parseSpec(spec) {
	const at = spec.lastIndexOf('@')

	if (at <= 0 || at === spec.length - 1) {
		throw new Error(`"${spec}": expected <name>@<version>`)
	}

	return { name: spec.slice(0, at), version: spec.slice(at + 1) }
}

/**
 * The packages that go to npm: every manifest under `packages/` that git
 * tracks and that is not `private`, with its directory and version. A build
 * output such as `dist/package.json` is ignored by git and is not counted.
 */
export function npmPackages(root) {
	const files = execFileSync('git', ['ls-files', 'packages/**/package.json'], {
		cwd: root,
		encoding: 'utf8',
	})
		.split('\n')
		.filter(Boolean)

	return files.flatMap((file) => {
		const manifest = JSON.parse(readFileSync(join(root, file), 'utf8'))
		const dir = file.slice(0, -'/package.json'.length)

		return manifest.private ? [] : [{ name: manifest.name, version: manifest.version, dir }]
	})
}

/** Names of the packages that share one version: the `fixed` groups of changesets. */
export function sharedVersion(root) {
	const config = JSON.parse(readFileSync(join(root, '.changeset', 'config.json'), 'utf8'))

	return new Set((config.fixed ?? []).flat())
}

/**
 * The packages npm does not have at their version. `view` asks the registry
 * for `name@version` and returns the version it found, or `undefined` when
 * there is none.
 */
export function unpublishedOf(packages, view) {
	return packages.filter(({ name, version }) => view(`${name}@${version}`) !== version)
}

/**
 * Items of the section `## <version>`: a changeset item is `- <hash>: text`,
 * continued by indented lines. The lines of bumped dependencies
 * (`- Updated dependencies`, `- @soxa-ui/x@…`) carry no change of the package.
 */
export function entriesOf(changelog, version) {
	const lines = changelog.split(/\r?\n/)
	const start = lines.indexOf(`## ${version}`)

	if (start < 0) {
		return []
	}

	const entries = []
	let kind = ''
	let current = null

	for (const line of lines.slice(start + 1)) {
		if (line.startsWith('## ')) {
			break
		}

		const heading = /^### (.+)$/.exec(line)

		if (heading) {
			kind = heading[1]
			current = null
			continue
		}

		const item = /^- [0-9a-f]{7,}: (.*)$/.exec(line)

		if (item) {
			current = { kind, text: item[1] }
			entries.push(current)
		} else if (line.startsWith('- ')) {
			current = null
		} else if (current && /^\s+\S/.test(line)) {
			current.text += '\n' + line
		}
	}

	return entries
}

/**
 * Tag and title of the GitHub Release for the published packages: `v<version>`
 * of the library when it is among them; otherwise the title lists the packages
 * (`theme-base@0.3.1, theme-oren@0.3.1`) and the release takes the tag that
 * changesets gave the first of them. Any prerelease package marks the GitHub
 * Release as a prerelease too.
 */
export function releaseOf(published, shared) {
	if (published.length === 0) {
		throw new Error('nothing was published: there is no release')
	}

	const library = new Set(published.filter(({ name }) => shared.has(name)).map((p) => p.version))

	if (library.size > 1) {
		throw new Error(
			`the library is published at more than one version: ${[...library].join(', ')}`,
		)
	}

	const prerelease = published.some(({ version }) => version.includes('-'))

	if (library.size === 1) {
		const [version] = library

		return { tag: `v${version}`, title: `v${version}`, prerelease }
	}

	const sorted = [...published].sort((a, b) => a.name.localeCompare(b.name))
	const title = sorted.map(({ name, version }) => `${shortName(name)}@${version}`).join(', ')

	return { tag: `${sorted[0].name}@${sorted[0].version}`, title, prerelease }
}

/**
 * Notes of the release. Every package is read at its own version; a package
 * outside the library is named with it, since the title carries only the
 * version of the library. A package without items of its own is left out,
 * except a theme or icon pack: it was published with a new version all the
 * same, and the last line of the notes says so.
 *
 * Few items go into the notes once each, with the packages where they are
 * written (one changeset is written into the changelog of each of its
 * packages); many — as links to the changelogs of those packages at the
 * release commit (`linkBase`): GitHub does not resolve a tag such as
 * `package@version` in a link to a file.
 *
 * `packages` — `{ name, version, file, changelog }`: `file` is the path of the
 * changelog from the repository root, `changelog` its text.
 */
export function notesOf(packages, shared, linkBase, upgradeGuide) {
	const label = ({ name, version }) => (shared.has(name) ? name : `${name}@${version}`)
	const changed = []
	const quiet = []

	for (const pkg of packages) {
		const entries = entriesOf(pkg.changelog, pkg.version)

		if (entries.length > 0) {
			changed.push({ ...pkg, entries })
		} else if (!shared.has(pkg.name)) {
			quiet.push(pkg)
		}
	}

	const unique = new Map()

	for (const pkg of changed) {
		for (const { kind, text } of pkg.entries) {
			const key = `${kind}\n${text}`
			const entry = unique.get(key) ?? { kind, text, labels: [] }

			entry.labels.push(label(pkg))
			unique.set(key, entry)
		}
	}

	const out = []
	const guides = new Set([
		...(upgradeGuide ? [upgradeGuide] : []),
		...[...unique.values()].flatMap(
			(entry) => entry.text.match(/docs\/upgrade\/[A-Za-z0-9._/-]+\.md/g) ?? [],
		),
	])
	if (guides.size) {
		out.push('### Upgrade instructions', '')
		for (const guide of guides) out.push(`- [Consumer upgrade guide](${linkBase}/${guide})`)
		out.push('')
	}

	if (unique.size === 0) {
		out.push('No changes in the packages.', '')
	} else if (unique.size <= INLINE_LIMIT) {
		for (const kind of KINDS) {
			const items = [...unique.values()].filter((entry) => entry.kind === kind)

			if (items.length === 0) {
				continue
			}

			out.push(`### ${kind}`, '')

			for (const { text, labels } of items) {
				out.push(`- ${text} (${labels.map((name) => `\`${name}\``).join(', ')})`)
			}

			out.push('')
		}
	} else {
		out.push('What changed is in the changelogs of the packages:', '')

		for (const pkg of changed) {
			out.push(`- [${label(pkg)}](${linkBase}/${pkg.file})`)
		}

		out.push('')
	}

	if (quiet.length > 0) {
		const names = quiet.map((pkg) => `\`${label(pkg)}\``).join(', ')

		out.push(`Published with updated dependencies only: ${names}.`)
	}

	return out.join('\n').trimEnd() + '\n'
}

/**
 * The published packages as `notesOf` reads them: the changelog next to each
 * manifest, empty when a new package has none yet.
 */
export function withChangelogs(root, published) {
	return published.map(({ name, version, dir }) => {
		const file = `${dir}/CHANGELOG.md`
		const path = join(root, file)

		return {
			name,
			version,
			file,
			changelog: existsSync(path) ? readFileSync(path, 'utf8') : '',
		}
	})
}

/** Separate release histories for components, themes, icons and documentation MCP. */
export function releaseGroups(packages, shared) {
	const groups = new Map()
	for (const pkg of packages) {
		const scope = scopeOfPackage(pkg, shared)
		const group = groups.get(scope) ?? []
		group.push(pkg)
		groups.set(scope, group)
	}
	return [...groups.values()]
}

/** Derive npm's channel from every approved version; stable packages stay on latest. */
export function publicationTag(packages) {
	const beta = packages.filter((pkg) => /^\d+\.\d+\.\d+-beta\.\d+$/.test(pkg.version))
	if (beta.length === packages.length && beta.length) return 'beta'
	if (packages.some((pkg) => pkg.version.includes('-')))
		throw new Error('Mixed or unsupported prerelease channels in the approved release')
	return 'latest'
}

/** Validate the approved versions against the checkout before querying or publishing. */
export function packagesOfPlan(plan, packages, shared) {
	if (
		plan?.schemaVersion !== 1 ||
		![...SCOPES, 'all'].includes(plan.scope) ||
		!Array.isArray(plan.packages) ||
		!plan.packages.length
	)
		throw new Error('Invalid approved release plan')
	const channel = publicationTag(plan.packages)
	if (plan.channel !== undefined && plan.channel !== channel)
		throw new Error('Approved release channel does not match its versions')
	const known = new Map(packages.map((pkg) => [pkg.name, pkg]))
	const seen = new Set()
	return plan.packages.map((entry) => {
		const pkg = known.get(entry.name)
		if (!pkg || pkg.version !== entry.version || seen.has(entry.name))
			throw new Error('Approved release does not match checkout: ' + entry.name)
		const scope = scopeOfPackage(pkg, shared)
		if (scope !== entry.scope || (plan.scope !== 'all' && plan.scope !== scope))
			throw new Error('Package is outside the approved release scope: ' + entry.name)
		seen.add(entry.name)
		return pkg
	})
}

export function assertPlannedUnpublished(approved, unpublished) {
	const allowed = new Set(approved.map((pkg) => pkg.name + '@' + pkg.version))
	const unexpected = unpublished.filter((pkg) => !allowed.has(pkg.name + '@' + pkg.version))
	if (unexpected.length)
		throw new Error(
			'Unpublished packages outside the approved release: ' +
				unexpected.map((pkg) => pkg.name).join(', '),
		)
}

/** Registry outages and authorization failures must never look like an unpublished version. */
export function registryVersion(spec, result) {
	let output
	try {
		output = JSON.parse(result.stdout || result.stderr || 'null')
	} catch {
		/* Invalid output is handled below. */
	}
	if (result.status === 0 && typeof output === 'string') return output
	if (result.status !== 0 && output?.error?.code === 'E404') return undefined
	throw new Error('Cannot verify npm version for ' + spec + ' (exit ' + result.status + ')')
}
