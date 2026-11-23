import type { TValuePayload } from '@soxa-ui/core'
/**
 * Popover под Angular — проводка целиком, на настоящей разметке.
 *
 * Модель проверяет ядро, «мимо» и слои — `setup/__tests__/overlay.spec.ts`;
 * здесь важно, что они сходятся: панель телепортирована и помечена владельцем,
 * триггер получает связку через scope, фокус уходит в панель и возвращается,
 * Escape и Tab закрывают только свой слой. Сценарии — те же, что у Vue
 * (`ui/vue/__tests__/popover.spec.ts`), и Select внутри тоже. `v-model` у
 * Angular нет — открытость потребитель слышит выходом `(soChangeOpen)`.
 *
 * Своё у Angular — разметка. Корень — элемент потребителя (`<span
 * so-popover>`), триггер — шаблон слота (`<ng-template slot="trigger">`), и
 * связку с панелью на свой элемент потребитель кладёт `[so-attributes]`. Вывод
 * шаблона меняет контекст в том же представлении, поэтому триггер — тот же
 * узел при каждом открытии и закрытии, и фокус на нём остаётся. Якорь панели —
 * корень: его узел шаблону отдаёт база (`rootElement()`). Корень Angular не
 * снимается, а прячется, поэтому `rendered: false` поповера прячет и открытые
 * панели в `body` — свою и вложенных слоёв: увезённые, они иначе остались бы
 * на виду, а у Vue их снимает `v-if` корня. Крестик без `closable` не
 * прячется, а уходит из разметки (`@if`).
 *
 * Порядок Tab, который ведёт сам браузер, jsdom не считает: здесь проверены
 * переходы, которые делает плагин (Tab в панель, из неё, Shift+Tab на
 * триггер). Остальное — `playground/vue/browser/popover.spec.ts`.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { Component, signal, type Type } from '@angular/core'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { TCheckBox, TPopover, type TSwipe } from '@soxa-ui/core'
import { ruRU } from '@soxa-ui/plugins'
import {
	AttributesDirective,
	LocaleProviderDirective,
	SlotDirective,
	TButtonComponent,
	TCheckBoxComponent,
	TDialogComponent,
	TPopoverComponent,
	TSelectComponent,
	TSelectItemComponent,
} from '@soxa-ui/angular'
import { TELEPORT_ANCHOR } from '../src/adapter/runtime/teleport'
import { countAssemblies, type TAssemblyProbe } from './assemblies'
import { find, nextFrame } from './mount'

/**
 * Поповер между двумя кнопками страницы — чтобы было откуда прийти и куда уйти
 * по Tab. Триггер — Button в шаблоне слота: связку и вид «нажат» он кладёт на
 * себя директивой набора. Значения, которые тест меняет, — сигналы: хост
 * `OnPush`. Экземпляр ядра у поповера внешний — открытость тест пишет и в него.
 */
@Component({
	selector: 'probe-popover-page',
	standalone: true,
	imports: [TPopoverComponent, TButtonComponent, SlotDirective, AttributesDirective],
	template: `<div>
		<button class="so-test-before">До</button>
		<span
			so-popover
			[ctrl]="ctrl"
			[open]="open()"
			[closable]="closable()"
			[contained]="contained()"
			[lazyMount]="lazyMount()"
			[swipe]="swipe()"
			[rendered]="rendered()"
			[aria_label]="label()"
			(soChangeOpen)="changes.push($event.newValue)"
		>
			<ng-template
				slot="trigger"
				let-triggerAria="triggerAria"
				let-triggerDataset="triggerDataset"
			>
				<button
					so-button
					text="Открыть"
					class="so-test-trigger"
					[so-attributes]="{ ...triggerAria, ...triggerDataset }"
				></button>
			</ng-template>
			<button class="so-test-first">Первая</button>
			<button class="so-test-second">Вторая</button>
		</span>
		<button class="so-test-after">После</button>
	</div>`,
})
class Page {
	readonly ctrl = new TPopover()
	readonly open = signal<boolean | undefined>(undefined)
	readonly closable = signal<boolean | undefined>(undefined)
	readonly contained = signal<boolean | undefined>(undefined)
	readonly lazyMount = signal<boolean | undefined>(undefined)
	readonly swipe = signal<TSwipe | undefined>(undefined)
	readonly rendered = signal<boolean | undefined>(undefined)
	readonly label = signal<string | undefined>(undefined)
	/** Открытость, которую поповер сообщил выходом. */
	readonly changes: boolean[] = []
}

/** Только текст и без крестика: остановок Tab в панели нет. */
@Component({
	selector: 'probe-popover-text',
	standalone: true,
	imports: [TPopoverComponent, TButtonComponent, SlotDirective, AttributesDirective],
	template: `<div>
		<button class="so-test-before">До</button>
		<span so-popover [closable]="false">
			<ng-template
				slot="trigger"
				let-triggerAria="triggerAria"
				let-triggerDataset="triggerDataset"
			>
				<button
					so-button
					text="Открыть"
					class="so-test-trigger"
					[so-attributes]="{ ...triggerAria, ...triggerDataset }"
				></button>
			</ng-template>
			<p>Только текст</p>
		</span>
		<button class="so-test-after">После</button>
	</div>`,
})
class TextPage {}

