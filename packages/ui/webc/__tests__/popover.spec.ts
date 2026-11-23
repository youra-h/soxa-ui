import { propertyDetail } from './property-detail'
import type { TValuePayload } from '@soxa-ui/core'
/**
 * `<span is="so-popover">` — Popover в Web Components, проводка целиком, на
 * настоящей разметке.
 *
 * Модель проверяет ядро, «мимо» и слои — `setup/__tests__/overlay.spec.ts`;
 * здесь важно, что они сходятся: панель — деталь Frame, уехала в `body` и
 * помечена владельцем, якорь панели — корень поповера, фокус уходит в панель и
 * возвращается, Escape и Tab закрывают только свой слой. Сценарии — те же, что
 * у Vue (`ui/vue/__tests__/popover.spec.ts`), и с Select внутри тоже;
 * открытость, которую Vue держит `v-model`, здесь видна событиями
 * `so:change:open`. Вложенный поповер — то же правило слоёв.
 *
 * Своё у Web Components — триггер без scope. Привязать связку с панелью
 * потребитель не может, и шаблон кладёт наборы `triggerAria` и
 * `triggerDataset` на первый элемент слота `trigger` — тот же узел, что
 * написал потребитель. И перенос: панель уезжает в цель силами базы Frame, и
 * ни перенос, ни `contained` не пересобирают кнопки в панели, а поповер,
 * переставленный одной операцией, панель пересобирает — сразу после себя, с
 * локалью нового места. Корень только прячется, поэтому `rendered: false`
 * поповера прячет и открытые панели в `body` — свою и вложенных слоёв —
 * признаком своего поддерева: у Vue их снимает `v-if` корня.
 *
 * Порядок Tab, который ведёт сам браузер, jsdom не считает: здесь проверены
 * переходы, которые делает плагин (Tab в панель, из неё, Shift+Tab на
 * триггер). Отрисовка — микрозадачей после смены ядра, слушатели плагинов —
 * кадром позже.
 */

import { describe, it, expect, expectTypeOf, afterEach, vi } from 'vitest'
import { TButton, TComponentView, TFrame, TPopover } from '@soxa-ui/core'
import { TBasePlugin, ruRU, zhCN, type IPluginContext } from '@soxa-ui/plugins'
import { PopoverDescriptor, usePlugins } from '@soxa-ui/setup'
import {
	TComponentViewElement,
	TDialogElement,
	TLocaleProviderElement,
	TPopoverElement,
	registerPopoverTag,
	type TComponentViewElementProps,
	type TDialogElementProps,
	type TPopoverElementProps,
} from '@soxa-ui/webc'
import { popoverTemplate } from '../src/components/popover/popover.template'
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

function isPopover(node: Element | null): node is TPopoverElementProps {
	return node instanceof TPopoverElement
}

function isView(node: Element | null): node is TComponentViewElementProps {
	return node instanceof TComponentViewElement
}

function isDialog(node: Element | null): node is TDialogElementProps {
	return node instanceof TDialogElement
}

/** Содержимое с двумя остановками Tab. */
const INSIDE = `<button class="so-test-first">Первая</button>
	<button class="so-test-second">Вторая</button>`

/** Триггер так, как его кладёт потребитель: Button в слоте `trigger`. */
const TRIGGER =
	'<button is="so-button" slot="trigger" class="so-test-trigger" text="Открыть"></button>'

/** Что рисует страница: атрибуты поповера, его содержимое, инстанс и соседи. */
type TPage = {
	/** Атрибуты разметки поповера. */
	readonly attrs?: string
	/** Свет поповера после триггера — содержимое панели. */
	readonly content?: string
	/** Инстанс — до вставки: связка берёт его при подключении. */
	readonly ctrl?: TPopover
	/** Кнопки страницы до и после поповера — откуда прийти и куда уйти по Tab. */
	readonly around?: boolean
}

/**
 * Поповер на странице — разметкой, как его пишет потребитель. Элементы живые
 * уже до вставки (`innerHTML` в неподключённом узле), и инстанс ставится до
 * подключения. После вставки — микрозадача отрисовки и кадр: корень плагины
 * получают через `requestAnimationFrame`.
 */
async function render({
	attrs = '',
	content = INSIDE,
	ctrl,
	around = true,
}: TPage = {}): Promise<TPopoverElementProps> {
	const page = document.createElement('div')

	page.innerHTML = `${around ? '<button class="so-test-before">До</button>' : ''}
		<span is="so-popover" ${attrs}>${TRIGGER}${content}</span>
		${around ? '<button class="so-test-after">После</button>' : ''}`

	const popover = page.querySelector('span')

	if (!isPopover(popover)) throw new Error('<span is="so-popover"> нет')

	if (ctrl) popover.ctrl = ctrl

	document.body.appendChild(page)
	await flush()
	await nextFrame()

	return popover
}

/** Узел по селектору; нет его — тест падает здесь, а не на чтении свойства. */
function find(selector: string, scope: ParentNode = document): HTMLElement {
	const element = scope.querySelector(selector)

	if (!(element instanceof HTMLElement)) throw new Error(`${selector}: HTML-узла нет`)

	return element
}

const trigger = () => find('.so-test-trigger')
const panel = (scope: ParentNode = document) => find('.so-popover__panel', scope)
const isOpen = (element: HTMLElement = panel()) => element.style.display !== 'none'

