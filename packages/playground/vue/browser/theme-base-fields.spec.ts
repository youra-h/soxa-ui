/**
 * Theme-base without oren: Input-family fields, Tabs, Tags and Accordion.
 * Structure and behavior must work without theme borders, colors or views. These
 * tests check visible layout: tab bars follow orientation and logical position;
 * edge slots stay at the edges and alignment uses the remaining list space,
 * including RTL. Scrolling tags stay on one line and keyboard focus scrolls into
 * view. Input slots flank the field, NumberInput steps sit at its end, Textarea
 * grows up to maxRows and matches Input at one row. Closed Accordion content
 * takes no space; opened content follows its header.
 *
 * The file has an isolated page with base CSS only, checked by the first test.
 * Removing flex-direction from the vertical bar/list breaks vertical layouts.
 * Removing list flex-grow breaks trailing slots and center/end/stretch alignment.
 * Theme-covered tests could hide missing base rules; CSS guards cannot measure
 * layout, so this suite validates the structural contract directly.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from './render'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, type VNode } from 'vue'
import type { TComponentSize, TTabsAlignment, TTabsOrientation, TTabsPosition } from '@soxa-ui/core'
import { COMPONENT_SIZES, TABS_ALIGNMENTS } from '@soxa-ui/playground-shared'
import {
	Accordion,
	AccordionItem,
	Input,
	NumberInput,
	Tabs,
	TabsContent,
	TabsItem,
	Tags,
	Textarea,
} from '@soxa-ui/vue'

import '@soxa-ui/theme-base'

/** Допуск на субпиксельное округление координат, px. */
const EPSILON = 0.5

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/** Разметка на странице и кадры: узлы плагины получают по `ready`, кадром. */
async function show(content: () => VNode | VNode[], dir?: 'ltr' | 'rtl'): Promise<void> {
	render(
		defineComponent({
			render: () => h('div', { dir, style: 'padding: 16px; width: 480px' }, content()),
		}),
	)

	await nextTick()
	await nextFrame()
	await nextFrame()
}

/** Узел по селектору; нет его — тест падает здесь, а не на чтении свойства. */
function find(selector: string, root: ParentNode = document): HTMLElement {
	const element = root.querySelector(selector)

	if (!(element instanceof HTMLElement)) throw new Error(`${selector}: HTML-узла нет`)

	return element
}

const box = (element: Element) => element.getBoundingClientRect()

/** Сторона метки в слоте, px. */
const MARK_SIZE = 16

/** Метка в слоте: блок своего размера, по ней видно, где стоит слот. */
const mark = (name: string) =>
	h('span', {
		class: `so-test-${name}`,
		style: `display: block; width: ${MARK_SIZE}px; height: ${MARK_SIZE}px`,
	})

/** Начало и конец строки на экране: в RTL начало — справа. */
const edges = (dir: 'ltr' | 'rtl', outer: DOMRect, inner: DOMRect) =>
	dir === 'ltr'
		? { start: inner.left - outer.left, end: outer.right - inner.right }
		: { start: outer.right - inner.right, end: inner.left - outer.left }

/** `b` стоит после `a` по направлению строки. */
const after = (dir: 'ltr' | 'rtl', a: DOMRect, b: DOMRect) =>
	dir === 'ltr' ? b.left >= a.right - EPSILON : b.right <= a.left + EPSILON

afterEach(() => {
	cleanup()
})

describe('страница — только общий слой тем', () => {
	it('переменные базы на месте, токенов темы нет', () => {
		const root = getComputedStyle(document.documentElement)

		expect(root.getPropertyValue('--so-input-height-normal')).not.toBe('')
		expect(root.getPropertyValue('--so-tabs-gap')).toBe('')
		expect(root.getPropertyValue('--so-component-text')).toBe('')
		expect(root.getPropertyValue('--so-neutral-500')).toBe('')
	})
})

const TABS = ['Настройки', 'Почта', 'Архив']

/** Табы набора, первый — активный. */
const tabItems = () =>
	TABS.map((text, index) =>
		h(TabsItem, { key: text, value: String(index), text, active: index === 0 }),
	)