/** Поповер без соседей: после него на странице остановок нет. */
@Component({
	selector: 'probe-popover-alone',
	standalone: true,
	imports: [TPopoverComponent, TButtonComponent, SlotDirective, AttributesDirective],
	template: `<div>
		<span so-popover>
			<ng-template
				slot="trigger"
				let-triggerAria="triggerAria"
				let-triggerDataset="triggerDataset"
			>
				<button
					so-button
					text="Открыть"
					class="so-test-trigger"
					[so-attributes]="{ ...triggerAria, ...triggerDataset }"
				></button>
			</ng-template>
			<button class="so-test-first">Первая</button>
			<button class="so-test-second">Вторая</button>
		</span>
	</div>`,
})
class AlonePage {}

/** Два поповера без триггера под провайдером локали — с крестиком и без. */
@Component({
	selector: 'probe-popover-locale',
	standalone: true,
	imports: [TPopoverComponent, LocaleProviderDirective],
	template: `<div so-locale-provider [locale]="locale">
		<span so-popover><button class="so-test-first">Первая</button></span>
		<span so-popover class="so-test-bare" [closable]="false">
			<button class="so-test-first">Первая</button>
		</span>
	</div>`,
})
class LocalePage {
	readonly locale = ruRU
}

/** Внешний поповер, в панели которого — внутренний. */
@Component({
	selector: 'probe-popover-nested',
	standalone: true,
	imports: [TPopoverComponent, TButtonComponent, SlotDirective, AttributesDirective],
	template: `<div>
		<button class="so-test-before">До</button>
		<span so-popover class="so-test-outer">
			<ng-template
				slot="trigger"
				let-triggerAria="triggerAria"
				let-triggerDataset="triggerDataset"
			>
				<button
					so-button
					text="Открыть"
					class="so-test-trigger"
					[so-attributes]="{ ...triggerAria, ...triggerDataset }"
				></button>
			</ng-template>
			<button class="so-test-first">Первая</button>
			<span so-popover class="so-test-inner">
				<ng-template
					slot="trigger"
					let-triggerAria="triggerAria"
					let-triggerDataset="triggerDataset"
				>
					<button
						so-button
						text="Ещё"
						class="so-test-inner-trigger"
						[so-attributes]="{ ...triggerAria, ...triggerDataset }"
					></button>
				</ng-template>
				<button class="so-test-inner-first">Внутри</button>
			</span>
		</span>
		<button class="so-test-after">После</button>
	</div>`,
})
class NestedPage {}

/**
 * Внешний поповер, в панели которого — внутренний поповер и окно с подложкой:
 * их корни уезжают в `body` сами, мимо панели внешнего. Отрисован ли внешний и
 * открыто ли окно — сигналы.
 */
@Component({
	selector: 'probe-popover-layers',
	standalone: true,
	imports: [
		TPopoverComponent,
		TDialogComponent,
		TButtonComponent,
		SlotDirective,
		AttributesDirective,
	],
	template: `<span so-popover [rendered]="rendered()">
		<ng-template
			slot="trigger"
			let-triggerAria="triggerAria"
			let-triggerDataset="triggerDataset"
		>
			<button
				so-button
				text="Открыть"
				class="so-test-trigger"
				[so-attributes]="{ ...triggerAria, ...triggerDataset }"
			></button>
		</ng-template>
		<span so-popover>
			<ng-template
				slot="trigger"
				let-triggerAria="triggerAria"
				let-triggerDataset="triggerDataset"
			>
				<button
					so-button
					text="Ещё"
					class="so-test-inner-trigger"
					[so-attributes]="{ ...triggerAria, ...triggerDataset }"
				></button>
			</ng-template>
			<button class="so-test-inner-first">Внутри</button>
		</span>
		<div so-dialog [visible]="dialog()" (soChangeVisible)="dialog.set($event.newValue)">
			<button class="so-test-dialog-first">В окне</button>
		</div>
	</span>`,
})
class LayersPage {
	readonly rendered = signal<boolean | undefined>(undefined)
	readonly dialog = signal(false)
}

/** Поповер с Select в панели: список Select — тоже панель в `body`, соседка. */
@Component({
	selector: 'probe-popover-select',
	standalone: true,
	imports: [
		TPopoverComponent,
		TButtonComponent,
		TSelectComponent,
		TSelectItemComponent,
		SlotDirective,
		AttributesDirective,
	],
	template: `<div>
		<button class="so-test-before">До</button>
		<span so-popover>
			<ng-template
				slot="trigger"
				let-triggerAria="triggerAria"
				let-triggerDataset="triggerDataset"
			>
				<button
					so-button
					text="Открыть"
					class="so-test-trigger"
					[so-attributes]="{ ...triggerAria, ...triggerDataset }"
				></button>
			</ng-template>
			<div so-select class="so-test-select">
				<div so-select-item value="a" text="Первый"></div>
				<div so-select-item value="b" text="Второй"></div>
			</div>
		</span>
		<button class="so-test-after">После</button>
	</div>`,
})
class SelectPage {}

/** Поповеры — первым узлом представлений `@for`: Angular вставляет и двигает их корни. */
@Component({
	selector: 'probe-popover-list',
	standalone: true,
	imports: [TPopoverComponent, TButtonComponent, SlotDirective, AttributesDirective],
	template: `<section class="list">
		@for (item of items(); track item) {
			<span so-popover [attr.data-item]="item">
				<ng-template slot="trigger" let-triggerAria="triggerAria">
					<button so-button [text]="item" [so-attributes]="triggerAria"></button>
				</ng-template>
				<b>{{ item }}</b>
			</span>
		}
	</section>`,
})
class ListPage {
	readonly items = signal(['a', 'b'])
}

