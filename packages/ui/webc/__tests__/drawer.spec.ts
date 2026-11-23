import { propertyDetail } from './property-detail'
/**
 * `<div is="so-drawer">` — Drawer в Web Components, проводка целиком, на
 * настоящей разметке.
 *
 * Модель проверяет ядро (`core/__tests__/drawer.spec.ts`), жест и правила
 * фокуса и нажатия мимо — плагины; здесь важно, что они сходятся: панель
 * уехала в цель вместе с подложкой, а внутри контейнера осталась на месте,
 * полоса жеста рисуется по ядру, кнопка закрытия и жест говорят с ядром, три
 * причины закрытия и жест проходят через запрос, а замок прокрутки знает, где
 * панель стоит. Сценарии — те же, что у Vue (`ui/vue/__tests__/drawer.spec.ts`);
 * открытость, которую Vue держит `v-model`, здесь видна событиями
 * `so:change:visible`.
 *
 * Своё у Web Components — спутник корня: подложку ставит прямо перед панелью,
 * увозит в цель и возвращает на место с `contained`, уводит за местом и прячет
 * база элемента. И перенос: ни `contained` туда и обратно, ни смена цели не
 * пересобирают ни панель, ни кнопки в ней, а панель, переставленная
 * потребителем одной операцией, собирает их заново — с локалью нового места.
 *
 * Раскладку, анимацию темы и настоящий указатель jsdom не выполняет — край,
 * размер, контейнер и жест мышью — браузерные спеки Vue и
 * `playground/vue/browser/webc-frame.spec.ts`.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { TButton, TComponentView, TDrawer } from '@soxa-ui/core'
import type { TCloseEvent, TCloseReason } from '@soxa-ui/core'
import { TBasePlugin, ruRU, zhCN, type IPluginContext } from '@soxa-ui/plugins'
import { DrawerDescriptor, usePlugins } from '@soxa-ui/setup'
import {
	TDialogElement,
	TDrawerElement,
	TLocaleProviderElement,
	type TDialogElementProps,
	type TDrawerElementProps,
} from '@soxa-ui/webc'
import { drawerTemplate } from '../src/components/drawer/drawer.template'
import { TELEPORT_ANCHOR } from '../src/adapter/runtime/teleport'
import { bareContext } from './template-context'

/** Отрисовка коалесцируется в микротаске — ждём её перед проверкой. */
const flush = () => new Promise<void>((resolve) => queueMicrotask(() => resolve()))

/** `TElementPlugin` объявляет узел через кадр — после него встают слушатели плагинов. */
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

let dispose: (() => void) | undefined

afterEach(() => {
	document.body.innerHTML = ''
	dispose?.()
	dispose = undefined
	vi.restoreAllMocks()
})

function isDrawer(node: Element | null): node is TDrawerElementProps {
	return node instanceof TDrawerElement
}

function isDialog(node: Element | null): node is TDialogElementProps {
	return node instanceof TDialogElement
}

/** Содержимое панели с двумя остановками Tab. */
const INSIDE = `<span slot="title">Фильтры</span>
	<button class="so-test-first">Первая</button>
	<button class="so-test-second">Вторая</button>`

/** Что рисует страница: атрибуты панели, её свет и инстанс. */
type TPage = {
	readonly attrs?: string
	readonly content?: string
	readonly ctrl?: TDrawer
}

/**
 * Страница с кнопкой, которая открывает панель, и сама панель в контейнере
 * `.so-test-host` — разметкой, как её пишет потребитель. Инстанс — до
 * подключения. После вставки — микрозадача отрисовки и кадр.
 */
async function render({
	attrs = '',
	content = INSIDE,
	ctrl,
}: TPage = {}): Promise<TDrawerElementProps> {
	const page = document.createElement('div')

	page.className = 'so-test-host'
	page.innerHTML = `<button class="so-test-opener">Открыть</button>
		<div is="so-drawer" ${attrs}>${content}</div>`

	const drawer = page.querySelector('div')

	if (!isDrawer(drawer)) throw new Error('<div is="so-drawer"> нет')

	if (ctrl) drawer.ctrl = ctrl

	document.body.appendChild(page)
	await flush()
	await nextFrame()

	return drawer
}

