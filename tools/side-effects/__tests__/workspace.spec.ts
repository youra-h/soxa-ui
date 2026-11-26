import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join, posix, relative, resolve } from 'node:path'
import { build } from 'esbuild'
import type { Metafile, Plugin } from 'esbuild'
import { parse } from '@vue/compiler-sfc'
import { compile } from 'svelte/compiler'
import { subpathSources } from '../../vite/lib.config'
import { findModuleEffects, keepsForEffect } from '../side-effects'

/**
 * Guard of `sideEffects` in the manifests of the library packages
 * (docs/agents/build.md, «Сборка пакетов»): every package declares it, the
 * modules of a package declared free of side effects really are, and the
 * declaration does what it promises in a real bundler — an application with
 * one button gets neither Table nor Calendar, and a bare import of a package
 * with effects keeps every module that has them. Web Components defines its
 * elements on import, so one button there is the entry of the element: the
 * package has one for each element its modules define, and each entry brings
 * the polyfill of built-ins before the first class of an element.
 *
 * A stylesheet is checked against the patterns only: webpack drops the one
 * `sideEffects` does not cover, while esbuild and Vite keep CSS whatever the
 * manifest says, and a bundle here would pass for nothing.
 *
 * Code is read from sources, not from `dist`: the test jobs of CI build
 * nothing. The packages and their locations come from npm itself
 * (`npm query .workspace`), as in `tools/published-imports`; a package that
 * stays out of npm (`private`) is the stand.
 */

const ROOT = resolve(__dirname, '../../..')

type TManifest = Readonly<Record<string, unknown>>

type TLibraryPackage = {
	readonly name: string
	/** From the repository root, through `/`. */
	readonly dir: string
	readonly manifest: TManifest
}