describe('Tabs — ряд с заданной стороны от панели', () => {
	type TSide = 'top' | 'left' | 'right'

	/**
	 * Сторона — только у вертикальных (`position` горизонтальным модификатора
	 * не даёт): горизонтальный ряд всегда над панелью. Вертикальный у начала
	 * строки — слева в LTR и справа в RTL, у конца — наоборот.
	 */
	const CASES: readonly {
		orientation: TTabsOrientation
		position: TTabsPosition
		dir: 'ltr' | 'rtl'
		side: TSide
	}[] = [
		{ orientation: 'horizontal', position: 'start', dir: 'ltr', side: 'top' },
		{ orientation: 'horizontal', position: 'end', dir: 'ltr', side: 'top' },
		{ orientation: 'horizontal', position: 'start', dir: 'rtl', side: 'top' },
		{ orientation: 'vertical', position: 'start', dir: 'ltr', side: 'left' },
		{ orientation: 'vertical', position: 'end', dir: 'ltr', side: 'right' },
		{ orientation: 'vertical', position: 'start', dir: 'rtl', side: 'right' },
		{ orientation: 'vertical', position: 'end', dir: 'rtl', side: 'left' },
	]

	/** Где ряд относительно панели на экране. */
	const SIDES: Record<TSide, (bar: DOMRect, panel: DOMRect) => boolean> = {
		top: (bar, panel) => bar.bottom <= panel.top + EPSILON,
		left: (bar, panel) => bar.right <= panel.left + EPSILON,
		right: (bar, panel) => panel.right <= bar.left + EPSILON,
	}

	it.each(CASES)(
		'$orientation, position $position, $dir: ряд — $side от панели, табы — по оси ориентации',
		async ({ orientation, position, dir, side }) => {
			await show(
				() =>
					h(
						Tabs,
						{ orientation, position },
						{
							default: tabItems,
							content: () => h(TabsContent, { value: '0' }, () => 'Панель'),
						},
					),
				dir,
			)

			const bar = box(find('.so-tabs__bar'))
			const panel = box(find('.so-tabs-content'))

			expect(SIDES[side](bar, panel), `ряд — ${side} от панели`).toBe(true)

			const items = [...document.querySelectorAll('.so-tabs__list > .so-tabs-item')].map(box)

			expect(items).toHaveLength(TABS.length)

			for (let index = 1; index < items.length; index++) {
				const [prev, next] = [items[index - 1], items[index]]

				if (orientation === 'vertical') {
					// Столбцом: следующий таб — под предыдущим
					expect(next.top, `таб ${index + 1} — под таб ${index}`).toBeGreaterThan(
						prev.bottom - EPSILON,
					)
				} else {
					// В строку по её направлению: в LTR следующий — правее, в RTL — левее
					expect(
						Math.abs(next.top - prev.top),
						`таб ${index + 1} — в строке`,
					).toBeLessThanOrEqual(EPSILON)
					expect(
						dir === 'ltr' ? next.left : prev.left,
						`таб ${index + 1} — после таба ${index}`,
					).toBeGreaterThan((dir === 'ltr' ? prev.right : next.right) - EPSILON)
				}
			}
		},
	)
})

