/**
 * Drawer в Solid — проводка целиком, на настоящей разметке.
 *
 * Модель проверяет ядро (`core/__tests__/drawer.spec.ts`), жест и правила
 * фокуса и нажатия мимо — плагины; здесь важно, что они сходятся: панель
 * телепортирована вместе с подложкой, а внутри контейнера остаётся на месте,
 * полоса жеста рисуется по ядру, кнопка закрытия и жест говорят с ядром, три
 * причины закрытия и жест проходят через запрос, а замок прокрутки знает, где
 * панель стоит. Сценарии — те же, что у Vue (`ui/vue/__tests__/drawer.spec.ts`);
 * открытость, которую Vue держит `v-model`, здесь возвращает пропом колбэк
 * `onChangeVisible`.
 *
 * Телепорт стоит на `Portal` Solid, а тот кладёт в цель свою обёртку и рисует
 * панель в ней: подложка и панель — соседи в этой обёртке, а не прямо в
 * `body`. Поэтому место панели проверяется тем, в какой цели она лежит
 * (`contains`), а соседство и порядок — друг с другом.
 *
 * Своё у Solid — смена `contained` и цели на лету, как у Vue, переносит панель
 * с подложкой теми же узлами: содержимое `Teleport` разворачивает один раз.
 * Набранное в поле панели остаётся, а замок прокрутки панели, вернувшейся из
 * контейнера, встаёт сразу — новый узел, как у React и Svelte, плагины
 * получили бы кадром позже.
 *
 * Раскладку, анимацию темы и настоящий указатель jsdom не выполняет — край,
 * размер, контейнер и жест мышью — `playground/vue/browser/drawer.spec.ts`.
 */

import { describe, it, expect, vi } from 'vitest'
import { createSignal, type JSX } from 'solid-js'
import { TDrawer } from '@soxa-ui/core'
import type { TCloseEvent, TCloseReason, TValuePayload } from '@soxa-ui/core'
import { ruRU } from '@soxa-ui/plugins'
import { Dialog, Drawer, LocaleProvider, type DrawerProps } from '@soxa-ui/solid'
import { find, mount, nextFrame, type TMounted } from './mount'

/** Узел по селектору; нет его — тест падает здесь, а не на чтении свойства. */
const node = (selector: string, scope: ParentNode = document) => find(scope, selector, HTMLElement)

const panel = (scope: ParentNode = document) => node('.so-drawer', scope)
const backdrop = (scope: ParentNode = document) => node('.so-backdrop:has(+ .so-drawer)', scope)
const isOpen = (element: HTMLElement = panel()) => element.style.display !== 'none'
const opener = () => node('.so-test-opener')
const host = () => node('.so-test-host')

/** Нажатие мимо — `pointerdown`, как его слушает плагин оверлея. */
const pointerDown = (target: Element) =>
	target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }))

/** Клавиша на элементе под фокусом. Отдаёт событие: по нему видно, погашена ли она. */
function press(key: string): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

	;(document.activeElement ?? document.body).dispatchEvent(event)

	return event
}

/** Содержимое панели с двумя остановками Tab. */
const inside = () => (
	<>
		<button class="so-test-first">Первая</button>
		<button class="so-test-second">Вторая</button>
	</>
)

type TPageOptions = {
	/** Пропсы панели; `data-*` в JSX — атрибут, а объекту его тип называет сам. */
	props?: DrawerProps & { [name: `data-${string}`]: string }
	content?: () => JSX.Element
}

/** Страница: открытость панели, журнал открытости, которую получил потребитель, и монтирование. */
type TPage = {
	/** Открытость — сигнал родителя: его пишет и тест, и панель (`onChangeVisible`). */
	readonly visible: () => boolean
	readonly setVisible: (value: boolean) => void
	/** Что панель сообщила `onChangeVisible`. */
	readonly changes: readonly boolean[]
	readonly mounted: TMounted
}