/** Direct children of the page muted by the modal, excluding its decorative backdrop. */
const muted = () => [...document.querySelectorAll('body > [aria-hidden="true"]:not(.so-backdrop)')]

/** Значения `detail` событий с этим именем на элементе. */
function collect(el: Element, name: string): unknown[] {
	const seen: unknown[] = []

	el.addEventListener(name, (event) => {
		if (event instanceof CustomEvent) seen.push(propertyDetail(event))
	})

	return seen
}

/** Нажатие мышью — `pointerdown`, как его слушает плагин оверлея. */
const pointerDown = (target: Element) =>
	target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }))

/** Клик мышью целиком: нажатие, фокус от `mousedown`, клик — и отрисовка. */
async function click(target: HTMLElement): Promise<void> {
	pointerDown(target)
	target.focus()
	target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

	await flush()
}

/** Клавиша на элементе под фокусом. Отдаёт событие: по нему видно, погашена ли она. */
function press(key: string, options: KeyboardEventInit = {}): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options })

	;(document.activeElement ?? document.body).dispatchEvent(event)

	return event
}

/** Открыть кликом по триггеру и дождаться, пока фокус уйдёт в панель. */
async function open(target: HTMLElement = trigger()): Promise<void> {
	await click(target)
	await nextFrame()
}

describe('разметка', () => {
	it('корень — span с триггером, панель уехала в body и скрыта', async () => {
		const root = await render()

		expect(root.localName).toBe('span')
		expect(root.classList.contains('so-popover')).toBe(true)
		expect(root.contains(trigger())).toBe(true)
		expect(root.contains(panel())).toBe(false)
		expect(panel().parentElement).toBe(document.body)
		expect(isOpen()).toBe(false)
	})

	/**
	 * Внутри контейнера панель не уезжает: она в корне, сразу за триггером, и
	 * накрывает ближайший позиционированный предок — раскладка ставит её
	 * `absolute` без координат, место задаёт тема.
	 */
	it('contained: панель в корне за триггером, без координат; нажатие в ней не закрывает', async () => {
		const root = await render({ attrs: 'contained' })

		expect(root.contains(panel())).toBe(true)
		expect(trigger().nextElementSibling).toBe(panel())
		expect(panel().dataset.contained).toBe('true')
		expect(panel().style.position).toBe('absolute')
		expect(panel().style.left).toBe('')
		expect(panel().style.top).toBe('')

		await open()

		expect(isOpen()).toBe(true)
		expect(document.activeElement).toBe(find('.so-test-first'))

		await click(find('.so-test-first'))

		expect(isOpen()).toBe(true)
	})

	it('панель — диалог, aria-controls триггера ведёт на неё', async () => {
		await render()

		expect(panel().getAttribute('role')).toBe('dialog')
		expect(panel().getAttribute('tabindex')).toBe('-1')
		expect(trigger().getAttribute('aria-haspopup')).toBe('dialog')
		expect(trigger().getAttribute('aria-expanded')).toBe('false')
		expect(document.getElementById(trigger().getAttribute('aria-controls') ?? '')).toBe(panel())
	})

	it('ARIA и data-* стоят на своих элементах', async () => {
		const root = await render()

		await open()

		expect(root.dataset.open).toBe('true')
		expect(trigger().dataset.selected).toBe('true')
		expect(trigger().getAttribute('aria-expanded')).toBe('true')
		// ARIA панели — на панели, не на корне. `data-open` у панели свой, от её
		// слоя (Frame): корень уехавшей панели его не отдаёт
		expect(root.hasAttribute('role')).toBe(false)
		expect(panel().dataset.open).toBe('true')
		expect(panel().dataset.layer).toMatch(/^\d+$/)
		expect(root.hasAttribute('data-layer')).toBe(false)
	})

	/**
	 * Открытость панели для темы — `data-open` её слоя: по нему тема проявляет и
	 * гасит панель. Писатель у атрибута один — Frame, чья видимость и есть
	 * `open`, — поэтому он идёт за `open`, как бы его ни меняли: кликом по
	 * триггеру, из инстанса, крестиком.
	 */
	it('data-open панели идёт за open', async () => {
		const popover = new TPopover()

		await render({ ctrl: popover })

		expect(panel().dataset.open).toBe('false')

		await open()

		expect(panel().dataset.open).toBe('true')

		popover.open = false
		await flush()

		expect(panel().dataset.open).toBe('false')

		popover.open = true
		await flush()

		expect(panel().dataset.open).toBe('true')

		await click(find('.so-popover__close'))

		expect(popover.open).toBe(false)
		expect(panel().dataset.open).toBe('false')
	})

	it('aria_label даёт диалогу имя', async () => {
		await render({ attrs: 'aria_label="Фильтры"' })

		expect(panel().getAttribute('aria-label')).toBe('Фильтры')
	})

	/**
	 * Панель уехала в `body`, мимо провайдера, а имя крестика — набор поповера:
	 * его пишет плагин имён от локали поповера, собранного под провайдером.
	 */
	it('крестик назван локалью провайдера вокруг поповера, closable: false его убирает', async () => {
		const host = document.createElement('div')

		host.innerHTML = `<so-locale-provider>
			<span is="so-popover" class="so-test-named">${INSIDE}</span>
			<span is="so-popover" class="so-test-bare">${INSIDE}</span>
		</so-locale-provider>`

		const provider = host.querySelector('so-locale-provider')
		const bare = host.querySelector('.so-test-bare')

		if (!(provider instanceof TLocaleProviderElement) || !isPopover(bare)) {
			throw new Error('разметки нет')
		}

		provider.locale = ruRU
		bare.closable = false
		document.body.appendChild(host)
		await flush()

		const [named, unnamed] = [...document.querySelectorAll('.so-popover__panel')]

		expect(named.parentElement).toBe(document.body)
		expect(named.querySelector('.so-popover__close')?.getAttribute('aria-label')).toBe(
			'Закрыть',
		)
		expect(unnamed.querySelector('.so-popover__close')).toBeNull()
	})

	it('крестик — после содержимого, последним в панели; содержимое — в обёртке', async () => {
		await render()

		const [content, close] = [...panel().children]

		expect(content.className).toBe('so-popover__content')
		expect([...content.children].map((node) => node.className)).toEqual([
			'so-test-first',
			'so-test-second',
		])
		expect(close.classList.contains('so-popover__close')).toBe(true)
		expect(close.getAttribute('type')).toBe('button')
		expect(close.querySelector('.so-icon')?.getAttribute('icon')).toBe('close')
	})

	it('слот close-icon заменяет иконку крестика целиком', async () => {
		await render({ content: `${INSIDE}<i slot="close-icon" class="so-test-icon">×</i>` })

		const close = find('.so-popover__close')

		expect(close.querySelector('.so-test-icon')).not.toBeNull()
		expect(close.querySelector('.so-icon')).toBeNull()
	})

	it('шаблон объявляет ровно те слоты, что и дескриптор', () => {
		const root = document.createElement('span')
		const targets = popoverTemplate.create(root, bareContext(root)).slots

		expect(Object.keys(targets).sort()).toEqual(
			PopoverDescriptor()
				.slots.map((slot) => slot.name)
				.sort(),
		)
	})
})

