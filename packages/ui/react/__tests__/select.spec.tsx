/**
 * Select в React — проводка целиком, на настоящей разметке.
 *
 * Юнит-тесты ядра и плагинов проверяют механизмы по отдельности; здесь важно,
 * что они сходятся: опции входят в коллекцию лифтом, панель телепортирована и
 * связана с полем, ARIA собирается в один набор. Сценарии — те же, что у Vue
 * (`select.spec`, `select-filter`, Select из `list-groups`, `list-indicator`,
 * `item-slots`, `item-control-attrs`, `styling-state`, `engine-prop` и слот
 * `tags` из `tags-overflow`) и Solid (`select.spec.tsx`); `v-model` Vue здесь
 * — колбэки `onChange*`.
 *
 * Своё у React — панель, вложенные экземпляры и момент входа. Панель — портал
 * Frame: опции стоят в ней, портал React контекст сохраняет, и они читают лифт
 * Select и входят в его коллекцию при коммите. На сервере портала нет —
 * панели и опций разметкой в серверной разметке нет, а Select из `items`
 * сервер рисует с текстом выбранного и тегами. Поле и ряд тегов — компоненты
 * над экземплярами, которые Select берёт у своей сборки (`field`, `tags`), и
 * пересобранный Select (StrictMode) ставит их над новыми экземплярами. Между
 * перерисовками поле, ряд тегов и опции — те же узлы: React сверяет разметку
 * по типу и ключу. Отсюда группа «React»: StrictMode, сервер и гидратация.
 * Обновления — внутри `act`: событие, сменившее состояние мимо него, роняет
 * тест сторожем консоли.
 */

import { describe, it, expect, expectTypeOf, vi, afterEach } from 'vitest'
import { StrictMode, act, useState, type ReactElement, type ReactNode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import {
	TSelect,
	createEngine,
	createEngineSelect,
	type IInput,
	type ISelectItem,
	type ITags,
	type ITagsItem,
	type TGroupSection,
	type TSelectCollection,
	type TSelectPlacement,
	type TTagsCollection,
} from '@soxa-ui/core'
import { TAnchorPlugin, ruRU } from '@soxa-ui/plugins'
import {
	LocaleProvider,
	Select,
	SelectGroup,
	SelectItem,
	Tags,
	type SelectGroupProps,
	type SelectItemProps,
	type SelectProps,
} from '@soxa-ui/react'
import { find, mount, nextFrame, track, type TMounted } from './mount'

afterEach(() => {
	vi.restoreAllMocks()
})

/** Пропсы Select и опции разметки — пропсы каждого `Select.Item`. */
type THarness = {
	select?: SelectProps
	items?: SelectItemProps[]
}

/** По умолчанию — три города, «Тула» выключена, как `Select.test.vue` у Vue. */
const CITIES: SelectItemProps[] = [
	{ value: 'msk', text: 'Москва' },
	{ value: 'tver', text: 'Тверь' },
	{ value: 'tula', text: 'Тула', disabled: true },
]

/**
 * Select с опциями разметки, имя поля «Город». Опции — по пропсам из `items`,
 * по месту (ключ — номер): смена пропсов опции — смена пропсов того же
 * компонента.
 */
function view({ select = {}, items = CITIES }: THarness): ReactElement {
	return (
		<Select name="Город" {...select}>
			{items.map((item, index) => (
				<Select.Item key={index} {...item} />
			))}
		</Select>
	)
}

/** Select с опциями разметки, пропсы — один раз. */
const draw = (harness: THarness = {}) => mount(view(harness))

/** Select с опциями разметки и перерисовка родителя с новыми пропсами. */
function drawLive(initial: THarness): TMounted & { setView: (next: THarness) => void } {
	const mounted = mount(view(initial))

	return { ...mounted, setView: (next) => mounted.render(view(next)) }
}

/** Снять нарисованное: следующий тест в том же `it` рисует заново. */
const unmount = (mounted: TMounted) => mounted.render(<></>)

/** Scope слотов: строки опции, проброса строки и проброса без своего scope. */
type TRowScope = { text: string; selected: boolean }
type TItemRowScope = TRowScope & { item: ISelectItem }
type TItemScope = { item: ISelectItem }

/** Scope слота `tags`: инстанс тегов и его коллекция. */
type TTagsScope = { tags: ITags; engine: TTagsCollection }

/** Движок так, как его видит тест: состав, отбор и выбор. */
type TEngineView = {
	extensions: {
		batch: { items: ReadonlyArray<{ readonly value: unknown }> }
		filter: { query: string; fields: readonly string[]; clear(): void }
		selection: { selectedCount: number; isSelected(item: object): boolean }
	}
}

/** Поле комбобокса — `<input>` внутри Select; фокус всегда на нём. */
const field = (scope: ParentNode = document) =>
	find(scope, '.so-select__field input', HTMLInputElement)

/** Панель телепортирована в `body` — ищется по документу. */
const panel = () => find(document, '.so-select__panel', HTMLElement)

/** Открыта ли панель: она всегда в документе и скрывается через `display: none`. */
const isOpen = (element: HTMLElement = panel()) => element.style.display !== 'none'

/** Список панели — узел с `role="listbox"`. */
const list = () => find(document, '.so-select__list', HTMLElement)

/** Строки опций — носители роли, выбора и `id`. */
const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')]

/** Строка опции по месту; нет её — тест падает здесь. */
function optionAt(index: number): HTMLElement {
	const option = options()[index]

	if (!option) throw new Error(`опции №${index} нет`)

	return option
}

const texts = () => options().map((option) => option.textContent?.trim())

/** Показанные опции разметки — те, что не скрыты `visible` на корне опции. */
const visibleTexts = () =>
	[...document.querySelectorAll<HTMLElement>('.so-select-item')]
		.filter((option) => option.style.display !== 'none')
		.map((option) => option.textContent?.trim())

const selection = () => options().map((option) => option.getAttribute('aria-selected'))

/** Клик меняет состояние компонентов — внутри `act`. */
function click(target: HTMLElement): void {
	act(() => target.click())
}

/** Клавиша на поле — как её шлёт браузер: всплывает и отменяется. */
function press(key: string, target: Element = field()): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

	act(() => {
		target.dispatchEvent(event)
	})

	return event
}

/** Набрать текст в поле так, как это делает пользователь. */
function type(value: string): void {
	act(() => {
		field().value = value
		field().dispatchEvent(new Event('input', { bubbles: true }))
	})
}

/** Нажатие мышью — `pointerdown`, как его слушает плагин оверлея. */
function pointerDown(target: Element): void {
	act(() => {
		target.dispatchEvent(
			new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
		)
	})
}

/**
 * Смонтировать Select и дождаться кадра: корень плагины получают через
 * `requestAnimationFrame`, и клик, клавиши и «мимо» слушаются с него.
 */
async function render(harness: THarness = {}): Promise<TMounted> {
	const mounted = draw(harness)

	await nextFrame()

	return mounted
}

/** Открыть кликом по полю: select-only тумблит панель кликом по корню. */
async function open(): Promise<void> {
	click(field())
	await nextFrame()
}

/**
 * Options from data are drawn from the panel's first opening on: open the
 * panel with its arrow — it opens in `editable` too — and close it again. The
 * Select is closed, as before, and its options are in the document.
 */
async function openOnce(): Promise<void> {
	const arrow = find(document, '.so-select__arrow', HTMLElement)

	click(arrow)
	await nextFrame()
	click(arrow)
	await nextFrame()
}

/** Движок из `engine:create`: его колбэк — проп компонента. */
function engineProbe(): {
	readonly onEngineCreate: (engine: TEngineView) => void
	readonly engine: () => TEngineView
} {
	let created: TEngineView | undefined

	return {
		onEngineCreate: (engine) => {
			created = engine
		},
		engine: () => {
			if (!created) throw new Error('engine:create не пришёл')

			return created
		},
	}
}

/** Микрозадачи: `engine:create` и `anchor:create` движок и плагин объявляют на них. */
async function flush(): Promise<void> {
	await act(async () => {})
}

/** Узлы сверяются по ссылке: `toEqual` сравнил бы узлы по разметке. */
function expectNodes(actual: readonly Element[], expected: readonly Element[]): void {
	expect(actual).toHaveLength(expected.length)
	expected.forEach((node, index) => expect(actual[index]).toBe(node))
}

const ITEMS = [
	{ value: 'a', text: 'Первый' },
	{ value: 'b', text: 'Второй' },
	{ value: 'c', text: 'Третий' },
	{ value: 'd', text: 'Четвёртый' },
]

describe('составной компонент', () => {
	it('Select.Item — это SelectItem, Select.Group — SelectGroup', () => {
		expect(Select.Item).toBe(SelectItem)
		expect(Select.Group).toBe(SelectGroup)
		expectTypeOf(Select.Item).toEqualTypeOf<typeof SelectItem>()
		expectTypeOf(Select.Group).toEqualTypeOf<typeof SelectGroup>()
	})
})

