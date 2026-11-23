/**
 * Dialog под Angular — проводка целиком, на настоящей разметке.
 *
 * Модель проверяет ядро (`core/__tests__/dialog.spec.ts`), правила фокуса и
 * нажатия мимо — плагины; здесь важно, что они сходятся: окно уехало в цель,
 * подложка — его соседка с тем же слоем, окно помечено владельцем, кнопки
 * шапки говорят с ядром, три причины закрытия проходят через запрос, а окно
 * поверх окна и поповер внутри закрывают только свой слой. Сценарии — те же,
 * что у Vue (`ui/vue/__tests__/dialog.spec.ts`); открытость, которую Vue
 * держит `v-model`, здесь — вход `[visible]` и выход `(soChangeVisible)`.
 * Сценарии Vue с Select внутри — здесь с поповером, как у React: правило
 * слоёв одно, а Select внутри поповера и модального слоя проверяют
 * `popover.spec.ts` и `hide-outside.spec.ts`.
 *
 * Своё у Angular — разметка и спутник корня. Корень — элемент потребителя
 * (`<div so-dialog>`), и в цель уезжает он сам. Подложку рисует шаблон
 * (`#companion`), а ставит прямо перед окном, увозит в цель, уводит за местом
 * и прячет база. Пометку окна владельцем кладёт на корень база (`plugins` в
 * описании корня), а `tabindex="-1"` — статика хоста.
 *
 * Раскладку, переходы темы и действие `mousedown` jsdom не выполняет: место,
 * размер, появление и исчезание — `playground/vue/browser/angular-host.spec.ts`
 * и браузерные спеки Vue.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { Component, input, signal, type Type } from '@angular/core'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { TDialog, type TCloseEvent, type TCloseReason, type TDialogPlacement } from '@soxa-ui/core'
import { ruRU, type TDialogOffsetEvent } from '@soxa-ui/plugins'
import * as material from '@soxa-ui/icons-material'
import {
	AttributesDirective,
	LocaleProviderDirective,
	SlotDirective,
	TButtonComponent,
	TDialogComponent,
	TPopoverComponent,
} from '@soxa-ui/angular'
import { TELEPORT_ANCHOR } from '../src/adapter/runtime/teleport'
import { find, nextFrame } from './mount'

/**
 * Страница с кнопкой, которая открывает окно, и само окно — разметкой, как его
 * пишет потребитель. Экземпляр ядра у окна внешний — открытость тест пишет и
 * в него. Значения, которые тест меняет, — сигналы: хост `OnPush`.
 */
@Component({
	selector: 'probe-dialog-page',
	standalone: true,
	imports: [TDialogComponent],
	template: `<div class="so-test-place">
		<button class="so-test-opener">Открыть</button>
		<div
			so-dialog
			[ctrl]="ctrl"
			[visible]="shown()"
			[modal]="modal()"
			[alert]="alert()"
			[placement]="placement()"
			[width]="width()"
			[height]="height()"
			[offset]="offset()"
			[closable]="closable()"
			[dismissible]="dismissible()"
			[maximizable]="maximizable()"
			[rendered]="rendered()"
			[target]="target()"
			(soChangeVisible)="visibility($event.newValue)"
			(soChangeMaximized)="maximized.push($event.newValue)"
			(soCloseBefore)="closing($event)"
			(soLayoutOffsetBefore)="offsetting($event)"
		>
			<span slot="title">Настройки</span>
			<button class="so-test-first">Первая</button>
			<button class="so-test-second">Вторая</button>
			<button slot="footer" class="so-test-ok">Готово</button>
		</div>
	</div>`,
})
class Page {
	readonly ctrl = new TDialog()
	readonly shown = signal(false)
	readonly modal = signal(true)
	readonly alert = signal<boolean | undefined>(undefined)
	readonly placement = signal<TDialogPlacement | undefined>(undefined)
	readonly width = signal<number | string | undefined>(undefined)
	readonly height = signal<number | string | undefined>(undefined)
	readonly offset = signal<number | string | undefined>(undefined)
	readonly closable = signal<boolean | undefined>(undefined)
	readonly dismissible = signal<boolean | undefined>(undefined)
	readonly maximizable = signal<boolean | undefined>(undefined)
	readonly rendered = signal<boolean | undefined>(undefined)
	readonly target = signal<string | undefined>(undefined)
	/** Отменять ли закрытие пользователем: подписчик `close:before`. */
	readonly cancel = signal(false)
	/** Правка сторон отступа: подписчик `layout:offset:before`. */
	readonly adjust = signal<((event: TDialogOffsetEvent) => void) | undefined>(undefined)
	/** Открытость, которую окно сообщило выходом. */
	readonly changes: boolean[] = []
	/** Развёрнутость, которую окно сообщило выходом. */
	readonly maximized: boolean[] = []
	/** Причины закрытия, которые видел подписчик `close:before`. */
	readonly reasons: TCloseReason[] = []
	/** Места окна, с которыми пришло `layout:offset:before`. */
	readonly placements: TDialogPlacement[] = []

