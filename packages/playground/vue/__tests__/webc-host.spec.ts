/**
 * Хост Web Components — то, что у него своё.
 *
 * Общее со всеми хостами — витрину, страницы, сценарии, язык — проверяют
 * дымовые тесты по списку фреймворков. Здесь — описание элемента, которым
 * хост рисует превью и фикстуры: свои атрибуты элемента (роль иконки) стоят на
 * нём, как в разметке, дети по слотам — его светом, и первая сборка
 * раскладывает их по слотам, а обёртка превью (подпись вокруг флажка) — свой
 * элемент, в слоте по умолчанию которого лежит компонент. У таблицы обёртка —
 * граница без компонента, со стилем от пропсов строки, а окно `<so-virtual>` и
 * перестановка `<so-drag-and-drop>` — автономные элементы, своим тегом. Ребёнок
 * без компонента — ряд коллекций в перестановке — тоже со своим стилем. Окно и
 * выезжающую панель открывает кнопка в обёртке (`opener` описания), а тосты
 * показывают кнопки внутри менеджера `<so-toasts>` — API у своего места. Дети,
 * которые зависят от пропа строки, — триггер меню по режиму `openOn`, —
 * ставятся до вставки, и смена такого пропа строит элемент заново (`rebuild`
 * описания).
 */

import { describe, it, expect, afterEach } from 'vitest'
import { TCheckBox, createEngineAccordion } from '@soxa-ui/core'
import { getIcon } from '@soxa-ui/setup'
import { COLLECTION_ITEMS, TABLE_ROWS, TABLE_SCROLL_ROWS } from '@soxa-ui/playground-shared'
import { loadHost } from '../src/hosts'

/** Рендер элемента коалесцируется в микротаске — ждём её перед проверкой. */
const flush = () => new Promise<void>((resolve) => queueMicrotask(() => resolve()))

/** `TElementPlugin` объявляет узел через кадр — после него встают слушатели плагинов. */
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

const host = await loadHost('webc')

/** Узлы оболочки под превью — снимаются после теста. */
const nodes: HTMLElement[] = []

function stage(): HTMLElement {
	const node = document.createElement('div')

	document.body.appendChild(node)
	nodes.push(node)

	return node
}

afterEach(() => {
	for (const node of nodes.splice(0)) node.remove()
})

/** Роль иконки и `viewBox` её рисунка — так видно, что нарисовано. */
function drawn(icon: Element): [string | null, string | null | undefined] {
	return [icon.getAttribute('icon'), icon.querySelector(':scope > svg')?.getAttribute('viewBox')]
}

