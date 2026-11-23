/**
 * Общий слой тем без темы — слои поверх страницы: страница только с CSS базы
 * (`@soxa-ui/theme-base`), без `@soxa-ui/theme-oren`.
 *
 * Структура Popover, Select, Dialog и Drawer — раскладка и механика — лежит в
 * базе, а облик и движение в теме (`packages/themes/base/AGENTS.md`, «Перенос
 * структуры»). Без темы слои голые — без поверхности, кромки и проявления, —
 * но рабочие, и здесь это проверяется тем, что видит пользователь, а не
 * числами базы: закрытая панель Popover и Select не ловит нажатий на своём
 * месте, пока тема её гасит; тело окна Dialog прокручивается, а шапка и подвал
 * стоят на месте, кнопка закрытия — в строке заголовка, а подложка закрывает
 * страницу; панель Drawer стоит у своего края при каждом `placement`, и в RTL
 * тоже; панель Popover с `contained` — в своём контейнере, у своего края.
 * Спеки с темой держат базу под темой, и потерянное ею правило тема могла бы
 * закрыть своим, а сторожа CSS (`themes/base/__tests__/`) раскладки не
 * считают.
 *
 * Гаснет закрытая панель только у темы: без перехода разметка прячет её сразу,
 * и нажатию на её месте попадать некуда. Пока тема её гасит, закрытая панель
 * ещё в раскладке, и проверка закрытой панели держит её там правилом страницы.
 * Не переходом `display`, как у темы: закрытую панель, чей `display` идёт
 * переходом к `none`, Chromium прогона сам не отдаёт нажатию, и проверка
 * прошла бы и без правила базы, — а нажатие сквозь закрытую панель держит
 * правило базы, а не поведение одного браузера.
 *
 * Страница у файла спека своя (`isolate` прогона), и листа темы на ней нет —
 * это проверяет первый тест. Проверен поломкой: без правила закрытой панели в
 * базе (`pointer-events` у `[data-open='false']`, `anchored.css`) нажатие на
 * месте закрытой панели достаётся ей, и падают оба случая.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from './render'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, type VNode } from 'vue'
import type { TDrawerPlacement, TPopoverEdge } from '@soxa-ui/core'
import type { DescriptorSlots, PopoverDescriptor } from '@soxa-ui/setup'
import { Button, Dialog, Drawer, Popover, Select, SelectItem } from '@soxa-ui/vue'

import '@soxa-ui/theme-base'

type TTriggerScope = DescriptorSlots<typeof PopoverDescriptor>['trigger']

/** Допуск на субпиксельное округление координат, px. */
const EPSILON = 1

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/** Разметка на странице и кадры: узлы плагины получают по `ready`, кадром. */
async function show(content: () => VNode | VNode[]): Promise<void> {
	render(defineComponent({ render: () => h('div', { style: 'padding: 40px' }, content()) }))

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

/** Ширина и высота окна без полосы прокрутки — область `position: fixed`. */
const viewport = () => ({
	width: document.documentElement.clientWidth,
	height: document.documentElement.clientHeight,
})

/** Узел под серединой прямоугольника — туда пришлось бы нажатие. */
const hitAt = (rect: DOMRect) =>
	document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)

/** Абзацы с номером: последний помечен, по нему видно, докрутилось ли. */
const paragraphs = (count: number) =>
	Array.from({ length: count }, (_, index) =>
		h(
			'p',
			{ class: index === count - 1 ? 'so-test-last' : undefined },
			`Абзац ${index + 1}: содержимое окна, которое не помещается целиком.`,
		),
	)

afterEach(() => {
	cleanup()
	document.documentElement.removeAttribute('dir')
})

describe('страница — только общий слой тем', () => {
	it('переменные базы на месте, токенов темы нет', () => {
		const root = getComputedStyle(document.documentElement)

		expect(root.getPropertyValue('--so-popover-max-width')).not.toBe('')
		expect(root.getPropertyValue('--so-modal-padding')).toBe('')
		expect(root.getPropertyValue('--so-component-surface')).toBe('')
		expect(root.getPropertyValue('--so-neutral-500')).toBe('')
	})
})

/**
 * Закрытая панель в раскладке — как у темы, которая гасит её переходом:
 * разметка прячет закрытую (`display: none` инлайном), а правило страницы
 * оставляет ей тот `display`, что у открытой. Снимает правило возвращённая
 * функция.
 */
function keepClosedInLayout(): () => void {
	const sheet = document.createElement('style')

	sheet.textContent = `
		.so-popover__panel[data-open='false'] {
			display: flex !important;
		}

		.so-select__panel[data-open='false'] {
			display: block !important;
		}
	`
	document.head.append(sheet)

	return () => sheet.remove()
}

