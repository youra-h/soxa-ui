/**
 * Drawer под Angular — проводка целиком, на настоящей разметке.
 *
 * Модель проверяет ядро (`core/__tests__/drawer.spec.ts`), жест и правила
 * фокуса и нажатия мимо — плагины; здесь важно, что они сходятся: панель
 * уехала в цель вместе с подложкой, а внутри контейнера осталась на месте,
 * полоса жеста рисуется по ядру, кнопка закрытия и жест говорят с ядром, три
 * причины закрытия и жест проходят через запрос, а замок прокрутки знает, где
 * панель стоит. Сценарии — те же, что у Vue (`ui/vue/__tests__/drawer.spec.ts`);
 * открытость, которую Vue держит `v-model`, здесь — вход `[visible]` и выход
 * `(soChangeVisible)`.
 *
 * Своё у Angular — разметка и спутник корня. Корень — элемент потребителя
 * (`<div so-drawer>`), и в цель уезжает он сам, а с `contained` остаётся на
 * месте. Подложку рисует шаблон (`#companion`), а ставит прямо перед панелью —
 * в цели и на месте, — увозит, возвращает и прячет база: `contained` на лету
 * переносит те же узлы.
 *
 * Раскладку, анимацию темы и настоящий указатель jsdom не выполняет — край,
 * размер, контейнер и жест мышью — браузерные спеки стенда.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { Component, signal, type Type } from '@angular/core'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import {
	TDrawer,
	type TCloseEvent,
	type TCloseReason,
	type TDrawerPlacement,
	type TSwipe,
} from '@soxa-ui/core'
import { ruRU } from '@soxa-ui/plugins'
import {
	LocaleProviderDirective,
	SlotDirective,
	TDialogComponent,
	TDrawerComponent,
} from '@soxa-ui/angular'
import { TELEPORT_ANCHOR } from '../src/adapter/runtime/teleport'
import { find, nextFrame } from './mount'

/**
 * Страница с кнопкой, которая открывает панель, и сама панель внутри
 * контейнера `.so-test-host` — разметкой, как её пишет потребитель. Экземпляр
 * ядра у панели внешний — свойства тест пишет и в него. Значения, которые тест
 * меняет, — сигналы: хост `OnPush`.
 */
@Component({
	selector: 'probe-drawer-page',
	standalone: true,
	imports: [TDrawerComponent],
	template: `<div class="so-test-host">
		<button class="so-test-opener">Открыть</button>
		<div
			so-drawer
			[ctrl]="ctrl"
			[visible]="shown()"
			[placement]="placement()"
			[width]="width()"
			[height]="height()"
			[swipe]="swipe()"
			[contained]="contained()"
			[closable]="closable()"
			[dismissible]="dismissible()"
			[rendered]="rendered()"
			[target]="target()"
			(soChangeVisible)="visibility($event.newValue)"
			(soCloseBefore)="closing($event)"
		>
			<span slot="title">Фильтры</span>
			<button class="so-test-first">Первая</button>
			<button class="so-test-second">Вторая</button>
			<button slot="footer" class="so-test-ok">Применить</button>
		</div>
	</div>`,
})
class Page {
	readonly ctrl = new TDrawer()
	readonly shown = signal(false)
	readonly placement = signal<TDrawerPlacement | undefined>(undefined)
	readonly width = signal<number | string | undefined>(undefined)
	readonly height = signal<number | string | undefined>(undefined)
	readonly swipe = signal<TSwipe | undefined>(undefined)
	readonly contained = signal<boolean | undefined>(undefined)
	readonly closable = signal<boolean | undefined>(undefined)
	readonly dismissible = signal<boolean | undefined>(undefined)
	readonly rendered = signal<boolean | undefined>(undefined)
	readonly target = signal<string | undefined>(undefined)
	/** Открытость, которую панель сообщила выходом. */
	readonly changes: boolean[] = []
	/** Причины закрытия, которые видел подписчик `close:before`. */
	readonly reasons: TCloseReason[] = []