	visibility(value: boolean): void {
		this.changes.push(value)
		this.shown.set(value)
	}

	closing(event: TCloseEvent): void {
		this.reasons.push(event.reason)

		if (this.cancel()) event.preventDefault()
	}

	offsetting(event: TDialogOffsetEvent): void {
		this.placements.push(event.placement)
		this.adjust()?.(event)
	}
}

/** Окно без заголовка и подвала. */
@Component({
	selector: 'probe-dialog-bare',
	standalone: true,
	imports: [TDialogComponent],
	template: `<div so-dialog><button class="so-test-first">Первая</button></div>`,
})
class BarePage {}

/** Атрибуты, класс, стиль и слушатель потребителя на окне. */
@Component({
	selector: 'probe-dialog-consumer',
	standalone: true,
	imports: [TDialogComponent],
	template: `<div
		so-dialog
		visible
		class="so-test-mine"
		data-test="x"
		tabindex="0"
		style="color: red"
		(click)="clicks.push($event)"
	>
		<button class="so-test-first">Первая</button>
	</div>`,
})
class ConsumerPage {
	readonly clicks: Event[] = []
}

/** Окно под провайдером локали: имена кнопок шапки — от неё. */
@Component({
	selector: 'probe-dialog-locale',
	standalone: true,
	imports: [TDialogComponent, LocaleProviderDirective],
	template: `<div so-locale-provider [locale]="locale">
		<div so-dialog visible maximizable><button class="so-test-first">Первая</button></div>
	</div>`,
})
class LocalePage {
	readonly locale = ruRU
}

/** Значки кнопок шапки — шаблонами слотов. */
@Component({
	selector: 'probe-dialog-icons',
	standalone: true,
	imports: [TDialogComponent, SlotDirective],
	template: `<div so-dialog [ctrl]="ctrl" visible maximizable>
		<button class="so-test-first">Первая</button>
		<ng-template slot="close-icon"><i class="so-test-close-icon"></i></ng-template>
		<ng-template slot="maximize-icon"><i class="so-test-maximize-icon"></i></ng-template>
		<ng-template slot="restore-icon"><i class="so-test-restore-icon"></i></ng-template>
	</div>`,
})
class IconsPage {
	readonly ctrl = new TDialog()
}

/** Нижнее окно, из которого открыто верхнее. */
@Component({
	selector: 'probe-dialog-nested',
	standalone: true,
	imports: [TDialogComponent],
	template: `<div>
		<button class="so-test-opener">Открыть</button>
		<div
			so-dialog
			class="so-test-lower"
			[visible]="lower()"
			(soChangeVisible)="lower.set($event.newValue)"
		>
			<button class="so-test-lower-first">Внизу</button>
			<div
				so-dialog
				class="so-test-upper"
				[visible]="upper()"
				(soChangeVisible)="upper.set($event.newValue)"
			>
				<button class="so-test-upper-first">Наверху</button>
			</div>
		</div>
	</div>`,
})
class NestedPage {
	readonly lower = signal(false)
	readonly upper = signal(false)
}

/** Поповер в окне: его панель — тоже слой в `body`, соседка окна. */
@Component({
	selector: 'probe-dialog-popover',
	standalone: true,
	imports: [
		TDialogComponent,
		TPopoverComponent,
		TButtonComponent,
		SlotDirective,
		AttributesDirective,
	],
	template: `<div>
		<button class="so-test-opener">Открыть</button>
		<div so-dialog [visible]="shown()" (soChangeVisible)="shown.set($event.newValue)">
			<span so-popover class="so-test-popover">
				<ng-template
					slot="trigger"
					let-triggerAria="triggerAria"
					let-triggerDataset="triggerDataset"
				>
					<button
						so-button
						text="Ещё"
						class="so-test-popover-trigger"
						[so-attributes]="{ ...triggerAria, ...triggerDataset }"
					></button>
				</ng-template>
				<button class="so-test-popover-first">В панели</button>
			</span>
		</div>
	</div>`,
})
class PopoverPage {
	readonly shown = signal(false)
}

/** Окно, которое страница снимает. */
@Component({
	selector: 'probe-dialog-removal',
	standalone: true,
	imports: [TDialogComponent],
	template: `<section class="so-test-place">
		@if (shown()) {
			<div so-dialog visible class="so-test-removable">Окно</div>
		}
	</section>`,
})
class RemovalPage {
	readonly shown = signal(true)
}

/**
 * Чужой компонент, который показывает содержимое по условию: проекцию Angular
 * вынимает из документа и вставляет снова, а компонентов в ней не снимает.
 */
@Component({
	selector: 'probe-dialog-card',
	standalone: true,
	template: `<article class="so-test-card">
		@if (open()) {
			<ng-content />
		}
	</article>`,
})
class CardComponent {
	readonly open = input(true)
}

