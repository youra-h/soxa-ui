/**
 * Коллекции на сервере и гидратация их разметки.
 *
 * Элемент коллекции входит в неё в своём `ngOnInit`, а он идёт и на сервере.
 * Поэтому сервер рисует полностью и список из данных, и элементы разметки —
 * вместе с тем, что пишет им коллекция: выбор, раскрытость, отметку, общий
 * `name` радио, остановки Tab. Панель таба находит свой таб к своей сборке, и
 * панель активного таба тоже в разметке сервера — с содержимым и связкой;
 * неактивная панель — скрытый элемент потребителя без содержимого. Так же, как
 * у Vue, Svelte и Solid, и точнее них: они пишут разметку строкой по ходу
 * инициализации, и таб выше активного уходит в неё с остановкой Tab, которую
 * держал как первый доступный, а сервер Angular отдаёт разметку своей
 * эмуляции DOM, когда приложение стабильно, — остановка у него одна
 * (`docs/agents/collections.md`, «Цена»). У React элементы разметки входят в
 * коллекцию при коммите, и сервер рисует их без этого.
 *
 * `id` частей — связки «таб ↔ панель» и «заголовок ↔ панель» — и общий `name`
 * радио строят плагины связок от id монтирования, а он у Angular — номер
 * сборки компонента в приложении: у каждого запроса и у браузера приложение
 * своё, а гидратация собирает компоненты в том же порядке, что и сервер. Два
 * рендера одной страницы, параллельные или нет, дают одни и те же `id`, и
 * браузер после гидратации — тоже.
 *
 * Таблица из данных — так же: строки в её коллекции с самой сборки, и сервер
 * рисует их вместе с `id` заголовков строк и ссылками чекбоксов на них, а
 * подписи колонок — с их `id` и именем кнопки сортировки от локали. Окно
 * `<ng-container so-virtual>` коллекция подхватывает при сборке, и сервер
 * отдаёт уже окно — первые 50 элементов, — а гидратация собирает то же окно.
 * Своего узла у окна и у обёртки перестановки нет ни на сервере, ни после
 * гидратации: директиву на `<ng-container>` сервер печатает комментарием.
 *
 * Меню — коллекция в слое: пункты разметки и из данных входят в его коллекцию
 * и на сервере, а панель, как у Frame, есть только в браузере. Сервер отдаёт
 * корень с триггером и связкой и пустую скрытую панель в корне, а после
 * гидратации панель уезжает в `body` с пунктами, и стрелки ходят по ним.
 * Select — так же: опции в коллекции и на сервере, поле — с текстом
 * выбранного, в `multiple` — с тегами, а панель есть только в браузере.
 * Календарь — дни кладёт в коллекцию вид, и сервер рисует сетки целиком: с
 * именами сеток, днями и одной остановкой Tab, а панель выбора месяца и года —
 * слой поповера с `contained`, и на сервере от неё пустой скрытый элемент на
 * месте.
 *
 * Разметка сервера проверяется разобранной документом: порядок атрибутов у
 * сервера свой (`server.ts`).
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { Component, type ApplicationRef, type Type } from '@angular/core'
import { createEngineMenu, createEngineSelect, type TTableColumnSource } from '@soxa-ui/core'
import { ruRU } from '@soxa-ui/plugins'
import {
	AttributesDirective,
	LocaleProviderDirective,
	SlotDirective,
	TAccordionComponent,
	TAccordionItemComponent,
	TButtonComponent,
	TCalendarComponent,
	TDragAndDropComponent,
	TListBoxComponent,
	TListBoxItemComponent,
	TMenuComponent,
	TMenuItemComponent,
	TPaginationComponent,
	TRadioGroupComponent,
	TRadioGroupItemComponent,
	TSelectComponent,
	TSelectItemComponent,
	TTableComponent,
	TTabsComponent,
	TTabsContentComponent,
	TTabsItemComponent,
	TVirtualComponent,
} from '@soxa-ui/angular'
import { hydrate, leavePage, loadPage, renderOnServer } from './server'

/** Страница сервера, разобранная документом, — как её получил бы браузер. */
async function serverPage(app: Type<unknown>): Promise<Document> {
	return new DOMParser().parseFromString(await renderOnServer(app), 'text/html')
}

/** Узлы страницы по селектору. */
const all = (page: ParentNode, selector: string): Element[] => [...page.querySelectorAll(selector)]

/** Значение атрибута у каждого узла. */
const attributeOf = (nodes: readonly Element[], name: string) =>
	nodes.map((node) => node.getAttribute(name))

/** Показанные панели: неактивная — скрытый элемент потребителя. */
const shownPanels = (page: ParentNode) =>
	all(page, '[role="tabpanel"]').filter(
		(panel) => !(panel instanceof HTMLElement) || panel.style.display !== 'none',
	)

const ITEMS = [
	{ value: 'a', text: 'Первый' },
	{ value: 'b', text: 'Второй' },
	{ value: 'c', text: 'Третий' },
]

describe('ListBox · серверный рендер', () => {
	@Component({
		selector: 'app-root',
		standalone: true,
		imports: [TListBoxComponent],
		template: `<div so-list-box [items]="items" value="b"></div>`,
	})
	class ItemsPage {
		readonly items = ITEMS
	}

	@Component({
		selector: 'app-root',
		standalone: true,
		imports: [TListBoxComponent, TListBoxItemComponent],
		template: `<div so-list-box>
			<div so-list-box-item value="a" text="A"></div>
			<div so-list-box-item value="b" text="B" selected></div>
		</div>`,
	})
	class MarkupPage {}

	it('список из items — полностью: выбранное — aria-selected', async () => {
		const page = await serverPage(ItemsPage)

		expect(attributeOf(all(page, '.so-list-box-item .so-button'), 'aria-selected')).toEqual([
			'false',
			'true',
			'false',
		])
	})

	it('элементы разметки — с выбором и остановками Tab от коллекции', async () => {
		const page = await serverPage(MarkupPage)
		const rows = all(page, '.so-list-box-item .so-button')

		expect(attributeOf(rows, 'aria-selected')).toEqual(['false', 'true'])
		expect(attributeOf(rows, 'tabindex')).toEqual(['-1', '-1'])
		expect(attributeOf(all(page, '.so-list-box-item'), 'data-selected')).toEqual([
			'false',
			'true',
		])
	})
})

