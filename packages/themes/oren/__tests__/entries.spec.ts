import { describe, it, expect } from 'vitest'
import { dirname, posix } from 'node:path'
import { build as esbuild, type Plugin as TEsbuildPlugin } from 'esbuild'
import postcss from 'postcss'
import type { AtRule, ChildNode, Container, Document as TCssDocument, Root, Rule } from 'postcss'

import { COMMON_PARTS, COMPONENTS } from '../entries'
import { buildSheets } from './build-css'

/**
 * The whole sheet and the stylesheets of components (`AGENTS.md` of the
 * package, «Слои: лист целиком и по компонентам»): an application gets one
 * cascade, however it takes the theme.
 *
 * - the shared part opens with the order of every layer of the sheet — the
 *   first import of every entry declares it before any rule;
 * - a part writes only into its own layers, and the whole sheet is the shared
 *   part and the parts, rule for rule: a part never wins by its place among
 *   the files, and no rule of the whole sheet is missing from the entries;
 * - an entry imports the shared part, then its parts;
 * - every variable the parts of an entry read is declared in the entry: the
 *   defaults of the document root are in the shared part, and a variable
 *   another part declares on its node brings that part along;
 * - the bundler of an application changes nothing: esbuild — the one of
 *   Angular CLI — keeps the last copy of a file imported twice, and the
 *   cascade of entries taken in any order is the one of the whole sheet.
 *
 * Which parts a component needs is checked against its markup on the Vue
 * playground (`packages/playground/vue/__tests__/theme-entries.spec.ts`).
 */

const sheets = await buildSheets()

/** A built file; without it the guard fails, it does not skip. */
function sheetOf(file: string): string {
	const text = sheets.get(file)

	if (text === undefined) throw new Error(`CSS-сборка не отдала ${file}`)

	return text
}

/** The layer statement or block — the names it declares, under the layer it stands in. */
function namesOf(params: string, prefix: string): string[] {
	return params.split(',').map((name) => [prefix, name.trim()].filter(Boolean).join('.'))
}

/** Every layer of a sheet in the order of its first appearance — the order of the cascade. */
function layerOrder(root: Container): string[] {
	const order: string[] = []
	const walk = (container: Container, prefix: string) => {
		for (const node of container.nodes ?? []) {
			if (node.type !== 'atrule') continue

			if (node.name !== 'layer') {
				walk(node, prefix)
				continue
			}

			const names = namesOf(node.params, prefix)

			for (const name of names) if (!order.includes(name)) order.push(name)

			walk(node, names[0])
		}
	}

	walk(root, '')

	return order
}

/** An ancestor of a node: a rule or an at-rule, not the root. */
type TAncestor = Container | TCssDocument | undefined

const isAtRule = (node: TAncestor): node is AtRule => node?.type === 'atrule'
const isRule = (node: TAncestor): node is Rule => node?.type === 'rule'

/** The leaf layer of a node — its `@layer` ancestors, outside in. */
function layerOf(node: ChildNode): string {
	const names: string[] = []

	for (let parent: TAncestor = node.parent; isAtRule(parent) || isRule(parent);) {
		if (isAtRule(parent) && parent.name === 'layer') names.unshift(parent.params.trim())

		parent = parent.parent
	}

	return names.join('.')
}

/** The text of a selector or a value however the printer of a bundler lays it out. */
const squash = (text: string) =>
	text
		.replace(/\s*([>+~,])\s*/g, '$1')
		.replace(/\s+/g, ' ')
		.trim()

/** Rules and registrations of a sheet as text with their layer — to compare sheets rule for rule. */
function rulesOf(root: Root): string[] {
	const found: string[] = []

	root.walk((node) => {
		if (node.type === 'decl' && node.parent?.type === 'rule') {
			const value = `${squash(node.value)}${node.important ? ' !important' : ''}`

			found.push(
				`${layerOf(node.parent)} | ${squash(node.parent.selector)} { ${node.prop}: ${value} }`,
			)
		}

		if (node.type === 'atrule' && node.name === 'property') {
			const descriptors = (node.nodes ?? []).flatMap((child) =>
				child.type === 'decl' ? [`${child.prop}: ${child.value}`] : [],
			)

			found.push(`@property ${node.params} { ${descriptors.join('; ')} }`)
		}
	})

	return found.sort()
}