/** Смонтированный хост теста — его перепроверяют действия. */
let current: ComponentFixture<unknown> | null = null

afterEach(() => {
	current = null
	vi.restoreAllMocks()
})

/**
 * Смонтировать хост в документ и дождаться кадра: корень плагины получают
 * через `requestAnimationFrame`. `prepare` задаёт входы до первой отрисовки —
 * так, как они стоят в разметке с самого начала.
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

/** Узел по селектору в документе: панель телепортирована мимо хоста. */
const node = (selector: string, scope: ParentNode = document) => find(scope, selector, HTMLElement)

const trigger = () => node('.so-test-trigger')
const panel = (scope: ParentNode = document) => node('.so-popover__panel', scope)
const isOpen = (element: HTMLElement = panel()) => element.style.display !== 'none'

/** Якоря телепорта в поддереве — комментарии на месте увезённых панелей. */
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

/** Клик мышью целиком: нажатие, фокус от `mousedown`, клик. */
function click(target: HTMLElement): void {
	target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }))
	target.focus()
	target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
	check()
}

/** Фокус на узел — уход фокуса мимо слушает плагин оверлея. */
function focus(target: HTMLElement): void {
	target.focus()
	check()
}

/** Клавиша на элементе под фокусом. Отдаёт событие: по нему видно, погашена ли она. */
function press(key: string, options: KeyboardEventInit = {}): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options })

	;(document.activeElement ?? document.body).dispatchEvent(event)
	check()

	return event
}

/** Открыть кликом по триггеру и дождаться, пока фокус уйдёт в панель. */
async function open(target: HTMLElement = trigger()): Promise<void> {
	click(target)
	await nextFrame()
}

describe('разметка', () => {
	it('корень — span с триггером, панель телепортирована в body и скрыта', async () => {
		await render(Page)

		const root = node('.so-popover')

		expect(root.localName).toBe('span')
		expect(root.contains(trigger())).toBe(true)
		expect(root.contains(panel())).toBe(false)
		expect(panel().parentElement).toBe(document.body)
		// На месте панели — якорь телепорта, внутри корня
		expect(anchors(root)).toHaveLength(1)
		expect(isOpen()).toBe(false)
	})

	/**
	 * Внутри контейнера панель не телепортирована: она в корне, сразу за
	 * триггером, и накрывает ближайший позиционированный предок — раскладка
	 * ставит её `absolute` без координат, место задаёт тема.
	 */
	it('contained: панель в корне, без телепорта и координат; нажатие в ней не закрывает', async () => {
		await render(Page, (page) => page.contained.set(true))

		const root = node('.so-popover')

		expect(root.contains(panel())).toBe(true)
		expect(panel().dataset.contained).toBe('true')
		expect(panel().style.position).toBe('absolute')
		expect(panel().style.left).toBe('')
		expect(panel().style.top).toBe('')

		await open()

		expect(isOpen()).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-first'))

		click(node('.so-test-first'))

		expect(isOpen()).toBe(true)
	})

	it('панель — диалог, aria-controls триггера ведёт на неё', async () => {
		await render(Page)

		expect(panel().getAttribute('role')).toBe('dialog')
		expect(panel().getAttribute('tabindex')).toBe('-1')
		expect(trigger().getAttribute('aria-haspopup')).toBe('dialog')
		expect(trigger().getAttribute('aria-expanded')).toBe('false')
		expect(document.getElementById(trigger().getAttribute('aria-controls') ?? '')).toBe(panel())
	})

	it('ARIA и data-* стоят на своих элементах', async () => {
		await render(Page)
		await open()

		const root = node('.so-popover')

		expect(root.dataset['open']).toBe('true')
		expect(trigger().dataset['selected']).toBe('true')
		expect(trigger().getAttribute('aria-expanded')).toBe('true')
		// ARIA панели — на панели, не на корне. `data-open` у панели свой, от её
		// слоя (Frame): корень телепортированной панели его не отдаёт
		expect(root.hasAttribute('role')).toBe(false)
		expect(panel().dataset['open']).toBe('true')
		expect(panel().dataset['layer']).toMatch(/^\d+$/)
		expect(root.hasAttribute('data-layer')).toBe(false)
	})

	/**
	 * Открытость панели для темы — `data-open` её слоя: по нему тема проявляет и
	 * гасит панель. Писатель у атрибута один — Frame, чья видимость и есть
	 * `open`, — поэтому он идёт за `open`, как бы его ни меняли: кликом по
	 * триггеру, из инстанса, крестиком.
	 */
	it('data-open панели идёт за open', async () => {
		const fixture = await render(Page)
		const popover = fixture.componentInstance.ctrl

		expect(panel().dataset['open']).toBe('false')

		await open()

		expect(panel().dataset['open']).toBe('true')

		popover.open = false
		check()

		expect(panel().dataset['open']).toBe('false')

		popover.open = true
		check()

		expect(panel().dataset['open']).toBe('true')

		click(node('.so-popover__close'))

		expect(popover.open).toBe(false)
		expect(panel().dataset['open']).toBe('false')
	})

	it('aria_label даёт диалогу имя', async () => {
		await render(Page, (page) => page.label.set('Фильтры'))

		expect(panel().getAttribute('aria-label')).toBe('Фильтры')
	})

	it('крестик назван локалью поддерева, closable: false его убирает', async () => {
		await render(LocalePage)

		const [named, bare] = [...document.querySelectorAll('.so-popover__panel')]

		expect(named.querySelector('.so-popover__close')?.getAttribute('aria-label')).toBe(
			'Закрыть',
		)
		expect(bare.querySelector('.so-popover__close')).toBeNull()
	})
})

