/**
 * Menu в React — проводка целиком, на настоящей разметке.
 *
 * Модель проверяет ядро (`core/__tests__/menu.spec.ts`), клавиши, указатель и
 * фокус — плагины (`plugins/__tests__/menu.plugin.spec.ts`); здесь важно, что
 * они сходятся: панель телепортирована и помечена владельцем, роль и связки
 * стоят на своих узлах, пункты из данных и разметкой входят в коллекцию, клик
 * строки действия закрывает меню и сообщает `choose`, флажок отмечается и
 * меню не закрывает. Сценарии — те же, что у Vue и Solid
 * (`ui/vue/__tests__/menu.spec.ts`, `ui/solid/__tests__/menu.spec.tsx`), кроме
 * глобального компонента приложения с именем подменю: реестра компонентов у
 * React нет, и подменю рисует себя само. `v-model` у React нет — открытость,
 * отметку и значение потребитель держит в состоянии родителя и слышит
 * колбэком со значением (`onChangeOpen`, `onChangeSelected`,
 * `onChangeValue`); такое состояние здесь — `appValue`.
 *
 * Своё у React. Триггер — разметка слота, которую меню рисует на каждый свой
 * рендер, а пункты из данных — по секциям, записи которых новые на каждую
 * смену; и триггер, и строки пунктов остаются теми же узлами: React сверяет
 * разметку по типу и ключу. Подменю из данных, переехавшее в другую группу,
 * React снимает с прежнего места раньше, чем принимает на новом: очистки
 * удалённых идут раньше эффектов новых в том же коммите. Отсюда же группа
 * «React»: StrictMode, серверная разметка и гидратация. Обновления — внутри
 * `act`: событие, сменившее состояние мимо него, роняет тест сторожем консоли.
 *
 * Панели телепортированы в `body`, и обёртку вложенной панели React кладёт
 * туда раньше обёртки панели меню: insertion-эффект потомка идёт раньше
 * эффекта предка. Поэтому у меню с подменю или пунктом с панелью панель меню
 * берётся по связке с триггером (`panelOf`), а не первой в документе.
 * Раскладка и действия браузера — `playground/vue/browser/menu.spec.ts`.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { StrictMode, act, useSyncExternalStore, type ReactElement, type ReactNode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import {
	createEngineMenu,
	type IMenuItem,
	type IMenuItemSource,
	type TCollectionEngineItemSource,
	type TComponentSize,
	type TComponentVariant,
	type TGroup,
	type TMenuCollection,
	type TMenuOpenOn,
	type TMenuRadioGroupValue,
} from '@soxa-ui/core'
import type { DescriptorSlots, MenuDescriptor } from '@soxa-ui/setup'
import {
	Button,
	Menu,
	type MenuPopoverItemProps,
	type MenuProps,
	type MenuSubmenuProps,
} from '@soxa-ui/react'
import { find, mount, nextFrame, track, type TMounted } from './mount'

type TTriggerScope = DescriptorSlots<typeof MenuDescriptor>['trigger']

/** Триггер так, как его кладёт потребитель: Button со связкой и видом из scope. */
const trigger = ({ triggerAria, triggerDataset }: TTriggerScope): ReactNode => (
	<Button text="Действия" className="so-test-trigger" {...triggerAria} {...triggerDataset} />
)

/**
 * Значение приложения — состояние родителя, которое тест читает и пишет
 * снаружи, как сигнал у Solid: родитель читает его хуком на рендере (`use`),
 * запись перерисовывает родителя, а колбэк компонента пишет в него так же,
 * как `setState` приложения. Запись из теста — в `act`.
 */
type TAppValue<T> = {
	readonly read: () => T
	readonly write: (next: T) => void
	readonly use: () => T
}

function appValue<T>(initial: T): TAppValue<T> {
	let value = initial
	const listeners = new Set<() => void>()
	const subscribe = (listener: () => void) => {
		listeners.add(listener)

		return () => {
			listeners.delete(listener)
		}
	}
	const read = () => value

	return {
		read,
		write: (next) => {
			value = next

			for (const listener of listeners) listener()
		},
		use: () => useSyncExternalStore(subscribe, read),
	}
}

/** Запись приложения снаружи теста: родитель перерисуется внутри `act`. */
function write<T>(target: TAppValue<T>, next: T): void {
	act(() => target.write(next))
}

/** Смонтировать разметку и дождаться кадра: корень плагины получают через кадр. */
async function render(element: ReactElement): Promise<TMounted> {
	const mounted = mount(element)

	await nextFrame()

	return mounted
}

/** Узел по селектору в документе: панели телепортированы мимо контейнера. */
const node = (selector: string, scope: ParentNode = document) => find(scope, selector, HTMLElement)

const triggerNode = () => node('.so-test-trigger')
const panel = () => node('.so-menu__panel')
const isOpen = () => panel().style.display !== 'none'
/** Строки пунктов по порядку — узлы с ролью. */
const rows = () => [...panel().querySelectorAll<HTMLElement>('[role^="menuitem"]')]

/** Строка пункта по тексту. */
function rowOf(text: string): HTMLElement {
	const row = rows().find((candidate) => candidate.textContent?.trim().startsWith(text))

	if (!row) throw new Error(`строки «${text}» нет`)

	return row
}

/** Клик мышью целиком: нажатие, фокус от `mousedown`, клик. */
function click(target: HTMLElement): void {
	act(() => {
		target.dispatchEvent(
			new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
		)
		target.focus()
		target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
	})
}

/** Фокус меняет состояние плагинов — внутри `act`. */
function focus(target: HTMLElement): void {
	act(() => target.focus())
}

/** Клавиша на узле и кадр модели фокуса. Отдаёт событие: по нему видно, погашена ли она. */
async function press(
	target: HTMLElement,
	key: string,
	init: KeyboardEventInit = {},
): Promise<KeyboardEvent> {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })

	act(() => {
		target.dispatchEvent(event)
	})
	await nextFrame()

	return event
}

/** Открыть кликом по триггеру и дождаться кадра модели фокуса. */
async function open(): Promise<void> {
	click(triggerNode())
	await nextFrame()
}

/**
 * Open a submenu or an item with a panel by clicking its row: a submenu's
 * items mount from its first opening on (`contentRendered`).
 */
async function openSubmenu(row: HTMLElement): Promise<void> {
	click(row)
	await nextFrame()
}

/** Панель по связке — `aria-controls`: `id` из `useId`, и селектором `#…` его не взять. */
function panelOf(target: HTMLElement): HTMLElement {
	const found = document.getElementById(target.getAttribute('aria-controls') ?? '')

	if (!(found instanceof HTMLElement)) throw new Error('у строки нет панели')

	return found
}

const shown = (target: HTMLElement) => target.style.display !== 'none'

/** Строка пункта по тексту в панели. */
function rowIn(scope: HTMLElement, text: string): HTMLElement {
	const row = [...scope.querySelectorAll<HTMLElement>('[role^="menuitem"]')].find((candidate) =>
		candidate.textContent?.trim().startsWith(text),
	)

	if (!row) throw new Error(`строки «${text}» нет`)

	return row
}

/** Тексты строк пунктов-действий и подменю панели по порядку. */
const texts = (scope: HTMLElement) =>
	[...scope.querySelectorAll('[role="menuitem"]')].map((row) => row.textContent?.trim())

/** Модификаторы варианта узла. */
const variantsOf = (target: Element | null | undefined) =>
	[...(target?.classList ?? [])].filter((cls) => cls.includes('--variant-'))

const ITEMS = [
	{ value: 'edit', text: 'Изменить' },
	{ value: 'remove', text: 'Удалить', variant: 'danger' as const },
]

describe('разметка', () => {
	it('корень — span с триггером, панель телепортирована в body и скрыта', async () => {
		const { container } = await render(<Menu items={ITEMS} trigger={trigger} />)

		const root = node('.so-menu')

		expect(root.localName).toBe('span')
		expect(root.contains(triggerNode())).toBe(true)
		expect(root.contains(panel())).toBe(false)
		expect(container.contains(panel())).toBe(false)
		expect(document.body.contains(panel())).toBe(true)
		expect(isOpen()).toBe(false)
	})

	it('панель — меню с именем от кнопки, триггер ссылается на панель', async () => {
		await render(<Menu items={ITEMS} trigger={trigger} />)

		const button = triggerNode()

		expect(panel().getAttribute('role')).toBe('menu')
		expect(panel().getAttribute('tabindex')).toBe('-1')
		expect(panel().hasAttribute('aria-hidden')).toBe(false)
		expect(button.getAttribute('aria-haspopup')).toBe('menu')
		expect(button.getAttribute('aria-expanded')).toBe('false')
		expect(panelOf(button)).toBe(panel())
		expect(panel().getAttribute('aria-labelledby')).toBe(button.id)
		expect(button.id).not.toBe('')
		// Список — только прокрутка: роли у него нет
		expect(node('.so-menu__list').hasAttribute('role')).toBe(false)
	})

	it('пункты — с первого открытия, закрытие их не снимает; у подменю — с его открытия', async () => {
		const engine = createEngineMenu()
		const values = () => engine.extensions.batch.items.map((item) => item.value)

		await render(
			<Menu engine={engine} trigger={trigger}>
				<Menu.Item value="edit" text="Изменить" />
				<Menu.Submenu value="share" text="Поделиться">
					<Menu.Item value="link" text="Ссылка" />
				</Menu.Submenu>
			</Menu>,
		)

		const menuPanel = () => panelOf(triggerNode())

		// Never opened: the panel is in the document, the items are neither in it
		// nor in the collection
		expect(menuPanel().querySelector('.so-menu-item')).toBeNull()
		expect(values()).toEqual([])

		await open()

		const edit = rowIn(menuPanel(), 'Изменить')
		const share = rowIn(menuPanel(), 'Поделиться')

		expect(values()).toEqual(['edit', 'share'])
		// The submenu's items wait for its own first opening
		expect(panelOf(share).querySelector('.so-menu-item')).toBeNull()

		await openSubmenu(share)

		const link = rowIn(panelOf(share), 'Ссылка')

		// Closing the menu hides the panels and keeps the very same rows
		await open()

		expect(shown(menuPanel())).toBe(false)
		expect(shown(panelOf(share))).toBe(false)
		expect(rowIn(menuPanel(), 'Изменить')).toBe(edit)
		expect(rowIn(panelOf(share), 'Ссылка')).toBe(link)
		expect(values()).toEqual(['edit', 'share'])
	})

	it('пункты из данных — действия: строка с ролью и вне обхода Tab', async () => {
		await render(<Menu items={ITEMS} trigger={trigger} />)
		await open()

		expect(rows().map((row) => row.textContent?.trim())).toEqual(['Изменить', 'Удалить'])
		expect(rows().map((row) => row.getAttribute('role'))).toEqual(['menuitem', 'menuitem'])
		expect(rows().map((row) => row.getAttribute('tabindex'))).toEqual(['-1', '-1'])
		expect(rows().some((row) => row.hasAttribute('aria-checked'))).toBe(false)
	})

	it('размер и вариант меню — модификаторами панели, свой вариант — у пункта', async () => {
		await render(<Menu items={ITEMS} size="lg" variant="brand" trigger={trigger} />)
		await open()

		expect(panel().classList).toContain('so-frame')
		expect(panel().classList).toContain('so-menu__panel--size-lg')
		expect(panel().classList).toContain('so-menu__panel--variant-brand')

		const [edit, remove] = [...panel().querySelectorAll('.so-menu-item')]

		expect(edit.classList).toContain('so-menu-item--size-lg')
		expect(remove.classList).toContain('so-menu-item--size-lg')
		// Вариант меню пункту не пишется: тема красит его с панели
		expect([...edit.classList].some((cls) => cls.includes('--variant-'))).toBe(false)
		expect(remove.classList).toContain('so-menu-item--variant-danger')
	})

	/** Снимок классов панели раскладывает адаптер: смена размера — тот же узел с новым классом. */
	it('смена размера меню — новые классы панели на том же узле', async () => {
		const view = (size: TComponentSize) => <Menu items={ITEMS} size={size} trigger={trigger} />
		const { render: rerender } = await render(view('lg'))

		const first = panel()

		rerender(view('sm'))

		expect(panel()).toBe(first)
		expect(first.classList).toContain('so-menu__panel--size-sm')
		expect(first.classList).not.toContain('so-menu__panel--size-lg')
	})

	it('слоты пункта из данных пробрасываются с пунктом в scope', async () => {
		await render(
			<Menu
				items={ITEMS}
				trigger={trigger}
				item-leading={({ item }: { item: IMenuItem }) => (
					<i className="so-test-icon">{String(item.value)}</i>
				)}
				item={({ text }: { text: string }) => `${text}…`}
				item-trailing={({ item }: { item: IMenuItem }) =>
					item.value === 'remove' ? 'Del' : null
				}
			/>,
		)
		await open()

		const [edit, remove] = rows()

		expect(node('.so-menu-item__icon .so-test-icon', edit).textContent).toBe('edit')
		expect(node('.so-button__text', edit).textContent).toBe('Изменить…')
		expect(node('.so-menu-item__shortcut', edit).textContent).toBe('')
		expect(node('.so-menu-item__shortcut', remove).textContent).toBe('Del')
	})

	it('пустые значок и подсказка — без содержимого: тема прячет их по :empty', async () => {
		await render(<Menu items={ITEMS} trigger={trigger} />)

		for (const row of rows()) {
			expect(node('.so-menu-item__icon', row).childNodes).toHaveLength(0)
			expect(node('.so-menu-item__shortcut', row).childNodes).toHaveLength(0)
		}
	})
})

