import { propertyDetail } from './property-detail'
/**
 * `<div is="so-dialog">` — Dialog в Web Components, проводка целиком, на
 * настоящей разметке.
 *
 * Модель проверяет ядро (`core/__tests__/dialog.spec.ts`), правила фокуса и
 * нажатия мимо — плагины; здесь важно, что они сходятся: окно уехало в цель,
 * подложка — его соседка с тем же слоем, окно помечено владельцем, кнопки
 * шапки говорят с ядром, три причины закрытия проходят через запрос, а окно
 * поверх окна, Select и поповер внутри закрывают только свой слой. Сценарии —
 * те же, что у Vue (`ui/vue/__tests__/dialog.spec.ts`); открытость, которую
 * Vue держит `v-model`, здесь видна событиями `so:change:visible`. Поповер
 * внутри — то же правило слоёв, что у Select.
 *
 * Своё у Web Components — спутник корня. Подложку строит шаблон, а ставит
 * прямо перед окном, увозит в цель и обратно, уводит за местом и прячет база
 * элемента. И перенос: окно уезжает силами базы, и ни перенос, ни смена цели
 * не пересобирают кнопки в нём, а окно, переставленное потребителем одной
 * операцией, собирает их заново — с локалью нового места.
 *
 * Раскладку, переходы темы и действие `mousedown` jsdom не выполняет: место,
 * размер, появление и исчезание — `playground/vue/browser/webc-frame.spec.ts`
 * и браузерные спеки Vue. Отрисовка — микрозадачей после смены ядра,
 * слушатели плагинов и фокус — кадром позже.
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { TButton, TComponentView, TDialog } from '@soxa-ui/core'
import type { TCloseEvent, TCloseReason } from '@soxa-ui/core'
import {
	TBasePlugin,
	ruRU,
	zhCN,
	type IPluginContext,
	type TDialogOffsetEvent,
} from '@soxa-ui/plugins'
import { DialogDescriptor, usePlugins } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'
import { TDialogElement, TLocaleProviderElement, type TDialogElementProps } from '@soxa-ui/webc'
import { dialogTemplate } from '../src/components/dialog/dialog.template'
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
})

function isDialog(node: Element | null): node is TDialogElementProps {
	return node instanceof TDialogElement
}

/** Содержимое окна с двумя остановками Tab. */
const INSIDE = `<button class="so-test-first">Первая</button>
	<button class="so-test-second">Вторая</button>`

/** Заголовок окна — слотом `title`. */
const TITLE = '<span slot="title">Настройки</span>'

/** Что рисует страница: атрибуты окна, его свет и инстанс. */
type TPage = {
	/** Атрибуты разметки окна. */
	readonly attrs?: string
	/** Свет окна: заголовок, содержимое, подвал. */
	readonly content?: string
	/** Инстанс — до вставки: связка берёт его при подключении. */
	readonly ctrl?: TDialog
}

/**
 * Страница с кнопкой, которая открывает окно, и само окно в контейнере
 * `.so-test-place` — разметкой, как его пишет потребитель. Элементы живые уже
 * до вставки (`innerHTML` в неподключённом узле), и инстанс ставится до
 * подключения. После вставки — микрозадача отрисовки и кадр.
 */
async function render({
	attrs = '',
	content = `${TITLE}${INSIDE}`,
	ctrl,
}: TPage = {}): Promise<TDialogElementProps> {
	const page = document.createElement('div')

	page.className = 'so-test-place'
	page.innerHTML = `<button class="so-test-opener">Открыть</button>
		<div is="so-dialog" ${attrs}>${content}</div>`

	const dialog = page.querySelector('div')

	if (!isDialog(dialog)) throw new Error('<div is="so-dialog"> нет')

	if (ctrl) dialog.ctrl = ctrl

	document.body.appendChild(page)
	await flush()
	await nextFrame()

	return dialog
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

const panel = (scope: ParentNode = document) => find('.so-dialog', scope)
const backdrop = (scope: ParentNode = document) => find('.so-backdrop:has(+ .so-dialog)', scope)
const isOpen = (element: HTMLElement = panel()) => element.style.display !== 'none'
const opener = () => find('.so-test-opener')
const place = () => find('.so-test-place')

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
function press(key: string, options: KeyboardEventInit = {}): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options })

	;(document.activeElement ?? document.body).dispatchEvent(event)

	return event
}

/** Открыть окно с кнопки страницы и дождаться, пока фокус уйдёт в окно. */
async function open(dialog: TDialogElementProps): Promise<void> {
	opener().focus()
	dialog.visible = true

	await flush()
	await nextFrame()
}

/** Причины закрытия, которые видел подписчик `so:close:before`. */
function reasonsOf(dialog: Element): TCloseReason[] {
	const reasons: TCloseReason[] = []

	dialog.addEventListener('so:close:before', (event) => {
		if (event instanceof CustomEvent) {
			const detail: TCloseEvent = event.detail

			reasons.push(detail.reason)
		}
	})

	return reasons
}