/**
 * Триггер — элемент потребителя, а scope у слотов нет: наборы связки и вида
 * «нажат» шаблон кладёт на первый элемент слота `trigger` сам. Узел тот же, что
 * написал потребитель, — его не пересоздают, а наборы на нём сменяются на месте.
 */
describe('триггер', () => {
	it('наборы — на первом элементе слота и сменяются на месте, узел тот же', async () => {
		await render({ content: `<span slot="trigger" class="so-test-hint">?</span>${INSIDE}` })

		const button = trigger()
		const hint = find('.so-test-hint')

		expect(button.getAttribute('aria-expanded')).toBe('false')
		expect(button.dataset.selected).toBe('false')
		expect(hint.hasAttribute('aria-expanded')).toBe(false)

		await open()

		expect(trigger()).toBe(button)
		expect(button.getAttribute('aria-expanded')).toBe('true')
		expect(button.dataset.selected).toBe('true')

		press('Escape')
		await flush()

		expect(trigger()).toBe(button)
		expect(button.getAttribute('aria-expanded')).toBe('false')
		expect(button.dataset.selected).toBe('false')
		expect(hint.hasAttribute('aria-controls')).toBe(false)
	})

	it('триггер — любой элемент: нативная кнопка получает связку так же', async () => {
		const page = document.createElement('div')

		page.innerHTML = `<span is="so-popover"><button slot="trigger" class="so-test-native">…</button>${INSIDE}</span>`
		document.body.appendChild(page)
		await flush()
		await nextFrame()

		const native = find('.so-test-native')

		expect(native.getAttribute('aria-haspopup')).toBe('dialog')
		expect(document.getElementById(native.getAttribute('aria-controls') ?? '')).toBe(panel())

		await open(native)

		expect(isOpen()).toBe(true)
		expect(native.getAttribute('aria-expanded')).toBe('true')
	})
})