describe('Tabs · серверный рендер', () => {
	@Component({
		selector: 'app-root',
		standalone: true,
		imports: [TTabsComponent, TTabsContentComponent],
		template: `<div so-tabs [items]="items">
			<div so-tabs-content slot="content" value="a">Панель A</div>
			<div so-tabs-content slot="content" value="b">Панель B</div>
		</div>`,
	})
	class ItemsPage {
		readonly items = [
			{ value: 'a', text: 'A' },
			{ value: 'b', text: 'B', _: { active: true } },
		]
	}

	@Component({
		selector: 'app-root',
		standalone: true,
		imports: [TTabsComponent, TTabsItemComponent, TTabsContentComponent],
		template: `<div so-tabs>
			<div so-tabs-item value="a" text="A"></div>
			<div so-tabs-item value="b" text="B" active></div>
			<div so-tabs-content slot="content" value="b">Панель B</div>
		</div>`,
	})
	class MarkupPage {}

	/** Активный таб в своём компоненте: его шаблон Angular рисует после таба выше. */
	@Component({
		selector: 'app-active-tab',
		standalone: true,
		imports: [TTabsItemComponent],
		template: `<div so-tabs-item value="b" text="B" active></div>`,
	})
	class ActiveTab {}

	@Component({
		selector: 'app-root',
		standalone: true,
		imports: [TTabsComponent, TTabsItemComponent, ActiveTab],
		template: `<div so-tabs>
			<div so-tabs-item value="a" text="A"></div>
			<app-active-tab></app-active-tab>
		</div>`,
	})
	class NestedPage {}

	it.each([
		['табы из items', ItemsPage],
		['табы и панели из разметки', MarkupPage],
	] as const)(
		'%s: aria-selected, связка таба с панелью и панель активного таба',
		async (_name, app) => {
			const page = await serverPage(app)
			const rows = all(page, '[role="tab"]')
			const panels = shownPanels(page)

			expect(attributeOf(rows, 'aria-selected')).toEqual(['false', 'true'])
			expect(panels.map((panel) => panel.textContent)).toEqual(['Панель B'])
			expect(rows[1].getAttribute('aria-controls')).toBe(panels[0].id)
			expect(panels[0].getAttribute('aria-labelledby')).toBe(rows[1].id)
		},
	)

	/**
	 * У Vue, Svelte и Solid таб выше активного уходит в разметку сервера с
	 * остановкой Tab, которую держал как первый доступный, — до гидратации
	 * остановок две (`docs/agents/collections.md`, «Цена»). Angular эту цену не
	 * платит: сервер рисует в эмуляцию DOM и отдаёт её разметку, когда
	 * приложение стабильно, — таб, у которого остановку забрал активный, к
	 * этому времени перерисован. Даже когда активный входит после того, как
	 * шаблон таба выше уже нарисован, — из своего компонента.
	 */
	it.each([
		['табы разметки', MarkupPage],
		['активный в своём компоненте, после отрисовки таба выше', NestedPage],
	] as const)('%s, активный вторым — остановка Tab одна, у него', async (_name, app) => {
		const page = await serverPage(app)

		expect(attributeOf(all(page, '[role="tab"]'), 'tabindex')).toEqual(['-1', '0'])
	})

	it('неактивная панель на сервере — скрытый элемент без содержимого', async () => {
		const page = await serverPage(ItemsPage)
		const hidden = all(page, '[role="tabpanel"]').filter(
			(panel) => panel instanceof HTMLElement && panel.style.display === 'none',
		)

		expect(hidden.map((panel) => panel.textContent)).toEqual([''])
	})
})

/**
 * Свой `id` панели — её вход: статику база снимает с корня, и на панель `id`
 * встаёт из её набора. Вход панели — в её `ngOnInit`, и на сервере тоже, а
 * разметку сервер отдаёт, когда приложение стабильно: таб к этому времени
 * ведёт на `id` панели, и цены Vue, Svelte и Solid — таб на формуле до
 * гидратации — у Angular нет. Гидратация собирает в том же порядке.
 */
describe('Tabs со своим id панели · сервер и гидратация', () => {
	afterEach(() => {
		vi.restoreAllMocks()
		leavePage()
	})

	@Component({
		selector: 'app-root',
		standalone: true,
		imports: [TTabsComponent, TTabsItemComponent, TTabsContentComponent],
		template: `<div so-tabs>
			<div so-tabs-item value="a" text="A" active></div>
			<div so-tabs-item value="b" text="B"></div>
			<div so-tabs-content slot="content" value="a" id="general">Панель A</div>
			<div so-tabs-content slot="content" value="b">Панель B</div>
		</div>`,
	})
	class PanelIdPage {}

	it('у сервера свой id — на панели, и таб ведёт на него', async () => {
		const page = await serverPage(PanelIdPage)

		expect(shownPanels(page).map((panel) => panel.id)).toEqual(['general'])
		expect(all(page, '[role="tab"]')[0].getAttribute('aria-controls')).toBe('general')
		expect(all(page, '[id="general"]')).toHaveLength(1)
	})

	it('гидратация берёт узлы сервера, ссылка таба — на id панели, ошибок нет', async () => {
		const error = vi.spyOn(console, 'error')
		const warn = vi.spyOn(console, 'warn')

		loadPage(await renderOnServer(PanelIdPage))

		const tab = all(document, '[role="tab"]')[0]
		const app = await hydrate(PanelIdPage)

		await app.whenStable()

		expect(all(document, '[role="tab"]')[0]).toBe(tab)
		expect(tab.getAttribute('aria-controls')).toBe('general')
		expect(shownPanels(document).map((panel) => panel.id)).toEqual(['general'])
		expect(all(document, '[id="general"]')).toHaveLength(1)
		expect(error).not.toHaveBeenCalled()
		expect(warn).not.toHaveBeenCalled()
	})
})

/**
 * Panels with the `default` template: the server draws the template of the
 * active panel only, and hydration takes its nodes. The inactive panel has
 * created nothing, and the choice of its tab draws its template in the browser.
 */
describe('Tabs с шаблоном панели · сервер и гидратация', () => {
	afterEach(() => {
		vi.restoreAllMocks()
		leavePage()
	})

	@Component({
		selector: 'app-root',
		standalone: true,
		imports: [TTabsComponent, TTabsItemComponent, TTabsContentComponent, SlotDirective],
		template: `<div so-tabs>
			<div so-tabs-item value="a" text="A" active></div>
			<div so-tabs-item value="b" text="B"></div>
			<div so-tabs-content slot="content" value="a">
				<ng-template slot="default"><b class="so-test-content">Панель A</b></ng-template>
			</div>
			<div so-tabs-content slot="content" value="b">
				<ng-template slot="default"><b class="so-test-content">Панель B</b></ng-template>
			</div>
		</div>`,
	})
	class TemplatePage {}

	it('у сервера — шаблон активной панели, неактивная — скрытый элемент без содержимого', async () => {
		const page = await serverPage(TemplatePage)

		expect(shownPanels(page).map((panel) => panel.textContent)).toEqual(['Панель A'])
		expect(all(page, '.so-test-content').map((node) => node.textContent)).toEqual(['Панель A'])
	})

	it('гидратация берёт узлы шаблона, ошибок нет; выбор таба рисует шаблон его панели', async () => {
		const error = vi.spyOn(console, 'error')
		const warn = vi.spyOn(console, 'warn')

		loadPage(await renderOnServer(TemplatePage))

		const [content] = all(document, '.so-test-content')
		const app = await hydrate(TemplatePage)

		await app.whenStable()

		expect(all(document, '.so-test-content')).toEqual([content])
		expect(error).not.toHaveBeenCalled()
		expect(warn).not.toHaveBeenCalled()

		const tab = all(document, '[role="tab"]')[1]

		if (!(tab instanceof HTMLElement)) throw new Error('таба B нет')

		tab.click()
		await app.whenStable()

		expect(shownPanels(document).map((panel) => panel.textContent)).toEqual(['Панель B'])
		expect(all(document, '.so-test-content').map((node) => node.textContent)).toEqual([
			'Панель B',
		])
	})
})

