import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import {
	libraryClosure,
	libraryNamesOf,
	withLibrarySpecs,
	lockProblems,
} from '../install-smoke/install-smoke.ts'

export const digest = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
const read = (file) => JSON.parse(readFileSync(file, 'utf8'))

/** Pack the complete dependency closure; version numbers alone do not identify unpublished fixes. */
export function prepareDevelopment(root, directory, npmCli, skipBuild) {
	const npm = (args, cwd = root, capture = true) =>
		execFileSync(process.execPath, [npmCli, ...args], {
			cwd,
			encoding: 'utf8',
			stdio: capture ? 'pipe' : 'inherit',
			maxBuffer: 64 * 1024 * 1024,
		})

	const libraryRevision = execFileSync('git', ['rev-parse', 'origin/main'], {
		cwd: root,
		encoding: 'utf8',
	}).trim()
	// Documentation may be dirty while editing; all packed sources must exactly match main.
	for (const args of [
		['diff', '--exit-code', libraryRevision, '--', 'packages'],
		['diff', '--exit-code', '--cached', libraryRevision, '--', 'packages'],
	])
		execFileSync('git', args, { cwd: root, stdio: 'pipe' })
	assert.equal(
		execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', 'packages'], {
			cwd: root,
			encoding: 'utf8',
		}).trim(),
		'',
		'No untracked library sources',
	)

	if (!skipBuild) npm(['run', 'build'], root, false)
	const workspaces = JSON.parse(npm(['query', '.workspace'])).filter(
		(item) => item.name.startsWith('@soxa-ui/') && !item.private,
	)
	const manifests = new Map(
		workspaces.map((item) => [item.name, read(join(root, item.location, 'package.json'))]),
	)
	const recipe = read(join(root, 'docs/ai/0.3.0/examples/svelte/package.json'))
	const closure = libraryClosure(libraryNamesOf(recipe), manifests)
	const packedDir = join(directory, 'tarballs')
	mkdirSync(packedDir, { recursive: true })
	const packed = JSON.parse(
		npm([
			'pack',
			...closure.map((name) => '--workspace=' + name),
			'--pack-destination',
			packedDir,
			'--json',
		]),
	)

	const specs = new Map()
	const packages = packed.map((entry) => {
		const manifest = manifests.get(entry.name)
		assert.ok(manifest, 'Known workspace: ' + entry.name)
		if (manifest.main)
			assert.ok(
				entry.files.some((file) => file.path === manifest.main.replace(/^\.\//, '')),
				'Built main in tarball: ' + entry.name,
			)
		const file = join(packedDir, entry.filename)
		specs.set(entry.name, 'file:' + file.replaceAll('\\', '/'))
		return {
			name: entry.name,
			version: entry.version,
			filename: entry.filename,
			sha256: digest(file),
			integrity: entry.integrity,
			origin: 'local-development-tarball',
			dependencies: manifest.dependencies ?? {},
			peerDependencies: manifest.peerDependencies ?? {},
		}
	})
	assert.deepEqual([...specs.keys()].sort(), closure)

	const recipeDocuments = read(join(root, 'docs/ai/0.3.0/manifest.json')).documents.filter(
		(document) => document.framework === 'svelte',
	)
	const inputs = [
		...new Set(
			recipeDocuments.flatMap((document) => [
				document.path,
				...document.examples.map((example) => example.path),
			]),
		),
	]
		.sort()
		.map((file) => ({ path: file, sha256: digest(join(root, 'docs/ai/0.3.0', file)) }))

	return {
		libraryRevision,
		librarySource: 'origin/main merged into docsRevision; no package source changes',
		developmentApiSha256: digest(join(root, 'packages/setup/dist/api.json')),
		corpusVersion: '0.3.0 (separate published API; development API is not a corpus input)',
		packages,
		inputRecordIds: recipeDocuments.map((document) => document.id),
		inputs,
		closure,
		specs,
		consumerManifest: (manifest) => withLibrarySpecs(manifest, specs),
	}
}

/** npm validates peers; the lock must also prove one actual tarball copy of every Soxa package. */
export function verifyDevelopmentLock(cwd, artifacts) {
	const versions = new Map(artifacts.packages.map((entry) => [entry.name, entry.version]))
	const lock = read(join(cwd, 'package-lock.json'))
	assert.deepEqual(
		lockProblems(
			lock,
			artifacts.closure,
			(name, resolved) =>
				resolved === artifacts.specs.get(name) ||
				resolved ===
					'file:' +
						relative(cwd, artifacts.specs.get(name).slice(5)).replaceAll('\\', '/'),
			versions,
		),
		[],
	)
	assert.equal(
		digest(join(cwd, 'node_modules/@soxa-ui/setup/dist/api.json')),
		artifacts.developmentApiSha256,
		'Installed development API bytes',
	)
	for (const entry of artifacts.packages)
		assert.equal(
			lock.packages['node_modules/' + entry.name].integrity,
			entry.integrity,
			'Installed tarball integrity: ' + entry.name,
		)

	const manifest = read(join(cwd, 'package.json'))
	for (const [name, version] of Object.entries({
		...manifest.dependencies,
		...manifest.devDependencies,
	})) {
		if (name.startsWith('@soxa-ui/')) continue
		assert.equal(
			lock.packages['node_modules/' + name].version,
			version,
			'Exact consumer pin: ' + name,
		)
		assert.ok(
			lock.packages['node_modules/' + name].resolved.startsWith(
				'https://registry.npmjs.org/',
			),
		)
	}

	let listed
	try {
		listed = JSON.parse(
			execFileSync(process.execPath, [process.env.npm_execpath, 'ls', '--all', '--json'], {
				cwd,
				encoding: 'utf8',
				stdio: 'pipe',
			}),
		)
	} catch (error) {
		if (!error.stdout) throw error
		listed = JSON.parse(error.stdout)
		assert.ok(listed.problems?.length, 'npm ls failure must explain its dependency problems')
	}
	assert.deepEqual(
		(listed.problems ?? []).filter((problem) => !problem.startsWith('extraneous:')),
		[],
		'npm peer and dependency tree',
	)
}