/** Окно — прямо в проекции карточки: его узел Angular вынимает и вставляет сам. */
@Component({
	selector: 'probe-dialog-projection',
	standalone: true,
	imports: [TDialogComponent, CardComponent],
	template: `<probe-dialog-card [open]="open()">
		<div so-dialog visible>Окно</div>
	</probe-dialog-card>`,
})
class ProjectionPage {
	readonly open = signal(true)
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

/** Цель с `id` в конце `body`. */
function addTarget(id: string): HTMLElement {
	const target = document.createElement('section')

	target.id = id
	document.body.append(target)
	targets.push(target)

	return target
}

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

/** Узел по селектору в документе: окно уехало в цель мимо хоста. */
const node = (selector: string, scope: ParentNode = document) => find(scope, selector, HTMLElement)

const panel = (scope: ParentNode = document) => node('.so-dialog', scope)
const backdrop = (scope: ParentNode = document) => node('.so-backdrop:has(+ .so-dialog)', scope)
const isOpen = (element: HTMLElement = panel()) => element.style.display !== 'none'
const opener = () => node('.so-test-opener')
const place = () => node('.so-test-place')

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

/** Клик по кнопке шапки: событие дошло до ядра, разметка перепроверена. */
function click(target: HTMLElement): void {
	target.click()
	check()
}

/** Клавиша на элементе под фокусом. Отдаёт событие: по нему видно, погашена ли она. */
function press(key: string, options: KeyboardEventInit = {}): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options })

	;(document.activeElement ?? document.body).dispatchEvent(event)
	check()

	return event
}

/** Открыть окно с кнопки страницы и дождаться, пока фокус уйдёт в окно. */
async function open(page: { readonly shown: { set(value: boolean): void } }): Promise<void> {
	opener().focus()
	page.shown.set(true)
	check()
	await nextFrame()
}

/** Закрыть окно записью открытости и дождаться кадра: замок прокрутки уходит в нём. */
async function close(page: { readonly shown: { set(value: boolean): void } }): Promise<void> {
	page.shown.set(false)
	check()
	await nextFrame()
}