describe('Accordion · серверный рендер', () => {
	@Component({
		selector: 'app-root',
		standalone: true,
		imports: [TAccordionComponent],
		template: `<div so-accordion [items]="items"></div>`,
	})
	class ItemsPage {
		readonly items = [
			{ value: 'a', text: 'A', _: { selected: true } },
			{ value: 'b', text: 'B' },
		]
	}

	@Component({
		selector: 'app-root',
		standalone: true,
		imports: [TAccordionComponent, TAccordionItemComponent],
		template: `<div so-accordion>
			<div so-accordion-item value="a" text="A" selected>Содержимое A</div>
			<div so-accordion-item value="b" text="B">Содержимое B</div>
		</div>`,
	})
	class MarkupPage {}

	it.each([
		['секции из items', ItemsPage],
		['секции из разметки', MarkupPage],
	] as const)('%s: aria-expanded и связка заголовка с панелью', async (_name, app) => {
		const page = await serverPage(app)
		const heads = all(page, '.so-accordion-item__header')
		const bodies = all(page, '.so-accordion-item__content')

		expect(attributeOf(heads, 'aria-expanded')).toEqual(['true', 'false'])
		expect(attributeOf(heads, 'aria-controls')).toEqual(bodies.map((node) => node.id))
		expect(attributeOf(bodies, 'aria-labelledby')).toEqual(heads.map((node) => node.id))
	})
})

describe('RadioGroup · серверный рендер', () => {
	@Component({
		selector: 'app-root',
		standalone: true,
		imports: [TRadioGroupComponent],
		template: `<div so-radio-group name="delivery" value="b" [items]="items"></div>`,
	})
	class ItemsPage {
		readonly items = [{ value: 'a' }, { value: 'b' }]
	}

	@Component({
		selector: 'app-root',
		standalone: true,
		imports: [TRadioGroupComponent, TRadioGroupItemComponent],
		template: `<div so-radio-group value="b">
			<label so-radio-group-item value="a">Первый</label>
			<label so-radio-group-item value="b">Второй</label>
			<label so-radio-group-item value="c">Третий</label>
		</div>`,
	})
	class MarkupPage {}

	it('радио из items — с общим name и отметкой', async () => {
		const page = await serverPage(ItemsPage)
		const fields = all(page, 'input[type="radio"]')

		expect(attributeOf(fields, 'name')).toEqual(['delivery', 'delivery'])
		expect(fields.map((field) => field.hasAttribute('checked'))).toEqual([false, true])
	})

	it('радио из разметки — с общим name и отметкой', async () => {
		const page = await serverPage(MarkupPage)
		const fields = all(page, 'input[type="radio"]')
		const names = new Set(attributeOf(fields, 'name'))

		expect(fields.map((field) => field.hasAttribute('checked'))).toEqual([false, true, false])
		expect(names.size).toBe(1)
		expect([...names][0]).toMatch(/\S/)
	})
})

/**
 * Пагинация: страницы окна кладёт в коллекцию её расширение при сборке, а
 * сборка идёт и на сервере, — сервер рисует окно с текущей страницей и
 * пропусками. Имена стрелок и цифры номеров пишут плагины имён и языка по
 * локали поддерева, тоже при сборке. Страница — внутренняя часть: её элемент
 * рисует шаблон пагинации, и гидратация находит его на месте.
 */
describe('Pagination · серверный рендер и гидратация', () => {
	@Component({
		selector: 'app-root',
		standalone: true,
		imports: [TPaginationComponent, LocaleProviderDirective],
		template: `<div so-locale-provider [locale]="locale">
			<nav so-pagination [total]="100" [value]="5" aria_label="Страницы"></nav>
		</div>`,
	})
	class PaginationPage {
		readonly locale = ruRU
	}

	@Component({
		selector: 'app-root',
		standalone: true,
		imports: [TPaginationComponent, LocaleProviderDirective],
		template: `<div so-locale-provider [locale]="locale">
			<nav so-pagination [total]="200000" [value]="12345"></nav>
		</div>`,
	})
	class DigitsPage {
		readonly locale = ruRU
	}

	afterEach(() => {
		vi.restoreAllMocks()
		leavePage()
	})

	/** Ряд строкой: пропуск — «…», текущая — в скобках. */
	const row = (page: ParentNode) =>
		all(page, '.so-pagination__list > li')
			.map((place) => {
				const text = place.textContent?.trim() ?? ''

				return place.querySelector('[aria-current="page"]') ? `[${text}]` : text
			})
			.join(' ')

	/** Кнопка страницы по её тексту. */
	const page = (scope: ParentNode, text: string) =>
		all(scope, '.so-pagination-item > button').find(
			(button) => button.textContent?.trim() === text,
		)

	it('окно, текущая и имена — уже в разметке сервера', async () => {
		const server = await serverPage(PaginationPage)

		expect(row(server)).toBe('1 … 4 [5] 6 … 10')
		expect(attributeOf(all(server, 'nav'), 'aria-label')).toEqual(['Страницы'])
		expect(attributeOf(all(server, '.so-pagination__prev'), 'aria-label')).toEqual([
			'Предыдущая страница',
		])
		expect(attributeOf(all(server, '.so-pagination__next'), 'aria-label')).toEqual([
			'Следующая страница',
		])
		// Текущая — у кнопки и у места: обе отметки сервер рисует сразу
		expect(attributeOf(all(server, '.so-pagination-item'), 'data-selected')).toEqual([
			'false',
			'false',
			'true',
			'false',
			'false',
		])
	})

	it('цифры номеров — по локали поддерева', async () => {
		const ru = new Intl.NumberFormat('ru-RU')
		const server = await serverPage(DigitsPage)

		expect(row(server)).toBe(
			[
				'1',
				'…',
				ru.format(12_344),
				`[${ru.format(12_345)}]`,
				ru.format(12_346),
				'…',
				ru.format(20_000),
			].join(' '),
		)
	})

	it('гидратация берёт страницы сервера, ошибок нет; нажатие доходит до разметки', async () => {
		const error = vi.spyOn(console, 'error')
		const warn = vi.spyOn(console, 'warn')

		loadPage(await renderOnServer(PaginationPage))

		const six = page(document, '6')
		const app = await hydrate(PaginationPage)

		await app.whenStable()

		expect(six).toBeInstanceOf(HTMLElement)
		expect(page(document, '6')).toBe(six)
		expect(error).not.toHaveBeenCalled()
		expect(warn).not.toHaveBeenCalled()

		if (six instanceof HTMLElement) six.click()
		await app.whenStable()

		expect(row(document)).toBe('1 … 5 [6] 7 … 10')
	})
})

/** Страница: табы и панели, секции, радио и список — всё разметкой. */
@Component({
	selector: 'app-root',
	standalone: true,
	imports: [
		TTabsComponent,
		TTabsItemComponent,
		TTabsContentComponent,
		TAccordionComponent,
		TAccordionItemComponent,
		TRadioGroupComponent,
		TRadioGroupItemComponent,
		TListBoxComponent,
		TListBoxItemComponent,
	],
	template: `<div so-tabs>
			<div so-tabs-item value="a" text="A" active></div>
			<div so-tabs-item value="b" text="B"></div>
			<div so-tabs-content slot="content" value="a">Панель A</div>
			<div so-tabs-content slot="content" value="b">Панель B</div>
		</div>
		<div so-accordion>
			<div so-accordion-item value="a" text="A">Содержимое A</div>
			<div so-accordion-item value="b" text="B">Содержимое B</div>
		</div>
		<div so-radio-group>
			<label so-radio-group-item value="a">Первый</label>
			<label so-radio-group-item value="b">Второй</label>
		</div>
		<div so-list-box>
			<div so-list-box-item value="a" text="Альфа"></div>
			<div so-list-box-item value="b" text="Бета"></div>
		</div>`,
})
class CollectionsPage {}

/** `id` и `name` страницы: табов, панелей табов, заголовков и панелей секций, радио. */
function idsOf(page: ParentNode) {
	return {
		tabs: attributeOf(all(page, '[role="tab"]'), 'id'),
		panels: attributeOf(all(page, '[role="tabpanel"]'), 'id'),
		heads: attributeOf(all(page, '.so-accordion-item__header'), 'id'),
		bodies: attributeOf(all(page, '.so-accordion-item__content'), 'id'),
		names: attributeOf(all(page, 'input[type="radio"]'), 'name'),
	}
}