describe('хост Web Components', () => {
	it('превью Icon — роль своим атрибутом элемента, рисунок роли внутри', () => {
		const node = stage()
		const handle = host.mount(node, { component: 'icon', props: { size: 'lg' } })
		const icon = node.querySelector('span.so-icon')

		if (!icon) throw new Error('иконки нет')

		expect(drawn(icon)).toEqual(['arrowDown', getIcon('arrowDown').viewBox])
		expect(icon.classList.contains('so-icon--size-lg')).toBe(true)

		handle.unmount()
	})

	/**
	 * Пропсы строки — элементу фикстуры, а не его детям: в разметке остальных
	 * хостов они тоже стоят только на компоненте сценария.
	 */
	it('фикстура — элемент с детьми по слотам: иконки по краям подписи', () => {
		const node = stage()
		const handle = host.mount(node, {
			component: 'button',
			fixture: 'button-slot-icons',
			props: { text: 'Подпись', size: 'lg' },
		})
		const button = node.querySelector('button.so-button')

		if (!button) throw new Error('кнопки нет')

		const [leading, text, trailing] = [...button.children]

		expect(button.children).toHaveLength(3)
		expect(drawn(leading)).toEqual(['check', getIcon('check').viewBox])
		expect(text.textContent).toBe('Подпись')
		expect(drawn(trailing)).toEqual(['arrowRight', getIcon('arrowRight').viewBox])
		expect(button.classList.contains('so-button--size-lg')).toBe(true)
		expect(
			[leading, trailing].map((icon) => icon.classList.contains('so-icon--size-normal')),
		).toEqual([true, true])

		handle.unmount()
	})

	/**
	 * Превью флажка — в подписи, как у Vue и React. Подпись — обёртка со своими
	 * пропсами описания, а пропсы строки и слушатели — у флажка: страница
	 * правит контрол, и в журнал попадают его события.
	 */
	it('флажок в подписи: пропсы строки и слушатели — у флажка', async () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'check-box',
			props: { size: 'lg' },
			onEvent: (name) => events.push(name),
		})
		const label = find(node, 'label.so-label')
		const box = find(label, '.so-label__control > .so-check-box')

		expect(find(label, '.so-label__text').textContent).toBe('Согласен')
		expect(box.classList.contains('so-check-box--size-lg')).toBe(true)
		expect(label.classList.contains('so-label--size-normal')).toBe(true)

		await nextFrame()
		events.length = 0
		find(label, '.so-label__text').click()

		expect(box.querySelector('input')?.checked).toBe(true)
		expect(events).toContain('change:value')

		handle.update({ size: 'sm' })
		await flush()

		expect(box.classList.contains('so-check-box--size-sm')).toBe(true)
		expect(label.classList.contains('so-label--size-normal')).toBe(true)

		handle.unmount()
	})

	/** Смена `ctrl` строит заново и флажок, и подпись вокруг него. */
	it('смена ctrl пересоздаёт и обёртку, и компонент', () => {
		const node = stage()
		const first = new TCheckBox()
		const second = new TCheckBox({ value: true })
		const handle = host.mount(node, { component: 'check-box', props: { ctrl: first } })
		const label = find(node, 'label.so-label')

		handle.update({ ctrl: second })

		const next = find(node, 'label.so-label')

		expect(next).not.toBe(label)
		expect(node.querySelectorAll('label.so-label')).toHaveLength(1)
		expect(next.querySelector('input')?.checked).toBe(true)

		handle.unmount()
	})

	it('фикстура label-check-box — подпись с флажком в слоте по умолчанию, текст — из пропа', () => {
		const node = stage()
		const handle = host.mount(node, {
			component: 'label',
			fixture: 'label-check-box',
			props: { text: 'Подпись' },
		})
		const label = find(node, 'label.so-label')
		const input = label.querySelector('.so-label__control input')

		expect(find(label, '.so-label__text').textContent).toBe('Подпись')
		expect(input instanceof HTMLInputElement ? [...(input.labels ?? [])] : []).toEqual([label])

		handle.unmount()
	})

	/**
	 * У корня с полем атрибут `id` — проп поля, а не вход корня: записанный и
	 * после монтирования (`el.id`), он уходит на поле, а с корня снят. Снятый —
	 * пустой строкой, как у нативного `id`.
	 */
	it('id поля из строки — на <input>, а не на корне', async () => {
		const node = stage()
		const handle = host.mount(node, { component: 'input', props: { id: 'first' } })
		const root = find(node, '.so-input')

		expect(root.querySelector('input')?.id).toBe('first')
		expect(root.hasAttribute('id')).toBe(false)

		handle.update({ id: 'second' })
		await flush()

		expect(root.querySelector('input')?.id).toBe('second')
		expect(root.hasAttribute('id')).toBe(false)

		handle.update({})
		await flush()

		expect(root.querySelector('input')?.hasAttribute('id')).toBe(false)

		handle.unmount()
	})
})

/**
 * Превью коллекций — как у React: элементы коллекции — дети описания в слоте
 * по умолчанию, панели табов — в слоте `content`, подписи радио и содержимое
 * секций — разметка без компонента. Элементы входят в коллекцию владельца при
 * подключении, а слушатели хост вешает и по поверхности фасада.
 */
