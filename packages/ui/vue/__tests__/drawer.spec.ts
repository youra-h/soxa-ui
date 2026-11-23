/**
 * Drawer во Vue — проводка целиком, на настоящей разметке.
 *
 * Модель проверяет ядро (`core/__tests__/drawer.spec.ts`), жест и правила
 * фокуса и нажатия мимо — плагины; здесь важно, что они сходятся: панель
 * телепортирована вместе с подложкой, а внутри контейнера остаётся на месте,
 * полоса жеста рисуется по ядру, кнопка закрытия и жест говорят с ядром, три
 * причины закрытия и жест проходят через запрос, а замок прокрутки знает, где
 * панель стоит.
 *
 * Раскладку, анимацию темы и настоящий указатель jsdom не выполняет — край,
 * размер, контейнер и жест мышью — `playground/vue/browser/drawer.spec.ts`.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref, type Ref, type VNode } from 'vue'
import { Dialog, Drawer } from '@soxa-ui/vue'
import { TDrawer } from '@soxa-ui/core'
import type { IDrawerProps, TCloseEvent, TCloseReason } from '@soxa-ui/core'

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

let wrapper: ReturnType<typeof mount> | null = null

afterEach(() => {
	wrapper?.unmount()
	wrapper = null
	document.body.innerHTML = ''
})

/** Узел по селектору; нет его — тест падает здесь, а не на чтении свойства. */
function find(selector: string, scope: ParentNode = document): HTMLElement {
	const element = scope.querySelector(selector)

	if (!(element instanceof HTMLElement)) throw new Error(`${selector}: HTML-узла нет`)

	return element
}

const panel = (scope: ParentNode = document) => find('.so-drawer', scope)
const backdrop = (scope: ParentNode = document) => find('.so-backdrop:has(+ .so-drawer)', scope)
const isOpen = (element: HTMLElement = panel()) => element.style.display !== 'none'
const opener = () => find('.so-test-opener')

/** Нажатие мимо — `pointerdown`, как его слушает плагин оверлея. */
const pointerDown = (target: Element) =>
	target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }))

/** Клавиша на элементе под фокусом. Отдаёт событие: по нему видно, погашена ли она. */
function press(key: string): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

	;(document.activeElement ?? document.body).dispatchEvent(event)

	return event
}

/** Содержимое панели с двумя остановками Tab. */
const inside = () => [
	h('button', { class: 'so-test-first' }, 'Первая'),
	h('button', { class: 'so-test-second' }, 'Вторая'),
]

type TPageOptions = {
	props?: Partial<IDrawerProps> & Record<string, unknown>
	content?: () => VNode | VNode[]
}

/**
 * Страница с кнопкой, которая открывает панель, и сама панель на
 * `v-model:visible` внутри контейнера `.so-test-host`. Отдаёт открытость: её
 * пишет и тест, и панель (`update:visible`).
 */
async function render({ props = {}, content = inside }: TPageOptions = {}): Promise<Ref<boolean>> {
	const shown = ref(false)

	wrapper = mount(
		defineComponent({
			render: () =>
				h('div', { class: 'so-test-host' }, [
					h('button', { class: 'so-test-opener' }, 'Открыть'),
					h(
						Drawer,
						{
							...props,
							visible: shown.value,
							'onUpdate:visible': (value: boolean) => {
								shown.value = value
							},
						},
						{ title: () => 'Фильтры', default: content },
					),
				]),
		}),
		{ attachTo: document.body },
	)

	await settle()

	return shown
}

/** Рендер и кадр: корень плагины получают через `requestAnimationFrame`, фокус уходит кадром позже. */
async function settle(): Promise<void> {
	await nextTick()
	await nextFrame()
}

/** Открыть панель с кнопки страницы и дождаться, пока фокус уйдёт в неё. */
async function open(shown: Ref<boolean>): Promise<void> {
	opener().focus()
	shown.value = true

	await settle()
}