describe('открытие и закрытие', () => {
	it('клик по триггеру открывает', async () => {
		await render(Page)

		click(trigger())

		expect(isOpen()).toBe(true)
	})

	it('клик в панель не закрывает', async () => {
		await render(Page)
		await open()

		click(node('.so-test-first'))

		expect(isOpen()).toBe(true)
	})

	it('клик по открытому триггеру закрывает, панель не мигает', async () => {
		const fixture = await render(Page)
		const changes: boolean[] = []

		fixture.componentInstance.ctrl.events.on(
			'change:open',
			({ newValue: value }: TValuePayload<boolean>) => changes.push(value),
		)

		await open()

		click(trigger())

		expect(isOpen()).toBe(false)
		// Нажатие по триггеру — внутри владельца: закрытия нажатием мимо и
		// повторного открытия кликом не было
		expect(changes).toEqual([true, false])
	})

	it('нажатие мимо закрывает', async () => {
		await render(Page)
		await open()

		pointerDown(node('.so-test-after'))

		expect(isOpen()).toBe(false)
	})

	it('open из инстанса открывает так же, как из разметки; (soChangeOpen) слышит оба пути', async () => {
		const fixture = await render(Page)
		const { ctrl, changes } = fixture.componentInstance

		ctrl.open = true
		check()
		await nextFrame()

		expect(isOpen()).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-first'))

		click(trigger())

		expect(ctrl.open).toBe(false)
		expect(changes).toEqual([true, false])
	})

	it('open из разметки открывает и закрывает', async () => {
		const fixture = await render(Page, (page) => page.open.set(false))
		const page = fixture.componentInstance

		page.open.set(true)
		check()
		await nextFrame()

		expect(isOpen()).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-first'))

		page.open.set(false)
		check()

		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(trigger())
	})
})

/**
 * Связка триггера меняется на каждое открытие (`aria-expanded`,
 * `data-selected`), а триггер — тот же узел: вывод шаблона отдаёт новый
 * контекст тому же представлению. Пересоздай он представление — фокус,
 * стоявший на прежнем триггере, упал бы на `body`.
 */
describe('триггер — тот же узел', () => {
	it('после открытия и закрытия — тот же узел с новой связкой', async () => {
		await render(Page)

		const first = trigger()

		await open()

		expect(trigger()).toBe(first)
		expect(first.getAttribute('aria-expanded')).toBe('true')
		expect(first.dataset['selected']).toBe('true')

		press('Escape')

		expect(trigger()).toBe(first)
		expect(first.getAttribute('aria-expanded')).toBe('false')
		expect(first.dataset['selected']).toBe('false')
	})

	it('после закрытия кликом по триггеру фокус остаётся на нём', async () => {
		await render(Page)

		const first = trigger()

		await open()

		click(first)

		expect(isOpen()).toBe(false)
		expect(trigger()).toBe(first)
		expect(document.activeElement).toBe(first)
	})
})

describe('фокус', () => {
	it('при открытии уходит на первую остановку панели — кадром позже', async () => {
		await render(Page)

		click(trigger())

		expect(document.activeElement).toBe(trigger())

		await nextFrame()

		expect(document.activeElement).toBe(node('.so-test-first'))
	})

	it('без остановок в панели — на саму панель', async () => {
		await render(TextPage)
		await open()

		expect(document.activeElement).toBe(panel())
	})

	it('Escape закрывает и возвращает фокус на триггер', async () => {
		await render(Page)
		await open()

		const event = press('Escape')

		expect(event.defaultPrevented).toBe(true)
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(trigger())
	})

	it('Escape на триггере открытого поповера тоже закрывает', async () => {
		await render(Page)
		await open()

		trigger().focus()
		press('Escape')

		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(trigger())
	})

	it('крестик закрывает и возвращает фокус на триггер', async () => {
		await render(Page)
		await open()

		click(node('.so-popover__close'))

		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(trigger())
	})

	it('нажатие мимо фокус не возвращает', async () => {
		await render(Page)
		await open()

		pointerDown(node('.so-test-after'))

		expect(isOpen()).toBe(false)
		expect(document.activeElement).not.toBe(trigger())
	})

	it('фокус, ушедший мимо, закрывает и не возвращается', async () => {
		await render(Page)
		await open()

		focus(node('.so-test-after'))

		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(node('.so-test-after'))
	})

	it('открытый со старта уводит фокус в панель, закрытие возвращает его на триггер', async () => {
		await render(Page, (page) => page.open.set(true))
		await nextFrame()

		expect(document.activeElement).toBe(node('.so-test-first'))

		press('Escape')

		// Запомнен был `body` — фокус уходит на первую остановку корня
		expect(document.activeElement).toBe(trigger())
	})

	it('отсоединённый элемент возврата — фокус на триггер', async () => {
		const outside = document.createElement('button')

		document.body.appendChild(outside)

		try {
			const fixture = await render(Page)

			outside.focus()
			fixture.componentInstance.ctrl.open = true
			check()
			await nextFrame()
			outside.remove()

			press('Escape')

			expect(document.activeElement).toBe(trigger())
		} finally {
			outside.remove()
		}
	})
})