describe('поле', () => {
	it('объявлено как combobox и свёрнуто', () => {
		draw()

		expect(field().getAttribute('role')).toBe('combobox')
		expect(field().getAttribute('aria-expanded')).toBe('false')
		expect(field().getAttribute('aria-haspopup')).toBe('listbox')
	})

	it('required пробрасывается в aria-required на combobox', () => {
		draw({ select: { required: true } })

		expect(field().getAttribute('aria-required')).toBe('true')
	})

	it('без required aria-required нет', () => {
		draw()

		expect(field().hasAttribute('aria-required')).toBe(false)
	})

	it('select-only: поле readonly нативно, aria-readonly рядом не дублирует', () => {
		draw()

		expect(field().hasAttribute('readonly')).toBe(true)
		expect(field().hasAttribute('aria-readonly')).toBe(false)
	})

	it('editable: поле не readonly, aria-autocomplete="list"', () => {
		draw({ select: { editable: true } })

		expect(field().hasAttribute('readonly')).toBe(false)
		expect(field().getAttribute('aria-autocomplete')).toBe('list')
	})

	it('editableMode: none тоже объявляет aria-autocomplete="list"', () => {
		draw({ select: { editable: true, editableMode: 'none' } })

		expect(field().getAttribute('aria-autocomplete')).toBe('list')
	})

	/**
	 * Сними панель из дерева — и закрытие вычистило бы опции из коллекции, а
	 * вместе с ними значение поля.
	 */
	it('пока закрыто, панель скрыта — но остаётся в документе', () => {
		draw()

		expect(document.querySelector('[role="listbox"]')).not.toBeNull()
		expect(isOpen()).toBe(false)
	})

	it('клик открывает панель', async () => {
		await render()
		await open()

		expect(field().getAttribute('aria-expanded')).toBe('true')
		expect(isOpen()).toBe(true)
	})

	it('ссылается на список — и список этот id носит', async () => {
		await render()
		await open()

		expect(field().getAttribute('aria-controls')).toBe(list().id)
		expect(list().id).not.toBe('')
	})

	it('id по умолчанию нет, заданный — доходит до поля', () => {
		const first = draw()

		expect(field().hasAttribute('id')).toBe(false)

		unmount(first)
		draw({ select: { id: 'city' } })

		expect(field().id).toBe('city')
	})

	it('в корне — поле, панель телепортирована', () => {
		const { root } = draw()

		expect(root().firstElementChild?.classList.contains('so-select__field')).toBe(true)
		expect(root().querySelector('.so-select__panel')).toBeNull()
	})
})

describe('опции', () => {
	it('входят в коллекцию лифтом и получают роль', async () => {
		await render()
		await open()

		expect(options()).toHaveLength(3)
		expect(texts()).toEqual(['Москва', 'Тверь', 'Тула'])
	})

	/**
	 * Поле ссылается на подсвеченную опцию по `id`, а стоит он на строке опции
	 * вместе со всей её ARIA: ссылка обязана находить узел с ролью.
	 */
	it('aria-activedescendant указывает на узел с role="option"', async () => {
		await render()

		press('ArrowDown')
		await nextFrame()

		const id = field().getAttribute('aria-activedescendant')

		expect(id).toBeTruthy()
		expect(document.getElementById(id ?? '')?.getAttribute('role')).toBe('option')
	})

	it('aria-selected стоит на всех, а не только на выбранной', async () => {
		await render()
		await open()

		expect(options().every((option) => option.hasAttribute('aria-selected'))).toBe(true)
	})

	it('клик по опции выбирает её и закрывает панель', async () => {
		await render()
		await open()

		click(optionAt(1))

		expect(field().value).toBe('Тверь')
		expect(field().getAttribute('aria-expanded')).toBe('false')
		expect(selection()).toEqual(['false', 'true', 'false'])
	})

	it('выключенная опция кликом не выбирается', async () => {
		await render()
		await open()

		click(optionAt(2))

		expect(field().value).toBe('')
		expect(selection()).toEqual(['false', 'false', 'false'])
	})

	/**
	 * Фон подсветки и выбора тема рисует на `.so-button` опции и читает
	 * `data-*` с неё: набор доезжает и до корня опции, и до её строки.
	 */
	it('состояние для темы — data-* на корне опции и на её строке, вида в разметке нет', async () => {
		await render()
		await open()

		click(optionAt(0))

		const roots = [...document.querySelectorAll('.so-select-item')]

		expect(roots.map((root) => root.getAttribute('data-selected'))).toEqual([
			'true',
			'false',
			'false',
		])
		expect(optionAt(0).getAttribute('data-selected')).toBe('true')
		expect(optionAt(0).className).not.toMatch(/--view-/)
		expect(roots.map((root) => root.getAttribute('data-disabled'))).toEqual([
			'false',
			'false',
			'true',
		])
		expect(optionAt(2).getAttribute('data-disabled')).toBe('true')
	})

	/**
	 * Строка Select — сама опция: набор опции ложится поверх того, что
	 * `Button` пишет себе сам. Узел с ролью один — корень ничего не объявляет,
	 * строка не объявляет себя кнопкой; строка — `span` без нативного
	 * `disabled`, и `aria-disabled` у неё единственный способ сказать о
	 * выключенности.
	 */
	it('строка и есть опция: роль, id и aria-selected — на ней, корень без ARIA', () => {
		draw({ items: [{ value: 'a', text: 'A', disabled: true }] })

		const row = find(document, '.so-select-item .so-button', HTMLElement)
		const root = find(document, '.so-select-item', HTMLElement)

		expect(row.tagName).toBe('SPAN')
		expect(row.getAttribute('role')).toBe('option')
		expect(row.id).toMatch(/-option$/)
		expect(row.getAttribute('aria-selected')).toBe('false')
		expect(row.getAttribute('aria-disabled')).toBe('true')
		expect(row.hasAttribute('disabled')).toBe(false)
		expect(row.getAttribute('tabindex')).toBe('-1')
		expect(document.querySelectorAll('.so-select-item [role="button"]')).toHaveLength(0)

		for (const name of ['role', 'id', 'aria-selected', 'aria-disabled', 'disabled']) {
			expect(root.hasAttribute(name), name).toBe(false)
		}
	})

	it('корень опции рисуется по tag, строка остаётся span', () => {
		draw({ items: [{ value: 'a', text: 'A', disabled: true, tag: 'fieldset' }] })

		const root = find(document, '.so-select-item', HTMLElement)
		const row = find(root, '.so-button', HTMLElement)

		expect(root.tagName).toBe('FIELDSET')
		expect(root.hasAttribute('disabled')).toBe(true)
		expect(row.tagName).toBe('SPAN')
		expect(row.getAttribute('aria-disabled')).toBe('true')
	})

	it('класс и стиль потребителя — корню опции, остальное — строке; клик потребителя выбора не отменяет', async () => {
		const onClick = vi.fn()

		await render({
			items: [
				{
					value: 'a',
					text: 'A',
					className: 'mine',
					style: { color: 'red' },
					title: 'Строка',
					onClick,
				},
			],
		})
		await open()

		const root = find(document, '.so-select-item', HTMLElement)
		const row = find(root, '[role="option"]', HTMLElement)

		expect(root.classList.contains('mine')).toBe(true)
		expect(root.style.color).toBe('red')
		expect(row.classList.contains('mine')).toBe(false)
		expect(row.getAttribute('title')).toBe('Строка')

		click(row)

		expect(onClick).toHaveBeenCalledTimes(1)
		expect(field().value).toBe('A')
	})

	it('клик потребителя по опции — после выбора, как у ListBox; stopPropagation выбор не отменяет', async () => {
		const order: string[] = []

		await render({
			select: { onChangeValue: () => order.push('выбор') },
			items: [
				{
					value: 'a',
					text: 'A',
					onClick: (event) => {
						order.push('клик')
						event.stopPropagation()
					},
				},
			],
		})
		await open()

		click(find(document, '[role="option"]', HTMLElement))

		expect(order).toEqual(['выбор', 'клик'])
		expect(field().value).toBe('A')
	})
})

/**
 * Между перерисовками поле, его обёртки, ряд тегов и опции — те же узлы:
 * React сверяет разметку по типу и ключу, а ключ поля и ряда — их экземпляр,
 * который за жизнь сборки не меняется. Открытие, выбор и отбор их не
 * пересоздают — фокус остаётся на поле, а узел опции, на который ссылается
 * `aria-activedescendant`, — тем же.
 */