describe('открытие', () => {
	it('клик по триггеру открывает меню, повторный — закрывает', async () => {
		await render(<Menu items={ITEMS} trigger={trigger} />)

		await open()

		expect(isOpen()).toBe(true)
		expect(triggerNode().getAttribute('aria-expanded')).toBe('true')
		expect(triggerNode().dataset.selected).toBe('true')
		expect(node('.so-menu').dataset.open).toBe('true')

		click(triggerNode())

		expect(isOpen()).toBe(false)
	})

	it('open пропом и onChangeOpen — в обе стороны', async () => {
		const opened = appValue(false)

		function App(): ReactNode {
			return (
				<Menu
					items={ITEMS}
					open={opened.use()}
					onChangeOpen={({ newValue }) => opened.write(newValue)}
					trigger={trigger}
				/>
			)
		}

		await render(<App />)

		write(opened, true)

		expect(isOpen()).toBe(true)

		click(triggerNode())

		expect(opened.read()).toBe(false)
		expect(isOpen()).toBe(false)
	})
})

/**
 * Связка триггера меняется на каждое открытие (`aria-expanded`,
 * `data-selected`), а триггер — тот же узел: меню рисует разметку слота
 * заново, и React сверяет её с прежней. Новый узел на каждое открытие уронил
 * бы фокус, стоявший на прежнем, на `body`.
 */
describe('триггер — тот же узел', () => {
	it('после открытия и закрытия — тот же узел с новой связкой', async () => {
		await render(<Menu items={ITEMS} trigger={trigger} />)

		const first = triggerNode()

		await open()

		expect(triggerNode()).toBe(first)
		expect(first.getAttribute('aria-expanded')).toBe('true')
		expect(first.dataset.selected).toBe('true')

		await press(rowOf('Изменить'), 'Escape')

		expect(triggerNode()).toBe(first)
		expect(first.getAttribute('aria-expanded')).toBe('false')
		expect(first.dataset.selected).toBe('false')
	})

	it('после закрытия кликом по триггеру фокус остаётся на нём', async () => {
		await render(<Menu items={ITEMS} trigger={trigger} />)
		await open()

		click(triggerNode())

		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(triggerNode())
	})
})

describe('нажатие пунктов', () => {
	it('клик строки действия закрывает меню, сообщает choose и возвращает фокус', async () => {
		const chosen: unknown[] = []

		await render(
			<Menu items={ITEMS} onChoose={(item) => chosen.push(item.value)} trigger={trigger} />,
		)

		await open()
		click(rowOf('Удалить'))

		expect(chosen).toEqual(['remove'])
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(triggerNode())
	})

	it('Enter на строке — её клик: пункт нажат один раз', async () => {
		const chosen: unknown[] = []

		await render(
			<Menu items={ITEMS} onChoose={(item) => chosen.push(item.value)} trigger={trigger} />,
		)

		focus(triggerNode())
		await press(triggerNode(), 'ArrowDown')

		expect(document.activeElement).toBe(rowOf('Изменить'))

		await press(rowOf('Изменить'), 'Enter')

		expect(chosen).toEqual(['edit'])
		expect(isOpen()).toBe(false)
	})

	it('выключенный пункт не нажимается', async () => {
		const chosen: unknown[] = []

		await render(
			<Menu
				items={[{ value: 'edit', text: 'Изменить', disabled: true }]}
				onChoose={(item) => chosen.push(item.value)}
				trigger={trigger}
			/>,
		)

		await open()
		click(rowOf('Изменить'))

		expect(rowOf('Изменить').getAttribute('aria-disabled')).toBe('true')
		expect(chosen).toEqual([])
		expect(isOpen()).toBe(true)
	})

	/**
	 * Отметка — в обе стороны, парой «проп + колбэк»: `selected` пропом пишет
	 * её, а `onChangeSelected` приходит флажку, чья отметка сменилась, и несёт
	 * её. Отметку приложение держит у себя и коллекцию не читает; соседний
	 * флажок, чья отметка не менялась, колбэка не получает.
	 */
	it('флажок отмечается кликом и меню не закрывает: selected пропом и onChangeSelected', async () => {
		const checked = appValue(false)
		const chosen: unknown[] = []
		const ruler: boolean[] = []

		function App(): ReactNode {
			return (
				<Menu onChoose={(item) => chosen.push(item.value)} trigger={trigger}>
					<Menu.CheckboxItem
						value="grid"
						text="Сетка"
						selected={checked.use()}
						onChangeSelected={({ newValue }) => checked.write(newValue)}
					/>
					<Menu.CheckboxItem
						value="ruler"
						text="Линейка"
						selected
						onChangeSelected={({ newValue: selected }) => ruler.push(selected)}
					/>
				</Menu>
			)
		}

		await render(<App />)

		await open()
		ruler.length = 0

		expect(rowOf('Сетка').getAttribute('role')).toBe('menuitemcheckbox')
		expect(rowOf('Сетка').getAttribute('aria-checked')).toBe('false')
		expect(rowOf('Линейка').getAttribute('aria-checked')).toBe('true')

		click(rowOf('Сетка'))

		expect(checked.read()).toBe(true)
		expect(rowOf('Сетка').getAttribute('aria-checked')).toBe('true')
		// Отметки флажков независимы, меню открыто, choose нет
		expect(rowOf('Линейка').getAttribute('aria-checked')).toBe('true')
		expect(ruler).toEqual([])
		expect(isOpen()).toBe(true)
		expect(chosen).toEqual([])

		click(rowOf('Сетка'))

		expect(checked.read()).toBe(false)
		expect(rowOf('Сетка').getAttribute('aria-checked')).toBe('false')

		write(checked, true)

		expect(rowOf('Сетка').getAttribute('aria-checked')).toBe('true')
		expect(ruler).toEqual([])
	})

	it('отметка рисуется только у отмеченного флажка, обёртка — у всех флажков', async () => {
		await render(
			<Menu trigger={trigger}>
				<Menu.CheckboxItem value="grid" text="Сетка" />
				<Menu.CheckboxItem value="ruler" text="Линейка" selected />
				<Menu.Item value="edit" text="Изменить" />
			</Menu>,
		)
		await open()

		const indicator = (text: string) => rowOf(text).querySelector('.so-menu-item__indicator')

		expect(indicator('Сетка')?.getAttribute('aria-hidden')).toBe('true')
		expect(indicator('Сетка')?.querySelector('svg, .so-icon')).toBeNull()
		expect(indicator('Линейка')?.querySelector('.so-icon')).not.toBeNull()
		expect(indicator('Изменить')).toBeNull()
	})

	it('слот отметки флажка подменяет иконку, scope — отмечен ли флажок', async () => {
		await render(
			<Menu trigger={trigger}>
				<Menu.CheckboxItem
					value="grid"
					text="Сетка"
					selected
					indicator-icon={({ selected }: { selected: boolean }) => (
						<i className="so-test-mark" data-mark={String(selected)} />
					)}
				/>
			</Menu>,
		)
		await open()

		expect(node('.so-test-mark', rowOf('Сетка')).dataset.mark).toBe('true')
		expect(rowOf('Сетка').querySelector('.so-menu-item__indicator .so-icon')).toBeNull()
	})

	/** Клик потребителя приходит после нажатия пункта: своё — первым. */
	it('клик потребителя по строке не отменяет нажатие пункта', async () => {
		const order: string[] = []

		await render(
			<Menu onChoose={() => order.push('choose')} trigger={trigger}>
				<Menu.Item value="edit" text="Изменить" onClick={() => order.push('click')} />
			</Menu>,
		)

		await open()
		click(rowOf('Изменить'))

		expect(order).toEqual(['choose', 'click'])
		expect(isOpen()).toBe(false)
	})
})

/**
 * Переключатели: `Menu.RadioGroup` со своим значением и `Menu.RadioItem` в
 * ней. Отметка — выбор коллекции меню, и в группе отмечен один; группу
 * переключатель берёт лифтом. Модель — `core/__tests__/menu.spec.ts`, лифт без
 * фреймворка — `setup/__tests__/menu-radio.spec.ts`.
 */