describe('Tab', () => {
	it('Tab с триггера при открытой панели — в панель', async () => {
		await render(Page)
		await open()

		trigger().focus()

		const event = press('Tab')

		expect(event.defaultPrevented).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-first'))
	})

	it('Shift+Tab с первой остановки панели — на триггер, панель остаётся открытой', async () => {
		await render(Page)
		await open()

		const event = press('Tab', { shiftKey: true })

		expect(event.defaultPrevented).toBe(true)
		expect(document.activeElement).toBe(trigger())
		expect(isOpen()).toBe(true)
	})

	it('Shift+Tab с самой панели — тоже на триггер', async () => {
		await render(TextPage)
		await open()

		press('Tab', { shiftKey: true })

		expect(document.activeElement).toBe(trigger())
	})

	it('Tab с последней остановки панели — к остановке после поповера, панель закрыта', async () => {
		await render(Page)
		await open()

		node('.so-popover__close').focus()

		const event = press('Tab')

		expect(event.defaultPrevented).toBe(true)
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(node('.so-test-after'))
	})

	it('Tab с самой панели без остановок — к остановке после поповера', async () => {
		await render(TextPage)
		await open()

		expect(document.activeElement).toBe(panel())

		const event = press('Tab')

		expect(event.defaultPrevented).toBe(true)
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(node('.so-test-after'))
	})

	it('Tab с середины панели не трогает: порядок ведёт браузер', async () => {
		await render(Page)
		await open()

		const event = press('Tab')

		expect(event.defaultPrevented).toBe(false)
		expect(isOpen()).toBe(true)
	})

	it('после поповера остановок нет — закрыть, Tab не гасить', async () => {
		await render(AlonePage)
		await open()

		node('.so-popover__close').focus()

		const event = press('Tab')

		expect(event.defaultPrevented).toBe(false)
		expect(isOpen()).toBe(false)
	})
})

describe('вложенные слои', () => {
	/** Панели в порядке открытия не лежат: ищем по связке с триггером. */
	const panelOf = (triggerElement: HTMLElement) =>
		node(`#${triggerElement.getAttribute('aria-controls') ?? ''}`)

	it('Escape во вложенном закрывает только его, фокус — на его триггер', async () => {
		await render(NestedPage)
		await open()
		await open(node('.so-test-inner-trigger'))

		expect(document.activeElement).toBe(node('.so-test-inner-first'))

		press('Escape')

		expect(isOpen(panelOf(node('.so-test-inner-trigger')))).toBe(false)
		expect(isOpen(panelOf(trigger()))).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-inner-trigger'))
	})

	it('клик во вложенную панель внешний не закрывает', async () => {
		await render(NestedPage)
		await open()
		await open(node('.so-test-inner-trigger'))

		click(node('.so-test-inner-first'))

		expect(isOpen(panelOf(node('.so-test-inner-trigger')))).toBe(true)
		expect(isOpen(panelOf(trigger()))).toBe(true)
	})

	it('клик во внешнюю панель закрывает вложенный, внешний остаётся', async () => {
		await render(NestedPage)
		await open()
		await open(node('.so-test-inner-trigger'))

		click(node('.so-test-first'))

		expect(isOpen(panelOf(node('.so-test-inner-trigger')))).toBe(false)
		expect(isOpen(panelOf(trigger()))).toBe(true)
	})

	/**
	 * Панель вложенного поповера увезена в `body` сама, и скрытый корень
	 * внешнего до неё не доходит. У Vue `v-if` корня внешнего снимает всё его
	 * поддерево, а у Angular вложенный прячет свою панель по признаку поддерева
	 * внешнего. Снова отрисованный внешний — обе панели на виду, как и были.
	 */
	it('rendered: false у внешнего прячет и открытую панель вложенного', async () => {
		const fixture = await render(LayersPage)
		const page = fixture.componentInstance

		await open()
		await open(node('.so-test-inner-trigger'))

		const outer = panelOf(trigger())
		const inner = panelOf(node('.so-test-inner-trigger'))

		expect(isOpen(inner)).toBe(true)

		page.rendered.set(false)
		check()

		expect(isOpen(outer)).toBe(false)
		expect(isOpen(inner)).toBe(false)
		expect(inner.parentElement).toBe(document.body)

		page.rendered.set(true)
		check()

		expect(isOpen(outer)).toBe(true)
		expect(isOpen(inner)).toBe(true)
	})

	/**
	 * Окно в панели — тоже слой: его корень и подложка-спутник уехали в `body`,
	 * и скрытый внешний поповер прячет обоих тем же признаком поддерева.
	 */
	it('rendered: false у внешнего прячет и открытое окно в панели вместе с подложкой', async () => {
		const fixture = await render(LayersPage)
		const page = fixture.componentInstance

		await open()
		page.dialog.set(true)
		check()
		await nextFrame()

		const dialog = node('.so-dialog')
		const backdrop = node('.so-backdrop:has(+ .so-dialog)')

		expect(dialog.parentElement).toBe(document.body)
		expect(isOpen(dialog)).toBe(true)
		expect(isOpen(backdrop)).toBe(true)

		page.rendered.set(false)
		check()

		expect(isOpen(dialog)).toBe(false)
		expect(isOpen(backdrop)).toBe(false)
		expect(page.dialog()).toBe(true)

		page.rendered.set(true)
		check()

		expect(isOpen(dialog)).toBe(true)
		expect(isOpen(backdrop)).toBe(true)
	})

	/**
	 * Корня у окна в снятом поддереве нет и у плагинов, как у Vue, где `v-if`
	 * внешнего поповера снимает и окно в его панели: открытое окно отпускает
	 * прокрутку страницы и пометки фона. Снова отрисованный внешний возвращает
	 * окну узел, и оно запирает страницу заново, кадром `ready`.
	 */
	it('rendered: false у внешнего отпускает страницу из-под открытого окна в панели, true — запирает снова', async () => {
		const fixture = await render(LayersPage)
		const page = fixture.componentInstance

		/** Спрятан ли узел от скринридера — сам или через предка. */
		const muted = (element: Element) => element.closest('[aria-hidden="true"]') !== null

		await open()
		page.dialog.set(true)
		check()
		await nextFrame()

		expect(document.documentElement.style.overflow).toBe('hidden')
		expect(muted(trigger())).toBe(true)

		page.rendered.set(false)
		check()

		expect(page.dialog()).toBe(true)
		expect(document.documentElement.style.overflow).toBe('')
		expect(muted(trigger())).toBe(false)

		page.rendered.set(true)
		check()
		await nextFrame()

		expect(isOpen(node('.so-dialog'))).toBe(true)
		expect(document.documentElement.style.overflow).toBe('hidden')
		expect(muted(trigger())).toBe(true)

		page.dialog.set(false)
		check()
		await nextFrame()

		expect(document.documentElement.style.overflow).toBe('')
		expect(muted(trigger())).toBe(false)
	})
})

