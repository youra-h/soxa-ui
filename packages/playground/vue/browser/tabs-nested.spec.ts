/**
 * Nested Tabs must look like identical standalone Tabs: outer view, orientation,
 * alignment, and variant must not leak into them.
 *
 * Theme rules use child combinators for the bar (> .so-tabs__bar), list items
 * (> .so-tabs__bar > .so-tabs__list > .so-tabs-item), and panel
 * (> .so-tabs-content). See the Tabs section in themes/oren/AGENTS.md.
 * Descendant rules previously made nested horizontal tabs vertical, added line
 * indicators to contained tabs, gave line tabs outline borders, and inherited
 * outer variant colors.
 *
 * Compare computed styles with matching standalone Tabs in the same scene,
 * without hardcoding theme values. Collect differing properties and expect none.
 * View, orientation, and alignment matrices come from playground-shared lists
 * checked against the theme and core, so new values enter the matrix directly.
 *
 * Forced-color rules must also stay within their own root: an outer outline
 * previously painted a nested line indicator in text color, hiding it against
 * the list border.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from './render'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, type VNodeChild } from 'vue'
import type { ITabsProps, TTabsOrientation, TTabsView } from '@soxa-ui/core'
import { Tabs, TabsContent, TabsItem } from '@soxa-ui/vue'
import { TABS_ALIGNMENTS, ORIENTATIONS, TABS_VIEWS } from '@soxa-ui/playground-shared'

import { find, style } from './colors'
import { forcedColors } from './media'

import '@soxa-ui/theme-oren'

/** Оформление набора — всё, от чего тема рисует его вид. */
type TTabsLook = Pick<ITabsProps, 'view' | 'orientation' | 'variant' | 'alignment' | 'position'>

/** Внешние табы: первый активен, в его панели — внутренние. */
const OUTER = ['Внешний', 'Соседний']

/** Внутренние табы: первый активен — у него карточка, полоса и разрыв линии. */
const INNER = ['Один', 'Два', 'Три']

/** Набор табов: первый активен, панель первого — `content` (`panel`). */
const tabs = (look: TTabsLook, texts: readonly string[], panel: () => VNodeChild) =>
	h(Tabs, look, {
		default: () =>
			texts.map((text, index) =>
				h(TabsItem, { key: text, value: String(index), text, active: index === 0 }),
			),
		content: () => h(TabsContent, { value: '0' }, panel),
	})

/** Внутренние табы — одни и те же во вложенном месте и в эталоне. */
const inner = (look: TTabsLook) => tabs(look, INNER, () => 'Панель')

/** Сцена: внешние табы с внутренними в панели и эталон — такие же внутренние вне них. */
const scene = (outerLook: TTabsLook, innerLook: TTabsLook) =>
	defineComponent({
		render: () =>
			h('div', { style: 'width: 640px' }, [
				h('div', { class: 'so-test-away', style: 'height: 24px' }),
				h('div', { 'data-place': 'nested' }, [
					tabs(outerLook, OUTER, () => inner(innerLook)),
				]),
				h('div', { 'data-place': 'reference' }, [inner(innerLook)]),
			]),
	})

/** Корни наборов на сцене: внешние, вложенные и эталон. */
const roots = () => [...document.querySelectorAll('.so-tabs')]

const nested = () => find('[data-place="nested"] .so-tabs-content > .so-tabs')
const reference = () => find('[data-place="reference"] > .so-tabs')

const SIDES = ['top', 'right', 'bottom', 'left'] as const

/** Рамка — по каждой стороне: толщина и цвет. */
const BORDER = SIDES.flatMap((side) => [`border-${side}-width`, `border-${side}-color`])

/** Скругление — по каждому углу. */
const RADIUS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'].map(
	(corner) => `border-${corner}-radius`,
)

/** Ряд: направление, рамка линии, контейнер `contained`. */
const BAR = [
	'flex-direction',
	...BORDER,
	...SIDES.map((side) => `padding-${side}`),
	'background-color',
	...RADIUS,
]

