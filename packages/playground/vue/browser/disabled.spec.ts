/**
 * Выключенный компонент в настоящем браузере — по вычисленной прозрачности и
 * поверхности.
 *
 * Выключенный компонент гаснет целиком — коробкой поля или корнем — одной
 * прозрачностью, как выключенный Button и коробка CheckBox. Выключенные части
 * внутри него — кнопки поля, теги, дни, строки, табы — выключены вместе с ним и
 * второй раз не гаснут: прозрачность выключенного ложится на поддерево один раз
 * (общий слой тем, `themes/base/src/disabled.css`). Раньше поля гасли только
 * вводом, рядом даты, числом и тире, а рамка, иконки слотов и стрелка Select
 * оставались прежними; Calendar, Table и Pagination гасли по частям, а
 * выключенные Tabs и Tags не гасли вовсе.
 *
 * Чисел темы спек не знает: эталон прозрачности — выключенный Button рядом,
 * эталон поверхности выключенного поля — выключенная коробка CheckBox того же
 * варианта. Каскада и прозрачности по предкам в jsdom нет.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from './render'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, type VNode } from 'vue'
import { createEngineTable } from '@soxa-ui/core'
import type { TTableCollection, TTableRecord } from '@soxa-ui/core'
import {
	Button,
	Calendar,
	CheckBox,
	DateInput,
	DatePicker,
	Icon,
	Input,
	ListBox,
	ListBoxItem,
	NumberInput,
	Pagination,
	Select,
	SelectItem,
	Switch,
	Table,
	Tabs,
	TabsContent,
	TabsItem,
	Tags,
	TagsItem,
	Textarea,
	Tree,
	roleIcon,
} from '@soxa-ui/vue'

import { find, settled, style } from './colors'

import '@soxa-ui/theme-oren'

type TProps = Record<string, unknown>

/** Обе схемы: правило у них общее, а поверхности разные. */
const SCHEMES = ['oren', 'oren-dark'] as const

/** Иконка слота — глиф строится один раз на модуль. */
const INFO = roleIcon('info')

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/** Таблица с выбором: у строки — чекбокс, у колонки — кнопка сортировки. */
function tableEngine(): TTableCollection {
	const engine = createEngineTable({
		items: [
			{ id: 1, name: 'Анна Смирнова', city: 'Казань' },
			{ id: 2, name: 'Борис Петров', city: 'Омск' },
		].map((data: TTableRecord) => ({ data })),
	})

	engine.extensions.columns.columns = [
		{ field: 'name', text: 'Имя', rowHeader: true, sortable: true },
		{ field: 'city', text: 'Город' },
	]
	engine.extensions.selection.mode = 'multiple'

	return engine
}

/** Компонент на проверку. */
type TCase = {
	readonly name: string
	/** Разметка компонента с пропсами состояния (`disabled`, `variant`). */
	readonly markup: (props: TProps) => VNode
	/** Пропсы, которые нужны каждому экземпляру своими (движок таблицы). */
	readonly own?: () => TProps
	/** Узел, который гаснет: коробка поля или корень. */
	readonly box: string
	/**
	 * Части, которые видно с прозрачностью эталона: прозрачность самой части,
	 * умноженная на прозрачность предков, — иконка слота, стрелка Select,
	 * кнопки поля, строки и дни.
	 */
	readonly parts: readonly string[]
	/** Выключенных частей внутри нет: проверять собственную прозрачность нечего. */
	readonly whole?: true
	/** Поле: поверхность выключенного — как у выключенной коробки CheckBox. */
	readonly surface?: true
	/** Поля внутри коробки без своей поверхности — и выключенными тоже. */
	readonly bare?: readonly string[]
	/** Дорисовался ли компонент: теги Select встают не сразу. */
	readonly ready?: () => boolean
}

