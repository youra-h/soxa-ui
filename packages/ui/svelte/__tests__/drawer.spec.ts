/**
 * Drawer в Svelte — проводка целиком, на настоящей разметке.
 *
 * Модель проверяет ядро (`core/__tests__/drawer.spec.ts`), жест и правила
 * фокуса и нажатия мимо — плагины; здесь важно, что они сходятся: панель
 * телепортирована вместе с подложкой, а внутри контейнера остаётся на месте,
 * полоса жеста рисуется по ядру, кнопка закрытия и жест говорят с ядром, три
 * причины закрытия и жест проходят через запрос, а замок прокрутки знает, где
 * панель стоит. Сценарии — те же, что у Vue (`drawer.spec.ts`); открытость,
 * которую Vue держит `v-model`, здесь возвращает пропом колбэк
 * `onChangeVisible`.
 *
 * Раскладку, анимацию темы и настоящий указатель jsdom не выполняет — край,
 * размер, контейнер и жест мышью — `playground/vue/browser/drawer.spec.ts`.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushSync } from 'svelte'
import { TDrawer } from '@soxa-ui/core'
import type { TCloseEvent, TCloseReason } from '@soxa-ui/core'
import type { DialogProps, DrawerProps } from '@soxa-ui/svelte'
import Harness from './Drawer.test.svelte'
import { find, mount, nextFrame } from './mount'
import { reactiveProps } from './reactive-props.svelte'

afterEach(() => {
	vi.restoreAllMocks()
})

const node = (selector: string, scope: ParentNode = document) => find(scope, selector, HTMLElement)

const panel = () => node('.so-drawer')
const backdrop = () => node('.so-backdrop:has(+ .so-drawer)')
const isOpen = (element: HTMLElement = panel()) => element.style.display !== 'none'
const opener = () => node('.so-test-opener')

/** Нажатие мимо — `pointerdown`, как его слушает плагин оверлея. */
function pointerDown(target: Element): void {
	target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }))
	flushSync()
}

/** Клавиша на элементе под фокусом. Отдаёт событие: по нему видно, погашена ли она. */
function press(key: string): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

	;(document.activeElement ?? document.body).dispatchEvent(event)
	flushSync()

	return event
}

/** Смена пропсов и кадр: корень плагины получают через него, фокус уходит кадром позже. */
async function settle(): Promise<void> {
	flushSync()
	await nextFrame()
}

/**
 * Страница с кнопкой, которая открывает панель, и сама панель внутри
 * контейнера `.so-test-host`. Открытость возвращается пропом, как привязка:
 * колбэк `onChangeVisible` пишет её в пропсы панели. Отдаёт пропсы панели и
 * журнал открытости, которую получил потребитель.
 */
async function render(drawer: DrawerProps = {}) {
	const visibles: boolean[] = []
	const props = reactiveProps<DrawerProps>({
		...drawer,
		visible: false,
		onChangeVisible: ({ newValue: value }) => {
			visibles.push(value)
			props.visible = value
		},
	})

	mount(Harness, { drawer: props })
	await nextFrame()

	return { props, visibles }
}

/** Открыть панель с кнопки страницы и дождаться, пока фокус уйдёт в неё. */
async function open(props: DrawerProps): Promise<void> {
	opener().focus()
	props.visible = true

	await settle()
}

