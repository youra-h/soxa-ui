/**
 * The Angular host — what is its own.
 *
 * What it shares with every host — the showcase, the pages, the scenarios, the
 * language — the smoke tests check by the list of frameworks. Here are the
 * decisions of the Angular host itself: the stand builds components with the
 * Angular compiler and the Angular packages with the linker, and there is no
 * Angular compiler at runtime; props go to inputs by name, and the host does
 * not mute a prop without an input; the adapter takes the core instance at
 * assembly, and a change of `ctrl` places the component anew. A preview is a
 * component of the host with its markup, as a fixture: the wrapper, the parts
 * in projections and the frame are markup, the parts enter the collection in
 * markup order, the frame follows the shell's props, and the preview's data
 * lies under them; the props go to the inputs of the preview, the outputs are
 * those of the component in its markup. The copies (`count`) are views of one
 * template: the host listens to the component of each, and each has its own
 * state.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { TButton, TCalendar, TListBox, createEngine } from '@soxa-ui/core'
import { TBasePlugin, type IPluginContext } from '@soxa-ui/plugins'
import { usePlugins } from '@soxa-ui/setup'
import {
	COLLECTION_ITEMS,
	TABLE_COLUMNS,
	TABLE_ROWS,
	TABLE_SCROLL_ROWS,
	presetForProp,
} from '@soxa-ui/playground-shared'
import { loadHost } from '../src/hosts'

const host = await loadHost('angular')

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

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

/** Кнопки превью в узле. */
const buttons = (node: HTMLElement) => [...node.querySelectorAll('.so-button')]

/** Текст кнопки превью. */
const label = (node: HTMLElement) => node.querySelector('.so-button__text')?.textContent?.trim()

describe('хост Angular', () => {
	/**
	 * Пакеты Angular выпущены в частичной форме, и без линкера первый же их
	 * импорт попросил бы компилятор Angular в рантайме — а тот, загрузившись,
	 * кладёт себя в `ng.ɵcompilerFacade`. Стенд собирает Angular заранее: JIT в
	 * нём нет, и шаблоны компилирует только компилятор Angular.
	 */
	it('компилятора Angular в рантайме нет', () => {
		const node = stage()
		const handle = host.mount(node, { component: 'button', props: { text: 'Собрано' } })
		const ng: unknown = Reflect.get(globalThis, 'ng')

		expect(label(node)).toBe('Собрано')
		expect(typeof ng === 'object' && ng !== null && 'ɵcompilerFacade' in ng).toBe(false)

		handle.unmount()
	})

	it('снятое превью оставляет узел оболочки пустым', () => {
		const node = stage()

		host.mount(node, { component: 'button', props: { text: 'Снять' } }).unmount()

		expect(node.childNodes).toHaveLength(0)
	})

	/**
	 * Экземпляр ядра адаптер берёт при сборке, а не на лету: новый `ctrl` —
	 * новый компонент, и рисует он новый экземпляр, а прежний его больше не
	 * трогает.
	 */
	it('смена ctrl ставит компонент заново, с новым экземпляром', async () => {
		const node = stage()
		const first = new TButton()
		const second = new TButton()
		const handle = host.mount(node, { component: 'button', props: { ctrl: first } })
		const [before] = buttons(node)

		handle.update({ ctrl: second })

		expect(buttons(node)).toHaveLength(1)
		expect(buttons(node)[0]).not.toBe(before)

		// Нарисован новый экземпляр: его смена видна, а прежний кнопку больше не
		// трогает. Смену состояния приложение проверяет само, на своём такте
		second.text = 'Новый'
		first.text = 'Прежний'
		await nextFrame()

		expect(label(node)).toBe('Новый')

		handle.unmount()
	})

	/**
	 * Тег корня — у самого элемента (`<a so-button>`), и входа `tag` у
	 * компонентов Angular нет: строку `tag` хост не пишет, как хост Web
	 * Components. Остальной проп без входа — расхождение адаптера с
	 * дескриптором: хост называет его, а узел оболочки остаётся пустым.
	 */
	it('tag хост не пишет, а проп без входа называет', () => {
		const node = stage()
		const handle = host.mount(node, { component: 'button', props: { tag: 'a' } })

		expect(buttons(node).map((button) => button.localName)).toEqual(['button'])

		handle.unmount()

		expect(() => host.mount(node, { component: 'button', props: { nothing: true } })).toThrow(
			'нет входов: nothing',
		)
		expect(node.childNodes).toHaveLength(0)
	})

	/**
	 * Страница оболочки монтирует все превью в одну задачу браузера — у Select
	 * их под семьдесят. Такт приложения у `mount` один: ручной такт Angular
	 * переводит планировщик на микрозадачи до конца задачи, и в режиме
	 * разработки первое уведомление после каждого такта идёт в счёт
	 * бесконечного цикла — сотня подряд роняет его проверку (NG0103). С двумя
	 * тактами на превью страница Select падала.
	 */
	it('девяносто превью в одну задачу — без NG0103', () => {
		const handles = Array.from({ length: 90 }, () =>
			host.mount(stage(), { component: 'button', props: { text: 'Кнопка' } }),
		)

		expect(handles).toHaveLength(90)

		for (const handle of handles) handle.unmount()
	})
})

