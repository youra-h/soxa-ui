// Release steps of .github/workflows/release.yml (docs/agents/build.md,
// «Версии пакетов»):
//
//   node tools/release-notes/cli.mjs unpublished         # approved versions missing from npm
//   node tools/release-notes/cli.mjs notes <links>       # notes for name@version lines from stdin
//   node tools/release-notes/cli.mjs release <links> <sha>  # the GitHub Release for them
//
// `<links>` is the base of links to files at the release commit,
// `https://github.com/<owner>/<repo>/blob/<sha>`. `notes` previews on a release
// branch what `release` will publish: `unpublished` lists what the branch bumped.

import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import {
	publicationTag,
	notesOf,
	npmPackages,
	parseSpec,
	releaseOf,
	sharedVersion,
	unpublishedOf,
	releaseGroups,
	packagesOfPlan,
	assertPlannedUnpublished,
	registryVersion,
	withChangelogs,
} from './release-notes.mjs'

const ROOT = resolve(import.meta.dirname, '../..')

const USAGE = [
	'node tools/release-notes/cli.mjs unpublished',
	'node tools/release-notes/cli.mjs planned',
	'node tools/release-notes/cli.mjs channel',
	'node tools/release-notes/cli.mjs notes <links>',
	'node tools/release-notes/cli.mjs release <links> <sha>',
].join('\n')

/**
 * The version npm has for `name@version`, or `undefined` — npm answers a
 * missing one with E404. One command line through the shell: on Windows npm
 * is a `.cmd` script, and only a shell runs it.
 */
function view(spec) {
	const result = spawnSync(`npm view ${spec} version --json`, {
		encoding: 'utf8',
		shell: true,
	})

	return registryVersion(spec, result)
}

/**
 * The published packages from stdin, one `name@version` per line, each found
 * among the packages that go to npm at the version of its manifest.
 */
function readPublished() {
	const known = new Map(npmPackages(ROOT).map((pkg) => [pkg.name, pkg]))

	return readFileSync(0, 'utf8')
		.split(/\r?\n/)
		.filter((line) => line.trim() !== '')
		.map((line) => {
			const { name, version } = parseSpec(line.trim())
			const pkg = known.get(name)

			if (pkg === undefined || pkg.version !== version) {
				throw new Error(`${line}: no package going to npm at this version`)
			}

			return pkg
		})
}

function planned() {
	const manifest = JSON.parse(readFileSync(resolve(ROOT, '.release/plan.json'), 'utf8'))
	return packagesOfPlan(manifest, npmPackages(ROOT), sharedVersion(ROOT))
}

function run(command, args) {
	if (command === 'channel' && args.length === 0) {
		console.log(publicationTag(planned()))
		return 0
	}
	if (command === 'planned' && args.length === 0) {
		for (const pkg of planned()) console.log(pkg.name + '@' + pkg.version)
		return 0
	}
	if (command === 'unpublished' && args.length === 0) {
		const approved = planned()
		const missing = unpublishedOf(npmPackages(ROOT), view)
		assertPlannedUnpublished(approved, missing)
		for (const { name, version } of missing) {
			console.log(`${name}@${version}`)
		}

		return 0
	}

	if (
		(command === 'notes' && args.length === 1) ||
		(command === 'release' && args.length === 2)
	) {
		const [links, sha] = args
		const published = readPublished()
		const shared = sharedVersion(ROOT)
		const planFile = resolve(ROOT, '.release/plan.json')
		const upgradeGuide = existsSync(planFile)
			? JSON.parse(readFileSync(planFile, 'utf8')).upgradeGuide
			: undefined
		const notes = notesOf(withChangelogs(ROOT, published), shared, links, upgradeGuide)

		if (command === 'notes') {
			process.stdout.write(notes)
			return 0
		}

		for (const group of releaseGroups(published, shared)) {
			const { tag, title, prerelease } = releaseOf(group, shared)
			const existing = spawnSync(
				'gh',
				['release', 'view', tag, '--json', 'targetCommitish'],
				{ encoding: 'utf8' },
			)
			if (existing.status === 0) {
				if (JSON.parse(existing.stdout).targetCommitish !== sha)
					throw new Error('Release tag already targets another commit: ' + tag)
				continue
			}
			if (!/release not found|HTTP 404/i.test(existing.stderr ?? ''))
				throw new Error('Cannot verify existing GitHub release: ' + tag)
			const { status } = spawnSync(
				'gh',
				[
					'release',
					'create',
					tag,
					'--title',
					title,
					'--target',
					sha,
					'--notes-file',
					'-',
					...(prerelease ? ['--prerelease'] : []),
					...(!prerelease && group.some((pkg) => shared.has(pkg.name))
						? ['--latest']
						: ['--latest=false']),
				],
				{
					input: notesOf(withChangelogs(ROOT, group), shared, links, upgradeGuide),
					stdio: ['pipe', 'inherit', 'inherit'],
				},
			)
			if (status !== 0) return status ?? 1
		}
		return 0
	}

	console.error(USAGE)
	return 2
}

process.exitCode = run(process.argv[2], process.argv.slice(3))