describe('разметка', () => {
	it('окно уехало целиком: подложка и панель — соседи в body, подложка раньше', async () => {
		await render(Page)

		expect(panel().parentElement).toBe(document.body)
		expect(backdrop().parentElement).toBe(document.body)
		expect(backdrop().nextElementSibling).toBe(panel())
		expect(panel().contains(backdrop())).toBe(false)
		expect(anchors(place())).toHaveLength(1)
		expect(place().querySelector('.so-backdrop:has(+ .so-dialog)')).toBeNull()
	})

	it('закрытое окно спрятано вместе с подложкой, а не убрано', async () => {
		await render(Page)

		expect(isOpen()).toBe(false)
		expect(isOpen(backdrop())).toBe(false)
		expect(document.querySelector('.so-test-first')).not.toBeNull()
	})

	it('панель — модальный диалог, имя — заголовок', async () => {
		await render(Page)

		const title = node('.so-dialog__title')

		expect(panel().getAttribute('role')).toBe('dialog')
		expect(panel().getAttribute('aria-modal')).toBe('true')
		expect(panel().getAttribute('tabindex')).toBe('-1')
		expect(panel().getAttribute('aria-labelledby')).toBe(title.id)
		expect(title.textContent).toBe('Настройки')
		expect(panel().hasAttribute('aria-describedby')).toBe(false)
	})

	it('предупреждение — alertdialog, описание — тело окна', async () => {
		await render(Page, (page) => page.alert.set(true))

		const body = node('.so-dialog__body')

		expect(panel().getAttribute('role')).toBe('alertdialog')
		expect(panel().getAttribute('aria-describedby')).toBe(body.id)
		expect(body.contains(node('.so-test-first'))).toBe(true)
	})

	it('слоты — по местам: заголовок, тело, подвал; заголовок и подвал без пробелов', async () => {
		await render(Page)

		expect(node('.so-dialog__title').textContent).toBe('Настройки')
		expect(node('.so-dialog__title').childNodes).toHaveLength(1)
		expect(node('.so-dialog__body').contains(node('.so-test-first'))).toBe(true)
		expect(node('.so-dialog__footer').contains(node('.so-test-ok'))).toBe(true)
		expect(node('.so-dialog__footer').childNodes).toHaveLength(1)
	})

	it('без заголовка и подвала их узлы пусты: тема сворачивает их по :empty', async () => {
		await render(BarePage)

		expect(node('.so-dialog__title').childNodes).toHaveLength(0)
		expect(node('.so-dialog__footer').childNodes).toHaveLength(0)
	})

	it('порядок в окне — заголовок, тело, подвал, крестик', async () => {
		await render(Page)

		expect([...panel().children].map((child) => child.className)).toEqual([
			'so-dialog__title',
			'so-dialog__body',
			'so-dialog__footer',
			expect.stringContaining('so-dialog__close'),
		])
	})

	it('место — модификатором, по умолчанию центр; развёрнутость — data-maximized', async () => {
		const fixture = await render(Page)

		expect(panel().classList).toContain('so-dialog--placement-center')
		expect(panel().dataset['maximized']).toBe('false')

		fixture.componentInstance.placement.set('end')
		check()

		expect(panel().classList).toContain('so-dialog--placement-end')
		expect(panel().classList).not.toContain('so-dialog--placement-center')
	})

	/** По нему тема гасит закрытое окно вместе с подложкой. */
	it('открытость — data-open у панели и подложки, туда и обратно', async () => {
		const fixture = await render(Page)

		expect(panel().dataset['open']).toBe('false')
		expect(backdrop().dataset['open']).toBe('false')

		await open(fixture.componentInstance)

		expect(panel().dataset['open']).toBe('true')
		expect(backdrop().dataset['open']).toBe('true')

		await close(fixture.componentInstance)

		expect(panel().dataset['open']).toBe('false')
		expect(backdrop().dataset['open']).toBe('false')
	})

	it('размер — переменными темы, не инлайном', async () => {
		await render(Page, (page) => {
			page.width.set(480)
			page.height.set('60vh')
		})

		expect(panel().style.getPropertyValue('--so-dialog-width')).toBe('480px')
		expect(panel().style.getPropertyValue('--so-dialog-height')).toBe('60vh')
		expect(panel().style.width).toBe('')
	})

	it('незаданный размер переменной не даёт: умолчание — у темы', async () => {
		await render(Page)

		expect(panel().style.getPropertyValue('--so-dialog-width')).toBe('')
		expect(panel().style.getPropertyValue('--so-dialog-height')).toBe('')
	})

	it('открытое: панель и подложка в одном слое — z-index и data-layer одни', async () => {
		const fixture = await render(Page)

		await open(fixture.componentInstance)

		const layer = panel().dataset['layer']

		expect(layer).toMatch(/^\d+$/)
		expect(backdrop().dataset['layer']).toBe(layer)
		expect(panel().style.zIndex).toBe(layer)
		expect(backdrop().style.zIndex).toBe(layer)
	})

	it('панель помечена владельцем, подложка — нет: для окна она мимо', async () => {
		await render(Page)

		// Пометка — от id монтирования окна, а не от счётчика процесса
		expect(panel().dataset['owner']).toBeTruthy()
		expect(backdrop().hasAttribute('data-owner')).toBe(false)
	})

	/**
	 * Элемент написал потребитель, и всё, что на нём написано, уезжает с ним.
	 * `tabindex="-1"` — статика хоста окна, и атрибут потребителя её перекрывает.
	 */
	it('атрибуты, стиль и слушатели потребителя — на панели в цели', async () => {
		const fixture = await render(ConsumerPage)

		expect(panel().parentElement).toBe(document.body)
		expect(panel().classList).toContain('so-test-mine')
		expect(panel().classList).toContain('so-dialog')
		expect(panel().dataset['test']).toBe('x')
		expect(panel().style.color).toBe('red')
		expect(panel().getAttribute('tabindex')).toBe('0')

		panel().click()

		expect(fixture.componentInstance.clicks).toHaveLength(1)
	})

	it('target меняет место: панель и подложка — в своей цели', async () => {
		const target = addTarget('so-test-host')

		await render(Page, (page) => page.target.set('#so-test-host'))

		expect(panel().parentElement).toBe(target)
		expect(backdrop().parentElement).toBe(target)
		expect(backdrop().nextElementSibling).toBe(panel())
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
		await render(Page, (page) => page.offset.set(24))

		expect(offsets()).toEqual({ top: '24px', bottom: '24px', start: '24px', end: '24px' })
		expect(panel().getAttribute('style')).not.toMatch(/inset|margin/)
	})

	it('незаданный отступ переменных не даёт: умолчание — у темы', async () => {
		await render(Page)

		expect(offsets()).toEqual({ top: '', bottom: '', start: '', end: '' })
	})

	it('смена offset из шаблона пересчитывает переменные', async () => {
		const fixture = await render(Page, (page) => page.offset.set(24))

		fixture.componentInstance.offset.set('5%')
		check()

		expect(offsets().top).toBe('5%')

		fixture.componentInstance.offset.set(undefined)
		check()

		expect(offsets().top).toBe('')
	})

	it('обработчик (soLayoutOffsetBefore) правит сторону у окна, открытого позже', async () => {
		const fixture = await render(Page, (page) => {
			page.offset.set(24)
			page.adjust.set((event) => {
				event.top = '10%'
			})
		})

		await open(fixture.componentInstance)

		expect(offsets()).toEqual({ top: '10%', bottom: '24px', start: '24px', end: '24px' })
	})

	it('и у созданного видимым: показа, который пересчитал бы стили, у него нет', async () => {
		const fixture = await render(Page, (page) => {
			page.shown.set(true)
			page.placement.set('start')
			page.offset.set(24)
			page.adjust.set((event) => {
				event.start = 0
			})
		})

		expect(fixture.componentInstance.placements).toContain('start')
		expect(offsets()).toEqual({ top: '24px', bottom: '24px', start: '0px', end: '24px' })
	})
})