/** Подписи элементов коллекций превью — из общего манифеста. */
const TEXTS = COLLECTION_ITEMS.map((item) => item.text)

/** Элементы узла по селектору — с типом HTML-элемента. */
const all = (node: ParentNode, selector: string): HTMLElement[] =>
	[...node.querySelectorAll(selector)].filter((element) => element instanceof HTMLElement)

/** Текст элементов по селектору, без пробелов по краям. */
const textsOf = (node: ParentNode, selector: string): string[] =>
	all(node, selector).map((element) => element.textContent?.trim() ?? '')

describe('хост Angular · обёртка и содержимое', () => {
	/**
	 * The list's items are components of their own on their own elements in the
	 * owner's main projection. An item reads the owner's lift layer at its
	 * assembly, by the injector of the template: once it entered the collection,
	 * it stands in its place there (`order`) and is selected by a click. The
	 * projection is in the list's node inside the root: the header and the
	 * footer stand next to it in the root. A removed preview takes the parts
	 * away too.
	 */
	it('элементы списка входят в коллекцию владельца в порядке разметки', async () => {
		const node = stage()
		const handle = host.mount(node, { component: 'list-box', props: {} })
		const items = all(node, '.so-list-box > .so-list-box__list > .so-list-box-item')

		expect(textsOf(node, '.so-list-box-item')).toEqual(TEXTS)
		expect(items.map((item) => item.style.order)).toEqual(['0', '1', '2', '3', '4'])

		all(items[1], '.so-button')[0]?.click()
		await nextFrame()

		expect(items.map((item) => item.dataset.selected)).toEqual([
			'false',
			'true',
			'false',
			'false',
			'false',
		])

		handle.unmount()

		expect(node.childNodes).toHaveLength(0)
	})

	/**
	 * Части со слотом ложатся в его проекцию: панели — в `[slot=content]`,
	 * рядом с рядом табов, а не в списке. Видна панель активного таба, и в ней
	 * её содержимое.
	 */
	it('панели табов — в слоте content, вне списка табов', () => {
		const node = stage()
		const handle = host.mount(node, { component: 'tabs', props: {} })
		const list = node.querySelector('.so-tabs > .so-tabs__bar > .so-tabs__list')
		const panels = all(node, '.so-tabs > .so-tabs-content')

		expect(list && textsOf(list, '.so-tabs-item')).toEqual(TEXTS)
		expect(list?.querySelectorAll('.so-tabs-content')).toHaveLength(0)
		expect(panels.map((panel) => panel.style.display !== 'none')).toEqual([
			true,
			false,
			false,
			false,
			false,
		])
		expect(panels[0].textContent?.trim()).toBe('Панель «Первый»')

		handle.unmount()
	})

	/**
	 * Радио — одна группа: общее имя полям даёт коллекция группы, а не разметка.
	 * Подпись радио — текст в его проекции.
	 */
	it('радио — одной группой, с подписью содержимым', () => {
		const node = stage()
		const handle = host.mount(node, { component: 'radio-group', props: {} })
		const names = all(node, '.so-radio-group-item input').map((input) =>
			input.getAttribute('name'),
		)

		expect(textsOf(node, '.so-radio-group > .so-radio-group-item')).toEqual(TEXTS)
		expect(names).toHaveLength(TEXTS.length)
		expect(new Set(names).size).toBe(1)
		expect(names[0]).toBeTruthy()

		handle.unmount()
	})

	/**
	 * Обёртка — подпись вокруг флажка: флажок стоит в её проекции, а пропсы
	 * строки и выходы — его, а не её. Входа `text` у флажка нет, и строка с ним
	 * — ошибка, хотя у подписи такой вход есть.
	 */
	it('обёртка: компонент в её проекции, пропсы строки и выходы — его', () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'check-box',
			props: {},
			onEvent: (name) => events.push(name),
		})
		const input = node.querySelector('.so-label > .so-label__control > .so-check-box > input')

		expect(textsOf(node, '.so-label__text')).toEqual(['Согласен'])
		expect(input instanceof HTMLInputElement && input.checked).toBe(false)

		handle.update({ value: true })

		expect(input instanceof HTMLInputElement && input.checked).toBe(true)
		expect(events).toContain('change:value')
		expect(() => handle.update({ text: 'Подпись' })).toThrow('нет входов: text')

		handle.unmount()
	})

	/**
	 * Без обёртки содержимое — у самого компонента: флажок в основной проекции
	 * подписи, а строка правит саму подпись — её проп поверх пропа превью.
	 */
	it('содержимое подписи — флажок в её проекции, пропсы строки — подписи', () => {
		const node = stage()
		const handle = host.mount(node, { component: 'label', props: { text: 'Подпись' } })

		expect(
			node.querySelector('.so-label > .so-label__control > .so-check-box > input'),
		).not.toBe(null)
		expect(textsOf(node, '.so-label__text')).toEqual(['Подпись'])

		handle.unmount()
	})

	/**
	 * Select's options are components of their own on their own elements in its
	 * main projection, in the list of the panel carried away to `body`. An
	 * option reads the lift layer of the Select by the injector of the template:
	 * once it entered the collection, it stands in its place there (`order`), and
	 * selecting it writes the option's text into the field.
	 */
	it('опции Select входят в коллекцию владельца в порядке разметки — в панели в body', async () => {
		const node = stage()
		const handle = host.mount(node, { component: 'select', props: {} })
		const options = all(document.body, '.so-select__panel > .so-select__list > .so-select-item')

		expect(node.querySelector('.so-select__panel')).toBe(null)
		expect(options.map((option) => option.textContent?.trim())).toEqual(TEXTS)
		expect(options.map((option) => option.style.order)).toEqual(['0', '1', '2', '3', '4'])

		await nextFrame()
		all(options[1], '.so-button')[0]?.click()
		await nextFrame()

		const field = node.querySelector('.so-select__field input')

		expect(field instanceof HTMLInputElement && field.value).toBe(TEXTS[1])

		handle.unmount()

		expect(node.childNodes).toHaveLength(0)
		expect(document.querySelector('.so-select__panel')).toBe(null)
	})

	/** Теги — данными превью: ряд в рамке во всю ширину, пропсы строки — набору. */
	it('теги — данными превью в рамке, пропсы строки — набору', () => {
		const node = stage()
		const handle = host.mount(node, { component: 'tags', props: { closable: true } })
		const frame = node.querySelector('.so-tags')?.parentElement

		expect(textsOf(node, '.so-tags-item > .so-button:first-child')).toEqual(TEXTS)
		expect(all(node, '.so-tags-item__close')).toHaveLength(TEXTS.length)
		expect(frame instanceof HTMLElement && frame.style.width).toBe('100%')

		handle.unmount()
	})

	/**
	 * Новый `ctrl` — новое превью целиком: владелец с новым экземпляром и его
	 * части, вошедшие уже в его коллекцию. Движок у каждого владельца свой, как
	 * у строки страницы.
	 */
	it('смена ctrl ставит владельца заново, с частями', () => {
		const node = stage()
		const handle = host.mount(node, {
			component: 'list-box',
			props: { ctrl: new TListBox(), engine: createEngine() },
		})
		const [before] = all(node, '.so-list-box')

		handle.update({ ctrl: new TListBox(), engine: createEngine() })

		const lists = all(node, '.so-list-box')

		expect(lists).toHaveLength(1)
		expect(lists[0]).not.toBe(before)
		expect(all(lists[0], '.so-list-box-item').map((item) => item.style.order)).toEqual([
			'0',
			'1',
			'2',
			'3',
			'4',
		])

		handle.unmount()

		expect(node.childNodes).toHaveLength(0)
	})
})