/**
 * Страница с кнопкой, которая открывает панель, и сама панель внутри
 * контейнера `.so-test-host`; открытость — сигнал родителя, колбэк
 * `onChangeVisible` пишет её в тот же сигнал. Корень плагины получают через
 * `requestAnimationFrame`, поэтому кадр выждан.
 */
async function render({ props = {}, content = inside }: TPageOptions = {}): Promise<TPage> {
	const [visible, setVisible] = createSignal(false)
	const changes: boolean[] = []
	const mounted = mount(() => (
		<div class="so-test-host">
			<button class="so-test-opener">Открыть</button>
			<Drawer
				title="Фильтры"
				{...props}
				visible={visible()}
				onChangeVisible={({ newValue: value }: TValuePayload<boolean>) => {
					changes.push(value)
					setVisible(value)
				}}
			>
				{content()}
			</Drawer>
		</div>
	))

	await nextFrame()

	return { visible, setVisible: (value) => setVisible(value), changes, mounted }
}

/** Открыть панель с кнопки страницы и дождаться, пока фокус уйдёт в неё. */
async function open(page: TPage): Promise<void> {
	opener().focus()
	page.setVisible(true)

	await nextFrame()
}

/** Закрыть панель записью родителя и дождаться кадра. */
async function close(page: TPage): Promise<void> {
	page.setVisible(false)

	await nextFrame()
}

describe('разметка', () => {
	it('поверх страницы: подложка и панель телепортированы соседями, подложка раньше', async () => {
		await render()

		expect(document.body.contains(panel())).toBe(true)
		expect(host().contains(panel())).toBe(false)
		expect(host().contains(backdrop())).toBe(false)
		expect(backdrop().parentElement).toBe(panel().parentElement)
		expect(backdrop().nextElementSibling).toBe(panel())
	})

	it('внутри контейнера: панель и подложка остаются на месте, target не действует', async () => {
		const elsewhere = document.createElement('div')

		elsewhere.id = 'so-test-elsewhere'
		document.body.appendChild(elsewhere)

		await render({ props: { contained: true, target: '#so-test-elsewhere' } })

		expect(panel().parentElement).toBe(host())
		expect(backdrop().parentElement).toBe(host())
		expect(backdrop().nextElementSibling).toBe(panel())
		expect(elsewhere.children).toHaveLength(0)
		expect(panel().dataset.contained).toBe('true')
		expect(backdrop().dataset.contained).toBe('true')
	})

	it('contained на лету переносит панель из цели в контейнер и обратно', async () => {
		const drawer = new TDrawer()

		await render({ props: { ctrl: drawer } })

		expect(host().contains(panel())).toBe(false)

		drawer.contained = true

		expect(panel().parentElement).toBe(host())
		expect(document.querySelectorAll('.so-drawer')).toHaveLength(1)

		drawer.contained = false

		expect(host().contains(panel())).toBe(false)
		expect(document.body.contains(panel())).toBe(true)
		expect(document.querySelectorAll('.so-drawer')).toHaveLength(1)
	})

	it('панель — модальный диалог, имя — заголовок', async () => {
		await render()

		const title = node('.so-drawer__title')

		expect(panel().getAttribute('role')).toBe('dialog')
		expect(panel().getAttribute('aria-modal')).toBe('true')
		expect(panel().getAttribute('tabindex')).toBe('-1')
		expect(panel().getAttribute('aria-labelledby')).toBe(title.id)
		expect(title.textContent).toBe('Фильтры')
	})

	it('слоты — по местам: заголовок, тело, подвал', async () => {
		await render({ props: { footer: <button class="so-test-ok">Готово</button> } })

		expect(node('.so-drawer__body').contains(node('.so-test-first'))).toBe(true)
		expect(node('.so-drawer__footer').contains(node('.so-test-ok'))).toBe(true)
	})

	it('край — модификатором, по умолчанию end; открытость — data-open у панели и подложки', async () => {
		const page = await render({ props: { placement: 'bottom' } })

		expect(panel().classList).toContain('so-drawer--placement-bottom')
		expect(panel().dataset.open).toBe('false')
		expect(backdrop().dataset.open).toBe('false')
		expect(panel().dataset.swiping).toBe('false')

		await open(page)

		expect(panel().dataset.open).toBe('true')
		expect(backdrop().dataset.open).toBe('true')
	})

	it('размер — переменными темы, не инлайном', async () => {
		await render({ props: { width: 360, height: '40vh' } })

		expect(panel().style.getPropertyValue('--so-drawer-width')).toBe('360px')
		expect(panel().style.getPropertyValue('--so-drawer-height')).toBe('40vh')
		expect(panel().style.width).toBe('')
	})

	it('открытая: панель и подложка в одном слое — z-index и data-layer одни', async () => {
		const page = await render()

		await open(page)

		const layer = panel().dataset.layer

		expect(layer).toMatch(/^\d+$/)
		expect(backdrop().dataset.layer).toBe(layer)
		expect(panel().style.zIndex).toBe(layer)
		expect(backdrop().style.zIndex).toBe(layer)
	})

	it('панель помечена владельцем, подложка — нет', async () => {
		await render()

		// Пометка — от id монтирования панели (`createUniqueId`), а не от счётчика процесса
		expect(panel().dataset.owner).toBeTruthy()
		expect(backdrop().hasAttribute('data-owner')).toBe(false)
	})

	it('атрибуты, обработчики и ref потребителя — на панели', async () => {
		const onClick = vi.fn()
		const nodes: Element[] = []

		await render({
			props: {
				class: 'so-test-mine',
				'data-test': 'x',
				onClick,
				ref: (element) => nodes.push(element),
			},
		})

		expect(panel().classList).toContain('so-test-mine')
		expect(panel().dataset.test).toBe('x')
		expect(nodes).toHaveLength(1)
		expect(nodes[0]).toBe(panel())
		expect(backdrop().classList).not.toContain('so-test-mine')

		panel().click()

		expect(onClick).toHaveBeenCalledTimes(1)
	})
})

