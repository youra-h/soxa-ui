import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import postcss from 'postcss'
import type { AtRule, ChildNode, Container, Root, Rule } from 'postcss'
import { build as viteBuild } from 'vite'

import { BASE_READS, CODE_WRITES, CONTRACT, THEME_READS } from './contract'

/**
 * Guards for the shared CSS layer and its contract with visual themes.
 * The base is plain CSS, has no palette or visual modifiers, and stays in the
 * so cascade layer. Every root default is listed in the public contract.
 * Geometry read by base belongs to base-reads; visual-only optional settings
 * belong to theme-reads and remain unset until a visual theme supplies them.
 * Disabled opacity is paired with a descendant reset; selectors use classes
 * and datasets. Source checks and compiled CSS checks include negative fixtures.
 */

const BASE = resolve(import.meta.dirname, '..')
const SRC = join(BASE, 'src')

/** At-правила CSS, которые база вправе писать: импорт, слой, обёртки, кадры, регистрация. */
const CSS_AT_RULES = new Set([
	'import',
	'layer',
	'media',
	'supports',
	'container',
	'starting-style',
	'keyframes',
	'property',
])

/** Имя свойства CSS или переменной: `$x` Sass сюда не подходит. */
const PROPERTY = /^(?:--[\w-]+|-?[a-z][a-z-]*)$/

/** Переменная и интерполяция Sass. */
const SASS = /#\{|\$[a-z_]/i