/** Узел по `id` из атрибута ссылки на него; нет его — тест падает здесь. */
function linked(element: Element, attribute: string): HTMLElement {
	const target = document.getElementById(element.getAttribute(attribute) ?? '')

	if (!(target instanceof HTMLElement)) throw new Error(`${attribute} ни на что не ведёт`)

	return target
}

/** Триггер в корне превью — Button в шаблоне слота; нет его — тест падает здесь. */
function triggerIn(node: HTMLElement, root: string): HTMLElement {
	const trigger = node.querySelector(`${root} > .so-button`)

	if (!(trigger instanceof HTMLElement)) throw new Error(`в ${root} нет триггера`)

	return trigger
}

describe('хост Angular · превью своим шаблоном', () => {
	/**
	 * Триггер поповера — шаблон слота, а шаблоны слотов видит только разметка:
	 * превью — компонент хоста со своим шаблоном, как фикстура. Пропсы оболочки
	 * уходят его входам и дальше — поповеру в разметке, выходы хост слушает у
	 * поповера в нём, а пропа без входа не глушит. Снятое превью уносит и
	 * панель, увезённую в `body`.
	 */
	it('поповер: пропсы — входам превью и дальше поповеру, выходы — у поповера в нём', () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'popover',
			props: { aria_label: 'Пример поповера' },
			onEvent: (name) => events.push(name),
		})
		const trigger = triggerIn(node, '.so-popover')
		const panel = linked(trigger, 'aria-controls')

		expect(trigger.textContent?.trim()).toBe('Открыть')
		expect(panel.parentElement).toBe(document.body)
		expect(panel.getAttribute('aria-label')).toBe('Пример поповера')
		expect(panel.style.display).toBe('none')
		expect(textsOf(panel, '.so-popover__content > *')).toEqual([
			'Произвольное содержимое: текст, поля, кнопки',
			'Действие',
		])

		handle.update({ aria_label: 'Пример поповера', open: true })

		expect(panel.style.display).toBe('')
		expect(trigger.getAttribute('aria-expanded')).toBe('true')
		expect(events).toContain('change:open')
		expect(() => handle.update({ nothing: true })).toThrow('нет входов: nothing')

		handle.unmount()

		expect(node.childNodes).toHaveLength(0)
		expect(panel.isConnected).toBe(false)
	})

	/**
	 * Окно открывает кнопка превью, а открытость — своё состояние превью, как у
	 * Vue: кнопка подвала закрывает окно записью этого состояния, строка
	 * `visible` — вход превью — его переписывает. Пропсы оболочки уходят входам
	 * превью и дальше окну, выходы хост слушает у окна. Окно уехало в `body`
	 * вместе с подложкой, а снятое превью уносит обоих.
	 */
	it('окно: кнопка превью открывает, подвал закрывает, visible — входом превью', async () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'dialog',
			props: { placement: 'end' },
			onEvent: (name) => events.push(name),
		})
		const dialog = document.querySelector('.so-dialog')

		if (!(dialog instanceof HTMLElement)) throw new Error('окна нет')

		expect(dialog.parentElement).toBe(document.body)
		expect(dialog.previousElementSibling?.classList).toContain('so-backdrop')
		expect(dialog.classList).toContain('so-dialog--placement-end')
		expect(dialog.style.display).toBe('none')
		expect(textsOf(dialog, '.so-dialog__title')).toEqual(['Настройки'])
		expect(textsOf(dialog, '.so-dialog__footer > .so-button')).toEqual(['Отмена', 'Сохранить'])
		expect(textsOf(node, '.so-button')).toEqual(['Открыть окно'])

		// Своё состояние превью приложение перепроверяет само, на своём такте
		all(node, '.so-button')[0]?.click()
		await nextFrame()

		expect(dialog.style.display).toBe('')
		expect(events).toContain('change:visible')

		all(dialog, '.so-dialog__footer > .so-button')[1]?.click()
		await nextFrame()

		expect(dialog.style.display).toBe('none')

		handle.update({ placement: 'end', visible: true })

		expect(dialog.style.display).toBe('')

		handle.unmount()

		expect(node.childNodes).toHaveLength(0)
		expect(dialog.isConnected).toBe(false)
		expect(document.querySelector('.so-backdrop:has(+ .so-dialog)')).toBe(null)
	})

	/**
	 * Выезжающая панель — в коробке превью с `position: relative`, как у Vue:
	 * поверх страницы она уехала в `body`, а с `contained` стоит в коробке, и
	 * подложка — перед ней.
	 */
	it('выезжающая панель: contained ставит её с подложкой в коробку превью', () => {
		const node = stage()
		const handle = host.mount(node, { component: 'drawer', props: {} })
		const box = node.querySelector('div')
		const drawer = document.querySelector('.so-drawer')

		if (!(drawer instanceof HTMLElement)) throw new Error('панели нет')

		expect(box?.style.position).toBe('relative')
		expect(drawer.parentElement).toBe(document.body)

		handle.update({ contained: true, visible: true })

		expect(drawer.parentElement).toBe(box)
		expect(drawer.previousElementSibling?.classList).toContain('so-backdrop')
		expect(drawer.style.display).toBe('')
		expect(textsOf(drawer, '.so-drawer__title')).toEqual(['Фильтры'])

		handle.unmount()

		expect(node.childNodes).toHaveLength(0)
		expect(document.querySelector('.so-drawer, .so-backdrop:has(+ .so-drawer)')).toBe(null)
	})

	/**
	 * Тосты показывают кнопки внутри менеджера, а API им даёт компонент под ним
	 * (`useToasts()` полем) — превью своим шаблоном. Регион уехал в `body`, а в
	 * узле превью — ряд кнопок; пропсы оболочки уходят входам превью и дальше
	 * менеджеру, выходы хост слушает у него. Кнопка показывает тост со своим
	 * содержимым хоста — «Отменить», — а снятое превью уносит регион.
	 */
	it('тосты: кнопка превью показывает тост в регионе, пропсы — менеджеру', async () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'toasts',
			props: { placement: 'top-start' },
			onEvent: (name) => events.push(name),
		})
		const region = document.querySelector('.so-toasts')

		if (!(region instanceof HTMLElement)) throw new Error('региона нет')

		expect(region.parentElement).toBe(document.body)
		expect(region.classList).toContain('so-toasts--placement-top-start')
		expect(textsOf(node, '.so-button')).toEqual([
			'обычное',
			'info',
			'success',
			'warning',
			'error',
			'загрузка → готово',
		])

		// Тост показывает кнопка, а перепроверяет приложение само, на своём такте
		all(node, '.so-button')[0]?.click()
		await nextFrame()

		expect(textsOf(region, '.so-toasts-item__text')).toEqual(['1. Черновик сохранён'])
		expect(textsOf(region, '.so-toasts-item__content .so-button')).toEqual(['Отменить'])
		expect(events).toContain('change:shown')

		handle.update({ placement: 'bottom-end' })

		expect(region.classList).toContain('so-toasts--placement-bottom-end')

		handle.unmount()

		expect(node.childNodes).toHaveLength(0)
		expect(region.isConnected).toBe(false)
	})

	/**
	 * The window is a directive on `<ng-container>`, and the host does not build
	 * a directive itself: the preview has its own template. The window has no
	 * node of its own — the row stands right in the preview's markup — and all
	 * three collections of the row pick it up: before a measurement each draws
	 * the first 50 of a thousand, the Select — in the list of its panel, from the
	 * panel's first opening on. The host listens to the outputs at the window in
	 * the preview's markup and does not mute a prop without an input.
	 */
	it('окно: ряд — прямо в разметке превью, окно у списка, Select и таблицы', async () => {
		const node = stage()
		const handle = host.mount(node, {
			component: 'virtual',
			props: {},
			onEvent: () => {},
		})
		const row = node.querySelector('pg-virtual-preview > div')

		if (!(row instanceof HTMLElement)) throw new Error('ряда нет')

		expect(row.style.display).toBe('flex')
		expect([...row.children].map((child) => child.className)).toEqual([
			expect.stringContaining('so-list-box'),
			'',
			'',
		])
		expect(row.querySelector(':scope > div > .so-select')).not.toBe(null)
		expect(row.querySelector(':scope > div > .so-table__viewport')).not.toBe(null)
		expect(all(node, '.so-list-box-item')).toHaveLength(50)

		// Open the Select by its arrow and close it again
		const arrow = row.querySelector('.so-select .so-select__arrow')

		if (!(arrow instanceof HTMLElement)) throw new Error('стрелки Select нет')

		await nextFrame()
		arrow.click()
		await nextFrame()
		arrow.click()
		await nextFrame()

		expect(all(document.body, '.so-select__list > .so-select-item')).toHaveLength(50)
		expect(all(node, '.so-table-row')).toHaveLength(50)
		expect(() => handle.update({ nothing: true })).toThrow('нет входов: nothing')

		handle.unmount()

		expect(node.childNodes).toHaveLength(0)
	})

	/**
	 * Перестановка — тоже директива на `<ng-container>`: ряд с тремя
	 * коллекциями стоит прямо в разметке превью, а их элементы перетаскиваются —
	 * узлы элементов плагин получает через кадр.
	 */
	it('перестановка: ряд — прямо в разметке превью, элементы коллекций перетаскиваются', async () => {
		const node = stage()
		const handle = host.mount(node, {
			component: 'drag-and-drop',
			props: {},
			onEvent: () => {},
		})
		const row = node.querySelector('pg-drag-and-drop-preview > div')

		if (!(row instanceof HTMLElement)) throw new Error('ряда нет')

		await nextFrame()

		expect(textsOf(row, '.so-tabs-item')).toEqual(TEXTS)
		expect(textsOf(row, '.so-list-box-item')).toEqual(TEXTS)
		expect(textsOf(row, '.so-accordion-item .so-accordion-item__header')).toEqual(TEXTS)
		expect(
			all(row, '.so-tabs-item, .so-list-box-item, .so-accordion-item').map((item) =>
				item.getAttribute('draggable'),
			),
		).toEqual(Array.from({ length: TEXTS.length * 3 }, () => 'true'))

		handle.unmount()

		expect(node.childNodes).toHaveLength(0)
	})

	/**
	 * Триггер меню — шаблон слота, а пункты — частями разметки, как у Vue:
	 * превью своим шаблоном. Пропсы оболочки уходят входам превью и дальше меню,
	 * выходы хост слушает у меню в нём. Пункты входят в коллекции своих меню — в
	 * панели меню и в панелях подменю, увезённых в `body`, — а снятое превью
	 * уносит все панели.
	 */
	it('меню: пункты разметкой — в панелях меню и подменю, пропсы — меню, выходы — у него', async () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'menu',
			props: { size: 'lg' },
			onEvent: (name) => events.push(name),
		})
		const trigger = triggerIn(node, '.so-menu')
		const panel = linked(trigger, 'aria-controls')

		expect(trigger.textContent?.trim()).toBe('Действия')
		expect(panel.parentElement).toBe(document.body)
		expect(panel.classList).toContain('so-menu__panel--size-lg')
		expect(panel.style.display).toBe('none')
		// Items are inserted with the panel's first opening
		expect(all(panel, '[role^="menuitem"]')).toHaveLength(0)

		handle.update({ size: 'lg', open: true })

		expect(panel.style.display).toBe('')
		expect(trigger.getAttribute('aria-expanded')).toBe('true')
		expect(events).toContain('change:open')

		const [share] = all(panel, '[aria-haspopup="menu"]')
		const submenu = linked(share, 'aria-controls')

		expect(textsOf(panel, '.so-menu-group__label')).toEqual(['Вид', 'Сортировка'])
		expect(textsOf(panel, '[role^="menuitem"] .so-button__text')).toEqual([
			'Сетка',
			'Линейка',
			'По имени',
			'По дате',
			'Изменить',
			'Дублировать',
			'Поделиться',
			'Срок',
			'В архив',
			'Удалить',
		])
		// The submenu's items — with its own first opening
		expect(all(submenu, '[role="menuitem"]')).toHaveLength(0)

		share.click()
		await nextFrame()

		expect(textsOf(submenu, '[role="menuitem"]')).toEqual(['Ссылка', 'Почта', 'Мессенджеры'])
		expect(() => handle.update({ nothing: true })).toThrow('нет входов: nothing')

		handle.unmount()

		expect(node.childNodes).toHaveLength(0)
		expect(document.querySelector('.so-menu__panel, .so-menu-item__panel')).toBe(null)
	})

	/**
	 * Пришли данные — превью рисует меню из них, без пунктов разметки: пресет
	 * строки `groupSeparators` отдаёт состав с группами, и линии стоят между
	 * секциями, пока их просит строка. У контекстного меню в слоте — область,
	 * нативная кнопка, как у Vue: в обходе Tab без `tabindex`, со своими ролью
	 * и именем, — а связки с меню у неё нет.
	 */
	it('меню из данных: пресет groupSeparators — группы с линиями; контекстное — область в слоте', () => {
		const node = stage()
		const preset = presetForProp('menu', 'groupSeparators')
		const handle = host.mount(node, { component: 'menu', props: preset })
		const panel = linked(triggerIn(node, '.so-menu'), 'aria-controls')

		// Items from data are drawn with the panel's first opening
		handle.update({ ...preset, open: true })

		expect(textsOf(panel, '.so-menu-group__label')).toEqual(['Фрукты', 'Овощи'])
		expect(all(panel, '.so-menu-separator')).toHaveLength(2)

		handle.update({ ...preset, open: true, groupSeparators: false })

		expect(all(panel, '.so-menu-separator')).toHaveLength(0)

		handle.update({ ...preset, openOn: 'contextmenu' })

		const area = node.querySelector('.so-menu > button[type="button"]')

		expect(area?.textContent?.trim()).toBe('Правая кнопка, долгое касание или Shift+F10')
		expect(area?.hasAttribute('tabindex')).toBe(false)
		expect(area?.hasAttribute('aria-haspopup')).toBe(false)
		expect(node.querySelector('.so-menu > .so-button')).toBe(null)
		expect(panel.hasAttribute('aria-labelledby')).toBe(false)

		handle.unmount()
	})

	it('подсказка: ссылка триггера ведёт на панель с текстом, open — входом превью', () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'tooltip',
			props: {},
			onEvent: (name) => events.push(name),
		})
		const trigger = triggerIn(node, '.so-tooltip')
		const panel = linked(trigger, 'aria-describedby')

		expect(trigger.textContent?.trim()).toBe('Наведи')
		expect(panel.parentElement).toBe(document.body)
		expect(panel.getAttribute('role')).toBe('tooltip')
		expect(textsOf(panel, '.so-tooltip__content')).toEqual(['Короткое пояснение к кнопке'])
		expect(panel.style.display).toBe('none')

		handle.update({ open: true, type: 'label' })

		expect(panel.style.display).toBe('')
		expect(linked(trigger, 'aria-labelledby')).toBe(panel)
		expect(events).toEqual(expect.arrayContaining(['change:open', 'change:type']))

		handle.unmount()

		expect(node.childNodes).toHaveLength(0)
		expect(panel.isConnected).toBe(false)
	})
})