describe('открытие и закрытие', () => {
	it('клик по триггеру открывает', async () => {
		await render()
		await click(trigger())

		expect(isOpen()).toBe(true)
	})

	it('клик в панель не закрывает', async () => {
		await render()
		await open()
		await click(find('.so-test-first'))

		expect(isOpen()).toBe(true)
	})

	it('клик по открытому триггеру закрывает, панель не мигает', async () => {
		const popover = new TPopover()
		const changes: boolean[] = []

		popover.events.on('change:open', ({ newValue: value }: TValuePayload<boolean>) =>
			changes.push(value),
		)

		await render({ ctrl: popover })
		await open()
		await click(trigger())

		expect(isOpen()).toBe(false)
		// Нажатие по триггеру — внутри владельца: закрытия нажатием мимо и
		// повторного открытия кликом не было
		expect(changes).toEqual([true, false])
	})

	it('нажатие мимо закрывает', async () => {
		await render()
		await open()

		pointerDown(find('.so-test-after'))
		await flush()

		expect(isOpen()).toBe(false)
	})

	it('open из инстанса открывает так же, как из разметки; события видят оба пути', async () => {
		const popover = new TPopover()
		const el = await render({ ctrl: popover })
		const opens = collect(el, 'so:change:open')

		popover.open = true
		await flush()
		await nextFrame()

		expect(isOpen()).toBe(true)
		expect(document.activeElement).toBe(find('.so-test-first'))

		await click(trigger())

		expect(popover.open).toBe(false)
		expect(opens).toEqual([true, false])
	})

	it('open свойством элемента открывает и закрывает', async () => {
		const el = await render()

		el.open = true
		await flush()
		await nextFrame()

		expect(isOpen()).toBe(true)
		expect(document.activeElement).toBe(find('.so-test-first'))

		el.open = false
		await flush()

		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(trigger())
	})

	/**
	 * Корень — элемент потребителя, и `rendered=false` его прячет, а не
	 * снимает. Панель уехала в `body`, и скрытие корня до неё не доходит:
	 * прячет её база Frame по признаку поддерева поповера. Открытость при этом
	 * не меняется — показанный снова поповер открыт, как был.
	 */
	it('rendered=false прячет корень и открытую панель в body, rendered=true — панель снова открыта', async () => {
		const el = await render()

		await open()

		el.rendered = false
		await flush()

		expect(el.style.display).toBe('none')
		expect(panel().parentElement).toBe(document.body)
		expect(isOpen()).toBe(false)
		expect(el.open).toBe(true)

		el.rendered = true
		await flush()

		expect(el.style.display).toBe('')
		expect(isOpen()).toBe(true)
		expect(panel().dataset.open).toBe('true')
	})

	/**
	 * Предка поповер находит на сборке, от места, где стоит. Переставленный
	 * потребителем из скрытого контейнера в видимый, он собран заново под новым
	 * предком, а панель — следом за ним, и открытая панель снова на виду.
	 */
	it('поповер, переставленный из скрытого контейнера в видимый, — открытая панель снова на виду', async () => {
		const host = document.createElement('div')

		host.innerHTML = `<div is="so-component-view" class="so-test-hidden">
				<span is="so-popover" open>${TRIGGER}${INSIDE}</span>
			</div>
			<div is="so-component-view" class="so-test-shown"></div>`

		const hidden = host.querySelector('.so-test-hidden')
		const popover = host.querySelector('[is="so-popover"]')

		if (!isView(hidden) || !isPopover(popover)) throw new Error('разметки нет')

		hidden.rendered = false
		document.body.appendChild(host)
		await flush()

		expect(panel().parentElement).toBe(document.body)
		expect(isOpen()).toBe(false)

		find('.so-test-shown').appendChild(popover)
		await flush()

		expect(panel().parentElement).toBe(document.body)
		expect(isOpen()).toBe(true)
		expect(document.querySelectorAll('.so-popover__panel')).toHaveLength(1)
	})
})

describe('фокус', () => {
	it('при открытии уходит на первую остановку панели — кадром позже', async () => {
		await render()
		await click(trigger())

		expect(document.activeElement).toBe(trigger())

		await nextFrame()

		expect(document.activeElement).toBe(find('.so-test-first'))
	})

	it('без остановок в панели — на саму панель', async () => {
		const el = await render({ content: '<p>Только текст</p>' })

		el.closable = false
		await flush()
		await open()

		expect(document.activeElement).toBe(panel())
	})

	it('Escape закрывает и возвращает фокус на триггер', async () => {
		await render()
		await open()

		const event = press('Escape')

		await flush()

		expect(event.defaultPrevented).toBe(true)
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(trigger())
	})

	it('Escape на триггере открытого поповера тоже закрывает', async () => {
		await render()
		await open()

		trigger().focus()
		press('Escape')
		await flush()

		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(trigger())
	})

	it('крестик закрывает и возвращает фокус на триггер', async () => {
		await render()
		await open()
		await click(find('.so-popover__close'))

		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(trigger())
	})

	it('нажатие мимо фокус не возвращает', async () => {
		await render()
		await open()

		pointerDown(find('.so-test-after'))
		await flush()

		expect(isOpen()).toBe(false)
		expect(document.activeElement).not.toBe(trigger())
	})

	it('фокус, ушедший мимо, закрывает и не возвращается', async () => {
		await render()
		await open()

		find('.so-test-after').focus()
		await flush()

		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(find('.so-test-after'))
	})

	it('открытый со старта уводит фокус в панель, закрытие возвращает его на триггер', async () => {
		await render({ attrs: 'open' })
		await nextFrame()

		expect(document.activeElement).toBe(find('.so-test-first'))

		press('Escape')
		await flush()

		// Запомнен был `body` — фокус уходит на первую остановку корня
		expect(document.activeElement).toBe(trigger())
	})

	it('отсоединённый элемент возврата — фокус на триггер', async () => {
		const outside = document.createElement('button')
		const popover = new TPopover()

		document.body.appendChild(outside)
		await render({ ctrl: popover })

		outside.focus()
		popover.open = true
		await flush()
		await nextFrame()
		outside.remove()

		press('Escape')
		await flush()

		expect(document.activeElement).toBe(trigger())
	})
})