describe('разметка', () => {
	it('окно уехало целиком: подложка и панель — соседи в body, подложка раньше', async () => {
		await render()

		expect(panel().parentElement).toBe(document.body)
		expect(backdrop().parentElement).toBe(document.body)
		expect(backdrop().nextElementSibling).toBe(panel())
		expect(panel().contains(backdrop())).toBe(false)
		expect(anchors(place())).toHaveLength(1)
		expect(place().querySelector('.so-backdrop:has(+ .so-dialog)')).toBeNull()
	})

	it('закрытое окно спрятано вместе с подложкой, а не убрано', async () => {
		await render()

		expect(isOpen()).toBe(false)
		expect(isOpen(backdrop())).toBe(false)
		expect(document.querySelector('.so-test-first')).not.toBeNull()
	})

	it('панель — модальный диалог, имя — заголовок', async () => {
		await render()

		const title = find('.so-dialog__title')

		expect(panel().getAttribute('role')).toBe('dialog')
		expect(panel().getAttribute('aria-modal')).toBe('true')
		expect(panel().getAttribute('tabindex')).toBe('-1')
		expect(panel().getAttribute('aria-labelledby')).toBe(title.id)
		expect(title.textContent).toBe('Настройки')
		expect(panel().hasAttribute('aria-describedby')).toBe(false)
	})

	it('предупреждение — alertdialog, описание — тело окна', async () => {
		await render({ attrs: 'alert' })

		const body = find('.so-dialog__body')

		expect(panel().getAttribute('role')).toBe('alertdialog')
		expect(panel().getAttribute('aria-describedby')).toBe(body.id)
		expect(body.contains(find('.so-test-first'))).toBe(true)
	})

	it('слоты — по местам: заголовок, тело, подвал; заголовок и подвал без пробелов', async () => {
		await render({
			content: `${TITLE}${INSIDE}<button slot="footer" class="so-test-ok">Готово</button>`,
		})

		expect(find('.so-dialog__title').textContent).toBe('Настройки')
		expect(find('.so-dialog__body').contains(find('.so-test-first'))).toBe(true)
		expect(find('.so-dialog__footer').contains(find('.so-test-ok'))).toBe(true)
		expect(find('.so-dialog__footer').childNodes).toHaveLength(1)
	})

	it('без заголовка и подвала их узлы пусты: тема сворачивает их по :empty', async () => {
		await render({ content: INSIDE })

		expect(find('.so-dialog__title').childNodes).toHaveLength(0)
		expect(find('.so-dialog__footer').childNodes).toHaveLength(0)
	})

	it('порядок в окне — заголовок, тело, подвал, крестик', async () => {
		await render()

		const [title, body, footer, close, ...rest] = panel().children

		expect(title.classList.contains('so-dialog__title')).toBe(true)
		expect(body.classList.contains('so-dialog__body')).toBe(true)
		expect(footer.classList.contains('so-dialog__footer')).toBe(true)
		expect(close.classList.contains('so-dialog__close')).toBe(true)
		expect(rest).toEqual([])
	})

	it('место — модификатором, по умолчанию центр; развёрнутость — data-maximized', async () => {
		await render({ attrs: 'placement="end"' })

		expect(panel().classList).toContain('so-dialog--placement-end')
		expect(panel().dataset.maximized).toBe('false')

		panel().remove()
		await render()

		expect(panel().classList).toContain('so-dialog--placement-center')
	})

	/** По нему тема гасит закрытое окно вместе с подложкой. */
	it('открытость — data-open у панели и подложки, туда и обратно', async () => {
		const dialog = await render()

		expect(panel().dataset.open).toBe('false')
		expect(backdrop().dataset.open).toBe('false')

		await open(dialog)

		expect(panel().dataset.open).toBe('true')
		expect(backdrop().dataset.open).toBe('true')

		dialog.visible = false
		await flush()

		expect(panel().dataset.open).toBe('false')
		expect(backdrop().dataset.open).toBe('false')
	})

	it('размер — переменными темы, не инлайном', async () => {
		await render({ attrs: 'width="480" height="60vh"' })

		expect(panel().style.getPropertyValue('--so-dialog-width')).toBe('480px')
		expect(panel().style.getPropertyValue('--so-dialog-height')).toBe('60vh')
		expect(panel().style.width).toBe('')
	})

	it('незаданный размер переменной не даёт: умолчание — у темы', async () => {
		await render()

		expect(panel().style.getPropertyValue('--so-dialog-width')).toBe('')
		expect(panel().style.getPropertyValue('--so-dialog-height')).toBe('')
	})

	it('открытое: панель и подложка в одном слое — z-index и data-layer одни', async () => {
		const dialog = await render()

		await open(dialog)

		const layer = panel().dataset.layer

		expect(layer).toMatch(/^\d+$/)
		expect(backdrop().dataset.layer).toBe(layer)
		expect(panel().style.zIndex).toBe(layer)
		expect(backdrop().style.zIndex).toBe(layer)
	})

	it('панель помечена владельцем, подложка — нет: для окна она мимо', async () => {
		await render()

		expect(panel().dataset.owner).toBeTruthy()
		expect(backdrop().hasAttribute('data-owner')).toBe(false)
	})

	it('атрибуты и слушатели потребителя — на панели в цели', async () => {
		const dialog = await render({ attrs: 'class="so-test-mine" data-test="x" tabindex="0"' })
		const clicks: Event[] = []

		dialog.addEventListener('click', (event) => clicks.push(event))

		expect(panel()).toBe(dialog)
		expect(panel().classList).toContain('so-test-mine')
		expect(panel().classList).toContain('so-dialog')
		expect(panel().dataset.test).toBe('x')
		// Атрибут потребителя главнее остановки фокуса разметки
		expect(panel().getAttribute('tabindex')).toBe('0')

		panel().click()

		expect(clicks).toHaveLength(1)
	})

	it('target меняет место: панель и подложка — в своей цели', async () => {
		const host = document.createElement('div')

		host.id = 'so-test-host'
		document.body.appendChild(host)

		await render({ attrs: 'target="#so-test-host"' })

		expect(panel().parentElement).toBe(host)
		expect(backdrop().parentElement).toBe(host)
		expect(backdrop().nextElementSibling).toBe(panel())
	})

	it('шаблон объявляет ровно те слоты, что и дескриптор', () => {
		const root = document.createElement('div')
		const targets = dialogTemplate.create(root, bareContext(root)).slots

		expect(Object.keys(targets).sort()).toEqual(
			DialogDescriptor()
				.slots.map((slot) => slot.name)
				.sort(),
		)
	})
})