describe('переключатели', () => {
	/** Меню с группой «Сортировка», её значение — в состоянии приложения, и флажком рядом. */
	async function renderSort(
		initial: TMenuRadioGroupValue,
		menu: Partial<MenuProps> = {},
	): Promise<TAppValue<TMenuRadioGroupValue>> {
		const sort = appValue(initial)

		function App(): ReactNode {
			return (
				<Menu {...menu} trigger={trigger}>
					<Menu.RadioGroup
						label="Сортировка"
						value={sort.use()}
						onChangeValue={(payload) => sort.write(payload.newValue)}
					>
						<Menu.RadioItem value="name" text="По имени" />
						<Menu.RadioItem value="date" text="По дате" />
					</Menu.RadioGroup>
					<Menu.Separator />
					<Menu.CheckboxItem value="grid" text="Сетка" selected />
				</Menu>
			)
		}

		await render(<App />)

		return sort
	}

	const checked = () => rows().map((row) => row.getAttribute('aria-checked'))

	it('группа — group с именем от подписи, переключатели — menuitemradio вне обхода Tab', async () => {
		await renderSort(null)
		await open()

		const group = node('.so-menu-group')
		const label = node('.so-menu-group__label', group)

		expect(group.getAttribute('role')).toBe('group')
		expect(group.getAttribute('aria-labelledby')).toBe(label.id)
		expect(label.textContent).toBe('Сортировка')

		expect(rowOf('По имени').getAttribute('role')).toBe('menuitemradio')
		expect(rowOf('По дате').getAttribute('tabindex')).toBe('-1')
		expect(checked()).toEqual(['false', 'false', 'true'])
	})

	it('клик отмечает переключатель и меню не закрывает: value пропом и onChangeValue', async () => {
		const chosen: unknown[] = []
		const sort = await renderSort(null, { onChoose: (item) => chosen.push(item.value) })

		await open()
		click(rowOf('По имени'))

		expect(sort.read()).toBe('name')
		expect(checked()).toEqual(['true', 'false', 'true'])

		click(rowOf('По дате'))

		// В группе отмечен один, флажок — сам по себе
		expect(sort.read()).toBe('date')
		expect(checked()).toEqual(['false', 'true', 'true'])

		// Отмеченный нажатием не снимается
		click(rowOf('По дате'))

		expect(sort.read()).toBe('date')
		expect(isOpen()).toBe(true)
		expect(chosen).toEqual([])
	})

	it('значение из приложения отмечает свой переключатель, без него — ни один', async () => {
		const sort = await renderSort('date')

		await open()

		expect(checked()).toEqual(['false', 'true', 'true'])

		write(sort, 'name')

		expect(checked()).toEqual(['true', 'false', 'true'])

		write(sort, 'size')

		expect(checked()).toEqual(['false', 'false', 'true'])
	})

	/**
	 * Отметка переключателя — тоже в обе стороны: сосед, с которого её сняла
	 * группа, узнаёт об этом своим колбэком со значением.
	 */
	it('selected у переключателя — его отметка: значение группы и сосед за ней', async () => {
		const sort = appValue<TMenuRadioGroupValue>('name')
		const nameChecked = appValue(true)
		const dateChecked = appValue(false)

		function App(): ReactNode {
			return (
				<Menu trigger={trigger}>
					<Menu.RadioGroup
						value={sort.use()}
						onChangeValue={(payload) => sort.write(payload.newValue)}
					>
						<Menu.RadioItem
							value="name"
							text="name"
							selected={nameChecked.use()}
							onChangeSelected={({ newValue }) => nameChecked.write(newValue)}
						/>
						<Menu.RadioItem
							value="date"
							text="date"
							selected={dateChecked.use()}
							onChangeSelected={({ newValue }) => dateChecked.write(newValue)}
						/>
					</Menu.RadioGroup>
				</Menu>
			)
		}

		await render(<App />)
		await open()

		write(dateChecked, true)

		expect(sort.read()).toBe('date')
		expect(nameChecked.read()).toBe(false)
		expect(checked()).toEqual(['false', 'true'])
	})

	it('точка рисуется только у отмеченного, обёртка отметки — у всех переключателей', async () => {
		await renderSort('name')
		await open()

		const indicator = (text: string) => node('.so-menu-item__indicator', rowOf(text))

		expect(indicator('По имени').getAttribute('aria-hidden')).toBe('true')
		expect(indicator('По имени').querySelector('.so-menu-item__dot')).not.toBeNull()
		expect(indicator('По дате').querySelector('.so-menu-item__dot')).toBeNull()
		expect(indicator('По дате').childNodes).toHaveLength(0)
	})

	it('две группы одного меню независимы', async () => {
		const sort = appValue<TMenuRadioGroupValue>('name')
		const order = appValue<TMenuRadioGroupValue>('asc')

		function Group({
			value,
			values,
		}: {
			value: TAppValue<TMenuRadioGroupValue>
			values: readonly string[]
		}): ReactNode {
			return (
				<Menu.RadioGroup
					value={value.use()}
					onChangeValue={(payload) => value.write(payload.newValue)}
				>
					{values.map((item) => (
						<Menu.RadioItem key={item} value={item} text={item} />
					))}
				</Menu.RadioGroup>
			)
		}

		await render(
			<Menu trigger={trigger}>
				<Group value={sort} values={['name', 'date']} />
				<Group value={order} values={['asc', 'desc']} />
			</Menu>,
		)
		await open()
		click(rowOf('date'))
		click(rowOf('desc'))

		expect([sort.read(), order.read()]).toEqual(['date', 'desc'])
		expect(checked()).toEqual(['false', 'true', 'false', 'true'])
	})

	it('слот отметки подменяет точку, scope — отмечен ли переключатель', async () => {
		await render(
			<Menu trigger={trigger}>
				<Menu.RadioGroup value="name">
					<Menu.RadioItem
						value="name"
						text="По имени"
						indicator-icon={({ selected }: { selected: boolean }) => (
							<i className="so-test-mark" data-mark={String(selected)} />
						)}
					/>
				</Menu.RadioGroup>
			</Menu>,
		)
		await open()

		expect(node('.so-test-mark', rowOf('По имени')).dataset.mark).toBe('true')
		expect(rowOf('По имени').querySelector('.so-menu-item__dot')).toBeNull()
	})
})

describe('группа и разделитель', () => {
	it('группа — group с именем от подписи, пункты в ней — пункты меню', async () => {
		await render(
			<Menu trigger={trigger}>
				<Menu.Group label="Вид">
					<Menu.CheckboxItem value="grid" text="Сетка" />
				</Menu.Group>
				<Menu.Separator />
				<Menu.Group>
					<Menu.Item value="edit" text="Изменить" />
				</Menu.Group>
			</Menu>,
		)
		await open()

		const [labelled, bare] = [...panel().querySelectorAll<HTMLElement>('.so-menu-group')]
		const label = node('.so-menu-group__label', labelled)

		expect(labelled.getAttribute('role')).toBe('group')
		expect(label.textContent).toBe('Вид')
		expect(labelled.getAttribute('aria-labelledby')).toBe(label.id)
		expect(label.id).not.toBe('')

		// Без подписи — ни обёртки, ни ссылки
		expect(bare.querySelector('.so-menu-group__label')).toBeNull()
		expect(bare.hasAttribute('aria-labelledby')).toBe(false)

		expect(node('.so-menu-separator').getAttribute('role')).toBe('separator')

		// Навигация идёт сквозь группы: строки в порядке разметки
		focus(triggerNode())
		await press(triggerNode(), 'ArrowUp')

		expect(document.activeElement).toBe(rowOf('Изменить'))
	})
})

/**
 * Группы из данных: метка группы — `_.group` в `items` или `groupBy`, порядок
 * и подписи — `groups`. Меню рисует секции показанного: группу с подписью —
 * `Menu.Group`, пункты без группы — прямо в списке, между секциями —
 * разделитель. Группы из `groups` идут первыми, остальное — по месту, поэтому
 * здесь, где заявлены все группы, пункты без группы — последними. Стрелки
 * ходят тем же порядком, что пункты стоят на экране.
 */