describe('хост Web Components · коллекции', () => {
	const texts = (nodes: Iterable<Element>) => [...nodes].map((node) => node.textContent?.trim())

	it('превью Tabs: табы в списке, панели в слоте content, первый таб активен', async () => {
		const node = stage()
		const handle = host.mount(node, { component: 'tabs', props: {} })

		await flush()

		const root = find(node, '.so-tabs')
		const rows = node.querySelectorAll('.so-tabs__list > .so-tabs-item [role="tab"]')
		const shown = [...root.querySelectorAll(':scope > .so-tabs-content')].filter(
			(panel) => panel instanceof HTMLElement && panel.style.display !== 'none',
		)

		expect(texts(rows)).toEqual(['Первый', 'Второй', 'Третий', 'Четвёртый', 'Пятый'])
		expect(rows[0]?.getAttribute('aria-selected')).toBe('true')
		expect(texts(shown)).toEqual(['Панель «Первый»'])

		handle.unmount()
	})

	it('превью Accordion: секции с содержимым в панелях', () => {
		const node = stage()
		const handle = host.mount(node, { component: 'accordion', props: {} })

		expect(texts(node.querySelectorAll('.so-accordion-item__header'))).toEqual([
			'Первый',
			'Второй',
			'Третий',
			'Четвёртый',
			'Пятый',
		])
		expect(texts(node.querySelectorAll('.so-accordion-item__content'))[0]).toBe(
			'Содержимое «Первый»',
		)

		handle.unmount()
	})

	/** Выбор радио приходит в журнал и событием группы, и событием её фасада. */
	it('превью RadioGroup: подписи — текстом радио, события группы и фасада — в журнал', async () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'radio-group',
			props: {},
			onEvent: (name) => events.push(name),
		})

		expect(texts(node.querySelectorAll('.so-radio-group-item__text'))).toEqual([
			'Первый',
			'Второй',
			'Третий',
			'Четвёртый',
			'Пятый',
		])

		await nextFrame()
		events.length = 0
		node.querySelector<HTMLInputElement>('.so-radio-group-item__input')?.click()

		expect(events).toContain('change:value')
		expect(events).toContain('item:activated')

		handle.unmount()
	})

	/**
	 * Строка элемента списка — строка на `div` (`<div is="so-item-row-div">`), а
	 * выбор приходит в журнал и событием списка, и событием его фасада.
	 */
	it('превью ListBox: строки — кнопки на div, выбор — событиями списка и фасада', async () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'list-box',
			props: {},
			onEvent: (name) => events.push(name),
		})
		const rows = [
			...node.querySelectorAll(
				'.so-list-box > .so-list-box__list > .so-list-box-item > .so-button',
			),
		].filter((row): row is HTMLElement => row instanceof HTMLElement)

		expect(texts(rows)).toEqual(['Первый', 'Второй', 'Третий', 'Четвёртый', 'Пятый'])
		expect(rows.every((row) => row instanceof HTMLDivElement)).toBe(true)

		await nextFrame()
		events.length = 0
		rows[1]?.click()
		await flush()

		expect(rows[1]?.getAttribute('aria-selected')).toBe('true')
		expect(events).toContain('change:value')
		expect(events).toContain('change:selection')

		handle.unmount()
	})

	/**
	 * Теги — данными, как у Vue, в границе ширины: ряд обязан быть ровно по
	 * ячейке, иначе переполнение не срабатывает. Строка переполнения — проп
	 * набора, и смена уезжает в тему через `data-overflow`.
	 */
	it('превью Tags: теги данными в границе ширины, переполнение — data-overflow набора', async () => {
		const node = stage()
		const handle = host.mount(node, { component: 'tags', props: {} })
		const tags = find(node, '.so-tags')

		expect(tags.parentElement?.style.width).toBe('100%')
		expect(texts(tags.querySelectorAll('.so-tags-item > .so-button'))).toEqual(
			COLLECTION_ITEMS.map((item) => item.text),
		)

		handle.update({ overflow: 'scroll' })
		await flush()

		expect(tags.dataset.overflow).toBe('scroll')

		handle.unmount()
	})

	/**
	 * Опции — разметкой, как у Vue: панель — деталь Frame, уехавшая в `body`,
	 * поле — деталь Input. Выбор — событием Select в журнал. Пришли данными
	 * (блок групп страницы) — опции из них, разметки нет.
	 */
	it('превью Select: опции разметкой в панели, выбор — событием в журнал; данные — без разметки', async () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'select',
			props: { placeholder: 'Выберите' },
			onEvent: (name) => events.push(name),
		})
		const select = find(node, '.so-select')
		const options = () =>
			[...document.querySelectorAll('.so-select__list .so-select-item > .so-button')].filter(
				(row): row is HTMLElement => row instanceof HTMLElement,
			)
		const field = select.querySelector('.so-select__field input')

		if (!(field instanceof HTMLInputElement)) throw new Error('поля нет')

		expect(field.placeholder).toBe('Выберите')
		expect(texts(options())).toEqual(COLLECTION_ITEMS.map((item) => item.text))
		expect(options().every((row) => row instanceof HTMLSpanElement)).toBe(true)

		await nextFrame()
		events.length = 0
		options()[1]?.click()
		await flush()

		expect(events).toContain('change:value')
		expect(field.value).toBe(COLLECTION_ITEMS[1]?.text)

		handle.unmount()

		expect(document.querySelector('.so-select__panel')).toBeNull()

		const grouped = stage()
		// Options from data are drawn from the panel's first opening on
		const data = host.mount(grouped, {
			component: 'select',
			props: { items: [{ value: 'x', text: 'Икс' }], open: true },
		})

		await flush()

		expect(find(grouped, '.so-select').querySelector('.so-select-item')).toBeNull()
		expect(texts(options())).toEqual(['Икс'])

		data.unmount()
	})

	/** Движок, как и `ctrl`, элемент берёт сборкой: другой движок — другой элемент. */
	it('смена engine пересоздаёт элемент', () => {
		const node = stage()
		const first = createEngineAccordion()
		const second = createEngineAccordion({ items: [{ value: 'x', text: 'Икс' }] })
		const handle = host.mount(node, { component: 'accordion', props: { engine: first } })
		const before = find(node, '.so-accordion')

		handle.update({ engine: second })

		const after = find(node, '.so-accordion')

		expect(after).not.toBe(before)
		expect(node.querySelectorAll('.so-accordion')).toHaveLength(1)

		handle.unmount()
	})

	/**
	 * Таблица — как у React: строки и колонки данными, элемент — окно таблицы,
	 * а вокруг — граница ширины. С закреплённой шапкой граница — ещё и окно
	 * прокрутки, и строк больше: стиль обёртки и строки выводит превью из
	 * пропсов строки, и их смена пишет новые.
	 */
	it('превью Table: окно таблицы в границе ширины; закреплённая шапка — прокрутка и длинный список', async () => {
		const node = stage()
		const handle = host.mount(node, { component: 'table', props: {} })
		const viewport = find(node, '.so-table__viewport')
		const frame = viewport.parentElement

		await flush()

		expect(frame?.style.cssText).toBe('width: 100%;')
		expect(viewport.querySelector(':scope > table.so-table')).not.toBeNull()
		expect(node.querySelectorAll('.so-table-row')).toHaveLength(TABLE_ROWS.length)

		handle.update({ stickyHead: true })
		await flush()
		await flush()

		expect(find(node, '.so-table__viewport')).toBe(viewport)
		expect(frame?.style.overflow).toBe('auto')
		expect(frame?.style.height).toBe('320px')
		expect(find(node, 'table.so-table').dataset.stickyHead).toBe('true')
		expect(node.querySelectorAll('.so-table-row')).toHaveLength(TABLE_SCROLL_ROWS.length)

		handle.unmount()
	})

	/**
	 * Окно — автономный `<so-virtual>` своим тегом, без `is`: список, Select и
	 * таблица в нём рисуют по первым 50 элементам из тысячи. Опции Select — в его
	 * панели, увезённой в `body`.
	 */
	it('превью Virtual: <so-virtual> вокруг списка, Select и таблицы — окно у всех', async () => {
		const node = stage()
		const handle = host.mount(node, { component: 'virtual', props: {} })
		const virtual = node.querySelector('so-virtual')

		await flush()

		expect(virtual?.hasAttribute('is')).toBe(false)
		expect(virtual?.querySelectorAll('.so-list-box-item')).toHaveLength(50)
		expect(virtual?.querySelector('.so-select')).not.toBeNull()

		// Options from data are drawn from the panel's first opening on: open the
		// Select by its arrow and close it again
		const arrow = find(node, '.so-select .so-select__arrow')

		await nextFrame()
		arrow.click()
		await flush()
		arrow.click()
		await flush()

		expect(document.querySelectorAll('.so-select__list .so-select-item')).toHaveLength(50)
		expect(virtual?.querySelectorAll('.so-table-row')).toHaveLength(50)

		handle.unmount()
	})

	/**
	 * Перестановка — автономный `<so-drag-and-drop>` своим тегом, без `is`, как
	 * окно. Ряд коллекций в нём — ребёнок без компонента, и стиль ему пишет
	 * описание, как обёртке: ряд — флексом с переносом, табы — во всю его
	 * ширину, список и секции — под ними.
	 */
	it('превью DragAndDrop: <so-drag-and-drop> вокруг ряда коллекций — ряд со своим стилем', async () => {
		const node = stage()
		const handle = host.mount(node, { component: 'drag-and-drop', props: {} })
		const wrapper = node.querySelector('so-drag-and-drop')
		const row = wrapper?.firstElementChild

		await flush()

		if (!(row instanceof HTMLElement)) throw new Error('ряда нет')

		const [tabs, list, accordion] = [...row.children]

		expect(wrapper?.hasAttribute('is')).toBe(false)
		expect(wrapper?.children).toHaveLength(1)
		expect([row.style.display, row.style.flexWrap, row.style.width]).toEqual([
			'flex',
			'wrap',
			'100%',
		])
		expect(tabs instanceof HTMLElement ? tabs.style.flexBasis : undefined).toBe('100%')
		expect(tabs.querySelectorAll(':scope > .so-tabs .so-tabs-item')).toHaveLength(
			COLLECTION_ITEMS.length,
		)
		expect(list.classList.contains('so-list-box')).toBe(true)
		expect(
			accordion.querySelectorAll(':scope > .so-accordion > .so-accordion-item'),
		).toHaveLength(COLLECTION_ITEMS.length)

		handle.unmount()
	})
})