/**
 * The panel content of the popover preview and the calendar of the menu item
 * with a panel are `default` templates, as the slots of the Vue previews: with
 * `lazyMount` their components come with the first open of the panel. A
 * projection Angular creates right away, and `lazyMount` would only keep it
 * out of the document — the page would weigh what Vue does not. Whether a
 * component is created, a probe plugin on its class sees: it counts its own
 * `install`.
 */
describe('хост Angular · содержимое панели с lazyMount', () => {
	/** Registrations of the probe — cancelled after the test. */
	const disposals: (() => void)[] = []

	afterEach(() => {
		for (const dispose of disposals.splice(0)) dispose()
	})

	/** Count the assemblies of the components of `type` from now on. */
	function countAssemblies(type: Parameters<typeof usePlugins>[0]): () => number {
		let installed = 0

		class TAssemblyProbePlugin extends TBasePlugin {
			override install(ctx: IPluginContext, options?: unknown): void {
				super.install(ctx, options)

				installed++
			}
		}

		disposals.push(usePlugins(type, [TAssemblyProbePlugin]))

		return () => installed
	}

	it('поповер: кнопка содержимого собирается с первым открытием', () => {
		// The trigger and the button of the content; the close button is a detail
		const assembled = countAssemblies(TButton)
		const node = stage()
		const handle = host.mount(node, { component: 'popover', props: { lazyMount: true } })
		const panel = linked(triggerIn(node, '.so-popover'), 'aria-controls')

		expect(assembled()).toBe(1)
		expect(textsOf(panel, '.so-popover__content > *')).toEqual([])

		handle.update({ lazyMount: true, open: true })

		expect(assembled()).toBe(2)
		expect(textsOf(panel, '.so-popover__content > *')).toEqual([
			'Произвольное содержимое: текст, поля, кнопки',
			'Действие',
		])

		handle.unmount()
	})

	it('меню: календарь пункта с панелью собирается с первым открытием панели', async () => {
		const assembled = countAssemblies(TCalendar)
		const node = stage()
		const handle = host.mount(node, { component: 'menu', props: { open: true } })
		const panel = linked(triggerIn(node, '.so-menu'), 'aria-controls')
		const [due] = all(panel, '[aria-haspopup="dialog"]')

		if (!due) throw new Error('строки пункта с панелью нет')

		const duePanel = linked(due, 'aria-controls')

		expect(assembled()).toBe(0)
		expect(duePanel.querySelector('.so-calendar')).toBe(null)

		// The application checks its own state on its own tick
		due.click()
		await nextFrame()

		expect(assembled()).toBe(1)
		expect(duePanel.querySelector('.so-calendar')).not.toBe(null)

		handle.unmount()
	})
})