/** Функции Tailwind в значении: `theme()`, `--theme()`, `--alpha()`, `--spacing()`. */
const TAILWIND_FUNCTION = /(?<![\w-])(?:theme|--theme|--alpha|--spacing)\(/

/** Именованные цвета CSS (CSS Color 4) — без `transparent` и `currentcolor`. */
const NAMED_COLORS = new Set(
	`aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue
	blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk
	crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki
	darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen
	darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue
	dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite
	gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki
	lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
	lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen
	lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen
	magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen
	mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream
	mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid
	palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum
	powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown
	seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen
	steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow
	yellowgreen`.split(/\s+/),
)

/**
 * Системные цвета CSS: ими красит режим принудительных цветов, а что в нём
 * чем рисовать, решает тема — облик зависит от того, чем она рисует.
 */
const SYSTEM_COLORS = new Set(
	`accentcolor accentcolortext activetext buttonborder buttonface buttontext canvas
	canvastext field fieldtext graytext highlight highlighttext linktext mark marktext
	selecteditem selecteditemtext visitedtext`.split(/\s+/),
)

/** Шестнадцатеричный цвет. */
const HEX = /#[0-9a-f]{3,8}(?![\w-])/gi

/** Цветовая функция: `rgb(`, `oklch(`, `color(`…; `color-mix(` — нет, это смесь. */
const COLOR_FUNCTION = /(?<![\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/gi

/** Ступень шкалы темы: `--so-neutral-500`, а не `--so-text-2xs`. */
const SCALE_STEP = /--so-[a-z][a-z-]*-\d+(?![\w-])/g

/**
 * Слово значения: ключевое слово или имя цвета. Переменные `--x` сюда не
 * попадают, функции — тоже: `tan(` — тангенс, а не цвет `tan`.
 */
const IDENT = /(?<![\w-])-?[a-z][\w-]*(?![\w(-])/gi

/** Модификатор значения темы в селекторе (`.so-button--view-filled`). */
const THEME_MODIFIER = /--(?:view|variant|shape|animation)-/

/** Чтение переменной: `var(--x)` и `var(--x, запас)`. */
const READ = /var\(\s*(--[\w-]+)/g

const isColorName = (word: string) =>
	NAMED_COLORS.has(word.toLowerCase()) || SYSTEM_COLORS.has(word.toLowerCase())

/** Цвета в значении: литералы и ступени шкалы. Строки в кавычках — текст. */
function colorsIn(value: string): string[] {
	const code = value.replace(/(['"])(?:(?!\1).)*\1/g, '')

	return [
		...[...code.matchAll(HEX)].map(([match]) => match),
		...[...code.matchAll(COLOR_FUNCTION)].map(([match]) => match),
		...[...code.matchAll(SCALE_STEP)].map(([match]) => match),
		...[...code.matchAll(IDENT)].map(([match]) => match).filter(isColorName),
	]
}

/** Переменные: объявленные (и зарегистрированные `@property`) и прочитанные. */
function variablesOf(root: Root): { declared: Set<string>; read: Set<string> } {
	const declared = new Set<string>()
	const read = new Set<string>()

	root.walkDecls((decl) => {
		if (decl.prop.startsWith('--')) declared.add(decl.prop)

		for (const [, name] of decl.value.matchAll(READ)) read.add(name)
	})

	root.walkAtRules('property', (rule) => {
		declared.add(rule.params.trim())
	})

	return { declared, read }
}

/** Прочитанные переменные, которых база не объявила и не назвала в контракте. */
function unlistedReads(root: Root, contract: readonly string[]): string[] {
	const { declared, read } = variablesOf(root)

	return [...read].filter((name) => !declared.has(name) && !contract.includes(name))
}

/**
 * Раздел чтения, которого никто не пишет: переменная раздела `theme-reads`,
 * которую база не объявляет и код не пишет строкой.
 */
function unwrittenThemeReads(
	root: Root,
	themeReads: readonly string[],
	written: ReadonlySet<string>,
): string[] {
	const { declared } = variablesOf(root)

	return themeReads.filter((name) => !declared.has(name) && !written.has(name))
}

/** Названия контракта, которых база не читает. */
function unreadContract(root: Root, contract: readonly string[]): string[] {
	const { read } = variablesOf(root)

	return contract.filter((name) => !read.has(name))
}

/**
 * Умолчания для темы, которых нет в контракте: переменные правила корня
 * документа — правила, чей единственный селектор `:root`. Правило знака
 * направления (`:root, [dir='ltr']`) — не умолчание для темы: знак пишет база
 * по `dir`, а тема только читает.
 */
function unlistedDefaults(root: Root, contract: readonly string[]): string[] {
	const found = new Set<string>()

	root.walkRules((rule) => {
		if (rule.selectors.length !== 1 || rule.selectors[0].trim() !== ':root') return

		rule.walkDecls((decl) => {
			if (decl.prop.startsWith('--') && !contract.includes(decl.prop)) found.add(decl.prop)
		})
	})

	return [...found]
}

/** Прозрачность выключенного — из переменной гашения. */
const DISABLED_OPACITY = /^var\(\s*--so-disabled-opacity\s*(?:,[^()]*)?\)$/

/** Пробелы вокруг комбинаторов и запятых бывают разными. */
const squash = (selector: string) =>
	selector
		.replace(/\s+/g, ' ')
		.replace(/\s*([>+~,])\s*/g, '$1')
		.trim()

/**
 * Гасящие правила без пары: селекторы правил с прозрачностью из
 * `--so-disabled-opacity`, у детей которых нет правила с единицей в ней.
 */
function unpairedDisabled(root: Root): string[] {
	const dimmed: string[] = []
	const reset = new Set<string>()

	root.walkDecls((decl) => {
		const rule = decl.parent

		if (rule?.type !== 'rule') return

		if (decl.prop === 'opacity' && DISABLED_OPACITY.test(decl.value)) {
			dimmed.push(...rule.selectors.map(squash))
		}

		if (decl.prop === '--so-disabled-opacity' && decl.value.trim() === '1') {
			for (const selector of rule.selectors) reset.add(squash(selector))
		}
	})

	return dimmed.filter((selector) => !reset.has(`${selector}>*`))
}

/** Селектор по ARIA-атрибуту или по нативному атрибуту `disabled`. */
const ARIA_OR_DISABLED = /\[\s*(?:aria-|disabled\b)/

/** Селектор по направлению письма: атрибут `dir` или `:dir()`. */
const DIRECTION = /\[\s*dir\b|:dir\(/

const isAtRule = (node: Container): node is AtRule => node.type === 'atrule'
const isRule = (node: Container): node is Rule => node.type === 'rule'

/** Предок, который сам вложен: правило или директива, а не корень. */
const isNested = (node: Container | undefined): node is AtRule | Rule =>
	node !== undefined && (isAtRule(node) || isRule(node))

/** Слой узла: имена `@layer` предков снаружи внутрь, через точку. */
function layerOf(node: ChildNode): string {
	const names: string[] = []

	for (let parent = node.parent; isNested(parent); parent = parent.parent) {
		if (isAtRule(parent) && parent.name === 'layer') names.unshift(parent.params.trim())
	}

	return names.join('.')
}

/** Правила вне слоя `so` и его подслоёв. */
function outsideLayer(root: Root): string[] {
	const found: string[] = []

	root.walkRules((rule) => {
		const layer = layerOf(rule)

		if (layer !== 'so' && !layer.startsWith('so.')) {
			found.push(`${layer || '(вне слоя)'}: ${rule.selector}`)
		}
	})

	return found
}

/** Файлы `src` базы, рекурсивно. */
function sourceFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((entry) => {
		const path = join(dir, entry)

		return statSync(path).isDirectory() ? sourceFiles(path) : [path]
	})
}

/** Файлы `src` — путь от `src` через `/`. */
const files = sourceFiles(SRC).map((path) => ({
	name: relative(SRC, path).split('\\').join('/'),
	path,
}))

/** Исходники CSS, разобранные как есть. */
const sources = files
	.filter(({ name }) => name.endsWith('.css'))
	.map(({ name, path }) => ({
		name,
		root: postcss.parse(readFileSync(path, 'utf8'), { from: path }),
	}))

/** CSS базы, как его вшивает тема: импорты частей развёрнуты в их слои. */
async function buildBase(): Promise<string> {
	const result = await viteBuild({
		root: BASE,
		configFile: false,
		logLevel: 'silent',
		// Конфиг PostCSS — пустой и свой: иначе Vite искал бы его в папках выше
		css: { postcss: {} },
		build: {
			write: false,
			cssMinify: false,
			rollupOptions: { input: join(SRC, 'index.css') },
		},
	})
	const sheets = [result].flat().flatMap((output) => {
		if (!('output' in output)) throw new Error('сборка базы ушла в режим наблюдения')

		return output.output.flatMap((file) =>
			file.type === 'asset' && file.fileName.endsWith('.css') ? [file.source] : [],
		)
	})

	if (sheets.length !== 1) {
		throw new Error(`сборка базы отдала листов ${sheets.length}, ожидается один`)
	}

	const [sheet] = sheets

	return typeof sheet === 'string' ? sheet : new TextDecoder().decode(sheet)
}

const css = postcss.parse(await buildBase())

describe('исходники базы — чистый CSS', () => {
	it('в src только .css', () => {
		expect(files.map(({ name }) => name).filter((name) => !name.endsWith('.css'))).toEqual([])
		expect(sources.map(({ name }) => name)).toContain('index.css')
	})

	it('at-правила — только CSS: импорт, слой, обёртки, кадры и регистрация', () => {
		const strays = sources.flatMap(({ name, root }) => {
			const found: string[] = []

			root.walkAtRules((rule) => {
				if (!CSS_AT_RULES.has(rule.name))
					found.push(`${name}: @${rule.name} ${rule.params}`)
			})

			return found
		})

		expect(strays).toEqual([])
	})

	it('ни переменных и интерполяции Sass, ни функций Tailwind', () => {
		const strays = sources.flatMap(({ name, root }) => {
			const found: string[] = []

			root.walkDecls((decl) => {
				const sass = !PROPERTY.test(decl.prop) || SASS.test(decl.value)

				if (sass || TAILWIND_FUNCTION.test(decl.value)) {
					found.push(`${name}: ${decl.prop}: ${decl.value}`)
				}
			})

			root.walkRules((rule) => {
				if (SASS.test(rule.selector)) found.push(`${name}: ${rule.selector}`)
			})

			return found
		})

		expect(strays).toEqual([])
	})
})

describe('CSS базы — без облика темы', () => {
	it('сборка дошла до правил базы', () => {
		// Пустая сборка прошла бы проверки ниже на любых исходниках
		expect(css.nodes.length).toBeGreaterThan(0)
	})

	it('ни цвета: ни литерала, ни ступени шкалы', () => {
		const found: string[] = []

		css.walkDecls((decl) => {
			for (const color of colorsIn(decl.value)) found.push(`${decl.prop}: ${color}`)
		})

		expect(found).toEqual([])
	})

	it('ни модификатора значения темы', () => {
		const found: string[] = []

		css.walkRules((rule) => {
			if (THEME_MODIFIER.test(rule.selector)) found.push(rule.selector)
		})

		expect(found).toEqual([])
	})
})

describe('переменные базы — объявлены или в контракте', () => {
	it('контракт — два раздела: что читает база и что читает тема', () => {
		expect(CONTRACT.sections).toEqual(['base-reads', 'theme-reads'])
	})

	it('в каждом разделе — переменная --so-* и что она значит', () => {
		const entries = [
			...Object.entries(CONTRACT.baseReads),
			...Object.entries(CONTRACT.themeReads),
		]

		expect(entries.filter(([name]) => !/^--so-[a-z][\w-]*$/.test(name))).toEqual([])
		expect(
			entries.filter(([, meaning]) => typeof meaning !== 'string' || meaning.trim() === ''),
		).toEqual([])
	})

	it('каждую переменную, которую база читает, она объявляет или называет в контракте', () => {
		expect(unlistedReads(css, BASE_READS)).toEqual([])
	})

	it('каждую переменную раздела base-reads база читает', () => {
		expect(unreadContract(css, BASE_READS)).toEqual([])
	})

	it('каждое умолчание для темы — переменная корня документа — названо в контракте', () => {
		expect(unlistedDefaults(css, [...BASE_READS, ...THEME_READS])).toEqual([])
	})

	it('разделы не пересекаются', () => {
		expect(THEME_READS.filter((name) => BASE_READS.includes(name))).toEqual([])
	})

	it('каждую переменную раздела theme-reads пишут база или код', () => {
		expect(unwrittenThemeReads(css, THEME_READS, CODE_WRITES)).toEqual([])
	})

	it('код, который пишет переменные, сторож видит', () => {
		// Пустой список пропустил бы только то, что объявляет CSS базы: имя
		// плагина библиотеки и имя плагина раскладки базы
		expect(CODE_WRITES).toContain('--so-table-column-ghost')
		expect(CODE_WRITES).toContain('--so-tabs-active-pos')
	})
})

describe('слой базы', () => {
	it('каждое правило базы — в слое so или его подслое', () => {
		expect(outsideLayer(css)).toEqual([])
	})

	it('первым — порядок подслоёв, и каждая часть — в своём, в том же порядке', () => {
		// The statement orders the parts before any rule: a theme cuts the shared
		// layer into files by these sublayers, and the cascade does not depend on
		// the order an application loads them in. An import into a sublayer the
		// statement lacks would land after every declared one
		const index = sources.find(({ name }) => name === 'index.css')?.root
		const first = index?.nodes.find((node) => node.type !== 'comment')
		const declared =
			first?.type === 'atrule' && first.name === 'layer' && first.nodes === undefined
				? first.params.split(',').map((name) => name.trim())
				: []
		const imports: { layer: string; file: string }[] = []

		index?.walkAtRules('import', (rule) => {
			const [, file = '', layer = ''] =
				/^'\.\/(?:components\/)?([\w-]+)\.css'\s+layer\(([\w.-]+)\)$/.exec(rule.params) ??
				[]

			imports.push({ layer, file })
		})

		expect(declared.length).toBeGreaterThan(0)
		expect(imports.map(({ layer }) => layer)).toEqual(declared)
		expect(imports.filter(({ layer, file }) => layer !== `so.${file}`)).toEqual([])
		expect(declared[0]).toBe('so.reset')
	})
})

describe('выключенное в базе', () => {
	it('у каждого гасящего правила — правило детей с единицей', () => {
		expect(unpairedDisabled(css)).toEqual([])
	})

	it('сборка дошла до гасящих правил', () => {
		// Без них проверка выше прошла бы на любом CSS
		const dimmed: string[] = []

		css.walkDecls('opacity', (decl) => {
			if (DISABLED_OPACITY.test(decl.value)) dimmed.push(decl.value)
		})

		expect(dimmed.length).toBeGreaterThan(0)
	})
})

describe('селекторы базы — по классам и data-*', () => {
	/** Селекторы исходников — с именем файла. */
	const selectors = sources.flatMap(({ name, root }) => {
		const found: { name: string; selector: string }[] = []

		root.walkRules((rule) => {
			found.push({ name, selector: rule.selector })
		})

		return found
	})

	it('ни aria-*, ни атрибута disabled', () => {
		expect(
			selectors
				.filter(({ selector }) => ARIA_OR_DISABLED.test(selector))
				.map(({ name, selector }) => `${name}: ${selector}`),
		).toEqual([])
	})

	it('по направлению письма — только правила знака', () => {
		expect(
			selectors
				.filter(
					({ name, selector }) => name !== 'direction.css' && DIRECTION.test(selector),
				)
				.map(({ name, selector }) => `${name}: ${selector}`),
		).toEqual([])
	})
})

describe('знак направления письма', () => {
	/** Значение знака у каждого селектора правил знака — в порядке правил. */
	const signs: { selector: string; value: string }[] = []

	sources
		.find(({ name }) => name === 'direction.css')
		?.root.walkRules((rule) => {
			const decl = rule.nodes.find(
				(node) => node.type === 'decl' && node.prop === '--so-dir-sign',
			)

			if (decl?.type !== 'decl') return

			for (const selector of rule.selectors) signs.push({ selector, value: decl.value })
		})

	const sign = (selector: string) =>
		signs.filter((entry) => entry.selector === selector).map(({ value }) => value)

	/** Без правил знака переменная пуста, и каждое зеркало темы — тоже. */
	it('знак задан странице без dir и обоим направлениям', () => {
		expect(sign(':root')).toEqual(['1'])
		expect(sign("[dir='ltr']")).toEqual(['1'])
		expect(sign("[dir='rtl']")).toEqual(['-1'])
	})

	/** У `<html dir="rtl">` совпадают оба, специфичность одна — побеждает нижнее. */
	it('правило RTL — ниже корня', () => {
		const at = (selector: string) => signs.findIndex((entry) => entry.selector === selector)

		expect(at("[dir='rtl']")).toBeGreaterThan(at(':root'))
	})
})

describe('что видят сторожа базы', () => {
	it('цвет — литерал, системный цвет и ступень шкалы; цвет места и смесь с ним — нет', () => {
		expect(colorsIn('#fff')).toEqual(['#fff'])
		expect(colorsIn('0 0 0 1px rgb(0 0 0 / 10%)')).toEqual(['rgb('])
		expect(colorsIn('oklch(0.5 0.1 200)')).toEqual(['oklch('])
		expect(colorsIn('1px solid White')).toEqual(['White'])
		expect(colorsIn('Canvas')).toEqual(['Canvas'])
		expect(colorsIn('var(--so-neutral-500)')).toEqual(['--so-neutral-500'])

		expect(colorsIn('currentcolor')).toEqual([])
		expect(colorsIn('transparent')).toEqual([])
		expect(colorsIn('color-mix(in oklab, currentcolor 50%, transparent)')).toEqual([])
		expect(colorsIn('var(--so-text-2xs)')).toEqual([])
		expect(colorsIn('calc(-1 * var(--so-dir-sign))')).toEqual([])
		expect(colorsIn('background-color 200ms ease')).toEqual([])
		expect(colorsIn('rotate(calc(tan(45deg) * 1turn))')).toEqual([])
	})

	it('модификатор значения темы — в имени класса, а не в похожем модификаторе', () => {
		expect(THEME_MODIFIER.test('.so-button--view-filled')).toBe(true)
		expect(THEME_MODIFIER.test(':where(.so-skeleton--animation-wave)')).toBe(true)
		expect(THEME_MODIFIER.test('.so-tabs--ready-animation')).toBe(false)
	})

	it('чтение без объявления и без контракта — нарушение, лишнее в контракте — тоже', () => {
		const reads = '.so-x { inline-size: var(--so-x-width, 2rem) }'

		expect(unlistedReads(postcss.parse(reads), [])).toEqual(['--so-x-width'])
		expect(unlistedReads(postcss.parse(reads), ['--so-x-width'])).toEqual([])
		expect(unlistedReads(postcss.parse(`:root { --so-x-width: 2rem } ${reads}`), [])).toEqual(
			[],
		)
		expect(unreadContract(postcss.parse(reads), ['--so-x-width', '--so-y'])).toEqual(['--so-y'])
	})

	it('переменная раздела чтения без записи — нарушение; объявление базы и код — запись', () => {
		const block = postcss.parse('.so-x--size-sm { --so-x-height: 1rem }')
		const written = new Set(['--so-x-shift'])

		expect(unwrittenThemeReads(block, ['--so-x-height', '--so-x-shift'], written)).toEqual([])
		expect(unwrittenThemeReads(block, ['--so-x-gap'], written)).toEqual(['--so-x-gap'])
	})

	it('правило вне слоя so — нарушение', () => {
		const outside = (text: string) => outsideLayer(postcss.parse(text))

		expect(outside('@layer so { .so-x {} } @layer so.reset { .so-y {} }')).toEqual([])
		expect(outside('@layer so { @layer reset { .so-x {} } }')).toEqual([])
		expect(outside('@layer base { @layer so { .so-x {} } }')).toEqual(['base.so: .so-x'])
		expect(outside('.so-x {} @layer sox { .so-y {} }')).toEqual([
			'(вне слоя): .so-x',
			'sox: .so-y',
		])
	})

	it('умолчание корня без контракта — нарушение; правило знака — не умолчание', () => {
		const defaults = (text: string, listed: readonly string[] = []) =>
			unlistedDefaults(postcss.parse(text), listed)

		expect(defaults(':root { --so-x-size: 1rem }')).toEqual(['--so-x-size'])
		expect(defaults(':root { --so-x-size: 1rem }', ['--so-x-size'])).toEqual([])
		expect(defaults(":root, [dir='ltr'] { --so-dir-sign: 1 }")).toEqual([])
		expect(defaults('.so-x { --so-x-gap: 1rem }')).toEqual([])
	})

	it('гасящее правило без правила детей — нарушение', () => {
		const unpaired = (text: string) => unpairedDisabled(postcss.parse(text))
		const dim = ".so-x[data-disabled='true'] { opacity: var(--so-disabled-opacity) }"

		expect(unpaired(dim)).toEqual([".so-x[data-disabled='true']"])
		expect(
			unpaired(`${dim} .so-x[data-disabled='true']>* { --so-disabled-opacity: 1 }`),
		).toEqual([])
		expect(
			unpaired(
				'.so-a:disabled + .so-b, .so-c { opacity: var(--so-disabled-opacity, 0.35) }' +
					' .so-a:disabled+.so-b > * { --so-disabled-opacity: 1 }',
			),
		).toEqual(['.so-c'])
		expect(unpaired('.so-x { opacity: 0.5 }')).toEqual([])
	})

	it('по aria-*, атрибуту disabled и dir — нарушение; data-* и псевдокласс — нет', () => {
		expect(ARIA_OR_DISABLED.test(".so-x[aria-selected='true']")).toBe(true)
		expect(ARIA_OR_DISABLED.test('.so-x[ disabled]')).toBe(true)
		expect(DIRECTION.test("[dir='rtl'] .so-x")).toBe(true)
		expect(DIRECTION.test('.so-x:dir(rtl)')).toBe(true)

		expect(ARIA_OR_DISABLED.test(".so-x[data-disabled='true']")).toBe(false)
		expect(ARIA_OR_DISABLED.test('.so-x input:disabled')).toBe(false)
		expect(DIRECTION.test(".so-x[data-direction='rtl']")).toBe(false)
	})
})
