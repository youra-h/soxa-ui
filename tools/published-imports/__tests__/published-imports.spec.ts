import { describe, it, expect } from 'vitest'
import {
	findMissingEntries,
	findUndeclaredImports,
	isScannedFile,
	packageNameOf,
	specifiersOf,
} from '../published-imports'
import type { TManifest } from '../published-imports'

/**
 * Правило «пакет объявляет всё, что импортирует» на фикстурах: какие имена
 * считаются объявленными, какие записи — импортами и какие файлы читаются.
 * Воркспейс целиком проверяет `workspace.spec.ts` рядом.
 */

const MANIFEST: TManifest = {
	name: '@soxa-ui/sample',
	dependencies: { '@soxa-ui/core': '^0.1.0' },
	peerDependencies: { '@angular/core': '^22.1.5', 'solid-js': '^1.9.0', svelte: '^5.29.0' },
	devDependencies: { '@angular/common': '^22.1.5' },
}

/** Необъявленные спецификаторы одного файла. */
function undeclared(path: string, text: string): string[] {
	return findUndeclaredImports(MANIFEST, [{ path, text }]).map(({ specifier }) => specifier)
}

describe('имя из спецификатора объявлено в манифесте', () => {
	it('необъявленное имя — нарушение: файл, спецификатор и имя пакета', () => {
		expect(
			findUndeclaredImports(MANIFEST, [
				{ path: 'dist/index.js', text: "import { debounce } from 'lodash/fp'" },
			]),
		).toEqual([{ file: 'dist/index.js', specifier: 'lodash/fp', name: 'lodash' }])
	})

	it.each([
		['dependencies', "import { TButton } from '@soxa-ui/core'"],
		['peerDependencies', "import { createSignal } from 'solid-js'"],
	])('объявлено в %s — не нарушение', (_field, text) => {
		expect(undeclared('dist/index.js', text)).toEqual([])
	})

	it('объявлено только в devDependencies — нарушение: потребитель их не ставит', () => {
		expect(
			undeclared('dist/index.js', "import { NgTemplateOutlet } from '@angular/common'"),
		).toEqual(['@angular/common'])
	})

	it.each([
		['подпуть', 'solid-js/web', 'solid-js'],
		['scoped-имя', '@angular/core', '@angular/core'],
		['scoped-имя с подпутём', '@angular/core/testing', '@angular/core'],
		['встроенный модуль Node', 'node:fs', 'node:fs'],
	])('%s: %s → пакет %s', (_title, specifier, name) => {
		expect(packageNameOf(specifier)).toBe(name)
	})

	it('подпуть и scoped-имя с подпутём сверяются по имени пакета', () => {
		const text = [
			"import { render } from 'solid-js/web'",
			"import { TestBed } from '@angular/core/testing'",
			"import { HttpClient } from '@angular/common/http'",
		].join('\n')

		expect(
			findUndeclaredImports(MANIFEST, [{ path: 'dist/index.js', text }]).map(
				({ name }) => name,
			),
		).toEqual(['@angular/common'])
	})

	it.each([
		['относительный путь', "import { a } from './a.js'\nexport * from '../b'"],
		['абсолютный путь', "import '/c.js'"],
		['собственное имя пакета', "import type { TSample } from '@soxa-ui/sample'"],
	])('%s — не пакет-зависимость', (_title, text) => {
		expect(undeclared('dist/index.d.ts', text)).toEqual([])
	})

	it.each([
		['node:fs', "import { readFileSync } from 'node:fs'"],
		['fs', "import { readFileSync } from 'fs'"],
	])('встроенный модуль Node (%s) — нарушение, исключений нет', (specifier, text) => {
		expect(undeclared('dist/index.js', text)).toEqual([specifier])
	})

	it('accepts engine-provided built-ins only for a declared Node executable', () => {
		const cli = {
			...MANIFEST,
			engines: { node: '>=22.12.0' },
			bin: { sample: './dist/cli.mjs' },
		}
		const files = [
			{
				path: 'dist/cli.mjs',
				text: "import 'node:fs'; import 'node:made-up'; import 'missing'",
			},
		]
		expect(findUndeclaredImports(cli, files).map((v) => v.specifier)).toEqual([
			'node:made-up',
			'missing',
		])
		expect(
			findUndeclaredImports({ ...MANIFEST, engines: cli.engines }, files).map(
				(v) => v.specifier,
			),
		).toContain('node:fs')
		expect(findMissingEntries(cli, [])).toContain('dist/cli.mjs')
	})

	it('спецификатор, повторённый в файле, — одно нарушение', () => {
		const text =
			"import { a } from 'pkg'\nimport type { B } from 'pkg'\nexport { c } from 'pkg'"

		expect(undeclared('dist/index.d.ts', text)).toEqual(['pkg'])
	})
})

