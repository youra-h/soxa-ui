import { posix } from 'node:path'
import { isBuiltin } from 'node:module'
import ts from 'typescript'

/**
 * Every published import must be declared in dependencies or peerDependencies.
 * Inspect packed code and declarations so workspace hoisting cannot hide a
 * missing dependency. Development-only dependencies do not reach consumers.
 * Node built-ins are engine-provided only for packages declaring a Node CLI;
 * they remain forbidden in browser-facing library packages.
 */

/** Манифест как есть: поля не принимаются на веру, а проверяются по одному. */
export type TManifest = Readonly<Record<string, unknown>>

/** Файл тарболла: путь от корня пакета через `/` и текст. */
export type TPublishedFile = {
	readonly path: string
	readonly text: string
}

/** Импорт пакета, которого манифест не объявил. */
export type TUndeclaredImport = {
	/** Файл тарболла, путь от корня пакета. */
	readonly file: string
	/** Спецификатор, как он записан: `solid-js/web`, `node:fs`. */
	readonly specifier: string
	/** Имя, которое должен объявить манифест: `solid-js`. */
	readonly name: string
}

function isObject(value: unknown): value is Readonly<Record<string, unknown>> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Код и декларации: `.js`, `.mjs`, `.cjs`, `.d.ts`, `.d.mts` и прочие `.[cm][jt]s(x)`. */
const SCRIPT_FILE = /\.[cm]?[jt]sx?$/

const SVELTE_FILE = /\.svelte$/

/**
 * Блоки `<script>` компонента Svelte — экземпляра и `<script module>`: импорты
 * стоят только в них. Значения атрибутов в кавычках пропускаются целиком, иначе
 * `generics="T extends Record<string, unknown>"` оборвал бы тег на первом `>`.
 */
const SVELTE_SCRIPT = /<script(?:\s(?:[^>"']|"[^"]*"|'[^']*')*)?>([\s\S]*?)<\/script\s*>/g

/**
 * Файл, импорты которого резолвит потребитель: код, декларации и компоненты
 * Svelte — их компилирует сборщик потребителя. Стили, карты кода, README и
 * манифест не читаются.
 */
export function isScannedFile(path: string): boolean {
	return SCRIPT_FILE.test(path) || SVELTE_FILE.test(path)
}

/** Текст строкового литерала, если узел — он. */
function literalText(node: ts.Node | undefined): string | undefined {
	return node !== undefined && ts.isStringLiteralLike(node) ? node.text : undefined
}

/** Вызов, который импортирует: `import('…')` или `require('…')`. */
function isImportCall({ expression, arguments: args }: ts.CallExpression): boolean {
	if (expression.kind === ts.SyntaxKind.ImportKeyword) {
		return true
	}

	return ts.isIdentifier(expression) && expression.text === 'require' && args.length === 1
}

/**
 * Спецификатор, который записан узлом, если узел импортирует.
 *
 * `declare module '…'` импортирует, когда дополняет чужой модуль: в файле-модуле
 * (так тема дополняет реестры `@soxa-ui/core`) и внутри другого такого
 * объявления. На верхнем уровне глобального файла деклараций он модуль
 * объявляет, и резолвить потребителю нечего — так же его читает TypeScript.
 */
function specifierOf(node: ts.Node, inModule: boolean): string | undefined {
	if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
		return literalText(node.moduleSpecifier)
	}

	if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
		return literalText(node.moduleReference.expression)
	}

	if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
		return literalText(node.argument.literal)
	}

	if (ts.isCallExpression(node) && isImportCall(node)) {
		return literalText(node.arguments[0])
	}

	if (ts.isModuleDeclaration(node) && (inModule || ts.isModuleBlock(node.parent))) {
		return literalText(node.name)
	}

	return undefined
}

/** Спецификаторы разобранного файла: узлы дерева и `/// <reference types>`. */
function specifiersOfSource(source: ts.SourceFile): string[] {
	const found = source.typeReferenceDirectives.map(({ fileName }) => fileName)
	const inModule = ts.isExternalModule(source)

	const visit = (node: ts.Node): void => {
		const specifier = specifierOf(node, inModule)

		if (specifier !== undefined) {
			found.push(specifier)
		}

		ts.forEachChild(node, visit)
	}

	ts.forEachChild(source, visit)

	return found
}

function parse(fileName: string, text: string, kind?: ts.ScriptKind): ts.SourceFile {
	return ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, kind)
}