describe('разметка', () => {
	it('поверх страницы: подложка и панель телепортированы соседями, подложка раньше', async () => {
		await render()

		expect(panel().parentElement).toBe(document.body)
		expect(backdrop().parentElement).toBe(document.body)
		expect(backdrop().nextElementSibling).toBe(panel())
	})

	it('внутри контейнера: панель и подложка остаются на месте, target не действует', async () => {
		const elsewhere = document.createElement('div')

		elsewhere.id = 'so-test-elsewhere'
		document.body.appendChild(elsewhere)

		await render({ props: { contained: true, target: '#so-test-elsewhere' } })

		const host = find('.so-test-host')

		expect(panel().parentElement).toBe(host)
		expect(backdrop().parentElement).toBe(host)
		expect(backdrop().nextElementSibling).toBe(panel())
		expect(panel().dataset.contained).toBe('true')
		expect(backdrop().dataset.contained).toBe('true')
	})

	it('contained на лету переносит панель из body в контейнер и обратно', async () => {
		const drawer = new TDrawer()

		await render({ props: { ctrl: drawer } })

		expect(panel().parentElement).toBe(document.body)

		drawer.contained = true
		await nextTick()

		expect(panel().parentElement).toBe(find('.so-test-host'))

		drawer.contained = false
		await nextTick()

		expect(panel().parentElement).toBe(document.body)
	})

	it('панель — модальный диалог, имя — заголовок', async () => {
		await render()

		const title = find('.so-drawer__title')

		expect(panel().getAttribute('role')).toBe('dialog')
		expect(panel().getAttribute('aria-modal')).toBe('true')
		expect(panel().getAttribute('tabindex')).toBe('-1')
		expect(panel().getAttribute('aria-labelledby')).toBe(title.id)
		expect(title.textContent).toBe('Фильтры')
	})

	it('край — модификатором, по умолчанию end; открытость — data-open у панели и подложки', async () => {
		const shown = await render({ props: { placement: 'bottom' } })

		expect(panel().classList).toContain('so-drawer--placement-bottom')
		expect(panel().dataset.open).toBe('false')
		expect(backdrop().dataset.open).toBe('false')
		expect(panel().dataset.swiping).toBe('false')

		await open(shown)

		expect(panel().dataset.open).toBe('true')
		expect(backdrop().dataset.open).toBe('true')
	})

	it('размер — переменными темы, не инлайном', async () => {
		await render({ props: { width: 360, height: '40vh' } })

		expect(panel().style.getPropertyValue('--so-drawer-width')).toBe('360px')
		expect(panel().style.getPropertyValue('--so-drawer-height')).toBe('40vh')
		expect(panel().style.width).toBe('')
	})

	it('открытая: панель и подложка в одном слое — z-index и data-layer одни', async () => {
		const shown = await render()

		await open(shown)

		const layer = panel().dataset.layer

		expect(layer).toMatch(/^\d+$/)
		expect(backdrop().dataset.layer).toBe(layer)
		expect(panel().style.zIndex).toBe(layer)
		expect(backdrop().style.zIndex).toBe(layer)
	})

	it('панель помечена владельцем, подложка — нет', async () => {
		await render()

		// Пометка — от id монтирования панели (`useId`), а не от счётчика процесса
		expect(panel().dataset.owner).toBeTruthy()
		expect(backdrop().hasAttribute('data-owner')).toBe(false)
	})

	it('атрибуты и события потребителя — на панели, а не в телепорте', async () => {
		const onClick = vi.fn()

		await render({ props: { class: 'so-test-mine', 'data-test': 'x', onClick } })

		expect(panel().classList).toContain('so-test-mine')
		expect(panel().dataset.test).toBe('x')

		panel().click()

		expect(onClick).toHaveBeenCalledTimes(1)
	})
})

describe('полоса жеста', () => {
	const handle = () => document.querySelector('.so-drawer__handle')

	it('без жеста полосы нет; с жестом — первая в панели, немая для скринридера', async () => {
		const drawer = new TDrawer()

		await render({ props: { ctrl: drawer } })

		expect(handle()).toBeNull()

		drawer.swipe = 'handle'
		await nextTick()

		expect(handle()).toBe(panel().firstElementChild)
		expect(handle()?.getAttribute('aria-hidden')).toBe('true')

		drawer.swipe = 'panel'
		await nextTick()

		expect(handle()).not.toBeNull()
	})
})