	visibility(value: boolean): void {
		this.changes.push(value)
		this.shown.set(value)
	}

	closing(event: TCloseEvent): void {
		this.reasons.push(event.reason)
	}
}

/** Атрибуты, класс и слушатель потребителя на панели. */
@Component({
	selector: 'probe-drawer-consumer',
	standalone: true,
	imports: [TDrawerComponent],
	template: `<div
		so-drawer
		visible
		class="so-test-mine"
		data-test="x"
		(click)="clicks.push($event)"
	>
		<button class="so-test-first">Первая</button>
	</div>`,
})
class ConsumerPage {
	readonly clicks: Event[] = []
}

/** Значок крестика — шаблоном слота; панель — под провайдером локали. */
@Component({
	selector: 'probe-drawer-icons',
	standalone: true,
	imports: [TDrawerComponent, SlotDirective, LocaleProviderDirective],
	template: `<div so-locale-provider [locale]="locale">
		<div so-drawer visible>
			<button class="so-test-first">Первая</button>
			<ng-template slot="close-icon"><i class="so-test-close-icon"></i></ng-template>
		</div>
	</div>`,
})
class IconsPage {
	readonly locale = ruRU
}

/** Панель в модальном окне — внутри его контейнера. */
@Component({
	selector: 'probe-drawer-dialog',
	standalone: true,
	imports: [TDialogComponent, TDrawerComponent],
	template: `<div so-dialog [visible]="dialog()" (soChangeVisible)="dialog.set($event.newValue)">
		<button class="so-test-in-dialog">В окне</button>
		<div
			so-drawer
			contained
			[visible]="drawer()"
			(soChangeVisible)="drawer.set($event.newValue)"
		>
			<button class="so-test-in-drawer">В панели</button>
		</div>
	</div>`,
})
class DialogPage {
	readonly dialog = signal(false)
	readonly drawer = signal(false)
}

/** Панель на месте, которую страница снимает. */
@Component({
	selector: 'probe-drawer-removal',
	standalone: true,
	imports: [TDrawerComponent],
	template: `<section class="so-test-host">
		@if (shown()) {
			<div so-drawer contained visible class="so-test-removable">Панель</div>
		}
	</section>`,
})
class RemovalPage {
	readonly shown = signal(true)
}

/** Смонтированный хост теста — его перепроверяют действия. */
let current: ComponentFixture<unknown> | null = null

/** Цели, которые тест положил в документ, — убираются после него. */
const targets: Element[] = []

afterEach(() => {
	current = null
	vi.restoreAllMocks()

	for (const target of targets.splice(0)) target.remove()
})

/**
 * Смонтировать хост в документ и дождаться кадра: корень плагины получают
 * через `requestAnimationFrame`, фокус уходит кадром позже. `prepare` задаёт
 * входы до первой отрисовки — так, как они стоят в разметке с самого начала.
 */
async function render<T>(host: Type<T>, prepare?: (page: T) => void): Promise<ComponentFixture<T>> {
	const fixture = TestBed.createComponent(host)

	current = fixture
	prepare?.(fixture.componentInstance)
	fixture.detectChanges()
	await nextFrame()

	return fixture
}

/**
 * Перепроверить хост: событие дошло до ядра и его состояния, а разметку
 * приложение без Zone.js перепроверяет на своём такте — тест делает это сразу.
 */
function check(): void {
	current?.detectChanges()
}

/** Узел по селектору в документе: панель уехала в цель мимо хоста. */
const node = (selector: string, scope: ParentNode = document) => find(scope, selector, HTMLElement)

const panel = (scope: ParentNode = document) => node('.so-drawer', scope)
const backdrop = (scope: ParentNode = document) => node('.so-backdrop:has(+ .so-drawer)', scope)
const isOpen = (element: HTMLElement = panel()) => element.style.display !== 'none'
const opener = () => node('.so-test-opener')
const host = () => node('.so-test-host')