describe('разметка', () => {
	// Телепорт кладёт их в свою обёртку: место — по `contains`, а не по родителю
	it('поверх страницы: подложка и панель телепортированы соседями, подложка раньше', async () => {
		await render()

		expect(document.body.contains(panel())).toBe(true)
		expect(node('.so-test-host').contains(panel())).toBe(false)
		expect(backdrop().parentElement).toBe(panel().parentElement)
		expect(backdrop().nextElementSibling).toBe(panel())
	})

	it('внутри контейнера: панель и подложка остаются на месте, target не действует', async () => {
		const elsewhere = document.createElement('div')

		elsewhere.id = 'so-test-elsewhere'
		document.body.appendChild(elsewhere)

		await render({ contained: true, target: '#so-test-elsewhere' })

		const host = node('.so-test-host')

		expect(host.contains(panel())).toBe(true)
		expect(elsewhere.contains(panel())).toBe(false)
		expect(backdrop().parentElement).toBe(panel().parentElement)
		expect(backdrop().nextElementSibling).toBe(panel())
		expect(panel().dataset.contained).toBe('true')
		expect(backdrop().dataset.contained).toBe('true')
	})

	/**
	 * Телепорт двигает свою обёртку, а не монтирует панель заново: в контейнере
	 * и обратно в `body` — тот же узел.
	 */
	it('contained на лету переносит панель из body в контейнер и обратно тем же узлом', async () => {
		const drawer = new TDrawer()

		await render({ ctrl: drawer })

		const first = panel()
		const host = node('.so-test-host')

		expect(host.contains(first)).toBe(false)

		drawer.contained = true
		flushSync()

		expect(panel()).toBe(first)
		expect(host.contains(first)).toBe(true)
		expect(document.querySelectorAll('.so-drawer')).toHaveLength(1)

		drawer.contained = false
		flushSync()

		expect(panel()).toBe(first)
		expect(host.contains(first)).toBe(false)
		expect(document.body.contains(first)).toBe(true)
		expect(document.querySelectorAll('.so-drawer')).toHaveLength(1)
	})

	it('панель — модальный диалог, имя — заголовок', async () => {
		await render()

		const title = node('.so-drawer__title')

		expect(panel().getAttribute('role')).toBe('dialog')
		expect(panel().getAttribute('aria-modal')).toBe('true')
		expect(panel().getAttribute('tabindex')).toBe('-1')
		expect(panel().getAttribute('aria-labelledby')).toBe(title.id)
		expect(title.textContent).toBe('Фильтры')
	})

	it('край — модификатором, по умолчанию end; открытость — data-open у панели и подложки', async () => {
		const { props } = await render({ placement: 'bottom' })

		expect(panel().classList).toContain('so-drawer--placement-bottom')
		expect(panel().dataset.open).toBe('false')
		expect(backdrop().dataset.open).toBe('false')
		expect(panel().dataset.swiping).toBe('false')

		await open(props)

		expect(panel().dataset.open).toBe('true')
		expect(backdrop().dataset.open).toBe('true')
	})

	it('размер — переменными темы, не инлайном', async () => {
		await render({ width: 360, height: '40vh' })

		expect(panel().style.getPropertyValue('--so-drawer-width')).toBe('360px')
		expect(panel().style.getPropertyValue('--so-drawer-height')).toBe('40vh')
		expect(panel().style.width).toBe('')
	})

	it('открытая: панель и подложка в одном слое — z-index и data-layer одни', async () => {
		const { props } = await render()

		await open(props)

		const layer = panel().dataset.layer

		expect(layer).toMatch(/^\d+$/)
		expect(backdrop().dataset.layer).toBe(layer)
		expect(panel().style.zIndex).toBe(layer)
		expect(backdrop().style.zIndex).toBe(layer)
	})

	it('панель помечена владельцем, подложка — нет', async () => {
		await render()

		// Пометка — от id монтирования панели (`$props.id()`), а не от счётчика процесса
		expect(panel().dataset.owner).toBeTruthy()
		expect(backdrop().hasAttribute('data-owner')).toBe(false)
	})

	it('атрибуты и события потребителя — на панели, а не на подложке', async () => {
		const onclick = vi.fn()

		await render({ class: 'so-test-mine', 'data-test': 'x', onclick })

		expect(panel().classList).toContain('so-test-mine')
		expect(panel().dataset.test).toBe('x')
		expect(backdrop().classList).not.toContain('so-test-mine')

		panel().click()

		expect(onclick).toHaveBeenCalledTimes(1)
	})
})

describe('полоса жеста', () => {
	const handle = () => document.querySelector('.so-drawer__handle')

	it('без жеста полосы нет; с жестом — первая в панели, немая для скринридера', async () => {
		const drawer = new TDrawer()

		await render({ ctrl: drawer })

		expect(handle()).toBeNull()

		drawer.swipe = 'handle'
		flushSync()

		expect(handle()).toBe(panel().firstElementChild)
		expect(handle()?.getAttribute('aria-hidden')).toBe('true')

		drawer.swipe = 'panel'
		flushSync()

		expect(handle()).not.toBeNull()
	})
})