/**
 * Спецификаторы файла, которые резолвит потребитель: `import` и
 * `export … from` в любом виде (`type`, `* as`, `defer`), `import()` в коде и в
 * типах, `import x = require()`, `require()`, дополнение чужого модуля и
 * `/// <reference types>`.
 *
 * Файл разбирает парсер TypeScript, поэтому текст в комментариях и строках
 * импортом не считается. Сканер `preProcessFile` для этого не годится:
 * `export * as ns from` и `import defer` он пропускает. У компонента Svelte
 * читаются блоки `<script>`: `import()` в выражениях разметки проверка не
 * видит — разметку разбирает только компилятор Svelte.
 */
export function specifiersOf({ path, text }: TPublishedFile): string[] {
	if (SVELTE_FILE.test(path)) {
		return [...text.matchAll(SVELTE_SCRIPT)].flatMap(([, script]) =>
			specifiersOfSource(parse(`${path}.ts`, script, ts.ScriptKind.TS)),
		)
	}

	return specifiersOfSource(parse(path, text))
}

/** Путь, а не пакет: относительный (`./a`, `../b`) или абсолютный (`/a`). */
function isPath(specifier: string): boolean {
	return specifier.startsWith('.') || specifier.startsWith('/')
}

/**
 * Имя пакета из голого спецификатора — без подпути: `solid-js/web` →
 * `solid-js`, `@angular/core/testing` → `@angular/core`. У встроенного модуля
 * Node имя — сам спецификатор: `node:fs`.
 */
export function packageNameOf(specifier: string): string {
	const [first, second] = specifier.split('/')

	return first.startsWith('@') && second !== undefined ? `${first}/${second}` : first
}

/** Имена, объявленные полем зависимостей манифеста. */
function namesIn(field: unknown): string[] {
	return isObject(field) ? Object.keys(field) : []
}

/**
 * Импорты пакетов, которых манифест не объявил, — по одному на спецификатор
 * в файле. Файлы, которых потребитель не резолвит (`isScannedFile`),
 * пропускаются.
 */
export function findUndeclaredImports(
	manifest: TManifest,
	files: readonly TPublishedFile[],
): TUndeclaredImport[] {
	const declared = new Set<unknown>([
		manifest.name,
		...namesIn(manifest.dependencies),
		...namesIn(manifest.peerDependencies),
	])

	return files
		.filter(({ path }) => isScannedFile(path))
		.flatMap((file) =>
			[...new Set(specifiersOf(file))]
				.filter((specifier) => !isPath(specifier))
				.filter(
					(specifier) =>
						!(
							isBuiltin(specifier) &&
							isObject(manifest.engines) &&
							typeof manifest.engines.node === 'string' &&
							isObject(manifest.bin) &&
							Object.values(manifest.bin).some((target) => typeof target === 'string')
						),
				)
				.map((specifier) => ({
					file: file.path,
					specifier,
					name: packageNameOf(specifier),
				}))
				.filter(({ name }) => !declared.has(name)),
		)
}

/** Поля манифеста, чьи цели — файлы пакета: те же, что у `workspace-manifests.spec.ts`. */
const ENTRY_FIELDS = ['main', 'types', 'style', 'exports', 'bin'] as const

/** Цели точки входа: строка — путь, объект условий или подпутей и массив — вглубь. */
function targetsOf(value: unknown): string[] {
	if (typeof value === 'string') {
		return [value]
	}

	if (Array.isArray(value)) {
		return value.flatMap(targetsOf)
	}

	return isObject(value) ? Object.values(value).flatMap(targetsOf) : []
}

/**
 * Whether a target is in the tarball. A target of a subpath pattern of
 * `exports` (`./dist/components/*.css` behind `./*.css`) is there when the
 * tarball holds a file it leads to: `*` stands for any text, `/` included, as
 * Node resolves the pattern.
 */
function isShipped(target: string, shipped: ReadonlySet<string>): boolean {
	if (!target.includes('*')) return shipped.has(target)

	const escape = (text: string) => text.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
	const pattern = new RegExp(`^${target.split('*').map(escape).join('.+')}$`)

	return [...shipped].some((path) => pattern.test(path))
}

/**
 * Цели точек входа, которых нет в тарболле (`paths` — пути от корня пакета),
 * без `./` в начале. Такой пакет не собран или его сборку не везёт `files`, и
 * проверять в нём нечего: несобранный пакет прошёл бы проверку импортов
 * пустым. Признак «в тарболле нет ни одного JS или `.d.ts`» этого не ловит:
 * тема везёт `index.d.ts` из git и без сборки.
 */
export function findMissingEntries(manifest: TManifest, paths: readonly string[]): string[] {
	const shipped = new Set(paths)
	const targets = ENTRY_FIELDS.flatMap((field) => targetsOf(manifest[field])).map((target) =>
		posix.normalize(target),
	)

	return [...new Set(targets)].filter((target) => !isShipped(target, shipped))
}
