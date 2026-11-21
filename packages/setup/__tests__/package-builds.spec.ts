import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join, posix, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as ts from 'typescript'

/**
 * Сторож раздела «Сборка пакетов» (см. AGENTS.md). Наружу уезжает `dist`, а
 * собирает его один из трёх рецептов — какой, видно по инструменту в скрипте
 * `build` пакета.
 *
 * Общий рецепт — бандл Vite, затем прогон деклараций. Три его решения — только
 * ESM, модуль на модуль, без минификации — приняты один раз, в общей фабрике
 * `tools/vite/lib.config.ts`, а проверяется конфиг самого пакета: своя копия
 * расходится с фабрикой молча. У адаптера Vue такая копия пережила
 * переименование скоупа (`external: [/^@soxa\//]` перестал совпадать хоть с
 * чем-нибудь), держала формат `cjs` и складывала выход в `lib` мимо `dist`,
 * объявленного в манифесте.
 *
 * Рецепт Svelte — один проход `svelte-package`. Компоненты `.svelte` уезжают
 * как написаны: скомпилированный компонент привязан к рантайму своей версии
 * Svelte, поэтому компилирует его приложение потребителя. `.ts` транспилируются
 * модуль в модуль, декларации выпускает тот же проход. Бандла нет, и проверки
 * общего рецепта к нему неприменимы — у него свои: вход и выход, конфиг
 * деклараций, ни одного `svelte.config` и условие `svelte` в `exports`.
 *
 * Рецепт Angular — один проход `ng-packagr`. Библиотека Angular уезжает в
 * частичной форме: её дособирает компилятор приложения под свою версию Angular,
 * а полная форма привязана к версии, которой её собрали. Формат выхода задаёт
 * Angular Package Format — FESM и свёрнутые декларации, — поэтому проверки
 * бандла Vite к нему неприменимы. У рецепта свои: выход `dist` записан в
 * конфиге `-p`, частичная форма — в `tsconfig.build.json`.
 *
 * Рецепт Solid — общий рецепт и третий шаг, исходник. Бандл собран под браузер:
 * JSX в нём уже скомпилирован в вызовы `solid-js/web`, а серверная сборка
 * `solid-js/web` отдаёт под этими именами заглушку, которая бросает исключение.
 * Серверу, браузеру и гидратации нужна каждому своя компиляция одного JSX,
 * поэтому компоненты Solid, как и Svelte, компилирует приложение: проход
 * `tsc -p tsconfig.source.json` после бандла снимает TypeScript и сохраняет JSX
 * в каталог внутри `dist`, а условие `solid` в `exports["."]` ведёт туда плагин
 * Solid приложения. Узнаётся рецепт не по инструменту — инструменты у него те
 * же, что у общего, — а по пакету: исходник обязан отдать каждый пакет, который
 * рисует Solid (`solid-js` в `peerDependencies`). Бандл и декларации судят
 * проверки общего рецепта, исходник и условие — свои.
 *
 * Общее у рецептов — `tsconfig.build.json`. Соседей в его `paths` нет (ссылка
 * пакета на самого себя допустима), `preserveSymlinks` нет: сосед резолвится
 * как пакет, по своему собранному `dist`. Пока это было иначе, сборка читала
 * соседа исходниками, и опубликованная поверхность адаптера этим не
 * проверялась вовсе. Судятся опции, которые действуют, — с учётом `extends`,
 * как их читает сам TypeScript: конфиг сборки наследует пакетный, а тот ведёт
 * соседей в исходники. Раньше сторож читал один файл и требовал `paths` в нём:
 * пропавший ключ так ловился, а `preserveSymlinks` из родителя — нет.
 *
 * Обратная сторона — `tsconfig.json`, конфиг проверки типов: он ходит в
 * исходники, и в свои тоже. Тесты импортируют пакет по имени, как потребитель,
 * и без ссылки пакета на себя в `paths` имя уходило через `node_modules` в
 * манифест, то есть в `dist`: без сборки «Типы — Vue» падали на «модуль не
 * найден», а со старой сборкой молча сверяли тесты с устаревшими типами.
 * Ссылка нужна каждому входу с типами — корню и подпутям, как `./setup` тем, —
 * а входу без типов, CSS корня общего слоя тем, не нужна.
 *
 * Список пакетов не хардкодится: это очередь корневого `build`, а каталог
 * пакета берётся по его ссылке воркспейса в `node_modules` — второго
 * соответствия «имя → путь» здесь нет. Пакет очереди, который не подходит ни
 * под один рецепт, — нарушение: иначе его не проверило бы ничто. Что очередь
 * полна и упорядочена, проверяет `workspace-manifests.spec.ts`.
 */

const ROOT = resolve(__dirname, '../../..')

/** Манифест как есть: поля не принимаются на веру, а проверяются по одному. */
type TManifest = Readonly<Record<string, unknown>>

/** Собираемый пакет: имя из очереди, его каталог, манифест и скрипт `build`. */
type TBuiltPackage = {
	readonly name: string
	readonly dir: string
	readonly manifest: TManifest
	readonly build: string
}

/**
 * Файл из каталога пакета, разобранный как JSON; нет файла — `undefined`.
 * Сторож получает его функцией, а не ходит на диск сам: так он проверяет и
 * себя, на пакетах без диска.
 */
type TReadConfig = (file: string) => unknown