describe('id и name — от номера сборки', () => {
	it('два параллельных рендера одной страницы дают одни и те же id и name', async () => {
		const [first, second] = await Promise.all([
			renderOnServer(CollectionsPage),
			renderOnServer(CollectionsPage),
		])
		const parse = (markup: string) => new DOMParser().parseFromString(markup, 'text/html')

		expect(idsOf(parse(first))).toEqual(idsOf(parse(second)))
	})

	it('id у частей свои, name у радио группы — один', async () => {
		const ids = idsOf(await serverPage(CollectionsPage))

		expect(new Set([...ids.tabs, ...ids.panels, ...ids.heads, ...ids.bodies]).size).toBe(8)
		expect(new Set(ids.names).size).toBe(1)
	})

	/** Счётчик набора даёт `so-<n>`: им набор берёт, когда адаптер id монтирования не передал. */
	it('ни один id и name не от счётчика набора', async () => {
		const ids = idsOf(await serverPage(CollectionsPage))

		for (const id of [...ids.tabs, ...ids.panels, ...ids.heads, ...ids.bodies, ...ids.names]) {
			expect(id).toMatch(/^ng-\d+-/)
		}
	})
})

describe('гидратация', () => {
	afterEach(() => {
		vi.restoreAllMocks()
		leavePage()
	})

	/** Разметка сервера в документе и гидратация над ней. */
	async function hydrated(): Promise<ApplicationRef> {
		loadPage(await renderOnServer(CollectionsPage))

		const app = await hydrate(CollectionsPage)

		await app.whenStable()

		return app
	}

	/** Узел документа по селектору и тексту. */
	function nodeOf(selector: string, text: string): HTMLElement {
		const node = all(document, selector).find(
			(candidate) => candidate.textContent?.trim() === text,
		)

		if (!(node instanceof HTMLElement)) throw new Error(`${selector} «${text}» нет`)

		return node
	}

	it('узлы сервера переиспользуются, id и name у браузера те же, ошибок нет', async () => {
		const error = vi.spyOn(console, 'error')
		const warn = vi.spyOn(console, 'warn')

		loadPage(await renderOnServer(CollectionsPage))

		const server = idsOf(document)
		const tab = nodeOf('[role="tab"]', 'B')
		const radio = all(document, 'input[type="radio"]')[0]
		const app = await hydrate(CollectionsPage)

		await app.whenStable()

		expect(nodeOf('[role="tab"]', 'B')).toBe(tab)
		expect(all(document, 'input[type="radio"]')[0]).toBe(radio)
		expect(idsOf(document)).toEqual(server)
		expect(error).not.toHaveBeenCalled()
		expect(warn).not.toHaveBeenCalled()
	})

	it('после гидратации выбор доходит до разметки', async () => {
		const app = await hydrated()

		nodeOf('[role="tab"]', 'B').click()
		nodeOf('.so-accordion-item__header', 'B').click()
		all(document, 'input[type="radio"]')
			.filter((field): field is HTMLInputElement => field instanceof HTMLInputElement)
			.find((field) => field.value === 'b')
			?.click()
		nodeOf('.so-list-box-item .so-button', 'Бета').click()
		await app.whenStable()

		expect(shownPanels(document).map((panel) => panel.textContent)).toEqual(['Панель B'])
		expect(attributeOf(all(document, '.so-accordion-item__header'), 'aria-expanded')).toEqual([
			'false',
			'true',
		])
		expect(
			all(document, 'input[type="radio"]')
				.filter((field): field is HTMLInputElement => field instanceof HTMLInputElement)
				.map((field) => field.checked),
		).toEqual([false, true])
		expect(attributeOf(all(document, '.so-list-box-item .so-button'), 'aria-selected')).toEqual(
			['false', 'true'],
		)
	})
})

const NAME: TTableColumnSource = { field: 'name', text: 'Имя', rowHeader: true }
const AGE: TTableColumnSource = { field: 'age', text: 'Возраст', align: 'end', sortable: true }

/**
 * Таблица из данных с колонкой выбора, сортируемой колонкой и ручкой ширины;
 * имя и метка — атрибутами разметки, их база переносит на `table`.
 */
@Component({
	selector: 'app-root',
	standalone: true,
	imports: [TTableComponent],
	template: `<div
		so-table
		[items]="items"
		[columns]="columns"
		mode="multiple"
		aria-label="Сотрудники"
		data-probe="1"
	></div>`,
})
class TablePage {
	readonly items = [
		{ data: { id: 1, name: 'Анна', age: 30 } },
		{ data: { id: 2, name: 'Борис', age: 41 } },
	]
	readonly columns = [NAME, { ...AGE, resizable: true, width: 120 }]
}

/** Связки таблицы: `id` заголовков строк и подписей колонок и ссылки на них. */
function tableIdsOf(page: ParentNode) {
	return {
		rowHeaders: attributeOf(all(page, 'th[scope="row"]'), 'id'),
		captions: attributeOf(all(page, '.so-table-column__text'), 'id'),
		checkBoxes: attributeOf(all(page, '.so-table-row__select input'), 'aria-labelledby'),
		headers: attributeOf(all(page, '.so-table-column'), 'aria-labelledby'),
		resizers: attributeOf(all(page, '.so-table-column__resizer input'), 'aria-labelledby'),
		sorts: attributeOf(all(page, '.so-table-column__sort'), 'aria-label'),
	}
}

describe('Table · серверный рендер', () => {
	/**
	 * Строки из данных — в коллекции с самой сборки: сервер рисует их со
	 * ссылками чекбоксов на заголовки строк. Имя кнопки сортировки плагин имён
	 * пишет при сборке — оно уже в разметке сервера.
	 */
	it('таблица из данных — со строками, связками и именем кнопки сортировки', async () => {
		const page = await serverPage(TablePage)
		const ids = tableIdsOf(page)

		expect(page.querySelector('[so-table].so-table__viewport > table.so-table')).not.toBe(null)
		expect(all(page, '.so-table-row').map((row) => row.textContent?.trim())).toEqual([
			'Анна30',
			'Борис41',
		])
		expect(ids.rowHeaders).toHaveLength(2)
		expect(ids.captions).toHaveLength(2)
		expect([...ids.rowHeaders, ...ids.captions].every((id) => id?.startsWith('ng-'))).toBe(true)
		expect(ids.checkBoxes).toEqual(ids.rowHeaders)
		expect(ids.headers).toEqual(ids.captions)
		expect(ids.resizers).toEqual([ids.captions[1]])
		expect(ids.sorts).toEqual(['Sort by Возраст'])
	})

	it('поле ручки — с ходом и шириной колонки', async () => {
		const page = await serverPage(TablePage)
		const field = page.querySelector('.so-table-column__resizer input')

		expect(field?.getAttribute('type')).toBe('range')
		expect(field?.getAttribute('value')).toBe('120')
	})

	/** Атрибуты разметки база переносит на `table` и на сервере: там роль и имя таблицы. */
	it('атрибуты потребителя — на table, а не на окне', async () => {
		const page = await serverPage(TablePage)
		const viewport = page.querySelector('[so-table]')
		const table = page.querySelector('[so-table] > table.so-table')

		expect(table?.getAttribute('aria-label')).toBe('Сотрудники')
		expect(table?.getAttribute('data-probe')).toBe('1')
		expect(viewport?.hasAttribute('aria-label')).toBe(false)
		expect(viewport?.hasAttribute('data-probe')).toBe(false)
	})
})

