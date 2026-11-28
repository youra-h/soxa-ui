/**
 * The stylesheets of components of the theme oren cover their markup
 * (`packages/themes/oren/AGENTS.md`, «Слои: лист целиком и по компонентам»).
 *
 * The entry `@soxa-ui/theme-oren/<component>.css` imports the shared part and
 * the parts the table of the theme names (`packages/themes/oren/entries.ts`).
 * Which parts a component needs is knowledge of the templates of the library:
 * Select draws its field with Input and its rows with Button, Calendar its
 * month and year picker with Popover and ListBox. So the table is checked
 * against the markup: the component is drawn on the playground with every
 * preset of its props and with its panel open, and no rule of a part out of
 * its entry may match a node it draws — such a rule would reach an application
 * only with the whole sheet.
 *
 * A rule matches here whatever the state: hover, focus, `data-*`, modifiers,
 * `:not()` and `:has()` are left out of its selector (`relaxed`) — a node
 * drawn at rest stands in for the node in any of its states. The nodes are
 * those of the component: its root with what it holds, and what it carries
 * away to `body` (a panel, a region); a wrapper the preview puts around it —
 * Label around CheckBox — is the application's, not the component's.
 *
 * The parts are read from the build (`dist`): `test:layout` builds the CSS of
 * the theme before the run.
 */

import { afterEach, describe, it, expect } from 'vitest'
import parser from 'postcss-selector-parser'
import { PRESETS, previewProps } from '@soxa-ui/playground-shared'
import { loadHost } from '../src/hosts'

const BUILT = import.meta.glob<string>('../../../themes/oren/dist/{components,parts}/*.css', {
	query: '?raw',
	import: 'default',
	eager: true,
})