describe('полоса жеста', () => {
	const handle = () => document.querySelector('.so-drawer__handle')

	it('без жеста полосы нет; с жестом — первая в панели, немая для скринридера', async () => {
		const drawer = new TDrawer()

		await render({ props: { ctrl: drawer } })

		expect(handle()).toBeNull()

		drawer.swipe = 'handle'

		expect(handle()).toBe(panel().firstElementChild)
		expect(handle()?.getAttribute('aria-hidden')).toBe('true')

		drawer.swipe = 'panel'

		expect(handle()).not.toBeNull()

		drawer.swipe = 'none'

		expect(handle()).toBeNull()
	})
})

describe('закрытие пользователем', () => {
	/** Причины закрытия, которые видел подписчик `close:before`. */
	const recorder = () => {
		const reasons: TCloseReason[] = []

		return {
			reasons,
			onCloseBefore: (event: TCloseEvent) => {
				reasons.push(event.reason)
			},
		}
	}

	it('крестик — причина button, назван локалью, фокус возвращается', async () => {
		const { reasons, onCloseBefore } = recorder()
		const page = await render({ props: { onCloseBefore } })

		await open(page)

		expect(document.activeElement).toBe(node('.so-test-first'))

		const button = node('.so-drawer__close')

		expect(button.getAttribute('aria-label')).toBe('Close')

		button.click()

		expect(reasons).toEqual(['button'])
		expect(page.visible()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('крестик назван локалью поддерева, слот close-icon подменяет его иконку', () => {
		mount(() => (
			<LocaleProvider locale={ruRU}>
				<Drawer close-icon={<i class="so-test-x" />}>{inside()}</Drawer>
			</LocaleProvider>
		))

		expect(node('.so-drawer__close').getAttribute('aria-label')).toBe('Закрыть')
		expect(node('.so-drawer__close .so-test-x')).toBeTruthy()
		expect(node('.so-drawer__close').querySelector('svg')).toBeNull()
	})

	it('closable: false убирает крестик из DOM', async () => {
		await render({ props: { closable: false } })

		expect(document.querySelector('.so-drawer__close')).toBeNull()
	})

	it('Escape и подложка — причины escape и outside', async () => {
		const { reasons, onCloseBefore } = recorder()
		const page = await render({ props: { onCloseBefore } })

		await open(page)
		press('Escape')
		await nextFrame()

		await open(page)
		pointerDown(backdrop())

		expect(reasons).toEqual(['escape', 'outside'])
		expect(page.visible()).toBe(false)
	})

	it('dismissible: false — подложка и Escape панель не закрывают', async () => {
		const page = await render({ props: { dismissible: false } })

		await open(page)

		pointerDown(backdrop())
		press('Escape')

		expect(page.visible()).toBe(true)
		expect(isOpen()).toBe(true)
	})

	/**
	 * Коробку панели задаёт тест: jsdom раскладку не считает. Жест мышью по
	 * полосе — дальше четверти ширины панели.
	 */
	it('жест — причина swipe: смахнули к краю, и onChangeVisible видит закрытие', async () => {
		const { reasons, onCloseBefore } = recorder()
		const page = await render({ props: { swipe: 'handle', onCloseBefore } })

		await open(page)

		vi.spyOn(panel(), 'getBoundingClientRect').mockReturnValue(new DOMRect(700, 0, 300, 800))

		const pointer = (type: string, target: Element, x: number) =>
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

		pointer('pointerdown', node('.so-drawer__handle'), 705)
		pointer('pointermove', panel(), 800)

		// Сдвиг плагин пишет в узел сам, и смена стиля корня его не снимает
		expect(panel().style.getPropertyValue('--so-swipe-offset')).toBe('95px')
		expect(panel().dataset.swiping).toBe('true')

		pointer('pointerup', panel(), 900)

		expect(reasons).toEqual(['swipe'])
		expect(page.visible()).toBe(false)
		expect(page.changes).toEqual([true, false])
		expect(document.activeElement).toBe(opener())
	})
})

describe('фон под панелью', () => {
	it('поверх страницы: страница спрятана от скринридера, прокрутка заперта', async () => {
		const page = await render()

		await open(page)

		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		await close(page)

		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.documentElement.style.overflow).toBe('')
	})

	/**
	 * Внутри контейнера панель модальна так же — фон немой, фокус в ней, — но
	 * прокрутку документа не запирает: страница за контейнером та же.
	 */
	it('внутри контейнера: фон немой, а прокрутка документа не заперта', async () => {
		const page = await render({ props: { contained: true } })

		await open(page)

		expect(opener().getAttribute('aria-hidden')).toBe('true')
		expect(document.activeElement).toBe(node('.so-test-first'))
		expect(document.documentElement.style.overflow).toBe('')
	})

	/**
	 * Панель на новом месте — тот же узел, как у Vue: замок отпускается, когда
	 * корень доиграл переходы закрытия, — кадром позже, — а вернувшейся из
	 * контейнера панели ставится сразу: узел плагины уже знают.
	 */
	it('contained на открытой панели снимает замок, а обратно — ставит', async () => {
		const drawer = new TDrawer()
		const page = await render({ props: { ctrl: drawer } })

		await open(page)

		expect(document.documentElement.style.overflow).toBe('hidden')

		drawer.contained = true
		await nextFrame()

		expect(document.documentElement.style.overflow).toBe('')

		drawer.contained = false

		expect(document.documentElement.style.overflow).toBe('hidden')
	})
})

describe('внутри модального окна', () => {
	/**
	 * Панель в окне — слой выше окна: подложка и нажатие в неё окно не
	 * закрывают, Escape закрывает только её.
	 */
	it('Escape в панели закрывает только панель, второй — окно', async () => {
		const [dialog, setDialog] = createSignal(false)
		const [drawer, setDrawer] = createSignal(false)

		mount(() => (
			<Dialog
				visible={dialog()}
				onChangeVisible={({ newValue: value }: TValuePayload<boolean>) => setDialog(value)}
			>
				<button class="so-test-in-dialog">В окне</button>
				<Drawer
					contained
					visible={drawer()}
					onChangeVisible={({ newValue: value }: TValuePayload<boolean>) =>
						setDrawer(value)
					}
				>
					<button class="so-test-in-drawer">В панели</button>
				</Drawer>
			</Dialog>
		))
		await nextFrame()

		setDialog(true)
		await nextFrame()

		setDrawer(true)
		await nextFrame()

		expect(document.activeElement).toBe(node('.so-test-in-drawer'))
		expect(node('.so-dialog').contains(panel())).toBe(true)
		expect(Number(panel().dataset.layer)).toBeGreaterThan(
			Number(node('.so-dialog').dataset.layer),
		)

		pointerDown(node('.so-test-in-drawer'))

		expect(dialog()).toBe(true)
		expect(drawer()).toBe(true)

		press('Escape')

		expect(drawer()).toBe(false)
		expect(dialog()).toBe(true)

		press('Escape')

		expect(dialog()).toBe(false)
	})
})

describe('открытость — visible и onChangeVisible', () => {
	it('visible из инстанса открывает так же, как из пропа', async () => {
		const drawer = new TDrawer()

		mount(() => <Drawer ctrl={drawer}>{inside()}</Drawer>)
		await nextFrame()

		drawer.visible = true
		await nextFrame()

		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-first'))
	})
})

/**
 * Своё у Solid: содержимое `Teleport` развёрнуто один раз, и панель с
 * подложкой ездят теми же узлами.
 */
describe('Solid', () => {
	/**
	 * Смена `contained` и цели переносит панель с подложкой теми же узлами:
	 * поле в панели не пересоздаётся, и набранное в нём остаётся. Новый узел дал
	 * бы ту же разметку, поэтому сторож — тождество узлов. Наборы ядра на
	 * перенесённых узлах идут за `contained`.
	 */
	it('смена contained и target переносит панель с подложкой теми же узлами, набранное в поле остаётся', () => {
		const first = document.createElement('section')
		const second = document.createElement('section')

		first.id = 'first'
		second.id = 'second'
		document.body.append(first, second)

		const [contained, setContained] = createSignal(false)
		const [target, setTarget] = createSignal('#first')

		mount(() => (
			<div class="so-test-host">
				<Drawer contained={contained()} target={target()} visible>
					<input class="so-test-field" />
				</Drawer>
			</div>
		))

		const own = panel()
		const shade = backdrop()
		const field = find(own, '.so-test-field', HTMLInputElement)

		field.value = 'набрано'

		/** Панель одна, на своём месте, теми же узлами с тем же полем — и живая. */
		const expectPanel = (place: Element, inPlace: boolean) => {
			expect(document.querySelectorAll('.so-drawer')).toHaveLength(1)
			expect(document.querySelectorAll('.so-backdrop:has(+ .so-drawer)')).toHaveLength(1)
			expect(panel()).toBe(own)
			expect(backdrop()).toBe(shade)
			expect(place.contains(own)).toBe(true)
			expect(shade.nextElementSibling).toBe(own)
			expect(own.parentElement === host()).toBe(inPlace)
			expect(own.dataset.contained).toBe(String(inPlace))
			expect(shade.dataset.contained).toBe(String(inPlace))
			expect(own.querySelector('.so-test-field')).toBe(field)
			expect(field.value).toBe('набрано')
		}

		expectPanel(first, false)

		setContained(true)

		expectPanel(host(), true)
		expect(first.children).toHaveLength(0)

		setTarget('#second')
		setContained(false)

		expectPanel(second, false)
		expect(first.children).toHaveLength(0)

		setTarget('#first')

		expectPanel(first, false)
		expect(second.children).toHaveLength(0)
	})

	it('снятая панель уносит себя и подложку из цели', () => {
		const { destroy } = mount(() => <Drawer visible>{inside()}</Drawer>)

		expect(document.querySelector('.so-drawer')).not.toBeNull()

		destroy()

		expect(document.querySelector('.so-drawer')).toBeNull()
		expect(document.querySelector('.so-backdrop:has(+ .so-drawer)')).toBeNull()
	})
})