const CASES: readonly TCase[] = [
	{
		name: 'Input',
		markup: (props) =>
			h(
				Input,
				{ value: 'Москва', clearable: true, aria_label: 'Город', ...props },
				{ leading: () => h(Icon, { tag: INFO, class: 'so-test-icon' }) },
			),
		box: '.so-input',
		parts: ['.so-test-icon', '.so-input__clear'],
		surface: true,
	},
	{
		name: 'Textarea',
		markup: (props) =>
			h(Textarea, { value: 'Текст', counter: true, aria_label: 'Отзыв', ...props }),
		box: '.so-textarea',
		parts: ['textarea', '.so-textarea__counter'],
		whole: true,
		surface: true,
	},
	{
		name: 'NumberInput',
		markup: (props) =>
			h(NumberInput, { value: 5, clearable: true, aria_label: 'Количество', ...props }),
		box: '.so-number-input',
		parts: [
			'.so-number-input__input',
			'.so-number-input__clear',
			'.so-number-input__decrement',
			'.so-number-input__increment',
		],
		surface: true,
	},
	{
		name: 'DateInput',
		markup: (props) =>
			h(DateInput, { value: '2026-05-12', clearable: true, aria_label: 'Дата', ...props }),
		box: '.so-date-input',
		parts: ['.so-date-input__segments', '.so-date-input__clear'],
		surface: true,
	},
	{
		name: 'DatePicker, одна дата',
		markup: (props) =>
			h(DatePicker, { value: '2026-05-12', clearable: true, aria_label: 'Дата', ...props }),
		box: '.so-date-picker__field',
		parts: ['.so-date-input__segments', '.so-date-picker__clear', '.so-date-picker__trigger'],
		surface: true,
	},
	{
		name: 'DatePicker, диапазон',
		markup: (props) =>
			h(DatePicker, {
				mode: 'range',
				value: ['2026-05-12', '2026-05-20'],
				clearable: true,
				aria_label: 'Период',
				...props,
			}),
		box: '.so-date-picker',
		parts: [
			'.so-date-input__segments',
			'.so-date-picker__dash',
			'.so-date-picker__clear',
			'.so-date-picker__trigger',
		],
		surface: true,
		bare: ['.so-date-picker__start', '.so-date-picker__end'],
	},
	{
		name: 'Select с тегами',
		markup: (props) =>
			h(Select, { mode: 'multiple', value: ['a'], clearable: true, ...props }, () => [
				h(SelectItem, { key: 'a', value: 'a', text: 'Москва' }),
				h(SelectItem, { key: 'b', value: 'b', text: 'Тверь' }),
			]),
		box: '.so-select__field',
		parts: ['.so-tags-item', '.so-input__clear', '.so-select__arrow'],
		surface: true,
		ready: () => document.querySelectorAll('.so-select .so-tags-item').length === 2,
	},
	{
		name: 'ListBox',
		markup: (props) =>
			h(ListBox, { value: 'b', ...props }, () => [
				h(ListBoxItem, { key: 'a', value: 'a', text: 'Москва' }),
				h(ListBoxItem, { key: 'b', value: 'b', text: 'Тверь' }),
			]),
		box: '.so-list-box',
		parts: ['.so-list-box-item > .so-button'],
	},
	{
		name: 'Tree',
		markup: (props) =>
			h(Tree, {
				items: [
					{
						value: 'files',
						text: 'Files',
						children: [{ value: 'readme', text: 'Readme', disabled: true }],
					},
				],
				expanded: ['files'],
				guides: true,
				aria_label: 'Files',
				...props,
			}),
		box: '.so-tree',
		parts: ['.so-tree-item__row', '.so-tree-item__group'],
	},
	{
		name: 'Tabs',
		markup: (props) =>
			h(Tabs, props, {
				default: () => [
					h(TabsItem, { key: 'a', value: 'a', text: 'Один', active: true }),
					h(TabsItem, { key: 'b', value: 'b', text: 'Два' }),
				],
				content: () => h(TabsContent, { value: 'a' }, () => h('p', 'Панель')),
			}),
		box: '.so-tabs__bar',
		parts: ['.so-tabs-item[data-selected="true"] > .so-button'],
	},
	{
		name: 'Tags',
		markup: (props) =>
			h(Tags, { closable: true, mode: 'multiple', ...props }, () => [
				h(TagsItem, { key: 'a', value: 'a', text: 'Настройки' }),
				h(TagsItem, { key: 'b', value: 'b', text: 'Почта', selected: true }),
			]),
		box: '.so-tags',
		parts: ['.so-tags-item'],
	},
	{
		name: 'Table',
		markup: (props) => h(Table, { aria_label: 'Сотрудники', ...props }),
		own: () => ({ engine: tableEngine() }),
		box: '.so-table',
		parts: ['.so-table-column__text', '.so-table-row__cell', '.so-check-box__container'],
	},
	{
		name: 'Calendar',
		markup: (props) => h(Calendar, { months: ['2026-05-01'], value: '2026-05-12', ...props }),
		box: '.so-calendar',
		parts: ['.so-calendar__weekday', '.so-calendar-item', '.so-calendar__next'],
	},
	{
		name: 'Pagination',
		markup: (props) =>
			h(Pagination, { total: 100, value: 5, aria_label: 'Страницы', ...props }),
		box: '.so-pagination',
		parts: [
			'.so-pagination__prev',
			'.so-pagination-item > .so-button',
			'.so-pagination__ellipsis',
		],
	},
]