/**
 * Список Select в панели — тоже панель в `body`, соседка панели поповера, а
 * не её потомок: открытый — слой выше, Escape закрывает только его, а клик в
 * него поповер не закрывает.
 */
describe('Select внутри', () => {
	const field = () => find(document, '.so-test-select input', HTMLInputElement)
	const selectPanel = () => node('.so-select__panel')

	it('Escape в открытом Select закрывает только Select', async () => {
		await render(SelectPage)
		await open()
		click(field())
		await nextFrame()
		check()

		expect(isOpen(selectPanel())).toBe(true)

		press('Escape')

		expect(isOpen(selectPanel())).toBe(false)
		expect(isOpen()).toBe(true)

		// Второй Escape — уже поповеру: Select закрыт и клавишу не тратит
		press('Escape')

		expect(isOpen()).toBe(false)
	})

	it('клик в список Select поповер не закрывает', async () => {
		await render(SelectPage)
		await open()
		click(field())
		await nextFrame()
		check()

		click(node('.so-select__panel [role="option"]'))

		expect(isOpen()).toBe(true)
		expect(field().getAttribute('aria-expanded')).toBe('false')
		expect(field().value).toBe('Первый')
	})
})

/**
 * The content is the `default` template: a button that takes focus on open
 * and a checkbox the probe counts — there is no other checkbox on the page.
 * `lazyMount` is a signal.
 */
@Component({
	selector: 'probe-popover-template',
	standalone: true,
	imports: [
		TPopoverComponent,
		TButtonComponent,
		TCheckBoxComponent,
		SlotDirective,
		AttributesDirective,
	],
	template: `<span so-popover [lazyMount]="lazyMount()">
		<ng-template
			slot="trigger"
			let-triggerAria="triggerAria"
			let-triggerDataset="triggerDataset"
		>
			<button
				so-button
				text="Открыть"
				class="so-test-trigger"
				[so-attributes]="{ ...triggerAria, ...triggerDataset }"
			></button>
		</ng-template>
		<ng-template slot="default">
			<button class="so-test-first">Первая</button>
			<span so-check-box class="so-test-check"></span>
		</ng-template>
	</span>`,
})
class TemplatePage {
	readonly lazyMount = signal<boolean | undefined>(undefined)
}

/** The `default` template next to a projection: the template replaces it. */
@Component({
	selector: 'probe-popover-template-projection',
	standalone: true,
	imports: [TPopoverComponent, TButtonComponent, SlotDirective, AttributesDirective],
	template: `<span so-popover>
		<ng-template
			slot="trigger"
			let-triggerAria="triggerAria"
			let-triggerDataset="triggerDataset"
		>
			<button
				so-button
				text="Открыть"
				class="so-test-trigger"
				[so-attributes]="{ ...triggerAria, ...triggerDataset }"
			></button>
		</ng-template>
		<ng-template slot="default"><button class="so-test-first">Шаблон</button></ng-template>
		<button class="so-test-projected">Проекция</button>
	</span>`,
})
class TemplateProjectionPage {}

/** A projection with `lazyMount`: a checkbox the probe counts. */
@Component({
	selector: 'probe-popover-lazy-projection',
	standalone: true,
	imports: [
		TPopoverComponent,
		TButtonComponent,
		TCheckBoxComponent,
		SlotDirective,
		AttributesDirective,
	],
	template: `<span so-popover lazyMount>
		<ng-template
			slot="trigger"
			let-triggerAria="triggerAria"
			let-triggerDataset="triggerDataset"
		>
			<button
				so-button
				text="Открыть"
				class="so-test-trigger"
				[so-attributes]="{ ...triggerAria, ...triggerDataset }"
			></button>
		</ng-template>
		<button class="so-test-first">Первая</button>
		<span so-check-box class="so-test-check"></span>
	</span>`,
})
class LazyProjectionPage {}