describe('Table · гидратация', () => {
	afterEach(() => {
		vi.restoreAllMocks()
		leavePage()
	})

	it('узлы сервера переиспользуются, id и ссылки у браузера те же, ошибок нет', async () => {
		const error = vi.spyOn(console, 'error')
		const warn = vi.spyOn(console, 'warn')

		loadPage(await renderOnServer(TablePage))

		const server = tableIdsOf(document)
		const table = document.querySelector('table.so-table')
		const row = document.querySelector('.so-table-row')
		const app = await hydrate(TablePage)

		await app.whenStable()

		expect(document.querySelector('table.so-table')).toBe(table)
		expect(document.querySelector('.so-table-row')).toBe(row)
		expect(tableIdsOf(document)).toEqual(server)
		expect(error).not.toHaveBeenCalled()
		expect(warn).not.toHaveBeenCalled()
	})

	/**
	 * Статические атрибуты Angular ставит на узел сервера заново, а база
	 * переносит их на `table` из разметки сервера: на окне их нет и после
	 * гидратации.
	 */
	it('атрибуты потребителя — на table, а не на окне', async () => {
		loadPage(await renderOnServer(TablePage))

		const app = await hydrate(TablePage)

		await app.whenStable()

		const viewport = document.querySelector('[so-table]')
		const table = document.querySelector('[so-table] > table.so-table')

		expect(table?.getAttribute('aria-label')).toBe('Сотрудники')
		expect(table?.getAttribute('data-probe')).toBe('1')
		expect(viewport?.hasAttribute('aria-label')).toBe(false)
		expect(viewport?.hasAttribute('data-probe')).toBe(false)
	})

	/**
	 * Клик по чекбоксу слушает его плагин, а узел плагины получают кадром после
	 * отрисовки (`TElementPlugin`) — и после гидратации тоже.
	 */
	it('после гидратации выбор строки доходит до разметки', async () => {
		loadPage(await renderOnServer(TablePage))

		const app = await hydrate(TablePage)

		await app.whenStable()
		await new Promise((resolve) => requestAnimationFrame(resolve))

		const [anna] = all(document, '.so-table-row')
		const input = anna?.querySelector('.so-table-row__select input')

		if (!(input instanceof HTMLInputElement)) throw new Error('чекбокса строки нет')

		input.click()
		await app.whenStable()

		expect(attributeOf(all(document, '.so-table-row'), 'data-selected')).toEqual([
			'true',
			'false',
		])
		expect(input.checked).toBe(true)
	})
})

/**
 * Компоненты прямо в корне приложения — метками селекторов на элементах
 * (`div[so-list-box]`). Своего узла у директивы на `<ng-container>` нет: на
 * его месте сервер печатает комментарий, и коллекции в ней — прямо в корне.
 */
function rootChildren(page: ParentNode): string[] {
	const root = page.querySelector('app-root')

	if (!root) throw new Error('корня приложения нет')

	return [...root.children].map((child) => {
		const marker = child.getAttributeNames().find((name) => name.startsWith('so-'))

		return `${child.localName}[${marker}]`
	})
}

/** Список из восьмидесяти элементов в окне. */
@Component({
	selector: 'app-root',
	standalone: true,
	imports: [TListBoxComponent, TVirtualComponent],
	template: `<ng-container so-virtual><div so-list-box [items]="items"></div></ng-container>`,
})
class VirtualPage {
	readonly items = Array.from({ length: 80 }, (_, index) => ({
		value: `v${index + 1}`,
		text: `Пункт ${index + 1}`,
	}))
}

describe('Virtual · серверный рендер и гидратация', () => {
	afterEach(() => {
		vi.restoreAllMocks()
		leavePage()
	})

	/**
	 * Окно коллекция подхватывает при сборке, а сборка идёт и на сервере:
	 * сервер отдаёт уже окно, первые 50 элементов, без распорок — замера на
	 * сервере нет. Своего узла у окна нет и в разметке сервера: список — прямо
	 * в корне приложения.
	 */
	it('сервер отдаёт окно — первые 50 элементов, без распорок и без узла окна', async () => {
		const page = await serverPage(VirtualPage)

		expect(all(page, '.so-list-box-item')).toHaveLength(50)
		expect(all(page, '.so-list-box__filler')).toEqual([])
		expect(attributeOf(all(page, '.so-list-box-item .so-button'), 'aria-posinset').at(-1)).toBe(
			'50',
		)
		expect(rootChildren(page)).toEqual(['div[so-list-box]'])
	})

	it('гидратация сходится: то же окно на тех же узлах, ошибок нет', async () => {
		const error = vi.spyOn(console, 'error')
		const warn = vi.spyOn(console, 'warn')

		loadPage(await renderOnServer(VirtualPage))

		const first = document.querySelector('.so-list-box-item')
		const app = await hydrate(VirtualPage)

		await app.whenStable()

		expect(all(document, '.so-list-box-item')).toHaveLength(50)
		expect(document.querySelector('.so-list-box-item')).toBe(first)
		expect(
			attributeOf(all(document, '.so-list-box-item .so-button'), 'aria-setsize').at(-1),
		).toBe('80')
		expect(rootChildren(document)).toEqual(['div[so-list-box]'])
		expect(error).not.toHaveBeenCalled()
		expect(warn).not.toHaveBeenCalled()
	})
})

/** Табы и секции разметкой и список из данных — в обёртке перестановки. */
@Component({
	selector: 'app-root',
	standalone: true,
	imports: [
		TDragAndDropComponent,
		TTabsComponent,
		TTabsItemComponent,
		TListBoxComponent,
		TAccordionComponent,
		TAccordionItemComponent,
	],
	template: `<ng-container so-drag-and-drop>
		<div so-tabs>
			<div so-tabs-item value="a" text="A" active></div>
			<div so-tabs-item value="b" text="B"></div>
		</div>
		<div so-list-box [items]="items"></div>
		<div so-accordion>
			<div so-accordion-item value="a" text="A">Содержимое A</div>
			<div so-accordion-item value="b" text="B">Содержимое B</div>
		</div>
	</ng-container>`,
})
class DragAndDropPage {
	readonly items = [
		{ value: 'a', text: 'A' },
		{ value: 'b', text: 'B' },
	]
}

/** Элементы трёх коллекций страницы — по порядку: табы, список, секции. */
const ITEM_SELECTORS = ['.so-tabs-item', '.so-list-box-item', '.so-accordion-item']

/** Коллекции страницы перестановки — прямо в корне: своего узла у обёртки нет. */
const DRAG_AND_DROP_CHILDREN = ['div[so-tabs]', 'div[so-list-box]', 'div[so-accordion]']