describe('группы из данных', () => {
	/** В данных «Увеличить» и «Переименовать» стоят между пунктами «Правки». */
	const GROUPED = [
		{ value: 'cut', text: 'Вырезать', _: { group: 'edit' } },
		{ value: 'zoom', text: 'Увеличить', _: { group: 'view' } },
		{ value: 'rename', text: 'Переименовать' },
		{ value: 'copy', text: 'Копировать', _: { group: 'edit' } },
	]

	const GROUPS: TGroup[] = [
		{ key: 'edit', label: 'Правка' },
		{ key: 'view', label: 'Вид' },
	]

	const RENAMED: TGroup[] = [
		{ key: 'edit', label: 'Edit' },
		{ key: 'view', label: 'View' },
	]

	/** Части списка по порядку: группа — по подписи, разделитель, пункт — по тексту. */
	const parts = () =>
		[...node('.so-menu__list').children].map((child) => {
			if (child.classList.contains('so-menu-group')) {
				return `группа ${child.querySelector('.so-menu-group__label')?.textContent ?? ''}`
			}

			if (child.classList.contains('so-menu-separator')) return '—'

			return child.textContent?.trim()
		})

	it('группы с подписью, разделитель — только между секциями, без группы — последними', async () => {
		await render(<Menu items={GROUPED} groups={GROUPS} trigger={trigger} />)
		await open()

		expect(parts()).toEqual(['группа Правка', '—', 'группа Вид', '—', 'Переименовать'])
		expect(rows().map((row) => row.textContent?.trim())).toEqual([
			'Вырезать',
			'Копировать',
			'Увеличить',
			'Переименовать',
		])

		const groups = [...panel().querySelectorAll<HTMLElement>('.so-menu-group')]

		for (const group of groups) {
			const label = node('.so-menu-group__label', group)

			expect(group.getAttribute('role')).toBe('group')
			expect(group.getAttribute('aria-labelledby')).toBe(label.id)
			expect(label.id).not.toBe('')
		}

		expect(groups[0].contains(rowOf('Копировать'))).toBe(true)
		expect(
			[...panel().querySelectorAll('.so-menu-separator')].map((separator) =>
				separator.getAttribute('role'),
			),
		).toEqual(['separator', 'separator'])
	})

	it('стрелки ходят порядком экрана: ↓ с «Вырезать» — на «Копировать»', async () => {
		await render(<Menu items={GROUPED} groups={GROUPS} trigger={trigger} />)

		focus(triggerNode())
		await press(triggerNode(), 'ArrowDown')

		expect(document.activeElement).toBe(rowOf('Вырезать'))

		await press(rowOf('Вырезать'), 'ArrowDown')

		expect(document.activeElement).toBe(rowOf('Копировать'))

		await press(rowOf('Копировать'), 'ArrowDown')

		expect(document.activeElement).toBe(rowOf('Увеличить'))

		await press(rowOf('Увеличить'), 'ArrowDown')

		expect(document.activeElement).toBe(rowOf('Переименовать'))
	})

	it('смена подписи в groups перерисовывает подписи групп', async () => {
		const view = (groups: TGroup[]) => (
			<Menu items={GROUPED} groups={groups} trigger={trigger} />
		)
		const { render: rerender } = await render(view(GROUPS))
		await open()

		rerender(view(RENAMED))

		expect(parts()).toEqual(['группа Edit', '—', 'группа View', '—', 'Переименовать'])
	})

	/**
	 * Секции — новые записи на каждую смену, а узлы держат ключи: группа — по
	 * ключу секции, пункт — по `uid`. Смена подписи и новый пункт не
	 * пересоздают строк — фокус и узлы пунктов на месте. С `trackBy` новый
	 * состав — правка прежнего, и пункты секций — те же экземпляры.
	 */
	it('строки пунктов — те же узлы после смены подписи в groups и нового пункта', async () => {
		const view = (items: typeof GROUPED, groups: TGroup[]) => (
			<Menu
				items={items}
				groups={groups}
				trackBy={(item: { value?: unknown }) => item.value}
				trigger={trigger}
			/>
		)
		const { render: rerender } = await render(view(GROUPED, GROUPS))

		focus(triggerNode())
		await press(triggerNode(), 'ArrowDown')

		const before = rows()
		const focused = rowOf('Вырезать')

		expect(document.activeElement).toBe(focused)

		rerender(view(GROUPED, RENAMED))

		expect(rows()).toHaveLength(before.length)
		before.forEach((row, index) => expect(rows()[index]).toBe(row))

		rerender(
			view([...GROUPED, { value: 'paste', text: 'Вставить', _: { group: 'edit' } }], RENAMED),
		)

		expect(rows().map((row) => row.textContent?.trim())).toEqual([
			'Вырезать',
			'Копировать',
			'Вставить',
			'Увеличить',
			'Переименовать',
		])

		for (const row of before) expect(rows()).toContain(row)

		expect(document.activeElement).toBe(focused)
	})

	it('groupBy пропом: ключ группы — из пункта', async () => {
		await render(
			<Menu
				items={ITEMS}
				groupBy={(item: IMenuItem) => (item.variant === 'danger' ? 'danger' : undefined)}
				groups={[{ key: 'danger', label: 'Опасное' }]}
				trigger={trigger}
			/>,
		)
		await open()

		expect(parts()).toEqual(['группа Опасное', '—', 'Изменить'])
	})

	it('группировка через движок: engine.extensions.group после монтирования', async () => {
		const engine = createEngineMenu({ items: ITEMS })

		await render(<Menu engine={engine} trigger={trigger} />)
		await open()

		expect(parts()).toEqual(['Изменить', 'Удалить'])

		act(() => {
			engine.extensions.group.groupBy = (item) =>
				item.value === 'remove' ? 'danger' : undefined
			engine.extensions.group.groups = [{ key: 'danger', label: 'Опасное' }]
		})

		expect(parts()).toEqual(['группа Опасное', '—', 'Изменить'])
	})

	it('без группировки — ни групп, ни разделителей: пункты прямо в списке', async () => {
		await render(<Menu items={ITEMS} trigger={trigger} />)
		await open()

		expect(parts()).toEqual(['Изменить', 'Удалить'])
		expect(panel().querySelector('.so-menu-group, .so-menu-separator')).toBeNull()
	})

	it('groupSeparators=false — секции без разделителей, порядок и группы те же', async () => {
		await render(
			<Menu items={GROUPED} groups={GROUPS} groupSeparators={false} trigger={trigger} />,
		)
		await open()

		expect(parts()).toEqual(['группа Правка', 'группа Вид', 'Переименовать'])
		expect(panel().querySelector('.so-menu-separator')).toBeNull()
	})

	it('groupSeparators на лету ставит и снимает разделители', async () => {
		const view = (separated: boolean) => (
			<Menu items={GROUPED} groups={GROUPS} groupSeparators={separated} trigger={trigger} />
		)
		const { render: rerender } = await render(view(false))
		await open()

		expect(parts()).toEqual(['группа Правка', 'группа Вид', 'Переименовать'])

		rerender(view(true))

		expect(parts()).toEqual(['группа Правка', '—', 'группа Вид', '—', 'Переименовать'])

		rerender(view(false))

		expect(parts()).toEqual(['группа Правка', 'группа Вид', 'Переименовать'])
	})

	it('ручной Menu.Separator разметки свойство не трогает', async () => {
		await render(
			<Menu groupSeparators={false} trigger={trigger}>
				<Menu.Item value="edit" text="Изменить" />
				<Menu.Separator />
				<Menu.Item value="remove" text="Удалить" />
			</Menu>,
		)
		await open()

		expect(parts()).toEqual(['Изменить', '—', 'Удалить'])
	})
})

/**
 * Группы разметки — `Menu.Group` и `Menu.RadioGroup` — входят в ту же
 * группировку, что группы из данных: их ключ пункты внутри берут лифтом,
 * подпись группа регистрирует в группировке, и `sections` описывают их.
 * Пункт вне группы пишут и над группами («Новый» над «Правкой»): группы не
 * заявлены в `groups`, и показанное идёт по месту — стрелки ходят, как пункты
 * стоят.
 */
describe('группы разметки', () => {
	/** «Новый» — над группой «Правка», «Закрыть» — под группой переключателей. */
	const markup = (engine: TMenuCollection, label: string) => (
		<Menu engine={engine} trigger={trigger}>
			<Menu.Item value="new" text="Новый" />
			<Menu.Group label={label}>
				<Menu.Item value="cut" text="Вырезать" />
				<Menu.Item value="copy" text="Копировать" />
			</Menu.Group>
			<Menu.Separator />
			<Menu.RadioGroup label="Сортировка" value="name">
				<Menu.RadioItem value="name" text="По имени" />
				<Menu.RadioItem value="date" text="По дате" />
			</Menu.RadioGroup>
			<Menu.Item value="close" text="Закрыть" />
		</Menu>
	)

	/** Секции коротко: подпись группы (`null` — без группы) и значения пунктов. */
	const brief = (engine: TMenuCollection) =>
		engine.extensions.group.sections.map(({ group, items }) => [
			group === null ? null : (group.label ?? ''),
			items.map((item) => item.value),
		])

	it('секции — группы разметки с подписью, пункты вне групп — на своих местах', async () => {
		const engine = createEngineMenu()

		await render(markup(engine, 'Правка'))
		await open()

		expect(brief(engine)).toEqual([
			[null, ['new']],
			['Правка', ['cut', 'copy']],
			['Сортировка', ['name', 'date']],
			[null, ['close']],
		])
		expect(engine.extensions.group.groups).toEqual([])
	})

	it('стрелки ходят порядком экрана: «Новый» над группой — первым', async () => {
		await render(markup(createEngineMenu(), 'Правка'))

		focus(triggerNode())
		await press(triggerNode(), 'ArrowDown')

		const visited = [document.activeElement]

		for (let step = 1; step < rows().length; step += 1) {
			const current = document.activeElement

			if (!(current instanceof HTMLElement)) throw new Error('фокус — не на строке')

			await press(current, 'ArrowDown')
			visited.push(document.activeElement)
		}

		expect(visited).toEqual(rows())
		expect(rows().map((row) => row.textContent?.trim())).toEqual([
			'Новый',
			'Вырезать',
			'Копировать',
			'По имени',
			'По дате',
			'Закрыть',
		])
	})

	it('смена подписи группы разметки — новая подпись секции', async () => {
		const engine = createEngineMenu()
		const { render: rerender } = await render(markup(engine, 'Правка'))
		await open()

		rerender(markup(engine, 'Изменение'))

		expect(brief(engine)[1]).toEqual(['Изменение', ['cut', 'copy']])
	})
})

/**
 * Контекстное меню — `openOn="contextmenu"`: в слоте `trigger` область, меню
 * вызывают над ней, и панель встаёт у точки вызова. Переходы плагинов —
 * `plugins/__tests__/menu.plugin.spec.ts`, расчёт у точки —
 * `setup/__tests__/overlay.spec.ts`; здесь — что проводка доводит точку от
 * ядра до якоря панели и что связка кнопки у области пуста.
 */
describe('контекстное меню', () => {
	/** Scope слота у области — что разметка отдала ей. */
	let scope: TTriggerScope | null = null

	/** Область — строка «файла», как у потребителя: связку из scope она берёт, если она есть. */
	const area = (given: TTriggerScope): ReactNode => {
		scope = given

		return (
			<div className="so-test-area" {...given.triggerAria}>
				Отчёт.pdf
			</div>
		)
	}

	const areaNode = () => node('.so-test-area')

	/** Правая кнопка мыши над областью в точке окна. */
	function rightClick(x: number, y: number): void {
		act(() => {
			areaNode().dispatchEvent(
				new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: 2 }),
			)
			areaNode().dispatchEvent(
				new MouseEvent('contextmenu', {
					bubbles: true,
					cancelable: true,
					clientX: x,
					clientY: y,
				}),
			)
		})
	}

	afterEach(() => {
		scope = null
	})

	it('у области связки кнопки нет, у панели — роль и id, но не имя от триггера', async () => {
		await render(<Menu items={ITEMS} openOn="contextmenu" trigger={area} />)

		expect(scope?.triggerAria).toEqual({})
		expect(areaNode().hasAttribute('aria-haspopup')).toBe(false)
		expect(areaNode().hasAttribute('aria-expanded')).toBe(false)
		expect(panel().getAttribute('role')).toBe('menu')
		expect(panel().id).not.toBe('')
		expect(panel().hasAttribute('aria-labelledby')).toBe(false)
	})

	it('правая кнопка открывает меню у точки вызова, повторная — переставляет панель', async () => {
		await render(<Menu items={ITEMS} openOn="contextmenu" trigger={area} />)

		rightClick(120, 80)

		expect(isOpen()).toBe(true)
		// Точка — в координатах окна: панель `fixed`, отступ 4px, как у кнопки
		expect(panel().style.position).toBe('fixed')
		expect(panel().style.left).toBe('120px')
		expect(panel().style.top).toBe('84px')

		rightClick(300, 200)

		expect(isOpen()).toBe(true)
		expect(panel().style.left).toBe('300px')
		expect(panel().style.top).toBe('204px')
	})

	it('нажатие в области мимо вызова закрывает меню', async () => {
		await render(<Menu items={ITEMS} openOn="contextmenu" trigger={area} />)

		rightClick(120, 80)

		act(() => {
			areaNode().dispatchEvent(
				new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: 0 }),
			)
		})

		expect(isOpen()).toBe(false)
	})

	it('смена openOn на лету: у кнопки связка появляется, у области пропадает', async () => {
		const view = (openOn: TMenuOpenOn) => (
			<Menu items={ITEMS} openOn={openOn} trigger={trigger} />
		)
		const { render: rerender } = await render(view('press'))

		expect(triggerNode().getAttribute('aria-haspopup')).toBe('menu')

		rerender(view('contextmenu'))

		expect(triggerNode().hasAttribute('aria-haspopup')).toBe(false)
		expect(triggerNode().hasAttribute('aria-controls')).toBe(false)
		expect(panel().hasAttribute('aria-labelledby')).toBe(false)

		rerender(view('press'))

		expect(panelOf(triggerNode())).toBe(panel())
		expect(panel().getAttribute('aria-labelledby')).toBe(triggerNode().id)
	})
})

/**
 * Подменю — `Menu.Submenu`: пункт меню, в котором стоит, и меню своих
 * пунктов. Переходы плагинов — `plugins/__tests__/menu-submenu.plugin.spec.ts`,
 * сборка через лифт — `setup/__tests__/menu-submenu.spec.ts`; здесь — что в
 * React пункт входит в коллекцию меню над ним, а его пункты — в его
 * собственную (у трёх контекстов один лифт сборки: фасад пункта читает слой,
 * который подменю увидело на рендере, фасад меню пишет свой), связки стоят на
 * своих узлах, клавиши и нажатие ходят между уровнями, а выбор в подменю
 * закрывает всё меню.
 */