describe('узлы — те же', () => {
	it('опции разметкой: поле и опции — те же узлы после открытия, выбора и отбора', async () => {
		await render({ select: { editable: true, editableMode: 'filter' } })

		const input = field()
		const box = find(document, '.so-select__field', HTMLElement)
		const nodes = [...document.querySelectorAll('.so-select-item')]
		const before = panel()

		act(() => input.focus())
		await open()
		click(optionAt(1))

		expect(field().value).toBe('Тверь')

		await open()
		type('Мос')

		expect(visibleTexts()).toEqual(['Москва'])
		expect(field()).toBe(input)
		expect(find(document, '.so-select__field', HTMLElement)).toBe(box)
		expect(panel()).toBe(before)
		expectNodes([...document.querySelectorAll('.so-select-item')], nodes)
		expect(document.activeElement).toBe(input)
	})

	it('опции из items: поле и опции — те же узлы после открытия и выбора; отбор оставляет совпавшую', async () => {
		mount(<Select items={ITEMS} editable editableMode="filter" />)
		await nextFrame()

		const input = field()

		await openOnce()

		const nodes = [...document.querySelectorAll('.so-select-item')]

		expect(nodes).toHaveLength(4)

		await open()
		click(optionAt(2))
		await open()

		expect(field()).toBe(input)
		expectNodes([...document.querySelectorAll('.so-select-item')], nodes)

		type('тре')

		expect(texts()).toEqual(['Третий'])
		expect(document.querySelector('.so-select-item')).toBe(nodes[2])
		expect(field()).toBe(input)
	})

	it('multiple: теги встают в поле, а поле и ряд тегов — те же узлы', async () => {
		await render({ select: { mode: 'multiple' } })

		const input = field()
		const row = find(document, '.so-select__tags', HTMLElement)

		await open()
		click(optionAt(0))
		click(optionAt(1))

		expect(document.querySelectorAll('.so-select__tags .so-tags-item')).toHaveLength(2)
		expect(field()).toBe(input)
		expect(find(document, '.so-select__tags', HTMLElement)).toBe(row)
	})
})

/**
 * Options from data are mounted from the panel's first opening on: a closed
 * Select nobody opened is its field and an empty list. The closed field needs
 * none of their nodes — the selected text comes from the collection, and the
 * field refers to the list, which is always there. Closing only hides them.
 * Options in markup enter the collection only mounted — they are there from
 * the start.
 */
describe('опции из данных — с первого открытия', () => {
	const CITY_ITEMS = [
		{ value: 'msk', text: 'Москва' },
		{ value: 'tver', text: 'Тверь' },
	]

	it('закрытый — текст выбранного и список с id без опций; открыли — опции есть, закрыли — те же', async () => {
		mount(<Select items={CITY_ITEMS} value="tver" />)
		await nextFrame()

		expect(field().value).toBe('Тверь')
		expect(list().id).not.toBe('')
		expect(field().getAttribute('aria-controls')).toBe(list().id)
		expect(options()).toHaveLength(0)

		await open()

		const drawn = options()

		expect(isOpen()).toBe(true)
		expect(texts()).toEqual(['Москва', 'Тверь'])

		await open()

		expect(isOpen()).toBe(false)
		expectNodes(options(), drawn)
	})

	it('опции разметкой — и до первого открытия', () => {
		draw()

		expect(isOpen()).toBe(false)
		expect(texts()).toEqual(['Москва', 'Тверь', 'Тула'])
	})

	it('↓ на закрытом поле открывает панель; ссылка — на подсвеченную, когда опции нарисованы', async () => {
		mount(<Select items={CITY_ITEMS} />)
		await nextFrame()

		press('ArrowDown')
		await nextFrame()

		const id = field().getAttribute('aria-activedescendant') ?? ''

		expect(isOpen()).toBe(true)
		expect(id).not.toBe('')
		expect(document.getElementById(id)?.textContent?.trim()).toBe('Москва')
	})
})

/**
 * Кнопку очистки рисует поле — `Input` внутри Select (`.so-input__clear`):
 * `clearable` Select отдаёт полю, имя кнопке пишет плагин имён самого поля,
 * и своей кнопки у Select нет.
 */
describe('кнопка очистки', () => {
	it('без clearable её нет', () => {
		draw()

		expect(document.querySelector('.so-input__clear')).toBeNull()
	})

	it('кнопка — поля, первой в его слоте у конца, перед стрелкой', () => {
		draw({ select: { clearable: true } })

		const slot = find(document, '.so-select__field > .so-input__trailing', HTMLElement)
		const parts = ['.so-input__clear', '.so-select__arrow']

		expect([...slot.children].map((node) => parts.find((part) => node.matches(part)))).toEqual(
			parts,
		)
		expect(document.querySelector('.so-select__clear')).toBeNull()
	})

	it('имя собрано с именем поля', () => {
		draw({ select: { clearable: true } })

		expect(find(document, '.so-input__clear', HTMLElement).getAttribute('aria-label')).toBe(
			'Clear Город',
		)
	})

	it('строку имени поле берёт от локали поддерева — через Select она не идёт', () => {
		mount(
			<LocaleProvider locale={ruRU}>
				<Select name="Город" clearable />
			</LocaleProvider>,
		)

		expect(find(document, '.so-input__clear', HTMLElement).getAttribute('aria-label')).toBe(
			'Очистить Город',
		)
	})

	it('клик сбрасывает выбранное значение и панель не открывает', async () => {
		await render({ select: { clearable: true } })
		await open()

		click(optionAt(1))

		expect(field().value).toBe('Тверь')
		expect(isOpen()).toBe(false)

		click(find(document, '.so-input__clear', HTMLElement))

		expect(field().value).toBe('')
		expect(selection()).toEqual(['false', 'false', 'false'])
		// Клик кнопки до корня не всплыл: select-only тумблит панель кликом по
		// корню, и очистка открыла бы её
		expect(isOpen()).toBe(false)
	})

	/**
	 * Своя кнопка вместо встроенной берёт `clear` из scope слота и зовёт его
	 * голой функцией: метод, оторванный от поля, не падает.
	 */
	it('своя кнопка в слоте clear снимает выбор функцией из scope', async () => {
		await render({
			select: {
				value: 'tver',
				clear: (scope: { clear: () => void }) => (
					<button className="probe-clear" onClick={() => scope.clear()} />
				),
			},
			items: [
				{ value: 'msk', text: 'Москва' },
				{ value: 'tver', text: 'Тверь' },
			],
		})

		expect(field().value).toBe('Тверь')
		expect(selection()).toEqual(['false', 'true'])

		click(find(document, '.probe-clear', HTMLElement))

		expect(field().value).toBe('')
		expect(selection()).toEqual(['false', 'false'])
	})

	/** Слот Select уходит полю: своя кнопка встаёт на место встроенной и при `clearable`. */
	it('своя кнопка заменяет встроенную целиком и стоит на её месте', () => {
		draw({ select: { clearable: true, clear: <button className="probe-clear" /> } })

		expect(document.querySelector('.so-input__clear')).toBeNull()
		expect(
			document.querySelector('.so-select__field .so-input__trailing > .probe-clear'),
		).not.toBeNull()
	})
})