describe('DragAndDrop · серверный рендер и гидратация', () => {
	afterEach(() => {
		vi.restoreAllMocks()
		leavePage()
	})

	/**
	 * Обёртку коллекции подхватывают при сборке, а она идёт и на сервере, но
	 * `draggable` ставит плагин перетаскивания на узлы элементов, а узлов
	 * плагинам на сервере нет. Своего узла у обёртки нет и в разметке сервера.
	 */
	it('сервер — элементы коллекций без draggable, коллекции — прямо в корне', async () => {
		const page = await serverPage(DragAndDropPage)

		expect(ITEM_SELECTORS.map((selector) => all(page, selector).length)).toEqual([2, 2, 2])
		expect(all(page, '[draggable]')).toEqual([])
		expect(rootChildren(page)).toEqual(DRAG_AND_DROP_CHILDREN)
	})

	/**
	 * Гидратация берёт узлы сервера, а узлы элементов плагин получает после
	 * отрисовки и объявляет кадром позже: тогда на них и встаёт `draggable`.
	 */
	it('после гидратации — те же узлы, перетаскиваемые, ошибок нет', async () => {
		const error = vi.spyOn(console, 'error')
		const warn = vi.spyOn(console, 'warn')

		loadPage(await renderOnServer(DragAndDropPage))

		const first = document.querySelector('.so-list-box-item')
		const app = await hydrate(DragAndDropPage)

		await app.whenStable()
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

		expect(document.querySelector('.so-list-box-item')).toBe(first)
		expect(
			ITEM_SELECTORS.map((selector) => attributeOf(all(document, selector), 'draggable')),
		).toEqual(ITEM_SELECTORS.map(() => ['true', 'true']))
		expect(rootChildren(document)).toEqual(DRAG_AND_DROP_CHILDREN)
		expect(error).not.toHaveBeenCalled()
		expect(warn).not.toHaveBeenCalled()
	})
})

/**
 * Меню разметкой и меню из данных — триггер в шаблоне слота, связку с панелью
 * он кладёт на себя директивой набора. Движки — снаружи: по ним видно, что
 * пункты в коллекции.
 */
@Component({
	selector: 'app-root',
	standalone: true,
	imports: [
		TMenuComponent,
		TMenuItemComponent,
		TButtonComponent,
		SlotDirective,
		AttributesDirective,
	],
	template: `<section class="place">
		<span so-menu class="markup" [engine]="markup">
			<ng-template
				slot="trigger"
				let-triggerAria="triggerAria"
				let-triggerDataset="triggerDataset"
			>
				<button
					so-button
					text="Разметка"
					class="markup-trigger"
					[so-attributes]="{ ...triggerAria, ...triggerDataset }"
				></button>
			</ng-template>
			<div so-menu-item value="edit" text="Изменить"></div>
			<div so-menu-item value="remove" text="Удалить"></div>
		</span>
		<span so-menu class="data" [engine]="data" [items]="items">
			<ng-template
				slot="trigger"
				let-triggerAria="triggerAria"
				let-triggerDataset="triggerDataset"
			>
				<button
					so-button
					text="Данные"
					class="data-trigger"
					[so-attributes]="{ ...triggerAria, ...triggerDataset }"
				></button>
			</ng-template>
		</span>
	</section>`,
})
class MenusPage {
	readonly markup = createEngineMenu()
	readonly data = createEngineMenu()
	readonly items = [
		{ value: 'a', text: 'Первый' },
		{ value: 'b', text: 'Второй' },
	]
}

/** Меню страницы: корень, его триггер и тексты строк пунктов в панели. */
const MENUS = [
	['.markup', '.markup-trigger', ['Изменить', 'Удалить']],
	['.data', '.data-trigger', ['Первый', 'Второй']],
] as const

/** Панель, на которую ведёт ссылка триггера (`aria-controls`). */
function menuPanel(page: Document, trigger: Element): HTMLElement {
	const panel = page.getElementById(trigger.getAttribute('aria-controls') ?? '')

	if (!(panel instanceof HTMLElement)) throw new Error('aria-controls не ведёт на панель')

	return panel
}

/** Триггер меню по селектору; нет его — тест падает здесь. */
function menuTrigger(page: ParentNode, selector: string): HTMLButtonElement {
	const trigger = page.querySelector(selector)

	if (!(trigger instanceof HTMLButtonElement)) throw new Error(`${selector}: триггера нет`)

	return trigger
}

/**
 * Пункты входят в коллекцию в своём `ngOnInit`, и на сервере тоже, а панель —
 * слой, и слой есть только в браузере, как у Frame: на сервере от панели
 * остаётся элемент Frame в корне — пустой и скрытый, без пунктов. Связка у него
 * от меню — роль и `id`, — и ссылка триггера ведёт на него уже в разметке
 * сервера.
 */
describe('Menu · серверный рендер', () => {
	it.each(MENUS)(
		'%s — корень с триггером и связкой, панель в корне пустая и скрытая',
		async (rootSelector, triggerSelector) => {
			const page = await serverPage(MenusPage)
			const root = page.querySelector(rootSelector)
			const trigger = menuTrigger(page, triggerSelector)
			const panel = menuPanel(page, trigger)

			expect(root?.classList).toContain('so-menu')
			expect(root?.contains(trigger)).toBe(true)
			expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
			expect(trigger.getAttribute('aria-expanded')).toBe('false')
			expect(panel.parentElement).toBe(root)
			expect(panel.getAttribute('role')).toBe('menu')
			expect(panel.getAttribute('aria-labelledby')).toBe(trigger.id)
			expect(panel.style.display).toBe('none')
			expect(panel.children).toHaveLength(0)
			expect(panel.textContent).toBe('')
		},
	)
})

/**
 * После гидратации триггер — узел сервера, а панель — элемент Frame, который
 * напечатал сервер: он уезжает в `body` и получает пункты — разметки и из
 * данных, в коллекции меню, — а стрелки ходят по ним. Номера сборки у сервера
 * и браузера одни, поэтому и `id` связки — те же.
 */
describe('Menu · гидратация', () => {
	afterEach(() => {
		vi.restoreAllMocks()
		leavePage()
	})

	it('тот же триггер и та же панель — в body, пункты в коллекции — с первого открытия; id сходятся, ошибок нет', async () => {
		const error = vi.spyOn(console, 'error')
		const warn = vi.spyOn(console, 'warn')

		loadPage(await renderOnServer(MenusPage))

		const triggers = MENUS.map(([, selector]) => menuTrigger(document, selector))
		const links = triggers.map((trigger) => trigger.getAttribute('aria-controls'))
		const panels = triggers.map((trigger) => menuPanel(document, trigger))
		const app = await hydrate(MenusPage)

		await app.whenStable()
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

		const page = app.components[0].instance

		if (!(page instanceof MenusPage)) throw new Error('страницы меню нет')

		expect(MENUS.map(([, selector]) => menuTrigger(document, selector))).toEqual(triggers)
		expect(triggers.map((trigger) => trigger.getAttribute('aria-controls'))).toEqual(links)
		expect(triggers.map((trigger) => menuPanel(document, trigger))).toEqual(panels)
		expect(panels.map((panel) => panel.parentElement)).toEqual([document.body, document.body])
		// Items are mounted from the panel's first opening on (`contentRendered`)
		expect(panels.map((panel) => all(panel, '[role="menuitem"]'))).toEqual([[], []])

		for (const trigger of triggers) {
			trigger.click()
			await app.whenStable()
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
			trigger.click()
			await app.whenStable()
		}

		expect(
			panels.map((panel) =>
				all(panel, '[role="menuitem"]').map((row) => row.textContent?.trim()),
			),
		).toEqual(MENUS.map(([, , texts]) => texts))
		expect(
			[page.markup, page.data].map((engine) =>
				engine.extensions.batch.items.map((item) => item.value),
			),
		).toEqual([
			['edit', 'remove'],
			['a', 'b'],
		])
		expect(error).not.toHaveBeenCalled()
		expect(warn).not.toHaveBeenCalled()
	})

	it('↓ на триггере открывает меню на первом пункте', async () => {
		loadPage(await renderOnServer(MenusPage))

		const app = await hydrate(MenusPage)

		await app.whenStable()
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

		for (const [, selector, texts] of MENUS) {
			const trigger = menuTrigger(document, selector)

			trigger.focus()
			trigger.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
			)
			await app.whenStable()
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

			const panel = menuPanel(document, trigger)
			const [first] = all(panel, '[role="menuitem"]')

			expect(panel.style.display).toBe('')
			expect(first?.textContent?.trim()).toBe(texts[0])
			expect(document.activeElement).toBe(first)

			first?.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
			)
			await app.whenStable()
		}
	})
})

