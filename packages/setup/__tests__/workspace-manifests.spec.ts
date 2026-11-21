import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, posix, resolve } from 'node:path'
import { readChangesets } from '@changesets/read'

/**
 * Guard of docs/agents/build.md, «Версии пакетов». Versions are kept by
 * changesets: the library — core, setup, plugins and the adapters — is one
 * `fixed` group and so one version, every theme and icon pack has a version of
 * its own, the playground is in `ignore`. A library package carries metadata —
 * a description, a license, its path in the repository — and its entry points
 * lead to files.
 *
 * A library package is published as well: it is not `private`, the scope is
 * open, `files` sets the tarball, and the license text and the README lie next
 * to the manifest — the `license` field alone is not enough in a tarball.
 * Third-party content under its own license is named in `license`
 * (`MIT AND Apache-2.0`) and ships its text as `LICENSE-<id>` from `files`. A
 * neighbour is declared by its exact version (`0.1.0`): the border inside the
 * group is internal and changes in any release, so a consumer gets a set from
 * one release. A theme or an icon pack declares a package of the group by a
 * range (`^0.1.0`): that border is a public contract.
 *
 * The package list is not hardcoded: it is expanded from `workspaces` of the
 * root manifest, so a new package falls under the guard by itself. The list of
 * the playground is `ignore` of the changesets config, there is no second one.
 */

const ROOT = resolve(__dirname, '../../..')

/** A manifest as it is: fields are not taken on trust but checked one by one. */
type TManifest = Readonly<Record<string, unknown>>

type TWorkspacePackage = {
	/** Path from the repository root with `/` — what `repository.directory` holds. */
	readonly dir: string
	readonly manifest: TManifest
}

/** Fields of `.changeset/config.json` that the shared version rests on. */
type TChangesetConfig = {
	/** Groups of packages released at one version. */
	readonly fixed: readonly (readonly string[])[]
	/** Packages changesets does not release: the playground. */
	readonly ignore: readonly string[]
}

/** `.changeset/pre.json`: the pre-release mode of changesets. */
type TPreState = {
	/** `pre` — versions get a suffix, `exit` — the next release goes without it. */
	readonly mode: string
	/** Suffix of the version and the npm tag: `alpha` → `0.3.0-alpha.0`. */
	readonly tag: string
}

/** A changeset as changesets itself reads it (`@changesets/read`). */
type TChangeset = {
	/** File name without `.md`, from `.changeset/`. */
	readonly id: string
	readonly releases: readonly { readonly name: string; readonly type: string }[]
}