function isRecord(value: unknown): value is TManifest {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readJson(path: string): unknown {
	return JSON.parse(readFileSync(path, 'utf-8'))
}

function readManifest(dir: string): TManifest {
	const manifest = readJson(join(dir, 'package.json'))

	if (!isRecord(manifest)) {
		throw new Error(`${dir}/package.json: ожидается объект JSON`)
	}

	return manifest
}

/** Скрипт манифеста по имени: нет скрипта — собирать пакет нечем. */
function scriptOf(manifest: TManifest, dir: string, name: string): string {
	const { scripts } = manifest
	const script = isRecord(scripts) ? scripts[name] : undefined

	if (typeof script !== 'string') {
		throw new Error(`В ${dir}/package.json нет скрипта ${name}`)
	}

	return script
}

/**
 * Очередь корневого `build` — имена в порядке вызова. Каталог пакета берётся
 * через его ссылку воркспейса в `node_modules`: npm заводит её на каждый
 * воркспейс, и держать своё соответствие имён путям не нужно.
 */
function builtPackages(): TBuiltPackage[] {
	const build = scriptOf(readManifest(ROOT), ROOT, 'build')

	return [...build.matchAll(/--workspace=(\S+)/g)].map(([, name]) => {
		const dir = realpathSync(resolve(ROOT, 'node_modules', name))
		const manifest = readManifest(dir)

		return { name, dir, manifest, build: scriptOf(manifest, dir, 'build') }
	})
}

/** Конфиг из каталога пакета: JSON файла или `undefined`, если файла нет. */
function readConfigOf(pkg: TBuiltPackage): TReadConfig {
	return (file) => {
		const path = join(pkg.dir, file)

		return existsSync(path) ? readJson(path) : undefined
	}
}

/**
 * Рецепт сборки узнаётся по инструменту в скрипте `build`. Подходит у пакета
 * ровно один: смесь двух — это рецепт, которого сторож не знает.
 */
type TRecipe = {
	readonly name: string
	readonly tool: RegExp
}

/** Бандл Vite по общей фабрике, затем прогон деклараций. */
const LIB_RECIPE: TRecipe = { name: 'общий: vite build, затем декларации', tool: /\bvite build\b/ }

/** Один проход: компоненты как написаны, `.ts` — в `.js`, декларации — тем же проходом. */
const SVELTE_RECIPE: TRecipe = { name: 'Svelte: svelte-package', tool: /\bsvelte-package\b/ }

/** Один проход: частичная форма Angular, FESM и свёрнутые декларации по APF. */
const NG_PACKAGR_RECIPE: TRecipe = { name: 'Angular: ng-packagr', tool: /\bng-packagr\b/ }

/** Native ESM CLI and verified JSON corpora; no TypeScript declarations or framework runtime. */
const NODE_RECIPE: TRecipe = {
	name: 'Node documentation CLI',
	tool: /\bnode \.\.\/\.\.\/tools\/mcp-package\/build\.mjs$/,
}

const RECIPES: readonly TRecipe[] = [LIB_RECIPE, SVELTE_RECIPE, NG_PACKAGR_RECIPE, NODE_RECIPE]

/** Рецепты, чей инструмент есть в скрипте `build`. */
function recipesOf(build: string): TRecipe[] {
	return RECIPES.filter(({ tool }) => tool.test(build))
}

/** Ошибка TypeScript в разборе конфига — нарушение со своим текстом. */
function unparsed(diagnostic: ts.Diagnostic): string {
	return `не разобран: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`
}

/** Разобранный конфиг и нарушения разбора; файл не прочитан — конфига нет. */
type TParsedTsconfig = {
	readonly parsed: ts.ParsedCommandLine | undefined
	readonly violations: string[]
}

/**
 * Конфиг, разобранный самим TypeScript: опции — с учётом `extends`, файлы
 * программы — по `include` и `exclude`. Звенья цепочки бывают JSONC — в
 * `packages/setup/tsconfig.json` есть комментарии, — и `JSON.parse` их не
 * прочтёт. Файлы читает `host`: так сторож проверяет и себя, на каталоге в
 * памяти. Конфиг, который TypeScript не разобрал, — нарушение: без пропавшего
 * звена сторож судил бы неполные опции.
 */
function parseTsconfig(file: string, host: ts.ParseConfigHost): TParsedTsconfig {
	const { config, error } = ts.readConfigFile(file, (path) => host.readFile(path))

	if (error) {
		return { parsed: undefined, violations: [unparsed(error)] }
	}

	const parsed = ts.parseJsonConfigFileContent(config, host, dirname(file), undefined, file)

	return { parsed, violations: parsed.errors.map(unparsed) }
}

/**
 * Нарушения опций конфига сборки, которые решают, как он видит соседа;
 * пустой список — сосед резолвится как пакет.
 */
function checkNeighbours(name: string, options: ts.CompilerOptions): string[] {
	const violations: string[] = []

	// Ссылка пакета на самого себя допустима, соседа в paths быть не может:
	// по ней сборка прочитала бы его исходники и увела бы туда декларации
	for (const key of Object.keys(options.paths ?? {}).filter((key) => key !== name)) {
		violations.push(`paths знает соседа ${key} — сосед резолвится как пакет, по своему dist`)
	}

	// Держался за прежнее состояние, когда соседи отдавали src
	if (options.preserveSymlinks !== undefined) {
		violations.push(
			`preserveSymlinks ${JSON.stringify(options.preserveSymlinks)} — сосед резолвится как пакет, по своему dist`,
		)
	}

	return violations
}

/**
 * Нарушения `tsconfig.build.json`; пустой список — конфиг в порядке.
 *
 * Опции судятся действующие — с учётом `extends`: чего конфиг сборки не
 * перекрыл, то пришло из пакетного, а у него `paths` ведут соседей в исходники.
 */
function checkBuildTsconfig(name: string, file: string, host: ts.ParseConfigHost): string[] {
	const { parsed, violations } = parseTsconfig(file, host)

	if (parsed === undefined) {
		return violations
	}

	return [...violations, ...checkNeighbours(name, parsed.options)]
}

/** Файлы для разбора конфига и разрешения модулей: `ts.sys` или каталог в памяти. */
type TTsHost = ts.ParseConfigHost & ts.ModuleResolutionHost

/**
 * Каталог верхнего уровня пакета, в котором лежит файл: `__tests__`, `src`,
 * `dist`. Путь берётся относительный: TypeScript пишет пути через `/`, а
 * каталог пакета на Windows приходит через `\`.
 */
function topDirOf(dir: string, file: string): string {
	return relative(dir, file).split(/[\\/]/)[0]
}

/** Файл из `__tests__` пакета в программе конфига; тестов в ней нет — `undefined`. */
function testFileOf(parsed: ts.ParsedCommandLine, dir: string): string | undefined {
	return parsed.fileNames.find((file) => topDirOf(dir, file) === '__tests__')
}

/**
 * Имена входов пакета с типами — те, по которым его тесты импортируют пакет:
 * корень — с условием `types` в `exports["."]` или с полем `types` манифеста
 * (у адаптера Angular `exports` нет), подпуть (`./setup`) — с условием `types`
 * в `exports`. Вход без типов TypeScript по имени не разрешает, и ссылки на
 * себя ему не нужно: корень общего слоя тем — CSS, и типы у пакета — только у
 * поведения, `./setup`.
 */
function typedEntriesOf({ name, manifest }: Pick<TBuiltPackage, 'name' | 'manifest'>): string[] {
	const { exports, types } = manifest
	const root = typeof types === 'string' || Object.hasOwn(rootExportOf(manifest), 'types')
	const subpaths = Object.entries(isRecord(exports) ? exports : {})
		.filter(
			([key, conditions]) =>
				key.startsWith('./') && isRecord(conditions) && Object.hasOwn(conditions, 'types'),
		)
		.map(([key]) => posix.join(name, key))

	return root ? [name, ...subpaths] : subpaths
}

/**
 * Нарушение ссылки на себя у одного входа: `entry` — его имя, `test` — файл
 * тестов, от которого имя разрешается, `dir` — каталог пакета.
 */
function checkEntryReference(
	entry: string,
	test: string,
	dir: string,
	options: ts.CompilerOptions,
	host: TTsHost,
): string[] {
	const targets = options.paths?.[entry]

	if (targets === undefined) {
		return [
			`paths не знает свой вход ${entry} — тесты найдут его через node_modules, по манифесту`,
		]
	}

	const { resolvedModule } = ts.resolveModuleName(entry, test, options, host)
	const target = `paths ведёт ${entry} в ${JSON.stringify(targets)}`

	if (resolvedModule === undefined) {
		return [`${target} — имя ни во что не разрешается`]
	}

	if (resolvedModule.packageId !== undefined) {
		return [`${target} — имя разрешается через манифест, а он ведёт в dist`]
	}

	if (topDirOf(dir, resolvedModule.resolvedFileName) === 'dist') {
		return [`${target} — имя разрешается в выход сборки`]
	}

	return []
}

/**
 * Нарушения `tsconfig.json`, конфига проверки типов; пустой список — конфиг в
 * порядке.
 *
 * Тесты импортируют пакет по имени — корень и подпути, — и программа, в
 * которую они входят, находит каждый вход с типами ссылкой пакета на себя в
 * `paths` — в исходниках. Судится не запись, а то, во что имя разрешает сам
 * TypeScript, — с учётом `extends` и каталога, от которого он считает `paths`.
 * Одного итога мало: каталог с манифестом (`"."`) ведёт по его `types` в
 * `dist`, а без сборки TypeScript откатывается на `index.ts` рядом, и сторож,
 * запущенный до сборки, как в CI, ошибки не увидел бы. Поэтому манифест
 * узнаётся отдельно: разрешение, прочитавшее `package.json`, несёт `packageId`
 * — имя и версию оттуда, — а путь в исходники манифеста не читает.
 *
 * Программу без тестов сторож пропускает: свои модули пакет зовёт
 * относительными путями, и по имени его там импортировать некому.
 */
function checkSelfReference(
	pkg: Pick<TBuiltPackage, 'name' | 'manifest'>,
	file: string,
	host: TTsHost,
): string[] {
	const { parsed, violations } = parseTsconfig(file, host)

	if (parsed === undefined) {
		return violations
	}

	const dir = dirname(file)
	const test = testFileOf(parsed, dir)

	if (test === undefined) {
		return violations
	}

	const { options } = parsed

	return [
		...violations,
		...typedEntriesOf(pkg).flatMap((entry) =>
			checkEntryReference(entry, test, dir, options, host),
		),
	]
}

/**
 * Раздел `build` конфига Vite, который зовёт скрипт `build` пакета
 * (`vite build -c <файл>`).
 */
async function buildSectionOf(pkg: TBuiltPackage): Promise<Readonly<Record<string, unknown>>> {
	const match = pkg.build.match(/vite build -c (\S+)/)

	if (!match) {
		throw new Error(`В скрипте build пакета ${pkg.name} нет «vite build -c <конфиг>»`)
	}

	const module: unknown = await import(pathToFileURL(resolve(pkg.dir, match[1])).href)
	const config = isRecord(module) ? module.default : undefined
	const build = isRecord(config) ? config.build : undefined

	if (!isRecord(build)) {
		throw new Error(`${match[1]} пакета ${pkg.name} не отдаёт раздела build`)
	}

	return build
}

/**
 * Имена конфига Svelte у всех, кто его ищет: списки расширений у
 * `svelte-package`, плагина Svelte и `svelte-check` разные, и сторож берёт их
 * объединение.
 */
const SVELTE_CONFIGS = ['js', 'cjs', 'mjs', 'ts', 'cts', 'mts'].map((ext) => `svelte.config.${ext}`)

/** Путь без `./` в начале и `/` в конце: `./dist/` и `dist` — один каталог. */
function normalizePath(path: string): string {
	return posix.normalize(path).replace(/\/$/, '')
}

/** Команда инструмента из скрипта — до следующей команды или конца строки. */
function commandOf(build: string, tool: RegExp): string {
	return build.match(new RegExp(`${tool.source}[^&|;]*`))?.[0] ?? ''
}

/**
 * Значение опции команды. `-i src`, `--input src` и `--input=src` читаются
 * одинаково — так их читают и сами инструменты. Опции нет — `undefined`.
 */
function optionOf(command: string, ...names: readonly string[]): string | undefined {
	for (const name of names) {
		const match = command.match(new RegExp(`(?:^|\\s)${name}(?:=|\\s+)(\\S+)`))

		if (match) {
			return match[1]
		}
	}

	return undefined
}

/**
 * The target a bundler takes by default for each key of `exports` — a path,
 * or the `default` condition, however deep. Other conditions lead elsewhere:
 * `types` to declarations, `solid` to the source with JSX that another step of
 * the build writes into `dist`.
 */
function defaultTargetsOf(manifest: TManifest): Array<readonly [string, string]> {
	const { exports } = manifest
	const walk = (key: string, value: unknown): Array<readonly [string, string]> => {
		if (typeof value === 'string') return [[key, value]]

		return isRecord(value) ? walk(key, value.default) : []
	}

	return isRecord(exports)
		? Object.entries(exports).flatMap(([key, value]) => walk(key, value))
		: walk('.', exports)
}

/** Entries of a bundle: `lib.entry` is a path, a list or names to paths. */
function bundleEntriesOf(build: Readonly<Record<string, unknown>>): string[] {
	const entry = isRecord(build.lib) ? build.lib.entry : undefined
	const entries = isRecord(entry) ? Object.values(entry) : [entry].flat()

	return entries.filter((path) => typeof path === 'string')
}

/**
 * Violations of the entries of a bundle; an empty list — every default JS
 * target of `exports` in the output of the bundle is built from an entry of
 * it. A module
 * that is not an entry keeps only the exports other modules take from it: a
 * subpath that re-exports a name the root takes by another path loses it, as
 * `toastsOf` of `@soxa-ui/webc/toasts` did. An entry keeps every export of its
 * own. The output of an entry is its path from the root of the kept modules,
 * as `.js`, in `outDir`.
 */
function checkBundleEntries(
	manifest: TManifest,
	build: Readonly<Record<string, unknown>>,
): string[] {
	const rollupOptions = isRecord(build.rollupOptions) ? build.rollupOptions : {}
	const output = isRecord(rollupOptions.output) ? rollupOptions.output : {}
	const { outDir } = build
	const { preserveModulesRoot } = output

	if (typeof outDir !== 'string' || typeof preserveModulesRoot !== 'string') {
		return ['у бандла нет outDir или preserveModulesRoot — выходов его входов не вывести']
	}

	const dir = normalizePath(outDir)
	const built = new Set(
		bundleEntriesOf(build).map((entry) =>
			posix.join(
				dir,
				relative(preserveModulesRoot, entry)
					.split('\\')
					.join('/')
					.replace(/\.[cm]?[jt]sx?$/, '.js'),
			),
		),
	)

	return defaultTargetsOf(manifest)
		.filter(
			([, target]) =>
				target.endsWith('.js') &&
				normalizePath(target).startsWith(`${dir}/`) &&
				!built.has(normalizePath(target)),
		)
		.map(
			([key, target]) =>
				`exports["${key}"] ${JSON.stringify(target)} — не вход бандла: модуль, который не вход, держит только экспорты, которые у него берут другие модули`,
		)
}

/** Условия `exports["."]` в порядке записи; нет их — пустой объект. */
function rootExportOf(manifest: TManifest): TManifest {
	const { exports } = manifest
	const root = isRecord(exports) ? exports['.'] : undefined

	return isRecord(root) ? root : {}
}

/** Условие `svelte` в `exports["."]`; нет его — `undefined`. */
function svelteConditionOf(manifest: TManifest): unknown {
	return rootExportOf(manifest).svelte
}

/**
 * Нарушения рецепта Svelte; пустой список — пакет в порядке. Есть ли файл в
 * каталоге пакета, отвечает `exists`: так сторож проверяет и себя, на пакетах
 * без диска.
 */
function checkSvelteRecipe(pkg: TBuiltPackage, exists: (file: string) => boolean): string[] {
	const violations: string[] = []
	const command = commandOf(pkg.build, SVELTE_RECIPE.tool)
	const input = optionOf(command, '-i', '--input')
	const output = optionOf(command, '-o', '--output')
	const tsconfig = optionOf(command, '--tsconfig')
	const types = optionOf(command, '-t', '--types')
	const condition = svelteConditionOf(pkg.manifest)

	// Без опции вход — `src/lib`, как у приложения SvelteKit: у пакета его нет
	if (input === undefined || normalizePath(input) !== 'src') {
		violations.push(`вход ${JSON.stringify(input)}, ожидается -i src`)
	}

	// Манифест обещает `dist`: выход мимо него никем не читается. Выход записан
	// явно — на умолчание инструмента сторож не полагается
	if (output === undefined || normalizePath(output) !== 'dist') {
		violations.push(`выход ${JSON.stringify(output)}, ожидается -o dist`)
	}

	// Без опции инструмент берёт ближайший tsconfig.json, а его `paths` ведут
	// соседей в исходники
	if (tsconfig === undefined || normalizePath(tsconfig) !== 'tsconfig.build.json') {
		violations.push(
			`конфиг деклараций ${JSON.stringify(tsconfig)}, ожидается --tsconfig tsconfig.build.json`,
		)
	} else if (!exists('tsconfig.build.json')) {
		violations.push('нет tsconfig.build.json')
	}

	if (/(?:^|\s)--no-types(?=\s|$)/.test(command) || types === 'false') {
		violations.push('декларации выключены, а другого прохода для них нет')
	}

	// Конфиг подхватили бы разом сборка, плагин Svelte в тестах и `svelte-check`,
	// и его препроцессор отдал бы наружу не то, что проверили тесты
	for (const config of SVELTE_CONFIGS) {
		if (exists(config)) {
			violations.push(
				`${config} — компоненты уезжают как написаны, конфига Svelte у пакета нет`,
			)
		}
	}

	// По условию `svelte` плагин Svelte у потребителя узнаёт библиотеку и сам
	// компилирует её компоненты
	if (typeof condition !== 'string') {
		violations.push('exports["."] без условия svelte — плагин Svelte не узнает библиотеку')
	} else if (!normalizePath(condition).startsWith('dist/')) {
		violations.push(
			`exports["."]["svelte"] ${JSON.stringify(condition)} — мимо выхода сборки dist`,
		)
	}

	return violations
}

/**
 * Нарушения рецепта Angular; пустой список — пакет в порядке. Конфиги
 * названы в команде явно: без `-p` инструмент ищет `ng-package.json` сам, а
 * без `-c` собирает своим tsconfig, в котором нет ни настроек пакета, ни
 * частичной формы.
 */
function checkNgPackagrRecipe(pkg: TBuiltPackage, read: TReadConfig): string[] {
	const violations: string[] = []
	const command = commandOf(pkg.build, NG_PACKAGR_RECIPE.tool)
	const project = optionOf(command, '-p', '--project')
	const tsconfig = optionOf(command, '-c', '--config')

	if (project === undefined) {
		violations.push('конфиг пакета не назван, ожидается -p ng-package.json')
	} else {
		const file = normalizePath(project)
		const config = read(file)
		const dest = isRecord(config) ? config.dest : undefined

		if (config === undefined) {
			violations.push(`нет ${file}`)
		} else if (typeof dest !== 'string' || normalizePath(dest) !== 'dist') {
			// Манифест обещает `dist`: выход мимо него никем не читается. Выход
			// записан явно — на умолчание инструмента сторож не полагается
			violations.push(`dest ${JSON.stringify(dest)} в ${file}, ожидается "dist"`)
		}
	}

	if (tsconfig === undefined || normalizePath(tsconfig) !== 'tsconfig.build.json') {
		violations.push(
			`конфиг сборки ${JSON.stringify(tsconfig)}, ожидается -c tsconfig.build.json`,
		)
	} else {
		const config = read('tsconfig.build.json')
		const angular = isRecord(config) ? config.angularCompilerOptions : undefined
		const mode = isRecord(angular) ? angular.compilationMode : undefined

		if (config === undefined) {
			violations.push('нет tsconfig.build.json')
		} else if (mode !== 'partial') {
			// Без ключа ng-packagr собирает полную форму: она привязана к версии
			// Angular, которой её собрали, и в чужом приложении не заведётся
			violations.push(
				`compilationMode ${JSON.stringify(mode)} в tsconfig.build.json, ожидается "partial"`,
			)
		}
	}

	return violations
}

/** Конфиг прохода исходника у рецепта Solid — в каталоге пакета. */
const SOURCE_TSCONFIG = 'tsconfig.source.json'

/**
 * Пакет рисует Solid: `solid-js` ставит приложение, рядом со своим. Такому
 * пакету рецепт Solid обязателен, каким бы инструментом он ни собирался.
 */
function rendersSolid({ peerDependencies }: TManifest): boolean {
	return isRecord(peerDependencies) && Object.hasOwn(peerDependencies, 'solid-js')
}

/**
 * Где в скрипте `build` проход исходника — `tsc` с конфигом
 * `tsconfig.source.json`; прохода нет — `-1`.
 */
function sourcePassAt(build: string): number {
	for (const { 0: command, index } of build.matchAll(/\btsc\b[^&|;]*/g)) {
		const project = optionOf(command, '-p', '--project')

		if (project !== undefined && normalizePath(project) === SOURCE_TSCONFIG) {
			return index
		}
	}

	return -1
}

/**
 * Путь от каталога пакета через `/`. TypeScript пишет пути через `/`, а
 * каталог пакета на Windows приходит через `\`.
 */
function packagePathOf(dir: string, path: string): string {
	return relative(dir, path).split(/[\\/]/).join('/')
}

/**
 * Нарушения рецепта Solid сверх общего; пустой список — пакет в порядке.
 * `file` — конфиг исходника в каталоге пакета. Бандл и декларации у рецепта
 * те же, что у общего, и судят их проверки общего рецепта; здесь — третий
 * шаг, исходник, и условие `solid`, которое ведёт в него.
 *
 * Опции конфига судятся действующие — с учётом `extends`: конфиг исходника
 * наследует конфиг сборки, а тот выпускает одни декларации.
 */
function checkSolidRecipe(pkg: TBuiltPackage, file: string, host: ts.ParseConfigHost): string[] {
	const violations: string[] = []
	const pass = sourcePassAt(pkg.build)

	if (pass < 0) {
		violations.push(`нет прохода исходника, ожидается tsc -p ${SOURCE_TSCONFIG}`)
	} else if (pass < pkg.build.search(LIB_RECIPE.tool)) {
		// У Vite стоит emptyOutDir: бандл, собранный после, стёр бы исходник
		violations.push('исходник собирается раньше бандла — emptyOutDir бандла его сотрёт')
	}

	const { parsed, violations: unparsed } = parseTsconfig(file, host)
	let output: string | undefined

	violations.push(...unparsed)

	if (parsed !== undefined) {
		const { options } = parsed

		violations.push(...checkNeighbours(pkg.name, options))

		// Скомпилированный JSX привязан к одному окружению: под сервер, браузер
		// и гидратацию его компилирует плагин Solid приложения
		if (options.jsx !== ts.JsxEmit.Preserve) {
			const jsx = options.jsx === undefined ? 'не задан' : ts.JsxEmit[options.jsx]

			violations.push(`jsx ${jsx}, ожидается preserve — JSX компилирует приложение`)
		}

		for (const option of ['noEmit', 'emitDeclarationOnly'] as const) {
			if (options[option] === true) {
				violations.push(`${option} true — JS исходника не выходит`)
			}
		}

		output =
			options.outDir === undefined ? undefined : packagePathOf(dirname(file), options.outDir)

		// В самом dist `index.js` исходника заменил бы бандл: `src/index.ts`
		// выходит тем же именем, что и вход бандла
		if (output === 'dist') {
			violations.push(
				'outDir "dist" — index.js исходника заменит бандл, ожидается каталог внутри dist',
			)
		} else if (output === undefined || !output.startsWith('dist/')) {
			violations.push(`outDir ${JSON.stringify(output)} — мимо выхода сборки dist`)
		}
	}

	const entry = rootExportOf(pkg.manifest)
	const condition = entry.solid
	const keys = Object.keys(entry)
	// Условия выбираются по порядку записи: подходящее, что стоит раньше,
	// сборщик возьмёт вместо исходника. Раньше допустим только `types`: его
	// читает TypeScript, а сборщик кода не выбирает
	const earlier = keys.slice(0, keys.indexOf('solid')).filter((key) => key !== 'types')

	// По условию `solid` плагин Solid у приложения узнаёт библиотеку и сам
	// компилирует её компоненты
	if (typeof condition !== 'string') {
		violations.push(
			'exports["."] без условия solid — плагин Solid не узнает библиотеку и возьмёт бандл под браузер',
		)
	} else if (output !== undefined && !normalizePath(condition).startsWith(`${output}/`)) {
		violations.push(
			`exports["."]["solid"] ${JSON.stringify(condition)} — мимо выхода исходника ${output}`,
		)
	}

	if (typeof condition === 'string' && earlier.length > 0) {
		violations.push(
			`exports["."]: solid после ${earlier.join(', ')} — сборщик выберет первое подходящее условие, а не исходник`,
		)
	}

	return violations
}

const PACKAGES = builtPackages()

/** Пакеты очереди с конфигом проверки типов: без `tsconfig.json` проверять нечего. */
const TYPECHECKED = PACKAGES.filter(({ dir }) => existsSync(join(dir, 'tsconfig.json')))

/** Пакеты очереди, которые собирает рецепт. */
function packagesOf(recipe: TRecipe): TBuiltPackage[] {
	return PACKAGES.filter(({ build }) => recipe.tool.test(build))
}

/** Пакеты очереди, которые рисуют Solid, — их собирает рецепт Solid. */
const SOLID = PACKAGES.filter(({ manifest }) => rendersSolid(manifest))

describe('сборка пакетов', () => {
	// Разбор не вхолостую: очередь непуста, адаптеры в ней есть, и у каждого
	// рецепта есть пакет — иначе его проверки молча не запускались бы вовсе
	it('очередь корневого build разобрана', () => {
		expect(PACKAGES.map(({ name }) => name)).toEqual(
			expect.arrayContaining(['@soxa-ui/core', '@soxa-ui/vue']),
		)

		for (const recipe of RECIPES) {
			expect(packagesOf(recipe), recipe.name).not.toEqual([])
		}

		expect(SOLID.map(({ name }) => name)).toEqual(expect.arrayContaining(['@soxa-ui/solid']))
	})

	// Тоже не вхолостую: у пакетов, где тесты в программе проверки типов точно
	// есть, сторож их находит — иначе ссылка на себя молча не проверялась бы
	it('тесты в программе проверки типов найдены', () => {
		const tested = TYPECHECKED.filter(({ dir }) => {
			const { parsed } = parseTsconfig(join(dir, 'tsconfig.json'), ts.sys)

			return parsed !== undefined && testFileOf(parsed, dir) !== undefined
		})

		expect(tested.map(({ name }) => name)).toEqual(
			expect.arrayContaining([
				'@soxa-ui/setup',
				'@soxa-ui/vue',
				'@soxa-ui/webc',
				'@soxa-ui/theme-base',
				'@soxa-ui/theme-oren',
			]),
		)
	})

	// Входы — тоже: корень с условием types и полем types, подпуть с types, а
	// корень без типов — нет. Иначе подпути молча не проверялись бы, а корень
	// общего слоя тем требовал бы ссылки на CSS
	it('входы с типами разобраны — корень и подпути', () => {
		const entries = TYPECHECKED.flatMap(typedEntriesOf)

		expect(entries).toEqual(
			expect.arrayContaining([
				'@soxa-ui/vue',
				'@soxa-ui/angular',
				'@soxa-ui/theme-oren',
				'@soxa-ui/theme-oren/setup',
				'@soxa-ui/theme-base/setup',
			]),
		)
		expect(entries).not.toContain('@soxa-ui/theme-base')
	})

	it('каждый пакет очереди собирается ровно одним рецептом', () => {
		const violations = PACKAGES.flatMap(({ name, build }) => {
			const recipes = recipesOf(build)

			return recipes.length === 1
				? []
				: [`${name}: «${build}» — рецептов ${recipes.length}, ожидается один`]
		})

		expect(
			violations,
			`Скрипт build разошёлся с рецептами AGENTS.md «Сборка пакетов» (${RECIPES.map(({ name }) => name).join('; ')}):\n` +
				violations.join('\n'),
		).toEqual([])
	})

	describe.each(PACKAGES.filter((pkg) => !NODE_RECIPE.tool.test(pkg.build)))('$name', (pkg) => {
		it('сборка видит соседа пакетом, а не исходниками', () => {
			const file = join(pkg.dir, 'tsconfig.build.json')
			const violations = checkBuildTsconfig(pkg.name, file, ts.sys)

			expect(
				violations,
				`${file} разошёлся с AGENTS.md «Сборка пакетов» (опции — с учётом extends):\n` +
					violations.join('\n'),
			).toEqual([])
		})
	})

	describe.each(TYPECHECKED)('проверка типов · $name', (pkg) => {
		it('тесты видят сам пакет исходниками, собран он или нет', () => {
			const file = join(pkg.dir, 'tsconfig.json')
			const violations = checkSelfReference(pkg, file, ts.sys)

			expect(
				violations,
				`${file} разошёлся с AGENTS.md «Сборка пакетов» (локальная разработка сборки не требует):\n` +
					violations.join('\n'),
			).toEqual([])
		})
	})

	describe.each(packagesOf(LIB_RECIPE))('общий рецепт · $name', (pkg) => {
		it('декларации собираются после бандла, тем же tsconfig.build.json', () => {
			const bundle = pkg.build.indexOf('vite build')
			const types = pkg.build.indexOf('tsconfig.build.json')

			expect(bundle).toBeGreaterThanOrEqual(0)
			// У Vite стоит emptyOutDir: обратный порядок стёр бы декларации
			expect(types).toBeGreaterThan(bundle)
		})

		it('бандл — только ESM, модуль на модуль, без минификации, в dist', async () => {
			const build = await buildSectionOf(pkg)

			// Второй формат дал бы в приложении две копии каждого класса, и
			// `instanceof` реестров перестал бы совпадать
			expect(build.lib).toMatchObject({ formats: ['es'] })
			// Минификация коверкает имена классов, которыми подписаны ошибки сборки
			expect(build.minify).toBe(false)
			expect(build.emptyOutDir).toBe(true)
			// Манифест обещает `dist`: выход мимо него никем не читается
			expect(build.outDir).toMatch(/^dist(\/|$)/)

			const rollupOptions = isRecord(build.rollupOptions) ? build.rollupOptions : {}
			const { output } = rollupOptions

			expect(Array.isArray(output)).toBe(false)
			// Склеенный в один файл пакет теряет tree-shaking целиком
			expect(output).toMatchObject({ preserveModules: true })
		})

		it('цель exports с кодом в выходе бандла — его вход', async () => {
			const violations = checkBundleEntries(pkg.manifest, await buildSectionOf(pkg))

			expect(
				violations,
				'Входы бандла разошлись с exports (AGENTS.md, «Сборка пакетов»):\n' +
					violations.join('\n'),
			).toEqual([])
		})
	})

	describe.each(packagesOf(NODE_RECIPE))('native Node recipe · $name', (pkg) => {
		it('declares its engine, executable, JSON surface and validation before packing', () => {
			expect(pkg.manifest.engines).toHaveProperty('node')
			expect(pkg.manifest.bin).toEqual({ 'soxa-mcp': './dist/cli.mjs' })
			expect(pkg.manifest.exports).toHaveProperty('./catalog.json', './dist/catalog.json')
			expect(pkg.manifest.types).toBeUndefined()
			expect(scriptOf(pkg.manifest, pkg.dir, 'prepack')).toContain('mcp-package/check.mjs')
		})
	})

	describe.each(packagesOf(SVELTE_RECIPE))('рецепт Svelte · $name', (pkg) => {
		it('компоненты — как написаны, декларации — тем же проходом, выход — в dist', () => {
			const violations = checkSvelteRecipe(pkg, (file) => existsSync(join(pkg.dir, file)))

			expect(
				violations,
				'Сборка разошлась с рецептом Svelte (AGENTS.md, «Сборка пакетов»):\n' +
					violations.join('\n'),
			).toEqual([])
		})
	})

	describe.each(packagesOf(NG_PACKAGR_RECIPE))('рецепт Angular · $name', (pkg) => {
		it('частичная форма, конфиги названы явно, выход — в dist', () => {
			const violations = checkNgPackagrRecipe(pkg, readConfigOf(pkg))

			expect(
				violations,
				'Сборка разошлась с рецептом Angular (AGENTS.md, «Сборка пакетов»):\n' +
					violations.join('\n'),
			).toEqual([])
		})
	})

	describe.each(SOLID)('рецепт Solid · $name', (pkg) => {
		it('исходник с JSX — после бандла, внутри dist, и условие solid ведёт в него', () => {
			const violations = checkSolidRecipe(pkg, join(pkg.dir, SOURCE_TSCONFIG), ts.sys)

			expect(
				violations,
				'Сборка разошлась с рецептом Solid (AGENTS.md, «Сборка пакетов»):\n' +
					violations.join('\n'),
			).toEqual([])
		})
	})
})

describe('сторож рецептов', () => {
	it('рецепт узнаётся по инструменту в скрипте build', () => {
		const lib = 'vite build -c vite.lib.config.ts && tsc -p tsconfig.build.json'
		const theme =
			'npm run build:css && vite build -c vite.setup.config.ts && tsc -p tsconfig.build.json'
		const angular = 'ng-packagr -p ng-package.json -c tsconfig.build.json'

		expect(recipesOf(lib)).toEqual([LIB_RECIPE])
		expect(recipesOf(theme)).toEqual([LIB_RECIPE])
		expect(recipesOf('svelte-package -i src -o dist')).toEqual([SVELTE_RECIPE])
		expect(recipesOf(angular)).toEqual([NG_PACKAGR_RECIPE])
		expect(recipesOf('tsc -p tsconfig.build.json')).toEqual([])
		expect(recipesOf('vite build && svelte-package')).toEqual([LIB_RECIPE, SVELTE_RECIPE])
		expect(recipesOf('vite build && ng-packagr')).toEqual([LIB_RECIPE, NG_PACKAGR_RECIPE])
	})

	describe('входы бандла', () => {
		const SOURCES = resolve('/example/src')
		const manifest = {
			exports: {
				'.': { types: './dist/index.d.ts', default: './dist/index.js' },
				'./button': {
					types: './dist/components/button/index.d.ts',
					default: './dist/components/button/index.js',
				},
				'./theme.css': './dist/theme.css',
			},
		}

		/** The section `build` of a bundle with these entries, its modules kept from `src`. */
		const bundle = (entry: unknown) => ({
			outDir: 'dist',
			lib: { entry },
			rollupOptions: { output: { preserveModules: true, preserveModulesRoot: SOURCES } },
		})

		const ROOT_ENTRY = join(SOURCES, 'index.ts')
		const BUTTON_ENTRY = join(SOURCES, 'components/button/index.ts')

		it('подпуть, собранный не входом, — нарушение; входом — нет', () => {
			expect(checkBundleEntries(manifest, bundle(ROOT_ENTRY))).toEqual([
				'exports["./button"] "./dist/components/button/index.js" — не вход бандла: модуль, который не вход, держит только экспорты, которые у него берут другие модули',
			])
			expect(checkBundleEntries(manifest, bundle([ROOT_ENTRY, BUTTON_ENTRY]))).toEqual([])
			expect(
				checkBundleEntries(manifest, bundle({ index: ROOT_ENTRY, button: BUTTON_ENTRY })),
			).toEqual([])
		})

		// Declarations, styles and the source of Solid are no modules of the
		// bundle, and a target outside its output belongs to another build
		it('цели других условий, без кода и мимо выхода бандла не в счёт', () => {
			const solid = {
				exports: {
					'.': {
						types: './dist/index.d.ts',
						solid: './dist/source/index.js',
						default: './dist/index.js',
					},
				},
			}
			const setup = {
				...bundle(resolve('/example/setup/index.ts')),
				outDir: 'dist/setup',
				rollupOptions: { output: { preserveModulesRoot: resolve('/example/setup') } },
			}

			expect(checkBundleEntries(solid, bundle(ROOT_ENTRY))).toEqual([])
			expect(
				checkBundleEntries(
					{ exports: { '.': './dist/index.js', './setup': './dist/setup/index.js' } },
					setup,
				),
			).toEqual([])
		})
	})

	const NAME = '@soxa-ui/example'

	/**
	 * Каталог в памяти: путь → текст файла. Программа любого конфига — все
	 * файлы `.ts` каталога: `include` и `exclude` он не разбирает, а сторожу
	 * важен итог — какие файлы в программе.
	 */
	const memoryHost = (files: Readonly<Record<string, string>>): TTsHost => ({
		useCaseSensitiveFileNames: true,
		fileExists: (path) => Object.hasOwn(files, path),
		readFile: (path) => files[path],
		readDirectory: () => Object.keys(files).filter((path) => path.endsWith('.ts')),
	})

	/** Текст конфига: объект пишется как JSON, строка — как есть. */
	const text = (config: unknown): string =>
		typeof config === 'string' ? config : JSON.stringify(config)

	describe('tsconfig.build.json', () => {
		const WHY = 'сосед резолвится как пакет, по своему dist'
		const BUILD = '/example/tsconfig.build.json'

		/**
		 * Пакетный конфиг, как у адаптеров: соседи ведут в исходники. Записан
		 * JSONC — с комментарием и висячими запятыми, как бывает у звеньев
		 * `extends`.
		 */
		const PACKAGE_TSCONFIG = `{
	// Тесты и проверка типов ходят в соседей исходниками
	"extends": "../tsconfig.base.json",
	"compilerOptions": {
		"paths": {
			"@soxa-ui/core": ["../core/src"],
			"${NAME}": ["./src"],
		},
	},
}`

		/**
		 * Конфиг сборки поверх пакетного конфига, а тот — поверх общего базового,
		 * как у адаптеров. Исходники сторожу не нужны, но без них TypeScript счёл
		 * бы конфиг пустым (TS18003).
		 */
		const check = (build: unknown, base: unknown = {}): string[] =>
			checkBuildTsconfig(
				NAME,
				BUILD,
				memoryHost({
					'/tsconfig.base.json': text(base),
					'/example/tsconfig.json': PACKAGE_TSCONFIG,
					'/example/src/index.ts': '',
					[BUILD]: text(build),
				}),
			)

		it('пустые paths поверх соседей и ссылка пакета на себя — без нарушений', () => {
			const own = { extends: './tsconfig.json', compilerOptions: { paths: {} } }
			const self = {
				extends: './tsconfig.json',
				compilerOptions: { paths: { [NAME]: ['./src'] } },
			}

			expect(check(own)).toEqual([])
			expect(check(self)).toEqual([])
		})

		// Пакетный конфиг ведёт соседей в исходники, и extends приносит его paths
		it('сосед в paths — нарушение, свой он или пришёл по extends', () => {
			const neighbour = { compilerOptions: { paths: { '@soxa-ui/core': ['../core/src'] } } }
			const inherited = { extends: './tsconfig.json', compilerOptions: { noEmit: false } }
			const violation = `paths знает соседа @soxa-ui/core — ${WHY}`

			expect(check(neighbour)).toEqual([violation])
			expect(check(inherited)).toEqual([violation])
			expect(check({ extends: './tsconfig.json' })).toEqual([violation])
		})

		it('preserveSymlinks — нарушение, из любого звена extends', () => {
			const own = {
				extends: './tsconfig.json',
				compilerOptions: { paths: {}, preserveSymlinks: true },
			}
			const inherited = { extends: './tsconfig.json', compilerOptions: { paths: {} } }
			const violation = `preserveSymlinks true — ${WHY}`

			expect(check(own)).toEqual([violation])
			// Общий базовый конфиг — звено через одно: сборка → пакет → база
			expect(check(inherited, { compilerOptions: { preserveSymlinks: true } })).toEqual([
				violation,
			])
		})

		// Без пропавшего звена сторож судил бы неполные опции
		it('конфиг, который TypeScript не разобрал, — нарушение', () => {
			const missing = { extends: './tsconfig.missing.json', compilerOptions: { paths: {} } }

			expect(checkBuildTsconfig(NAME, BUILD, memoryHost({}))).toEqual([
				expect.stringMatching(/^не разобран: .*\/example\/tsconfig\.build\.json/),
			])
			expect(check('{ "compilerOptions": ')).toEqual([
				expect.stringMatching(/^не разобран: /),
			])
			expect(check(missing)).toEqual([
				expect.stringMatching(/^не разобран: .*tsconfig\.missing\.json/),
			])
		})
	})

	describe('tsconfig.json', () => {
		const CONFIG = '/example/tsconfig.json'

		/** Подпуть с типами — поведение, как у тем. */
		const SETUP = `${NAME}/setup`

		/** Разрешение модулей — как в общем базовом конфиге. */
		const RESOLUTION = { module: 'esnext', moduleResolution: 'bundler' }

		/** Условия входа, собранного в `dist`. */
		const BUILT_ENTRY = { types: './dist/index.d.ts', default: './dist/index.js' }

		/** Условия поведения, собранного в `dist/setup`, — как у тем. */
		const BUILT_SETUP = { types: './dist/setup/index.d.ts', default: './dist/setup/index.js' }

		/** Корень с типами в `dist` — полем `types`, без `exports`, как у адаптера Angular. */
		const TYPED_ROOT: TManifest = { name: NAME, version: '0.1.0', types: './dist/index.d.ts' }

		/** Корень — CSS, а типы — у поведения `./setup`, как у общего слоя тем. */
		const CSS_ROOT: TManifest = {
			name: NAME,
			version: '0.1.0',
			exports: { '.': './src/index.css', './setup': BUILT_SETUP },
		}

		/** Типы и у корня, и у поведения `./setup`. */
		const BOTH: TManifest = {
			name: NAME,
			version: '0.1.0',
			exports: { '.': BUILT_ENTRY, './setup': BUILT_SETUP },
		}

		/** Каталог пакета с данным манифестом: путь → текст файла. */
		type TFiles = (manifest: TManifest) => Record<string, string>

		/**
		 * Пакет без сборки: манифест ведёт в `dist`, рядом исходники — файл входа в
		 * `src`, `index.ts` в корне, как у setup, и вход поведения в `setup`, как у
		 * тем, — и тест, который импортирует пакет по имени.
		 */
		const clean: TFiles = (manifest) => ({
			'/tsconfig.base.json': text({ compilerOptions: RESOLUTION }),
			'/example/package.json': text(manifest),
			'/example/index.ts': '',
			'/example/src/index.ts': '',
			'/example/setup/index.ts': '',
			'/example/__tests__/example.spec.ts': `import '${NAME}'`,
		})

		/** Тот же пакет после сборки. */
		const built: TFiles = (manifest) => ({
			...clean(manifest),
			'/example/dist/index.d.ts': '',
			'/example/dist/setup/index.d.ts': '',
		})

		/** Конфиг проверки типов поверх общего базового — с данными `paths`. */
		const check = (
			paths: Readonly<Record<string, string[]>>,
			manifest: TManifest = TYPED_ROOT,
			files: TFiles = clean,
		): string[] =>
			checkSelfReference(
				{ name: NAME, manifest },
				CONFIG,
				memoryHost({
					...files(manifest),
					[CONFIG]: text({
						extends: '../tsconfig.base.json',
						compilerOptions: { paths },
					}),
				}),
			)

		/** Нарушение «paths не знает вход». */
		const unknown = (entry: string): string =>
			`paths не знает свой вход ${entry} — тесты найдут его через node_modules, по манифесту`

		it('входы с типами — корень по условию или полю types, подпуть по условию', () => {
			const entries = (manifest: TManifest): string[] =>
				typedEntriesOf({ name: NAME, manifest })
			// Как у темы oren: типы корня — значения оформления, а сам корень — CSS
			const theme = { '.': { types: './index.d.ts', default: './dist/index.css' } }
			// Вход без условия types — CSS, JSON — TypeScript по имени не разрешает
			const untyped = {
				'.': './src/index.css',
				'./theme-variables.json': './theme-variables.json',
			}

			expect(entries(TYPED_ROOT)).toEqual([NAME])
			expect(entries({ exports: { '.': BUILT_ENTRY } })).toEqual([NAME])
			expect(entries(CSS_ROOT)).toEqual([SETUP])
			expect(entries(BOTH)).toEqual([NAME, SETUP])
			expect(entries({ exports: { ...theme, './setup': BUILT_SETUP } })).toEqual([
				NAME,
				SETUP,
			])
			expect(entries({ exports: untyped })).toEqual([])
		})

		it('ссылка на себя в исходники — без нарушений, собран пакет или нет', () => {
			for (const target of ['./src/index.ts', './src']) {
				expect(check({ [NAME]: [target] }), target).toEqual([])
				expect(check({ [NAME]: [target] }, TYPED_ROOT, built), target).toEqual([])
			}
		})

		it('нет ссылки на себя — нарушение', () => {
			expect(check({ '@soxa-ui/core': ['../core/src'] })).toEqual([unknown(NAME)])
		})

		// Корень общего слоя тем — CSS: по имени корня TypeScript ничего не
		// разрешает, а поведение тесты импортируют
		it('корень без типов ссылки не требует, подпуть с типами — требует', () => {
			const setup = { [SETUP]: ['./setup/index.ts'] }

			expect(check(setup, CSS_ROOT)).toEqual([])
			expect(check(setup, CSS_ROOT, built)).toEqual([])
			expect(check({}, CSS_ROOT)).toEqual([unknown(SETUP)])
			expect(check({}, CSS_ROOT, built)).toEqual([unknown(SETUP)])
		})

		it('у каждого входа — своя ссылка: корень не отвечает за подпуть', () => {
			const root = { [NAME]: ['./src/index.ts'] }
			const setup = { [SETUP]: ['./setup/index.ts'] }

			expect(check({ ...root, ...setup }, BOTH)).toEqual([])
			expect(check({ ...root, ...setup }, BOTH, built)).toEqual([])
			expect(check(root, BOTH)).toEqual([unknown(SETUP)])
			expect(check(setup, BOTH)).toEqual([unknown(NAME)])
		})

		// Без сборки TypeScript откатывается с манифеста на index.ts рядом, и по
		// одному итогу разрешения сторож в CI ошибки бы не увидел
		it('каталог с манифестом — нарушение, собран пакет или нет', () => {
			const violation = `paths ведёт ${NAME} в ["."] — имя разрешается через манифест, а он ведёт в dist`

			expect(check({ [NAME]: ['.'] })).toEqual([violation])
			expect(check({ [NAME]: ['.'] }, TYPED_ROOT, built)).toEqual([violation])
		})

		it('ссылка в dist — нарушение, собран пакет или нет', () => {
			const target = `paths ведёт ${NAME} в ["./dist/index.d.ts"]`

			expect(check({ [NAME]: ['./dist/index.d.ts'] }, TYPED_ROOT, built)).toEqual([
				`${target} — имя разрешается в выход сборки`,
			])
			expect(check({ [NAME]: ['./dist/index.d.ts'] })).toEqual([
				`${target} — имя ни во что не разрешается`,
			])
		})

		it('подпуть в dist — нарушение, собран пакет или нет', () => {
			const paths = { [SETUP]: ['./dist/setup/index.d.ts'] }
			const target = `paths ведёт ${SETUP} в ["./dist/setup/index.d.ts"]`

			expect(check(paths, CSS_ROOT, built)).toEqual([
				`${target} — имя разрешается в выход сборки`,
			])
			expect(check(paths, CSS_ROOT)).toEqual([`${target} — имя ни во что не разрешается`])
		})

		// paths считаются от конфига, который их записал, а не от пакетного
		it('ссылка на себя из extends — от каталога своего звена', () => {
			const inherited = (target: string): string[] =>
				checkSelfReference(
					{ name: NAME, manifest: TYPED_ROOT },
					CONFIG,
					memoryHost({
						...clean(TYPED_ROOT),
						'/tsconfig.base.json': text({
							compilerOptions: { ...RESOLUTION, paths: { [NAME]: [target] } },
						}),
						[CONFIG]: text({ extends: '../tsconfig.base.json' }),
					}),
				)

			expect(inherited('./example/src/index.ts')).toEqual([])
			expect(inherited('./src/index.ts')).toEqual([
				`paths ведёт ${NAME} в ["./src/index.ts"] — имя ни во что не разрешается`,
			])
		})

		it('программа без тестов — без нарушений, даже без ссылки на себя', () => {
			const untested: TFiles = (manifest) => {
				const { '/example/__tests__/example.spec.ts': _test, ...files } = clean(manifest)

				return files
			}

			expect(check({}, BOTH, untested)).toEqual([])
		})

		it('конфиг, который TypeScript не разобрал, — нарушение', () => {
			const host = memoryHost(clean(TYPED_ROOT))

			expect(checkSelfReference({ name: NAME, manifest: TYPED_ROOT }, CONFIG, host)).toEqual([
				expect.stringMatching(/^не разобран: .*\/example\/tsconfig\.json/),
			])
		})
	})

	describe('рецепт Svelte', () => {
		const BUILD = 'svelte-package -i src -o dist --tsconfig tsconfig.build.json'

		const ENTRY: TManifest = {
			types: './dist/index.d.ts',
			svelte: './dist/index.js',
			default: './dist/index.js',
		}

		const svelte = (build: string, entry: TManifest = ENTRY): TBuiltPackage => ({
			name: '@soxa-ui/example',
			dir: 'packages/example',
			manifest: { name: '@soxa-ui/example', exports: { '.': entry } },
			build,
		})

		/** Каталог пакета: конфиг деклараций и то, что дали сверх него. */
		const files =
			(...extra: string[]) =>
			(file: string): boolean =>
				['tsconfig.build.json', ...extra].includes(file)

		it('пакет по рецепту — без нарушений, как ни запиши опции', () => {
			const spelled =
				'svelte-package --input=./src --output dist/ --tsconfig=./tsconfig.build.json --types'

			expect(checkSvelteRecipe(svelte(BUILD), files())).toEqual([])
			expect(checkSvelteRecipe(svelte(spelled), files())).toEqual([])
		})

		it('без --tsconfig — нарушение: декларации ушли бы по tsconfig.json', () => {
			expect(checkSvelteRecipe(svelte('svelte-package -i src -o dist'), files())).toEqual([
				'конфиг деклараций undefined, ожидается --tsconfig tsconfig.build.json',
			])
		})

		it('конфиг деклараций назван, а файла нет — нарушение', () => {
			expect(checkSvelteRecipe(svelte(BUILD), () => false)).toEqual([
				'нет tsconfig.build.json',
			])
		})

		it('svelte.config у пакета — нарушение под любым расширением', () => {
			const why = '— компоненты уезжают как написаны, конфига Svelte у пакета нет'

			for (const config of SVELTE_CONFIGS) {
				expect(checkSvelteRecipe(svelte(BUILD), files(config)), config).toEqual([
					`${config} ${why}`,
				])
			}
		})

		it('декларации выключены — нарушение в любой записи', () => {
			for (const flag of ['--no-types', '--types false', '--types=false', '-t false']) {
				expect(checkSvelteRecipe(svelte(`${BUILD} ${flag}`), files()), flag).toEqual([
					'декларации выключены, а другого прохода для них нет',
				])
			}
		})

		it('вход не src, выход не dist — нарушение на каждый', () => {
			const defaults = 'svelte-package --tsconfig tsconfig.build.json'
			const moved = 'svelte-package -i src/lib -o build --tsconfig tsconfig.build.json'

			expect(checkSvelteRecipe(svelte(defaults), files())).toEqual([
				'вход undefined, ожидается -i src',
				'выход undefined, ожидается -o dist',
			])
			expect(checkSvelteRecipe(svelte(moved), files())).toEqual([
				'вход "src/lib", ожидается -i src',
				'выход "build", ожидается -o dist',
			])
		})

		it('опции соседней команды не в счёт', () => {
			const chained = 'svelte-package --tsconfig tsconfig.build.json && cp -i src -o dist'

			expect(checkSvelteRecipe(svelte(chained), files())).toEqual([
				'вход undefined, ожидается -i src',
				'выход undefined, ожидается -o dist',
			])
		})

		it('без условия svelte или с ним мимо dist — нарушение', () => {
			const { svelte: _condition, ...withoutCondition } = ENTRY

			expect(checkSvelteRecipe(svelte(BUILD, withoutCondition), files())).toEqual([
				'exports["."] без условия svelte — плагин Svelte не узнает библиотеку',
			])
			expect(
				checkSvelteRecipe(svelte(BUILD, { ...ENTRY, svelte: './src/index.ts' }), files()),
			).toEqual(['exports["."]["svelte"] "./src/index.ts" — мимо выхода сборки dist'])
		})
	})

	describe('рецепт Angular', () => {
		const BUILD = 'ng-packagr -p ng-package.json -c tsconfig.build.json'

		const angular = (build: string): TBuiltPackage => ({
			name: '@soxa-ui/example',
			dir: 'packages/example',
			manifest: { name: '@soxa-ui/example' },
			build,
		})

		/** Каталог пакета: конфиги по рецепту и то, что поверх них дали. */
		const files =
			(overrides: Readonly<Record<string, unknown>> = {}): TReadConfig =>
			(file) =>
				({
					'ng-package.json': { dest: 'dist', lib: { entryFile: 'src/index.ts' } },
					'tsconfig.build.json': {
						extends: './tsconfig.json',
						compilerOptions: { noEmit: false, paths: {} },
						angularCompilerOptions: { compilationMode: 'partial' },
					},
					...overrides,
				})[file]

		it('пакет по рецепту — без нарушений, как ни запиши опции', () => {
			const spelled = 'ng-packagr --project=./ng-package.json --config ./tsconfig.build.json'

			expect(checkNgPackagrRecipe(angular(BUILD), files())).toEqual([])
			expect(checkNgPackagrRecipe(angular(spelled), files())).toEqual([])
		})

		it('без -p и -c — нарушение на каждый', () => {
			expect(checkNgPackagrRecipe(angular('ng-packagr'), files())).toEqual([
				'конфиг пакета не назван, ожидается -p ng-package.json',
				'конфиг сборки undefined, ожидается -c tsconfig.build.json',
			])
		})

		it('конфиги названы, а файлов нет — нарушение на каждый', () => {
			expect(checkNgPackagrRecipe(angular(BUILD), () => undefined)).toEqual([
				'нет ng-package.json',
				'нет tsconfig.build.json',
			])
		})

		it('выход не dist или не записан — нарушение', () => {
			const moved = files({ 'ng-package.json': { dest: '../../dist/angular' } })
			const implicit = files({ 'ng-package.json': { lib: { entryFile: 'src/index.ts' } } })

			expect(checkNgPackagrRecipe(angular(BUILD), moved)).toEqual([
				'dest "../../dist/angular" в ng-package.json, ожидается "dist"',
			])
			expect(checkNgPackagrRecipe(angular(BUILD), implicit)).toEqual([
				'dest undefined в ng-package.json, ожидается "dist"',
			])
		})

		// Без ключа ng-packagr с конфигом пакета собирает полную форму
		it('полная форма или форма не записана — нарушение', () => {
			const full = files({
				'tsconfig.build.json': {
					compilerOptions: { paths: {} },
					angularCompilerOptions: { compilationMode: 'full' },
				},
			})
			const implicit = files({ 'tsconfig.build.json': { compilerOptions: { paths: {} } } })

			expect(checkNgPackagrRecipe(angular(BUILD), full)).toEqual([
				'compilationMode "full" в tsconfig.build.json, ожидается "partial"',
			])
			expect(checkNgPackagrRecipe(angular(BUILD), implicit)).toEqual([
				'compilationMode undefined в tsconfig.build.json, ожидается "partial"',
			])
		})

		it('опции соседней команды не в счёт', () => {
			const chained = 'ng-packagr && cp -p ng-package.json -c tsconfig.build.json'

			expect(checkNgPackagrRecipe(angular(chained), files())).toEqual([
				'конфиг пакета не назван, ожидается -p ng-package.json',
				'конфиг сборки undefined, ожидается -c tsconfig.build.json',
			])
		})
	})

	describe('рецепт Solid', () => {
		const BUILD =
			'vite build -c vite.lib.config.ts && tsc -p tsconfig.build.json && tsc -p tsconfig.source.json'
		const SOURCE = '/example/tsconfig.source.json'

		const ENTRY: TManifest = {
			types: './dist/index.d.ts',
			solid: './dist/source/index.js',
			default: './dist/index.js',
		}

		/** Опции конфига исходника по рецепту — поверх конфига сборки. */
		const OPTIONS = {
			emitDeclarationOnly: false,
			declaration: false,
			jsx: 'preserve',
			outDir: 'dist/source',
		}

		/**
		 * Цепочка конфигов, как у адаптера: база → пакет → сборка. Пакетный
		 * ведёт соседей в исходники, сборка выпускает одни декларации — конфиг
		 * исходника обязан перекрыть второе и не вернуть первое.
		 */
		const chain = (jsx = 'preserve'): Record<string, string> => ({
			'/tsconfig.base.json': text({
				compilerOptions: { module: 'esnext', moduleResolution: 'bundler', noEmit: true },
			}),
			'/example/tsconfig.json': text({
				extends: '../tsconfig.base.json',
				compilerOptions: { jsx, paths: { '@soxa-ui/core': ['../core/src'] } },
			}),
			'/example/tsconfig.build.json': text({
				extends: './tsconfig.json',
				compilerOptions: {
					noEmit: false,
					emitDeclarationOnly: true,
					declaration: true,
					outDir: 'dist',
					rootDir: 'src',
					paths: {},
				},
			}),
			'/example/src/index.ts': '',
		})

		const solid = (build = BUILD, entry: TManifest = ENTRY): TBuiltPackage => ({
			name: NAME,
			dir: '/example',
			manifest: { name: NAME, exports: { '.': entry } },
			build,
		})

		/** Пакет и опции конфига исходника поверх конфига сборки. */
		const check = (
			pkg: TBuiltPackage,
			options: Readonly<Record<string, unknown>> = OPTIONS,
			files: Record<string, string> = chain(),
		): string[] =>
			checkSolidRecipe(
				pkg,
				SOURCE,
				memoryHost({
					...files,
					[SOURCE]: text({ extends: './tsconfig.build.json', compilerOptions: options }),
				}),
			)

		it('пакет по рецепту — без нарушений, как ни запиши проход', () => {
			const spelled =
				'vite build -c vite.lib.config.ts && tsc -p tsconfig.build.json && tsc --project ./tsconfig.source.json'

			expect(check(solid())).toEqual([])
			expect(check(solid(spelled))).toEqual([])
		})

		it('прохода исходника нет или он раньше бандла — нарушение', () => {
			const lib = 'vite build -c vite.lib.config.ts && tsc -p tsconfig.build.json'
			const early =
				'tsc -p tsconfig.source.json && vite build -c vite.lib.config.ts && tsc -p tsconfig.build.json'

			expect(check(solid(lib))).toEqual([
				'нет прохода исходника, ожидается tsc -p tsconfig.source.json',
			])
			expect(check(solid(early))).toEqual([
				'исходник собирается раньше бандла — emptyOutDir бандла его сотрёт',
			])
		})

		// Опции действующие: jsx пакетного конфига доходит до исходника по extends
		it('JSX скомпилирован — нарушение, свой jsx или пришёл по extends', () => {
			const { jsx: _jsx, ...inherited } = OPTIONS
			const why = 'ожидается preserve — JSX компилирует приложение'

			expect(check(solid(), inherited)).toEqual([])
			expect(check(solid(), { ...OPTIONS, jsx: 'react-jsx' })).toEqual([
				`jsx ReactJSX, ${why}`,
			])
			expect(check(solid(), inherited, chain('react-jsx'))).toEqual([`jsx ReactJSX, ${why}`])
		})

		// Конфиг сборки выпускает одни декларации, и без перекрытия исходник — тоже
		it('JS не выходит — нарушение', () => {
			const { emitDeclarationOnly: _declarations, ...inherited } = OPTIONS

			expect(check(solid(), inherited)).toEqual([
				'emitDeclarationOnly true — JS исходника не выходит',
			])
			expect(check(solid(), { ...OPTIONS, noEmit: true })).toEqual([
				'noEmit true — JS исходника не выходит',
			])
		})

		it('выход — сам dist или мимо него — нарушение', () => {
			const { outDir: _outDir, ...inherited } = OPTIONS
			const replaced =
				'outDir "dist" — index.js исходника заменит бандл, ожидается каталог внутри dist'

			expect(check(solid(), inherited)).toEqual([replaced])
			expect(check(solid(), { ...OPTIONS, outDir: 'dist' })).toEqual([replaced])
			expect(check(solid(), { ...OPTIONS, outDir: 'source' })).toEqual([
				'outDir "source" — мимо выхода сборки dist',
				'exports["."]["solid"] "./dist/source/index.js" — мимо выхода исходника source',
			])
		})

		it('без условия solid, с ним мимо исходника или после default — нарушение', () => {
			const { solid: _condition, ...withoutCondition } = ENTRY
			const late = { ...withoutCondition, solid: ENTRY.solid }

			expect(check(solid(BUILD, withoutCondition))).toEqual([
				'exports["."] без условия solid — плагин Solid не узнает библиотеку и возьмёт бандл под браузер',
			])
			expect(check(solid(BUILD, { ...ENTRY, solid: './dist/index.js' }))).toEqual([
				'exports["."]["solid"] "./dist/index.js" — мимо выхода исходника dist/source',
			])
			expect(check(solid(BUILD, late))).toEqual([
				'exports["."]: solid после default — сборщик выберет первое подходящее условие, а не исходник',
			])
		})

		// Пакетный конфиг ведёт соседей в исходники, и extends принёс бы их paths
		it('сосед в paths — нарушение, как у конфига сборки', () => {
			const paths = { '@soxa-ui/core': ['../core/src'] }

			expect(check(solid(), { ...OPTIONS, paths })).toEqual([
				'paths знает соседа @soxa-ui/core — сосед резолвится как пакет, по своему dist',
			])
		})

		it('конфиг, который TypeScript не разобрал, — нарушение', () => {
			expect(checkSolidRecipe(solid(), SOURCE, memoryHost(chain()))).toEqual([
				expect.stringMatching(/^не разобран: .*\/example\/tsconfig\.source\.json/),
			])
		})
	})
})