/** A built file by its path in `dist`: `parts/button.css`. */
const builtFiles = new Map(
	Object.entries(BUILT).map(([path, text]) => [path.replace(/^.*\/dist\//, ''), text]),
)

/** The name of a file in its folder: `parts/button.css` → `button`. */
const nameOf = (path: string) => path.replace(/^.*\//, '').replace(/\.css$/, '')

/** Component → the parts its entry imports, as the build wrote them. */
const entries = new Map(
	[...builtFiles]
		.filter(([path]) => path.startsWith('components/'))
		.map(([path, text]) => [
			nameOf(path),
			[...text.matchAll(/@import '\.\.\/parts\/([\w-]+)\.css'/g)].map(([, part]) => part),
		]),
)

/** Pseudo-classes of a state: a rule with one of them matches the node in some state. */
const STATES = new Set([
	':hover',
	':active',
	':focus',
	':focus-visible',
	':focus-within',
	':disabled',
	':enabled',
	':checked',
	':indeterminate',
	':placeholder-shown',
	':read-only',
	':read-write',
	':invalid',
	':valid',
	':user-invalid',
	':popover-open',
	':open',
	':empty',
	':first-child',
	':last-child',
	':only-child',
	':nth-child',
	':nth-last-child',
	':first-of-type',
	':last-of-type',
	':-moz-focusring',
	':-moz-ui-invalid',
])

/**
 * The selector of a rule in any state: no state pseudo-classes, attributes
 * but `class`, `:not()` and pseudo-elements, a modifier becomes its block
 * (`.so-button--view-filled` → `.so-button`), the condition of `:has()` is
 * relaxed the same way. An empty compound is `*`.
 */
const relax = parser((selectors) => {
	selectors.walk((node) => {
		if (node.type === 'pseudo') {
			const name = node.value.toLowerCase()
			const element = name.startsWith('::') || name === ':before' || name === ':after'

			if (element || name === ':not' || STATES.has(name)) node.remove()
		} else if (node.type === 'attribute' && node.attribute !== 'class') {
			node.remove()
		} else if (node.type === 'class' && node.value.includes('--')) {
			node.value = node.value.replace(/--.*$/, '')
		}
	})

	// A compound left empty — `[data-x] > .so-y` — is any node
	selectors.walk((node) => {
		if (node.type !== 'selector') return

		let empty = true

		for (const child of [...node.nodes]) {
			if (child.type !== 'combinator') {
				empty = false
				continue
			}

			if (empty) node.insertBefore(child, parser.universal())

			empty = true
		}

		if (empty) node.append(parser.universal())
	})
})

/** Style rules of a part with their selectors in any state. */
function rulesOf(css: string): { readonly selector: string; readonly relaxed: string }[] {
	const sheet = new CSSStyleSheet()
	const found: { selector: string; relaxed: string }[] = []

	sheet.replaceSync(css)

	const walk = (rules: CSSRuleList) => {
		for (const rule of rules) {
			if (rule instanceof CSSStyleRule) {
				found.push({
					selector: rule.selectorText,
					relaxed: relax.processSync(rule.selectorText),
				})
			} else if (rule instanceof CSSKeyframesRule) {
				continue
			} else if ('cssRules' in rule && rule.cssRules instanceof CSSRuleList) {
				walk(rule.cssRules)
			}
		}
	}

	walk(sheet.cssRules)

	return found
}

const parts = new Map(
	[...builtFiles]
		.filter(([path]) => path.startsWith('parts/'))
		.map(([path, text]) => [nameOf(path), rulesOf(text)]),
)

/**
 * What the preview of the playground puts into the slots of a component — the
 * control in Field and Label, the trigger of a panel, the body and the footer
 * of a window: the application's markup, which the entry of the component does
 * not answer for (`src/hosts/vue/previews.ts`).
 */
const SLOT_CONTENT: Readonly<Record<string, string>> = {
	field: '.so-field__control > *',
	label: '.so-label__control > *',
	dialog: '.so-dialog__body > *, .so-dialog__footer > *',
	drawer: '.so-drawer__body > *, .so-drawer__footer > *',
	popover: '.so-popover > :not(.so-popover__panel), .so-popover__content > *',
	tooltip: '.so-tooltip > :not(.so-tooltip__panel), .so-tooltip__content > *',
	menu: '.so-menu > :not(.so-menu__panel)',
	sidebar: '.pg-sidebar-header .so-input, .pg-sidebar-footer .so-menu',
}

/**
 * Components without a node of their own: DragAndDrop marks the items of the
 * collections it moves only while it moves them, and at rest there is nothing
 * to cover.
 */
const NO_NODES = new Set(['drag-and-drop'])

/**
 * The nodes a component draws: its root — the top node with the class of its
 * block — with what it holds, and the nodes with a class of an element or a
 * part of its block (`so-select__panel`, `so-menu-item__panel`) out of it: a
 * panel carried away to `body`. Slot content of the preview is left out.
 */
function nodesOf(component: string): Element[] {
	const own = new RegExp(`(?:^|\\s)so-${component}(?:\\s|$)`)
	const carried = new RegExp(`(?:^|\\s)so-${component}(?:__|-)`)
	const slots = SLOT_CONTENT[component]
	const nodes = new Set<Element>()

	for (const node of document.body.querySelectorAll('[class]')) {
		const name = node.getAttribute('class') ?? ''

		if (!own.test(name) && !carried.test(name)) continue

		nodes.add(node)
		node.querySelectorAll('*').forEach((child) => nodes.add(child))
	}

	if (slots === undefined) return [...nodes]

	const content = new Set(
		[...document.body.querySelectorAll(slots)].flatMap((root) => [
			root,
			...root.querySelectorAll('*'),
		]),
	)

	return [...nodes].filter((node) => !content.has(node))
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/** Props that open the panel of a component: its parts in the panel are drawn then. */
const OPEN: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
	'date-picker': { open: true },
	menu: { open: true },
	popover: { open: true },
	select: { open: true },
	tooltip: { open: true },
	dialog: { visible: true },
	drawer: { visible: true },
}

/** What to draw: the preview, then each preset of a prop of the playground. */
function variantsOf(component: string): Readonly<Record<string, unknown>>[] {
	const base = { ...previewProps(component), ...OPEN[component] }

	return [
		base,
		...Object.values(PRESETS[component] ?? {}).map((preset) => ({ ...base, ...preset })),
	]
}

const host = await loadHost('vue')
const mounted: (() => void)[] = []

afterEach(() => {
	for (const unmount of mounted.splice(0)) unmount()
})

describe('входы компонентов темы oren', () => {
	it('сборка темы отдала входы и части', () => {
		// Without the build the guard would pass on nothing
		expect(entries.size).toBeGreaterThan(30)
		expect(entries.get('select')).toContain('input')
		expect(parts.get('button')?.length).toBeGreaterThan(0)
	})

	it('у каждого компонента стенда, чей блок рисует тема, — вход', () => {
		const missing = host.previews.filter(
			(component) => parts.has(component) && !entries.has(component),
		)

		expect(missing).toEqual([])
	})

	it.each([...entries.keys()].filter((component) => !NO_NODES.has(component)))(
		'%s: узлы компонента покрыты его входом',
		async (component) => {
			const own = new Set(entries.get(component))
			const foreign = [...parts].filter(([part]) => !own.has(part))
			const uncovered = new Set<string>()

			for (const props of variantsOf(component)) {
				const node = document.createElement('div')

				document.body.append(node)

				const handle = host.mount(node, { component, props })

				mounted.push(() => {
					handle.unmount()
					node.remove()
				})

				await nextFrame()
				await nextFrame()

				const nodes = nodesOf(component)

				expect(nodes.length, `${component}: ни одного узла компонента`).toBeGreaterThan(0)

				for (const [part, rules] of foreign) {
					for (const { selector, relaxed } of rules) {
						const hit = nodes.find((candidate) => candidate.matches(relaxed))

						if (hit)
							uncovered.add(`${part}: ${selector} ← ${hit.getAttribute('class')}`)
					}
				}

				for (const unmount of mounted.splice(0)) unmount()
			}

			expect([...uncovered]).toEqual([])
		},
	)
})