/**
 * Псевдоэлементы ряда: полоса `line`, карточка `contained` и части линии
 * `outline` — есть ли они, видны ли и какого цвета.
 */
const BAR_MARK = ['content', 'visibility', 'background-color']

/** Список: направление и выравнивание табов. */
const LIST = ['flex-direction', 'justify-content']

/** Обёртка таба: рамка и скругление `outline`, фон карточки, растяжка `stretch`. */
const TAB = [...BORDER, ...RADIUS, 'background-color', 'flex-grow', 'justify-content']

/** Вуаль неактивного таба `outline` — `::before` обёртки. */
const TAB_VEIL = ['content', 'opacity']

/** Строка выбранного таба: цвет текста от варианта. */
const ROW = ['color']

/** Панель: поля горизонтальных и рост в ряду вертикальных. */
const PANEL = ['margin-block-start', 'margin-block-end', 'flex-grow']

/** Вычисленные свойства узла под именем места: `список border-top-width`. */
const read = (place: string, element: Element, properties: readonly string[], pseudo?: string) => {
	const computed = style(element, pseudo)

	return properties.map(
		(property) => [`${place} ${property}`, computed.getPropertyValue(property)] as const,
	)
}

/** Вид набора табов — всё, что тема рисует от его корня. */
function stylesOf(root: HTMLElement): Map<string, string> {
	const bar = find(':scope > .so-tabs__bar', root)
	const list = find(':scope > .so-tabs__list', bar)
	const items = [...list.querySelectorAll(':scope > .so-tabs-item')]
	const row = find(':scope > .so-tabs-item[data-selected="true"] > [role="tab"]', list)
	const panel = find(':scope > .so-tabs-content', root)

	return new Map([
		...read('ряд', bar, BAR),
		...read('ряд ::before', bar, BAR_MARK, '::before'),
		...read('ряд ::after', bar, BAR_MARK, '::after'),
		...read('список', list, LIST),
		...items.flatMap((item, index) => [
			...read(`таб ${index + 1}`, item, TAB),
			...read(`таб ${index + 1} ::before`, item, TAB_VEIL, '::before'),
		]),
		...read('строка выбранного таба', row, ROW),
		...read('панель', panel, PANEL),
	])
}

/** Чем вложенные табы отличаются от эталона: свойство, его значение у них и у эталона. */
function misses(): string[] {
	const own = stylesOf(nested())
	const expected = stylesOf(reference())

	return [...new Set([...own.keys(), ...expected.keys()])]
		.filter((key) => own.get(key) !== expected.get(key))
		.map((key) => `${key}: ${own.get(key)}, эталон — ${expected.get(key)}`)
}

/**
 * Переходы доиграли: фон выбранной обёртки `contained` гаснет переходом,
 * когда карточку начинает рисовать ряд, цвет строки — когда указатель
 * ушёл. Перебитый переход отменяется, и его `finished` отклонён: для ожидания
 * это тоже конец.
 */
const quiet = (): Promise<unknown> =>
	Promise.all(
		document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
	)

/**
 * Wait for geometry on all three roots (data-ready-animation). The contained
 * card is then the bar's pseudo-element. Move the pointer away and let transitions
 * finish before measuring the nested scene.
 */
async function show(outerLook: TTabsLook, innerLook: TTabsLook): Promise<void> {
	render(scene(outerLook, innerLook))

	await expect
		.poll(() => roots().filter((root) => root.getAttribute('data-ready-animation') === 'true'))
		.toHaveLength(3)
	await userEvent.hover(find('.so-test-away'))
	await quiet()
}

const ORIENTATION_NAMES: Record<TTabsOrientation, string> = {
	horizontal: 'горизонтальные',
	vertical: 'вертикальные',
}

/**
 * Внешние — с вариантом: его цвет внутренним доставаться не должен.
 * Вертикальные — ещё и у конца: у края свои правила рамки и линий.
 */