describe('Tabs — слоты у краёв ряда, табы между ними по выравниванию', () => {
	/** Какие слоты заданы. */
	type TSlots = 'нет' | 'leading' | 'trailing' | 'оба'

	const SLOTS: Record<TSlots, { leading: boolean; trailing: boolean }> = {
		нет: { leading: false, trailing: false },
		leading: { leading: true, trailing: false },
		trailing: { leading: false, trailing: true },
		оба: { leading: true, trailing: true },
	}

	const SLOT_SETS = Object.keys(SLOTS).filter((name): name is TSlots => name in SLOTS)

	type TCase = {
		orientation: TTabsOrientation
		alignment: TTabsAlignment
		slots: TSlots
		dir: 'ltr' | 'rtl'
	}

	/**
	 * Горизонтальные — в обоих направлениях: в RTL начало ряда справа. У
	 * вертикальных ось — столбец, и направления письма она не касается: они —
	 * в одном. Вертикальному набору задана высота больше табов, иначе ряд был
	 * бы высотой с табы, и выравнивать было бы нечего.
	 */
	const CASES: readonly TCase[] = TABS_ALIGNMENTS.flatMap((alignment) =>
		SLOT_SETS.flatMap((slots): TCase[] => [
			{ orientation: 'horizontal', alignment, slots, dir: 'ltr' },
			{ orientation: 'horizontal', alignment, slots, dir: 'rtl' },
			{ orientation: 'vertical', alignment, slots, dir: 'ltr' },
		]),
	)

	/**
	 * Отрезок коробки по главной оси — от начала ряда к его концу. У
	 * горизонтальных в RTL начало справа, и отрезок берётся зеркально: числа
	 * растут к концу ряда в любом направлении.
	 */
	const span = ({ orientation, dir }: TCase, rect: DOMRect): [number, number] => {
		if (orientation === 'vertical') return [rect.top, rect.bottom]

		return dir === 'ltr' ? [rect.left, rect.right] : [-rect.right, -rect.left]
	}

	/** Длина слота своей ширины по главной оси: метка и собственное поле слота. */
	const ownLength = ({ orientation }: TCase, slot: HTMLElement): number => {
		const style = getComputedStyle(slot)
		const padding =
			orientation === 'vertical'
				? parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
				: parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)

		return MARK_SIZE + padding
	}

	/**
	 * Слоты стоят у краёв ряда, а место между ними забирает список, и табы
	 * выравниваются в нём: `start` — сразу за `leading` или от начала ряда,
	 * `end` — перед `trailing` или у конца, `center` — посередине между
	 * слотами, `stretch` — во всё место между слотами, а слоты своей ширины.
	 * «Сразу за слотом» — через тот же зазор, что между табами.
	 */
	it.each(CASES)('$orientation, $alignment, слоты: $slots, $dir', async (scenario) => {
		const { orientation, alignment, dir } = scenario
		const { leading, trailing } = SLOTS[scenario.slots]

		await show(
			() =>
				h(
					Tabs,
					{
						orientation,
						alignment,
						style: orientation === 'vertical' ? 'height: 320px' : undefined,
					},
					{
						default: tabItems,
						...(leading ? { leading: () => mark('leading') } : {}),
						...(trailing ? { trailing: () => mark('trailing') } : {}),
					},
				),
			dir,
		)

		const along = (element: Element) => span(scenario, box(element))
		const [barStart, barEnd] = along(find('.so-tabs__bar'))
		const tabs = [...document.querySelectorAll('.so-tabs__list > .so-tabs-item')].map(along)

		expect(tabs).toHaveLength(TABS.length)

		for (let index = 1; index < tabs.length; index++) {
			expect(tabs[index][0], `таб ${index + 1} — после таба ${index}`).toBeGreaterThanOrEqual(
				tabs[index - 1][1] - EPSILON,
			)
		}

		const gap = tabs[1][0] - tabs[0][1]
		const first = tabs[0][0]
		const last = tabs[tabs.length - 1][1]
		let from = barStart
		let to = barEnd

		if (leading) {
			const slot = find('.so-tabs__leading')
			const [start, end] = along(slot)

			expect(Math.abs(start - barStart), 'leading — у начала ряда').toBeLessThanOrEqual(
				EPSILON,
			)

			if (alignment === 'stretch') {
				expect(end - start, 'leading своей длины').toBeCloseTo(ownLength(scenario, slot), 0)
			}

			from = end + gap
		}

		if (trailing) {
			const slot = find('.so-tabs__trailing')
			const [start, end] = along(slot)

			expect(Math.abs(barEnd - end), 'trailing — у конца ряда').toBeLessThanOrEqual(EPSILON)

			if (alignment === 'stretch') {
				expect(end - start, 'trailing своей длины').toBeCloseTo(
					ownLength(scenario, slot),
					0,
				)
			}

			to = start - gap
		}

		expect(first, 'табы — не раньше места между слотами').toBeGreaterThanOrEqual(from - EPSILON)
		expect(last, 'табы — не дальше места между слотами').toBeLessThanOrEqual(to + EPSILON)

		if (alignment === 'start' || alignment === 'stretch') {
			expect(Math.abs(first - from), 'табы — от начала места').toBeLessThanOrEqual(EPSILON)
		}

		if (alignment === 'end' || alignment === 'stretch') {
			expect(Math.abs(to - last), 'табы — до конца места').toBeLessThanOrEqual(EPSILON)
		}

		if (alignment === 'center') {
			expect(first - from, 'табы отошли от начала места').toBeGreaterThan(EPSILON)
			expect(
				Math.abs(first - from - (to - last)),
				'табы — посередине между слотами',
			).toBeLessThanOrEqual(EPSILON)
		}
	})
})