describe('подменю', () => {
	/** Строка пункта с подменю — узел с ролью у пункта «Поделиться». */
	function shareRow(): HTMLElement {
		const row = [...document.querySelectorAll<HTMLElement>('[aria-haspopup="menu"]')].find(
			(candidate) => candidate.textContent?.trim().startsWith('Поделиться'),
		)

		if (!row) throw new Error('строки «Поделиться» нет')

		return row
	}

	const rootPanel = () => panelOf(triggerNode())
	const subPanel = () => panelOf(shareRow())

	/** Меню «Изменить · Поделиться → (Ссылка, Почта) · Удалить» разметкой. */
	const markup = (menu: Partial<MenuProps> = {}, share: Partial<MenuSubmenuProps> = {}) => (
		<Menu {...menu} trigger={trigger}>
			<Menu.Item value="edit" text="Изменить" />
			<Menu.Submenu value="share" text="Поделиться" {...share}>
				<Menu.Item value="link" text="Ссылка" />
				<Menu.Item value="mail" text="Почта" />
			</Menu.Submenu>
			<Menu.Item value="remove" text="Удалить" />
		</Menu>
	)

	/** Открыть меню клавишей и спуститься на «Поделиться». */
	async function openOnShare(): Promise<void> {
		focus(triggerNode())
		await press(triggerNode(), 'ArrowDown')
		await press(rowIn(rootPanel(), 'Изменить'), 'ArrowDown')
	}

	it('строка — пункт меню, панель подменю — меню с именем от строки, в body и скрыта', async () => {
		const { container } = await render(markup())
		await open()

		const row = shareRow()

		expect(row.getAttribute('role')).toBe('menuitem')
		expect(row.getAttribute('tabindex')).toBe('-1')
		expect(row.getAttribute('aria-expanded')).toBe('false')
		expect(row.id).not.toBe('')
		expect(subPanel().getAttribute('role')).toBe('menu')
		expect(subPanel().getAttribute('aria-labelledby')).toBe(row.id)
		expect(subPanel().getAttribute('tabindex')).toBe('-1')
		expect(document.body.contains(subPanel())).toBe(true)
		expect(container.contains(subPanel())).toBe(false)
		expect(rootPanel().contains(subPanel())).toBe(false)
		expect(subPanel()).not.toBe(rootPanel())
		expect(shown(subPanel())).toBe(false)
		// Стрелка у конца строки — немая: подменю объявляет aria-haspopup
		expect(node('.so-menu-item__arrow', row).getAttribute('aria-hidden')).toBe('true')
		expect(row.querySelector('.so-menu-item__arrow .so-icon')).not.toBeNull()
	})

	it('пункт входит в меню над ним, его пункты — в его собственное меню', async () => {
		await render(markup())
		await open()

		expect(texts(rootPanel())).toEqual(['Изменить', 'Поделиться', 'Удалить'])

		await openSubmenu(shareRow())

		expect(texts(subPanel())).toEqual(['Ссылка', 'Почта'])

		// Close the level: the menu stays open, the submenu keeps its items
		await press(rowIn(subPanel(), 'Ссылка'), 'Escape')

		// Стрелки меню ходят по его пунктам: из «Поделиться» вниз — «Удалить»
		await openOnShare()

		expect(document.activeElement).toBe(shareRow())

		await press(shareRow(), 'ArrowDown')

		expect(document.activeElement).toBe(rowIn(rootPanel(), 'Удалить'))
	})

	it('→ открывает подменю на первом пункте, ← закрывает уровень — фокус на строке', async () => {
		await render(markup())

		await openOnShare()
		await press(shareRow(), 'ArrowRight')

		expect(shown(subPanel())).toBe(true)
		expect(shareRow().getAttribute('aria-expanded')).toBe('true')
		expect(document.activeElement).toBe(rowIn(subPanel(), 'Ссылка'))
		// Пункт подменю горит, пока открыта его панель
		expect(shareRow().parentElement?.dataset.open).toBe('true')

		await press(rowIn(subPanel(), 'Ссылка'), 'ArrowLeft')

		expect(shown(subPanel())).toBe(false)
		expect(shown(rootPanel())).toBe(true)
		expect(document.activeElement).toBe(shareRow())
	})

	it('Escape закрывает один уровень, следующий — меню', async () => {
		await render(markup())

		await openOnShare()
		await press(shareRow(), 'Enter')
		await press(rowIn(subPanel(), 'Ссылка'), 'Escape')

		expect(shown(subPanel())).toBe(false)
		expect(shown(rootPanel())).toBe(true)
		expect(document.activeElement).toBe(shareRow())

		await press(shareRow(), 'Escape')

		expect(shown(rootPanel())).toBe(false)
		expect(document.activeElement).toBe(triggerNode())
	})

	it('клик по строке открывает подменю, повторный его не закрывает', async () => {
		await render(markup())

		await open()
		click(shareRow())

		expect(shown(subPanel())).toBe(true)

		click(shareRow())

		expect(shown(subPanel())).toBe(true)
	})

	it('выбор в подменю закрывает всё меню, сообщает choose меню и подменю, фокус — на триггер', async () => {
		const root: unknown[] = []
		const nested: unknown[] = []

		await render(
			markup(
				{ onChoose: (item) => root.push(item.value) },
				{ onChoose: (item) => nested.push(item.value) },
			),
		)

		await openOnShare()
		await press(shareRow(), 'ArrowRight')
		click(rowIn(subPanel(), 'Почта'))
		await nextFrame()

		expect(root).toEqual(['mail'])
		expect(nested).toEqual(['mail'])
		expect(shown(rootPanel())).toBe(false)
		expect(shown(subPanel())).toBe(false)
		expect(document.activeElement).toBe(triggerNode())
	})

	it('Tab в подменю закрывает всё меню и ведёт к остановке за ним', async () => {
		await render(
			<div>
				{markup()}
				<button className="so-test-after">После</button>
			</div>,
		)

		await openOnShare()
		await press(shareRow(), 'ArrowRight')
		await press(rowIn(subPanel(), 'Ссылка'), 'Tab')

		expect(shown(rootPanel())).toBe(false)
		expect(shown(subPanel())).toBe(false)
		expect(document.activeElement).toBe(node('.so-test-after'))
	})

	it('open пропом и onChangeOpen — в обе стороны', async () => {
		const opened = appValue(false)

		function App(): ReactNode {
			return markup(
				{},
				{ open: opened.use(), onChangeOpen: ({ newValue }) => opened.write(newValue) },
			)
		}

		await render(<App />)

		await openOnShare()
		await press(shareRow(), 'ArrowRight')

		expect(opened.read()).toBe(true)

		write(opened, false)

		expect(shown(subPanel())).toBe(false)
	})

	it('размер меню — у панели подменю и у его пунктов', async () => {
		await render(markup({ size: 'lg' }))
		await open()
		await openSubmenu(shareRow())

		expect(subPanel().classList).toContain('so-menu__panel')
		expect(subPanel().classList).toContain('so-menu__panel--size-lg')
		expect(rowIn(subPanel(), 'Ссылка').parentElement?.classList).toContain(
			'so-menu-item--size-lg',
		)
	})

	/**
	 * Панель подменю телепортирована, и класс панели меню до её пунктов не
	 * доходит: вариант меню она несёт своим модификатором, а свой вариант
	 * подменю сильнее. Строкам — ни подменю, ни его пунктов — вариант меню не
	 * пишется: их тема красит с панели, в которой они стоят.
	 */
	it('вариант меню — у панели подменю, свой вариант подменю сильнее; смена на лету', async () => {
		const view = (variant: TComponentVariant | undefined, own: TComponentVariant | undefined) =>
			markup({ variant }, { variant: own })
		const { render: rerender } = await render(view('brand', undefined))
		await open()
		await openSubmenu(shareRow())

		expect(variantsOf(subPanel())).toEqual(['so-menu__panel--variant-brand'])
		expect(variantsOf(shareRow().parentElement)).toEqual([])
		expect(variantsOf(rowIn(subPanel(), 'Ссылка').parentElement)).toEqual([])

		rerender(view('danger', undefined))

		expect(variantsOf(subPanel())).toEqual(['so-menu__panel--variant-danger'])

		rerender(view('danger', 'brand'))

		expect(variantsOf(subPanel())).toEqual(['so-menu__panel--variant-brand'])
		expect(variantsOf(shareRow().parentElement)).toEqual(['so-menu-item--variant-brand'])

		// Под своим вариантом подменю смена у меню панели не трогает
		rerender(view(undefined, 'brand'))

		expect(variantsOf(subPanel())).toEqual(['so-menu__panel--variant-brand'])

		rerender(view(undefined, undefined))

		expect(variantsOf(subPanel())).toEqual([])
	})

	it('пункты подменю данными (items) — с группами и пробросом слотов, как у меню', async () => {
		await render(
			<Menu trigger={trigger}>
				<Menu.Submenu
					value="share"
					text="Поделиться"
					items={[
						{ value: 'link', text: 'Ссылка' },
						{ value: 'mail', text: 'Почта', _: { group: 'send' } },
					]}
					groups={[{ key: 'send', label: 'Отправить' }]}
					item={({ text }: { text: string }) => `${text}…`}
				/>
			</Menu>,
		)
		await open()
		await openSubmenu(shareRow())

		expect(texts(subPanel())).toEqual(['Почта…', 'Ссылка…'])
		expect(node('.so-menu-group__label', subPanel()).textContent).toBe('Отправить')
	})

	/**
	 * Разделители между секциями своих пунктов подменю просит само: свойство
	 * своё, с умолчанием меню, и от меню над ним не переходит.
	 */
	it('разделители секций подменю — свои: по умолчанию есть, groupSeparators снимает их только у него', async () => {
		const view = (separated: boolean | undefined) => (
			<Menu groupSeparators={false} trigger={trigger}>
				<Menu.Submenu
					value="share"
					text="Поделиться"
					items={[
						{ value: 'link', text: 'Ссылка' },
						{ value: 'mail', text: 'Почта', _: { group: 'send' } },
					]}
					groups={[{ key: 'send', label: 'Отправить' }]}
					groupSeparators={separated}
				/>
			</Menu>
		)
		const { render: rerender } = await render(view(undefined))
		await open()
		await openSubmenu(shareRow())

		// Меню своих разделителей не просит, а подменю — по своему умолчанию
		expect(subPanel().querySelectorAll('.so-menu-separator')).toHaveLength(1)

		rerender(view(false))

		expect(subPanel().querySelector('.so-menu-separator')).toBeNull()
	})

	/**
	 * Подменю из данных: пункт `items` с вложенным `items` меню рисует
	 * `Menu.Submenu` из записи коллекции (`ctrl`, `engine`), а подменю так же
	 * рисует свои — уровней сколько угодно. Модель — `core/__tests__/menu.spec.ts`,
	 * группа «коллекция меню · подменю из данных».
	 */
	describe('подменю из данных', () => {
		/**
		 * То же меню, что разметкой выше, — «Изменить · Поделиться → (Ссылка,
		 * Почта, Мессенджеры → Telegram) · Удалить», — данными, с третьим уровнем.
		 */
		const DATA: IMenuItemSource[] = [
			{ value: 'edit', text: 'Изменить' },
			{
				value: 'share',
				text: 'Поделиться',
				items: [
					{ value: 'link', text: 'Ссылка' },
					{ value: 'mail', text: 'Почта' },
					{
						value: 'messengers',
						text: 'Мессенджеры',
						items: [{ value: 'telegram', text: 'Telegram' }],
					},
				],
			},
			{ value: 'remove', text: 'Удалить' },
		]

		/** Строка подменю по тексту — на любом уровне. */
		function submenuRow(text: string): HTMLElement {
			const row = [...document.querySelectorAll<HTMLElement>('[aria-haspopup="menu"]')].find(
				(candidate) => candidate.textContent?.trim().startsWith(text),
			)

			if (!row) throw new Error(`строки подменю «${text}» нет`)

			return row
		}

		it('вариант меню — у панелей подменю из данных всех уровней', async () => {
			const view = (variant: TComponentVariant) => (
				<Menu items={DATA} variant={variant} trigger={trigger} />
			)
			const { render: rerender } = await render(view('brand'))
			await open()
			await openSubmenu(shareRow())

			const messengers = () => panelOf(submenuRow('Мессенджеры'))

			expect(variantsOf(subPanel())).toEqual(['so-menu__panel--variant-brand'])
			expect(variantsOf(messengers())).toEqual(['so-menu__panel--variant-brand'])

			rerender(view('danger'))

			expect(variantsOf(subPanel())).toEqual(['so-menu__panel--variant-danger'])
			expect(variantsOf(messengers())).toEqual(['so-menu__panel--variant-danger'])
		})

		it('пункт с items — подменю: строка объявляет меню, панель — его пункты, третий уровень — тоже', async () => {
			await render(<Menu items={DATA} trigger={trigger} />)
			await open()

			expect(texts(rootPanel())).toEqual(['Изменить', 'Поделиться', 'Удалить'])
			expect(shareRow().getAttribute('role')).toBe('menuitem')
			expect(shareRow().getAttribute('tabindex')).toBe('-1')
			expect(shareRow().getAttribute('aria-expanded')).toBe('false')
			expect(subPanel().getAttribute('role')).toBe('menu')
			expect(subPanel().getAttribute('aria-labelledby')).toBe(shareRow().id)
			expect(document.body.contains(subPanel())).toBe(true)
			expect(rootPanel().contains(subPanel())).toBe(false)
			expect(shown(subPanel())).toBe(false)

			// Each level's items mount with its first opening
			await openSubmenu(shareRow())

			const messengers = submenuRow('Мессенджеры')

			await openSubmenu(messengers)

			expect(texts(subPanel())).toEqual(['Ссылка', 'Почта', 'Мессенджеры'])
			// Третий уровень подменю рисует само
			expect(subPanel().contains(messengers)).toBe(true)
			expect(texts(panelOf(messengers))).toEqual(['Telegram'])
			expect(panelOf(messengers).getAttribute('aria-labelledby')).toBe(messengers.id)
		})

		it('клик по строке открывает подменю из данных, повторный его не закрывает', async () => {
			await render(<Menu items={DATA} trigger={trigger} />)

			await open()
			click(shareRow())

			expect(shown(subPanel())).toBe(true)
			expect(shareRow().getAttribute('aria-expanded')).toBe('true')

			click(shareRow())

			expect(shown(subPanel())).toBe(true)
		})

		it('→ открывает подменю из данных на первом пункте, ← закрывает уровень — фокус на строке', async () => {
			await render(<Menu items={DATA} trigger={trigger} />)

			await openOnShare()
			await press(shareRow(), 'ArrowRight')

			expect(shown(subPanel())).toBe(true)
			expect(document.activeElement).toBe(rowIn(subPanel(), 'Ссылка'))

			await press(rowIn(subPanel(), 'Ссылка'), 'ArrowLeft')

			expect(shown(subPanel())).toBe(false)
			expect(shown(rootPanel())).toBe(true)
			expect(document.activeElement).toBe(shareRow())
		})

		it('клавиши и выбор на втором уровне: choose — корню, меню закрыто целиком, фокус — на триггер', async () => {
			const chosen: unknown[] = []

			await render(
				<Menu
					items={DATA}
					onChoose={(item) => chosen.push(item.value)}
					trigger={trigger}
				/>,
			)

			await openOnShare()
			await press(shareRow(), 'ArrowRight')
			await press(rowIn(subPanel(), 'Ссылка'), 'ArrowDown')

			expect(document.activeElement).toBe(rowIn(subPanel(), 'Почта'))

			await press(rowIn(subPanel(), 'Почта'), 'Enter')

			expect(chosen).toEqual(['mail'])
			expect(shown(rootPanel())).toBe(false)
			expect(shown(subPanel())).toBe(false)
			expect(document.activeElement).toBe(triggerNode())
		})

		it('третий уровень: → открывает его, выбор доходит до корня и закрывает все уровни', async () => {
			const chosen: unknown[] = []

			await render(
				<Menu
					items={DATA}
					onChoose={(item) => chosen.push(item.value)}
					trigger={trigger}
				/>,
			)

			await openOnShare()
			await press(shareRow(), 'ArrowRight')
			await press(rowIn(subPanel(), 'Ссылка'), 'End')

			const messengers = submenuRow('Мессенджеры')
			const deep = panelOf(messengers)

			expect(document.activeElement).toBe(messengers)

			await press(messengers, 'ArrowRight')

			expect(shown(deep)).toBe(true)
			expect(document.activeElement).toBe(rowIn(deep, 'Telegram'))

			await press(rowIn(deep, 'Telegram'), 'Enter')

			expect(chosen).toEqual(['telegram'])
			expect([shown(rootPanel()), shown(subPanel()), shown(deep)]).toEqual([
				false,
				false,
				false,
			])
			expect(document.activeElement).toBe(triggerNode())
		})

		it('патч по trackBy: строка, панель и пункты подменю — те же узлы, текст и состав — новые', async () => {
			const view = (items: IMenuItemSource[]) => (
				<Menu
					items={items}
					trackBy={(item: { value?: unknown }) => item.value}
					trigger={trigger}
				/>
			)
			const { render: rerender } = await render(view(DATA))
			await open()
			await openSubmenu(shareRow())

			const row = shareRow()
			const share = subPanel()
			const link = rowIn(share, 'Ссылка')

			rerender(
				view([
					{ value: 'edit', text: 'Изменить' },
					{
						value: 'share',
						text: 'Отправить',
						items: [
							{ value: 'link', text: 'Ссылкой' },
							{ value: 'sms', text: 'СМС' },
						],
					},
					{ value: 'remove', text: 'Удалить' },
				]),
			)

			expect(row.isConnected).toBe(true)
			expect(row.textContent?.trim()).toBe('Отправить')
			expect(panelOf(row)).toBe(share)
			expect(rowIn(share, 'Ссылкой')).toBe(link)
			expect(texts(share)).toEqual(['Ссылкой', 'СМС'])
		})

		it('слоты пунктов из данных — одни на все уровни: значок, текст, строка и стрелка подменю', async () => {
			await render(
				<Menu
					items={DATA}
					trigger={trigger}
					item-leading={({ item }: { item: IMenuItem }) => (
						<i className="so-test-icon" data-value={String(item.value)} />
					)}
					item={({ text }: { text: string }) => `${text}…`}
					item-header={({ text, open }: { text: string; open: boolean }) =>
						open ? `${text} ▸` : text
					}
					item-arrow-icon={({ item }: { item: IMenuItem }) => (
						<b className="so-test-arrow" data-value={String(item.value)} />
					)}
				/>,
			)
			await open()
			await openSubmenu(shareRow())
			await openSubmenu(submenuRow('Мессенджеры'))
			// Close both levels: the menu stays open, the submenus keep their items
			await press(rowIn(panelOf(submenuRow('Мессенджеры')), 'Telegram'), 'Escape')
			await press(rowIn(subPanel(), 'Ссылка'), 'Escape')

			const messengers = submenuRow('Мессенджеры')
			const label = (row: HTMLElement) => node('.so-button__text', row).textContent
			const mark = (selector: string, row: HTMLElement) => node(selector, row).dataset.value

			// Действия — слот `item`, строки подменю — `item-header`, на каждом уровне
			expect(label(rowIn(rootPanel(), 'Изменить'))).toBe('Изменить…')
			expect(label(shareRow())).toBe('Поделиться')
			expect(label(rowIn(subPanel(), 'Ссылка'))).toBe('Ссылка…')
			expect(label(messengers)).toBe('Мессенджеры')
			expect(label(rowIn(panelOf(messengers), 'Telegram'))).toBe('Telegram…')
			// Значок — у строк обоих видов, стрелка — у подменю, с пунктом в scope
			expect(mark('.so-menu-item__icon .so-test-icon', rowIn(rootPanel(), 'Изменить'))).toBe(
				'edit',
			)
			expect(mark('.so-menu-item__icon .so-test-icon', shareRow())).toBe('share')
			expect(mark('.so-menu-item__icon .so-test-icon', messengers)).toBe('messengers')
			expect(mark('.so-menu-item__arrow .so-test-arrow', shareRow())).toBe('share')
			expect(mark('.so-menu-item__arrow .so-test-arrow', messengers)).toBe('messengers')

			// Строка подменю получает его открытость
			click(shareRow())

			expect(label(shareRow())).toBe('Поделиться ▸')
			expect(label(messengers)).toBe('Мессенджеры')
		})

		it('item-content — пункты одного подменю разметкой, у другого остаются свои из данных', async () => {
			const chosen: unknown[] = []

			await render(
				<Menu
					items={[
						{
							value: 'share',
							text: 'Поделиться',
							items: [
								{ value: 'link', text: 'Ссылка' },
								{ value: 'mail', text: 'Почта' },
							],
						},
						{ value: 'export', text: 'Экспорт', items: [] },
					]}
					onChoose={(item) => chosen.push(item.value)}
					trigger={trigger}
					item-content={({ item }: { item: IMenuItem }) =>
						item.value === 'export' ? (
							<>
								<Menu.Item value="pdf" text="PDF" />
								<Menu.Item value="png" text="PNG" />
							</>
						) : null
					}
				/>,
			)
			await open()

			const exportRow = submenuRow('Экспорт')

			await openSubmenu(shareRow())

			expect(texts(subPanel())).toEqual(['Ссылка', 'Почта'])

			await openSubmenu(exportRow)

			expect(texts(panelOf(exportRow))).toEqual(['PDF', 'PNG'])

			// Close the level: the menu stays open, the submenu keeps its items
			await press(rowIn(panelOf(exportRow), 'PDF'), 'Escape')

			// Пункты разметки — пункты этого подменю: стрелки и выбор идут по ним
			focus(triggerNode())
			await press(triggerNode(), 'ArrowDown')
			await press(shareRow(), 'ArrowDown')
			await press(exportRow, 'ArrowRight')

			expect(document.activeElement).toBe(rowIn(panelOf(exportRow), 'PDF'))

			await press(rowIn(panelOf(exportRow), 'PDF'), 'ArrowDown')
			await press(rowIn(panelOf(exportRow), 'PNG'), 'Enter')

			expect(chosen).toEqual(['png'])
			expect(shown(rootPanel())).toBe(false)
		})

		/**
		 * Без `trackBy` замена `items` пересобирает меню: подменю — новый пункт с
		 * новым движком, и строку пункта разметка рисует заново — ключ `uid`.
		 * Пункты шаблона входят в движок нового подменю: вложенный состав на
		 * месте пропсы без `trackBy` не пишут, и снять их нечему.
		 */
		it('item-content и замена items без trackBy: подменю новое, пункты шаблона — в его коллекции, стрелки и выбор идут по ним', async () => {
			const chosen: unknown[] = []
			const engine = createEngineMenu()
			const values = () =>
				submenuOf(engine, 'export').engine.extensions.batch.items.map((item) => item.value)
			const view = (items: IMenuItemSource[]) => (
				<Menu
					engine={engine}
					items={items}
					onChoose={(item) => chosen.push(item.value)}
					trigger={trigger}
					item-content={() => (
						<>
							<Menu.Item value="pdf" text="PDF" />
							<Menu.Item value="png" text="PNG" />
						</>
					)}
				/>
			)
			const { render: rerender } = await render(
				view([{ value: 'export', text: 'Экспорт', items: [] }]),
			)
			await open()
			await openSubmenu(submenuRow('Экспорт'))
			const replaced = submenuOf(engine, 'export')

			expect(values()).toEqual(['pdf', 'png'])

			rerender(view([{ value: 'export', text: 'Выгрузка', items: [] }]))
			await nextFrame()

			// Новый пункт и новый движок; пункты шаблона — в нём, прежний пуст
			const row = submenuRow('Выгрузка')

			// The new submenu mounts them with its own first opening
			await openSubmenu(row)

			expect(submenuOf(engine, 'export').ctrl).not.toBe(replaced.ctrl)
			expect(submenuOf(engine, 'export').engine).not.toBe(replaced.engine)
			expect(values()).toEqual(['pdf', 'png'])
			expect(replaced.engine.extensions.batch.items).toEqual([])
			expect(texts(panelOf(row))).toEqual(['PDF', 'PNG'])

			focus(triggerNode())
			await press(triggerNode(), 'ArrowDown')
			await press(row, 'ArrowRight')

			expect(document.activeElement).toBe(rowIn(panelOf(row), 'PDF'))

			await press(rowIn(panelOf(row), 'PDF'), 'ArrowDown')
			await press(rowIn(panelOf(row), 'PNG'), 'Enter')

			expect(chosen).toEqual(['png'])
			expect(shown(rootPanel())).toBe(false)
		})

		/** Запись подменю из данных по значению пункта. */
		function submenuOf(engine: TMenuCollection, value: string) {
			const { batch, submenus } = engine.extensions
			const item = batch.items.find((candidate) => candidate.value === value)
			const entry = item ? submenus.entries.get(item) : undefined

			if (!entry) throw new Error(`подменю «${value}» нет`)

			return entry
		}

		const GROUP: TGroup[] = [{ key: 'g' }]

		/**
		 * Пункты рядом с подменю — есть ли секция без группы, в которую оно
		 * переедет, — и секции до переезда. У Solid от соседей зависит порядок
		 * снятия и приёма; у React он один: очистки удалённых идут раньше
		 * эффектов новых в том же коммите, и прежнее монтирование снято раньше,
		 * чем принято новое, — в секцию, что уже есть, и в новую.
		 */
		const NEIGHBOURS: ReadonlyArray<
			readonly [string, TCollectionEngineItemSource<IMenuItemSource>[], readonly string[]]
		> = [
			[
				'в секцию без группы, что уже есть',
				[{ value: 'remove', text: 'Удалить' }],
				['group:g', 'free'],
			],
			['в новую секцию без группы', [], ['group:g']],
		]

		/**
		 * Подменю, переехавшее в другую секцию, React снимает с прежнего места и
		 * собирает на новом — с той же записью: тем же пунктом и тем же движком.
		 * Привязку владельца его движка держит живое монтирование: снятие
		 * прежнего привязку не уносит, а приём нового её забирает.
		 */
		it.each(NEIGHBOURS)(
			'переезд %s: владелец движка подменю на месте, размер меню — у его пунктов, выбор — до корня',
			async (_case, neighbours, before) => {
				const chosen: unknown[] = []
				const engine = createEngineMenu()
				const nested: IMenuItemSource[] = [
					{ value: 'link', text: 'Ссылка' },
					{ value: 'mail', text: 'Почта' },
				]
				const sections = () =>
					engine.extensions.group.sections.map((section) => section.key)
				const view = (
					items: TCollectionEngineItemSource<IMenuItemSource>[],
					size: TComponentSize,
				) => (
					<Menu
						engine={engine}
						items={items}
						groups={GROUP}
						size={size}
						onChoose={(item) => chosen.push(item.value)}
						trigger={trigger}
					/>
				)

				engine.extensions.batch.trackBy = (item) => item.value

				const { render: rerender } = await render(
					view(
						[
							{
								value: 'share',
								text: 'Поделиться',
								items: nested,
								_: { group: 'g' },
							},
							...neighbours,
						],
						'lg',
					),
				)

				// The first opening of the menu and the submenu mounts their items;
				// closing the menu keeps them
				await open()
				await openSubmenu(shareRow())
				await open()

				const share = submenuOf(engine, 'share')
				const row = shareRow()

				expect(sections()).toEqual(before)
				expect(share.engine.options.get('owner')).toBe(share.ctrl)

				// Патч снял группу: подменю переезжает в секцию без группы
				const moved: TCollectionEngineItemSource<IMenuItemSource>[] = [
					{ value: 'share', text: 'Поделиться', items: nested, _: { group: undefined } },
					...neighbours,
				]

				// Сборка нового подменю пишет id в тот же пункт, а прежнее, ещё не
				// снятое, перечитывает их после сборки, а не посреди чужого рендера
				// (`TAssembling`): предупреждения React нет, его роняет сторож консоли
				rerender(view(moved, 'lg'))
				await nextFrame()

				// Перемонтировано — новые узлы, та же запись
				expect(sections()).toEqual(['free'])
				expect(row.isConnected).toBe(false)
				expect(submenuOf(engine, 'share')).toBe(share)
				expect(share.engine.options.get('owner')).toBe(share.ctrl)

				// Размер меню доходит до пунктов подменю через его владельца
				rerender(view(moved, 'sm'))

				expect(rowIn(subPanel(), 'Ссылка').parentElement?.classList).toContain(
					'so-menu-item--size-sm',
				)

				await open()
				click(shareRow())
				click(rowIn(subPanel(), 'Почта'))
				await nextFrame()

				expect(chosen).toEqual(['mail'])
				expect(shown(rootPanel())).toBe(false)
				expect(shown(subPanel())).toBe(false)
			},
		)
	})
})