const outerOf = (view: TTabsView, orientation: TTabsOrientation): TTabsLook =>
	orientation === 'vertical'
		? { view, orientation, variant: 'accent', position: 'end' }
		: { view, orientation, variant: 'accent' }

/** Вид внешних × вид внутренних × ориентации тех и других. */
const VIEW_CASES = TABS_VIEWS.flatMap((outerView) =>
	ORIENTATIONS.flatMap((outerOrientation) =>
		TABS_VIEWS.flatMap((innerView) =>
			ORIENTATIONS.map((innerOrientation) => ({
				name: `${outerView} ${ORIENTATION_NAMES[outerOrientation]} → ${innerView} ${ORIENTATION_NAMES[innerOrientation]}`,
				outer: outerOf(outerView, outerOrientation),
				inner: { view: innerView, orientation: innerOrientation },
			})),
		),
	),
)

/**
 * Вариант внутренних — свой. Внешние — `caution`, внутренние — `accent`:
 * `caution` объявлен в теме позже, и правило внешних, доставшееся
 * внутренним, перебило бы их вариант одним порядком.
 */
const VARIANT_CASES = TABS_VIEWS.flatMap((outerView) =>
	TABS_VIEWS.map((innerView) => ({
		name: `${outerView} caution → ${innerView} accent`,
		outer: { view: outerView, variant: 'caution' } satisfies TTabsLook,
		inner: { view: innerView, variant: 'accent' } satisfies TTabsLook,
	})),
)

/** Выравнивание внешних — у списка и у его табов, внутренним оно не достаётся. */
const ALIGNMENT_CASES = TABS_ALIGNMENTS.flatMap((alignment) =>
	TABS_VIEWS.map((innerView) => ({
		name: `внешние ${alignment} → ${innerView}`,
		outer: { alignment } satisfies TTabsLook,
		inner: { view: innerView } satisfies TTabsLook,
	})),
)

/**
 * Принудительные цвета: вид внешних × вид внутренних, внешние в обеих
 * ориентациях. Ориентация внутренних системных цветов не меняет.
 */
const FORCED_CASES = TABS_VIEWS.flatMap((outerView) =>
	ORIENTATIONS.flatMap((outerOrientation) =>
		TABS_VIEWS.map((innerView) => ({
			name: `${outerView} ${ORIENTATION_NAMES[outerOrientation]} → ${innerView}`,
			outer: outerOf(outerView, outerOrientation),
			inner: { view: innerView } satisfies TTabsLook,
		})),
	),
)

beforeEach(() => {
	document.documentElement.dataset.soTheme = 'oren'
})

afterEach(async () => {
	cleanup()
	await forcedColors('none')
})

/**
 * Случаи — циклом, а не `it.each`: имя случая длиннее порога, после которого
 * подстановка `$name` в заголовке обрезает строку, и случаи стали бы
 * неотличимы в отчёте.
 */
describe('вид и ориентация внешних табов', () => {
	for (const { name, outer, inner } of VIEW_CASES) {
		it(`${name}: внутренние — как вне других`, async () => {
			await show(outer, inner)

			expect(misses()).toEqual([])
		})
	}
})

describe('вариант внутренних табов — свой', () => {
	for (const { name, outer, inner } of VARIANT_CASES) {
		it(`${name}: внутренние — как вне других`, async () => {
			await show(outer, inner)

			expect(misses()).toEqual([])
		})
	}
})

describe('выравнивание внешних табов', () => {
	for (const { name, outer, inner } of ALIGNMENT_CASES) {
		it(`${name}: внутренние — как вне других`, async () => {
			await show(outer, inner)

			expect(misses()).toEqual([])
		})
	}
})

describe('принудительные цвета', () => {
	for (const { name, outer, inner } of FORCED_CASES) {
		it(`${name}: внутренние — как вне других`, async () => {
			await forcedColors('active')
			await show(outer, inner)

			expect(misses()).toEqual([])
		})
	}
})