describe('закрытие пользователем', () => {
	/** Причины закрытия, которые видел подписчик `close:before`. */
	const recorder = () => {
		const reasons: TCloseReason[] = []

		return {
			reasons,
			onCloseBefore: (event: TCloseEvent) => {
				reasons.push(event.reason)
			},
		}
	}

	it('крестик — причина button, назван локалью, фокус возвращается', async () => {
		const { reasons, ...listener } = recorder()
		const { props } = await render(listener)

		await open(props)

		expect(document.activeElement).toBe(node('.so-test-first'))

		const close = node('.so-drawer__close')

		expect(close.getAttribute('aria-label')).toBe('Close')

		close.click()
		flushSync()

		expect(reasons).toEqual(['button'])
		expect(props.visible).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('closable: false убирает крестик из DOM', async () => {
		await render({ closable: false })

		expect(document.querySelector('.so-drawer__close')).toBeNull()
	})

	it('Escape и подложка — причины escape и outside', async () => {
		const { reasons, ...listener } = recorder()
		const { props } = await render(listener)

		await open(props)
		press('Escape')
		await settle()

		await open(props)
		pointerDown(backdrop())

		expect(reasons).toEqual(['escape', 'outside'])
		expect(props.visible).toBe(false)
	})

	it('dismissible: false — подложка и Escape панель не закрывают', async () => {
		const { props } = await render({ dismissible: false })

		await open(props)

		pointerDown(backdrop())
		press('Escape')

		expect(props.visible).toBe(true)
		expect(isOpen()).toBe(true)
	})

	/**
	 * Коробку панели задаёт тест: jsdom раскладку не считает. Жест мышью по
	 * полосе — дальше четверти ширины панели.
	 */
	it('жест — причина swipe: смахнули к краю, и onChangeVisible видит закрытие', async () => {
		const { reasons, ...listener } = recorder()
		const { props, visibles } = await render({ swipe: 'handle', ...listener })

		await open(props)

		vi.spyOn(panel(), 'getBoundingClientRect').mockReturnValue(new DOMRect(700, 0, 300, 800))

		const pointer = (type: string, target: Element, x: number) =>
			target.dispatchEvent(
				new PointerEvent(type, {
					bubbles: true,
					cancelable: true,
					clientX: x,
					clientY: 400,
					pointerId: 1,
					pointerType: 'mouse',
					button: 0,
					isPrimary: true,
				}),
			)

		pointer('pointerdown', node('.so-drawer__handle'), 705)
		pointer('pointermove', panel(), 800)

		expect(panel().style.getPropertyValue('--so-swipe-offset')).toBe('95px')

		flushSync()

		expect(panel().dataset.swiping).toBe('true')
		// Сдвиг плагин пишет в узел сам, мимо разметки, и смена набора панели его
		// не стирает: стиль корня ставится на узел по свойствам
		expect(panel().style.getPropertyValue('--so-swipe-offset')).toBe('95px')

		pointer('pointerup', panel(), 900)
		flushSync()

		expect(reasons).toEqual(['swipe'])
		expect(props.visible).toBe(false)
		expect(visibles).toEqual([true, false])
		expect(document.activeElement).toBe(opener())
	})
})

describe('фон под панелью', () => {
	it('поверх страницы: страница спрятана от скринридера, прокрутка заперта', async () => {
		const { props } = await render()

		await open(props)

		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		props.visible = false
		await settle()

		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.documentElement.style.overflow).toBe('')
	})

	/**
	 * Внутри контейнера панель модальна так же — фон немой, фокус в ней, — но
	 * прокрутку документа не запирает: страница за контейнером та же.
	 */
	it('внутри контейнера: фон немой, а прокрутка документа не заперта', async () => {
		const { props } = await render({ contained: true })

		await open(props)

		expect(opener().getAttribute('aria-hidden')).toBe('true')
		expect(document.activeElement).toBe(node('.so-test-first'))
		expect(document.documentElement.style.overflow).toBe('')
	})

	/**
	 * Телепорт переносит панель тем же узлом, как у Vue, и замок держит не
	 * узел, а производное ядра `locksScroll` — открыта и не `contained`:
	 * отпускает он кадром позже, когда корень доиграл переходы, а ставит сразу.
	 */
	it('contained на открытой панели снимает замок, а обратно — сразу ставит', async () => {
		const drawer = new TDrawer()
		const { props } = await render({ ctrl: drawer })

		await open(props)

		expect(document.documentElement.style.overflow).toBe('hidden')

		drawer.contained = true
		await settle()

		expect(document.documentElement.style.overflow).toBe('')

		drawer.contained = false
		flushSync()

		expect(document.documentElement.style.overflow).toBe('hidden')
	})
})

describe('внутри модального окна', () => {
	/**
	 * Панель в окне — слой выше окна: подложка и нажатие в неё окно не
	 * закрывают, Escape закрывает только её.
	 */
	it('Escape в панели закрывает только панель, второй — окно', async () => {
		const dialog = reactiveProps<DialogProps>({
			visible: false,
			onChangeVisible: ({ newValue: value }) => {
				dialog.visible = value
			},
		})
		const drawer = reactiveProps<DrawerProps>({
			contained: true,
			visible: false,
			onChangeVisible: ({ newValue: value }) => {
				drawer.visible = value
			},
		})

		mount(Harness, { dialog, drawer })
		await nextFrame()

		dialog.visible = true
		await settle()

		drawer.visible = true
		await settle()

		expect(document.activeElement).toBe(node('.so-test-in-drawer'))
		expect(Number(panel().dataset.layer)).toBeGreaterThan(
			Number(node('.so-dialog').dataset.layer),
		)

		pointerDown(node('.so-test-in-drawer'))

		expect(dialog.visible).toBe(true)
		expect(drawer.visible).toBe(true)

		press('Escape')

		expect(drawer.visible).toBe(false)
		expect(dialog.visible).toBe(true)

		press('Escape')

		expect(dialog.visible).toBe(false)
	})
})

describe('открытость — visible и onChangeVisible', () => {
	it('visible из инстанса открывает так же, как из разметки', async () => {
		const drawer = new TDrawer()

		mount(Harness, { drawer: { ctrl: drawer } })
		await nextFrame()

		drawer.visible = true
		await settle()

		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-first'))
	})
})