function isObject(value: unknown): value is TManifest {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Through the shell: on Windows npm is `npm.cmd`, which Node does not start without one. */
function workspaces(): unknown {
	return JSON.parse(
		execSync('npm query .workspace', {
			cwd: ROOT,
			encoding: 'utf-8',
			maxBuffer: 64 * 1024 * 1024,
			stdio: ['ignore', 'pipe', 'pipe'],
		}),
	)
}

function readLibrary(): TLibraryPackage[] {
	const listed = workspaces()

	if (!Array.isArray(listed)) {
		throw new Error('npm query .workspace: expected an array of workspaces')
	}

	return listed.flatMap((entry: unknown): TLibraryPackage[] => {
		if (
			!isObject(entry) ||
			typeof entry.name !== 'string' ||
			typeof entry.location !== 'string'
		) {
			throw new Error('npm query .workspace: a workspace without a name or a location')
		}

		const dir = entry.location.split('\\').join('/')
		const manifest: unknown = JSON.parse(readFileSync(join(ROOT, dir, 'package.json'), 'utf-8'))

		if (!isObject(manifest)) {
			throw new Error(`${dir}/package.json: expected a JSON object`)
		}

		return manifest.private === true ? [] : [{ name: entry.name, dir, manifest }]
	})
}

/** The adapter of Web Components, from the repository root. */
const WEBC = 'packages/ui/webc'

/**
 * The source of every JS entry point of a library package — the entry of its
 * build. A new entry point fails the first test below until it is listed here.
 * The entries of the Web Components elements come by the rule of its build:
 * a target in `dist` is built from the same path in `src`.
 */
const SOURCES: Readonly<Record<string, string>> = {
	'@soxa-ui/core': 'packages/core/src/index.ts',
	'@soxa-ui/plugins': 'packages/plugins/src/index.ts',
	'@soxa-ui/setup': 'packages/setup/index.ts',
	'@soxa-ui/icons-material': 'packages/icons/material/src/index.ts',
	'@soxa-ui/icons-lucide': 'packages/icons/lucide/src/index.ts',
	'@soxa-ui/theme-base/setup': 'packages/themes/base/setup/index.ts',
	'@soxa-ui/theme-burg/setup': 'packages/themes/burg/setup/index.ts',
	'@soxa-ui/theme-oren/setup': 'packages/themes/oren/setup/index.ts',
	'@soxa-ui/vue': 'packages/ui/vue/src/index.ts',
	'@soxa-ui/react': 'packages/ui/react/src/index.ts',
	'@soxa-ui/solid': 'packages/ui/solid/src/index.ts',
	'@soxa-ui/svelte': 'packages/ui/svelte/src/index.ts',
	'@soxa-ui/angular': 'packages/ui/angular/src/index.ts',
	'@soxa-ui/webc': `${WEBC}/src/index.ts`,
	...Object.fromEntries(
		Object.entries(
			subpathSources({
				name: '@soxa-ui/webc',
				root: join(ROOT, WEBC),
				entry: 'src/index.ts',
			}),
		).map(([path, source]) => [path, normalize(relative(ROOT, source))]),
	),
}

/** An application takes a button by name from the root of a framework adapter. */
function named(path: string, name: string): string {
	return `import { ${name} } from '${path}'\nconsole.log(${name})`
}

/**
 * How an application takes one button from each adapter: by name from a
 * framework adapter, by the entry of the element from Web Components — the
 * root of that package defines every element.
 */
const BUTTONS: Readonly<Record<string, string>> = {
	'@soxa-ui/vue': named('@soxa-ui/vue', 'Button'),
	'@soxa-ui/react': named('@soxa-ui/react', 'Button'),
	'@soxa-ui/solid': named('@soxa-ui/solid', 'Button'),
	'@soxa-ui/svelte': named('@soxa-ui/svelte', 'Button'),
	'@soxa-ui/angular': named('@soxa-ui/angular', 'TButtonComponent'),
	'@soxa-ui/webc/button': "import '@soxa-ui/webc/button'",
}

/** Every string target of an `exports` value, however deep the conditions go. */
function targetsOf(value: unknown): string[] {
	if (typeof value === 'string') return [value]
	if (isObject(value)) return Object.values(value).flatMap(targetsOf)

	return []
}

/** Entry points of a package: import path → its targets. Without `exports` — `main` and `style`. */
function entryPoints({ name, manifest }: TLibraryPackage): Map<string, string[]> {
	const { exports, main, style } = manifest

	if (!isObject(exports)) {
		return new Map([[name, [main, style].filter((target) => typeof target === 'string')]])
	}

	return new Map(
		Object.entries(exports).map(([subpath, value]): [string, string[]] => {
			if (!subpath.startsWith('.')) {
				throw new Error(`${name}: exports without subpaths — the guard reads only subpaths`)
			}

			return [posix.join(name, subpath), targetsOf(value)]
		}),
	)
}

/** Import paths of the package that lead to code. */
function scriptEntries(pkg: TLibraryPackage): string[] {
	return [...entryPoints(pkg)]
		.filter(([, targets]) => targets.some((target) => /\.m?js$/.test(target)))
		.map(([path]) => path)
}

/** Import paths of the package that lead to a stylesheet. */
function styleEntries(pkg: TLibraryPackage): Array<[string, string]> {
	return [...entryPoints(pkg)].flatMap(([path, targets]) =>
		targets
			.filter((target) => target.endsWith('.css'))
			.map((target): [string, string] => [path, target]),
	)
}

/**
 * Components as the application's bundler gets them from its framework
 * plugin: Svelte compiled, of Vue its script — the template only renders what
 * the script imports.
 */
const components: Plugin = {
	name: 'components',
	setup(bundler) {
		bundler.onLoad({ filter: /\.vue$/ }, ({ path }) => ({
			contents:
				parse(readFileSync(path, 'utf-8')).descriptor.script?.content ??
				'export default {}',
			loader: 'ts',
		}))
		bundler.onLoad({ filter: /\.svelte$/ }, ({ path }) => ({
			contents: compile(readFileSync(path, 'utf-8'), { filename: path, generate: 'client' })
				.js.code,
			loader: 'js',
		}))
	},
}

/**
 * Bundles an application entry the way the application's bundler does,
 * `sideEffects` included. Import paths listed in `sources` lead to sources,
 * every other package stays external.
 */
async function bundle(contents: string, sources: readonly string[]): Promise<Metafile> {
	const { metafile } = await build({
		stdin: { contents, resolveDir: ROOT, loader: 'ts' },
		absWorkingDir: ROOT,
		bundle: true,
		format: 'esm',
		write: false,
		metafile: true,
		logLevel: 'silent',
		packages: 'external',
		jsx: 'preserve',
		alias: Object.fromEntries(sources.map((path) => [path, join(ROOT, SOURCES[path] ?? path)])),
		plugins: [components],
	})

	return metafile
}

function normalize(file: string): string {
	return file.split('\\').join('/')
}

/** Modules the bundler read, under `dir`. */
function modulesRead(metafile: Metafile, dir: string): string[] {
	return Object.keys(metafile.inputs)
		.map(normalize)
		.filter((file) => file.startsWith(`${dir}/`) && /\.([cm]?[jt]sx?|vue|svelte)$/.test(file))
}

/** Modules left in the bundle. */
function modulesKept(metafile: Metafile): string[] {
	return Object.values(metafile.outputs).flatMap((output) =>
		Object.entries(output.inputs)
			.filter(([, input]) => input.bytesInOutput > 0)
			.map(([file]) => normalize(file)),
	)
}

/** Effects of the modules, `file:line statement`. */
function effectsOf(files: readonly string[]): string[] {
	return files.flatMap((file) =>
		findModuleEffects(file, readFileSync(join(ROOT, file), 'utf-8')).map(
			({ line, text }) => `${file}:${line} ${text}`,
		),
	)
}

const library = readLibrary()
const declaredFree = library.filter(({ manifest }) => manifest.sideEffects !== true)
const declaredWithEffects = library.filter(({ manifest }) => manifest.sideEffects === true)

/** Every module of the package's code, read through all its entry points. */
async function packageModules(
	pkg: TLibraryPackage,
): Promise<{ metafile: Metafile; files: string[] }> {
	const entries = scriptEntries(pkg)
	const metafile = await bundle(
		entries
			.map(
				(path, index) =>
					`import * as entry${index} from '${path}'\nconsole.log(entry${index})`,
			)
			.join('\n'),
		entries,
	)

	return { metafile, files: modulesRead(metafile, pkg.dir) }
}

describe('sideEffects библиотечных пакетов', () => {
	it('у каждого входа с кодом есть исходник в SOURCES, и лишних нет', () => {
		expect(Object.keys(SOURCES).sort()).toEqual(library.flatMap(scriptEntries).sort())
	})

	it.each(library.map((pkg) => [pkg.name, pkg] as const))(
		'%s объявляет sideEffects, и CSS его входов не выбрасывается',
		(_name, pkg) => {
			const { sideEffects } = pkg.manifest
			const declared =
				typeof sideEffects === 'boolean' ||
				(Array.isArray(sideEffects) &&
					sideEffects.length > 0 &&
					sideEffects.every((pattern) => typeof pattern === 'string'))

			expect(declared, `sideEffects ${JSON.stringify(sideEffects)}`).toBe(true)
			expect(
				styleEntries(pkg)
					.filter(([, target]) => !keepsForEffect(sideEffects, target))
					.map(([path, target]) => `${path} → ${target}`),
			).toEqual([])
		},
	)

	it.each(
		declaredFree
			.filter((pkg) => scriptEntries(pkg).length > 0)
			.map((pkg) => [pkg.name, pkg] as const),
	)('%s: модули ничего не делают при импорте', async (_name, pkg) => {
		const { files } = await packageModules(pkg)

		// Not idle: the package's code was read
		expect(files.length).toBeGreaterThan(0)
		expect(effectsOf(files)).toEqual([])
	})

	// A package that registers on import (`true`): a bare import keeps every
	// module with an effect, and the declaration is not there for nothing
	it.each(declaredWithEffects.map((pkg) => [pkg.name, pkg] as const))(
		'%s: импорт без имён оставляет каждый модуль с эффектом',
		async (_name, pkg) => {
			const { files } = await packageModules(pkg)
			const withEffects = files.filter((file) => effectsOf([file]).length > 0)
			const entries = scriptEntries(pkg)
			const kept = modulesKept(
				await bundle(entries.map((path) => `import '${path}'`).join('\n'), entries),
			)

			expect(withEffects.length).toBeGreaterThan(0)
			expect(withEffects.filter((file) => !kept.includes(file))).toEqual([])
		},
	)

	it.each(Object.entries(BUTTONS))(
		'%s: сборка одной кнопки не содержит Table и Calendar',
		async (_path, application) => {
			const kept = modulesKept(await bundle(application, Object.keys(SOURCES)))

			// Not idle: the button is there
			expect(kept).toContain('packages/core/src/components/custom/button/button.class.ts')
			expect(kept.filter((file) => /\/(table|calendar)\//.test(file))).toEqual([])
		},
	)
})

/** The polyfill of built-ins (Safari): the adapter of Web Components takes it as a package. */
const POLYFILL = '@ungap/custom-elements'

/** Entry points of Web Components: the root and the entries of the elements. */
const WEBC_ENTRIES = Object.keys(SOURCES).filter(
	(path) => path === '@soxa-ui/webc' || path.startsWith('@soxa-ui/webc/'),
)

/** Components of Web Components whose module of an element defines elements on import. */
function definingComponents(): string[] {
	const components = `${WEBC}/src/components`

	return readdirSync(join(ROOT, components), { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map(({ name }) => name)
		.filter((name) =>
			readdirSync(join(ROOT, components, name))
				.filter((file) => file.endsWith('.element.ts'))
				.some((file) => effectsOf([`${components}/${name}/${file}`]).length > 0),
		)
}

/** Modules `start` imports, directly or not: their code runs before its own. */
function importedBy(metafile: Metafile, start: string): Set<string> {
	const inputs = new Map(
		Object.entries(metafile.inputs).map(([file, input]) => [normalize(file), input]),
	)
	const seen = new Set<string>()
	const visit = (file: string): void => {
		for (const { path, kind } of inputs.get(file)?.imports ?? []) {
			const next = normalize(path)

			if (kind !== 'import-statement' || seen.has(next)) continue

			seen.add(next)
			visit(next)
		}
	}

	visit(start)

	return seen
}

let webcGraph: Promise<Metafile> | undefined

/** One bundle of every entry of Web Components: the graph of its modules. */
function webcMetafile(): Promise<Metafile> {
	webcGraph ??= bundle(
		WEBC_ENTRIES.map((path) => `import '${path}'`).join('\n'),
		Object.keys(SOURCES),
	)

	return webcGraph
}

describe('входы элементов Web Components', () => {
	it('вход — у каждого компонента, чей модуль элемента определяет элементы при импорте, и у провайдера локали', () => {
		expect(
			Object.fromEntries(
				WEBC_ENTRIES.filter((path) => path !== '@soxa-ui/webc').map((path) => [
					path,
					SOURCES[path],
				]),
			),
		).toEqual({
			...Object.fromEntries(
				definingComponents().map((name) => [
					`@soxa-ui/webc/${name}`,
					`${WEBC}/src/components/${name}/index.ts`,
				]),
			),
			'@soxa-ui/webc/locale-provider': `${WEBC}/src/adapter/locale/index.ts`,
		})
	})

	// The imports of a module run before its code, whatever their order, and
	// the build of the package reorders them: Vite puts the external ones after
	// the package's own. So the polyfill holds as an import below every module of
	// an element, not as the first line of an entry
	it.each(WEBC_ENTRIES)(
		'%s: полифил встроенных элементов — в импортах каждого модуля элемента',
		async (path) => {
			const metafile = await webcMetafile()
			const elements = [...importedBy(metafile, SOURCES[path] ?? path)].filter((file) =>
				file.endsWith('.element.ts'),
			)

			// Not idle: the entry brings elements
			expect(elements.length).toBeGreaterThan(0)
			expect(elements.filter((file) => !importedBy(metafile, file).has(POLYFILL))).toEqual([])
		},
	)
})