describe('хост Angular · рамка', () => {
	/**
	 * The table is in a frame: markup without a component, with a style from the
	 * shell's props, as the `div` around Table in Vue and React. The rows and
	 * columns are the preview's data, and the row's props go over them: with a
	 * sticky head the table has forty rows of its own, and the frame is a scroll
	 * window. A change of the prop changes both on the same table.
	 */
	it('таблица — в рамке: данные превью под пропсами строки, рамка идёт за пропсом', () => {
		const node = stage()
		const handle = host.mount(node, { component: 'table', props: {} })
		const viewport = node.querySelector('.so-table__viewport')
		const frame = viewport?.parentElement

		if (!(frame instanceof HTMLElement)) throw new Error('рамки нет')

		expect(viewport?.querySelector(':scope > table.so-table')).not.toBe(null)
		expect(frame.style.width).toBe('100%')
		expect(frame.style.overflow).toBe('')
		expect(all(node, '.so-table-row')).toHaveLength(TABLE_ROWS.length)
		expect(all(node, '.so-table-column').map((header) => header.textContent?.trim())).toEqual(
			TABLE_COLUMNS.map((column) => column.text),
		)

		handle.update({ stickyHead: true })

		expect(node.querySelector('.so-table__viewport')?.parentElement).toBe(frame)
		expect(frame.style.height).toBe('320px')
		expect(frame.style.overflow).toBe('auto')
		expect(all(node, '.so-table-row')).toHaveLength(TABLE_SCROLL_ROWS.length)
		expect(node.querySelector('table.so-table')?.getAttribute('data-sticky-head')).toBe('true')

		handle.unmount()

		expect(node.childNodes).toHaveLength(0)
	})
})