describe('множественный выбор', () => {
	it('список помечен как multiselectable, в одиночном режиме пометки нет', async () => {
		const first = await render({ select: { mode: 'multiple' } })

		expect(list().getAttribute('aria-multiselectable')).toBe('true')

		unmount(first)
		await render()

		expect(list().hasAttribute('aria-multiselectable')).toBe(false)
	})

	/**
	 * Теги — второй компонент внутри поля (`TSelectTagsExtension`), а не
	 * разметка: связка «опция ⇄ тег» иначе повторилась бы в шести адаптерах.
	 */
	it('выбор рисует тег в поле, а не текст', async () => {
		await render({ select: { mode: 'multiple' } })
		await open()

		click(optionAt(0))

		expect(field().value).toBe('')

		const tags = document.querySelectorAll('.so-select__tags .so-tags-item')

		expect(tags).toHaveLength(1)
		expect(tags[0]?.textContent).toContain('Москва')
	})

	it('закрытие тега снимает выбор с опции и панель не открывает', async () => {
		await render({ select: { mode: 'multiple' } })
		await open()

		click(optionAt(0))
		pointerDown(document.body)
		await nextFrame()

		expect(isOpen()).toBe(false)

		click(find(document, '.so-tags-item__close', HTMLElement))

		expect(document.querySelectorAll('.so-tags-item')).toHaveLength(0)
		expect(optionAt(0).getAttribute('aria-selected')).toBe('false')
		// Клик крестика до корня Select не всплыл: select-only открыл бы панель
		expect(isOpen()).toBe(false)
	})

	it('в single тегов в поле нет', () => {
		draw()

		expect(document.querySelector('.so-select__tags')).toBeNull()
		expect(document.querySelectorAll('.so-tags-item')).toHaveLength(0)
	})

	/**
	 * Инстанс тегов живёт только в `multiple`: смена режима заводит новый или
	 * снимает прежний, и ряд в поле встаёт и уходит вслед за ним, а поле — тот
	 * же узел.
	 */
	it('режим на лету: multiple — ряд тегов в поле, single — ряда нет, поле то же', async () => {
		const { setView } = drawLive({ select: { mode: 'multiple' } })

		await nextFrame()

		const input = field()

		await open()
		click(optionAt(0))

		expect(document.querySelectorAll('.so-select__tags .so-tags-item')).toHaveLength(1)

		setView({ select: { mode: 'single' } })

		expect(document.querySelector('.so-select__tags')).toBeNull()

		setView({ select: { mode: 'multiple' } })

		expect(document.querySelector('.so-select__tags')).not.toBeNull()
		expect(field()).toBe(input)
	})

	/**
	 * Значение — новый массив того же содержимого на перерисовке родителя.
	 * Вход сверяет его с прошлым по содержимому, и снятый пользователем выбор
	 * перерисовка не возвращает.
	 */
	it('тот же по содержимому массив в value не откатывает выбор', async () => {
		const { setView } = drawLive({ select: { mode: 'multiple', value: ['msk', 'tver'] } })

		await nextFrame()

		expect(selection()).toEqual(['true', 'true', 'false'])

		await open()
		click(optionAt(1))

		expect(selection()).toEqual(['true', 'false', 'false'])

		setView({ select: { mode: 'multiple', value: ['msk', 'tver'] } })

		expect(selection()).toEqual(['true', 'false', 'false'])
		expect(document.querySelectorAll('.so-tags-item')).toHaveLength(1)
	})

	/** Чужому движку фасад умолчание не пишет: режим переполнения остаётся движка. */
	it('движок снаружи сохраняет режим переполнения тегов', async () => {
		const engine = createEngineSelect()

		engine.extensions.selection.mode = 'multiple'
		engine.extensions.tags.overflow = 'scroll'

		await render({ select: { engine }, items: [{ value: 'msk', text: 'Москва' }] })

		expect(engine.extensions.tags.overflow).toBe('scroll')
		expect(document.querySelector('.so-select__tags')?.getAttribute('data-overflow')).toBe(
			'scroll',
		)
	})

	/**
	 * Без выбора у строк тегов нет действия: ни остановки, ни фокуса от клика им
	 * не нужно, и `tabindex` у них нет, крестик — нативная остановка. Так и в
	 * поле Select: набор тегов там без выбора.
	 */
	it('теги в поле — без выбора: у строк tabindex нет, крестик — нативная остановка', async () => {
		await render({
			select: { mode: 'multiple', value: ['msk', 'tver'] },
			items: [
				{ value: 'msk', text: 'Москва' },
				{ value: 'tver', text: 'Тверь' },
			],
		})

		const rows = [
			...document.querySelectorAll('.so-select__tags .so-tags-item > .so-button:first-child'),
		]

		expect(rows.map((row) => row.getAttribute('tabindex'))).toEqual([null, null])
		expect(rows.map((row) => row.getAttribute('role'))).toEqual([null, null])
		for (const row of rows) {
			const item = row.parentElement
			expect(item?.getAttribute('role')).toBe('listitem')
			expect(item?.querySelector('.so-tags-item__close')?.closest('[role="listitem"]')).toBe(
				item,
			)
		}
		expect(
			document
				.querySelector('.so-select__tags .so-tags-item__close')
				?.hasAttribute('tabindex'),
		).toBe(false)
	})
})

/**
 * Слот `tags` отдаёт инстанс тегов и его коллекцию — то, что встроенный
 * `Tags` берёт `ctrl` и `engine`. Свой ряд получает связку «опция ⇄ тег»
 * готовой. Ряд — в слое Select, и теги своей раскладки входят в коллекцию
 * своего набора.
 */
describe('слот tags', () => {
	const own = () => find(document, '.own', HTMLElement)
	const ownTexts = () =>
		[...own().querySelectorAll('.so-tags-item')].map((node) => node.textContent?.trim())

	/** Своя раскладка ряда: обёртка `.own` и в ней по `Tags.Item` на тег. */
	const layout = ({ shown }: { shown: ReadonlyArray<ITagsItem> }): ReactNode => (
		<div className="own">
			{shown.map((tag) => (
				<Tags.Item key={tag.uid} ctrl={tag} />
			))}
		</div>
	)

	/** Свой ряд тегов: `Tags` на инстансе и коллекции из scope, в нём — своя раскладка. */
	function drawOwnTags(
		mode: 'single' | 'multiple' = 'multiple',
		onChangeValue?: (value: unknown) => void,
	): void {
		mount(
			<Select
				mode={mode}
				value={mode === 'single' ? 'msk' : ['msk', 'tver']}
				tags={(scope: TTagsScope) => (
					<Tags
						key={scope.tags.uid}
						ctrl={scope.tags}
						engine={scope.engine}
						className="own-tags"
					>
						{layout}
					</Tags>
				)}
				onChangeValue={(event) => onChangeValue?.(event.newValue)}
			>
				<Select.Item value="msk" text="Москва" />
				<Select.Item value="tver" text="Тверь" />
			</Select>,
		)
	}

	it('свой ряд встаёт на место встроенного и получает выбранное тегами', () => {
		drawOwnTags()

		expect(document.querySelector('.so-select__tags')).toBeNull()
		expect(find(document, '.so-select__field .own-tags', HTMLElement).contains(own())).toBe(
			true,
		)
		expect(ownTexts()).toEqual(['Москва', 'Тверь'])
	})

	it('закрытый в своём ряду тег снимает выбор опции', async () => {
		const values: unknown[] = []

		drawOwnTags('multiple', (value) => values.push(value))
		await nextFrame()

		click(find(own(), '.so-tags-item:first-child .so-tags-item__close', HTMLElement))

		expect(ownTexts()).toEqual(['Тверь'])
		expect(values.at(-1)).toEqual(['tver'])
	})

	it('без множественного выбора слота нет: тегов в поле не бывает', () => {
		drawOwnTags('single')

		expect(document.querySelector('.own-tags')).toBeNull()
	})
})

describe('панель как телепортированный Frame', () => {
	it('класс и пометка владельцем доезжают до узла в body', () => {
		const { container } = draw()

		expect(document.body.contains(panel())).toBe(true)
		expect(panel().hasAttribute('data-owner')).toBe(true)
		expect(container.querySelector('.so-select__panel')).toBeNull()
	})

	it('нажатие внутрь панели её не закрывает', async () => {
		await render()
		await open()

		pointerDown(optionAt(0))

		expect(isOpen()).toBe(true)
	})

	it('нажатие мимо закрывает', async () => {
		await render()
		await open()

		pointerDown(document.body)

		expect(isOpen()).toBe(false)
	})

	it('корень несёт data-open для темы, aria-expanded — у поля, а не у корня', async () => {
		const { root } = await render()

		expect(root().getAttribute('data-open')).toBe('false')
		expect(root().hasAttribute('aria-expanded')).toBe(false)

		click(root())

		expect(root().getAttribute('data-open')).toBe('true')
		expect(field().getAttribute('aria-expanded')).toBe('true')
	})

	/** Frame по умолчанию не навязывает панели пиксельную высоту. */
	it('панель без инлайнового height в пикселях, высота списка — за темой', async () => {
		await render()
		await nextFrame()

		expect(panel().style.height).toBe('auto')
		expect(list().style.maxHeight).toBe('')
	})

	it('панель — ниже нижнего края поля', async () => {
		const { root } = await render()

		await open()

		expect(parseFloat(panel().style.top || '0')).toBeGreaterThanOrEqual(
			root().getBoundingClientRect().bottom,
		)
	})
})

describe('слоты поля', () => {
	it('leading и trailing пробрасываются в Input', () => {
		draw({
			select: {
				leading: <i className="probe-leading" />,
				trailing: <i className="probe-trailing" />,
			},
		})

		expect(document.querySelector('.so-input__leading .probe-leading')).not.toBeNull()
		expect(document.querySelector('.so-input__trailing .probe-trailing')).not.toBeNull()
	})

	/** Слоты поля Select отдаёт всегда, как Vue свои шаблоны: обёртки стоят и без тегов. */
	it('обёртки поля по сторонам — и в single без слотов', () => {
		draw()

		expect(document.querySelector('.so-select__field > .so-input__leading')).not.toBeNull()
		expect(
			document.querySelector('.so-select__field > .so-input__trailing > .so-select__arrow'),
		).not.toBeNull()
	})

	/**
	 * Класс на обёртке, а не на иконке: иначе поворот при открытии молча
	 * перестал бы работать для своей иконки.
	 */
	it('стрелка заменяется через arrow-icon и остаётся внутри носителя состояния', () => {
		draw({ select: { 'arrow-icon': <i className="probe-arrow" /> } })

		expect(document.querySelector('.so-select__arrow .probe-arrow')).not.toBeNull()
		expect(document.querySelector('.so-select__arrow svg')).toBeNull()
	})

	it('trailing дополняет кнопку очистки и стрелку, а не заменяет их', () => {
		draw({ select: { clearable: true, trailing: <i className="probe-trailing" /> } })

		expect(document.querySelector('.so-input__clear')).not.toBeNull()
		expect(document.querySelector('.so-select__arrow')).not.toBeNull()
		expect(document.querySelector('.probe-trailing')).not.toBeNull()
	})

	it('переопределённый field получает экземпляр TInput с role combobox в aria', () => {
		draw({
			select: {
				field: (scope: { field: IInput }) => (
					<div className="probe-field">{String(scope.field.aria.get('role'))}</div>
				),
			},
		})

		expect(find(document, '.probe-field', HTMLElement).textContent).toBe('combobox')
		expect(document.querySelector('.so-select__field')).toBeNull()
	})
})