/**
 * Пункт с панелью — `Menu.PopoverItem`: строка открывает сбоку немодальную
 * панель-диалог с любым содержимым. Переходы плагинов —
 * `plugins/__tests__/menu-popover-item.plugin.spec.ts`; здесь — что в React
 * пункт входит в коллекцию меню, связки стоят на своих узлах, панель
 * телепортирована и открывается нажатием и клавишами, фокус ходит между
 * меню и панелью, а содержимое панели меню не закрывает.
 */
describe('пункт с панелью', () => {
	/** Строка пункта с панелью — узел с ролью у пункта «Срок». */
	const dueRow = () => node('.so-menu-item > [aria-haspopup="dialog"]')

	const rootPanel = () => panelOf(triggerNode())
	const duePanel = () => panelOf(dueRow())

	/**
	 * Меню «Изменить · Срок → (Раньше, Позже) · Поделиться → (Ссылка)»
	 * разметкой; `due` — пропсы пункта с панелью.
	 */
	const markup = (menu: Partial<MenuProps> = {}, due: Partial<MenuPopoverItemProps> = {}) => (
		<Menu {...menu} trigger={trigger}>
			<Menu.Item value="edit" text="Изменить" />
			<Menu.PopoverItem value="due" text="Срок" {...due}>
				<button className="so-test-earlier">Раньше</button>
				<button className="so-test-later">Позже</button>
			</Menu.PopoverItem>
			<Menu.Submenu value="share" text="Поделиться">
				<Menu.Item value="link" text="Ссылка" />
			</Menu.Submenu>
		</Menu>
	)

	/** Открыть меню клавишей и спуститься на «Срок». */
	async function openOnDue(): Promise<void> {
		focus(triggerNode())
		await press(triggerNode(), 'ArrowDown')
		await press(rowIn(rootPanel(), 'Изменить'), 'ArrowDown')
	}

	it('строка — пункт меню, панель — диалог с именем от строки, в body и скрыта', async () => {
		const { container } = await render(markup())
		await open()

		const row = dueRow()

		expect(row.getAttribute('role')).toBe('menuitem')
		expect(row.getAttribute('tabindex')).toBe('-1')
		expect(row.getAttribute('aria-expanded')).toBe('false')
		expect(row.id).not.toBe('')
		expect(duePanel().getAttribute('role')).toBe('dialog')
		expect(duePanel().getAttribute('aria-labelledby')).toBe(row.id)
		expect(duePanel().getAttribute('tabindex')).toBe('-1')
		expect(duePanel().classList).toContain('so-menu-item__panel')
		expect(document.body.contains(duePanel())).toBe(true)
		expect(container.contains(duePanel())).toBe(false)
		expect(rootPanel().contains(duePanel())).toBe(false)
		expect(duePanel()).not.toBe(rootPanel())
		expect(shown(duePanel())).toBe(false)
		// Содержимое — в своей обёртке, без lazyMount смонтировано сразу
		expect(duePanel().querySelector('.so-menu-item__content .so-test-earlier')).not.toBeNull()
		// Стрелка у конца строки — немая: о панели говорит aria-haspopup
		expect(node('.so-menu-item__arrow', row).getAttribute('aria-hidden')).toBe('true')
		expect(row.querySelector('.so-menu-item__arrow .so-icon')).not.toBeNull()
		// Пункт — в коллекции меню, рядом с остальными
		expect(texts(rootPanel())).toEqual(['Изменить', 'Срок', 'Поделиться'])
	})

	it('клик по строке открывает панель — фокус в ней, повторный клик её не закрывает', async () => {
		await render(markup())

		await open()
		click(dueRow())
		await nextFrame()

		expect(shown(duePanel())).toBe(true)
		expect(dueRow().getAttribute('aria-expanded')).toBe('true')
		expect(dueRow().parentElement?.dataset.open).toBe('true')
		expect(document.activeElement).toBe(node('.so-test-earlier'))

		click(dueRow())

		expect(shown(duePanel())).toBe(true)
		expect(shown(rootPanel())).toBe(true)
	})

	it.each(['ArrowRight', 'Enter'])(
		'%s на строке открывает панель — фокус на её первой остановке, меню открыто',
		async (key) => {
			await render(markup())

			await openOnDue()

			expect(document.activeElement).toBe(dueRow())

			await press(dueRow(), key)

			expect(shown(duePanel())).toBe(true)
			expect(shown(rootPanel())).toBe(true)
			expect(document.activeElement).toBe(node('.so-test-earlier'))
		},
	)

	it('Escape в панели закрывает её — фокус на строке; следующий Escape — меню', async () => {
		await render(markup())

		await openOnDue()
		await press(dueRow(), 'ArrowRight')
		await press(node('.so-test-earlier'), 'Escape')

		expect(shown(duePanel())).toBe(false)
		expect(shown(rootPanel())).toBe(true)
		expect(document.activeElement).toBe(dueRow())

		await press(dueRow(), 'Escape')

		expect(shown(rootPanel())).toBe(false)
		expect(document.activeElement).toBe(triggerNode())
	})

	it('Shift+Tab с первой остановки — на строку, Tab со строки — снова в панель', async () => {
		await render(markup())

		await openOnDue()
		await press(dueRow(), 'ArrowRight')
		await press(node('.so-test-earlier'), 'Tab', { shiftKey: true })

		expect(document.activeElement).toBe(dueRow())
		expect(shown(duePanel())).toBe(true)

		await press(dueRow(), 'Tab')

		expect(document.activeElement).toBe(node('.so-test-earlier'))
	})

	it('стрелка к концу строки открытого пункта ведёт фокус в его панель', async () => {
		await render(markup())

		await openOnDue()
		await press(dueRow(), 'ArrowRight')
		// Фокус на строке, панель открыта — как после открытия наведением
		await press(node('.so-test-earlier'), 'Tab', { shiftKey: true })

		expect(document.activeElement).toBe(dueRow())

		const event = await press(dueRow(), 'ArrowRight')

		expect(event.defaultPrevented).toBe(true)
		expect(shown(duePanel())).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-earlier'))
	})

	it('Tab с последней остановки закрывает всё меню и ведёт к остановке за ним', async () => {
		await render(
			<div>
				{markup()}
				<button className="so-test-after">После</button>
			</div>,
		)

		await openOnDue()
		await press(dueRow(), 'ArrowRight')
		focus(node('.so-test-later'))
		await press(node('.so-test-later'), 'Tab')

		expect(shown(rootPanel())).toBe(false)
		expect(shown(duePanel())).toBe(false)
		expect(document.activeElement).toBe(node('.so-test-after'))
	})

	it('нажатие в содержимом панели меню не закрывает и не выбирает пункт', async () => {
		const chosen: unknown[] = []

		await render(markup({ onChoose: (item) => chosen.push(item.value) }))

		await open()
		click(dueRow())
		await nextFrame()
		click(node('.so-test-later'))

		expect(shown(rootPanel())).toBe(true)
		expect(shown(duePanel())).toBe(true)
		expect(chosen).toEqual([])
	})

	it('открыта одна панель: пункт с панелью закрывает подменю, и подменю — его', async () => {
		await render(markup())

		const shareRow = () => node('.so-menu-item > [aria-haspopup="menu"]')

		await open()
		click(shareRow())
		click(dueRow())

		expect(shown(duePanel())).toBe(true)
		expect(shown(panelOf(shareRow()))).toBe(false)

		click(shareRow())

		expect(shown(duePanel())).toBe(false)
		expect(shown(panelOf(shareRow()))).toBe(true)
	})

	it('lazyMount: содержимое — с первого открытия, закрытие его не снимает', async () => {
		await render(markup({}, { lazyMount: true }))
		await open()

		expect(duePanel().querySelector('.so-test-earlier')).toBeNull()
		expect(duePanel().querySelector('.so-menu-item__content')).not.toBeNull()

		click(dueRow())

		expect(duePanel().querySelector('.so-test-earlier')).not.toBeNull()

		await press(node('.so-test-earlier'), 'Escape')

		expect(shown(duePanel())).toBe(false)
		expect(duePanel().querySelector('.so-test-earlier')).not.toBeNull()
	})

	it('open пропом и onChangeOpen — в обе стороны', async () => {
		const opened = appValue(false)

		function App(): ReactNode {
			return markup(
				{},
				{ open: opened.use(), onChangeOpen: ({ newValue }) => opened.write(newValue) },
			)
		}

		await render(<App />)

		await openOnDue()
		await press(dueRow(), 'ArrowRight')

		expect(opened.read()).toBe(true)

		write(opened, false)

		expect(shown(duePanel())).toBe(false)
	})

	it('слоты строки: значок, свой текст со scope и своя стрелка', async () => {
		await render(
			<Menu trigger={trigger}>
				<Menu.PopoverItem
					value="due"
					text="Срок"
					leading={<i className="so-test-icon" />}
					header={({ text, open }: { text: string; open: boolean }) =>
						`${text}: ${open ? 'открыт' : 'закрыт'}`
					}
					arrow-icon={<b className="so-test-arrow" />}
				>
					Календарь
				</Menu.PopoverItem>
			</Menu>,
		)
		await open()

		const row = dueRow()

		expect(row.querySelector('.so-menu-item__icon .so-test-icon')).not.toBeNull()
		expect(node('.so-button__text', row).textContent).toBe('Срок: закрыт')
		expect(row.querySelector('.so-menu-item__arrow .so-test-arrow')).not.toBeNull()
		expect(row.querySelector('.so-menu-item__arrow .so-icon')).toBeNull()
		expect(node('.so-menu-item__content', duePanel()).textContent).toBe('Календарь')
	})

	it('размер меню — у пункта с панелью, вариант — свой; у панели модификаторов нет', async () => {
		await render(markup({ size: 'lg' }, { variant: 'danger' }))
		await open()

		const item = dueRow().parentElement

		expect(item?.classList).toContain('so-menu-item--size-lg')
		expect(item?.classList).toContain('so-menu-item--variant-danger')
		// Содержимое панели красится само: размер и вариант меню ему ни к чему
		expect([...duePanel().classList].some((cls) => cls.includes('--size-'))).toBe(false)
	})
})