describe('закрытая панель нажатий не ловит', () => {
	/**
	 * Открытая панель нажатие ловит: середина панели — её узел. Закрытая, пока
	 * гаснет, — ещё на месте, но нажатие в её середину достаётся тому, что под
	 * ней.
	 */
	async function expectLetsClicksThrough(
		panel: () => HTMLElement,
		open: () => Promise<unknown>,
		close: () => Promise<unknown>,
	): Promise<void> {
		await open()
		await expect.poll(() => panel().dataset.open).toBe('true')
		await nextFrame()

		const rect = box(panel())

		expect(rect.width * rect.height, 'у открытой панели есть место').toBeGreaterThan(0)
		expect(panel().contains(hitAt(rect)), 'открытая ловит нажатие').toBe(true)

		// До открытия правила нет: закрытая с самого начала панель встала бы
		// там, где её ещё не ставил якорь
		const restore = keepClosedInLayout()

		try {
			await close()
			await expect.poll(() => panel().dataset.open).toBe('false')

			const closed = box(panel())

			expect(getComputedStyle(panel()).display, 'закрытая ещё в раскладке').not.toBe('none')
			expect(
				Math.abs(closed.top - rect.top) + Math.abs(closed.left - rect.left),
				'закрытая — на месте открытой',
			).toBeLessThan(EPSILON)
			expect(panel().contains(hitAt(rect)), 'нажатие — мимо закрытой').toBe(false)
		} finally {
			restore()
		}
	}

	it('Popover', async () => {
		await show(() =>
			h(
				Popover,
				{ aria_label: 'Проверка' },
				{
					trigger: ({ triggerAria, triggerDataset }: TTriggerScope) =>
						h(Button, {
							text: 'Открыть',
							class: 'so-test-trigger',
							...triggerAria,
							...triggerDataset,
						}),
					default: () => h('p', 'Содержимое панели, по которому можно нажать.'),
				},
			),
		)

		await expectLetsClicksThrough(
			() => find('.so-popover__panel'),
			() => userEvent.click(find('.so-test-trigger')),
			() => userEvent.keyboard('{Escape}'),
		)
	})

	it('Select', async () => {
		await show(() =>
			h(
				'div',
				{ style: 'width: 320px' },
				h(Select, null, () =>
					['Москва', 'Тверь', 'Тула'].map((text, index) =>
						h(SelectItem, { key: text, value: String(index), text }),
					),
				),
			),
		)

		await expectLetsClicksThrough(
			() => find('.so-select__panel'),
			() => userEvent.click(find('.so-select__field input')),
			() => userEvent.keyboard('{Escape}'),
		)
	})
})

describe('Dialog — прокручивается тело', () => {
	it('шапка и подвал на месте, кнопка закрытия — в строке заголовка, подложка закрывает страницу', async () => {
		await show(() =>
			h(
				Dialog,
				{ visible: true },
				{
					title: () => 'Настройки',
					default: () => paragraphs(40),
					footer: () => h(Button, { text: 'Готово' }),
				},
			),
		)

		const dialog = find('.so-dialog')
		const title = find('.so-dialog__title')
		const body = find('.so-dialog__body')
		const footer = find('.so-dialog__footer')
		const close = find('.so-dialog__close')
		const screen = viewport()

		// Окно — в экране: длинное содержимое не выносит его за край
		expect(box(dialog).top).toBeGreaterThanOrEqual(-EPSILON)
		expect(box(dialog).bottom).toBeLessThanOrEqual(screen.height + EPSILON)

		// Шапка, тело и подвал — сверху вниз
		expect(box(title).bottom).toBeLessThanOrEqual(box(body).top + EPSILON)
		expect(box(body).bottom).toBeLessThanOrEqual(box(footer).top + EPSILON)

		// Кнопка закрытия — у конца строки заголовка, по центру его первой
		// строки
		const titleStyle = getComputedStyle(title)
		const line =
			box(title).top +
			parseFloat(titleStyle.paddingTop) +
			parseFloat(titleStyle.lineHeight) / 2

		expect(box(close).left, 'кнопка — после заголовка').toBeGreaterThanOrEqual(
			box(title).right - EPSILON,
		)
		expect(Math.abs(box(close).top + box(close).height / 2 - line)).toBeLessThanOrEqual(EPSILON)

		// Прокручивается тело, а не окно
		expect(body.scrollHeight, 'телу тесно').toBeGreaterThan(body.clientHeight)

		const before = { title: box(title), footer: box(footer), close: box(close) }

		body.scrollTop = body.scrollHeight
		await nextFrame()

		expect(body.scrollTop, 'тело прокрутилось').toBeGreaterThan(0)
		expect(dialog.scrollTop, 'окно стоит').toBe(0)
		expect(Math.abs(box(title).top - before.title.top), 'шапка на месте').toBeLessThanOrEqual(
			EPSILON,
		)
		expect(
			Math.abs(box(footer).top - before.footer.top),
			'подвал на месте',
		).toBeLessThanOrEqual(EPSILON)
		expect(Math.abs(box(close).top - before.close.top), 'кнопка на месте').toBeLessThanOrEqual(
			EPSILON,
		)
		expect(box(find('.so-test-last')).bottom, 'докрутилось до конца').toBeLessThanOrEqual(
			box(body).bottom + EPSILON,
		)

		// Мимо окна — подложка: к странице нажатие не доходит
		expect(document.elementFromPoint(4, 4)).toBe(find('.so-backdrop:has(+ .so-dialog)'))
	})
})