describe('хост Angular · копии', () => {
	/**
	 * The copies are views of one template of the preview, stamped by the host
	 * before their assembly: the host listens to the component of each copy, and
	 * the props of the shell reach them all.
	 */
	it('выходы — у компонента каждой копии, пропсы — всем', () => {
		const node = stage()
		const events: string[] = []
		const handle = host.mount(node, {
			component: 'check-box',
			props: {},
			onEvent: (name) => events.push(name),
			count: 3,
		})
		const inputs = all(node, '.so-check-box > input')

		expect(textsOf(node, '.so-label__text')).toEqual(['Согласен', 'Согласен', 'Согласен'])

		handle.update({ value: true })

		expect(inputs.map((input) => input instanceof HTMLInputElement && input.checked)).toEqual([
			true,
			true,
			true,
		])
		expect(events.filter((name) => name === 'change:value')).toHaveLength(3)

		handle.unmount()

		expect(node.childNodes).toHaveLength(0)
	})

	/**
	 * The open state of a dialog is the copy's own (`pg-copy-state`): the button
	 * of one copy opens its own dialog, not all of them.
	 */
	it('окно у каждой копии своё', async () => {
		const node = stage()
		const handle = host.mount(node, { component: 'dialog', props: {}, count: 2 })
		const dialogs = all(document.body, '.so-dialog')

		expect(dialogs).toHaveLength(2)

		all(node, '.so-button')[1]?.click()
		await nextFrame()

		expect(dialogs.map((dialog) => dialog.style.display)).toEqual(['none', ''])

		handle.unmount()

		expect(document.querySelector('.so-dialog')).toBe(null)
	})
})