/** Варианты поля: нейтраль — поле без варианта — и вариант со своим цветом. */
const VARIANTS = [
	{ name: 'нейтраль', variant: undefined },
	{ name: 'accent', variant: 'accent' },
] as const

/** Эталон прозрачности — выключенный Button. */
const REFERENCE = '.so-test-reference'

/**
 * Сцена случая: эталоны и компонент выключенным и включённым — каждый в
 * обёртке с именем состояния. Эталон поверхности — выключенная коробка
 * CheckBox с теми же пропсами (вариантом). Над всем — место, куда уводится
 * указатель: наведение красит рамку, а сцены монтируются на одном месте.
 */
async function show(item: TCase, props: TProps = {}): Promise<void> {
	const off = { ...item.own?.(), ...props, disabled: true }
	const on = { ...item.own?.(), ...props, disabled: false }

	render(
		defineComponent({
			render: () =>
				h('div', { style: 'width: 720px; padding: 16px' }, [
					h('div', { class: 'so-test-away', style: 'height: 24px' }),
					h(Button, { class: 'so-test-reference', text: 'Эталон', disabled: true }),
					h(CheckBox, { class: 'so-test-check-box', disabled: true, ...props }),
					h('div', { 'data-case': 'off' }, [item.markup(off)]),
					h('div', { 'data-case': 'on' }, [item.markup(on)]),
				]),
		}),
	)

	await nextTick()
	await nextFrame()
	await nextFrame()

	if (item.ready) await expect.poll(item.ready).toBe(true)

	await userEvent.hover(find('.so-test-away'))
	await settled(document.body)
}

/** Собственная прозрачность узла. */
const own = (element: Element): number => parseFloat(style(element).opacity)

/** Прозрачность, с которой узел виден на странице: своя, умноженная на прозрачность всех предков. */
const visible = (element: Element): number => {
	let opacity = 1

	for (let node: Element | null = element; node; node = node.parentElement) {
		opacity *= own(node)
	}

	return opacity
}

/** Узел состояния случая: внутри обёртки выключенного или включённого. */
const inCase = (state: 'off' | 'on', selector: string) => find(`[data-case="${state}"] ${selector}`)

/** Все узлы выключенного случая по селектору; нет ни одного — тест падает здесь. */
const allOff = (selector: string): Element[] => {
	const elements = [...document.querySelectorAll(`[data-case="off"] ${selector}`)]

	if (elements.length === 0) throw new Error(`${selector}: узлов нет`)

	return elements
}

/** Имя узла в сообщении проверки: класс или тег. */
const label = (element: Element): string =>
	element.classList.length > 0 ? `.${[...element.classList].join('.')}` : element.tagName

afterEach(() => {
	cleanup()
})