describe('закрытие пользователем', () => {
	/** Причины закрытия, которые видел подписчик `close:before`. */
	const recorder = () => {
		const reasons: TCloseReason[] = []

		return {
			reasons,
			'onClose:before': (event: TCloseEvent) => {
				reasons.push(event.reason)
			},
		}
	}

	it('крестик — причина button, назван локалью, фокус возвращается', async () => {
		const { reasons, ...listener } = recorder()
		const shown = await render({ props: { ...listener } })

		await open(shown)

		expect(document.activeElement).toBe(find('.so-test-first'))

		const close = find('.so-drawer__close')

		expect(close.getAttribute('aria-label')).toBe('Close')

		close.click()
		await nextTick()

		expect(reasons).toEqual(['button'])
		expect(shown.value).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('closable: false убирает крестик из DOM', async () => {
		await render({ props: { closable: false } })

		expect(document.querySelector('.so-drawer__close')).toBeNull()
	})

	it('Escape и подложка — причины escape и outside', async () => {
		const { reasons, ...listener } = recorder()
		const shown = await render({ props: listener })

		await open(shown)
		press('Escape')
		await settle()

		await open(shown)
		pointerDown(backdrop())
		await nextTick()

		expect(reasons).toEqual(['escape', 'outside'])
		expect(shown.value).toBe(false)
	})

	it('dismissible: false — подложка и Escape панель не закрывают', async () => {
		const shown = await render({ props: { dismissible: false } })

		await open(shown)

		pointerDown(backdrop())
		press('Escape')
		await nextTick()

		expect(shown.value).toBe(true)
		expect(isOpen()).toBe(true)
	})

	/**
	 * Коробку панели задаёт тест: jsdom раскладку не считает. Жест мышью по
	 * полосе — дальше четверти ширины панели.
	 */
	it('жест — причина swipe: смахнули к краю, и v-model видит закрытие', async () => {
		const { reasons, ...listener } = recorder()
		const shown = await render({ props: { swipe: 'handle', ...listener } })

		await open(shown)

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

		pointer('pointerdown', find('.so-drawer__handle'), 705)
		pointer('pointermove', panel(), 800)

		expect(panel().style.getPropertyValue('--so-swipe-offset')).toBe('95px')

		await nextTick()

		expect(panel().dataset.swiping).toBe('true')

		pointer('pointerup', panel(), 900)
		await nextTick()

		expect(reasons).toEqual(['swipe'])
		expect(shown.value).toBe(false)
		expect(wrapper?.findComponent(Drawer).emitted('update:visible')).toEqual([[true], [false]])
		expect(document.activeElement).toBe(opener())
	})
})

describe('фон под панелью', () => {
	it('поверх страницы: страница спрятана от скринридера, прокрутка заперта', async () => {
		const shown = await render()

		await open(shown)

		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		shown.value = false
		await settle()

		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.documentElement.style.overflow).toBe('')
	})

	/**
	 * Внутри контейнера панель модальна так же — фон немой, фокус в ней, — но
	 * прокрутку документа не запирает: страница за контейнером та же.
	 */
	it('внутри контейнера: фон немой, а прокрутка документа не заперта', async () => {
		const shown = await render({ props: { contained: true } })

		await open(shown)

		expect(opener().getAttribute('aria-hidden')).toBe('true')
		expect(document.activeElement).toBe(find('.so-test-first'))
		expect(document.documentElement.style.overflow).toBe('')
	})

	it('contained на открытой панели снимает замок, а обратно — ставит', async () => {
		const drawer = new TDrawer()
		const shown = await render({ props: { ctrl: drawer } })

		await open(shown)

		expect(document.documentElement.style.overflow).toBe('hidden')

		// Замок отпускается кадром позже, когда корень доиграл переходы
		drawer.contained = true
		await settle()

		expect(document.documentElement.style.overflow).toBe('')

		drawer.contained = false
		await nextTick()

		expect(document.documentElement.style.overflow).toBe('hidden')
	})
})

describe('внутри модального окна', () => {
	/**
	 * Панель в окне — слой выше окна: подложка и нажатие в неё окно не
	 * закрывают, Escape закрывает только её.
	 */
	it('Escape в панели закрывает только панель, второй — окно', async () => {
		const dialog = ref(false)
		const drawer = ref(false)

		wrapper = mount(
			defineComponent({
				render: () =>
					h(
						Dialog,
						{
							visible: dialog.value,
							'onUpdate:visible': (value: boolean) => {
								dialog.value = value
							},
						},
						() => [
							h('button', { class: 'so-test-in-dialog' }, 'В окне'),
							h(
								Drawer,
								{
									contained: true,
									visible: drawer.value,
									'onUpdate:visible': (value: boolean) => {
										drawer.value = value
									},
								},
								() => h('button', { class: 'so-test-in-drawer' }, 'В панели'),
							),
						],
					),
			}),
			{ attachTo: document.body },
		)

		await settle()

		dialog.value = true
		await settle()

		drawer.value = true
		await settle()

		expect(document.activeElement).toBe(find('.so-test-in-drawer'))
		expect(Number(panel().dataset.layer)).toBeGreaterThan(
			Number(find('.so-dialog').dataset.layer),
		)

		pointerDown(find('.so-test-in-drawer'))
		await nextTick()

		expect(dialog.value).toBe(true)
		expect(drawer.value).toBe(true)

		press('Escape')
		await nextTick()

		expect(drawer.value).toBe(false)
		expect(dialog.value).toBe(true)

		press('Escape')
		await nextTick()

		expect(dialog.value).toBe(false)
	})
})

describe('открытость — visible и v-model', () => {
	it('visible из инстанса открывает так же, как из шаблона', async () => {
		const drawer = new TDrawer()

		wrapper = mount(Drawer, {
			props: { ctrl: drawer },
			slots: { default: inside },
			attachTo: document.body,
		})

		await settle()

		drawer.visible = true
		await settle()

		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
		expect(document.activeElement).toBe(find('.so-test-first'))
	})
})