/** Якоря телепорта в поддереве — комментарии на месте увезённых корней. */
function anchors(scope: Node): Comment[] {
	const walker = document.createTreeWalker(scope, NodeFilter.SHOW_COMMENT)
	const found: Comment[] = []

	while (walker.nextNode()) {
		const comment = walker.currentNode

		if (comment instanceof Comment && comment.data === TELEPORT_ANCHOR) found.push(comment)
	}

	return found
}

/** Нажатие мимо — `pointerdown`, как его слушает плагин оверлея. */
function pointerDown(target: Element): void {
	target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }))
	check()
}

/** Клавиша на элементе под фокусом. Отдаёт событие: по нему видно, погашена ли она. */
function press(key: string): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

	;(document.activeElement ?? document.body).dispatchEvent(event)
	check()

	return event
}

/** Открыть панель с кнопки страницы и дождаться, пока фокус уйдёт в неё. */
async function open(page: Page): Promise<void> {
	opener().focus()
	page.shown.set(true)
	check()
	await nextFrame()
}

/** Записать открытость или свойство инстанса и дождаться кадра. */
async function settle(): Promise<void> {
	check()
	await nextFrame()
}

describe('разметка', () => {
	it('поверх страницы: подложка и панель уехали соседями, подложка раньше', async () => {
		await render(Page)

		expect(panel().parentElement).toBe(document.body)
		expect(backdrop().parentElement).toBe(document.body)
		expect(backdrop().nextElementSibling).toBe(panel())
		expect(anchors(host())).toHaveLength(1)
	})

	it('внутри контейнера: панель и подложка на месте, target не действует', async () => {
		const elsewhere = document.createElement('div')

		elsewhere.id = 'so-test-elsewhere'
		document.body.appendChild(elsewhere)
		targets.push(elsewhere)

		await render(Page, (page) => {
			page.contained.set(true)
			page.target.set('#so-test-elsewhere')
		})

		expect(panel().parentElement).toBe(host())
		expect(backdrop().parentElement).toBe(host())
		expect(backdrop().nextElementSibling).toBe(panel())
		expect(panel().dataset['contained']).toBe('true')
		expect(backdrop().dataset['contained']).toBe('true')
		expect(anchors(host())).toHaveLength(0)
		expect(elsewhere.children).toHaveLength(0)
	})

	/** Перенос — тех же узлов: подложку шаблон не рисует заново. */
	it('contained на лету переносит те же панель и подложку из body в контейнер и обратно', async () => {
		const fixture = await render(Page)
		const drawer = fixture.componentInstance.ctrl
		const root = panel()
		const shade = backdrop()

		expect(root.parentElement).toBe(document.body)

		drawer.contained = true
		check()

		expect(panel()).toBe(root)
		expect(backdrop()).toBe(shade)
		expect(root.parentElement).toBe(host())
		expect(shade.parentElement).toBe(host())
		expect(shade.nextElementSibling).toBe(root)
		// Между прежними соседями: за кнопкой страницы
		expect(shade.previousElementSibling).toBe(opener())
		expect(anchors(host())).toHaveLength(0)

		drawer.contained = false
		check()

		expect(panel()).toBe(root)
		expect(backdrop()).toBe(shade)
		expect(root.parentElement).toBe(document.body)
		expect(shade.nextElementSibling).toBe(root)
		expect(document.querySelectorAll('.so-backdrop:has(+ .so-drawer)')).toHaveLength(1)
	})

	it('панель — модальный диалог, имя — заголовок', async () => {
		await render(Page)

		const title = node('.so-drawer__title')

		expect(panel().getAttribute('role')).toBe('dialog')
		expect(panel().getAttribute('aria-modal')).toBe('true')
		expect(panel().getAttribute('tabindex')).toBe('-1')
		expect(panel().getAttribute('aria-labelledby')).toBe(title.id)
		expect(title.textContent).toBe('Фильтры')
	})

	it('слоты — по местам: заголовок, тело, подвал; крестик — последним', async () => {
		await render(Page)

		expect(node('.so-drawer__title').childNodes).toHaveLength(1)
		expect(node('.so-drawer__body').contains(node('.so-test-first'))).toBe(true)
		expect(node('.so-drawer__footer').contains(node('.so-test-ok'))).toBe(true)
		expect(node('.so-drawer__footer').childNodes).toHaveLength(1)
		expect(panel().lastElementChild?.classList.contains('so-drawer__close')).toBe(true)
	})

	it('край — модификатором, по умолчанию end; открытость — data-open у панели и подложки', async () => {
		const fixture = await render(Page)

		expect(panel().classList).toContain('so-drawer--placement-end')
		expect(panel().dataset['open']).toBe('false')
		expect(backdrop().dataset['open']).toBe('false')
		expect(panel().dataset['swiping']).toBe('false')

		fixture.componentInstance.placement.set('bottom')
		await open(fixture.componentInstance)

		expect(panel().classList).toContain('so-drawer--placement-bottom')
		expect(panel().dataset['open']).toBe('true')
		expect(backdrop().dataset['open']).toBe('true')
	})

	it('размер — переменными темы, не инлайном', async () => {
		await render(Page, (page) => {
			page.width.set(360)
			page.height.set('40vh')
		})

		expect(panel().style.getPropertyValue('--so-drawer-width')).toBe('360px')
		expect(panel().style.getPropertyValue('--so-drawer-height')).toBe('40vh')
		expect(panel().style.width).toBe('')
	})

	it('открытая: панель и подложка в одном слое — z-index и data-layer одни', async () => {
		const fixture = await render(Page)

		await open(fixture.componentInstance)

		const layer = panel().dataset['layer']

		expect(layer).toMatch(/^\d+$/)
		expect(backdrop().dataset['layer']).toBe(layer)
		expect(panel().style.zIndex).toBe(layer)
		expect(backdrop().style.zIndex).toBe(layer)
	})

	it('панель помечена владельцем, подложка — нет', async () => {
		await render(Page)

		// Пометка — от id монтирования панели, а не от счётчика процесса
		expect(panel().dataset['owner']).toBeTruthy()
		expect(backdrop().hasAttribute('data-owner')).toBe(false)
	})

	it('атрибуты и слушатели потребителя — на панели', async () => {
		const fixture = await render(ConsumerPage)

		expect(panel().parentElement).toBe(document.body)
		expect(panel().classList).toContain('so-test-mine')
		expect(panel().dataset['test']).toBe('x')

		panel().click()

		expect(fixture.componentInstance.clicks).toHaveLength(1)
	})
})