describe('что считается импортом', () => {
	it.each([
		['import', 'dist/a.js', "import a from 'pkg'"],
		['import без привязок', 'dist/a.js', "import 'pkg'"],
		['import с namespace', 'dist/a.js', "import a, * as b from 'pkg'"],
		['import defer', 'dist/a.js', "import defer * as a from 'pkg'"],
		['import type', 'dist/a.d.ts', "import type { A } from 'pkg'"],
		['export * from', 'dist/a.js', "export * from 'pkg'"],
		['export * as from', 'dist/a.js', "export * as a from 'pkg'"],
		['export { } from', 'dist/a.js', "export { a as b } from 'pkg'"],
		['export type from', 'dist/a.d.ts', "export type { A } from 'pkg'"],
		['import() в коде', 'dist/a.js', "export const load = () => import('pkg')"],
		['import() в типе', 'dist/a.d.ts', "export declare const a: import('pkg').A"],
		['typeof import()', 'dist/a.d.ts', "export declare const a: typeof import('pkg')"],
		['import = require()', 'dist/a.d.ts', "import a = require('pkg')\nexport = a"],
		['require()', 'dist/a.cjs', "const a = require('pkg')\nmodule.exports = a"],
		['/// <reference types>', 'dist/a.d.ts', '/// <reference types="pkg" />\nexport {}'],
		[
			'дополнение модуля в файле-модуле',
			'index.d.ts',
			"export {}\ndeclare module 'pkg' {\n\tinterface A {}\n}",
		],
	])('%s', (_title, path, text) => {
		expect(undeclared(path, text)).toEqual(['pkg'])
	})

	it.each([
		['комментарий', 'dist/a.js', "// import a from 'pkg'\n/* require('pkg') */\nexport {}"],
		['JSDoc', 'dist/a.d.ts', "/**\n * @example\n * import { a } from 'pkg'\n */\nexport {}"],
		['строка', 'dist/a.js', 'export const text = "import(\'pkg\')"'],
		['import() не литералом', 'dist/a.js', 'export const load = (name) => import(name)'],
		['метод с именем require', 'dist/a.js', "export const a = loader.require('pkg')"],
		[
			'объявление модуля в глобальном файле деклараций',
			'dist/global.d.ts',
			"declare module 'pkg' {\n\texport const a: string\n}",
		],
	])('%s — не импорт', (_title, path, text) => {
		expect(undeclared(path, text)).toEqual([])
	})

	it('импорт внутри объявления модуля в глобальном файле — импорт', () => {
		const text = "declare module 'virtual' {\n\texport * from 'pkg'\n}"

		expect(specifiersOf({ path: 'dist/global.d.ts', text })).toEqual(['pkg'])
	})
})