/** Узел по селектору; нет его — тест падает здесь, а не на чтении свойства. */
function find(selector: string, scope: ParentNode = document): HTMLElement {
	const element = scope.querySelector(selector)

	if (!(element instanceof HTMLElement)) throw new Error(`${selector}: HTML-узла нет`)

	return element
}

/** Провайдер локали по селектору; нет его — тест падает здесь. */
function localeProvider(selector: string, scope: ParentNode = document): TLocaleProviderElement {
	const node = scope.querySelector(selector)

	if (!(node instanceof TLocaleProviderElement)) throw new Error(`${selector}: провайдера нет`)

	return node
}

const panel = (scope: ParentNode = document) => find('.so-drawer', scope)
const backdrop = (scope: ParentNode = document) => find('.so-backdrop:has(+ .so-drawer)', scope)
const isOpen = (element: HTMLElement = panel()) => element.style.display !== 'none'
const opener = () => find('.so-test-opener')
const host = () => find('.so-test-host')

/** Direct children of the page muted by the modal, excluding its decorative backdrop. */
const muted = () => [...document.querySelectorAll('body > [aria-hidden="true"]:not(.so-backdrop)')]

/** Якоря телепорта в поддереве — комментарии на месте увезённых корней. */
function anchors(scope: Node): Comment[] {
	const walker = document.createTreeWalker(scope, NodeFilter.SHOW_COMMENT)
	const found: Comment[] = []

	while (walker.nextNode()) {
		const node = walker.currentNode

		if (node instanceof Comment && node.data === TELEPORT_ANCHOR) found.push(node)
	}

	return found
}

/** Значения `detail` событий с этим именем на элементе. */
function collect(el: Element, name: string): unknown[] {
	const seen: unknown[] = []

	el.addEventListener(name, (event) => {
		if (event instanceof CustomEvent) seen.push(propertyDetail(event))
	})

	return seen
}

/** Нажатие мимо — `pointerdown`, как его слушает плагин оверлея. */
const pointerDown = (target: Element) =>
	target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }))

/** Клавиша на элементе под фокусом. Отдаёт событие: по нему видно, погашена ли она. */
function press(key: string): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

	;(document.activeElement ?? document.body).dispatchEvent(event)

	return event
}

/** Открыть панель с кнопки страницы и дождаться, пока фокус уйдёт в неё. */
async function open(drawer: TDrawerElementProps): Promise<void> {
	opener().focus()
	drawer.visible = true

	await flush()
	await nextFrame()
}

/** Причины закрытия, которые видел подписчик `so:close:before`. */
function reasonsOf(drawer: Element): TCloseReason[] {
	const reasons: TCloseReason[] = []

	drawer.addEventListener('so:close:before', (event) => {
		if (event instanceof CustomEvent) {
			const detail: TCloseEvent = event.detail

			reasons.push(detail.reason)
		}
	})

	return reasons
}