describe('полоса жеста', () => {
	const handle = () => document.querySelector('.so-drawer__handle')

	it('без жеста полосы нет; с жестом — первая в панели, немая для скринридера', async () => {
		const fixture = await render(Page)
		const drawer = fixture.componentInstance.ctrl

		expect(handle()).toBeNull()

		drawer.swipe = 'handle'
		check()

		expect(handle()).toBe(panel().firstElementChild)
		expect(handle()?.getAttribute('aria-hidden')).toBe('true')

		drawer.swipe = 'panel'
		check()

		expect(handle()).not.toBeNull()

		drawer.swipe = 'none'
		check()

		expect(handle()).toBeNull()
	})
})

describe('закрытие пользователем', () => {
	it('крестик — причина button, назван локалью, фокус возвращается', async () => {
		const fixture = await render(Page)
		const page = fixture.componentInstance

		await open(page)

		expect(document.activeElement).toBe(node('.so-test-first'))

		const close = node('.so-drawer__close')

		expect(close.getAttribute('aria-label')).toBe('Close')

		close.click()
		check()

		expect(page.reasons).toEqual(['button'])
		expect(page.shown()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('closable: false убирает крестик из DOM, true — возвращает последним', async () => {
		const fixture = await render(Page, (page) => page.closable.set(false))

		expect(document.querySelector('.so-drawer__close')).toBeNull()

		fixture.componentInstance.closable.set(true)
		check()

		expect(panel().lastElementChild?.classList.contains('so-drawer__close')).toBe(true)
	})

	/**
	 * Значок крестика — шаблон слота, без него — иконка роли. Имя крестика — от
	 * локали провайдера вокруг места панели: DI идёт по дереву объявлений, а не
	 * по DOM.
	 */
	it('шаблон close-icon заменяет иконку крестика; имя — от локали провайдера вокруг панели', async () => {
		await render(IconsPage)

		const close = node('.so-drawer__close')

		expect(panel().parentElement).toBe(document.body)
		expect(close.querySelector('.so-test-close-icon')).not.toBeNull()
		expect(close.querySelector('svg')).toBeNull()
		expect(close.getAttribute('aria-label')).toBe('Закрыть')
	})

	it('Escape и подложка — причины escape и outside', async () => {
		const fixture = await render(Page)
		const page = fixture.componentInstance

		await open(page)
		press('Escape')
		await settle()

		await open(page)
		pointerDown(backdrop())

		expect(page.reasons).toEqual(['escape', 'outside'])
		expect(page.shown()).toBe(false)
	})

	it('dismissible: false — подложка и Escape панель не закрывают', async () => {
		const fixture = await render(Page, (page) => page.dismissible.set(false))
		const page = fixture.componentInstance

		await open(page)

		pointerDown(backdrop())
		press('Escape')

		expect(page.shown()).toBe(true)
		expect(isOpen()).toBe(true)
	})

	/**
	 * Коробку панели задаёт тест: jsdom раскладку не считает. Жест мышью по
	 * полосе — дальше четверти ширины панели.
	 */
	it('жест — причина swipe: смахнули к краю, и (soChangeVisible) видит закрытие', async () => {
		const fixture = await render(Page, (page) => page.swipe.set('handle'))
		const page = fixture.componentInstance

		await open(page)

		vi.spyOn(panel(), 'getBoundingClientRect').mockReturnValue(new DOMRect(700, 0, 300, 800))

		const pointer = (type: string, target: Element, x: number) => {
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
			check()
		}

		pointer('pointerdown', node('.so-drawer__handle'), 705)
		pointer('pointermove', panel(), 800)

		expect(panel().style.getPropertyValue('--so-swipe-offset')).toBe('95px')
		expect(panel().dataset['swiping']).toBe('true')

		pointer('pointerup', panel(), 900)

		expect(page.reasons).toEqual(['swipe'])
		expect(page.shown()).toBe(false)
		expect(page.changes).toEqual([true, false])
		expect(panel().dataset['swiping']).toBe('false')
		expect(document.activeElement).toBe(opener())
	})
})

describe('фон под панелью', () => {
	it('поверх страницы: страница спрятана от скринридера, прокрутка заперта', async () => {
		const fixture = await render(Page)
		const page = fixture.componentInstance

		await open(page)

		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		page.shown.set(false)
		await settle()

		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.documentElement.style.overflow).toBe('')
	})

	/**
	 * Элемент потребителя Angular не снимает, а прячет, но корня у панели с
	 * `rendered: false`, как у Vue с `v-if`, у плагинов нет: открытая панель
	 * отпускает прокрутку и пометки фона сразу, оставаясь открытой. Снова
	 * отрисованная — запирает страницу заново, кадром `ready` своего узла.
	 */
	it('rendered: false у открытой панели отпускает страницу, true — запирает снова', async () => {
		const fixture = await render(Page)
		const page = fixture.componentInstance

		await open(page)

		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		page.rendered.set(false)
		check()

		expect(page.shown()).toBe(true)
		expect(isOpen()).toBe(false)
		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.documentElement.style.overflow).toBe('')

		page.rendered.set(true)
		await settle()

		expect(isOpen()).toBe(true)
		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		page.shown.set(false)
		await settle()

		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.documentElement.style.overflow).toBe('')
	})

	/**
	 * Внутри контейнера панель модальна так же — фон немой, фокус в ней, — но
	 * прокрутку документа не запирает: страница за контейнером та же.
	 */
	it('внутри контейнера: фон немой, а прокрутка документа не заперта', async () => {
		const fixture = await render(Page, (page) => page.contained.set(true))

		await open(fixture.componentInstance)

		expect(opener().getAttribute('aria-hidden')).toBe('true')
		expect(document.activeElement).toBe(node('.so-test-first'))
		expect(document.documentElement.style.overflow).toBe('')
	})

	it('contained на открытой панели снимает замок, а обратно — ставит', async () => {
		const fixture = await render(Page)
		const drawer = fixture.componentInstance.ctrl

		await open(fixture.componentInstance)

		expect(document.documentElement.style.overflow).toBe('hidden')

		// Замок отпускается кадром позже, когда корень доиграл переходы
		drawer.contained = true
		await settle()

		expect(document.documentElement.style.overflow).toBe('')

		drawer.contained = false
		check()

		expect(document.documentElement.style.overflow).toBe('hidden')
	})
})