/**
 * Календарь на двух сетках, выбран день второй: фокус коллекции — на нём.
 */
@Component({
	selector: 'app-root',
	standalone: true,
	imports: [TCalendarComponent],
	template: `<section class="place">
		<div so-calendar [months]="months" value="2026-10-14"></div>
	</section>`,
})
class CalendarPage {
	readonly months = ['2026-09-01', '2026-10-01']
}

/** Полная дата — имя дня, как его прочтёт скринридер. */
const FULL_DATE = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeZone: 'UTC' })

/** Имена дней месяца `month` (1–12) 2026 года — полные даты. */
const dayNamesOf = (month: number) =>
	Array.from({ length: new Date(Date.UTC(2026, month, 0)).getUTCDate() }, (_, index) =>
		FULL_DATE.format(Date.UTC(2026, month - 1, index + 1)),
	)

/** Панель выбора месяца и года, на которую ведёт заголовок (`aria-controls`). */
function pickerPanel(page: Document, title: Element): HTMLElement {
	const panel = page.getElementById(title.getAttribute('aria-controls') ?? '')

	if (!(panel instanceof HTMLElement)) throw new Error('aria-controls не ведёт на панель')

	return panel
}

/**
 * Календарь на сервере: дни кладёт в коллекцию вид по месяцам сеток при
 * сборке, а она идёт и на сервере, — сервер рисует сетки целиком, со всем, что
 * пишут дням расширения коллекции: имя — полная дата, одна остановка Tab на
 * все сетки. Имена сеток — `id` заголовков и ссылки таблиц на них — пишет
 * плагин связок от id монтирования. Панель выбора месяца и года — поповер с
 * `contained`, а слой есть только в браузере: на сервере от неё — пустой
 * скрытый элемент Frame на месте, в корне поповера.
 */
describe('Calendar · серверный рендер', () => {
	it('сетки названы заголовками: id заголовков и aria-labelledby таблиц на них', async () => {
		const page = await serverPage(CalendarPage)
		const titles = all(page, '.so-calendar__title-text')
		const ids = attributeOf(titles, 'id')

		expect(titles.map((title) => title.textContent)).toEqual(['September 2026', 'October 2026'])
		expect(new Set(ids).size).toBe(2)
		expect(ids).toEqual([expect.stringMatching(/\S/), expect.stringMatching(/\S/)])
		expect(attributeOf(titles, 'aria-live')).toEqual(['polite', 'polite'])
		expect(attributeOf(all(page, '[role="grid"]'), 'aria-labelledby')).toEqual(ids)
	})

	it('дни — с полными именами и одной остановкой Tab на все сетки, заполнители — под aria-hidden', async () => {
		const page = await serverPage(CalendarPage)
		const days = all(page, '.so-calendar-item')
		const fillers = all(page, '.so-calendar__filler')

		expect(days.every((day) => day.localName === 'td')).toBe(true)
		expect(attributeOf(days, 'aria-label')).toEqual([...dayNamesOf(9), ...dayNamesOf(10)])
		// Остановка — у дня с фокусом коллекции: он на выбранной дате
		expect(attributeOf(all(page, '[tabindex="0"]'), 'aria-label')).toEqual([
			FULL_DATE.format(Date.UTC(2026, 9, 14)),
		])
		expect(new Set(attributeOf(days, 'tabindex'))).toEqual(new Set(['0', '-1']))
		// Неделя en-US — с воскресенья: у сентября 2026 заполнители — 2 дня
		// августа и 3 октября, у октября — 4 дня сентября, ноябрьских нет
		expect(attributeOf(fillers, 'aria-hidden')).toEqual(Array.from({ length: 9 }, () => 'true'))
		expect(fillers.filter((cell) => cell.hasAttribute('aria-label'))).toEqual([])
	})

	it('панель выбора места — на месте, в корне поповера заголовка: скрыта и пустая', async () => {
		const page = await serverPage(CalendarPage)
		const titles = all(page, '.so-calendar__title')
		const panels = titles.map((title) => pickerPanel(page, title))

		expect(panels).toHaveLength(2)
		expect(
			panels.map((panel) => panel.parentElement?.classList.contains('so-calendar__heading')),
		).toEqual([true, true])
		expect(panels.map((panel) => panel.style.display)).toEqual(['none', 'none'])
		expect(panels.map((panel) => panel.children.length)).toEqual([0, 0])
		expect(attributeOf(titles, 'aria-expanded')).toEqual(['false', 'false'])
		expect(all(page, '.so-calendar__picker')).toEqual([])
		expect(all(page, '.so-list-box')).toEqual([])
	})
})

/**
 * После гидратации заголовки, дни и элементы Frame панелей выбора — узлы,
 * которые напечатал сервер, а `id` связок — те же: номера сборки у сервера и
 * браузера одни. Панель выбора остаётся на месте (`contained`) и открывается
 * заголовком.
 */
describe('Calendar · гидратация', () => {
	afterEach(() => {
		vi.restoreAllMocks()
		leavePage()
	})

	it('узлы сервера переиспользуются, id связок у браузера те же, ошибок нет', async () => {
		const error = vi.spyOn(console, 'error')
		const warn = vi.spyOn(console, 'warn')

		loadPage(await renderOnServer(CalendarPage))

		const titles = all(document, '.so-calendar__title')
		const texts = all(document, '.so-calendar__title-text')
		const days = all(document, '.so-calendar-item')
		const ids = attributeOf(texts, 'id')
		const links = attributeOf(titles, 'aria-controls')
		const panels = titles.map((title) => pickerPanel(document, title))
		const app = await hydrate(CalendarPage)

		await app.whenStable()
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

		expect(all(document, '.so-calendar__title')).toEqual(titles)
		expect(all(document, '.so-calendar__title-text')).toEqual(texts)
		expect(all(document, '.so-calendar-item')).toEqual(days)
		expect(attributeOf(all(document, '.so-calendar__title-text'), 'id')).toEqual(ids)
		expect(attributeOf(all(document, '.so-calendar__title'), 'aria-controls')).toEqual(links)
		expect(titles.map((title) => pickerPanel(document, title))).toEqual(panels)
		expect(
			panels.map((panel) => panel.parentElement?.classList.contains('so-calendar__heading')),
		).toEqual([true, true])
		expect(error).not.toHaveBeenCalled()
		expect(warn).not.toHaveBeenCalled()
	})

	it('после гидратации заголовок открывает панель выбора на месте, с месяцами', async () => {
		loadPage(await renderOnServer(CalendarPage))

		const app = await hydrate(CalendarPage)

		await app.whenStable()
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

		const [title] = all(document, '.so-calendar__title')

		if (!(title instanceof HTMLElement)) throw new Error('заголовка нет')

		title.click()
		await app.whenStable()
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

		const panel = pickerPanel(document, title)

		expect(title.getAttribute('aria-expanded')).toBe('true')
		expect(panel.style.display).toBe('')
		expect(panel.getAttribute('data-contained')).toBe('true')
		expect(all(panel, '.so-calendar__picker-list .so-list-box-item')).toHaveLength(12)
	})
})

