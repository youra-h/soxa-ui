import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { compile } from 'sass'

/**
 * Модификаторы темы объявлены в `index.d.ts`.
 *
 * Значения `variant`, `view`, `shape` и `animation` объявляет тема: реестры
 * ядра пусты, и тип пропа — ровно имена из `index.d.ts` (корневой
 * `AGENTS.md`, «Оформление: значения объявляет тема»). Правило под
 * необъявленное имя — мёртвый CSS: потребитель не может задать такое значение,
 * компилятор его не пропустит.
 *
 * Обратное не требуется: значению, которое совпадает с видом блока без
 * модификатора (`filled`, `line`, `rounded`, `pulse`), правило не нужно.
 *
 * Модификаторы берутся из собранного Sass, а не из исходников: часть правил
 * порождают циклы и миксины (`.so-button--view-#{$view}`), и в тексте файла
 * имени целиком нет. `@apply` Sass пропускает как есть — Tailwind здесь не
 * нужен.
 */

const INDEX_SCSS = fileURLToPath(new URL('../src/index.scss', import.meta.url))
const INDEX_DTS = fileURLToPath(new URL('../index.d.ts', import.meta.url))

/**
 * Какие модификаторы какого блока берут значения из реестра. `null` — любой
 * блок: вариант есть у всех. `view` у ListBox, Accordion и Tags — псевдоним
 * `TButtonView`, поэтому их блоки сверяются с реестром Button.
 */
const REGISTRIES: Record<string, { modifier: string; blocks: readonly string[] | null }> = {
	IComponentVariants: { modifier: 'variant', blocks: null },
	IAlertViews: { modifier: 'view', blocks: ['so-alert'] },
	IToastsItemViews: { modifier: 'view', blocks: ['so-toasts', 'so-toasts-item'] },
	IBadgeViews: { modifier: 'view', blocks: ['so-badge'] },
	IButtonViews: {
		modifier: 'view',
		blocks: ['so-button', 'so-list-box', 'so-accordion', 'so-tags', 'so-toggle-group'],
	},
	ITabsViews: { modifier: 'view', blocks: ['so-tabs'] },
	ICheckBoxViews: { modifier: 'view', blocks: ['so-check-box'] },
	IRadioGroupViews: { modifier: 'view', blocks: ['so-radio-group-item'] },
	IAvatarShapes: { modifier: 'shape', blocks: ['so-avatar'] },
	ISkeletonShapes: { modifier: 'shape', blocks: ['so-skeleton'] },
	ISkeletonAnimations: { modifier: 'animation', blocks: ['so-skeleton'] },
}

/** Реестры из `index.d.ts`: имя интерфейса → объявленные значения. */
function declaredRegistries(): Map<string, Set<string>> {
	const source = readFileSync(INDEX_DTS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
	const registries = new Map<string, Set<string>>()

	for (const [, name, body] of source.matchAll(/interface\s+(I\w+)\s*\{([^}]*)\}/g)) {
		registries.set(name, new Set([...body.matchAll(/(\w+)\s*:/g)].map(([, key]) => key)))
	}

	return registries
}

/** Модификаторы темы в собранном CSS: блок, модификатор, значение. */
function usedModifiers(): { selector: string; block: string; modifier: string; value: string }[] {
	const css = compile(INDEX_SCSS).css.replace(/\/\*[\s\S]*?\*\//g, '')
	const pattern =
		/\.(so-[a-z0-9]+(?:-[a-z0-9]+)*)--(variant|view|shape|animation)-([a-z0-9]+(?:-[a-z0-9]+)*)/g
	const unique = new Map<string, { block: string; modifier: string; value: string }>()

	for (const [selector, block, modifier, value] of css.matchAll(pattern)) {
		unique.set(selector, { block, modifier, value })
	}

	return [...unique].map(([selector, parts]) => ({ selector, ...parts }))
}

describe('значения темы', () => {
	it('реестры index.d.ts и сопоставление с блоками совпадают', () => {
		expect([...declaredRegistries().keys()].sort()).toEqual(Object.keys(REGISTRIES).sort())
	})

	it('каждый модификатор темы в src объявлен в index.d.ts', () => {
		const registries = declaredRegistries()
		const used = usedModifiers()

		expect(used.length, 'модификаторов темы в CSS не нашлось').toBeGreaterThan(0)

		const undeclared = used
			.filter(({ block, modifier, value }) => {
				const registry = Object.entries(REGISTRIES).find(
					([, target]) =>
						target.modifier === modifier &&
						(target.blocks === null || target.blocks.includes(block)),
				)

				return !registry || !registries.get(registry[0])?.has(value)
			})
			.map(({ selector }) => selector)

		expect(undeclared).toEqual([])
	})
})