/**
 * Until the first open the content is not in the document. The components of
 * the `default` template are created by the popover, so with `lazyMount` they
 * come with the first open, as the slot content of the other adapters. A
 * projection Angular creates right away, in the template that wrote it, as in
 * a tab panel, and `lazyMount` only keeps it out of the document.
 */
describe('lazyMount', () => {
	/** Assemblies of the checkboxes: the page has no other checkbox. */
	let probe: TAssemblyProbe

	beforeEach(() => {
		probe = countAssemblies(TCheckBox)
	})

	afterEach(() => probe.dispose())

	it('содержимое вставляется при первом открытии и остаётся после закрытия', async () => {
		await render(Page, (page) => page.lazyMount.set(true))

		expect(document.querySelector('.so-test-first')).toBeNull()
		expect(document.querySelector('.so-popover__content')).not.toBeNull()

		await open()

		expect(document.activeElement).toBe(node('.so-test-first'))

		press('Escape')

		expect(document.querySelector('.so-test-first')).not.toBeNull()
	})

	it('без lazyMount содержимое в документе с самого начала', async () => {
		await render(Page)

		expect(document.querySelector('.so-test-first')).not.toBeNull()
	})

	it('шаблон default с lazyMount собирается с первым открытием, закрытие его не снимает', async () => {
		await render(TemplatePage, (page) => page.lazyMount.set(true))

		expect(probe.counts).toEqual({ install: 0, destroy: 0 })
		expect(document.querySelector('.so-test-check')).toBeNull()
		expect(document.querySelector('.so-popover__content')).not.toBeNull()

		await open()

		expect(probe.counts).toEqual({ install: 1, destroy: 0 })
		expect(node('.so-popover__content', panel()).contains(node('.so-test-check'))).toBe(true)
		// Focus on open lands on the first element of the template
		expect(document.activeElement).toBe(node('.so-test-first'))

		const box = node('.so-test-check')

		press('Escape')

		expect(isOpen()).toBe(false)

		await open()

		// Closing only hides the panel: the same checkbox, assembled once
		expect(isOpen()).toBe(true)
		expect(node('.so-test-check')).toBe(box)
		expect(probe.counts).toEqual({ install: 1, destroy: 0 })
	})

	it('шаблон default без lazyMount собран сразу, до открытия', async () => {
		await render(TemplatePage)

		expect(probe.counts).toEqual({ install: 1, destroy: 0 })
		expect(node('.so-popover__content', panel()).contains(node('.so-test-check'))).toBe(true)
		expect(isOpen()).toBe(false)
	})

	it('шаблон default рядом с проекцией — рисуется шаблон', async () => {
		await render(TemplateProjectionPage)

		expect(node('.so-popover__content', panel()).contains(node('.so-test-first'))).toBe(true)
		expect(document.querySelector('.so-test-projected')).toBeNull()

		await open()

		expect(document.activeElement).toBe(node('.so-test-first'))
		expect(document.querySelector('.so-test-projected')).toBeNull()
	})

	it('проекция с lazyMount собрана сразу, а в документ встаёт с первым открытием', async () => {
		await render(LazyProjectionPage)

		expect(probe.counts).toEqual({ install: 1, destroy: 0 })
		expect(document.querySelector('.so-test-check')).toBeNull()

		await open()

		expect(node('.so-popover__content', panel()).contains(node('.so-test-check'))).toBe(true)
		expect(probe.counts).toEqual({ install: 1, destroy: 0 })
	})
})

describe('жест', () => {
	const handle = () => document.querySelector('.so-popover__handle')

	/** Указатель мышью в точке по вертикали — как его слушает плагин жеста. */
	function pointer(type: string, target: Element, y: number): void {
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
		check()
	}

	it('без жеста полосы нет; с жестом — первая в панели, немая для скринридера', async () => {
		const fixture = await render(Page)
		const popover = fixture.componentInstance.ctrl

		expect(handle()).toBeNull()

		popover.swipe = 'handle'
		check()

		expect(handle()).toBe(panel().firstElementChild)
		expect(handle()?.getAttribute('aria-hidden')).toBe('true')

		popover.swipe = 'panel'
		check()

		expect(handle()).not.toBeNull()
	})

	/**
	 * Коробку панели задаёт тест: jsdom раскладку не считает. Сторону после
	 * flip плагин якоря пишет в панель и в jsdom — под триггером. Жест мышью
	 * по полосе вниз — дальше четверти высоты панели.
	 */
	it('смахнули вниз от триггера — закрыта, (soChangeOpen) слышит закрытие, фокус — на триггер', async () => {
		const fixture = await render(Page, (page) => page.swipe.set('handle'))

		await open()

		expect(panel().dataset['placement']).toBe('bottom-start')
		expect(panel().dataset['swiping']).toBe('false')

		vi.spyOn(panel(), 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 8, 300, 200))

		const grip = node('.so-popover__handle')

		pointer('pointerdown', grip, 13)
		pointer('pointermove', panel(), 108)

		expect(panel().style.getPropertyValue('--so-swipe-offset')).toBe('95px')
		expect(panel().dataset['swiping']).toBe('true')

		pointer('pointerup', panel(), 113)

		expect(isOpen()).toBe(false)
		expect(panel().dataset['swiping']).toBe('false')
		expect(fixture.componentInstance.changes).toEqual([true, false])
		expect(document.activeElement).toBe(trigger())
	})
})