/**
 * Select — коллекция в слое, как меню: опции разметки и из данных входят в
 * его коллекцию в своём `ngOnInit`, и на сервере тоже, а панель — Frame, и
 * слой есть только в браузере. Поэтому сервер отдаёт поле с текстом
 * выбранного — и у опций разметкой, — в `multiple` — теги в поле, а от панели —
 * пустой скрытый элемент Frame в корне. Поле — `<div so-input>`, а оно само
 * хост: набор комбобокса и связка — на его `<input>` уже в разметке сервера.
 */
@Component({
	selector: 'app-root',
	standalone: true,
	imports: [TSelectComponent, TSelectItemComponent],
	template: `<section class="place">
		<div so-select class="single" name="Город" [items]="items" value="b"></div>
		<div so-select class="multiple" mode="multiple" [items]="items" [value]="chosen"></div>
		<div so-select class="markup" value="tver" [engine]="markup">
			<div so-select-item value="msk" text="Москва"></div>
			<div so-select-item value="tver" text="Тверь"></div>
		</div>
	</section>`,
})
class SelectsPage {
	readonly items = ITEMS
	readonly chosen = ['a', 'c']
	readonly markup = createEngineSelect()
}

/** Поле Select по селектору корня; нет его — тест падает здесь. */
function selectField(page: ParentNode, root: string): HTMLInputElement {
	const field = page.querySelector(`${root} .so-select__field input`)

	if (!(field instanceof HTMLInputElement)) throw new Error(`${root}: поля нет`)

	return field
}

/** Тексты тегов в поле Select. */
const tagTexts = (page: ParentNode, root: string) =>
	all(page, `${root} .so-select__tags .so-tags-item`).map((tag) => tag.textContent?.trim())

describe('Select · серверный рендер', () => {
	it('из items — поле с текстом выбранного и связкой комбобокса, панель в корне пустая и скрытая', async () => {
		const page = await serverPage(SelectsPage)
		const root = page.querySelector('.single')
		const field = selectField(page, '.single')
		const panels = all(page, '.single .so-select__panel')

		expect(field.getAttribute('value')).toBe('Второй')
		expect(field.getAttribute('role')).toBe('combobox')
		expect(field.getAttribute('aria-expanded')).toBe('false')
		expect(field.getAttribute('aria-controls')).toBeNull()
		expect(panels).toHaveLength(1)
		expect(panels[0]?.parentElement).toBe(root)
		expect(panels[0] instanceof HTMLElement && panels[0].style.display).toBe('none')
		expect(panels[0]?.children).toHaveLength(0)
		expect(all(page, '[role="option"]')).toEqual([])
	})

	it('multiple — выбранное тегами в поле, текст поля пуст', async () => {
		const page = await serverPage(SelectsPage)

		expect(all(page, '.multiple .so-select__tags')).toHaveLength(1)
		expect(tagTexts(page, '.multiple')).toEqual(['Первый', 'Третий'])
		expect(selectField(page, '.multiple').getAttribute('value') ?? '').toBe('')
	})

	/** Опции разметки входят в коллекцию на сервере: текст выбранного — уже в поле. */
	it('опции разметкой — в коллекции и на сервере: поле с текстом выбранного', async () => {
		const page = await serverPage(SelectsPage)

		expect(selectField(page, '.markup').getAttribute('value')).toBe('Тверь')
	})
})

/**
 * После гидратации поле и теги — узлы сервера, а панель — элемент Frame,
 * который напечатал сервер: он уезжает в `body` и получает опции, в коллекции
 * Select. Номера сборки у сервера и браузера одни, поэтому и связка поля — та
 * же.
 */
describe('Select · гидратация', () => {
	afterEach(() => {
		vi.restoreAllMocks()
		leavePage()
	})

	async function hydrated(): Promise<{ app: ApplicationRef; page: SelectsPage }> {
		const app = await hydrate(SelectsPage)

		await app.whenStable()
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

		const page: unknown = app.components[0]?.instance

		if (!(page instanceof SelectsPage)) throw new Error('страницы Select нет')

		return { app, page }
	}

	it('то же поле и те же теги; панель в body, опции в коллекции; связка та же, ошибок нет', async () => {
		const error = vi.spyOn(console, 'error')
		const warn = vi.spyOn(console, 'warn')

		loadPage(await renderOnServer(SelectsPage))

		const fields = ['.single', '.multiple', '.markup'].map((root) =>
			selectField(document, root),
		)
		expect(fields.every((field) => !field.hasAttribute('aria-controls'))).toBe(true)
		const tags = all(document, '.multiple .so-select__tags .so-tags-item')
		const { page } = await hydrated()

		expect(
			['.single', '.multiple', '.markup'].map((root) => selectField(document, root)),
		).toEqual(fields)
		const links = fields.map((field) => field.getAttribute('aria-controls'))
		expect(new Set(links).size).toBe(3)
		expect(links.every(Boolean)).toBe(true)
		expect(all(document, '.multiple .so-select__tags .so-tags-item')).toEqual(tags)
		expect(fields.map((field) => field.value)).toEqual(['Второй', '', 'Тверь'])

		const panels = all(document, '.so-select__panel')

		expect(panels).toHaveLength(3)
		expect(panels.map((panel) => panel.parentElement)).toEqual([
			document.body,
			document.body,
			document.body,
		])
		expect(document.getElementById(links[0] ?? '')?.getAttribute('role')).toBe('listbox')
		expect(page.markup.extensions.batch.items.map((item) => item.value)).toEqual([
			'msk',
			'tver',
		])
		expect(error).not.toHaveBeenCalled()
		expect(warn).not.toHaveBeenCalled()
	})

	it('клик по опции после гидратации добавляет тег в поле — за выбранными раньше', async () => {
		loadPage(await renderOnServer(SelectsPage))

		const { app } = await hydrated()
		const field = selectField(document, '.multiple')

		field.click()
		await app.whenStable()
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

		const panel = document.getElementById(field.getAttribute('aria-controls') ?? '')
		const second = panel ? all(panel, '[role="option"]')[1] : undefined

		if (!(second instanceof HTMLElement)) throw new Error('опции «Второй» нет')

		second.click()
		await app.whenStable()

		// Новый тег встаёт за выбранными раньше: порядок тегов — порядок выбора
		expect(tagTexts(document, '.multiple')).toEqual(['Первый', 'Третий', 'Второй'])
	})
})

/**
 * The server destroys every application right after its render, children
 * first: markup tabs left the collection one by one while the others still
 * listened, and each departure moved the order and the activity of the rest.
 * The application's teardown detaches every context before any view goes
 * (`appTeardown`), so the consumer hears nothing of it and no state is
 * refreshed for it.
 */
describe('Tabs · снятие приложения сервера', () => {
	it('элементы разметки уходят молча: связки отключены до снятия видов', async () => {
		const heard: string[] = []

		@Component({
			selector: 'app-root',
			standalone: true,
			imports: [TTabsComponent, TTabsItemComponent],
			template: `
				<div so-tabs aria_label="Разделы">
					@for (item of items; track item.value) {
						<div
							so-tabs-item
							[value]="item.value"
							[text]="item.text"
							(soChangeOrder)="heard.push(item.value + ' order')"
							(soChangeActive)="heard.push(item.value + ' active')"
						></div>
					}
				</div>
			`,
		})
		class Page {
			readonly items = ITEMS
			readonly heard = heard
		}

		// The render resolves after its platform came down: the teardown is in it
		await renderOnServer(Page)

		// Appending moved no tab, and the teardown is not news to the consumer
		expect(heard).toEqual([])
	})
})