describe.each(SCHEMES)('схема %s', (scheme) => {
	beforeEach(() => {
		document.documentElement.dataset.soTheme = scheme
	})

	it('disabled Tabs keep panel content readable and tab buttons disabled', async () => {
		const tabs = CASES.find((item) => item.name === 'Tabs')
		if (!tabs) throw new Error('Missing Tabs fixture')

		await show(tabs)

		expect(visible(inCase('off', '.so-tabs-content p'))).toBe(1)
		expect(style(inCase('off', '.so-tabs')).pointerEvents).toBe('none')
		for (const button of allOff('.so-tabs-item > .so-button')) {
			expect((button as HTMLButtonElement).disabled).toBe(true)
		}
	})

	describe.each(CASES)('$name', (item) => {
		/**
		 * Гаснет коробка или корень — с прозрачностью эталона, и видна она так
		 * же: предки сверху её не гасят. Включённый не гаснет вовсе.
		 */
		it('выключенный гаснет целиком, как эталон, включённый — нет', async () => {
			await show(item)

			const reference = find(REFERENCE)

			expect(own(reference), 'эталон гаснет').toBeLessThan(1)
			expect(own(inCase('off', item.box)), 'выключенный').toBe(own(reference))
			expect(visible(inCase('off', item.box)), 'выключенный с предками').toBeCloseTo(
				visible(reference),
				3,
			)
			expect(own(inCase('on', item.box)), 'включённый').toBe(1)
		})

		/**
		 * Выключенные части выключены вместе с компонентом и под ним второй раз
		 * не гаснут: своя прозрачность у каждой — 1.
		 */
		if (!item.whole) {
			it('выключенное внутри второй раз не гаснет', async () => {
				await show(item)

				const nested = [
					...inCase('off', item.box).querySelectorAll('[data-disabled="true"]'),
				]

				expect(nested.length, 'выключенные части').toBeGreaterThan(0)

				for (const element of nested) {
					expect(own(element), label(element)).toBe(1)
				}
			})
		}

		/** Иконка слота, стрелка, кнопки, строки — видны так же, как эталон. */
		it('части видны с прозрачностью эталона', async () => {
			await show(item)

			const reference = visible(find(REFERENCE))

			for (const selector of item.parts) {
				for (const element of allOff(selector)) {
					expect(visible(element), `${selector}: ${label(element)}`).toBeCloseTo(
						reference,
						3,
					)
				}
			}
		})

		/**
		 * Поверхность выключенного поля — ступень своего варианта, как у
		 * выключенной коробки CheckBox: выключенные поле и флажок в одной форме
		 * выглядят одинаково. Поля внутри коробки диапазона своей поверхности не
		 * рисуют и выключенными: она у коробки.
		 */
		if (item.surface) {
			it.each(VARIANTS)(
				'$name: поверхность — как у выключенной коробки CheckBox',
				async ({ variant }) => {
					await show(item, { variant })

					const sample = style(
						find('.so-test-check-box .so-check-box__container'),
					).backgroundColor

					expect(style(inCase('off', item.box)).backgroundColor).toBe(sample)
					expect(style(inCase('on', item.box)).backgroundColor, 'включённое').not.toBe(
						sample,
					)

					for (const selector of item.bare ?? []) {
						for (const element of allOff(selector)) {
							expect(style(element).backgroundColor, selector).toBe(
								'rgba(0, 0, 0, 0)',
							)
						}
					}
				},
			)
		}
	})
})

/**
 * Свой вид у части в другом состоянии не отменяет гашения выключенной.
 * Выключенное гасит общий слой тем, а его правила лежат в слое, и правило
 * темы вне слоёв перекрывает их при любой специфичности. Вид, который тема
 * рисует части прозрачностью — дорожка Switch только для чтения тише,
 * неактивный таб тише, — у выключенной части гашения не перекрывает: тема
 * пишет его только включённым. Таб проверяет случай Tabs выше (строка
 * активного таба), здесь — Switch, выключенный и только для чтения сразу.
 */
describe('вид части не перекрывает гашения выключенной', () => {
	it.each(SCHEMES)('%s: Switch только для чтения гаснет как выключенный', async (scheme) => {
		document.documentElement.dataset.soTheme = scheme

		render(
			defineComponent({
				render: () =>
					h('div', { style: 'padding: 16px' }, [
						h(Button, { class: 'so-test-reference', text: 'Эталон', disabled: true }),
						h(Switch, { class: 'so-test-off', disabled: true, readonly: true }),
						h(Switch, { class: 'so-test-readonly', readonly: true }),
					]),
			}),
		)

		await nextTick()
		await nextFrame()

		const reference = own(find(REFERENCE))

		expect(own(find('.so-test-off .so-switch__track')), 'выключенный').toBe(reference)
		expect(own(find('.so-test-readonly .so-switch__track')), 'только для чтения').toBeLessThan(
			1,
		)
		expect(own(find('.so-test-readonly .so-switch__track'))).not.toBe(reference)
	})
})