describe('.svelte: импорты из блоков <script>', () => {
	// Импорт стоит на одной строке с тегом. Если бы тег обрывался на `>` внутри
	// generics, хвост атрибута открыл бы строковый литерал, и импорт до конца
	// строки ушёл бы в него.
	const COMPONENT = [
		'<script module>',
		"\timport { shared } from 'pkg-module'",
		'</script>',
		'',
		`<script lang="ts" generics="T extends Record<string, unknown>">import { onMount } from 'svelte'`,
		"\timport type { TSample } from 'pkg-instance'",
		"\timport { setup } from './setup.component'",
		'</script>',
		'',
		"<p>import text from 'pkg-markup'</p>",
	].join('\n')

	it('оба блока, атрибут с `>` внутри кавычек, разметка — не код', () => {
		expect(specifiersOf({ path: 'dist/Sample.svelte', text: COMPONENT })).toEqual([
			'pkg-module',
			'svelte',
			'pkg-instance',
			'./setup.component',
		])
	})

	it('необъявленное имя в компоненте — нарушение', () => {
		expect(undeclared('dist/Sample.svelte', COMPONENT)).toEqual(['pkg-module', 'pkg-instance'])
	})
})

describe('какие файлы читаются', () => {
	it.each([
		'dist/index.js',
		'dist/index.mjs',
		'dist/index.cjs',
		'dist/index.d.ts',
		'dist/index.d.mts',
		'dist/fesm2022/soxa-ui-angular.mjs',
		'dist/components/Button.svelte',
		'dist/runtime/useAdapter.svelte.js',
	])('%s — читается', (path) => {
		expect(isScannedFile(path)).toBe(true)
	})

	it.each([
		['карта кода', 'dist/index.js.map'],
		['стили', 'dist/index.css'],
		['README', 'README.md'],
		['манифест', 'package.json'],
		['лицензия', 'LICENSE-Apache-2.0'],
	])('%s (%s) — не читается', (_title, path) => {
		expect(isScannedFile(path)).toBe(false)
	})

	it('исходники в карте кода импортами не считаются', () => {
		const map = JSON.stringify({ sourcesContent: ["import { a } from 'pkg'"] })

		expect(undeclared('dist/index.js.map', map)).toEqual([])
	})
})

describe('точки входа — в тарболле', () => {
	const THEME: TManifest = {
		name: '@soxa-ui/theme-sample',
		main: './dist/index.css',
		style: './dist/index.css',
		types: './index.d.ts',
		exports: {
			'.': { types: './index.d.ts', default: './dist/index.css' },
			'./setup': { types: './dist/setup/index.d.ts', default: './dist/setup/index.js' },
		},
	}

	it('собранный пакет — все цели на месте', () => {
		const paths = [
			'package.json',
			'index.d.ts',
			'dist/index.css',
			'dist/setup/index.d.ts',
			'dist/setup/index.js',
		]

		expect(findMissingEntries(THEME, paths)).toEqual([])
	})

	it('несобранный пакет — цели сборки, без повторов, хотя `.d.ts` из git в тарболле есть', () => {
		expect(findMissingEntries(THEME, ['package.json', 'index.d.ts'])).toEqual([
			'dist/index.css',
			'dist/setup/index.d.ts',
			'dist/setup/index.js',
		])
	})

	it('цель шаблона подпути — на месте, когда в тарболле есть файл под неё', () => {
		// Stylesheets per component, as the theme oren ships them: `./*.css`
		const manifest: TManifest = {
			name: '@soxa-ui/theme-sample',
			exports: { './*.css': './dist/components/*.css' },
		}

		expect(findMissingEntries(manifest, ['dist/components/button.css'])).toEqual([])
		expect(findMissingEntries(manifest, ['dist/index.css', 'dist/components.css'])).toEqual([
			'dist/components/*.css',
		])
	})

	it('цели `main` и `types` без `exports` — как у адаптера Angular', () => {
		const manifest: TManifest = {
			name: '@soxa-ui/sample',
			main: './dist/fesm2022/sample.mjs',
			types: './dist/types/sample.d.ts',
		}

		expect(findMissingEntries(manifest, ['dist/fesm2022/sample.mjs'])).toEqual([
			'dist/types/sample.d.ts',
		])
	})
})