describe('кнопки шапки', () => {
	it('крестик назван локалью — без провайдера английской; closable: false убирает его из DOM', async () => {
		const fixture = await render(Page)

		expect(node('.so-dialog__close').getAttribute('aria-label')).toBe('Close')

		fixture.componentInstance.closable.set(false)
		check()

		expect(document.querySelector('.so-dialog__close')).toBeNull()

		fixture.componentInstance.closable.set(true)
		check()

		expect(panel().lastElementChild?.classList.contains('so-dialog__close')).toBe(true)
	})

	/**
	 * DI Angular идёт по дереву объявлений, а не по DOM: окно уехало в `body`, а
	 * собрано с локалью провайдера вокруг своего места — от неё имена кнопок.
	 */
	it('имена кнопок — от локали провайдера вокруг окна, а не английские', async () => {
		await render(LocalePage)

		expect(panel().parentElement).toBe(document.body)
		expect(node('.so-dialog__close').getAttribute('aria-label')).toBe('Закрыть')
		expect(node('.so-dialog__maximize').getAttribute('aria-label')).toBe('Развернуть')
	})

	it('кнопки разворота по умолчанию нет, maximizable её рисует перед крестиком', async () => {
		const fixture = await render(Page)

		expect(document.querySelector('.so-dialog__maximize')).toBeNull()

		fixture.componentInstance.maximizable.set(true)
		check()

		const button = node('.so-dialog__maximize')

		expect(button.getAttribute('type')).toBe('button')
		expect(button.getAttribute('aria-label')).toBe('Maximize')
		expect(button.getAttribute('aria-pressed')).toBe('false')
		expect(button.nextElementSibling?.classList.contains('so-dialog__close')).toBe(true)
	})

	it('разворот переключает maximized: data-maximized, aria-pressed и иконка', async () => {
		const fixture = await render(Page, (page) => page.maximizable.set(true))
		const dialog = fixture.componentInstance.ctrl

		await open(fixture.componentInstance)

		const button = node('.so-dialog__maximize')
		/** Контур значка кнопки — сравнивается с контуром роли в пакете. */
		const iconPath = () => button.querySelector('svg path')?.getAttribute('d')
		const pathOf = (body: string) => /d="([^"]+)"/.exec(body)?.[1]

		expect(iconPath()).toBe(pathOf(material.arrowsOutward.body))

		click(button)

		expect(dialog.maximized).toBe(true)
		expect(panel().dataset['maximized']).toBe('true')
		expect(button.getAttribute('aria-pressed')).toBe('true')
		expect(iconPath()).toBe(pathOf(material.arrowsInward.body))

		click(button)

		expect(panel().dataset['maximized']).toBe('false')
		expect(iconPath()).toBe(pathOf(material.arrowsOutward.body))
	})

	it('разворот виден выходом: (soChangeMaximized) на каждый клик', async () => {
		const fixture = await render(Page, (page) => page.maximizable.set(true))

		await open(fixture.componentInstance)

		click(node('.so-dialog__maximize'))
		click(node('.so-dialog__maximize'))

		expect(fixture.componentInstance.maximized).toEqual([true, false])
	})

	/**
	 * Значок кнопки — шаблон слота, без него — иконка роли. Значок разворота —
	 * по состоянию окна: шаблон своего варианта рисуется, другого — нет.
	 */
	it('шаблоны значков заменяют иконки ролей; значок разворота — по состоянию окна', async () => {
		const fixture = await render(IconsPage)
		const close = node('.so-dialog__close')
		const maximize = node('.so-dialog__maximize')

		expect(close.querySelector('.so-test-close-icon')).not.toBeNull()
		expect(close.querySelector('svg')).toBeNull()
		expect(maximize.querySelector('.so-test-maximize-icon')).not.toBeNull()
		expect(maximize.querySelector('.so-test-restore-icon')).toBeNull()

		fixture.componentInstance.ctrl.maximized = true
		check()

		expect(maximize.querySelector('.so-test-restore-icon')).not.toBeNull()
		expect(maximize.querySelector('.so-test-maximize-icon')).toBeNull()
		expect(maximize.querySelector('svg')).toBeNull()
	})
})