describe('Drawer — у своего края', () => {
	type TSide = 'left' | 'right' | 'top' | 'bottom'

	const CASES: readonly { placement: TDrawerPlacement; dir: 'ltr' | 'rtl'; side: TSide }[] = [
		{ placement: 'start', dir: 'ltr', side: 'left' },
		{ placement: 'end', dir: 'ltr', side: 'right' },
		{ placement: 'start', dir: 'rtl', side: 'right' },
		{ placement: 'end', dir: 'rtl', side: 'left' },
		{ placement: 'top', dir: 'ltr', side: 'top' },
		{ placement: 'bottom', dir: 'ltr', side: 'bottom' },
	]

	it.each(CASES)('$placement, $dir: панель — у края $side', async ({ placement, dir, side }) => {
		document.documentElement.setAttribute('dir', dir)

		await show(() =>
			h(
				Drawer,
				{ visible: true, placement },
				{ title: () => 'Фильтры', default: () => h('p', 'Содержимое панели') },
			),
		)

		const panel = box(find('.so-drawer'))
		const screen = viewport()
		const near = (a: number, b: number) => Math.abs(a - b) <= EPSILON

		const atEdge: Record<TSide, boolean> = {
			left: near(panel.left, 0),
			right: near(panel.right, screen.width),
			top: near(panel.top, 0),
			bottom: near(panel.bottom, screen.height),
		}

		expect(atEdge[side], `панель у края ${side}`).toBe(true)

		if (side === 'left' || side === 'right') {
			// Во всю высоту, а ширина — своя: страница за панелью видна
			expect(near(panel.top, 0) && near(panel.bottom, screen.height), 'во всю высоту').toBe(
				true,
			)
			expect(panel.width).toBeLessThan(screen.width)
		} else {
			expect(near(panel.left, 0) && near(panel.right, screen.width), 'во всю ширину').toBe(
				true,
			)
			expect(panel.height).toBeLessThan(screen.height)
		}
	})
})

describe('Popover с contained — в своём контейнере', () => {
	type TSide = 'left' | 'right' | 'top' | 'bottom'

	const CASES: readonly { edge: TPopoverEdge; dir: 'ltr' | 'rtl'; side: TSide }[] = [
		{ edge: 'top', dir: 'ltr', side: 'top' },
		{ edge: 'bottom', dir: 'ltr', side: 'bottom' },
		{ edge: 'start', dir: 'ltr', side: 'left' },
		{ edge: 'end', dir: 'ltr', side: 'right' },
		{ edge: 'start', dir: 'rtl', side: 'right' },
	]

	it.each(CASES)(
		'edge $edge, $dir: панель — у края $side контейнера',
		async ({ edge, dir, side }) => {
			await show(() =>
				h(
					'div',
					{
						class: 'so-test-host',
						dir,
						style: 'position: relative; width: 400px; height: 300px',
					},
					h(
						Popover,
						{ aria_label: 'Проверка', contained: true, edge },
						{
							trigger: ({ triggerAria, triggerDataset }: TTriggerScope) =>
								h(Button, {
									text: 'Открыть',
									class: 'so-test-trigger',
									...triggerAria,
									...triggerDataset,
								}),
							default: () => h('p', 'Короткое содержимое'),
						},
					),
				),
			)

			await userEvent.click(find('.so-test-trigger'))
			await expect.poll(() => find('.so-popover__panel').dataset.open).toBe('true')
			await nextFrame()

			const host = box(find('.so-test-host'))
			const panel = box(find('.so-popover__panel'))
			const near = (a: number, b: number) => Math.abs(a - b) <= EPSILON

			// В контейнере целиком
			expect(panel.left).toBeGreaterThanOrEqual(host.left - EPSILON)
			expect(panel.right).toBeLessThanOrEqual(host.right + EPSILON)
			expect(panel.top).toBeGreaterThanOrEqual(host.top - EPSILON)
			expect(panel.bottom).toBeLessThanOrEqual(host.bottom + EPSILON)

			const atEdge: Record<TSide, boolean> = {
				left: near(panel.left, host.left),
				right: near(panel.right, host.right),
				top: near(panel.top, host.top),
				bottom: near(panel.bottom, host.bottom),
			}

			expect(atEdge[side], `панель у края ${side}`).toBe(true)

			// Вдоль края — во всю его длину, поперёк — по содержимому
			if (side === 'top' || side === 'bottom') {
				expect(
					near(panel.left, host.left) && near(panel.right, host.right),
					'во всю ширину',
				).toBe(true)
				expect(panel.height).toBeLessThan(host.height)
			} else {
				expect(
					near(panel.top, host.top) && near(panel.bottom, host.bottom),
					'во всю высоту',
				).toBe(true)
				expect(panel.width).toBeLessThan(host.width)
			}
		},
	)
})