/**
 * Контролы и навигация — как у Vue: ползунок и оценка — в подписи над ними,
 * полоса и лента — в границе ширины, пагинация — без содержимого, страницы
 * рисует её шаблон. Пропсы строки и слушатели — у компонента, а не у обёртки.
 */
describe('хост Web Components · контролы и навигация', () => {
	it.each([
		['slider', 'so-slider', 'Громкость'],
		['rating', 'so-rating', 'Оценка'],
	])(
		'превью %s — в подписи Label сверху, пропсы строки — у компонента',
		(component, block, text) => {
			const node = stage()
			const handle = host.mount(node, { component, props: { size: 'lg' } })
			const label = find(node, 'label.so-label')
			const control = find(label, `.so-label__control > .${block}`)

			expect(find(label, '.so-label__text').textContent).toBe(text)
			expect(label.classList.contains('so-label--position-top')).toBe(true)
			expect(control.classList.contains(`${block}--size-lg`)).toBe(true)
			expect(label.classList.contains('so-label--size-normal')).toBe(true)

			handle.unmount()
		},
	)

	it.each([
		['progress-linear', '.so-progress-linear'],
		['scroller', '.so-scroller'],
	])('превью %s — в границе ширины', (component, selector) => {
		const node = stage()
		const handle = host.mount(node, { component, props: {} })
		const frame = find(node, selector).parentElement

		expect(frame?.localName).toBe('div')
		expect(frame?.style.width).toBe('100%')

		handle.unmount()
	})

	it('превью Scroller: пункты ленты — прямо во вьюпорте', () => {
		const node = stage()
		const handle = host.mount(node, { component: 'scroller', props: {} })
		const items = [...find(node, '.so-scroller__viewport').children]

		expect(items.map((item) => item.textContent)).toEqual(
			COLLECTION_ITEMS.map((item) => `${item.text} пункт ленты`),
		)

		handle.unmount()
	})

	/** Страницы — внутренняя часть: их рисует шаблон пагинации по окну. */
	it('превью Pagination: окно страниц, нажатие страницы — событием в журнал', async () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'pagination',
			props: { total: 100, value: 5 },
			onEvent: (name) => events.push(name),
		})

		await flush()

		const pages = [...node.querySelectorAll('.so-pagination-item > button')]

		expect(pages.map((page) => page.textContent?.trim())).toEqual(['1', '4', '5', '6', '10'])

		await nextFrame()
		events.length = 0

		const six = pages[3]

		if (six instanceof HTMLElement) six.click()

		expect(events).toContain('change:value')

		handle.unmount()
	})
})