/**
 * Подложка — спутник корня: шаблон её строит, а ставит, увозит и прячет база.
 * Она стоит прямо перед окном, где бы оно ни было, — в цели, на месте без
 * цели, — ездит с ним одной операцией и уходит с ним за местом.
 */
describe('подложка — спутник окна', () => {
	it('смена цели увозит подложку вместе с окном, тем же узлом', async () => {
		const first = document.body.appendChild(document.createElement('section'))
		const second = document.body.appendChild(document.createElement('section'))

		first.id = 'so-test-first'
		second.id = 'so-test-second'

		const dialog = await render({ attrs: 'target="#so-test-first"' })
		const shade = backdrop()

		dialog.target = '#so-test-second'
		await flush()

		expect(backdrop()).toBe(shade)
		expect(shade.parentElement).toBe(second)
		expect(shade.nextElementSibling).toBe(dialog)
		expect(first.children).toHaveLength(0)
	})

	it('цели нет — окно с подложкой на месте и скрыты, цель вернулась — оба в цели', async () => {
		const dialog = await render({ attrs: 'visible' })
		const shade = backdrop()

		dialog.target = '#so-test-missing'
		await flush()

		expect(dialog.parentElement).toBe(place())
		expect(shade.parentElement).toBe(place())
		expect(shade.nextElementSibling).toBe(dialog)
		expect(isOpen()).toBe(false)
		expect(isOpen(shade)).toBe(false)
		expect(anchors(place())).toHaveLength(0)

		dialog.target = 'body'
		await flush()

		expect(dialog.parentElement).toBe(document.body)
		expect(shade.parentElement).toBe(document.body)
		expect(shade.nextElementSibling).toBe(dialog)
		expect(isOpen()).toBe(true)
		expect(isOpen(shade)).toBe(true)
		expect(anchors(place())).toHaveLength(1)
	})

	it('rendered=false прячет окно вместе с подложкой', async () => {
		const dialog = await render({ attrs: 'visible' })

		dialog.rendered = false
		await flush()

		expect(isOpen()).toBe(false)
		expect(isOpen(backdrop())).toBe(false)

		dialog.rendered = true
		await flush()

		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
	})

	it('снятое окно уносит подложку из цели и якорь с места', async () => {
		const dialog = await render()

		dialog.remove()

		expect(document.querySelector('.so-backdrop:has(+ .so-dialog)')).toBeNull()
		expect(anchors(place())).toHaveLength(0)
	})

	/**
	 * Окно ходит с местом: контейнер с якорем ушёл из документа — окно и
	 * подложка уходят из цели в него. Вставленный снова контейнер увозит их
	 * заново, подложку — снова перед окном.
	 */
	it('снятие контейнера уводит окно с подложкой, вставка — снова в цели', async () => {
		const dialog = await render({ attrs: 'visible' })
		const container = place()

		container.remove()
		// Место сторожит наблюдатель документа — микрозадачей позже
		await flush()

		expect(dialog.isConnected).toBe(false)
		expect(document.querySelector('.so-backdrop:has(+ .so-dialog)')).toBeNull()

		document.body.appendChild(container)
		await flush()

		expect(dialog.parentElement).toBe(document.body)
		expect(backdrop().nextElementSibling).toBe(dialog)
		expect(document.querySelectorAll('.so-backdrop:has(+ .so-dialog)')).toHaveLength(1)
		expect(isOpen(backdrop())).toBe(true)
	})

	it('переставленное потребителем окно — новое место, подложка снова перед ним', async () => {
		const dialog = await render()
		const other = document.body.appendChild(document.createElement('section'))

		other.appendChild(dialog)
		await flush()

		expect(dialog.parentElement).toBe(document.body)
		expect(backdrop().nextElementSibling).toBe(dialog)
		expect(document.querySelectorAll('.so-backdrop:has(+ .so-dialog)')).toHaveLength(1)
		expect(anchors(place())).toHaveLength(0)
		expect(anchors(other)).toHaveLength(1)
	})
})