/** The part a layer belongs to: `base.so.<part>`, `components.so.<part>` or its modifiers. */
function partOfLayer(layer: string): string | undefined {
	return /^(?:base\.so|components\.so(?:\.modifiers)?)\.([\w-]+)$/.exec(layer)?.[1]
}

/** Name of a part file: `parts/button.css` → `button`. */
const partName = (file: string) => posix.basename(file, '.css')

const whole = postcss.parse(sheetOf('index.css'))
const common = postcss.parse(sheetOf('common.css'))
const partFiles = [...sheets.keys()].filter((file) => file.startsWith('parts/'))
const order = layerOrder(whole)

describe('общая часть — порядок слоёв до первого правила', () => {
	it('открывается одним объявлением всех слоёв листа в их порядке', () => {
		const first = common.nodes.find((node) => node.type !== 'comment')

		expect(
			first?.type === 'atrule' && first.name === 'layer' && first.nodes === undefined,
		).toBe(true)
		expect(first?.type === 'atrule' ? namesOf(first.params, '') : []).toEqual(order)
	})

	it('лист целиком открывается тем же объявлением', () => {
		const first = whole.nodes.find((node) => node.type !== 'comment')

		expect(first?.toString()).toBe(
			common.nodes.find((node) => node.type !== 'comment')?.toString(),
		)
	})

	it('слои частей — после слоёв Tailwind, база ниже темы', () => {
		// The shared layer of themes in `base`, the theme in `components`: both
		// under the utilities of the application's Tailwind and under its CSS
		// outside layers
		expect(order.indexOf('base')).toBeLessThan(order.indexOf('components'))
		expect(order.indexOf('components')).toBeLessThan(order.indexOf('utilities'))
		expect(order.indexOf('components.so.button')).toBeLessThan(
			order.indexOf('components.so.list-box'),
		)
		expect(order.indexOf('components.so.tooltip')).toBeLessThan(
			order.indexOf('components.so.modifiers.button'),
		)
	})

	it('общие части базы — в общей части, а не файлами', () => {
		for (const part of COMMON_PARTS) {
			expect(order, part).toContain(`base.so.${part}`)
			expect(partFiles, part).not.toContain(`parts/${part}.css`)
		}
	})
})

describe('часть пишет только в свои слои', () => {
	it('keeps Tree styles in the Tree sheet', () => {
		expect(sheetOf('parts/list-box.css')).not.toContain('.so-tree')
		expect(sheetOf('parts/tree.css')).toContain('components.so.tree')
	})

	it.each(partFiles)('%s', (file) => {
		const strays: string[] = []

		for (const node of postcss.parse(sheetOf(file)).nodes) {
			const layer = node.type === 'atrule' && node.name === 'layer' ? node.params.trim() : ''

			if (partOfLayer(layer) !== partName(file))
				strays.push(layer || node.toString().slice(0, 80))
		}

		expect(strays).toEqual([])
	})
})

describe('лист целиком — общая часть и части, правило в правило', () => {
	it('ни правила больше, ни правила меньше', () => {
		const pieces = [common, ...partFiles.map((file) => postcss.parse(sheetOf(file)))]

		expect(pieces.flatMap(rulesOf).sort()).toEqual(rulesOf(whole))
	})

	it('правил вне слоёв нет', () => {
		const strays: string[] = []

		whole.walkRules((rule) => {
			if (layerOf(rule) === '' && rule.parent?.type !== 'atrule') strays.push(rule.selector)
		})

		expect(strays).toEqual([])
	})
})