/**
 * Своё у React: сборка идёт на рендере, пункты входят в коллекцию при
 * коммите, якорь панели — корень значением рендера (`useRootElement`), а
 * портала на сервере нет.
 */
describe('React', () => {
	/** Меню со своим движком и подменю со своим: состав обоих видно после пересборки. */
	const strictMenu = (
		engine: TMenuCollection,
		nested: TMenuCollection,
		chosen: unknown[],
	): ReactElement => (
		<StrictMode>
			<Menu engine={engine} onChoose={(item) => chosen.push(item.value)} trigger={trigger}>
				<Menu.Item value="edit" text="Изменить" />
				<Menu.Submenu value="share" text="Поделиться" engine={nested}>
					<Menu.Item value="link" text="Ссылка" />
					<Menu.Item value="mail" text="Почта" />
				</Menu.Submenu>
				<Menu.Item value="remove" text="Удалить" />
			</Menu>
		</StrictMode>
	)

	/** Значения пунктов движка по порядку. */
	const values = (engine: TMenuCollection) =>
		engine.extensions.batch.items.map((item) => item.value)

	/**
	 * StrictMode пересобирает меню, а с ним и подменю: у пересобранного
	 * подменю три контекста снова на одном лифте, фасад пункта читает слой
	 * пересобранного меню. Пункты разметки входят в коллекции по одному разу —
	 * пункты меню в меню, пункты подменю в подменю, — панелей по одной на
	 * уровень, и выбор в подменю закрывает всё меню.
	 */
	it('StrictMode: панель одна на уровень, пункты разметки — в своих коллекциях по разу, выбор работает', async () => {
		const engine = createEngineMenu()
		const nested = createEngineMenu()
		const chosen: unknown[] = []

		await render(strictMenu(engine, nested, chosen))

		// Never opened: only the menu's panel, its items are not mounted
		expect(document.querySelectorAll('.so-menu__panel')).toHaveLength(1)
		expect(values(engine)).toEqual([])

		focus(triggerNode())
		await press(triggerNode(), 'ArrowDown')

		expect(document.querySelectorAll('.so-menu__panel')).toHaveLength(2)
		expect(values(engine)).toEqual(['edit', 'share', 'remove'])
		expect(values(nested)).toEqual([])

		await press(rowIn(panelOf(triggerNode()), 'Изменить'), 'ArrowDown')

		const share = rowIn(panelOf(triggerNode()), 'Поделиться')

		expect(document.activeElement).toBe(share)

		await press(share, 'ArrowRight')

		expect(values(nested)).toEqual(['link', 'mail'])
		expect(document.activeElement).toBe(rowIn(panelOf(share), 'Ссылка'))

		await press(rowIn(panelOf(share), 'Ссылка'), 'Enter')

		expect(chosen).toEqual(['link'])
		expect(shown(panelOf(triggerNode()))).toBe(false)
		expect(shown(panelOf(share))).toBe(false)
		expect(document.activeElement).toBe(triggerNode())
	})

	it('серверная разметка — корень с триггером, панели нет: портала на сервере нет', () => {
		const host = document.createElement('div')

		host.innerHTML = renderToString(<Menu items={ITEMS} trigger={trigger} />)

		expect(host.querySelector('.so-menu .so-test-trigger')).not.toBeNull()
		expect(host.querySelector('.so-menu__panel')).toBeNull()
		expect(host.querySelector('.so-menu-item')).toBeNull()
	})

	/**
	 * Hydration matches: there is no panel on the server and during hydration;
	 * after it the panel appears in `body`, the markup items enter the
	 * collection with the first opening — by a key too — and the keys move
	 * over them. The trigger's `id` comes from `useId` and stays the same across
	 * hydration. `aria-controls` is projected after the client mounts the menu.
	 */
	it('гидратация без расхождений; после неё панель в body, пункты в коллекции, клавиши работают', async () => {
		const engine = createEngineMenu()
		const chosen: unknown[] = []
		const element = (
			<Menu engine={engine} onChoose={(item) => chosen.push(item.value)} trigger={trigger}>
				<Menu.Item value="edit" text="Изменить" />
				<Menu.Item value="remove" text="Удалить" />
			</Menu>
		)
		const container = document.createElement('div')
		const onRecoverableError = vi.fn()

		container.innerHTML = renderToString(element)
		document.body.append(container)

		const serverTrigger = triggerNode()

		expect(serverTrigger.getAttribute('aria-haspopup')).toBe('menu')
		expect(serverTrigger.hasAttribute('aria-controls')).toBe(false)

		act(() => {
			track(hydrateRoot(container, element, { onRecoverableError }))
		})
		await nextFrame()

		expect(onRecoverableError).not.toHaveBeenCalled()
		expect(triggerNode()).toBe(serverTrigger)
		expect(document.body.contains(panel())).toBe(true)
		expect(container.contains(panel())).toBe(false)
		expect(panelOf(triggerNode())).toBe(panel())
		expect(values(engine)).toEqual([])

		focus(triggerNode())
		await press(triggerNode(), 'ArrowDown')

		expect(values(engine)).toEqual(['edit', 'remove'])
		expect(document.activeElement).toBe(rowOf('Изменить'))

		await press(rowOf('Изменить'), 'ArrowDown')
		await press(rowOf('Удалить'), 'Enter')

		expect(chosen).toEqual(['remove'])
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(triggerNode())
	})
})