/**
 * Оверлеи — как у Vue: триггер — Button в слоте `trigger`, панель уехала в
 * `body`, мимо сцены. Связку с панелью триггер получает сам: scope у слотов
 * нет, и наборы триггера кладёт шаблон. Пропсы строки и слушатели — у
 * компонента: клик по триггеру приходит в журнал событием открытости.
 */
describe('хост Web Components · оверлеи', () => {
	const texts = (nodes: Iterable<Element>) => [...nodes].map((node) => node.textContent?.trim())

	/** Панель, на которую ссылается триггер; нет её — тест падает здесь. */
	function panelOf(trigger: Element, reference: string): HTMLElement {
		const panel = document.getElementById(trigger.getAttribute(reference) ?? '')

		if (!panel) throw new Error(`панели по ${reference} нет`)

		return panel
	}

	it('превью Popover: триггер в корне, панель с содержимым в body, клик — в журнал', async () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'popover',
			props: { aria_label: 'Пример поповера' },
			onEvent: (name) => events.push(name),
		})
		const trigger = find(node, '.so-popover > .so-button')
		const panel = panelOf(trigger, 'aria-controls')

		expect(trigger.textContent?.trim()).toBe('Открыть')
		expect(trigger.getAttribute('slot')).toBe('trigger')
		expect(panel.parentElement).toBe(document.body)
		expect(panel.classList.contains('so-popover__panel')).toBe(true)
		expect(panel.getAttribute('aria-label')).toBe('Пример поповера')
		expect(texts(find(panel, '.so-popover__content').children)).toEqual([
			'Произвольное содержимое: текст, поля, кнопки',
			'Действие',
		])

		await nextFrame()
		events.length = 0
		trigger.click()
		await flush()

		expect(events).toContain('change:open')
		expect(trigger.getAttribute('aria-expanded')).toBe('true')
		expect(panel.style.display).toBe('')

		handle.unmount()
	})

	it('превью Tooltip: триггер в корне, описание — панель с текстом подсказки', () => {
		const node = stage()
		const handle = host.mount(node, { component: 'tooltip', props: { openDelay: 0 } })
		const trigger = find(node, '.so-tooltip > .so-button')
		const panel = panelOf(trigger, 'aria-describedby')

		expect(trigger.textContent?.trim()).toBe('Наведи')
		expect(panel.parentElement).toBe(document.body)
		expect(panel.getAttribute('role')).toBe('tooltip')
		expect(find(panel, '.so-tooltip__content').textContent).toBe('Короткое пояснение к кнопке')

		handle.unmount()
	})

	/**
	 * Пункты меню — разметкой, как у Vue: части меню в свете элемента, а панель
	 * с ними уехала в `body`. Флажки, переключатели, подменю и пункт с панелью
	 * — свои элементы частей; нажатие действия приходит в журнал событием
	 * фасада меню (`choose`).
	 */
	it('превью Menu: триггер в корне, панель с пунктами в body, выбор — в журнал', async () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'menu',
			props: {},
			onEvent: (name) => events.push(name),
		})
		const trigger = find(node, '.so-menu > .so-button')
		const panel = panelOf(trigger, 'aria-controls')
		const row = (text: string) =>
			[...panel.querySelectorAll('[role^="menuitem"]')].find(
				(candidate) =>
					candidate.querySelector('.so-button__text')?.textContent?.trim() === text,
			)

		expect(trigger.textContent?.trim()).toBe('Действия')
		expect(panel.parentElement).toBe(document.body)
		expect(panel.getAttribute('role')).toBe('menu')
		// Items come with the panel's first opening
		expect(panel.querySelector('[role^="menuitem"]')).toBeNull()

		await nextFrame()
		trigger.click()
		await flush()
		await nextFrame()

		expect(texts(panel.querySelectorAll('.so-menu-group__label'))).toEqual([
			'Вид',
			'Сортировка',
		])
		expect(row('Сетка')?.getAttribute('role')).toBe('menuitemcheckbox')
		expect(row('По имени')?.getAttribute('aria-checked')).toBe('true')
		expect(row('Поделиться')?.getAttribute('aria-haspopup')).toBe('menu')
		expect(row('Срок')?.getAttribute('aria-haspopup')).toBe('dialog')
		expect(row('Изменить')?.querySelector('.so-menu-item__shortcut')?.textContent).toBe(
			'Ctrl+E',
		)

		events.length = 0

		const edit = row('Изменить')

		if (!(edit instanceof HTMLElement)) throw new Error('строки «Изменить» нет')

		edit.click()
		await flush()

		expect(events).toContain('choose')
		expect(events).toContain('change:open')

		handle.unmount()
	})

	/**
	 * Режим контекстного меню — из пропсов колонки, как у Vue: в слоте
	 * `trigger` тогда область, а не Button. Область — нативная кнопка, как у
	 * Vue: в обходе Tab без `tabindex`, со своими ролью и именем, и связки с
	 * меню у неё нет. Дети ставятся до вставки, и смена режима строит элемент
	 * заново.
	 */
	it('превью Menu: смена openOn строит меню заново — у контекстного меню в слоте область', () => {
		const node = stage()
		const handle = host.mount(node, { component: 'menu', props: {} })
		const before = find(node, '.so-menu')

		expect(before.querySelector(':scope > .so-button')).not.toBeNull()

		handle.update({ openOn: 'contextmenu' })

		const after = find(node, '.so-menu')
		const area = find(after, ':scope > [slot="trigger"]')

		expect(after).not.toBe(before)
		expect(node.querySelectorAll('.so-menu')).toHaveLength(1)
		expect(after.querySelector(':scope > .so-button')).toBeNull()
		expect([area.localName, area.getAttribute('type')]).toEqual(['button', 'button'])
		expect(area.hasAttribute('tabindex')).toBe(false)
		expect(area.hasAttribute('aria-haspopup')).toBe(false)

		handle.unmount()
	})

	/**
	 * Окно открывает кнопка, как у Vue: она — в ячейке, а окно с подложкой
	 * уехало в `body` и закрыто. Нажатие открывает окно записью `visible`, и в
	 * журнал приходит смена открытости; кнопка подвала его закрывает. Снятое
	 * превью уводит окно с подложкой из `body`.
	 */
	it('превью Dialog: кнопка в ячейке открывает окно в body, кнопка подвала закрывает', async () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'dialog',
			props: {},
			onEvent: (name) => events.push(name),
		})
		const opener = find(node, '.so-button')
		const dialog = find(document.body, ':scope > .so-dialog')

		expect(opener.textContent?.trim()).toBe('Открыть окно')
		expect(dialog.previousElementSibling?.classList.contains('so-dialog__backdrop')).toBe(true)
		expect(find(dialog, '.so-dialog__title').textContent).toBe('Настройки')
		expect(texts(find(dialog, '.so-dialog__body').children)).toEqual([
			'Произвольное содержимое: текст, поля, кнопки',
			'',
		])
		expect(find(dialog, '.so-dialog__body .so-input input').getAttribute('placeholder')).toBe(
			'Имя',
		)
		expect(texts(find(dialog, '.so-dialog__footer').children)).toEqual(['Отмена', 'Сохранить'])
		expect(dialog.style.display).toBe('none')

		await nextFrame()
		opener.click()
		await flush()

		expect(dialog.style.display).toBe('')
		expect(events).toContain('change:visible')

		find(dialog, '.so-dialog__footer .so-button').click()
		await flush()

		expect(dialog.style.display).toBe('none')

		handle.unmount()
		await flush()

		expect(document.querySelector('.so-dialog, .so-dialog__backdrop')).toBeNull()
	})

	/**
	 * Выезжающая панель — в коробке превью вместе с кнопкой: с `contained` она
	 * встаёт в ней, а без — уезжает в `body`, и строка переносит её туда и
	 * обратно вместе с подложкой.
	 */
	it('превью Drawer: кнопка в коробке, contained ставит панель с подложкой в неё', async () => {
		const node = stage()
		const handle = host.mount(node, { component: 'drawer', props: { contained: true } })
		const box = find(node, ':scope > so-locale-provider > div')
		const opener = find(box, ':scope > .so-button')
		const drawer = find(box, ':scope > .so-drawer')

		expect(opener.textContent?.trim()).toBe('Открыть панель')
		expect(box.style.position).toBe('relative')
		expect(drawer.previousElementSibling?.classList.contains('so-drawer__backdrop')).toBe(true)
		expect(find(drawer, '.so-drawer__title').textContent).toBe('Фильтры')
		expect(texts(find(drawer, '.so-drawer__footer').children)).toEqual([
			'Сбросить',
			'Применить',
		])

		opener.click()
		await flush()

		expect(drawer.style.display).toBe('')

		handle.update({ contained: false })
		await flush()

		expect(drawer.parentElement).toBe(document.body)
		expect(drawer.previousElementSibling?.classList.contains('so-drawer__backdrop')).toBe(true)
		expect(box.querySelector('.so-drawer__backdrop')).toBeNull()

		handle.unmount()
	})

	/**
	 * Менеджер тостов вокруг ряда кнопок — автономный элемент своим тегом: ряд
	 * стоит в ячейке, регион уехал в `body`. Кнопка берёт API у своего места
	 * (`toastsOf`) и показывает тост образца стенда, у обычного — с кнопкой
	 * «Отменить», которая его закрывает.
	 */
	it('превью Toasts: кнопки в менеджере показывают тост в регионе у края окна', async () => {
		const node = stage()
		const handle = host.mount(node, { component: 'toasts', props: {} })
		const manager = find(node, 'so-toasts')
		const region = find(document.body, ':scope > .so-toasts')

		expect(texts(manager.querySelectorAll('.so-button'))).toEqual([
			'обычное',
			'info',
			'success',
			'warning',
			'error',
			'загрузка → готово',
		])
		expect(manager.contains(region)).toBe(false)

		find(manager, '.so-button').click()
		await flush()

		const toast = find(region, '.so-toasts-item')

		expect(find(toast, '.so-toasts-item__text').textContent).toBe('1. Черновик сохранён')

		find(toast, '.so-toasts-item__content .so-button').click()
		await flush()

		expect(toast.dataset.open).toBe('false')

		handle.unmount()

		expect(document.querySelector('.so-toasts')).toBeNull()
	})
})