describe('отступ', () => {
	/** Переменные отступа панели — по стороне. */
	const offsets = () => ({
		top: panel().style.getPropertyValue('--so-dialog-offset-top'),
		bottom: panel().style.getPropertyValue('--so-dialog-offset-bottom'),
		start: panel().style.getPropertyValue('--so-dialog-offset-start'),
		end: panel().style.getPropertyValue('--so-dialog-offset-end'),
	})

	it('offset — переменными темы по сторонам, не инлайном', async () => {
		await render({ attrs: 'offset="24"' })

		expect(offsets()).toEqual({ top: '24px', bottom: '24px', start: '24px', end: '24px' })
		expect(panel().getAttribute('style')).not.toMatch(/inset|margin/)
	})

	it('незаданный отступ переменных не даёт: умолчание — у темы', async () => {
		await render()

		expect(offsets()).toEqual({ top: '', bottom: '', start: '', end: '' })
	})

	it('смена offset свойством пересчитывает переменные', async () => {
		const dialog = await render({ attrs: 'offset="24"' })

		dialog.offset = '5%'
		await flush()

		expect(offsets().top).toBe('5%')

		dialog.offset = undefined
		await flush()

		expect(offsets().top).toBe('')
	})

	it('обработчик so:layout:offset:before правит сторону у окна, открытого позже', async () => {
		const page = document.createElement('div')

		page.innerHTML = `<button class="so-test-opener">Открыть</button>
			<div is="so-dialog" offset="24">${INSIDE}</div>`

		const dialog = page.querySelector('div')

		if (!isDialog(dialog)) throw new Error('<div is="so-dialog"> нет')

		dialog.addEventListener('so:layout:offset:before', (event) => {
			if (event instanceof CustomEvent) {
				const detail: TDialogOffsetEvent = event.detail

				detail.top = '10%'
			}
		})
		document.body.appendChild(page)
		await flush()
		await open(dialog)

		expect(offsets()).toEqual({ top: '10%', bottom: '24px', start: '24px', end: '24px' })
	})

	it('и у созданного видимым: показа, который пересчитал бы стили, у него нет', async () => {
		const placements: string[] = []
		const dialog = document.createElement('div', { is: 'so-dialog' })

		if (!isDialog(dialog)) throw new Error('<div is="so-dialog"> нет')

		dialog.visible = true
		dialog.placement = 'start'
		dialog.offset = 24
		dialog.addEventListener('so:layout:offset:before', (event) => {
			if (event instanceof CustomEvent) {
				const detail: TDialogOffsetEvent = event.detail

				placements.push(detail.placement)
				detail.start = 0
			}
		})
		document.body.appendChild(dialog)
		await flush()

		expect(placements).toContain('start')
		expect(offsets()).toEqual({ top: '24px', bottom: '24px', start: '0px', end: '24px' })
	})
})