describe('Tags — ряд scroll', () => {
	/** Тегов заведомо больше, чем влезает в узкий ряд. */
	const TAGS = ['Москва', 'Санкт-Петербург', 'Екатеринбург', 'Новосибирск', 'Владивосток']

	const tags = () =>
		h('div', { style: 'width: 260px' }, [
			h(Tags, {
				overflow: 'scroll',
				mode: 'single',
				items: TAGS.map((text) => ({ value: text, text })),
			}),
		])

	const row = () => find('.so-tags')
	const items = () => [...row().querySelectorAll<HTMLElement>(':scope > .so-tags-item')]

	/** Все теги в ряду: отрисовка идёт кадрами, поэтому через poll. */
	const settled = () => expect.poll(() => items().length).toBe(TAGS.length)

	/**
	 * Окно ряда — его паддинг-бокс без отступа прокрутки по строке: в него тег
	 * под фокусом доводит плагин ряда (`TTagsScrollPlugin`).
	 */
	function windowOf(element: HTMLElement): { left: number; right: number } {
		const style = getComputedStyle(element)
		const left = box(element).left + element.clientLeft

		return {
			left: left + parseFloat(style.scrollPaddingLeft),
			right: left + element.clientWidth - parseFloat(style.scrollPaddingRight),
		}
	}

	it('теги — одной строкой, ряд прокручивается вбок', async () => {
		await show(tags)
		await settled()

		const [first, ...rest] = items().map(box)

		for (const item of rest) expect(Math.abs(item.top - first.top)).toBeLessThanOrEqual(EPSILON)

		expect(row().scrollWidth, 'ряду тесно').toBeGreaterThan(row().clientWidth)

		row().scrollLeft = row().scrollWidth

		expect(row().scrollLeft, 'ряд прокрутился').toBeGreaterThan(0)
	})

	/**
	 * Стрелка переводит фокус на тег у края ряда, видимый частично, — и тег
	 * встаёт в окно целиком. Окно уже паддинг-бокса на запас под кольцо фокуса:
	 * тег встаёт не вплотную к краю.
	 */
	it('тег под фокусом с клавиатуры встаёт в окно ряда целиком', async () => {
		await show(tags)
		await settled()

		const area = windowOf(row())
		const cut = items().findIndex((item) => box(item).right > area.right + EPSILON)
		const target = items()[cut]

		if (!target || cut === 0) throw new Error('у конца ряда нет тега, видимого частично')

		// Вход в набор — на первый тег, дальше — стрелками до соседа срезанного
		await userEvent.keyboard('{Tab}')

		for (let step = 1; step < cut; step++) await userEvent.keyboard('{ArrowRight}')

		expect(row().scrollLeft, 'по видимым тегам ряд стоит').toBe(0)

		await userEvent.keyboard('{ArrowRight}')

		expect(target.contains(document.activeElement), 'фокус на срезанном теге').toBe(true)
		expect(row().scrollLeft, 'ряд докрутил тег').toBeGreaterThan(0)

		const view = windowOf(row())
		const tag = box(target)

		expect(view.right, 'окно уже ряда на запас').toBeLessThan(
			box(row()).left + row().clientLeft + row().clientWidth,
		)
		expect(tag.left).toBeGreaterThanOrEqual(view.left - EPSILON)
		expect(tag.right).toBeLessThanOrEqual(view.right + EPSILON)
	})
})

describe('Input — слоты у краёв, ввод между ними', () => {
	it.each(['ltr', 'rtl'] as const)('%s', async (dir) => {
		await show(
			() =>
				h(
					Input,
					{ style: 'width: 320px' },
					{ leading: () => mark('leading'), trailing: () => mark('trailing') },
				),
			dir,
		)

		const root = box(find('.so-input'))
		const leading = box(find('.so-input__leading'))
		const trailing = box(find('.so-input__trailing'))
		const field = box(find('.so-input > input'))

		// Слоты — у своих краёв: `leading` у начала строки, `trailing` у конца
		expect(edges(dir, root, leading).start, 'leading у начала').toBeLessThanOrEqual(EPSILON)
		expect(edges(dir, root, trailing).end, 'trailing у конца').toBeLessThanOrEqual(EPSILON)

		// Ввод — между ними и забирает всё место
		expect(after(dir, leading, field), 'ввод после leading').toBe(true)
		expect(after(dir, field, trailing), 'trailing после ввода').toBe(true)
		expect(field.width).toBeGreaterThan(root.width / 2)

		// Слоты — по центру коробки, ниже её
		for (const slot of [leading, trailing]) {
			expect(slot.height).toBeLessThan(root.height)
			expect(Math.abs(slot.top - root.top - (root.bottom - slot.bottom))).toBeLessThanOrEqual(
				EPSILON,
			)
		}
	})
})