describe('Tab', () => {
	it('Tab с триггера при открытой панели — в панель', async () => {
		await render()
		await open()

		trigger().focus()

		const event = press('Tab')

		expect(event.defaultPrevented).toBe(true)
		expect(document.activeElement).toBe(find('.so-test-first'))
	})

	it('Shift+Tab с первой остановки панели — на триггер, панель остаётся открытой', async () => {
		await render()
		await open()

		const event = press('Tab', { shiftKey: true })

		await flush()

		expect(event.defaultPrevented).toBe(true)
		expect(document.activeElement).toBe(trigger())
		expect(isOpen()).toBe(true)
	})

	it('Shift+Tab с самой панели — тоже на триггер', async () => {
		const el = await render({ content: '<p>Только текст</p>' })

		el.closable = false
		await flush()
		await open()

		press('Tab', { shiftKey: true })

		expect(document.activeElement).toBe(trigger())
	})

	it('Tab с последней остановки панели — к остановке после поповера, панель закрыта', async () => {
		await render()
		await open()

		find('.so-popover__close').focus()

		const event = press('Tab')

		await flush()

		expect(event.defaultPrevented).toBe(true)
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(find('.so-test-after'))
	})

	it('Tab с самой панели без остановок — к остановке после поповера', async () => {
		const el = await render({ content: '<p>Только текст</p>' })

		el.closable = false
		await flush()
		await open()

		expect(document.activeElement).toBe(panel())

		const event = press('Tab')

		await flush()

		expect(event.defaultPrevented).toBe(true)
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(find('.so-test-after'))
	})

	it('Tab с середины панели не трогает: порядок ведёт браузер', async () => {
		await render()
		await open()

		const event = press('Tab')

		expect(event.defaultPrevented).toBe(false)
		expect(isOpen()).toBe(true)
	})

	it('после поповера остановок нет — закрыть, Tab не гасить', async () => {
		await render({ around: false })
		await open()

		find('.so-popover__close').focus()

		const event = press('Tab')

		await flush()

		expect(event.defaultPrevented).toBe(false)
		expect(isOpen()).toBe(false)
	})
})

/**
 * Поповер в панели поповера. Слой вложенного выше: нажатие и фокус в его
 * панели внешний считает своими, а Escape закрывает только верхний слой —
 * так же, как у Select внутри (ниже): список Select тоже слой в `body` выше
 * панели владельца.
 */