describe('Angular', () => {
	/**
	 * Якорь — корень: его узел шаблону отдаёт база (`rootElement()`), а компонент
	 * свой хост взять не может. Место якоря задаёт тест — jsdom раскладку не
	 * считает: панель встаёт под корнем, в 8 px от него.
	 */
	it('якорь — корень: открытая панель встаёт под ним, в 8 px', async () => {
		await render(Page)

		vi.spyOn(node('.so-popover'), 'getBoundingClientRect').mockReturnValue(
			new DOMRect(100, 50, 80, 20),
		)

		await open()

		expect(isOpen()).toBe(true)
		expect(panel().style.left).toBe('100px')
		expect(panel().style.top).toBe('78px')
	})

	/**
	 * Корень Angular не снимается, а прячется, а панель увезена в `body`: Frame
	 * в шаблоне поповера прячет её по признаку поддерева поповера, иначе
	 * открытая панель осталась бы на виду без своего триггера. Снова
	 * отрисованный — панель на виду, как и была.
	 */
	it('rendered: false прячет корень и открытую панель', async () => {
		const fixture = await render(Page)

		await open()

		fixture.componentInstance.rendered.set(false)
		check()

		expect(node('.so-popover').style.display).toBe('none')
		expect(isOpen()).toBe(false)

		fixture.componentInstance.rendered.set(true)
		check()

		expect(node('.so-popover').style.display).toBe('')
		expect(isOpen()).toBe(true)
	})

	/**
	 * Корень значением (`rootElement()`) идёт за узлом плагинов: у снятого
	 * поповера якоря нет, как у Vue, где снята и сама панель. Снова
	 * отрисованный отдаёт корень заново, и открытая панель, получив свой узел,
	 * снова следит за якорем — встаёт у его нового места.
	 */
	it('снова отрисованный поповер возвращает якорь: открытая панель встаёт у нового места корня', async () => {
		const fixture = await render(Page)
		const rect = vi
			.spyOn(node('.so-popover'), 'getBoundingClientRect')
			.mockReturnValue(new DOMRect(100, 50, 80, 20))

		await open()

		expect(panel().style.top).toBe('78px')

		fixture.componentInstance.rendered.set(false)
		check()

		rect.mockReturnValue(new DOMRect(200, 150, 80, 20))
		fixture.componentInstance.rendered.set(true)
		check()
		// Место считает `ready` узла панели, кадром; координаты ядра — в разметку
		await nextFrame()
		check()

		expect(isOpen()).toBe(true)
		expect(panel().style.left).toBe('200px')
		expect(panel().style.top).toBe('178px')
	})

	/**
	 * Крестик без `closable` уходит из разметки (`@if`), а не прячется: скрытая
	 * кнопка со своими плагинами стояла бы в каждой панели.
	 */
	it('closable: false — крестика в разметке нет, true — он снова в панели', async () => {
		const fixture = await render(Page, (page) => page.closable.set(false))

		expect(panel().querySelector('.so-popover__close')).toBeNull()
		expect(panel().querySelector('[so-button]')).toBeNull()

		fixture.componentInstance.closable.set(true)
		check()

		expect(panel().querySelector('.so-popover__close')?.getAttribute('type')).toBe('button')
	})

	/**
	 * Узлы `@for` Angular вставляет перед первым узлом следующего представления.
	 * Первый узел здесь — корень поповера, и он стоит на месте: в цель уезжает
	 * панель внутри него, а её якорь ездит в корне. Поэтому вставка в начало и
	 * перестановка не роняют Angular с NG05106, а каждая панель остаётся в цели
	 * и связана со своим триггером.
	 */
	it('поповер первым узлом @for: вставка в начало и перестановка', async () => {
		const fixture = await render(ListPage)
		const host: HTMLElement = fixture.nativeElement
		const { items } = fixture.componentInstance

		items.set(['c', 'a', 'b'])
		check()

		items.set(['b', 'c', 'a'])
		check()

		const roots = [...host.querySelectorAll<HTMLElement>('.so-popover')]

		expect(roots.map((root) => root.dataset['item'])).toEqual(['b', 'c', 'a'])
		expect(roots.map((root) => anchors(root).length)).toEqual([1, 1, 1])
		expect(
			roots.map((root) => {
				const button = find(root, '.so-button', HTMLElement)
				const target = document.getElementById(button.getAttribute('aria-controls') ?? '')

				return [target?.parentElement === document.body, target?.textContent]
			}),
		).toEqual([
			[true, 'b'],
			[true, 'c'],
			[true, 'a'],
		])
	})
})

describe('owner visibility', () => {
	it('hides the detached panel without resetting open', async () => {
		const fixture = await render(Page, (page) => {
			page.ctrl.open = true
			page.ctrl.visible = false
		})
		const ctrl = fixture.componentInstance.ctrl

		const element = panel()
		expect(isOpen()).toBe(false)
		expect(ctrl.open).toBe(true)

		ctrl.show()
		fixture.detectChanges()
		await fixture.whenStable()
		expect(isOpen()).toBe(true)

		ctrl.hide()
		fixture.detectChanges()
		await fixture.whenStable()
		expect(isOpen()).toBe(false)
		expect(ctrl.open).toBe(true)

		ctrl.show()
		fixture.detectChanges()
		await fixture.whenStable()
		expect(isOpen()).toBe(true)
		expect(panel()).toBe(element)
	})
})