describe('NumberInput — кнопки шага у конца поля', () => {
	it.each(['ltr', 'rtl'] as const)('%s', async (dir) => {
		await show(
			() => h(NumberInput, { style: 'width: 320px' }, { leading: () => mark('leading') }),
			dir,
		)

		const root = box(find('.so-number-input'))
		const leading = box(find('.so-number-input__leading'))
		const field = box(find('.so-number-input__input'))
		const stepper = box(find('.so-number-input__stepper'))
		const decrement = box(find('.so-number-input__decrement'))
		const increment = box(find('.so-number-input__increment'))

		expect(edges(dir, root, leading).start, 'leading у начала').toBeLessThanOrEqual(EPSILON)
		expect(edges(dir, root, stepper).end, 'кнопки шага у конца').toBeLessThanOrEqual(EPSILON)

		expect(after(dir, leading, field), 'ввод после leading').toBe(true)
		expect(after(dir, field, stepper), 'кнопки после ввода').toBe(true)

		// «Меньше», затем «больше» — вдоль строки число растёт к её концу
		expect(after(dir, decrement, increment), '«больше» после «меньше»').toBe(true)

		// Кнопки — квадраты в строку слота, ниже коробки
		for (const button of [decrement, increment]) {
			expect(Math.abs(button.width - button.height)).toBeLessThanOrEqual(EPSILON)
			expect(button.height).toBeLessThan(root.height)
		}
	})
})

describe('Textarea — высоту ведут строки', () => {
	/** Поле многострочного поля. */
	function field(): HTMLTextAreaElement {
		const node = document.querySelector('.so-textarea textarea')

		if (!(node instanceof HTMLTextAreaElement)) throw new Error('поля нет')

		return node
	}

	/** Высота поля в `count` строк: строки и поля текста по вычисленному стилю. */
	function heightOf(count: number): number {
		const style = getComputedStyle(field())

		return (
			count * parseFloat(style.lineHeight) +
			parseFloat(style.paddingTop) +
			parseFloat(style.paddingBottom)
		)
	}

	const height = () => box(field()).height

	it('растёт по строкам до maxRows, на потолке прокручивается', async () => {
		await show(() => h(Textarea, { autoresize: true, rows: 2, maxRows: 4 }))

		// Интерлиньяж — числом: по нему плагин автороста мерит строку
		expect(Number.isNaN(parseFloat(getComputedStyle(field()).lineHeight))).toBe(false)
		expect(height(), 'пустое — rows').toBeCloseTo(heightOf(2), 0)

		field().focus()
		await userEvent.keyboard('1{Enter}2{Enter}3')

		expect(height(), 'три строки').toBeCloseTo(heightOf(3), 0)

		await userEvent.keyboard('{Enter}4{Enter}5{Enter}6')

		expect(height(), 'потолок').toBeCloseTo(heightOf(4), 0)
		expect(field().scrollHeight).toBeGreaterThan(field().clientHeight)
	})

	it.each(COMPONENT_SIZES)('%s: в одну строку — высоты Input', async (size: TComponentSize) => {
		await show(() => [h(Textarea, { rows: 1, size }), h(Input, { size })])

		expect(box(find('.so-textarea')).height).toBeCloseTo(box(find('.so-input')).height, 0)
	})
})

describe('Accordion — место панели', () => {
	const sections = () =>
		h(Accordion, null, () =>
			['a', 'b'].map((value) =>
				h(
					AccordionItem,
					{ key: value, value, text: `Секция ${value}`, class: `so-test-${value}` },
					() => h('p', { class: `so-test-${value}-content` }, 'Содержимое секции'),
				),
			),
		)

	it('свёрнутая панель места не занимает, раскрытая — под заголовком', async () => {
		await show(sections)

		const header = () => box(find('.so-test-a > .so-accordion-item__header'))
		const body = () => box(find('.so-test-a > .so-accordion-item__body'))
		const next = () => box(find('.so-test-b > .so-accordion-item__header'))

		expect(body().height, 'свёрнутая').toBe(0)

		await userEvent.click(find('.so-test-a > .so-accordion-item__header'))
		await nextFrame()

		const content = box(find('.so-test-a-content'))

		expect(body().height, 'раскрытая').toBeGreaterThan(content.height - EPSILON)
		expect(body().top).toBeGreaterThanOrEqual(header().bottom - EPSILON)
		expect(content.top).toBeGreaterThanOrEqual(body().top - EPSILON)
		expect(next().top, 'следующая секция — под панелью').toBeGreaterThanOrEqual(
			body().bottom - EPSILON,
		)
	})
})