describe('кнопки шапки', () => {
	it('крестик назван локалью — без провайдера английской; closable: false убирает его из DOM', async () => {
		const dialog = await render()
		const close = find('.so-dialog__close')

		expect(close.getAttribute('aria-label')).toBe('Close')
		expect(close.getAttribute('type')).toBe('button')
		expect(close.querySelector('.so-icon')?.getAttribute('icon')).toBe('close')

		dialog.closable = false
		await flush()

		expect(document.querySelector('.so-dialog__close')).toBeNull()

		dialog.closable = true
		await flush()

		expect(find('.so-dialog__close')).toBe(close)
		expect(panel().lastElementChild).toBe(close)
	})

	it('крестик назван локалью провайдера вокруг места окна, а не вокруг body', async () => {
		const host = document.createElement('div')

		host.innerHTML = `<so-locale-provider><div is="so-dialog">${INSIDE}</div></so-locale-provider>`

		const provider = host.querySelector('so-locale-provider')

		if (!(provider instanceof TLocaleProviderElement)) throw new Error('провайдера нет')

		provider.locale = ruRU
		document.body.appendChild(host)
		await flush()

		expect(panel().parentElement).toBe(document.body)
		expect(find('.so-dialog__close').getAttribute('aria-label')).toBe('Закрыть')
	})

	it('кнопки разворота по умолчанию нет, maximizable её рисует перед крестиком', async () => {
		const dialog = await render()

		expect(document.querySelector('.so-dialog__maximize')).toBeNull()

		dialog.maximizable = true
		await flush()

		const button = find('.so-dialog__maximize')

		expect(button.getAttribute('aria-label')).toBe('Maximize')
		expect(button.getAttribute('aria-pressed')).toBe('false')
		expect(button.getAttribute('type')).toBe('button')
		expect(button.nextElementSibling).toBe(find('.so-dialog__close'))
		expect(button.previousElementSibling).toBe(find('.so-dialog__footer'))
	})

	it('разворот переключает maximized: data-maximized, aria-pressed и иконка', async () => {
		const ctrl = new TDialog()
		const dialog = await render({ ctrl, attrs: 'maximizable' })

		await open(dialog)

		const button = find('.so-dialog__maximize')
		/** Роль значка кнопки — единственной иконки в ней. */
		const roles = () =>
			[...button.querySelectorAll('.so-icon')].map((icon) => icon.getAttribute('icon'))

		expect(roles()).toEqual(['arrowsOutward'])
		// Значок — в строке кнопки, как у Vue
		expect(button.querySelector('.so-button__text > .so-icon')).not.toBeNull()

		button.click()
		await flush()

		expect(ctrl.maximized).toBe(true)
		expect(panel().dataset.maximized).toBe('true')
		expect(button.getAttribute('aria-pressed')).toBe('true')
		expect(roles()).toEqual(['arrowsInward'])
		expect(button.querySelector('.so-button__text > .so-icon')).not.toBeNull()

		button.click()
		await flush()

		expect(panel().dataset.maximized).toBe('false')
		expect(roles()).toEqual(['arrowsOutward'])
	})

	it('у иконки роль — рисунок из пакета иконок', async () => {
		await render({ attrs: 'maximizable' })

		const path = document.querySelector('.so-dialog__maximize svg path')?.getAttribute('d')

		expect(path).toBe(/d="([^"]+)"/.exec(material.arrowsOutward.body)?.[1])
	})

	it('слоты значков разворота — по состоянию окна, в строке кнопки, те же узлы', async () => {
		const dialog = await render({
			attrs: 'maximizable',
			content: `${INSIDE}<i slot="maximize-icon" class="so-test-out">↗</i><i slot="restore-icon" class="so-test-in">↙</i>`,
		})
		const button = find('.so-dialog__maximize')
		const outward = find('.so-test-out')

		expect(button.querySelector('.so-icon')).toBeNull()
		expect(outward.parentElement?.classList.contains('so-button__text')).toBe(true)
		expect(document.querySelector('.so-test-in')).toBeNull()

		dialog.maximized = true
		await flush()

		const inward = find('.so-test-in')

		expect(inward.parentElement?.classList.contains('so-button__text')).toBe(true)
		expect(document.querySelector('.so-test-out')).toBeNull()

		dialog.maximized = false
		await flush()

		expect(find('.so-test-out')).toBe(outward)
		expect(outward.parentElement?.classList.contains('so-button__text')).toBe(true)
		expect(document.querySelector('.so-test-in')).toBeNull()
	})

	it('слот значка одного варианта, иконка — другого', async () => {
		const dialog = await render({
			attrs: 'maximizable',
			content: `${INSIDE}<i slot="restore-icon" class="so-test-in">↙</i>`,
		})
		const button = find('.so-dialog__maximize')

		expect(button.querySelector('.so-icon')?.getAttribute('icon')).toBe('arrowsOutward')

		dialog.maximized = true
		await flush()

		expect(button.querySelector('.so-icon')).toBeNull()
		expect(find('.so-test-in').parentElement?.classList.contains('so-button__text')).toBe(true)
	})

	it('слот close-icon заменяет иконку крестика целиком', async () => {
		await render({ content: `${INSIDE}<i slot="close-icon" class="so-test-x">×</i>` })

		const close = find('.so-dialog__close')

		expect(close.querySelector('.so-test-x')).not.toBeNull()
		expect(close.querySelector('.so-icon')).toBeNull()
	})

	it('разворот виден событием: so:change:maximized на каждый клик', async () => {
		const dialog = await render({ attrs: 'maximizable' })
		const changes = collect(dialog, 'so:change:maximized')

		await open(dialog)

		find('.so-dialog__maximize').click()
		await flush()

		expect(changes).toEqual([true])
	})
})