describe('закрытие пользователем', () => {
	it('крестик — причина button, фокус возвращается туда, откуда открыли', async () => {
		const fixture = await render(Page)
		const page = fixture.componentInstance

		await open(page)

		expect(document.activeElement).toBe(node('.so-test-first'))

		click(node('.so-dialog__close'))

		expect(page.reasons).toEqual(['button'])
		expect(page.shown()).toBe(false)
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('Escape — причина escape, клавиша погашена', async () => {
		const fixture = await render(Page)
		const page = fixture.componentInstance

		await open(page)

		const event = press('Escape')

		expect(event.defaultPrevented).toBe(true)
		expect(page.reasons).toEqual(['escape'])
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('нажатие по подложке — причина outside, фокус возвращается', async () => {
		const fixture = await render(Page)
		const page = fixture.componentInstance

		await open(page)

		pointerDown(backdrop())

		expect(page.reasons).toEqual(['outside'])
		expect(isOpen()).toBe(false)
		expect(isOpen(backdrop())).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('нажатие в окно его не закрывает', async () => {
		const fixture = await render(Page)

		await open(fixture.componentInstance)

		pointerDown(node('.so-test-second'))

		expect(isOpen()).toBe(true)
	})

	it('отмена close:before оставляет окно открытым', async () => {
		const fixture = await render(Page, (page) => page.cancel.set(true))
		const page = fixture.componentInstance

		await open(page)

		click(node('.so-dialog__close'))
		press('Escape')
		pointerDown(backdrop())

		expect(page.reasons).toEqual(['button', 'escape', 'outside'])
		expect(page.shown()).toBe(true)
		expect(isOpen()).toBe(true)
	})

	describe('dismissible: false', () => {
		it('подложка и Escape окно не закрывают и close:before не шлют', async () => {
			const fixture = await render(Page, (page) => page.dismissible.set(false))
			const page = fixture.componentInstance

			await open(page)

			pointerDown(backdrop())
			press('Escape')

			expect(page.reasons).toEqual([])
			expect(isOpen()).toBe(true)
		})

		it('крестик закрывает', async () => {
			const fixture = await render(Page, (page) => page.dismissible.set(false))

			await open(fixture.componentInstance)

			click(node('.so-dialog__close'))

			expect(isOpen()).toBe(false)
		})
	})
})

describe('открытость — [visible] и (soChangeVisible)', () => {
	it('visible из разметки открывает и закрывает, программное закрытие — без close:before', async () => {
		const fixture = await render(Page)
		const page = fixture.componentInstance

		await open(page)

		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-first'))

		await close(page)

		expect(isOpen()).toBe(false)
		expect(isOpen(backdrop())).toBe(false)
		expect(page.reasons).toEqual([])
		expect(document.activeElement).toBe(opener())
	})

	it('открытие и закрытие пользователем видит (soChangeVisible)', async () => {
		const fixture = await render(Page)
		const page = fixture.componentInstance

		await open(page)
		press('Escape')

		expect(page.shown()).toBe(false)
		expect(page.changes).toEqual([true, false])
	})

	it('visible из инстанса открывает так же, как из разметки', async () => {
		const fixture = await render(Page)

		opener().focus()
		fixture.componentInstance.ctrl.visible = true
		check()
		await nextFrame()

		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-first'))
	})
})

describe('окно поверх окна', () => {
	/** Нижнее окно открыто, из него — верхнее. */
	async function renderNested(): Promise<NestedPage> {
		const fixture = await render(NestedPage)
		const page = fixture.componentInstance

		opener().focus()
		page.lower.set(true)
		check()
		await nextFrame()

		page.upper.set(true)
		check()
		await nextFrame()

		return page
	}

	const backdropOf = (dialog: HTMLElement) => {
		const previous = dialog.previousElementSibling

		if (!(previous instanceof HTMLElement)) throw new Error('у окна нет подложки')

		return previous
	}

	it('верхнее окно — слоем выше нижнего, его подложка — тоже; оба в body', async () => {
		await renderNested()

		const lower = Number(node('.so-test-lower').dataset['layer'])
		const upper = Number(node('.so-test-upper').dataset['layer'])

		expect(upper).toBeGreaterThan(lower)
		expect(node('.so-test-upper').parentElement).toBe(document.body)
		expect(backdropOf(node('.so-test-upper')).dataset['layer']).toBe(String(upper))
		expect(document.activeElement).toBe(node('.so-test-upper-first'))
	})

	it('нажатие по подложке верхнего закрывает только его', async () => {
		const page = await renderNested()

		pointerDown(backdropOf(node('.so-test-upper')))

		expect(page.upper()).toBe(false)
		expect(page.lower()).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-lower-first'))
	})

	it('Escape в верхнем закрывает только его', async () => {
		const page = await renderNested()

		press('Escape')

		expect(page.upper()).toBe(false)
		expect(page.lower()).toBe(true)
	})

	it('нижнее окно для скринридера спрятано, пока открыто верхнее', async () => {
		const page = await renderNested()

		expect(node('.so-test-lower').getAttribute('aria-hidden')).toBe('true')
		expect(node('.so-test-upper').closest('[aria-hidden="true"]')).toBeNull()

		page.upper.set(false)
		check()
		await nextFrame()

		expect(node('.so-test-lower').hasAttribute('aria-hidden')).toBe(false)
	})
})

/**
 * Панель поповера в окне — тоже панель в `body`, соседка окна, а не его
 * потомок. Пока закрыта, она лежит там без номера слоя выше окна: номер пишет
 * показ. Открытая — слой выше окна: нажатие в неё окно не закрывает, Escape
 * закрывает только её, и скринридер её видит.
 */
describe('поповер внутри', () => {
	const popoverTrigger = () => node('.so-test-popover-trigger')
	const popoverPanel = () => node('.so-popover__panel')

	/** Спрятан ли узел от скринридера — сам или через предка. */
	const muted = (element: Element) => element.closest('[aria-hidden="true"]') !== null

	/** Кто в документе несёт `aria-hidden` и с каким значением — чтобы сравнить «до» и «после». */
	const ariaHiddenNodes = () =>
		new Map(
			[...document.querySelectorAll('[aria-hidden]')].map((element) => [
				element,
				element.getAttribute('aria-hidden'),
			]),
		)

	/** Открыть поповер кликом по его триггеру и дождаться кадра. */
	async function openPopover(): Promise<void> {
		const target = popoverTrigger()

		pointerDown(target)
		target.focus()
		target.click()
		check()
		await nextFrame()
	}

	it('панель поповера — слоем выше окна: нажатие в неё окно не закрывает', async () => {
		const fixture = await render(PopoverPage)
		const page = fixture.componentInstance

		await open(page)
		await openPopover()

		expect(isOpen(popoverPanel())).toBe(true)
		expect(Number(popoverPanel().dataset['layer'])).toBeGreaterThan(
			Number(panel().dataset['layer']),
		)

		pointerDown(node('.so-test-popover-first'))

		expect(page.shown()).toBe(true)
		expect(isOpen()).toBe(true)
		expect(isOpen(popoverPanel())).toBe(true)
	})

	it('Escape в открытом поповере закрывает только его, второй — окно', async () => {
		const fixture = await render(PopoverPage)
		const page = fixture.componentInstance

		await open(page)
		await openPopover()

		expect(document.activeElement).toBe(node('.so-test-popover-first'))

		press('Escape')

		expect(isOpen(popoverPanel())).toBe(false)
		expect(page.shown()).toBe(true)
		expect(document.activeElement).toBe(popoverTrigger())

		press('Escape')

		expect(page.shown()).toBe(false)
	})

	it('окно открыто — страница под aria-hidden, окно и его содержимое доступны', async () => {
		const fixture = await render(PopoverPage)

		await open(fixture.componentInstance)

		expect(muted(opener())).toBe(true)
		expect(muted(panel())).toBe(false)
		expect(muted(popoverTrigger())).toBe(false)
	})

	it('закрытая панель поповера спрятана, открытая — доступна', async () => {
		const fixture = await render(PopoverPage)

		await open(fixture.componentInstance)

		// Панель стоит в `body` скрытой, номера слоя выше окна у неё ещё нет
		expect(muted(popoverPanel())).toBe(true)

		await openPopover()

		expect(popoverTrigger().getAttribute('aria-expanded')).toBe('true')
		expect(muted(popoverPanel())).toBe(false)
		expect(muted(node('.so-test-popover-first'))).toBe(false)
	})

	it('окно закрыто — всё как было, в том числе чужие aria-hidden', async () => {
		const fixture = await render(PopoverPage)
		const page = fixture.componentInstance
		const before = ariaHiddenNodes()

		await open(page)
		await openPopover()
		await close(page)

		expect(ariaHiddenNodes()).toEqual(before)
		expect(muted(opener())).toBe(false)
		expect(muted(popoverPanel())).toBe(false)
	})
})

describe('фон под окном', () => {
	it('открытое окно прячет страницу от скринридера и запирает прокрутку', async () => {
		const fixture = await render(Page)

		await open(fixture.componentInstance)

		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		await close(fixture.componentInstance)

		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.documentElement.style.overflow).toBe('')
	})

	/**
	 * Элемент потребителя Angular не снимает, а прячет, но корня у окна с
	 * `rendered: false`, как у Vue с `v-if`, у плагинов нет: открытое окно
	 * отпускает прокрутку и пометки фона сразу, оставаясь открытым. Снова
	 * отрисованное — запирает страницу заново, кадром `ready` своего узла.
	 */
	it('rendered: false у открытого окна отпускает страницу, true — запирает снова', async () => {
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
		check()
		await nextFrame()

		expect(isOpen()).toBe(true)
		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		await close(page)

		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.documentElement.style.overflow).toBe('')
	})
})

/**
 * Подложка — спутник корня: шаблон её рисует, а ставит прямо перед окном,
 * увозит, уводит за местом и прячет база. Она стоит перед окном, где бы оно ни
 * было, и уходит из документа вместе с ним. Окна без цели нет — ни на месте,
 * ни в цели, — и подложки тоже.
 */
describe('подложка — спутник окна', () => {
	it('смена цели увозит подложку вместе с окном, тем же узлом', async () => {
		const first = addTarget('so-test-first')
		const second = addTarget('so-test-second')
		const fixture = await render(Page, (page) => page.target.set('#so-test-first'))
		const root = panel()
		const shade = backdrop()

		expect(shade.parentElement).toBe(first)

		fixture.componentInstance.target.set('#so-test-second')
		check()

		expect(panel()).toBe(root)
		expect(backdrop()).toBe(shade)
		expect(root.parentElement).toBe(second)
		expect(shade.nextElementSibling).toBe(root)
		expect(first.children).toHaveLength(0)
	})

	/**
	 * Без цели окна нет: элемент потребителя возвращается на место пустым и
	 * скрытым, а подложку шаблон не рисует вовсе. Цель вернулась — окно снова
	 * в ней, тем же узлом, и подложка перед ним.
	 */
	it('цели нет — ни окна, ни подложки в цели; цель вернулась — оба в ней', async () => {
		const fixture = await render(Page, (page) => page.shown.set(true))
		const root = panel()

		fixture.componentInstance.target.set('#so-test-missing')
		check()

		expect(root.parentElement).toBe(place())
		expect(root.style.display).toBe('none')
		expect(root.textContent).toBe('')
		expect(root.classList.contains('so-dialog')).toBe(false)
		expect(document.querySelector('.so-backdrop:has(+ .so-dialog)')).toBeNull()
		expect(anchors(place())).toHaveLength(0)

		fixture.componentInstance.target.set('body')
		check()

		expect(panel()).toBe(root)
		expect(root.parentElement).toBe(document.body)
		expect(backdrop().nextElementSibling).toBe(root)
		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
		expect(document.querySelectorAll('.so-backdrop:has(+ .so-dialog)')).toHaveLength(1)
	})

	it('rendered: false прячет окно вместе с подложкой', async () => {
		const fixture = await render(Page, (page) => page.shown.set(true))

		fixture.componentInstance.rendered.set(false)
		check()

		expect(isOpen()).toBe(false)
		expect(isOpen(backdrop())).toBe(false)

		fixture.componentInstance.rendered.set(true)
		check()

		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
	})

	it('снятое окно уносит подложку из цели и якорь с места', async () => {
		const fixture = await render(RemovalPage)

		expect(document.querySelector('.so-test-removable')?.parentElement).toBe(document.body)

		fixture.componentInstance.shown.set(false)
		check()

		expect(document.querySelector('.so-test-removable')).toBeNull()
		expect(document.querySelector('.so-backdrop:has(+ .so-dialog)')).toBeNull()
		expect(anchors(place())).toHaveLength(0)
	})

	/**
	 * Место, которое Angular вынул без снятия компонента, — условная проекция
	 * чужого компонента. Окно уходит из цели вместе с местом, а подложка — с
	 * окном; вернулось место — окно снова в цели, подложка перед ним.
	 */
	it('место в условной проекции ушло — окно с подложкой ушли, вернулось — снова в цели', async () => {
		const fixture = await render(ProjectionPage)
		const root = panel()

		expect(root.parentElement).toBe(document.body)
		expect(backdrop().nextElementSibling).toBe(root)

		fixture.componentInstance.open.set(false)
		check()

		expect(root.isConnected).toBe(false)
		expect(document.querySelector('.so-backdrop:has(+ .so-dialog)')).toBeNull()
		expect(anchors(document.body)).toHaveLength(0)

		fixture.componentInstance.open.set(true)
		check()

		expect(panel()).toBe(root)
		expect(root.parentElement).toBe(document.body)
		expect(backdrop().nextElementSibling).toBe(root)
		expect(document.querySelectorAll('.so-backdrop:has(+ .so-dialog)')).toHaveLength(1)
		expect(anchors(node('.so-test-card'))).toHaveLength(1)
	})
})

describe('non-modal dialog', () => {
	it('preserves focus, page access and natural keyboard navigation', async () => {
		const fixture = await render(Page, (page) => {
			page.modal.set(false)
			page.dismissible.set(false)
		})
		await open(fixture.componentInstance)

		expect(document.activeElement).toBe(opener())
		expect(panel().getAttribute('role')).toBe('dialog')
		expect(panel().hasAttribute('aria-modal')).toBe(false)
		expect(panel().getAttribute('aria-labelledby')).toBe(
			panel().querySelector('.so-dialog__title')?.id,
		)
		expect(opener().closest('[aria-hidden="true"], [inert]')).toBeNull()
		expect(document.documentElement.style.overflow).not.toBe('hidden')
		expect(document.body.style.overflow).not.toBe('hidden')

		expect(document.querySelector('.so-backdrop:has(+ .so-dialog)')).toBeNull()

		const last = panel().querySelector('.so-dialog__close')
		if (!(last instanceof HTMLElement)) throw new Error('Missing close button')
		last.focus()
		expect(press('Tab').defaultPrevented).toBe(false)
		expect(press('Tab', { shiftKey: true }).defaultPrevented).toBe(false)
		opener().focus()
		pointerDown(opener())
		expect(isOpen()).toBe(true)
		expect(document.activeElement).toBe(opener())

		await close(fixture.componentInstance)
		expect(document.activeElement).toBe(opener())
	})
})