describe('вложенные слои', () => {
	/** Внешний поповер, в панели которого — внутренний. */
	const nested = () =>
		render({
			attrs: 'class="so-test-outer"',
			content: `<button class="so-test-first">Первая</button>
				<span is="so-popover" class="so-test-inner">
					<button is="so-button" slot="trigger" class="so-test-inner-trigger" text="Ещё"></button>
					<button class="so-test-inner-first">Внутри</button>
				</span>`,
		})

	/** Панели в порядке открытия не лежат: ищем по связке с триггером. */
	const panelOf = (triggerElement: HTMLElement) =>
		find(`#${triggerElement.getAttribute('aria-controls') ?? ''}`)

	it('Escape во вложенном закрывает только его, фокус — на его триггер', async () => {
		await nested()
		await open()
		await open(find('.so-test-inner-trigger'))

		expect(document.activeElement).toBe(find('.so-test-inner-first'))

		press('Escape')
		await flush()

		expect(isOpen(panelOf(find('.so-test-inner-trigger')))).toBe(false)
		expect(isOpen(panelOf(trigger()))).toBe(true)
		expect(document.activeElement).toBe(find('.so-test-inner-trigger'))
	})

	it('клик во вложенную панель внешний не закрывает', async () => {
		await nested()
		await open()
		await open(find('.so-test-inner-trigger'))
		await click(find('.so-test-inner-first'))

		expect(isOpen(panelOf(find('.so-test-inner-trigger')))).toBe(true)
		expect(isOpen(panelOf(trigger()))).toBe(true)
	})

	it('клик во внешнюю панель закрывает вложенный, внешний остаётся', async () => {
		await nested()
		await open()
		await open(find('.so-test-inner-trigger'))
		await click(find('.so-test-first'))

		expect(isOpen(panelOf(find('.so-test-inner-trigger')))).toBe(false)
		expect(isOpen(panelOf(trigger()))).toBe(true)
	})

	/**
	 * Escape закрывает сперва вложенный слой, и только второй — сам поповер:
	 * внешний слой клавишу с `defaultPrevented` пропускает, как у Select внутри.
	 */
	it('Escape во вложенном не доходит до внешнего, второй Escape — уже внешнему', async () => {
		await nested()
		await open()
		await open(find('.so-test-inner-trigger'))

		press('Escape')
		await flush()

		expect(isOpen(panelOf(trigger()))).toBe(true)

		press('Escape')
		await flush()

		expect(isOpen(panelOf(trigger()))).toBe(false)
	})

	it('панель вложенного — своя в body, слоем выше внешней', async () => {
		await nested()
		await open()
		await open(find('.so-test-inner-trigger'))

		const outer = panelOf(trigger())
		const inner = panelOf(find('.so-test-inner-trigger'))

		expect(inner.parentElement).toBe(document.body)
		expect(outer.contains(inner)).toBe(false)
		expect(Number(inner.dataset.layer)).toBeGreaterThan(Number(outer.dataset.layer))
	})

	/**
	 * Панель вложенного поповера увезена в `body` сама, и скрытый корень
	 * внешнего до неё не доходит. У Vue `v-if` корня внешнего снимает всё его
	 * поддерево, а у Web Components вложенный прячет свою панель по признаку
	 * поддерева внешнего. Снова отрисованный внешний — обе панели на виду, как
	 * и были.
	 */
	it('rendered=false у внешнего прячет и открытую панель вложенного, rendered=true — обе снова на виду', async () => {
		const el = await nested()

		await open()
		await open(find('.so-test-inner-trigger'))

		const outer = panelOf(trigger())
		const inner = panelOf(find('.so-test-inner-trigger'))

		expect(isOpen(inner)).toBe(true)

		el.rendered = false
		await flush()

		expect(isOpen(outer)).toBe(false)
		expect(isOpen(inner)).toBe(false)
		expect(inner.parentElement).toBe(document.body)

		el.rendered = true
		await flush()

		expect(isOpen(outer)).toBe(true)
		expect(isOpen(inner)).toBe(true)
	})

	/**
	 * Окно в панели — тоже слой: его корень и подложка-спутник уехали в `body`
	 * мимо панели поповера, и скрытый поповер прячет обоих тем же признаком
	 * поддерева. Открытость окна при этом не меняется. И страницу окно
	 * отпускает: у Vue `v-if` корня поповера снимает и окно в его панели, а у
	 * Web Components корня у окна в снятом поддереве нет и у плагинов — замок
	 * прокрутки и пометки фона уходят. Снова показанный поповер возвращает окну
	 * узел, и оно запирает страницу заново, кадром `ready`.
	 */
	it('rendered=false прячет и открытое окно в панели вместе с подложкой и отпускает страницу', async () => {
		const el = await render({
			content: `<button class="so-test-first">Первая</button>
				<div is="so-dialog" class="so-test-dialog"><button class="so-test-in-dialog">В окне</button></div>`,
		})
		const dialog = document.querySelector('.so-test-dialog')

		if (!isDialog(dialog)) throw new Error('<div is="so-dialog"> нет')

		await open()

		dialog.visible = true
		await flush()
		await nextFrame()

		const shade = find('.so-dialog__backdrop')

		expect(dialog.parentElement).toBe(document.body)
		expect(isOpen(dialog)).toBe(true)
		expect(isOpen(shade)).toBe(true)
		expect(muted()).not.toEqual([])
		expect(document.documentElement.style.overflow).toBe('hidden')

		el.rendered = false
		await flush()

		expect(isOpen(dialog)).toBe(false)
		expect(isOpen(shade)).toBe(false)
		expect(dialog.visible).toBe(true)
		expect(muted()).toEqual([])
		expect(document.documentElement.style.overflow).toBe('')

		el.rendered = true
		await flush()

		expect(isOpen(dialog)).toBe(true)
		expect(isOpen(shade)).toBe(true)

		await nextFrame()

		expect(trigger().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		dialog.visible = false
		await flush()
		await nextFrame()

		expect(muted()).toEqual([])
		expect(document.documentElement.style.overflow).toBe('')
	})
})

/**
 * Select в панели поповера, как у Vue: его список — тоже слой в `body`, выше
 * панели владельца. Escape закрывает только Select, а клик в его список —
 * нажатие внутри: поповер остаётся открытым.
 */
describe('Select внутри', () => {
	const withSelect = () =>
		render({
			content: `<div is="so-select" class="so-test-select">
				<div is="so-select-item" value="a" text="Первый"></div>
				<div is="so-select-item" value="b" text="Второй"></div>
			</div>`,
		})

	const field = () => find('.so-test-select input')
	const selectPanel = () => find('.so-select__panel')

	/** Открыть Select кликом по его полю: открытость доходит до панели второй отрисовкой. */
	async function openSelect(): Promise<void> {
		await click(field())
		await flush()
	}

	it('Escape в открытом Select закрывает только Select', async () => {
		await withSelect()
		await open()
		await openSelect()

		expect(isOpen(selectPanel())).toBe(true)

		press('Escape')
		await flush()
		await flush()

		expect(isOpen(selectPanel())).toBe(false)
		expect(isOpen()).toBe(true)

		// Второй Escape — уже поповеру: Select закрыт и клавишу не тратит
		press('Escape')
		await flush()

		expect(isOpen()).toBe(false)
	})

	it('клик в список Select поповер не закрывает', async () => {
		await withSelect()
		await open()
		await openSelect()

		const option = find('.so-select__panel [role="option"]')

		pointerDown(option)
		option.click()
		await flush()
		await flush()

		expect(isOpen()).toBe(true)
		expect(field().getAttribute('aria-expanded')).toBe('false')
	})
})

describe('lazyMount', () => {
	it('содержимое — в документе с первого открытия и остаётся после закрытия', async () => {
		await render({ attrs: 'lazy-mount' })

		expect(document.querySelector('.so-test-first')).toBeNull()
		expect(document.querySelector('.so-popover__content')).not.toBeNull()

		await open()

		expect(document.activeElement).toBe(find('.so-test-first'))

		press('Escape')
		await flush()

		expect(document.querySelector('.so-test-first')).not.toBeNull()
	})

	it('без lazyMount содержимое в документе с самого начала', async () => {
		await render()

		expect(document.querySelector('.so-test-first')).not.toBeNull()
	})
})

/**
 * Сборки считает плагин-зонд при установке набора: вид компонента и его текст.
 * Зонд стоит и на деталях (`scope: 'all'`), поэтому крестик тоже на счету.
 * Кнопки в панели собираются по одному разу — до переноса или после, неважно:
 * ни перенос в цель, ни `contained` туда и обратно связку не трогают.
 */
describe('перенос', () => {
	/** Сборки кнопок — их текст, по одной на связку. */
	const assembled: string[] = []

	/** Уничтоженные связки кнопок. */
	let destroyed = 0

	class TAssemblyProbePlugin extends TBasePlugin<TComponentView> {
		private _button = false

		override install(ctx: IPluginContext, options?: unknown): void {
			super.install(ctx, options)

			const instance = ctx.getInstance()

			if (instance instanceof TButton) {
				this._button = true
				assembled.push(instance.text)
			}
		}

		override destroy(): void {
			if (this._button) destroyed += 1

			super.destroy()
		}
	}

	afterEach(() => {
		assembled.length = 0
		destroyed = 0
	})

	it('перенос в цель и contained туда-обратно не пересобирают кнопки в панели', async () => {
		dispose = usePlugins(TComponentView, [TAssemblyProbePlugin], { scope: 'all' })

		const el = await render({
			content: '<button is="so-button" class="so-test-action" text="Действие"></button>',
		})
		const action = find('.so-test-action')
		const close = find('.so-popover__close')

		expect(panel().parentElement).toBe(document.body)
		// Триггер, кнопка в панели и крестик без текста — по одной сборке
		expect([...assembled].sort()).toEqual(['', 'Действие', 'Открыть'])

		el.contained = true
		await flush()

		expect(el.contains(panel())).toBe(true)

		el.contained = false
		await flush()

		expect(panel().parentElement).toBe(document.body)
		expect(find('.so-test-action')).toBe(action)
		expect(find('.so-popover__close')).toBe(close)
		expect([...assembled].sort()).toEqual(['', 'Действие', 'Открыть'])
		expect(destroyed).toBe(0)
	})
})

/**
 * Поповер, переставленный одной операцией под другой провайдер: якорь панели
 * остаётся в его корне, в документе, а поповер собирается заново. Панель идёт
 * за ним сразу — возвращается к якорю, собирается после поповера с локалью
 * нового места и снова уезжает в `body`; кнопка в её содержимом — тоже. Имя
 * крестика здесь не довод: его пишет шаблон из набора поповера, и оно
 * сменилось бы и без пересборки панели.
 */
describe('перестановка одной операцией', () => {
	/** Сборки — вид компонента и тег локали, по одной на связку. */
	const assembled: (readonly [kind: string, locale: string])[] = []

	const kindOf = (instance: unknown): string => {
		if (instance instanceof TPopover) return 'popover'
		if (instance instanceof TFrame) return 'frame'

		return instance instanceof TButton ? `button:${instance.text}` : 'other'
	}

	/** Плагин-зонд: сборка ставит его в набор, и на детали тоже (`scope: 'all'`). */
	class TLocaleProbePlugin extends TBasePlugin<TComponentView> {
		override install(ctx: IPluginContext, options?: unknown): void {
			super.install(ctx, options)

			assembled.push([kindOf(ctx.getInstance()), ctx.locale.locale.tag])
		}
	}

	afterEach(() => {
		assembled.length = 0
	})

	/** Провайдер локали по селектору. */
	function provider(scope: ParentNode, selector: string): TLocaleProviderElement {
		const node = scope.querySelector(selector)

		if (!(node instanceof TLocaleProviderElement)) {
			throw new Error(`${selector}: провайдера нет`)
		}

		return node
	}

	it('панель и кнопка в ней собраны заново сразу, с локалью нового места; панель — в body', async () => {
		dispose = usePlugins(TComponentView, [TLocaleProbePlugin], { scope: 'all' })

		const host = document.createElement('div')

		host.innerHTML = `<so-locale-provider class="so-test-ru">
				<span is="so-popover">${TRIGGER}<button is="so-button" class="so-test-action" text="Действие"></button></span>
			</so-locale-provider>
			<so-locale-provider class="so-test-zh"></so-locale-provider>`
		provider(host, '.so-test-ru').locale = ruRU
		provider(host, '.so-test-zh').locale = zhCN
		document.body.appendChild(host)
		await flush()

		const popover = host.querySelector('[is="so-popover"]')
		const action = find('.so-test-action')

		if (!isPopover(popover)) throw new Error('<span is="so-popover"> нет')

		assembled.length = 0
		provider(host, '.so-test-zh').appendChild(popover)

		// Поповер, затем его панель и кнопка в ней — сразу, без ожидания
		expect(
			assembled.filter(([kind]) => ['popover', 'frame', 'button:Действие'].includes(kind)),
		).toEqual([
			['popover', zhCN.tag],
			['frame', zhCN.tag],
			['button:Действие', zhCN.tag],
		])
		expect(panel().parentElement).toBe(document.body)
		expect(find('.so-test-action')).toBe(action)
		expect(
			[...popover.childNodes].filter(
				(node) => node instanceof Comment && node.data === TELEPORT_ANCHOR,
			),
		).toHaveLength(1)
	})
})

describe('жест', () => {
	const handle = () => document.querySelector('.so-popover__handle')

	/** Указатель мышью в точке по вертикали — как его слушает плагин жеста. */
	const pointer = (type: string, target: Element, y: number) =>
		target.dispatchEvent(
			new PointerEvent(type, {
				bubbles: true,
				cancelable: true,
				clientX: 100,
				clientY: y,
				pointerId: 1,
				pointerType: 'mouse',
				button: 0,
				isPrimary: true,
			}),
		)

	it('без жеста полосы нет; с жестом — первая в панели, немая для скринридера', async () => {
		const popover = new TPopover()

		await render({ ctrl: popover })

		expect(handle()).toBeNull()

		popover.swipe = 'handle'
		await flush()

		expect(handle()).toBe(panel().firstElementChild)
		expect(handle()?.getAttribute('aria-hidden')).toBe('true')

		popover.swipe = 'panel'
		await flush()

		expect(handle()).not.toBeNull()

		popover.swipe = 'none'
		await flush()

		expect(handle()).toBeNull()
	})

	/**
	 * Коробку панели задаёт тест: jsdom раскладку не считает. Сторону после
	 * flip плагин якоря пишет в панель и в jsdom — под триггером: якорь панели —
	 * корень поповера. Жест мышью по полосе вниз — дальше четверти высоты
	 * панели.
	 */
	it('смахнули вниз от триггера — закрыта, so:change:open видит закрытие, фокус — на триггер', async () => {
		const el = await render({ attrs: 'swipe="handle"' })
		const opens = collect(el, 'so:change:open')

		await open()

		expect(panel().dataset.placement).toBe('bottom-start')
		expect(panel().dataset.swiping).toBe('false')

		vi.spyOn(panel(), 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 8, 300, 200))

		const grip = find('.so-popover__handle')

		pointer('pointerdown', grip, 13)
		pointer('pointermove', panel(), 108)

		expect(panel().style.getPropertyValue('--so-swipe-offset')).toBe('95px')

		await flush()

		expect(panel().dataset.swiping).toBe('true')
		// Сдвиг плагин пишет в узел сам, мимо раскладки, и смена набора панели его
		// не стирает: стиль корня база ставит по свойствам
		expect(panel().style.getPropertyValue('--so-swipe-offset')).toBe('95px')

		pointer('pointerup', panel(), 113)
		await flush()

		expect(isOpen()).toBe(false)
		expect(panel().dataset.swiping).toBe('false')
		expect(opens).toEqual([true, false])
		expect(document.activeElement).toBe(trigger())
	})
})