describe('закрытие пользователем', () => {
	it('крестик — причина button, фокус возвращается туда, откуда открыли', async () => {
		const dialog = await render()
		const reasons = reasonsOf(dialog)

		await open(dialog)

		expect(document.activeElement).toBe(find('.so-test-first'))

		find('.so-dialog__close').click()
		await flush()

		expect(reasons).toEqual(['button'])
		expect(dialog.visible).toBe(false)
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('Escape — причина escape, клавиша погашена', async () => {
		const dialog = await render()
		const reasons = reasonsOf(dialog)

		await open(dialog)

		const event = press('Escape')

		await flush()

		expect(event.defaultPrevented).toBe(true)
		expect(reasons).toEqual(['escape'])
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('нажатие по подложке — причина outside, фокус возвращается', async () => {
		const dialog = await render()
		const reasons = reasonsOf(dialog)

		await open(dialog)

		pointerDown(backdrop())
		await flush()

		expect(reasons).toEqual(['outside'])
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('нажатие в окно его не закрывает', async () => {
		const dialog = await render()

		await open(dialog)

		pointerDown(find('.so-test-second'))
		await flush()

		expect(isOpen()).toBe(true)
	})

	it('отмена so:close:before — preventDefault события DOM — оставляет окно открытым', async () => {
		const dialog = await render()

		dialog.addEventListener('so:close:before', (event) => event.preventDefault())
		await open(dialog)

		find('.so-dialog__close').click()
		press('Escape')
		pointerDown(backdrop())
		await flush()

		expect(dialog.visible).toBe(true)
		expect(isOpen()).toBe(true)
	})

	describe('dismissible: false', () => {
		it('подложка и Escape окно не закрывают и so:close:before не шлют', async () => {
			const dialog = await render()
			const reasons = reasonsOf(dialog)

			dialog.dismissible = false
			await open(dialog)

			pointerDown(backdrop())
			press('Escape')
			await flush()

			expect(reasons).toEqual([])
			expect(isOpen()).toBe(true)
		})

		it('крестик закрывает', async () => {
			const dialog = await render()

			dialog.dismissible = false
			await open(dialog)

			find('.so-dialog__close').click()
			await flush()

			expect(isOpen()).toBe(false)
		})
	})
})

describe('открытость — visible', () => {
	it('visible свойством открывает и закрывает, программное закрытие — без so:close:before', async () => {
		const dialog = await render()
		const reasons = reasonsOf(dialog)

		await open(dialog)

		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
		expect(document.activeElement).toBe(find('.so-test-first'))

		dialog.visible = false
		await flush()
		await nextFrame()

		expect(isOpen()).toBe(false)
		expect(isOpen(backdrop())).toBe(false)
		expect(reasons).toEqual([])
		expect(document.activeElement).toBe(opener())
	})

	it('открытие и закрытие пользователем видит so:change:visible', async () => {
		const dialog = await render()
		const changes = collect(dialog, 'so:change:visible')

		await open(dialog)
		press('Escape')
		await flush()

		expect(dialog.visible).toBe(false)
		expect(changes).toEqual([true, false])
	})

	it('visible из инстанса открывает так же, как из разметки', async () => {
		const ctrl = new TDialog()

		await render({ ctrl })

		opener().focus()
		ctrl.visible = true
		await flush()
		await nextFrame()

		expect(isOpen()).toBe(true)
		expect(document.activeElement).toBe(find('.so-test-first'))
	})
})

describe('окно поверх окна', () => {
	/** Нижнее окно, из которого открыто верхнее. */
	async function renderNested() {
		const lower = await render({
			attrs: 'class="so-test-lower"',
			content: `<button class="so-test-lower-first">Внизу</button>
				<div is="so-dialog" class="so-test-upper"><button class="so-test-upper-first">Наверху</button></div>`,
		})
		const upper = document.querySelector('.so-test-upper')

		if (!isDialog(upper)) throw new Error('верхнего окна нет')

		opener().focus()
		lower.visible = true
		await flush()
		await nextFrame()

		upper.visible = true
		await flush()
		await nextFrame()

		return { lower, upper }
	}

	const backdropOf = (dialog: HTMLElement) => {
		const previous = dialog.previousElementSibling

		if (!(previous instanceof HTMLElement)) throw new Error('у окна нет подложки')

		return previous
	}

	it('верхнее окно — слоем выше нижнего, его подложка — тоже; оба в body', async () => {
		const { lower, upper } = await renderNested()

		expect(Number(upper.dataset.layer)).toBeGreaterThan(Number(lower.dataset.layer))
		expect(backdropOf(upper).dataset.layer).toBe(upper.dataset.layer)
		expect(upper.parentElement).toBe(document.body)
		expect(lower.contains(upper)).toBe(false)
		expect(document.activeElement).toBe(find('.so-test-upper-first'))
	})

	it('нажатие по подложке верхнего закрывает только его', async () => {
		const { lower, upper } = await renderNested()

		pointerDown(backdropOf(upper))
		await flush()

		expect(upper.visible).toBe(false)
		expect(lower.visible).toBe(true)
		expect(document.activeElement).toBe(find('.so-test-lower-first'))
	})

	it('Escape в верхнем закрывает только его', async () => {
		const { lower, upper } = await renderNested()

		press('Escape')
		await flush()

		expect(upper.visible).toBe(false)
		expect(lower.visible).toBe(true)
	})

	it('нижнее окно для скринридера спрятано, пока открыто верхнее', async () => {
		const { lower, upper } = await renderNested()

		expect(lower.getAttribute('aria-hidden')).toBe('true')
		expect(upper.closest('[aria-hidden="true"]')).toBeNull()

		upper.visible = false
		await flush()
		await nextFrame()

		expect(lower.hasAttribute('aria-hidden')).toBe(false)
	})
})

/**
 * Select в окне, как у Vue: его список — слой в `body` выше окна, соседка
 * окна. Нажатие в него — нажатие внутри, а Escape закрывает только список.
 */
describe('Select внутри', () => {
	const withSelect = `${INSIDE}<div is="so-select" class="so-test-select">
		<div is="so-select-item" value="a" text="Первый"></div>
		<div is="so-select-item" value="b" text="Второй"></div>
	</div>`

	const field = () => find('.so-test-select input')
	const selectPanel = () => find('.so-select__panel')

	/** Клик мышью целиком: нажатие, фокус от `mousedown`, клик — и отрисовка. */
	async function click(target: HTMLElement): Promise<void> {
		pointerDown(target)
		target.focus()
		target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

		await flush()
		await flush()
	}

	it('список Select — слоем выше окна: нажатие в него окно не закрывает', async () => {
		const dialog = await render({ content: withSelect })

		await open(dialog)
		await click(field())
		await nextFrame()

		expect(isOpen(selectPanel())).toBe(true)
		expect(Number(selectPanel().dataset.layer)).toBeGreaterThan(Number(panel().dataset.layer))

		const option = find('.so-select__panel [role="option"]')

		pointerDown(option)
		option.click()
		await flush()

		expect(dialog.visible).toBe(true)
		expect(isOpen()).toBe(true)
	})

	it('Escape в открытом Select закрывает только Select, второй — окно', async () => {
		const dialog = await render({ content: withSelect })

		await open(dialog)
		await click(field())

		expect(isOpen(selectPanel())).toBe(true)

		press('Escape')
		await flush()
		await flush()

		expect(isOpen(selectPanel())).toBe(false)
		expect(dialog.visible).toBe(true)

		press('Escape')
		await flush()

		expect(dialog.visible).toBe(false)
	})
})

/**
 * Поповер в окне: его панель — тоже слой в `body`, соседка окна, — то же
 * правило слоёв, что у Select.
 */
describe('поповер внутри', () => {
	const withPopover = `${INSIDE}<span is="so-popover" class="so-test-popover">
		<button is="so-button" slot="trigger" class="so-test-trigger" text="Ещё"></button>
		<button class="so-test-in-popover">Внутри</button>
	</span>`

	const popoverPanel = () => find('.so-popover__panel')

	it('панель поповера — слоем выше окна: нажатие в неё окно не закрывает', async () => {
		const dialog = await render({ content: withPopover })

		await open(dialog)

		find('.so-test-trigger').click()
		await flush()
		await nextFrame()

		expect(isOpen(popoverPanel())).toBe(true)
		expect(Number(popoverPanel().dataset.layer)).toBeGreaterThan(Number(panel().dataset.layer))

		pointerDown(find('.so-test-in-popover'))
		await flush()

		expect(dialog.visible).toBe(true)
		expect(isOpen()).toBe(true)
	})

	it('Escape в открытом поповере закрывает только поповер, второй — окно', async () => {
		const dialog = await render({ content: withPopover })

		await open(dialog)

		find('.so-test-trigger').click()
		await flush()
		await nextFrame()

		expect(isOpen(popoverPanel())).toBe(true)

		press('Escape')
		await flush()

		expect(isOpen(popoverPanel())).toBe(false)
		expect(dialog.visible).toBe(true)

		press('Escape')
		await flush()

		expect(dialog.visible).toBe(false)
	})
})

describe('фон под окном', () => {
	it('открытое окно прячет страницу от скринридера и запирает прокрутку', async () => {
		const dialog = await render()

		await open(dialog)

		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		dialog.visible = false
		await flush()
		await nextFrame()

		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.documentElement.style.overflow).toBe('')
	})

	/**
	 * Элемент потребителя компонент не снимает, а прячет, но корня у окна с
	 * `rendered=false`, как у Vue с `v-if`, нет и у плагинов: открытое окно
	 * отпускает прокрутку и пометки фона сразу, оставаясь открытым. Снова
	 * показанное — запирает страницу заново, кадром `ready` своего узла, а
	 * закрытое потом отпускает всё: счёт замка и пометок сошёлся.
	 */
	it('rendered=false у открытого окна отпускает страницу, rendered=true — запирает снова', async () => {
		const dialog = await render()

		await open(dialog)

		expect(muted()).not.toEqual([])
		expect(document.documentElement.style.overflow).toBe('hidden')

		dialog.rendered = false
		await flush()

		expect(dialog.visible).toBe(true)
		expect(isOpen()).toBe(false)
		expect(muted()).toEqual([])
		expect(document.documentElement.style.overflow).toBe('')

		dialog.rendered = true
		await flush()
		await nextFrame()

		expect(isOpen()).toBe(true)
		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		dialog.visible = false
		await flush()
		await nextFrame()

		expect(muted()).toEqual([])
		expect(document.documentElement.style.overflow).toBe('')
	})
})

/**
 * Сборки считает плагин-зонд при установке набора: перенос, смена цели и
 * подложка рядом связку не трогают ни у окна, ни у кнопок в нём, а окно,
 * переставленное потребителем, собирает их заново.
 */
describe('перенос', () => {
	/** Сборки кнопок — их текст и тег локали, по одной на связку. */
	const assembled: (readonly [text: string, locale: string])[] = []

	/** Уничтоженные связки кнопок. */
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

	it('перенос в цель и смена цели не пересобирают кнопки в окне', async () => {
		dispose = usePlugins(TComponentView, [TAssemblyProbePlugin], { scope: 'all' })

		const second = document.body.appendChild(document.createElement('section'))

		second.id = 'so-test-second'

		const dialog = await render({
			content: `${TITLE}<button is="so-button" class="so-test-action" text="Действие"></button>`,
		})
		const action = find('.so-test-action')

		// Кнопка в окне и крестик без текста — по одной сборке
		expect(texts()).toEqual(['', 'Действие'])

		dialog.target = '#so-test-second'
		await flush()
		dialog.target = 'body'
		await flush()

		expect(panel().parentElement).toBe(document.body)
		expect(find('.so-test-action')).toBe(action)
		expect(texts()).toEqual(['', 'Действие'])
		expect(destroyed).toBe(0)
	})

	/**
	 * Окно переставлено одной операцией, без снятия: его новая сборка увозит
	 * окно в цель, и отключение кнопок в нём браузер доводит внутри этого
	 * переноса, — а оно всё равно настоящее. Имя крестика тут не довод: его
	 * пишет шаблон окна из `closeAria`, и сменилось бы оно и без пересборки
	 * крестика.
	 */
	it('окно, переставленное одной операцией, собирает крестик и кнопку под новым провайдером', async () => {
		dispose = usePlugins(TComponentView, [TAssemblyProbePlugin], { scope: 'all' })

		const page = document.createElement('div')

		page.innerHTML = `<so-locale-provider class="so-test-ru"><div is="so-dialog">${TITLE}<button is="so-button" class="so-test-action" text="Действие"></button></div></so-locale-provider>
			<so-locale-provider class="so-test-zh"></so-locale-provider>`
		localeProvider('.so-test-ru', page).locale = ruRU
		localeProvider('.so-test-zh', page).locale = zhCN
		document.body.appendChild(page)
		// Признак переноса первой сборки держится до микрозадачи
		await flush()

		const dialog = panel()
		const action = find('.so-test-action')
		const other = localeProvider('.so-test-zh')

		expect(locales()).toEqual([ruRU.tag, ruRU.tag])

		assembled.length = 0
		other.appendChild(dialog)

		expect(texts()).toEqual(['', 'Действие'])
		expect(locales()).toEqual([zhCN.tag, zhCN.tag])
		expect(destroyed).toBe(2)
		expect(dialog.parentElement).toBe(document.body)
		expect(backdrop().nextElementSibling).toBe(dialog)
		expect(find('.so-test-action')).toBe(action)
		expect(anchors(localeProvider('.so-test-ru'))).toHaveLength(0)
		expect(anchors(other)).toHaveLength(1)
	})
})

describe('non-modal dialog', () => {
	it('preserves focus, page access and natural keyboard navigation', async () => {
		const dialog = await render({ ctrl: new TDialog({ modal: false, dismissible: false }) })
		await open(dialog)

		expect(document.activeElement).toBe(opener())
		expect(panel().getAttribute('role')).toBe('dialog')
		expect(panel().hasAttribute('aria-modal')).toBe(false)
		expect(panel().getAttribute('aria-labelledby')).toBe(
			panel().querySelector('.so-dialog__title')?.id,
		)
		expect(opener().closest('[aria-hidden="true"], [inert]')).toBeNull()
		expect(document.documentElement.style.overflow).not.toBe('hidden')
		expect(document.body.style.overflow).not.toBe('hidden')

		expect(backdrop().hidden).toBe(true)

		const last = panel().querySelector('.so-dialog__close')
		if (!(last instanceof HTMLElement)) throw new Error('Missing close button')
		last.focus()
		expect(press('Tab').defaultPrevented).toBe(false)
		expect(press('Tab', { shiftKey: true }).defaultPrevented).toBe(false)
		opener().focus()
		pointerDown(opener())
		expect(isOpen()).toBe(true)
		expect(document.activeElement).toBe(opener())

		dialog.visible = false
		await flush()
		await nextFrame()
		expect(document.activeElement).toBe(opener())
	})
})