describe('разметка', () => {
	it('поверх страницы: подложка и панель уехали соседями, подложка раньше', async () => {
		await render()

		expect(panel().parentElement).toBe(document.body)
		expect(backdrop().parentElement).toBe(document.body)
		expect(backdrop().nextElementSibling).toBe(panel())
		expect(anchors(host())).toHaveLength(1)
	})

	it('внутри контейнера: панель и подложка на месте, target не действует', async () => {
		const elsewhere = document.createElement('div')

		elsewhere.id = 'so-test-elsewhere'
		document.body.appendChild(elsewhere)

		await render({ attrs: 'contained target="#so-test-elsewhere"' })

		expect(panel().parentElement).toBe(host())
		expect(backdrop().parentElement).toBe(host())
		expect(backdrop().nextElementSibling).toBe(panel())
		expect(panel().dataset.contained).toBe('true')
		expect(backdrop().dataset.contained).toBe('true')
		expect(anchors(host())).toHaveLength(0)
	})

	it('contained на лету переносит панель с подложкой из body в контейнер и обратно', async () => {
		const ctrl = new TDrawer()

		await render({ ctrl })

		const shade = backdrop()

		expect(panel().parentElement).toBe(document.body)

		ctrl.contained = true
		await flush()

		expect(panel().parentElement).toBe(host())
		expect(shade.parentElement).toBe(host())
		expect(shade.nextElementSibling).toBe(panel())
		// Между прежними соседями: за кнопкой страницы
		expect(shade.previousElementSibling).toBe(opener())
		expect(anchors(host())).toHaveLength(0)

		ctrl.contained = false
		await flush()

		expect(panel().parentElement).toBe(document.body)
		expect(shade.parentElement).toBe(document.body)
		expect(shade.nextElementSibling).toBe(panel())
		expect(backdrop()).toBe(shade)
		expect(document.querySelectorAll('.so-backdrop:has(+ .so-drawer)')).toHaveLength(1)
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

	it('слоты — по местам: заголовок, тело, подвал; крестик — последним', async () => {
		await render({
			content: `${INSIDE}<button slot="footer" class="so-test-ok">Применить</button>`,
		})

		expect(find('.so-drawer__body').contains(find('.so-test-first'))).toBe(true)
		expect(find('.so-drawer__footer').contains(find('.so-test-ok'))).toBe(true)
		expect(panel().lastElementChild?.classList.contains('so-drawer__close')).toBe(true)
	})

	it('край — модификатором, по умолчанию end; открытость — data-open у панели и подложки', async () => {
		const drawer = await render({ attrs: 'placement="bottom"' })

		expect(panel().classList).toContain('so-drawer--placement-bottom')
		expect(panel().dataset.open).toBe('false')
		expect(backdrop().dataset.open).toBe('false')
		expect(panel().dataset.swiping).toBe('false')

		await open(drawer)

		expect(panel().dataset.open).toBe('true')
		expect(backdrop().dataset.open).toBe('true')
	})

	it('размер — переменными темы, не инлайном', async () => {
		await render({ attrs: 'width="360" height="40vh"' })

		expect(panel().style.getPropertyValue('--so-drawer-width')).toBe('360px')
		expect(panel().style.getPropertyValue('--so-drawer-height')).toBe('40vh')
		expect(panel().style.width).toBe('')
	})

	it('открытая: панель и подложка в одном слое — z-index и data-layer одни', async () => {
		const drawer = await render()

		await open(drawer)

		const layer = panel().dataset.layer

		expect(layer).toMatch(/^\d+$/)
		expect(backdrop().dataset.layer).toBe(layer)
		expect(panel().style.zIndex).toBe(layer)
		expect(backdrop().style.zIndex).toBe(layer)
	})

	it('панель помечена владельцем, подложка — нет', async () => {
		await render()

		expect(panel().dataset.owner).toBeTruthy()
		expect(backdrop().hasAttribute('data-owner')).toBe(false)
	})

	it('атрибуты и слушатели потребителя — на панели', async () => {
		const drawer = await render({ attrs: 'class="so-test-mine" data-test="x"' })
		const clicks: Event[] = []

		drawer.addEventListener('click', (event) => clicks.push(event))

		expect(panel()).toBe(drawer)
		expect(panel().classList).toContain('so-test-mine')
		expect(panel().dataset.test).toBe('x')

		panel().click()

		expect(clicks).toHaveLength(1)
	})

	it('шаблон объявляет ровно те слоты, что и дескриптор', () => {
		const root = document.createElement('div')
		const targets = drawerTemplate.create(root, bareContext(root)).slots

		expect(Object.keys(targets).sort()).toEqual(
			DrawerDescriptor()
				.slots.map((slot) => slot.name)
				.sort(),
		)
	})
})

describe('подложка — спутник панели', () => {
	it('rendered=false прячет панель вместе с подложкой — и на месте тоже', async () => {
		const drawer = await render({ attrs: 'visible contained' })

		drawer.rendered = false
		await flush()

		expect(isOpen()).toBe(false)
		expect(isOpen(backdrop())).toBe(false)

		drawer.rendered = true
		await flush()

		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
	})

	it('снятая на месте панель уносит подложку из контейнера', async () => {
		const drawer = await render({ attrs: 'contained' })

		drawer.remove()

		expect(host().querySelector('.so-backdrop:has(+ .so-drawer)')).toBeNull()
	})

	/**
	 * Панель ходит с местом: контейнер потребителя с якорем ушёл из документа —
	 * панель и подложка уходят из цели в него, вставка обратно увозит их снова.
	 */
	it('снятие контейнера уводит панель с подложкой из body, вставка — снова в body', async () => {
		const drawer = await render({ attrs: 'visible' })
		const container = host()

		container.remove()
		await flush()

		expect(drawer.isConnected).toBe(false)
		expect(document.querySelector('.so-backdrop:has(+ .so-drawer)')).toBeNull()

		document.body.appendChild(container)
		await flush()

		expect(drawer.parentElement).toBe(document.body)
		expect(backdrop().nextElementSibling).toBe(drawer)
		expect(isOpen(backdrop())).toBe(true)
		expect(document.querySelectorAll('.so-backdrop:has(+ .so-drawer)')).toHaveLength(1)
	})
})

describe('полоса жеста', () => {
	const handle = () => document.querySelector('.so-drawer__handle')

	it('без жеста полосы нет; с жестом — первая в панели, немая для скринридера', async () => {
		const ctrl = new TDrawer()

		await render({ ctrl })

		expect(handle()).toBeNull()

		ctrl.swipe = 'handle'
		await flush()

		expect(handle()).toBe(panel().firstElementChild)
		expect(handle()?.getAttribute('aria-hidden')).toBe('true')

		ctrl.swipe = 'panel'
		await flush()

		expect(handle()).not.toBeNull()

		ctrl.swipe = 'none'
		await flush()

		expect(handle()).toBeNull()
	})
})

describe('закрытие пользователем', () => {
	it('крестик — причина button, назван локалью, фокус возвращается', async () => {
		const drawer = await render()
		const reasons = reasonsOf(drawer)

		await open(drawer)

		expect(document.activeElement).toBe(find('.so-test-first'))

		const close = find('.so-drawer__close')

		expect(close.getAttribute('aria-label')).toBe('Close')
		expect(close.getAttribute('type')).toBe('button')
		expect(close.querySelector('.so-icon')?.getAttribute('icon')).toBe('close')

		close.click()
		await flush()

		expect(reasons).toEqual(['button'])
		expect(drawer.visible).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('closable: false убирает крестик из DOM, true — возвращает последним', async () => {
		const drawer = await render({ attrs: 'closable' })
		const close = find('.so-drawer__close')

		drawer.closable = false
		await flush()

		expect(document.querySelector('.so-drawer__close')).toBeNull()

		drawer.closable = true
		await flush()

		expect(panel().lastElementChild).toBe(close)
	})

	it('слот close-icon заменяет иконку крестика целиком', async () => {
		await render({ content: `${INSIDE}<i slot="close-icon" class="so-test-x">×</i>` })

		const close = find('.so-drawer__close')

		expect(close.querySelector('.so-test-x')).not.toBeNull()
		expect(close.querySelector('.so-icon')).toBeNull()
	})

	it('Escape и подложка — причины escape и outside', async () => {
		const drawer = await render()
		const reasons = reasonsOf(drawer)

		await open(drawer)
		press('Escape')
		await flush()
		await nextFrame()

		await open(drawer)
		pointerDown(backdrop())
		await flush()

		expect(reasons).toEqual(['escape', 'outside'])
		expect(drawer.visible).toBe(false)
	})

	it('dismissible: false — подложка и Escape панель не закрывают', async () => {
		const drawer = await render()

		drawer.dismissible = false
		await open(drawer)

		pointerDown(backdrop())
		press('Escape')
		await flush()

		expect(drawer.visible).toBe(true)
		expect(isOpen()).toBe(true)
	})

	/**
	 * Коробку панели задаёт тест: jsdom раскладку не считает. Жест мышью по
	 * полосе — дальше четверти ширины панели.
	 */
	it('жест — причина swipe: смахнули к краю, и so:change:visible видит закрытие', async () => {
		const drawer = await render({ attrs: 'swipe="handle"' })
		const reasons = reasonsOf(drawer)
		const changes = collect(drawer, 'so:change:visible')

		await open(drawer)

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

		await flush()

		expect(panel().dataset.swiping).toBe('true')
		// Сдвиг плагин пишет в узел сам, мимо раскладки, и смена набора его не стирает
		expect(panel().style.getPropertyValue('--so-swipe-offset')).toBe('95px')

		pointer('pointerup', panel(), 900)
		await flush()

		expect(reasons).toEqual(['swipe'])
		expect(drawer.visible).toBe(false)
		expect(changes).toEqual([true, false])
		expect(document.activeElement).toBe(opener())
	})
})

describe('фон под панелью', () => {
	it('поверх страницы: страница спрятана от скринридера, прокрутка заперта', async () => {
		const drawer = await render()

		await open(drawer)

		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		drawer.visible = false
		await flush()
		await nextFrame()

		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.documentElement.style.overflow).toBe('')
	})

	/**
	 * Элемент потребителя компонент не снимает, а прячет, но корня у панели с
	 * `rendered=false`, как у Vue с `v-if`, нет и у плагинов: открытая панель
	 * отпускает прокрутку и пометки фона сразу, оставаясь открытой. Снова
	 * показанная — запирает страницу заново, кадром `ready` своего узла, а
	 * закрытая потом отпускает всё: счёт замка и пометок сошёлся.
	 */
	it('rendered=false у открытой панели отпускает страницу, rendered=true — запирает снова', async () => {
		const drawer = await render()

		await open(drawer)

		expect(muted()).not.toEqual([])
		expect(document.documentElement.style.overflow).toBe('hidden')

		drawer.rendered = false
		await flush()

		expect(drawer.visible).toBe(true)
		expect(isOpen()).toBe(false)
		expect(muted()).toEqual([])
		expect(document.documentElement.style.overflow).toBe('')

		drawer.rendered = true
		await flush()
		await nextFrame()

		expect(isOpen()).toBe(true)
		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		drawer.visible = false
		await flush()
		await nextFrame()

		expect(muted()).toEqual([])
		expect(document.documentElement.style.overflow).toBe('')
	})

	/**
	 * Внутри контейнера панель модальна так же — фон немой, фокус в ней, — но
	 * прокрутку документа не запирает: страница за контейнером та же.
	 */
	it('внутри контейнера: фон немой, а прокрутка документа не заперта', async () => {
		const drawer = await render({ attrs: 'contained' })

		await open(drawer)

		expect(opener().getAttribute('aria-hidden')).toBe('true')
		expect(document.activeElement).toBe(find('.so-test-first'))
		expect(document.documentElement.style.overflow).toBe('')
	})

	it('contained на открытой панели снимает замок, а обратно — ставит', async () => {
		const ctrl = new TDrawer()
		const drawer = await render({ ctrl })

		await open(drawer)

		expect(document.documentElement.style.overflow).toBe('hidden')

		// Замок отпускается кадром позже, когда корень доиграл переходы
		ctrl.contained = true
		await flush()
		await nextFrame()

		expect(document.documentElement.style.overflow).toBe('')

		ctrl.contained = false
		await flush()

		expect(document.documentElement.style.overflow).toBe('hidden')
	})
})

describe('внутри модального окна', () => {
	/**
	 * Панель в окне — слой выше окна: подложка и нажатие в неё окно не
	 * закрывают, Escape закрывает только её.
	 */
	it('Escape в панели закрывает только панель, второй — окно', async () => {
		const page = document.createElement('div')

		page.innerHTML = `<div is="so-dialog">
			<button class="so-test-in-dialog">В окне</button>
			<div is="so-drawer" contained><button class="so-test-in-drawer">В панели</button></div>
		</div>`

		const dialog = page.querySelector('[is="so-dialog"]')
		const drawer = page.querySelector('[is="so-drawer"]')

		if (!isDialog(dialog) || !isDrawer(drawer)) throw new Error('разметки нет')

		document.body.appendChild(page)
		await flush()

		dialog.visible = true
		await flush()
		await nextFrame()

		drawer.visible = true
		await flush()
		await nextFrame()

		expect(document.activeElement).toBe(find('.so-test-in-drawer'))
		expect(dialog.contains(drawer)).toBe(true)
		expect(Number(drawer.dataset.layer)).toBeGreaterThan(Number(dialog.dataset.layer))

		pointerDown(find('.so-test-in-drawer'))
		await flush()

		expect(dialog.visible).toBe(true)
		expect(drawer.visible).toBe(true)

		press('Escape')
		await flush()

		expect(drawer.visible).toBe(false)
		expect(dialog.visible).toBe(true)

		press('Escape')
		await flush()

		expect(dialog.visible).toBe(false)
	})
})

describe('открытость — visible', () => {
	it('visible из инстанса открывает так же, как из разметки', async () => {
		const ctrl = new TDrawer()

		await render({ ctrl })

		opener().focus()
		ctrl.visible = true
		await flush()
		await nextFrame()

		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
		expect(document.activeElement).toBe(find('.so-test-first'))
	})
})

/**
 * Сборки считает плагин-зонд при установке набора: `contained` туда и обратно
 * и смена цели связку не трогают ни у панели, ни у кнопок в ней, а панель,
 * переставленная потребителем, собирает их заново.
 */
describe('перенос', () => {
	/** Сборки кнопок — их текст и тег локали, по одной на связку. */
	const assembled: (readonly [text: string, locale: string])[] = []

	let destroyed = 0

	class TAssemblyProbePlugin extends TBasePlugin<TComponentView> {
		private _button = false

		override install(ctx: IPluginContext, options?: unknown): void {
			super.install(ctx, options)

			const instance = ctx.getInstance()

			if (instance instanceof TButton) {
				this._button = true
				assembled.push([instance.text, ctx.locale.locale.tag])
			}
		}

		override destroy(): void {
			if (this._button) destroyed += 1

			super.destroy()
		}
	}

	/** Тексты собранных кнопок — по порядку текста: у крестика он пуст. */
	const texts = () => assembled.map(([text]) => text).sort()

	/** Теги локали сборок кнопок. */
	const locales = () => assembled.map(([, locale]) => locale)

	// Перед тестом, а не после: общий `afterEach` файла чистит `body` позже
	// хука группы, и связки прошлого теста уничтожаются уже после сброса
	beforeEach(() => {
		assembled.length = 0
		destroyed = 0
	})

	it('contained туда-обратно не пересобирает кнопки в панели', async () => {
		dispose = usePlugins(TComponentView, [TAssemblyProbePlugin], { scope: 'all' })

		const drawer = await render({
			content: '<button is="so-button" class="so-test-action" text="Применить"></button>',
		})
		const action = find('.so-test-action')

		expect(texts()).toEqual(['', 'Применить'])

		drawer.contained = true
		await flush()

		expect(drawer.parentElement).toBe(host())

		drawer.contained = false
		await flush()

		expect(drawer.parentElement).toBe(document.body)
		expect(find('.so-test-action')).toBe(action)
		expect(texts()).toEqual(['', 'Применить'])
		expect(destroyed).toBe(0)
	})

	/**
	 * Панель переставлена одной операцией, без снятия: её новая сборка увозит
	 * панель в цель, и отключение кнопок в ней браузер доводит внутри этого
	 * переноса, — а оно всё равно настоящее. Имя крестика тут не довод: его
	 * пишет шаблон панели из `closeAria`, и сменилось бы оно и без пересборки
	 * крестика.
	 */
	it('панель, переставленная одной операцией, собирает крестик и кнопку под новым провайдером', async () => {
		dispose = usePlugins(TComponentView, [TAssemblyProbePlugin], { scope: 'all' })

		const page = document.createElement('div')

		page.innerHTML = `<so-locale-provider class="so-test-ru"><div is="so-drawer"><button is="so-button" class="so-test-action" text="Применить"></button></div></so-locale-provider>
			<so-locale-provider class="so-test-zh"></so-locale-provider>`
		localeProvider('.so-test-ru', page).locale = ruRU
		localeProvider('.so-test-zh', page).locale = zhCN
		document.body.appendChild(page)
		// Признак переноса первой сборки держится до микрозадачи
		await flush()

		const drawer = panel()
		const action = find('.so-test-action')
		const other = localeProvider('.so-test-zh')

		expect(locales()).toEqual([ruRU.tag, ruRU.tag])

		assembled.length = 0
		other.appendChild(drawer)

		expect(texts()).toEqual(['', 'Применить'])
		expect(locales()).toEqual([zhCN.tag, zhCN.tag])
		expect(destroyed).toBe(2)
		expect(drawer.parentElement).toBe(document.body)
		expect(backdrop().nextElementSibling).toBe(drawer)
		expect(find('.so-test-action')).toBe(action)
		expect(anchors(localeProvider('.so-test-ru'))).toHaveLength(0)
		expect(anchors(other)).toHaveLength(1)
	})

	/**
	 * Полифил встроенных элементов (Safari) зовёт колбэки своим наблюдателем —
	 * микрозадачей позже, по записям: отключение — снятым узлам и элементам в
	 * них, подключение — вставленным. Подложка едет той же операцией базы, и
	 * колбэки после переноса связок не трогают — ни у панели, ни у кнопок в ней.
	 */
	it('колбэки полифила после переноса с подложкой связок не трогают', async () => {
		dispose = usePlugins(TComponentView, [TAssemblyProbePlugin], { scope: 'all' })

		/** Элементы soxa в поддереве узла, сам узел — первым; так их находит полифил. */
		const soxaIn = (node: Node): (TDrawerElementProps | HTMLElement)[] =>
			node instanceof Element
				? [node, ...node.querySelectorAll('*')].filter(
						(each): each is HTMLElement =>
							each instanceof HTMLElement && 'connectedCallback' in each,
					)
				: []
		const callbacks = (el: HTMLElement, name: 'connectedCallback' | 'disconnectedCallback') => {
			const callback: unknown = Reflect.get(el, name)

			if (typeof callback === 'function') callback.call(el)
		}
		const observer = new MutationObserver((records) => {
			for (const record of records) {
				for (const node of record.removedNodes) {
					for (const el of soxaIn(node)) callbacks(el, 'disconnectedCallback')
				}

				for (const node of record.addedNodes) {
					for (const el of soxaIn(node)) callbacks(el, 'connectedCallback')
				}
			}
		})

		observer.observe(document, { childList: true, subtree: true })

		try {
			const drawer = await render({
				content: '<button is="so-button" class="so-test-action" text="Применить"></button>',
			})

			await flush()
			drawer.contained = true
			await flush()
			drawer.contained = false
			await flush()

			expect(drawer.parentElement).toBe(document.body)
			expect(backdrop().nextElementSibling).toBe(drawer)
			expect(texts()).toEqual(['', 'Применить'])
			expect(destroyed).toBe(0)
		} finally {
			observer.disconnect()
		}
	})
})