/** Imports of an entry, as written. */
function importsOf(file: string): string[] {
	const found: string[] = []

	postcss.parse(sheetOf(file)).walkAtRules('import', (rule) => {
		found.push(rule.params.replace(/^['"]|['"]$/g, ''))
	})

	return found
}

/** The rank of a part in the sheet — by its first layer. */
const rankOf = (part: string) => order.findIndex((layer) => partOfLayer(layer) === part)

describe.each(Object.entries(COMPONENTS))('вход %s', (component, parts) => {
	it('общая часть, затем свои части в порядке листа', () => {
		const sorted = [...new Set(parts)].sort((a, b) => rankOf(a) - rankOf(b))

		expect(importsOf(`components/${component}.css`)).toEqual([
			'../common.css',
			...sorted.map((part) => `../parts/${part}.css`),
		])
	})
})

/** Rules of the document root and the variables they declare. */
function rootDefaults(root: Root): string[] {
	const found: string[] = []

	root.walkRules((rule) => {
		if (rule.selector.trim() !== ':root') return

		rule.walkDecls((decl) => {
			found.push(decl.prop)
		})
	})

	return found
}

describe('шкалы — в общей части', () => {
	it('умолчания корня документа есть только в общей части', () => {
		// A neighbour stands by the scale of a block — the cell of Pagination by
		// the height of Button — and reads it from the document root: an entry
		// without the part of that block would get no number. A variable a part
		// sets on its own node reaches only its nodes and what they hold, and
		// the part comes with the component that draws them
		// (`packages/playground/vue/__tests__/theme-entries.spec.ts`)
		expect(partFiles.flatMap((file) => rootDefaults(postcss.parse(sheetOf(file))))).toEqual([])
		expect(rootDefaults(common)).toContain('--so-button-height-sm')
		expect(rootDefaults(common)).toContain('--so-list-box-gap')
	})
})

/** Files of the build for esbuild, by their path in `dist`. */
const fromBuild: TEsbuildPlugin = {
	name: 'build',
	setup(bundler) {
		bundler.onResolve({ filter: /.*/ }, ({ path, importer }) => ({
			path: importer ? posix.join(dirname(importer), path) : path,
			namespace: 'build',
		}))
		bundler.onLoad({ filter: /.*/, namespace: 'build' }, ({ path }) => ({
			contents: sheetOf(path),
			loader: 'css',
		}))
	},
}

/** Components an application imports in an order the sheet does not have. */
const APP = ['select', 'button', 'tabs', 'icon', 'date-picker']

/** Declarations of a sheet by layer: what a printer of a bundler does not lay out its own way. */
function declarationsByLayer(roots: readonly Root[]): Map<string, number> {
	const found = new Map<string, number>()

	for (const root of roots) {
		root.walkDecls((decl) => {
			if (decl.parent?.type !== 'rule') return

			const layer = layerOf(decl.parent)

			found.set(layer, (found.get(layer) ?? 0) + 1)
		})
	}

	return new Map([...found].sort(([a], [b]) => a.localeCompare(b)))
}

describe('сборщик приложения не меняет каскад', () => {
	it('esbuild: входы в любом порядке — те же слои в том же порядке, ни одна часть не потеряна', async () => {
		const { outputFiles } = await esbuild({
			stdin: {
				contents: APP.map((component) => `@import 'components/${component}.css';`).join(
					'\n',
				),
				loader: 'css',
			},
			bundle: true,
			write: false,
			plugins: [fromBuild],
			logLevel: 'silent',
		})
		const bundle = postcss.parse(outputFiles[0].text)
		const bundled = layerOrder(bundle)
		const parts = new Set(APP.flatMap((component) => COMPONENTS[component]))

		// esbuild keeps the last copy of a file imported twice, and the layer
		// statements of the dropped copies it puts first
		expect(bundled.filter((layer) => order.includes(layer))).toEqual(
			order.filter((layer) => bundled.includes(layer)),
		)
		expect(declarationsByLayer([bundle])).toEqual(
			declarationsByLayer([
				common,
				...[...parts].map((part) => postcss.parse(sheetOf(`parts/${part}.css`))),
			]),
		)
	})
})