describe('внутри модального окна', () => {
	/**
	 * Панель в окне — слой выше окна: подложка и нажатие в неё окно не
	 * закрывают, Escape закрывает только её.
	 */
	it('Escape в панели закрывает только панель, второй — окно', async () => {
		const fixture = await render(DialogPage)
		const page = fixture.componentInstance

		page.dialog.set(true)
		await settle()

		page.drawer.set(true)
		await settle()

		expect(panel().parentElement).toBe(node('.so-dialog__body'))
		expect(document.activeElement).toBe(node('.so-test-in-drawer'))
		expect(Number(panel().dataset['layer'])).toBeGreaterThan(
			Number(node('.so-dialog').dataset['layer']),
		)

		pointerDown(node('.so-test-in-drawer'))

		expect(page.dialog()).toBe(true)
		expect(page.drawer()).toBe(true)

		press('Escape')

		expect(page.drawer()).toBe(false)
		expect(page.dialog()).toBe(true)

		press('Escape')

		expect(page.dialog()).toBe(false)
	})
})

describe('открытость — [visible] и (soChangeVisible)', () => {
	it('visible из инстанса открывает так же, как из разметки', async () => {
		const fixture = await render(Page)

		opener().focus()
		fixture.componentInstance.ctrl.visible = true
		await settle()

		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-first'))
		expect(fixture.componentInstance.changes).toEqual([true])
	})
})

/**
 * Подложка — спутник корня: шаблон её рисует, а ставит прямо перед панелью — в
 * цели и на месте, — увозит, возвращает и прячет база.
 */
describe('подложка — спутник панели', () => {
	it('rendered: false прячет панель вместе с подложкой — и на месте тоже', async () => {
		const fixture = await render(Page, (page) => {
			page.shown.set(true)
			page.contained.set(true)
		})

		fixture.componentInstance.rendered.set(false)
		check()

		expect(isOpen()).toBe(false)
		expect(isOpen(backdrop())).toBe(false)

		fixture.componentInstance.rendered.set(true)
		check()

		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
	})

	it('снятая на месте панель уносит подложку из контейнера', async () => {
		const fixture = await render(RemovalPage)

		expect(host().querySelector('.so-backdrop:has(+ .so-drawer)')?.nextElementSibling).toBe(
			node('.so-test-removable'),
		)

		fixture.componentInstance.shown.set(false)
		check()

		expect(document.querySelector('.so-test-removable')).toBeNull()
		expect(host().querySelector('.so-backdrop:has(+ .so-drawer)')).toBeNull()
	})
})