/**
 * Атрибуты потребителя делятся, как у поля: класс и стиль — корню, остальное
 * — `<input>` поля, поверх набора комбобокса.
 */
describe('атрибуты', () => {
	it('aria-label, title и data-* потребителя — на поле, класс и стиль — на корне', () => {
		const { root } = mount(
			<Select
				className="mine"
				style={{ color: 'red' }}
				aria-label="Город доставки"
				title="Подсказка"
				data-probe="yes"
			/>,
		)

		expect([...root().classList].at(-1)).toBe('mine')
		expect(root().style.color).toBe('red')
		expect(field().getAttribute('aria-label')).toBe('Город доставки')
		expect(field().getAttribute('title')).toBe('Подсказка')
		expect(field().getAttribute('data-probe')).toBe('yes')
		expect(root().hasAttribute('aria-label')).toBe(false)
		expect(root().hasAttribute('title')).toBe(false)
		expect(field().hasAttribute('class')).toBe(false)
	})

	/**
	 * Пропсы фасада — `mode`, `items`, `engine` — съедает связка фасада, и
	 * атрибутами в DOM они не уходят.
	 */
	it('пропсы фасада — не атрибуты', () => {
		const { root } = mount(
			<Select mode="multiple" items={ITEMS} engine={createEngineSelect()} />,
		)

		for (const name of ['mode', 'items', 'engine']) {
			expect(root().hasAttribute(name), name).toBe(false)
			expect(field().hasAttribute(name), name).toBe(false)
		}
	})

	it('обработчик потребителя — на поле', () => {
		const targets: EventTarget[] = []

		mount(<Select onKeyUp={(event) => targets.push(event.currentTarget)} />)

		act(() => {
			field().dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true }))
		})

		expect(targets).toHaveLength(1)
		expect(targets[0]).toBe(field())
	})
})

/**
 * Списочные свойства Select — та же тройка, что у ListBox: проп в разметке
 * доезжает до DOM панели и опций.
 */
describe('списочные свойства', () => {
	it('contentFit доезжает до data-content-fit каждой опции, по умолчанию — truncate', async () => {
		const first = await render({ select: { contentFit: 'wrap' } })

		expect(options().map((option) => option.getAttribute('data-content-fit'))).toEqual([
			'wrap',
			'wrap',
			'wrap',
		])

		unmount(first)
		await render()

		expect(optionAt(0).getAttribute('data-content-fit')).toBe('truncate')
	})
})

/**
 * `placement` и `contentFit` Select доходят до плагина якоря вложенного Frame:
 * сторону и ширину считает он. Ядро переводит выбор в `panelPlacement`,
 * `panelFlip` и `autoFitWidth`, разметка только пробрасывает их. Якорь —
 * корень значением рендера: узел приходит после коммита.
 */
describe('плагин якоря панели', () => {
	/** Плагины якоря, которые поставил Frame панели, — по их `install`. */
	function anchorProbe(): () => TAnchorPlugin {
		const install = vi.spyOn(TAnchorPlugin.prototype, 'install')

		return () => {
			const [plugin] = install.mock.contexts

			if (!(plugin instanceof TAnchorPlugin)) throw new Error('плагина якоря нет')

			return plugin
		}
	}

	it('по умолчанию bottom-start, flip включён, ширина — по полю', async () => {
		const plugin = anchorProbe()

		draw()
		await flush()

		expect(plugin().placement).toBe('bottom-start')
		expect(plugin().flip).toBe(true)
		expect(plugin().matchWidth).toBe(true)
		expect(plugin().offset).toBe(4)
	})

	it('contentFit="expand" отвязывает ширину панели от поля', async () => {
		const plugin = anchorProbe()

		draw({ select: { contentFit: 'expand' } })
		await flush()

		expect(plugin().matchWidth).toBe(false)
	})

	it('смена placement на лету доходит до плагина', async () => {
		const plugin = anchorProbe()
		const { setView } = drawLive({ select: { placement: 'top' } })

		await flush()

		const steps: [TSelectPlacement, string, boolean][] = [
			['bottom', 'bottom-start', false],
			['auto', 'bottom-start', true],
			['top', 'top-start', false],
		]

		expect(plugin().placement).toBe('top-start')
		expect(plugin().flip).toBe(false)

		for (const [placement, side, flip] of steps) {
			setView({ select: { placement } })

			expect(plugin().placement, placement).toBe(side)
			expect(plugin().flip, placement).toBe(flip)
		}
	})

	it('якорь панели — корень Select', async () => {
		const plugin = anchorProbe()
		const { root } = draw()

		await flush()

		expect(plugin().anchor).toBe(root())
	})
})

/**
 * Жест — смахнуть панель, чтобы закрыть. Правила жеста проверяет плагин,
 * раскладку и настоящую мышь — браузер. Здесь — проводка: полоса и признак
 * «тянут» на телепортированной панели, а закрытие жестом доходит до
 * `onChangeOpen`.
 */