/**
 * Popover на другом теге — тот же Popover под своим именем: одно имя элемента
 * расширяет один тег. Регистрирует его фабрика `registerPopoverTag`: описание
 * элемента — дескриптор, шаблон, корень, setup — у всех тегов одно. На `div` —
 * заголовок месяца Calendar: панель с `contained` лежит в корне поповера, а в
 * строчном `span` блочной разметке не место.
 */
describe('<div is="so-popover-div"> · Popover на div', () => {
	const TPopoverDivElement = registerPopoverTag('div')

	function isPopoverDiv(node: Element | null): node is TPopoverElementProps<HTMLDivElement> {
		return node instanceof TPopoverDivElement
	}

	/** Поповер на `div` из разметки, подключённый к документу, и кадр. */
	async function mountDiv(html: string): Promise<TPopoverElementProps<HTMLDivElement>> {
		const host = document.createElement('div')

		host.innerHTML = html

		const node = host.firstElementChild

		if (!isPopoverDiv(node)) throw new Error('<div is="so-popover-div"> нет')

		document.body.appendChild(host)
		await flush()
		await nextFrame()

		return node
	}

	it('класс у тега один: повторный вызов отдаёт его же, имя — so-popover-div', () => {
		expect(registerPopoverTag('div')).toBe(TPopoverDivElement)
		expect(customElements.get('so-popover-div')).toBe(TPopoverDivElement)
		expect(document.createElement('div', { is: 'so-popover-div' })).toBeInstanceOf(
			TPopoverDivElement,
		)
	})

	it('описание — то же, что у <span is="so-popover">: атрибуты-входы одни', () => {
		expect(TPopoverDivElement.observedAttributes).toEqual(TPopoverElement.observedAttributes)
	})

	it('div с классами поповера; триггер получает связку, панель с contained — в корне', async () => {
		const el = await mountDiv(`<div is="so-popover-div" contained edge="top">
			${TRIGGER}
			<p class="so-test-content">Содержимое</p>
		</div>`)

		expect(el).toBeInstanceOf(HTMLDivElement)
		expect(el.classList).toContain('so-popover')
		expect(el.ctrl?.tag).toBe('div')
		expect(trigger().getAttribute('aria-haspopup')).toBe('dialog')
		expect(trigger().getAttribute('aria-expanded')).toBe('false')
		expect(panel().parentElement).toBe(el)
		expect(panel().dataset['contained']).toBe('true')
		expect(panel().dataset['edge']).toBe('top')

		trigger().click()
		await flush()

		expect(isOpen()).toBe(true)
		expect(trigger().getAttribute('aria-expanded')).toBe('true')
		expect(trigger().getAttribute('aria-controls')).toBe(panel().id)
		expect(el.dataset['open']).toBe('true')
	})

	it('тип — тот же Popover на своём теге', () => {
		expectTypeOf<TPopoverElementProps<HTMLDivElement>>().toExtend<HTMLDivElement>()
		expectTypeOf<TPopoverElementProps<HTMLDivElement>['contained']>().toEqualTypeOf<
			TPopoverElementProps['contained']
		>()
	})
})

describe('owner visibility', () => {
	it('hides the detached panel without resetting open', async () => {
		const ctrl = new TPopover({ open: true, visible: false })
		await render({ ctrl })

		const element = panel()
		expect(isOpen()).toBe(false)
		expect(ctrl.open).toBe(true)

		ctrl.show()
		await flush()
		expect(isOpen()).toBe(true)

		ctrl.hide()
		await flush()
		expect(isOpen()).toBe(false)
		expect(ctrl.open).toBe(true)

		ctrl.show()
		await flush()
		expect(isOpen()).toBe(true)
		expect(panel()).toBe(element)
	})
})