function isRecord(value: unknown): value is TManifest {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is readonly string[] {
	return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isGroupArray(value: unknown): value is readonly (readonly string[])[] {
	return Array.isArray(value) && value.every(isStringArray)
}

function readJsonObject(file: string): TManifest {
	const parsed: unknown = JSON.parse(readFileSync(file, 'utf-8'))

	if (!isRecord(parsed)) {
		throw new Error(`${file}: ожидается объект JSON`)
	}

	return parsed
}

function readManifest(dir: string): TManifest {
	return readJsonObject(join(ROOT, dir, 'package.json'))
}

/**
 * Reads `fixed` and `ignore` from the changesets config. A missing field is an
 * empty list, as for changesets itself; a field of another shape is an error,
 * not a silent empty list.
 */
function readChangesetConfig(): TChangesetConfig {
	const file = join(ROOT, '.changeset', 'config.json')
	const { fixed = [], ignore = [] } = readJsonObject(file)

	if (!isGroupArray(fixed)) {
		throw new Error(`${file}: fixed — не массив групп имён пакетов`)
	}

	if (!isStringArray(ignore)) {
		throw new Error(`${file}: ignore — не массив имён пакетов`)
	}

	return { fixed, ignore }
}

/** No file — changesets is not in pre-mode: `undefined`, as for changesets itself. */
function readPreState(): TPreState | undefined {
	const file = join(ROOT, '.changeset', 'pre.json')

	if (!existsSync(file)) {
		return undefined
	}

	const { mode, tag } = readJsonObject(file)

	if (typeof mode !== 'string' || typeof tag !== 'string') {
		throw new Error(`${file}: mode и tag — строки`)
	}

	return { mode, tag }
}

function joinDir(dir: string, name: string): string {
	return dir === '' ? name : `${dir}/${name}`
}

/**
 * Expands a `workspaces` pattern as npm does: a directory matching the pattern
 * is a package if it holds a `package.json`. The patterns of the project are
 * names and `*` in place of a segment; other glob syntax the guard does not
 * understand, and it fails instead of skipping packages silently.
 */
function expandWorkspace(pattern: string): string[] {
	let dirs = ['']

	for (const segment of pattern.split('/')) {
		if (segment === '*') {
			dirs = dirs.flatMap((dir) =>
				readdirSync(join(ROOT, dir), { withFileTypes: true })
					.filter((entry) => entry.isDirectory())
					.filter((entry) => entry.name !== 'node_modules' && !entry.name.startsWith('.'))
					.map((entry) => joinDir(dir, entry.name)),
			)
		} else if (/[*?[\]{}()!]/.test(segment)) {
			throw new Error(`Шаблон workspaces "${pattern}": сторож понимает только имена и "*"`)
		} else {
			dirs = dirs
				.map((dir) => joinDir(dir, segment))
				.filter((dir) => existsSync(join(ROOT, dir)))
		}
	}

	return dirs.filter((dir) => existsSync(join(ROOT, dir, 'package.json')))
}

function collectWorkspacePackages(root: TManifest): TWorkspacePackage[] {
	const { workspaces } = root

	if (!isStringArray(workspaces)) {
		throw new Error('В корневом package.json нет массива строк workspaces')
	}

	const dirs = new Set(workspaces.flatMap(expandWorkspace))

	return [...dirs].map((dir) => ({ dir, manifest: readManifest(dir) }))
}

/** Library packages — the workspace without `ignore`: exactly what changesets releases. */
function selectLibrary(
	packages: readonly TWorkspacePackage[],
	config: TChangesetConfig,
): TWorkspacePackage[] {
	const ignored = new Set<unknown>(config.ignore)

	return packages.filter(({ manifest }) => !ignored.has(manifest.name))
}

/**
 * Directories of the packages with a version of their own: themes and icon
 * packs. Documentation MCP is independently versioned as well. The themes that ship are not the final ones — applications write
 * their own — so a theme changes on its own schedule and not with every
 * release of the library, and an icon pack likewise. Every other library
 * package belongs to the `fixed` group.
 */
const OWN_VERSION_DIRS = ['packages/themes/', 'packages/icons/'] as const

/** A theme or an icon pack: a version of its own, outside the `fixed` group. */
function hasOwnVersion({ dir }: TWorkspacePackage): boolean {
	return dir === 'packages/mcp' || OWN_VERSION_DIRS.some((prefix) => dir.startsWith(prefix))
}

/** Manifest fields whose targets are files of the package. */
const ENTRY_FIELDS = ['main', 'types', 'style', 'exports', 'bin'] as const

/**
 * The paths from the repository root that git ignores, in one run for all of
 * them: a run per path took seconds on Windows once Web Components declared an
 * entry per element. Code 0 — some are ignored, 1 — none; any other outcome
 * (git did not start, the root is no repository) is a failure, and it fails the
 * guard instead of reading as «not ignored».
 */
function gitIgnored(paths: readonly string[]): ReadonlySet<string> {
	if (paths.length === 0) {
		return new Set()
	}

	const { status, error, stderr, stdout } = spawnSync('git', ['check-ignore', '--stdin', '-z'], {
		cwd: ROOT,
		encoding: 'utf-8',
		input: paths.join('\0'),
	})

	if (status !== 0 && status !== 1) {
		throw new Error(`git check-ignore ${paths.join(' ')}: ${error?.message ?? stderr}`)
	}

	return new Set(stdout.split('\0').filter((path) => path !== ''))
}

/** The package is built: it has a `build` script. */
function hasBuildScript({ manifest }: TWorkspacePackage): boolean {
	const { scripts } = manifest

	return isRecord(scripts) && typeof scripts.build === 'string'
}

/** Target of an entry point: as the manifest declares it and where it leads from the repository root. */
type TEntryTarget = {
	/** `exports["."]["types"] "./dist/index.d.ts"` — for the text of a violation. */
	readonly declared: string
	/** Path from the repository root with `/`. */
	readonly path: string
}

/**
 * Targets of `main`, `types`, `style` and `exports`. `exports` is read in
 * depth: a string is a target, an object — conditions or subpaths.
 */
function entryTargets({ dir, manifest }: TWorkspacePackage): TEntryTarget[] {
	const collect = (field: string, value: unknown): TEntryTarget[] => {
		if (value === undefined) {
			return []
		}

		if (isRecord(value)) {
			return Object.entries(value).flatMap(([key, nested]) =>
				collect(`${field}[${JSON.stringify(key)}]`, nested),
			)
		}

		if (typeof value !== 'string') {
			throw new Error(
				`${dir}: ${field} ${JSON.stringify(value)} — сторож понимает только путь и объект условий`,
			)
		}

		return [{ declared: `${field} ${JSON.stringify(value)}`, path: posix.join(dir, value) }]
	}

	return ENTRY_FIELDS.flatMap((field) => collect(field, manifest[field]))
}

/**
 * The package ships a build: at least one of its entry points leads to what a
 * clean clone does not have. While the entry points show sources, there is
 * nothing to build.
 */
function shipsBuildOutput(pkg: TWorkspacePackage): boolean {
	return gitIgnored(entryTargets(pkg).map(({ path }) => path)).size > 0
}

/**
 * Violations of the entry points: a target of `main`, `types`, `style` and
 * `exports` is a file of the package.
 *
 * A target git ignores is absent from a clean clone — it is a build output,
 * allowed only if the package has a `build` script. The answer does not depend
 * on whether the package is built on this machine. Where the bundler writes
 * the guard does not read: that would tie it to one bundler.
 */
function checkEntryPoints(pkg: TWorkspacePackage): string[] {
	const buildable = hasBuildScript(pkg)
	const targets = entryTargets(pkg)
	const ignored = gitIgnored(targets.map(({ path }) => path))

	return targets.flatMap(({ declared, path }) => {
		if (ignored.has(path)) {
			return buildable
				? []
				: [`${declared} — выход сборки (игнорируется git), а скрипта build у пакета нет`]
		}

		return statSync(join(ROOT, path), { throwIfNoEntry: false })?.isFile()
			? []
			: [`${declared} — нет такого файла`]
	})
}

/**
 * Violations of the publishing fields: a library package goes to npm and is
 * not closed to it.
 *
 * `private` closes the package to `npm publish` altogether. A scoped package
 * is `restricted` by default, and without `publishConfig.access` the
 * publication would fail on a paid plan. `files` sets the tarball: without it
 * the whole directory goes out, `__tests__` and configs included.
 */
function checkPublishing(manifest: TManifest): string[] {
	const violations: string[] = []
	const { private: restricted, publishConfig, files } = manifest
	const access = isRecord(publishConfig) ? publishConfig.access : undefined

	if (restricted !== undefined) {
		violations.push(`private ${JSON.stringify(restricted)} — библиотечный пакет выкладывается`)
	}

	if (access !== 'public') {
		violations.push(
			`publishConfig.access ${JSON.stringify(access)}, ожидается "public" — у скоупа доступ по умолчанию restricted`,
		)
	}

	if (!isStringArray(files) || files.length === 0) {
		violations.push(`files ${JSON.stringify(files)}, ожидается непустой список путей тарболла`)
	}

	return violations
}

/** An SPDX license identifier: letters, digits, dot and hyphen — `Apache-2.0`. */
const SPDX_ID = /^[A-Za-z0-9.-]+$/

/**
 * Third-party licenses of the package from its `license` field. The own one is
 * MIT for every package, and a package shipping third-party content under
 * another license adds it as an SPDX expression: `MIT AND Apache-2.0`. An
 * expression of another shape is `undefined`: the guard does not parse `OR`,
 * `WITH` and parentheses, nor accept a repeated license.
 */
function thirdPartyLicenses(license: unknown): readonly string[] | undefined {
	if (typeof license !== 'string') {
		return undefined
	}

	const [own, ...others] = license.split(' AND ')
	const valid = others.every((id) => SPDX_ID.test(id) && id !== 'MIT')

	return own === 'MIT' && valid && new Set(others).size === others.length ? others : undefined
}

/** The file with a third-party license text next to the manifest: `Apache-2.0` → `LICENSE-Apache-2.0`. */
function licenseFile(id: string): string {
	return `LICENSE-${id}`
}

/**
 * Violations of the `license` field and of the third-party license texts in
 * `files`.
 *
 * A third-party license is named in `license`, or a license scanner sees MIT
 * alone. Its text is `LICENSE-<id>` in `files`: npm puts `LICENSE` into the
 * tarball by itself and the rest only by `files`, so the package would name a
 * license without shipping its text. And back: a text in `files` without its
 * license in `license` means the license left the expression while the content
 * under it, judging by the tarball, stayed.
 */
function checkLicense(manifest: TManifest): string[] {
	const { license, files } = manifest
	const others = thirdPartyLicenses(license)

	if (others === undefined) {
		return [`license ${JSON.stringify(license)}, ожидается "MIT" или "MIT AND <SPDX-id>…"`]
	}

	const shipped = isStringArray(files) ? files : []
	const texts = others.map(licenseFile)
	const missing = texts
		.filter((name) => !shipped.includes(name))
		.map((name) => `files без "${name}" — лицензия названа, а её текст в тарболл не уедет`)
	const stray = shipped
		.filter((name) => name.startsWith('LICENSE-') && !texts.includes(name))
		.map((name) => `files: "${name}" — текст лицензии, которой нет в license`)

	return [...missing, ...stray]
}

/** Files of the package read from disk: file name → text, `undefined` when missing. */
type TPackageFiles = Readonly<Record<string, string | undefined>>

/**
 * A line break is not content: `.gitattributes` normalizes it to LF, and in a
 * Windows working copy neighbouring files differ in it on their own — by when
 * each was checked out.
 */
function withLf(text: string): string {
	return text.replace(/\r\n/g, '\n')
}

/**
 * Violations of the tarball: README and LICENSE lie next to the manifest, the
 * license is a copy of the root one, and every third-party license (`others`)
 * has a non-empty `LICENSE-<id>`.
 *
 * npm puts README and LICENSE into the tarball past `files`, and the consumer
 * sees both: the `license` field names the license but does not carry its
 * text, and a package without a README looks abandoned on npm. A third-party
 * license text goes out by `files` — `checkLicense` checks that.
 */
function checkShippedFiles(
	files: TPackageFiles,
	license: string,
	others: readonly string[] = [],
): string[] {
	const violations: string[] = []
	const readme = files['README.md']

	if (readme === undefined) {
		violations.push('нет README.md — его читают на npm вместо описания')
	} else if (readme.trim() === '') {
		violations.push('README.md пуст')
	}

	if (files.LICENSE === undefined) {
		violations.push('нет LICENSE — в тарболле у пакета нет текста лицензии')
	} else if (withLf(files.LICENSE) !== withLf(license)) {
		violations.push('LICENSE расходится с корневым — это его копия, а не своя лицензия')
	}

	for (const id of others) {
		const name = licenseFile(id)
		const text = files[name]

		if (text === undefined) {
			violations.push(`нет ${name} — license называет ${id}, а её текста у пакета нет`)
		} else if (text.trim() === '') {
			violations.push(`${name} пуст`)
		}
	}

	return violations
}

/**
 * Reads the files of the package that go into the tarball next to the
 * manifest: README, LICENSE and the texts of the third-party licenses `others`.
 */
function readShippedFiles(dir: string, others: readonly string[] = []): TPackageFiles {
	const read = (name: string): string | undefined => {
		const file = join(ROOT, dir, name)

		return statSync(file, { throwIfNoEntry: false })?.isFile()
			? readFileSync(file, 'utf-8')
			: undefined
	}
	const names = ['README.md', 'LICENSE', ...others.map(licenseFile)]

	return Object.fromEntries(names.map((name) => [name, read(name)]))
}

/** Violations of one library package; an empty list — the package is fine. */
function checkLibraryPackage({ dir, manifest }: TWorkspacePackage): string[] {
	const violations: string[] = []
	const { description, repository, version } = manifest
	const directory = isRecord(repository) ? repository.directory : undefined

	if (typeof description !== 'string' || description.trim() === '') {
		violations.push('пустой description')
	}

	violations.push(...checkLicense(manifest))

	if (directory !== dir) {
		violations.push(
			`repository.directory ${JSON.stringify(directory)}, ожидается путь пакета "${dir}"`,
		)
	}

	// changesets skips a package without a version silently: it would drop out of the release
	if (typeof version !== 'string' || version === '') {
		violations.push(`version ${JSON.stringify(version)}, ожидается строка версии`)
	}

	violations.push(...checkPublishing(manifest))
	violations.push(...checkEntryPoints({ dir, manifest }))

	return violations.map((violation) => `${dir}: ${violation}`)
}

/** Manifest fields that declare a dependency. */
const DEPENDENCY_FIELDS = [
	'dependencies',
	'devDependencies',
	'peerDependencies',
	'optionalDependencies',
] as const

/** `^` and a whole version, `^0.3.0` or `^0.3.0-alpha.7`. */
const CARET_RANGE = /^\^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

/**
 * Violations of the ranges on neighbours. A theme or an icon pack declares a
 * package of the `fixed` group by a range, `^<version>`; every other neighbour
 * is declared by its exact `<version>`.
 *
 * Exact inside the group: the border between core, setup, plugins and the
 * adapters is internal and changes in a patch too, and `^0.1.0` would let the
 * former `setup@0.1.0` to `core@0.1.1`. The exact version keeps a set from one
 * release. A theme's dependency on its base is exact as well: the theme builds
 * the CSS of the base into its own, and its behavior calls the plugins of the
 * base, so both must come from one release of the base. The `workspace:`
 * protocol npm does not understand at all (EUNSUPPORTEDPROTOCOL on
 * `npm install`), so the version is literal; `"*"` would mean «any version» in
 * a published package, and a release does not rewrite it — nothing ever falls
 * out of it.
 *
 * A range for themes and icon packs: they live by versions of their own, and
 * their border with the group — the `so-*` classes, `data-*` and `--so-*` for
 * a theme — is a public contract, broken only by a minor release before
 * `1.0`. Whether the range admits the version in the workspace npm checks
 * itself: otherwise the workspace is not linked.
 */
function checkInternalRanges(library: readonly TWorkspacePackage[]): string[] {
	const versions = new Map(
		library.map(({ manifest }): [unknown, unknown] => [manifest.name, manifest.version]),
	)
	const own = new Set<unknown>(library.filter(hasOwnVersion).map(({ manifest }) => manifest.name))

	return library.flatMap(({ dir, manifest }) =>
		DEPENDENCY_FIELDS.flatMap((field) => {
			const deps = manifest[field]

			if (!isRecord(deps)) {
				return []
			}

			return Object.entries(deps).flatMap(([name, range]) => {
				const version = versions.get(name)

				if (version === undefined) {
					return []
				}

				const declared = `${dir}: ${field}["${name}"] ${JSON.stringify(range)}`

				if (own.has(manifest.name) && !own.has(name)) {
					return typeof range === 'string' && CARET_RANGE.test(range)
						? []
						: [
								`${declared}, ожидается диапазон "^<версия>" — тема и иконки зависят от библиотеки диапазоном`,
							]
				}

				const expected = String(version)

				return range === expected
					? []
					: [`${declared}, ожидается ${JSON.stringify(expected)}`]
			})
		}),
	)
}

/**
 * One version for the `fixed` group, while themes and icon packs have their
 * own; the root has none: changesets bumps only the packages of the workspace,
 * and a root version would turn into a stale copy after the first release.
 */
function checkVersions(root: TManifest, library: readonly TWorkspacePackage[]): string[] {
	const violations: string[] = []
	const dirsByVersion = new Map<unknown, string[]>()

	if ('version' in root) {
		violations.push(
			`корневой package.json: version ${JSON.stringify(root.version)} — версия у пакетов, у корня её нет`,
		)
	}

	for (const { dir, manifest } of library.filter((pkg) => !hasOwnVersion(pkg))) {
		dirsByVersion.set(manifest.version, [...(dirsByVersion.get(manifest.version) ?? []), dir])
	}

	if (dirsByVersion.size > 1) {
		const groups = [...dirsByVersion].map(
			([version, dirs]) => `${JSON.stringify(version)} — ${dirs.join(', ')}`,
		)

		violations.push(`версии пакетов группы fixed разошлись: ${groups.join('; ')}`)
	}

	return violations
}

/**
 * Workspaces the root `build` calls, in calling order. The script is made of
 * `npm run build --workspace=<name>`, and there is no second list of the
 * packages to build in the repository.
 */
function buildOrder(root: TManifest): string[] {
	const { scripts } = root

	if (!isRecord(scripts) || typeof scripts.build !== 'string') {
		throw new Error('В корневом package.json нет скрипта build')
	}

	return [...scripts.build.matchAll(/--workspace=(\S+)/g)].map(([, name]) => name)
}

/**
 * The root `build` builds every package that ships a build, in the order of
 * dependencies and not of the alphabet: the declarations pass reads a
 * neighbour through its manifest, that is by its built `dist`. Who depends on
 * whom the guard takes from `dependencies` of the manifests — there is no
 * second list.
 *
 * `peerDependencies` do not count: the consumer installs them, not the
 * workspace, and a theme declares by them the core its CSS build does not need
 * at all.
 */
function checkBuildOrder(root: TManifest, library: readonly TWorkspacePackage[]): string[] {
	const violations: string[] = []
	const order = buildOrder(root)
	const buildable = new Set(library.filter(hasBuildScript).map(({ manifest }) => manifest.name))
	const position = new Map<unknown, number>(order.map((name, index) => [name, index]))

	for (const pkg of library) {
		if (shipsBuildOutput(pkg) && !position.has(pkg.manifest.name)) {
			violations.push(
				`build: нет ${JSON.stringify(pkg.manifest.name)} (${pkg.dir}) — пакет отдаёт наружу сборку, а корневой build её не делает`,
			)
		}
	}

	for (const name of order) {
		if (!buildable.has(name)) {
			violations.push(
				`build: ${JSON.stringify(name)} — не библиотечный пакет со скриптом build`,
			)
		}
	}

	for (const { manifest } of library) {
		const index = position.get(manifest.name)
		const dependencies = isRecord(manifest.dependencies)
			? Object.keys(manifest.dependencies)
			: []

		if (index === undefined) {
			continue
		}

		for (const dependency of dependencies) {
			const required = position.get(dependency)

			if (required !== undefined && required > index) {
				violations.push(
					`build: ${JSON.stringify(manifest.name)} собирается раньше ${JSON.stringify(dependency)}, от которого зависит`,
				)
			}
		}
	}

	return violations
}

/**
 * `fixed` is one group: every library package except themes and icon packs,
 * and nothing else. A package of the library outside the group would part
 * from the others at the first release; a theme in it would be released with
 * every release of the library, the playground — together with the library.
 */
function checkFixed(config: TChangesetConfig, library: readonly TWorkspacePackage[]): string[] {
	const violations: string[] = []
	const libraryNames = new Set(library.map(({ manifest }) => manifest.name))
	const fixedNames = config.fixed.flat()
	const fixedSet = new Set<unknown>(fixedNames)

	if (config.fixed.length !== 1) {
		violations.push(`fixed: групп ${config.fixed.length}, ожидается одна`)
	}

	for (const pkg of library) {
		const { dir, manifest } = pkg
		const grouped = fixedSet.has(manifest.name)

		if (hasOwnVersion(pkg) && grouped) {
			violations.push(
				`fixed: ${JSON.stringify(manifest.name)} (${dir}) — у тем и иконок своя версия, в группе их нет`,
			)
		} else if (!hasOwnVersion(pkg) && !grouped) {
			violations.push(
				`fixed: нет ${JSON.stringify(manifest.name)} (${dir}) — пакет вне общей версии`,
			)
		}
	}

	for (const name of fixedNames) {
		if (!libraryNames.has(name)) {
			violations.push(`fixed: ${JSON.stringify(name)} — не библиотечный пакет`)
		}
	}

	return violations
}

/** Names in `ignore` missing from the workspace: an exclusion of a playground without its package. */
function checkIgnore(config: TChangesetConfig, packages: readonly TWorkspacePackage[]): string[] {
	const names = new Set(packages.map(({ manifest }) => manifest.name))

	return config.ignore
		.filter((name) => !names.has(name))
		.map((name) => `ignore: ${JSON.stringify(name)} — нет такого пакета в воркспейсе`)
}

/**
 * Before `1.0` a breaking change bumps the minor: `major` on a package at
 * `0.x` would release `1.0.0` of the package, and of its whole group.
 */
function checkChangesets(
	changesets: readonly TChangeset[],
	library: readonly TWorkspacePackage[],
): string[] {
	const violations: string[] = []
	const versions = new Map(
		library.map(({ manifest }): [unknown, unknown] => [manifest.name, manifest.version]),
	)

	for (const { id, releases } of changesets) {
		for (const { name, type } of releases) {
			const version = versions.get(name)

			if (type === 'major' && typeof version === 'string' && version.startsWith('0.')) {
				violations.push(
					`.changeset/${id}.md: major у "${name}" при версии ${version} — до 1.0 ломающее изменение поднимает minor`,
				)
			}
		}
	}

	return violations
}

/** Beta versions match the active channel; exiting keeps the suffix until versioning. */
function checkPrerelease(
	preState: TPreState | undefined,
	library: readonly TWorkspacePackage[],
	approved: ReadonlyMap<string, string> = new Map(),
): string[] {
	if (preState?.mode === 'exit') return []

	if (preState?.mode === 'pre' && preState.tag !== 'beta') {
		return ['.changeset/pre.json: разрешён только pre-канал beta']
	}

	return library.flatMap(({ dir, manifest }) => {
		const { version } = manifest
		if (typeof version !== 'string' || !version.includes('-')) return []
		if (
			(preState?.mode === 'pre' || approved.get(String(manifest.name)) === version) &&
			/^\d+\.\d+\.\d+-beta\.\d+$/.test(version)
		)
			return []

		return [`${dir}: версия ${version} с суффиксом требует активного pre-канала beta`]
	})
}

describe('манифесты пакетов воркспейса', () => {
	const root = readManifest('')
	const packages = collectWorkspacePackages(root)
	const config = readChangesetConfig()
	const library = selectLibrary(packages, config)

	it('библиотечные пакеты заполнены', () => {
		const violations = library.flatMap(checkLibraryPackage)

		expect(
			library.length,
			'из workspaces не раскрылось ни одного библиотечного пакета',
		).toBeGreaterThan(0)
		expect(
			violations,
			'Манифесты разошлись с разделом AGENTS.md «Версии пакетов»:\n' + violations.join('\n'),
		).toEqual([])
	})

	it('у библиотечного пакета рядом README, копия корневой лицензии и тексты чужих', () => {
		const license = readFileSync(join(ROOT, 'LICENSE'), 'utf-8')
		const violations = library.flatMap(({ dir, manifest }) => {
			// An expression of another shape fails «библиотечные пакеты заполнены»
			const others = thirdPartyLicenses(manifest.license) ?? []

			return checkShippedFiles(readShippedFiles(dir, others), license, others).map(
				(violation) => `${dir}: ${violation}`,
			)
		})

		expect(
			violations,
			'Состав тарболла разошёлся с разделом AGENTS.md «Версии пакетов»:\n' +
				violations.join('\n'),
		).toEqual([])
	})

	it('сосед объявлен точной версией, библиотека у тем и иконок — диапазоном', () => {
		const violations = checkInternalRanges(library)

		expect(
			violations,
			'Диапазоны на соседей разошлись с разделом AGENTS.md «Версии пакетов»:\n' +
				violations.join('\n'),
		).toEqual([])
	})

	it('группа fixed идёт одной версией, у корня версии нет', () => {
		const violations = checkVersions(root, library)

		expect(
			violations,
			'Версии разошлись с разделом AGENTS.md «Версии пакетов»:\n' + violations.join('\n'),
		).toEqual([])
	})

	it('группа fixed — библиотечные пакеты без тем и иконок', () => {
		const violations = checkFixed(config, library)

		expect(
			library.filter(hasOwnVersion).length,
			'ни одной темы и ни одного пакета иконок — каталоги OWN_VERSION_DIRS устарели',
		).toBeGreaterThan(0)
		expect(
			violations,
			'.changeset/config.json разошёлся с воркспейсом:\n' + violations.join('\n'),
		).toEqual([])
	})

	it('корневой build собирает все собираемые пакеты и в порядке зависимостей', () => {
		const violations = checkBuildOrder(root, library)

		expect(
			violations,
			'Корневой build разошёлся с разделом AGENTS.md «Сборка пакетов»:\n' +
				violations.join('\n'),
		).toEqual([])
	})

	it('каждое имя из ignore — пакет воркспейса', () => {
		const violations = checkIgnore(config, packages)

		expect(
			violations,
			'Исключение стенда без пакета — уберите имя из ignore:\n' + violations.join('\n'),
		).toEqual([])
	})

	it('changeset не объявляет major, пока версия 0.x', async () => {
		const violations = checkChangesets(await readChangesets(ROOT), library)

		expect(
			violations,
			'Changeset разошёлся с разделом AGENTS.md «Версии пакетов»:\n' + violations.join('\n'),
		).toEqual([])
	})

	it('суффиксы версий соответствуют разрешённому beta-каналу', () => {
		const plan: { packages: { name: string; version: string }[] } = JSON.parse(
			readFileSync(join(ROOT, '.release/plan.json'), 'utf8'),
		)
		const approved = new Map(plan.packages.map((pkg) => [pkg.name, pkg.version]))
		const violations = checkPrerelease(readPreState(), library, approved)

		expect(
			violations,
			'Версии разошлись с разделом AGENTS.md «Версии пакетов»:\n' + violations.join('\n'),
		).toEqual([])
	})
})

describe('сторож манифестов', () => {
	const VERSION = '1.2.0'

	const library = (overrides: TManifest): TWorkspacePackage => ({
		dir: 'packages/example',
		manifest: {
			name: '@soxa-ui/example',
			version: VERSION,
			description: 'Пакет для проверки сторожа',
			license: 'MIT',
			repository: { type: 'git', directory: 'packages/example' },
			publishConfig: { access: 'public' },
			files: ['dist'],
			...overrides,
		},
	})

	const other = (version: string): TWorkspacePackage => ({
		dir: 'packages/other',
		manifest: {
			...library({}).manifest,
			name: '@soxa-ui/other',
			version,
			repository: { type: 'git', directory: 'packages/other' },
		},
	})

	/** A theme: a version of its own, unlike the `fixed` group of the fixtures. */
	const theme = (overrides: TManifest = {}): TWorkspacePackage => ({
		dir: 'packages/themes/example',
		manifest: {
			...library({}).manifest,
			name: '@soxa-ui/theme-example',
			version: '0.4.0',
			repository: { type: 'git', directory: 'packages/themes/example' },
			...overrides,
		},
	})

	const playground: TWorkspacePackage = {
		dir: 'packages/playground/vue',
		manifest: { name: '@soxa-ui/playground-vue', version: '0.0.0' },
	}

	const config = (overrides: Partial<TChangesetConfig>): TChangesetConfig => ({
		fixed: [['@soxa-ui/example', '@soxa-ui/other']],
		ignore: ['@soxa-ui/playground-vue'],
		...overrides,
	})

	const changeset = (type: string): TChangeset => ({
		id: 'brave-dogs-sing',
		releases: [{ name: '@soxa-ui/example', type }],
	})

	it('заполненный пакет — без нарушений', () => {
		expect(checkLibraryPackage(library({}))).toEqual([])
	})

	it('пакет без description — нарушение', () => {
		const expected = ['packages/example: пустой description']

		expect(checkLibraryPackage(library({ description: undefined }))).toEqual(expected)
		expect(checkLibraryPackage(library({ description: '  ' }))).toEqual(expected)
	})

	it('private у библиотечного пакета — нарушение', () => {
		expect(checkLibraryPackage(library({ private: true }))).toEqual([
			'packages/example: private true — библиотечный пакет выкладывается',
		])
	})

	it('доступ скоупа не public — нарушение', () => {
		const restricted = 'publishConfig.access "restricted", ожидается "public"'
		const missing = 'publishConfig.access undefined, ожидается "public"'
		const why = ' — у скоупа доступ по умолчанию restricted'

		expect(checkLibraryPackage(library({ publishConfig: { access: 'restricted' } }))).toEqual([
			`packages/example: ${restricted}${why}`,
		])
		expect(checkLibraryPackage(library({ publishConfig: undefined }))).toEqual([
			`packages/example: ${missing}${why}`,
		])
	})

	it('пакет без files — нарушение', () => {
		const expected = (declared: string): string[] => [
			`packages/example: files ${declared}, ожидается непустой список путей тарболла`,
		]

		expect(checkLibraryPackage(library({ files: undefined }))).toEqual(expected('undefined'))
		expect(checkLibraryPackage(library({ files: [] }))).toEqual(expected('[]'))
		expect(checkLibraryPackage(library({ files: 'dist' }))).toEqual(expected('"dist"'))
	})

	it('цель точки входа без файла — нарушение с путём', () => {
		const entries = {
			main: './index.ts',
			exports: {
				'.': './index.ts',
				'./contributions': { default: './contributions/index.ts' },
			},
		}

		expect(checkLibraryPackage(library(entries))).toEqual([
			'packages/example: main "./index.ts" — нет такого файла',
			'packages/example: exports["."] "./index.ts" — нет такого файла',
			'packages/example: exports["./contributions"]["default"] "./contributions/index.ts" — нет такого файла',
		])
	})

	// `dist/` is in the root .gitignore: a clean clone has no build
	it('цель в выходе сборки — без нарушений со скриптом build, без него — нарушение', () => {
		const entries = {
			style: './dist/index.css',
			exports: { '.': { default: './dist/index.css' } },
		}
		const notBuilt = '— выход сборки (игнорируется git), а скрипта build у пакета нет'

		expect(
			checkLibraryPackage(library({ ...entries, scripts: { build: 'vite build' } })),
		).toEqual([])
		expect(checkLibraryPackage(library(entries))).toEqual([
			`packages/example: style "./dist/index.css" ${notBuilt}`,
			`packages/example: exports["."]["default"] "./dist/index.css" ${notBuilt}`,
		])
	})

	it('цель не путь и не объект условий — сторож падает, а не пропускает её', () => {
		expect(() => checkLibraryPackage(library({ exports: { '.': ['./index.ts'] } }))).toThrow(
			'packages/example: exports["."] ["./index.ts"] — сторож понимает только путь и объект условий',
		)
	})

	it('repository.directory не совпадает с путём пакета — нарушение', () => {
		const wrong = library({ repository: { type: 'git', directory: 'packages/other' } })

		expect(checkLibraryPackage(wrong)).toEqual([
			'packages/example: repository.directory "packages/other", ожидается путь пакета "packages/example"',
		])
		expect(checkLibraryPackage(library({ repository: undefined }))).toEqual([
			'packages/example: repository.directory undefined, ожидается путь пакета "packages/example"',
		])
	})

	describe('лицензия: своя — MIT, чужие — через AND', () => {
		const invalid = (declared: string): string[] => [
			`packages/example: license ${declared}, ожидается "MIT" или "MIT AND <SPDX-id>…"`,
		]

		/** Ships content under Apache-2.0: the license is named, its text is in `files`. */
		const apache = { license: 'MIT AND Apache-2.0', files: ['dist', 'LICENSE-Apache-2.0'] }

		it('лицензия не MIT — нарушение', () => {
			expect(checkLibraryPackage(library({ license: 'ISC' }))).toEqual(invalid('"ISC"'))
			expect(checkLibraryPackage(library({ license: undefined }))).toEqual(
				invalid('undefined'),
			)
		})

		it('чужая лицензия через AND и её текст в files — без нарушений', () => {
			const two = {
				license: 'MIT AND Apache-2.0 AND OFL-1.1',
				files: [...apache.files, 'LICENSE-OFL-1.1'],
			}

			expect(checkLibraryPackage(library(apache))).toEqual([])
			expect(checkLibraryPackage(library(two))).toEqual([])
		})

		// The own license first and once, third-party ones one by one: the guard
		// does not parse OR, WITH and parentheses
		it('выражение другой формы — нарушение', () => {
			const expressions = [
				'Apache-2.0 AND MIT',
				'MIT OR Apache-2.0',
				'MIT AND (Apache-2.0 OR ISC)',
				'MIT AND Apache-2.0 WITH LLVM-exception',
				'MIT AND MIT',
				'MIT AND Apache-2.0 AND Apache-2.0',
				'MIT AND ',
			]

			for (const license of expressions) {
				expect(checkLibraryPackage(library({ ...apache, license })), license).toEqual(
					invalid(JSON.stringify(license)),
				)
			}
		})

		// npm puts `LICENSE` into the tarball by itself, the other texts only by files
		it('текста чужой лицензии нет в files — нарушение', () => {
			expect(checkLibraryPackage(library({ ...apache, files: ['dist'] }))).toEqual([
				'packages/example: files без "LICENSE-Apache-2.0" — лицензия названа, а её текст в тарболл не уедет',
			])
		})

		it('текст в files без лицензии в license — нарушение', () => {
			expect(checkLibraryPackage(library({ files: apache.files }))).toEqual([
				'packages/example: files: "LICENSE-Apache-2.0" — текст лицензии, которой нет в license',
			])
		})
	})

	describe('README и LICENSE рядом с манифестом', () => {
		const LICENSE = 'MIT License\n\nCopyright (c) 2026 Yuri Soldatov\n'

		it('оба файла на месте, лицензия — копия корневой — без нарушений', () => {
			const files = { 'README.md': '# @soxa-ui/example\n', LICENSE }

			expect(checkShippedFiles(files, LICENSE)).toEqual([])
		})

		it('нет файлов — нарушение на каждый', () => {
			expect(checkShippedFiles({}, LICENSE)).toEqual([
				'нет README.md — его читают на npm вместо описания',
				'нет LICENSE — в тарболле у пакета нет текста лицензии',
			])
		})

		it('пустой README — нарушение', () => {
			expect(checkShippedFiles({ 'README.md': ' \n', LICENSE }, LICENSE)).toEqual([
				'README.md пуст',
			])
		})

		it('лицензия расходится с корневой — нарушение', () => {
			const files = { 'README.md': '# @soxa-ui/example\n', LICENSE: 'ISC License\n' }

			expect(checkShippedFiles(files, LICENSE)).toEqual([
				'LICENSE расходится с корневым — это его копия, а не своя лицензия',
			])
		})

		// git normalizes line breaks (.gitattributes), and in a Windows working
		// copy neighbouring files differ in them on their own
		it('та же лицензия с другим переводом строки — без нарушений', () => {
			const files = { 'README.md': '# @soxa-ui/example\n', LICENSE }

			expect(checkShippedFiles(files, LICENSE.replace(/\n/g, '\r\n'))).toEqual([])
		})

		describe('текст чужой лицензии', () => {
			const others = ['Apache-2.0']
			const files = { 'README.md': '# @soxa-ui/example\n', LICENSE }

			it('лежит рядом — без нарушений', () => {
				const apache = { ...files, 'LICENSE-Apache-2.0': 'Apache License\nVersion 2.0\n' }

				expect(checkShippedFiles(apache, LICENSE, others)).toEqual([])
			})

			it('нет или пуст — нарушение', () => {
				const blank = { ...files, 'LICENSE-Apache-2.0': ' \n' }

				expect(checkShippedFiles(files, LICENSE, others)).toEqual([
					'нет LICENSE-Apache-2.0 — license называет Apache-2.0, а её текста у пакета нет',
				])
				expect(checkShippedFiles(blank, LICENSE, others)).toEqual([
					'LICENSE-Apache-2.0 пуст',
				])
			})
		})

		// The reader goes to disk: the guard's own package has README and LICENSE
		it('файлы пакета читаются с диска', () => {
			const files = readShippedFiles('packages/setup')
			const root = readFileSync(join(ROOT, 'LICENSE'), 'utf-8')

			expect(files['README.md']).toContain('@soxa-ui/setup')
			expect(checkShippedFiles(files, root)).toEqual([])
			expect(readShippedFiles('packages/example', ['Apache-2.0'])).toEqual({
				'README.md': undefined,
				LICENSE: undefined,
				'LICENSE-Apache-2.0': undefined,
			})
		})
	})

	describe('диапазоны на соседей', () => {
		/** Depends on `@soxa-ui/example` — in the given field, by the given range. */
		const dependent = (field: string, range: unknown): TWorkspacePackage => ({
			dir: 'packages/other',
			manifest: {
				...other(VERSION).manifest,
				[field]: { '@soxa-ui/example': range, vue: '^3.5.32' },
			},
		})

		it('точная общая версия — без нарушений', () => {
			for (const field of DEPENDENCY_FIELDS) {
				expect(
					checkInternalRanges([library({}), dependent(field, VERSION)]),
					field,
				).toEqual([])
			}
		})

		it('"*" на соседе — нарушение: выпуск такой диапазон не переписывает', () => {
			expect(checkInternalRanges([library({}), dependent('dependencies', '*')])).toEqual([
				'packages/other: dependencies["@soxa-ui/example"] "*", ожидается "1.2.0"',
			])
		})

		it('протокол workspace — нарушение: npm его не понимает', () => {
			expect(
				checkInternalRanges([library({}), dependent('peerDependencies', 'workspace:^')]),
			).toEqual([
				'packages/other: peerDependencies["@soxa-ui/example"] "workspace:^", ожидается "1.2.0"',
			])
		})

		it('диапазон от общей версии — нарушение: пускает соседа другого выпуска', () => {
			expect(
				checkInternalRanges([library({}), dependent('dependencies', `^${VERSION}`)]),
			).toEqual([
				'packages/other: dependencies["@soxa-ui/example"] "^1.2.0", ожидается "1.2.0"',
			])
		})

		it('версия отстала от версии соседа — нарушение', () => {
			expect(
				checkInternalRanges([library({}), dependent('devDependencies', '1.1.0')]),
			).toEqual([
				'packages/other: devDependencies["@soxa-ui/example"] "1.1.0", ожидается "1.2.0"',
			])
		})

		describe('тема и иконки — библиотеку диапазоном', () => {
			/** A theme depending on `@soxa-ui/example` of the group by the given range. */
			const dependentTheme = (field: string, range: unknown): TWorkspacePackage =>
				theme({ [field]: { '@soxa-ui/example': range, vue: '^3.5.32' } })

			const caretExpected = (dir: string, field: string, range: string): string =>
				`${dir}: ${field}["@soxa-ui/example"] ${JSON.stringify(range)}, ожидается диапазон "^<версия>" — тема и иконки зависят от библиотеки диапазоном`

			it('^ от версии — без нарушений, и версия диапазона не обязана быть текущей', () => {
				for (const field of DEPENDENCY_FIELDS) {
					for (const range of [`^${VERSION}`, '^1.0.0', '^1.2.0-alpha.7']) {
						expect(
							checkInternalRanges([library({}), dependentTheme(field, range)]),
							`${field} ${range}`,
						).toEqual([])
					}
				}
			})

			it('точная версия, другой вид диапазона или протокол — нарушение', () => {
				for (const range of [
					VERSION,
					`~${VERSION}`,
					`>=${VERSION}`,
					'*',
					'workspace:^',
					'^1.2',
				]) {
					expect(
						checkInternalRanges([
							library({}),
							dependentTheme('peerDependencies', range),
						]),
						range,
					).toEqual([caretExpected('packages/themes/example', 'peerDependencies', range)])
				}
			})

			it('пакет иконок — так же', () => {
				const icons = {
					...dependentTheme('dependencies', VERSION),
					dir: 'packages/icons/example',
				}

				expect(checkInternalRanges([library({}), icons])).toEqual([
					caretExpected('packages/icons/example', 'dependencies', VERSION),
				])
			})

			// The theme builds the CSS of its base into its own stylesheet
			it('тема объявляет свою базу точной версией', () => {
				const derived = (range: string): TWorkspacePackage => ({
					dir: 'packages/themes/derived',
					manifest: {
						...theme().manifest,
						name: '@soxa-ui/theme-derived',
						repository: { type: 'git', directory: 'packages/themes/derived' },
						dependencies: { '@soxa-ui/theme-example': range },
					},
				})

				expect(checkInternalRanges([theme(), derived('0.4.0')])).toEqual([])
				expect(checkInternalRanges([theme(), derived('^0.4.0')])).toEqual([
					'packages/themes/derived: dependencies["@soxa-ui/theme-example"] "^0.4.0", ожидается "0.4.0"',
				])
			})

			// The adapters test against the theme of the workspace
			it('пакет группы объявляет тему точной версией', () => {
				const adapter = (range: string): TWorkspacePackage =>
					library({ devDependencies: { '@soxa-ui/theme-example': range } })

				expect(checkInternalRanges([adapter('0.4.0'), theme()])).toEqual([])
				expect(checkInternalRanges([adapter('^0.4.0'), theme()])).toEqual([
					'packages/example: devDependencies["@soxa-ui/theme-example"] "^0.4.0", ожидается "0.4.0"',
				])
			})
		})
	})

	it('пакет без version — нарушение', () => {
		expect(checkLibraryPackage(library({ version: undefined }))).toEqual([
			'packages/example: version undefined, ожидается строка версии',
		])
	})

	it('одна версия и корень без version — без нарушений', () => {
		expect(checkVersions({ name: 'soxa' }, [library({}), other(VERSION)])).toEqual([])
	})

	it('версии пакетов группы fixed разошлись — нарушение с их списком', () => {
		expect(checkVersions({ name: 'soxa' }, [library({}), other('1.3.0')])).toEqual([
			'версии пакетов группы fixed разошлись: "1.2.0" — packages/example; "1.3.0" — packages/other',
		])
	})

	it('тема своей версией — без нарушений', () => {
		expect(checkVersions({ name: 'soxa' }, [library({}), other(VERSION), theme()])).toEqual([])
	})

	it('version у корня — нарушение', () => {
		expect(checkVersions({ name: 'soxa', version: VERSION }, [library({})])).toEqual([
			'корневой package.json: version "1.2.0" — версия у пакетов, у корня её нет',
		])
	})

	describe('порядок корневого build', () => {
		/** Ships a build: git ignores `dist/`, and a clean clone has none. */
		const built = (overrides: TManifest = {}): TWorkspacePackage =>
			library({
				main: './dist/index.js',
				scripts: { build: 'vite build' },
				...overrides,
			})

		/** Depends on `@soxa-ui/example`, so it is built after it. */
		const dependent: TWorkspacePackage = {
			dir: 'packages/other',
			manifest: {
				...built().manifest,
				name: '@soxa-ui/other',
				repository: { type: 'git', directory: 'packages/other' },
				dependencies: { '@soxa-ui/example': '*' },
			},
		}

		const script = (...names: string[]): TManifest => ({
			name: 'soxa',
			scripts: {
				build: names.map((name) => `npm run build --workspace=${name}`).join(' && '),
			},
		})

		it('зависимость впереди зависящего — без нарушений', () => {
			const root = script('@soxa-ui/example', '@soxa-ui/other')

			expect(checkBuildOrder(root, [built(), dependent])).toEqual([])
		})

		it('зависимость позади зависящего — нарушение', () => {
			const root = script('@soxa-ui/other', '@soxa-ui/example')

			expect(checkBuildOrder(root, [built(), dependent])).toEqual([
				'build: "@soxa-ui/other" собирается раньше "@soxa-ui/example", от которого зависит',
			])
		})

		it('пакет со сборкой наружу вне корневого build — нарушение', () => {
			const root = script('@soxa-ui/example')

			expect(checkBuildOrder(root, [built(), dependent])).toEqual([
				'build: нет "@soxa-ui/other" (packages/other) — пакет отдаёт наружу сборку, а корневой build её не делает',
			])
		})

		// A `build` script on a package whose entry points lead to sources — the
		// Vue adapter before task 02: there is a build, but sources go out
		it('пакет со скриптом build, отдающий исходники, — без нарушений', () => {
			const sources = built({ main: './src/index.ts' })

			expect(checkBuildOrder(script('@soxa-ui/example'), [built(), sources])).toEqual([])
		})

		// A package without a `build` script has nothing to build with: its name in
		// the root build would fail it
		it('пакет без скрипта build в корневом build — нарушение', () => {
			const root = script('@soxa-ui/example', '@soxa-ui/other')

			expect(checkBuildOrder(root, [built()])).toEqual([
				'build: "@soxa-ui/other" — не библиотечный пакет со скриптом build',
			])
		})

		it('корень без скрипта build — сторож падает, а не молчит', () => {
			expect(() => checkBuildOrder({ name: 'soxa' }, [built()])).toThrow(
				'В корневом package.json нет скрипта build',
			)
		})
	})

	it('стенд из ignore — не библиотечный пакет', () => {
		const packages = [library({}), other(VERSION), playground]

		expect(selectLibrary(packages, config({}))).toEqual([library({}), other(VERSION)])
		expect(selectLibrary(packages, config({ ignore: [] }))).toContainEqual(playground)
	})

	it('fixed из библиотечных пакетов — без нарушений', () => {
		expect(checkFixed(config({}), [library({}), other(VERSION)])).toEqual([])
	})

	it('пакет вне fixed — нарушение', () => {
		expect(
			checkFixed(config({ fixed: [['@soxa-ui/example']] }), [library({}), other(VERSION)]),
		).toEqual(['fixed: нет "@soxa-ui/other" (packages/other) — пакет вне общей версии'])
	})

	it('тема вне fixed — без нарушений', () => {
		expect(checkFixed(config({}), [library({}), other(VERSION), theme()])).toEqual([])
	})

	it('тема или иконки в fixed — нарушение', () => {
		const icons = {
			...theme({ name: '@soxa-ui/icons-example' }),
			dir: 'packages/icons/example',
		}
		const fixed = [
			[
				'@soxa-ui/example',
				'@soxa-ui/other',
				'@soxa-ui/theme-example',
				'@soxa-ui/icons-example',
			],
		]

		expect(
			checkFixed(config({ fixed }), [library({}), other(VERSION), theme(), icons]),
		).toEqual([
			'fixed: "@soxa-ui/theme-example" (packages/themes/example) — у тем и иконок своя версия, в группе их нет',
			'fixed: "@soxa-ui/icons-example" (packages/icons/example) — у тем и иконок своя версия, в группе их нет',
		])
	})

	it('стенд в fixed — нарушение', () => {
		const fixed = [['@soxa-ui/example', '@soxa-ui/other', '@soxa-ui/playground-vue']]

		expect(checkFixed(config({ fixed }), [library({}), other(VERSION)])).toEqual([
			'fixed: "@soxa-ui/playground-vue" — не библиотечный пакет',
		])
	})

	it('fixed из двух групп — нарушение', () => {
		const fixed = [['@soxa-ui/example'], ['@soxa-ui/other']]

		expect(checkFixed(config({ fixed }), [library({}), other(VERSION)])).toEqual([
			'fixed: групп 2, ожидается одна',
		])
	})

	it('имя из ignore без пакета — нарушение', () => {
		const ignore = ['@soxa-ui/playground-vue', '@soxa-ui/playground-react']

		expect(checkIgnore(config({ ignore }), [library({}), playground])).toEqual([
			'ignore: "@soxa-ui/playground-react" — нет такого пакета в воркспейсе',
		])
	})

	it('major при версии 0.x — нарушение', () => {
		expect(checkChangesets([changeset('major')], [library({ version: '0.3.0' })])).toEqual([
			'.changeset/brave-dogs-sing.md: major у "@soxa-ui/example" при версии 0.3.0 — до 1.0 ломающее изменение поднимает minor',
		])
	})

	it('minor при версии 0.x и major при 1.x — без нарушений', () => {
		expect(checkChangesets([changeset('minor')], [library({ version: '0.3.0' })])).toEqual([])
		expect(checkChangesets([changeset('major')], [library({})])).toEqual([])
	})

	it('неразрешённый pre-канал — нарушение', () => {
		expect(
			checkPrerelease({ mode: 'pre', tag: 'alpha' }, [library({ version: '0.3.0-alpha.7' })]),
		).toEqual(['.changeset/pre.json: разрешён только pre-канал beta'])
	})

	it('beta соответствует активному каналу', () => {
		const beta = { mode: 'pre', tag: 'beta' }
		expect(checkPrerelease(beta, [library({ version: '0.3.0-beta.0' })])).toEqual([])
		expect(
			checkPrerelease(beta, [
				library({ version: '0.3.0-beta.1' }),
				library({ version: '0.2.0' }),
			]),
		).toEqual([])
	})

	it('суффикс другого канала или без счётчика — нарушение', () => {
		const beta = { mode: 'pre', tag: 'beta' }
		for (const version of ['0.3.0-alpha.7', '0.3.0-beta', '0.3.0-beta.x']) {
			expect(checkPrerelease(beta, [library({ version })])).toEqual([
				`packages/example: версия ${version} с суффиксом требует активного pre-канала beta`,
			])
		}
	})

	it('accepts only exact beta versions from the approved package plan', () => {
		const approved = new Map([['@soxa-ui/example', '0.4.0-beta.0']])
		expect(
			checkPrerelease(undefined, [library({ version: '0.4.0-beta.0' })], approved),
		).toEqual([])
		expect(
			checkPrerelease(undefined, [library({ version: '0.4.0-beta.1' })], approved),
		).toHaveLength(1)
		expect(
			checkPrerelease(undefined, [library({ version: '0.4.0-alpha.0' })], approved),
		).toHaveLength(1)
	})

	it('суффикс без pre.json — нарушение', () => {
		expect(checkPrerelease(undefined, [library({ version: '0.3.0-beta.0' })])).toEqual([
			'packages/example: версия 0.3.0-beta.0 с суффиксом требует активного pre-канала beta',
		])
	})

	// The next `changeset version` drops the suffix together with pre.json
	it('выход из pre-режима с суффиксом — без нарушений', () => {
		const exit = { mode: 'exit', tag: 'alpha' }

		expect(checkPrerelease(exit, [library({ version: '0.3.0-alpha.7' })])).toEqual([])
		expect(checkPrerelease(exit, [library({ version: '0.3.0' })])).toEqual([])
	})

	it('0.x без суффикса и версия 1.x — без нарушений', () => {
		expect(checkPrerelease(undefined, [library({ version: '0.3.0' })])).toEqual([])
		expect(checkPrerelease(undefined, [library({})])).toEqual([])
	})
})