describe('жест', () => {
	const handle = () => document.querySelector('.so-select__handle')

	/** Указатель мышью в точке по вертикали — как его слушает плагин жеста. */
	function pointer(kind: string, target: Element, y: number): void {
		act(() => {
			target.dispatchEvent(
				new PointerEvent(kind, {
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
		})
	}

	it('без жеста полосы нет; с жестом — первая в панели, вне списка и немая для скринридера', () => {
		const ctrl = new TSelect()

		draw({ select: { ctrl } })

		expect(handle()).toBeNull()
		expect(panel().dataset['swiping']).toBe('false')

		act(() => {
			ctrl.swipe = 'handle'
		})

		expect(handle()).toBe(panel().firstElementChild)
		expect(handle()?.getAttribute('aria-hidden')).toBe('true')
		expect(handle()?.closest('[role="listbox"]')).toBeNull()

		act(() => {
			ctrl.swipe = 'panel'
		})

		expect(handle()).not.toBeNull()
	})

	/**
	 * Коробку панели задаёт тест: jsdom раскладку не считает. Сторону после
	 * flip плагин якоря пишет в панель и в jsdom — под полем. Жест мышью по
	 * полосе вниз — дальше четверти высоты панели. Открытость — состояние
	 * родителя: смена приходит `onChangeOpen`.
	 */
	it('смахнули вниз от поля — закрыта, onChangeOpen видит закрытие, признак «тянут» на панели', async () => {
		const opens: boolean[] = []

		function Page(): ReactNode {
			const [opened, setOpened] = useState<boolean | undefined>(undefined)

			return (
				<Select
					name="Город"
					swipe="handle"
					open={opened}
					onChangeOpen={({ newValue: value }) => {
						opens.push(value)
						setOpened(value)
					}}
				>
					<Select.Item value="msk" text="Москва" />
				</Select>
			)
		}

		mount(<Page />)
		await nextFrame()
		await open()

		expect(isOpen()).toBe(true)
		expect(panel().dataset['placement']).toBe('bottom-start')

		vi.spyOn(panel(), 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 40, 300, 160))

		const grip = handle()

		if (!grip) throw new Error('полосы нет')

		pointer('pointerdown', grip, 45)
		pointer('pointermove', panel(), 125)

		expect(panel().style.getPropertyValue('--so-swipe-offset')).toBe('80px')
		expect(panel().dataset['swiping']).toBe('true')

		pointer('pointerup', panel(), 130)

		expect(isOpen()).toBe(false)
		expect(panel().dataset['swiping']).toBe('false')
		expect(opens).toEqual([true, false])
	})
})

/**
 * Отбор: скрытая опция размонтируется в DOM и при этом остаётся в коллекции —
 * составом владеют данные, а не разметка.
 */
describe('отбор опций из items', () => {
	async function renderSelect(props: SelectProps = {}) {
		const probe = engineProbe()

		mount(<Select items={ITEMS} onEngineCreate={probe.onEngineCreate} {...props} />)
		await flush()
		await nextFrame()
		await openOnce()

		return probe.engine()
	}

	/** Запрос отбора из кода — внутри `act`: он перерисовывает список. */
	function query(engine: TEngineView, text: string): void {
		act(() => {
			engine.extensions.filter.query = text
		})
	}

	it('сужает список на экране, хранилище не трогает', async () => {
		const engine = await renderSelect()

		expect(options()).toHaveLength(4)

		query(engine, 'тре')

		expect(texts()).toEqual(['Третий'])
		expect(engine.extensions.batch.items).toHaveLength(4)
	})

	it('снятие отбора возвращает весь список', async () => {
		const engine = await renderSelect()

		query(engine, 'тре')
		act(() => engine.extensions.filter.clear())

		expect(texts()).toEqual(['Первый', 'Второй', 'Третий', 'Четвёртый'])
	})

	it('отбор по тексту, а не по значению — поле сравнения ставит Select', async () => {
		const engine = await renderSelect()

		expect(options()).toHaveLength(4)
		expect(engine.extensions.filter.fields).toEqual(['text'])

		// 'a' — это value первой опции, но по значению не ищем
		query(engine, 'a')

		expect(options()).toHaveLength(0)
	})

	it('пустой отбор показывает слот empty внутри списка', async () => {
		const engine = await renderSelect({ empty: <p className="probe-empty">Пусто</p> })

		expect(options()).toHaveLength(4)
		expect(document.querySelector('.probe-empty')).toBeNull()

		query(engine, 'ничего такого нет')

		expect(options()).toHaveLength(0)
		expect(find(document, '.probe-empty', HTMLElement).parentElement).toBe(list())
	})

	it('выбор скрытой опции не теряется', async () => {
		const engine = await renderSelect({ value: 'a' })

		query(engine, 'тре')

		expect(texts()).toEqual(['Третий'])
		expect(engine.extensions.selection.selectedCount).toBe(1)

		act(() => engine.extensions.filter.clear())

		const selected = engine.extensions.batch.items.filter((item) =>
			engine.extensions.selection.isSelected(item),
		)

		expect(selected.map((item) => item.value)).toEqual(['a'])
	})
})

/**
 * Ввод в поле — та же механика, только запрос приходит от пользователя:
 * `TEditablePlugin` слушает вложенный `<input>` и пишет `filter.query` сам.
 */
describe('ввод в поле', () => {
	async function renderSelect(props: SelectProps = {}) {
		const probe = engineProbe()

		mount(<Select items={ITEMS} onEngineCreate={probe.onEngineCreate} {...props} />)
		await flush()
		await nextFrame()

		return probe.engine()
	}

	it('editableMode: filter — набранное сужает список', async () => {
		const engine = await renderSelect({ editable: true, editableMode: 'filter' })

		type('тре')

		expect(texts()).toEqual(['Третий'])
		expect(engine.extensions.filter.query).toBe('тре')
		expect(engine.extensions.batch.items).toHaveLength(4)
	})

	it('editableMode: search — список остаётся целым', async () => {
		const engine = await renderSelect({ editable: true, editableMode: 'search' })

		type('тре')

		expect(options()).toHaveLength(4)
		expect(engine.extensions.filter.query).toBe('')
	})

	it('без editable ввод не слушается вовсе', async () => {
		const engine = await renderSelect({ editableMode: 'filter' })

		await openOnce()
		type('тре')

		expect(engine.extensions.filter.query).toBe('')
		expect(options()).toHaveLength(4)
	})

	/**
	 * Двойной Escape: первый закрывает панель и набранное не трогает, второй —
	 * уже на закрытой панели — возвращает поле. Отбор возврат снимает, когда
	 * закрытая панель догасла: переходов jsdom не ведёт, и ожидание кончается
	 * кадром позже; поле возвращается сразу.
	 */
	it('первый Escape закрывает панель, второй — возвращает текст и снимает отбор', async () => {
		const engine = await renderSelect({ editable: true, editableMode: 'filter', value: 'a' })

		type('тре')

		expect(texts()).toEqual(['Третий'])

		press('Escape')

		expect(engine.extensions.filter.query).toBe('тре')
		expect(field().value).toBe('тре')

		press('Escape')

		expect(field().value).toBe('Первый')
		expect(engine.extensions.filter.query).toBe('тре')

		await nextFrame()

		expect(engine.extensions.filter.query).toBe('')
		expect(texts()).toEqual(['Первый', 'Второй', 'Третий', 'Четвёртый'])
		expect(engine.extensions.selection.selectedCount).toBe(1)
		expect(field().value).toBe('Первый')
	})

	it('несовпавший текст, Esc, Esc, ↓ — поле остаётся пустым', async () => {
		await renderSelect({ editable: true })

		type('несуществующий текст')
		press('Escape')
		press('Escape')

		expect(field().value).toBe('')

		press('ArrowDown')

		expect(field().value).toBe('')
	})

	it('multiple: Enter добавляет тег и очищает поле, включая перерисовку', async () => {
		await renderSelect({ editable: true, mode: 'multiple' })

		type('Пер')
		press('Enter')

		expect(field().value).toBe('')
		expect(document.querySelectorAll('.so-tags-item')).toHaveLength(1)
	})

	it('single: Enter на уже выбранной опции возвращает её текст в поле', async () => {
		const engine = await renderSelect({ editable: true, value: 'c' })

		expect(field().value).toBe('Третий')

		type('Тре')
		press('Enter')

		expect(engine.extensions.selection.selectedCount).toBe(1)
		expect(field().value).toBe('Третий')
	})
})

/**
 * Опции разметкой: состав списка принадлежит содержимому, перебрать его
 * коллекция не может, и отбор доезжает до таких опций через их собственный
 * `visible` (`TSelectExtension`).
 */
describe('опции разметки под отбором', () => {
	async function renderMarkup(select: SelectProps = {}) {
		const probe = engineProbe()

		await render({ select: { onEngineCreate: probe.onEngineCreate, ...select }, items: ITEMS })
		await flush()

		return probe.engine()
	}

	it('отбор из кода прячет несовпавшие опции, из коллекции они не уходят', async () => {
		const engine = await renderMarkup()

		expect(visibleTexts()).toHaveLength(4)

		act(() => {
			engine.extensions.filter.query = 'вто'
		})

		expect(visibleTexts()).toEqual(['Второй'])
		expect(engine.extensions.batch.items).toHaveLength(4)

		act(() => engine.extensions.filter.clear())

		expect(visibleTexts()).toEqual(['Первый', 'Второй', 'Третий', 'Четвёртый'])
	})

	it('ввод в поле прячет несовпавшие опции', async () => {
		const engine = await renderMarkup({ editable: true, editableMode: 'filter' })

		type('вто')

		expect(engine.extensions.filter.query).toBe('вто')
		expect(visibleTexts()).toEqual(['Второй'])
	})
})

// Options from data are drawn from the panel's first opening on: the panel is
// open from the start
describe('готовая коллекция', () => {
	it('рисует опции движка уровня 1, добавленное в него — тоже', () => {
		const engine = createEngine<{ value: string; text: string }>({ items: ITEMS.slice(0, 2) })

		mount(<Select engine={engine} open />)

		expect(options()).toHaveLength(2)

		act(() => {
			engine.extensions.batch.set([{ value: 'c', text: 'Третий' }])
		})

		expect(options()).toHaveLength(3)
	})

	/**
	 * Фасад собирается конструктором из тех же пропсов, и `items` он уже
	 * записал: связка, получив те же пропсы в эффекте, второй раз их не пишет.
	 */
	it('items пишется один раз: без очистки и повторного добавления', () => {
		const engine = createEngine<{ value: string; text: string }>()
		let resets = 0
		let added = 0

		engine.extensions.plain.events.on('reset', () => resets++)
		engine.extensions.plain.events.on('item:added', () => added++)

		mount(<Select engine={engine} items={ITEMS} open />)

		expect(resets).toBe(0)
		expect(added).toBe(ITEMS.length)
		expect(options()).toHaveLength(ITEMS.length)
	})
})

/**
 * `indicator` — отметка выбранной опции: сторона одна на весь список, опция
 * читает её у Select.
 */
describe('отметка выбранной опции', () => {
	const marked = () =>
		options().map((option) => option.querySelector('.so-select-item__indicator svg') !== null)

	it('без indicator обёртки нет', () => {
		draw()

		expect(document.querySelectorAll('.so-select-item__indicator')).toHaveLength(0)
	})

	it('обёртка у каждой опции, иконка — у выбранной, обёртка немая', async () => {
		await render({ select: { indicator: 'start' } })

		expect(document.querySelectorAll('.so-select-item__indicator')).toHaveLength(3)
		expect(marked()).toEqual([false, false, false])
		expect(
			document.querySelector('.so-select-item__indicator')?.getAttribute('aria-hidden'),
		).toBe('true')

		await open()
		click(optionAt(1))

		expect(marked()).toEqual([false, true, false])
	})

	it('end уносит отметку в конец строки, start — в начало; смена — на лету', () => {
		/** Сторона отметки относительно текста строки. */
		const sideOf = (option: Element) => {
			const parts = [...option.children]
			const indicator = parts.findIndex((node) =>
				node.classList.contains('so-select-item__indicator'),
			)
			const text = parts.findIndex((node) => node.classList.contains('so-button__text'))

			return indicator < text ? 'start' : 'end'
		}
		const { setView } = drawLive({ select: { indicator: 'end' } })

		expect(sideOf(optionAt(0))).toBe('end')

		setView({ select: { indicator: 'start' } })

		expect(sideOf(optionAt(0))).toBe('start')
	})
})

/**
 * Проброс целиком: у каждого слота опции есть `item-<слот>`, и его scope —
 * scope слота опции плюс сама опция.
 */
describe('слоты опций', () => {
	// Options from data are drawn from the panel's first opening on: the panel
	// is open from the start

	it('item получает text и selected опции, selected следует за выбором', async () => {
		mount(
			<Select
				items={ITEMS.slice(0, 2)}
				open
				item={({ item, text, selected }: TItemRowScope) =>
					`${String(item.value)}:${text}:${String(selected)}`
				}
			/>,
		)
		await nextFrame()

		expect(texts()).toEqual(['a:Первый:false', 'b:Второй:false'])

		click(optionAt(1))

		expect(texts()).toEqual(['a:Первый:false', 'b:Второй:true'])
	})

	/**
	 * Слот, нарисованный опцией заново со сменившимся scope, React сверяет с
	 * прежним: узлы слота переживают выбор, а текст в них новый.
	 */
	it('item, читающий scope в разметке, — те же узлы после выбора', async () => {
		mount(
			<Select
				items={ITEMS.slice(0, 2)}
				open
				item={(scope: TItemRowScope) => (
					<b className="probe">
						{String(scope.item.value)}:{String(scope.selected)}
					</b>
				)}
			/>,
		)
		await nextFrame()

		const probes = [...document.querySelectorAll('.probe')]

		click(optionAt(1))

		expectNodes([...document.querySelectorAll('.probe')], probes)
		expect(probes.map((probe) => probe.textContent)).toEqual(['a:false', 'b:true'])
	})

	it('item-leading и item-trailing получают опцию через scope', () => {
		mount(
			<Select
				items={ITEMS.slice(0, 2)}
				open
				item-leading={({ item }: TItemScope) => (
					<u className="lead">{String(item.value)}</u>
				)}
				item-trailing={({ item }: TItemScope) => (
					<s className="trail">{String(item.value)}</s>
				)}
			/>,
		)

		expect([...document.querySelectorAll('.lead')].map((node) => node.textContent)).toEqual([
			'a',
			'b',
		])
		expect([...document.querySelectorAll('.trail')].map((node) => node.textContent)).toEqual([
			'a',
			'b',
		])
	})

	/**
	 * Пустое, что вернул проброс, опция видит и рисует своё — как у Vue: отметка
	 * одной опции, у остальных — своя иконка.
	 */
	it('item-indicator-icon подменяет отметку одной опции, у остальных — своя', async () => {
		mount(
			<Select
				items={ITEMS.slice(0, 2)}
				open
				mode="multiple"
				indicator="end"
				item-indicator-icon={({ item, selected }: TItemScope & { selected: boolean }) =>
					item.value === 'a' ? <b className="probe">{String(selected)}</b> : null
				}
			/>,
		)
		await nextFrame()

		click(optionAt(0))
		click(optionAt(1))

		expect(
			[...document.querySelectorAll('.so-select-item__indicator')].map((node) =>
				node.querySelector('.probe')
					? 'slot'
					: node.querySelector('svg')
						? 'icon'
						: 'empty',
			),
		).toEqual(['slot', 'icon'])
		expect(find(document, '.probe', HTMLElement).textContent).toBe('true')
	})

	it('children опции разметки получает text и selected, без него — text', async () => {
		await render({
			items: [
				{
					value: 'a',
					text: 'A',
					children: ({ text, selected }: TRowScope) => `${text}:${String(selected)}`,
				},
				{ value: 'b', text: 'B' },
			],
		})

		expect(texts()).toEqual(['A:false', 'B'])

		await open()
		click(optionAt(0))

		expect(texts()).toEqual(['A:true', 'B'])
	})
})

/**
 * Группы из данных — метка `_.group` в `items` или `groupBy`, порядок и
 * подписи — `groups`: список рисует секциями, группа — `Select.Group` с
 * `role="group"` и именем от подписи.
 */
describe('группы из данных', () => {
	/** В данных «Морковь» стоит между фруктами, у «Воды» группы нет. */
	const MIXED = [
		{ value: 'apple', text: 'Яблоко', _: { group: 'fruit' } },
		{ value: 'carrot', text: 'Морковь', _: { group: 'veg' } },
		{ value: 'water', text: 'Вода' },
		{ value: 'pear', text: 'Груша', _: { group: 'fruit' } },
	]

	const GROUPS = [
		{ key: 'fruit', label: 'Фрукты' },
		{ key: 'veg', label: 'Овощи' },
	]

	const SECTIONS = [['Фрукты', ['Яблоко', 'Груша']], ['Овощи', ['Морковь']], 'Вода']

	const SEPARATED = [['Фрукты', ['Яблоко', 'Груша']], '—', ['Овощи', ['Морковь']], '—', 'Вода']

	/**
	 * Части списка по порядку: группа — подписью и текстами её опций,
	 * разделитель — `—`, опция без группы — текстом.
	 */
	const parts = () =>
		[...list().children].map((node) => {
			if (node.classList.contains('so-select-group')) {
				const label =
					node.querySelector('.so-select-group__label')?.textContent?.trim() ?? ''
				const items = [...node.querySelectorAll('.so-select-item')].map((option) =>
					option.textContent?.trim(),
				)

				return [label, items]
			}

			if (node.classList.contains('so-select__separator')) return '—'

			return node.textContent?.trim()
		})

	/** Подсвеченная опция — по ссылке поля. */
	const active = () =>
		document
			.getElementById(field().getAttribute('aria-activedescendant') ?? '')
			?.textContent?.trim()

	// Options from data are drawn from the panel's first opening on: the panel
	// is open from the start where the test looks at them without opening it

	it('группы с подписью, без группы — последними; разделителей по умолчанию нет', async () => {
		mount(<Select items={MIXED} groups={GROUPS} open />)
		await nextFrame()

		expect(parts()).toEqual(SECTIONS)
		expect(list().querySelector('.so-select__separator')).toBeNull()

		for (const group of list().querySelectorAll('.so-select-group')) {
			const label = find(group, '.so-select-group__label', HTMLElement)

			expect(group.getAttribute('role')).toBe('group')
			expect(label.id).not.toBe('')
			expect(group.getAttribute('aria-labelledby')).toBe(label.id)
			expect(label.getAttribute('role')).toBe('presentation')
		}
	})

	it('groupSeparators — немой разделитель только между соседними секциями, и на лету; узлы опций те же', () => {
		const { render: rerender } = mount(
			<Select items={MIXED} groups={GROUPS} groupSeparators={false} open />,
		)

		expect(parts()).toEqual(SECTIONS)

		const before = [...document.querySelectorAll('.so-select-item')]

		rerender(<Select items={MIXED} groups={GROUPS} groupSeparators open />)

		expect(parts()).toEqual(SEPARATED)
		expect(
			[...list().querySelectorAll('.so-select__separator')].map((node) =>
				node.getAttribute('aria-hidden'),
			),
		).toEqual(['true', 'true'])

		rerender(<Select items={MIXED} groups={GROUPS} groupSeparators={false} open />)

		expect(parts()).toEqual(SECTIONS)
		expectNodes([...document.querySelectorAll('.so-select-item')], before)
	})

	it('стрелки подсвечивают опции порядком экрана', async () => {
		mount(<Select items={MIXED} groups={GROUPS} />)
		await nextFrame()

		press('ArrowDown')
		await nextFrame()

		expect(active()).toBe('Яблоко')

		press('ArrowDown')

		expect(active()).toBe('Груша')

		press('ArrowDown')

		expect(active()).toBe('Морковь')
	})

	it('отбор убрал все опции группы — нет и её подписи', async () => {
		mount(<Select items={MIXED} groups={GROUPS} editable editableMode="filter" />)
		await nextFrame()

		type('Морковь')

		expect(parts()).toEqual([['Овощи', ['Морковь']]])
	})
})

/** Секции коротко: подпись группы (`null` — без группы) и значения опций. */
const brief = (sections: ReadonlyArray<TGroupSection<{ readonly value?: unknown }>>) =>
	sections.map(({ group, items }) => [
		group === null ? null : (group.label ?? ''),
		items.map((option) => option.value),
	])

/**
 * Группа разметки входит в группировку коллекции: ключ группы опции внутри
 * берут лифтом, подпись группа регистрирует сама. Панель телепортирована, и
 * лифт Select опции и группа читают в ней — портал React контекст сохраняет.
 */
describe('группы разметки', () => {
	it('секции — группа разметки с подписью; стрелки — порядком экрана', async () => {
		const engine: TSelectCollection = createEngineSelect()

		mount(
			<Select engine={engine}>
				<Select.Item value="water" text="Вода" />
				<Select.Group label="Фрукты">
					<Select.Item value="apple" text="Яблоко" />
					<Select.Item value="pear" text="Груша" />
				</Select.Group>
			</Select>,
		)
		await nextFrame()

		expect(brief(engine.extensions.group.sections)).toEqual([
			[null, ['water']],
			['Фрукты', ['apple', 'pear']],
		])

		const group = find(list(), '.so-select-group', HTMLElement)

		expect(group.getAttribute('role')).toBe('group')
		expect(find(group, '.so-select-group__label', HTMLElement).textContent?.trim()).toBe(
			'Фрукты',
		)

		const visited: unknown[] = []

		for (let step = 0; step < 3; step += 1) {
			press('ArrowDown')
			await nextFrame()
			visited.push(
				document
					.getElementById(field().getAttribute('aria-activedescendant') ?? '')
					?.textContent?.trim(),
			)
		}

		expect(visited).toEqual(['Вода', 'Яблоко', 'Груша'])
	})
})

/**
 * Своё у React: сборка идёт на рендере, опции входят в коллекцию при коммите,
 * якорь панели — корень значением рендера, а портала на сервере нет. Поле и
 * ряд тегов — компоненты над экземплярами сборки Select.
 */
describe('React', () => {
	/**
	 * StrictMode пересобирает Select без `ctrl`: у новой сборки новый TSelect,
	 * а с ним поле и движок с тегами. Поле и ряд тегов встают над экземплярами
	 * новой сборки — выбор пишет текст в видимый `<input>` и тег в видимый ряд,
	 * — и ряд, панель и поле — по одному.
	 */
	it('StrictMode: поле и ряд тегов — над экземплярами текущей сборки, по одному', async () => {
		mount(
			<StrictMode>
				<Select name="Город">
					<Select.Item value="msk" text="Москва" />
					<Select.Item value="tver" text="Тверь" />
				</Select>
			</StrictMode>,
		)
		await nextFrame()
		await open()
		click(optionAt(1))

		expect(field().value).toBe('Тверь')
		expect(selection()).toEqual(['false', 'true'])
		expect(document.querySelectorAll('.so-select__panel')).toHaveLength(1)
		expect(document.querySelectorAll('.so-select__field')).toHaveLength(1)
		expect(document.querySelectorAll('[role="option"]')).toHaveLength(2)
	})

	it('StrictMode, multiple: тег выбранного — в видимом ряду, ряд один', async () => {
		mount(
			<StrictMode>
				<Select mode="multiple">
					<Select.Item value="msk" text="Москва" />
					<Select.Item value="tver" text="Тверь" />
				</Select>
			</StrictMode>,
		)
		await nextFrame()
		await open()
		click(optionAt(0))
		click(optionAt(1))

		expect(document.querySelectorAll('.so-select__tags')).toHaveLength(1)
		expect(
			[...document.querySelectorAll('.so-select__tags .so-tags-item')].map((tag) =>
				tag.textContent?.trim(),
			),
		).toEqual(['Москва', 'Тверь'])

		// Тег закрывается тем же экземпляром, что рисует ряд. Крестик закрывает
		// по клику своего TActionPlugin — он слушает узел с `ready`, кадром позже
		await nextFrame()
		click(find(document, '.so-tags-item__close', HTMLElement))

		expect(selection()).toEqual(['false', 'true'])
	})

	/**
	 * С `ctrl` снаружи поле у пересобранного Select то же, а движок — новый, и
	 * с ним теги: ряд встаёт над тегами нового движка, хотя поле вокруг него
	 * не перемонтировалось.
	 */
	it('StrictMode с ctrl снаружи: поле то же, ряд тегов — над тегами нового движка', async () => {
		const ctrl = new TSelect()

		mount(
			<StrictMode>
				<Select ctrl={ctrl} mode="multiple">
					<Select.Item value="msk" text="Москва" />
					<Select.Item value="tver" text="Тверь" />
				</Select>
			</StrictMode>,
		)
		await nextFrame()
		await open()
		click(optionAt(1))

		expect(document.querySelectorAll('.so-select__tags')).toHaveLength(1)
		expect(
			[...document.querySelectorAll('.so-select__tags .so-tags-item')].map((tag) =>
				tag.textContent?.trim(),
			),
		).toEqual(['Тверь'])
	})

	it('серверная разметка из items — поле с текстом выбранного и связкой комбобокса, панели нет', () => {
		const host = document.createElement('div')

		host.innerHTML = renderToString(<Select items={ITEMS} value="b" name="Город" />)

		const [input, ...rest] = [...host.querySelectorAll('input')]

		expect(rest).toEqual([])
		expect(input?.getAttribute('role')).toBe('combobox')
		expect(input?.getAttribute('value')).toBe('Второй')
		expect(input?.getAttribute('aria-expanded')).toBe('false')
		expect(input?.getAttribute('aria-controls')).toBeNull()
		expect(host.querySelector('.so-select__panel')).toBeNull()
		expect(host.querySelector('[role="option"]')).toBeNull()
	})

	it('серверная разметка из items в multiple — выбранное тегами в поле, текст поля пуст', () => {
		const host = document.createElement('div')

		host.innerHTML = renderToString(<Select items={ITEMS} mode="multiple" value={['a', 'c']} />)

		expect(host.querySelectorAll('.so-select__tags')).toHaveLength(1)
		expect(
			[...host.querySelectorAll('.so-tags-item')].map((tag) => tag.textContent?.trim()),
		).toEqual(['Первый', 'Третий'])
		expect(host.querySelector('input')?.getAttribute('value') ?? '').toBe('')
	})

	it('серверная разметка с опциями разметкой — поле пустое: опции входят в коллекцию после гидратации', () => {
		const host = document.createElement('div')

		host.innerHTML = renderToString(
			<Select value="tver" name="Город">
				<Select.Item value="msk" text="Москва" />
				<Select.Item value="tver" text="Тверь" />
			</Select>,
		)

		expect(host.querySelector('input')?.getAttribute('value') ?? '').toBe('')
		expect(host.textContent).not.toContain('Тверь')
		expect(host.querySelector('.so-select-item')).toBeNull()
	})

	/**
	 * Гидратация сходится: на сервере и при гидратации панели нет, а после неё
	 * она появляется в `body`, опции разметки входят в коллекцию при коммите,
	 * и поле показывает выбранное. Поле и ряд тегов — узлы сервера.
	 */
	it('гидратация без расхождений; после неё панель в body, опции в коллекции, поле — узел сервера', async () => {
		const engine = createEngineSelect()
		const element = (
			<Select engine={engine} value="tver" name="Город">
				<Select.Item value="msk" text="Москва" />
				<Select.Item value="tver" text="Тверь" />
			</Select>
		)
		const container = document.createElement('div')
		const onRecoverableError = vi.fn()

		container.innerHTML = renderToString(element)
		document.body.append(container)

		const serverField = field()

		act(() => {
			track(hydrateRoot(container, element, { onRecoverableError }))
		})
		await nextFrame()

		expect(onRecoverableError).not.toHaveBeenCalled()
		expect(field()).toBe(serverField)
		expect(document.body.contains(panel())).toBe(true)
		expect(container.contains(panel())).toBe(false)
		expect(field().getAttribute('aria-controls')).toBe(list().id)
		expect(engine.extensions.batch.items.map((item) => item.value)).toEqual(['msk', 'tver'])
		expect(field().value).toBe('Тверь')
		expect(selection()).toEqual(['false', 'true'])
	})

	it('гидратация multiple из items: теги — узлы сервера, клик по опции добавляет тег', async () => {
		const element = <Select items={ITEMS} mode="multiple" value={['a']} />
		const container = document.createElement('div')
		const onRecoverableError = vi.fn()

		container.innerHTML = renderToString(element)
		document.body.append(container)

		const serverTag = find(container, '.so-select__tags .so-tags-item', HTMLElement)

		act(() => {
			track(hydrateRoot(container, element, { onRecoverableError }))
		})
		await nextFrame()

		expect(onRecoverableError).not.toHaveBeenCalled()
		expect(find(container, '.so-select__tags .so-tags-item', HTMLElement)).toBe(serverTag)

		await open()
		click(optionAt(2))

		expect(
			[...container.querySelectorAll('.so-select__tags .so-tags-item')].map((tag) =>
				tag.textContent?.trim(),
			),
		).toEqual(['Первый', 'Третий'])
	})
})

describe('типы', () => {
	/** Тип проверяет не vitest, а шаг CI «Типы — React». */
	it('слоты несут scope из дескрипторов', () => {
		expectTypeOf<(scope: TItemRowScope) => ReactNode>().toExtend<
			NonNullable<SelectProps['item']>
		>()
		expectTypeOf<(scope: TItemScope) => ReactNode>().toExtend<
			NonNullable<SelectProps['item-leading']>
		>()
		expectTypeOf<(scope: TItemScope & { selected: boolean }) => ReactNode>().toExtend<
			NonNullable<SelectProps['item-indicator-icon']>
		>()
		expectTypeOf<(scope: { field: IInput }) => ReactNode>().toExtend<
			NonNullable<SelectProps['field']>
		>()
		expectTypeOf<(scope: TTagsScope) => ReactNode>().toExtend<
			NonNullable<SelectProps['tags']>
		>()
		expectTypeOf<(scope: { clear: () => void }) => ReactNode>().toExtend<
			NonNullable<SelectProps['clear']>
		>()
		expectTypeOf<(scope: TRowScope) => ReactNode>().toExtend<
			NonNullable<SelectItemProps['children']>
		>()
		expectTypeOf<SelectGroupProps['children']>().toEqualTypeOf<ReactNode>()
	})

	it('колбэки фасадов — пропсы компонентов', () => {
		expectTypeOf<SelectProps>().toHaveProperty('onChangeValue')
		expectTypeOf<SelectProps>().toHaveProperty('onChangeOpen')
		expectTypeOf<SelectProps>().toHaveProperty('onEngineCreate')
		expectTypeOf<SelectItemProps>().toHaveProperty('onChangeSelected')
		expectTypeOf<SelectItemProps>().toHaveProperty('onChangeOrder')
	})
})