/**
 * Даты — как у Vue: содержимого у календаря, поля даты и DatePicker нет, язык —
 * локаль провайдера корня хоста (шапка стенда). Дни календаря рисует его
 * шаблон, у DatePicker поле стоит в ячейке, а панель с календарём уехала в
 * `body`. Пропсы строки и слушатели — у компонента. У меню календарь — в
 * панели пункта «Срок», как у Vue.
 */
describe('хост Web Components · даты', () => {
	/** День по номеру в первой сетке узла. */
	function dayOf(root: ParentNode, text: string): HTMLElement {
		const day = [...root.querySelectorAll('.so-calendar-item')].find(
			(cell) => cell.textContent?.trim() === text,
		)

		if (!(day instanceof HTMLElement)) throw new Error(`дня «${text}» нет`)

		return day
	}

	it('превью Calendar: сетка месяца с днями, выбор дня — событием в журнал', async () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'calendar',
			props: { months: ['2026-09-01'] },
			onEvent: (name) => events.push(name),
		})
		const calendar = find(node, ':scope > so-locale-provider > .so-calendar')

		expect(find(calendar, '.so-calendar__title-text').textContent?.trim()).toBe(
			'September 2026',
		)
		expect(calendar.querySelectorAll('.so-calendar-item')).toHaveLength(30)
		expect(find(calendar, '.so-calendar__heading').localName).toBe('div')

		await nextFrame()
		events.length = 0
		dayOf(calendar, '12').click()
		await flush()

		expect(events).toContain('change:value')
		expect(dayOf(calendar, '12').dataset.selected).toBe('true')

		handle.update({ months: ['2026-10-01'] })
		await flush()

		expect(find(calendar, '.so-calendar__title-text').textContent?.trim()).toBe('October 2026')

		handle.unmount()
	})

	it('превью DateInput: части в ряду, имя — из пропсов превью, набор — событием в журнал', async () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'date-input',
			props: { aria_label: 'Дата', value: '2026-05-12' },
			onEvent: (name) => events.push(name),
		})
		const field = find(node, '.so-date-input')

		expect(field.getAttribute('role')).toBe('group')
		expect(field.getAttribute('aria-label')).toBe('Дата')
		// Язык шапки — английский: месяц, день, год
		expect(
			[...field.querySelectorAll('.so-date-input__segment')].map((part) =>
				part.getAttribute('data-type'),
			),
		).toEqual(['month', 'day', 'year'])

		handle.update({ aria_label: 'Дата', value: '2026-05-13' })
		await flush()

		expect(find(field, '.so-date-input__segment[data-type="day"]').textContent).toBe('13')

		handle.unmount()
	})

	it('превью DatePicker: поле в ячейке, панель с календарём в body; открытие и выбор — в журнал', async () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'date-picker',
			props: { aria_label: 'Дата' },
			onEvent: (name) => events.push(name),
		})
		await nextFrame()

		const picker = find(node, '.so-date-picker')
		const trigger = find(picker, '.so-date-picker__field .so-date-picker__trigger')
		const panel = find(document.body, ':scope > .so-date-picker__panel')

		expect(find(picker, '.so-date-picker__field').getAttribute('aria-label')).toBe('Дата')
		expect(trigger.getAttribute('aria-controls')).toBe(panel.id)
		// The calendar comes with the panel's first opening
		expect(panel.querySelector('.so-date-picker__calendar')).toBeNull()
		expect(panel.style.display).toBe('none')

		await nextFrame()
		events.length = 0
		trigger.click()
		await flush()

		expect(events).toContain('change:open')
		expect(panel.style.display).toBe('')
		expect(panel.querySelector('.so-date-picker__calendar .so-calendar__grid')).not.toBeNull()

		// The days' plugins get their nodes a frame after the calendar is built
		await nextFrame()
		dayOf(panel, '12').click()
		await flush()

		expect(events).toContain('change:value')
		expect(panel.style.display).toBe('none')

		handle.unmount()

		expect(document.querySelector('.so-date-picker__panel')).toBeNull()
	})

	it('превью Menu: в панели пункта «Срок» — календарь, с первым открытием', async () => {
		const node = stage()
		const handle = host.mount(node, { component: 'menu', props: {} })
		const trigger = find(node, '.so-menu > .so-button')

		expect(document.querySelector('.so-menu-popover-item .so-calendar')).toBeNull()

		await nextFrame()
		trigger.click()
		await flush()
		await nextFrame()

		const due = [...document.querySelectorAll('[role^="menuitem"]')].find(
			(row) => row.querySelector('.so-button__text')?.textContent?.trim() === 'Срок',
		)

		if (!(due instanceof HTMLElement)) throw new Error('строки «Срок» нет')

		due.click()
		await flush()
		await nextFrame()

		const panel = document.getElementById(due.getAttribute('aria-controls') ?? '')

		expect(panel?.querySelector('.so-calendar .so-calendar__grid')).not.toBeNull()

		handle.unmount()
	})
})

/** Узел по селектору; нет его — тест падает здесь. */
function find(root: ParentNode, selector: string): HTMLElement {
	const node = root.querySelector(selector)

	if (!(node instanceof HTMLElement)) throw new Error(`${selector}: узла нет`)

	return node
}
