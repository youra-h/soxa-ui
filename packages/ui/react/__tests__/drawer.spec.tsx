/**
 * Drawer в React — проводка целиком, на настоящей разметке.
 *
 * Модель проверяет ядро (`core/__tests__/drawer.spec.ts`), жест и правила
 * фокуса и нажатия мимо — плагины; здесь важно, что они сходятся: панель
 * телепортирована вместе с подложкой, а внутри контейнера остаётся на месте,
 * полоса жеста рисуется по ядру, кнопка закрытия и жест говорят с ядром, три
 * причины закрытия и жест проходят через запрос, а замок прокрутки знает, где
 * панель стоит. Сценарии — те же, что у Vue (`ui/vue/__tests__/drawer.spec.ts`).
 *
 * Открытость — состояние родителя: смена приходит `onChangeVisible`, как
 * `v-model:visible` у Vue. Своё у React — портал, которого на сервере нет.
 * Смена `contained` на лету переносит панель тем же узлом: телепорт держит
 * подложку и панель в своей обёртке и двигает её между целью и местом, —
 * поэтому место проверяется по `contains`, а не по родителю.
 *
 * Раскладку, анимацию темы и настоящий указатель jsdom не выполняет — край,
 * размер, контейнер и жест мышью — `playground/vue/browser/drawer.spec.ts`.
 */

import { describe, it, expect, vi } from 'vitest'
import { StrictMode, act, createRef, useState, type ReactElement, type ReactNode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { TDrawer } from '@soxa-ui/core'
import type { TCloseEvent, TCloseReason } from '@soxa-ui/core'
import { Dialog, Drawer, type DrawerProps } from '@soxa-ui/react'
import { find, mount, nextFrame, track } from './mount'

/** Узел по селектору; нет его — тест падает здесь, а не на чтении свойства. */
const node = (selector: string, scope: ParentNode = document) => find(scope, selector, HTMLElement)

const panel = (scope: ParentNode = document) => node('.so-drawer', scope)
const backdrop = (scope: ParentNode = document) => node('.so-backdrop:has(+ .so-drawer)', scope)
const isOpen = (element: HTMLElement = panel()) => element.style.display !== 'none'
const opener = () => node('.so-test-opener')
const host = () => node('.so-test-host')

/** Событие на узле — внутри `act`: закрытие и фокус меняют состояние компонентов. */
function dispatch(target: Element, event: Event): void {
	act(() => {
		target.dispatchEvent(event)
	})
}

/** Нажатие мимо — `pointerdown`, как его слушает плагин оверлея. */
const pointerDown = (target: Element) =>
	dispatch(target, new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }))

/** Клик — внутри `act`. */
function click(target: HTMLElement): void {
	act(() => target.click())
}

/** Клавиша на элементе под фокусом. Отдаёт событие: по нему видно, погашена ли она. */
function press(key: string): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

	dispatch(document.activeElement ?? document.body, event)

	return event
}

/** Содержимое панели с двумя остановками Tab. */
const inside = (
	<>
		<button className="so-test-first">Первая</button>
		<button className="so-test-second">Вторая</button>
	</>
)

type TPageOptions = {
	/** Пропсы панели; `data-*` в JSX — атрибут, а объекту его тип называет сам. */
	props?: DrawerProps & { [name: `data-${string}`]: string }
	content?: ReactNode
}

/**
 * Страница с кнопкой, которая открывает панель, и сама панель внутри
 * контейнера `.so-test-host`; открытость — состояние родителя. Отдаёт
 * открытость: её пишет и тест (`set`), и панель (`onChangeVisible`) — колбэк
 * из пропсов теста зовётся вместе со своим.
 */
async function render({ props = {}, content = inside }: TPageOptions = {}) {
	const shown = { value: false, set: (_: boolean) => {} }
	const { onChangeVisible, ...rest } = props

	function Page(): ReactElement {
		const [visible, setVisible] = useState(false)

		shown.value = visible
		shown.set = setVisible

		return (
			<div className="so-test-host">
				<button className="so-test-opener">Открыть</button>
				<Drawer
					title="Фильтры"
					{...rest}
					visible={visible}
					onChangeVisible={(payload) => {
						onChangeVisible?.(payload)
						setVisible(payload.newValue)
					}}
				>
					{content}
				</Drawer>
			</div>
		)
	}

	mount(<Page />)
	await nextFrame()

	return shown
}

type TShown = Awaited<ReturnType<typeof render>>

/** Открыть панель с кнопки страницы и дождаться, пока фокус уйдёт в неё. */
async function open(shown: TShown): Promise<void> {
	act(() => {
		opener().focus()
		shown.set(true)
	})

	await nextFrame()
}

/** Закрыть панель записью родителя и дождаться кадра. */
async function close(shown: TShown): Promise<void> {
	act(() => shown.set(false))

	await nextFrame()
}

describe('разметка', () => {
	it('поверх страницы: подложка и панель телепортированы соседями, подложка раньше', async () => {
		await render()

		expect(document.body.contains(panel())).toBe(true)
		expect(host().contains(panel())).toBe(false)
		expect(backdrop().parentElement).toBe(panel().parentElement)
		expect(backdrop().nextElementSibling).toBe(panel())
	})

	it('внутри контейнера: панель и подложка остаются на месте, target не действует', async () => {
		const elsewhere = document.createElement('div')

		elsewhere.id = 'so-test-elsewhere'
		document.body.appendChild(elsewhere)

		await render({ props: { contained: true, target: '#so-test-elsewhere' } })

		expect(host().contains(panel())).toBe(true)
		expect(elsewhere.contains(panel())).toBe(false)
		expect(backdrop().parentElement).toBe(panel().parentElement)
		expect(backdrop().nextElementSibling).toBe(panel())
		expect(panel().dataset.contained).toBe('true')
		expect(backdrop().dataset.contained).toBe('true')
	})

	/**
	 * Телепорт двигает свою обёртку, а не рисует панель заново: в контейнере и
	 * обратно в `body` — тот же узел, и инстанс с его открытостью те же.
	 */
	it('contained на лету переносит панель в контейнер и обратно в body тем же узлом', async () => {
		const drawer = new TDrawer()

		await render({ props: { ctrl: drawer } })

		const first = panel()

		expect(host().contains(first)).toBe(false)

		act(() => {
			drawer.contained = true
		})

		expect(panel()).toBe(first)
		expect(host().contains(first)).toBe(true)
		expect(document.querySelectorAll('.so-drawer')).toHaveLength(1)

		act(() => {
			drawer.contained = false
		})

		expect(panel()).toBe(first)
		expect(host().contains(first)).toBe(false)
		expect(document.body.contains(first)).toBe(true)
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

	it('край — модификатором, по умолчанию end; открытость — data-open у панели и подложки', async () => {
		const shown = await render({ props: { placement: 'bottom' } })

		expect(panel().classList).toContain('so-drawer--placement-bottom')
		expect(panel().dataset.open).toBe('false')
		expect(backdrop().dataset.open).toBe('false')
		expect(panel().dataset.swiping).toBe('false')

		await open(shown)

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
		const shown = await render()

		await open(shown)

		const layer = panel().dataset.layer

		expect(layer).toMatch(/^\d+$/)
		expect(backdrop().dataset.layer).toBe(layer)
		expect(panel().style.zIndex).toBe(layer)
		expect(backdrop().style.zIndex).toBe(layer)
	})

	it('панель помечена владельцем, подложка — нет', async () => {
		await render()

		// Пометка — от id монтирования панели (`useId`), а не от счётчика процесса
		expect(panel().dataset.owner).toBeTruthy()
		expect(backdrop().hasAttribute('data-owner')).toBe(false)
	})

	it('атрибуты, обработчики и ref потребителя — на панели', async () => {
		const onClick = vi.fn()
		const ref = createRef<Element>()

		await render({ props: { className: 'so-test-mine', 'data-test': 'x', onClick, ref } })

		expect(panel().classList).toContain('so-test-mine')
		expect(panel().dataset.test).toBe('x')
		expect(ref.current).toBe(panel())

		click(panel())

		expect(onClick).toHaveBeenCalledTimes(1)
	})
})

describe('полоса жеста', () => {
	const handle = () => document.querySelector('.so-drawer__handle')

	it('без жеста полосы нет; с жестом — первая в панели, немая для скринридера', async () => {
		const drawer = new TDrawer()

		await render({ props: { ctrl: drawer } })

		expect(handle()).toBeNull()

		act(() => {
			drawer.swipe = 'handle'
		})

		expect(handle()).toBe(panel().firstElementChild)
		expect(handle()?.getAttribute('aria-hidden')).toBe('true')

		act(() => {
			drawer.swipe = 'panel'
		})

		expect(handle()).not.toBeNull()
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
		const shown = await render({ props: { onCloseBefore } })

		await open(shown)

		expect(document.activeElement).toBe(node('.so-test-first'))

		const button = node('.so-drawer__close')

		expect(button.getAttribute('aria-label')).toBe('Close')

		click(button)

		expect(reasons).toEqual(['button'])
		expect(shown.value).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('closable: false убирает крестик из DOM', async () => {
		await render({ props: { closable: false } })

		expect(document.querySelector('.so-drawer__close')).toBeNull()
	})

	it('Escape и подложка — причины escape и outside', async () => {
		const { reasons, onCloseBefore } = recorder()
		const shown = await render({ props: { onCloseBefore } })

		await open(shown)
		press('Escape')
		await nextFrame()

		await open(shown)
		pointerDown(backdrop())

		expect(reasons).toEqual(['escape', 'outside'])
		expect(shown.value).toBe(false)
	})

	it('dismissible: false — подложка и Escape панель не закрывают', async () => {
		const shown = await render({ props: { dismissible: false } })

		await open(shown)

		pointerDown(backdrop())
		press('Escape')

		expect(shown.value).toBe(true)
		expect(isOpen()).toBe(true)
	})

	/**
	 * Коробку панели задаёт тест: jsdom раскладку не считает. Жест мышью по
	 * полосе — дальше четверти ширины панели.
	 */
	it('жест — причина swipe: смахнули к краю, и onChangeVisible видит закрытие', async () => {
		const { reasons, onCloseBefore } = recorder()
		const changes: boolean[] = []
		const shown = await render({
			props: {
				swipe: 'handle',
				onCloseBefore,
				onChangeVisible: ({ newValue: value }) => changes.push(value),
			},
		})

		await open(shown)

		vi.spyOn(panel(), 'getBoundingClientRect').mockReturnValue(new DOMRect(700, 0, 300, 800))

		const pointer = (type: string, target: Element, x: number) =>
			dispatch(
				target,
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

		// Сдвиг плагин пишет в узел сам, и перерисовка React его не снимает
		expect(panel().style.getPropertyValue('--so-swipe-offset')).toBe('95px')
		expect(panel().dataset.swiping).toBe('true')

		pointer('pointerup', panel(), 900)

		expect(reasons).toEqual(['swipe'])
		expect(shown.value).toBe(false)
		expect(changes).toEqual([true, false])
		expect(document.activeElement).toBe(opener())
	})
})

describe('фон под панелью', () => {
	it('поверх страницы: страница спрятана от скринридера, прокрутка заперта', async () => {
		const shown = await render()

		await open(shown)

		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		await close(shown)

		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.documentElement.style.overflow).toBe('')
	})

	/**
	 * Внутри контейнера панель модальна так же — фон немой, фокус в ней, — но
	 * прокрутку документа не запирает: страница за контейнером та же.
	 */
	it('внутри контейнера: фон немой, а прокрутка документа не заперта', async () => {
		const shown = await render({ props: { contained: true } })

		await open(shown)

		expect(opener().getAttribute('aria-hidden')).toBe('true')
		expect(document.activeElement).toBe(node('.so-test-first'))
		expect(document.documentElement.style.overflow).toBe('')
	})

	/**
	 * Телепорт переносит панель тем же узлом, как у Vue, и замок держит не
	 * узел, а производное ядра `locksScroll` — открыта и не `contained`:
	 * отпускает он кадром позже, когда корень доиграл переходы, а ставит сразу.
	 */
	it('contained на открытой панели снимает замок, а обратно — сразу ставит', async () => {
		const drawer = new TDrawer()
		const shown = await render({ props: { ctrl: drawer } })

		await open(shown)

		expect(document.documentElement.style.overflow).toBe('hidden')

		act(() => {
			drawer.contained = true
		})
		await nextFrame()

		expect(document.documentElement.style.overflow).toBe('')

		act(() => {
			drawer.contained = false
		})

		expect(document.documentElement.style.overflow).toBe('hidden')
	})
})

describe('внутри модального окна', () => {
	/**
	 * Панель в окне — слой выше окна: подложка и нажатие в неё окно не
	 * закрывают, Escape закрывает только её.
	 */
	it('Escape в панели закрывает только панель, второй — окно', async () => {
		const dialog = { value: false, set: (_: boolean) => {} }
		const drawer = { value: false, set: (_: boolean) => {} }

		function Page(): ReactElement {
			const [dialogVisible, setDialog] = useState(false)
			const [drawerVisible, setDrawer] = useState(false)

			dialog.value = dialogVisible
			dialog.set = setDialog
			drawer.value = drawerVisible
			drawer.set = setDrawer

			return (
				<Dialog
					visible={dialogVisible}
					onChangeVisible={({ newValue }) => setDialog(newValue)}
				>
					<button className="so-test-in-dialog">В окне</button>
					<Drawer
						contained
						visible={drawerVisible}
						onChangeVisible={({ newValue }) => setDrawer(newValue)}
					>
						<button className="so-test-in-drawer">В панели</button>
					</Drawer>
				</Dialog>
			)
		}

		mount(<Page />)
		await nextFrame()

		act(() => dialog.set(true))
		await nextFrame()

		act(() => drawer.set(true))
		await nextFrame()

		expect(document.activeElement).toBe(node('.so-test-in-drawer'))
		expect(Number(panel().dataset.layer)).toBeGreaterThan(
			Number(node('.so-dialog').dataset.layer),
		)

		pointerDown(node('.so-test-in-drawer'))

		expect(dialog.value).toBe(true)
		expect(drawer.value).toBe(true)

		press('Escape')

		expect(drawer.value).toBe(false)
		expect(dialog.value).toBe(true)

		press('Escape')

		expect(dialog.value).toBe(false)
	})
})

describe('открытость — visible и onChangeVisible', () => {
	it('visible из инстанса открывает так же, как из пропа', async () => {
		const drawer = new TDrawer()

		mount(<Drawer ctrl={drawer}>{inside}</Drawer>)
		await nextFrame()

		act(() => {
			drawer.visible = true
		})
		await nextFrame()

		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-first'))
	})
})

/** Своё у React: портала на сервере нет, StrictMode пересобирает панель с плагинами. */
describe('React', () => {
	it('StrictMode: одна панель; закрытая отпускает замок и пометки фона', async () => {
		const shown = { set: (_: boolean) => {} }

		function Page(): ReactElement {
			const [visible, setVisible] = useState(false)

			shown.set = setVisible

			return (
				<div>
					<button className="so-test-opener">Открыть</button>
					<Drawer
						visible={visible}
						onChangeVisible={({ newValue }) => setVisible(newValue)}
					>
						{inside}
					</Drawer>
				</div>
			)
		}

		mount(
			<StrictMode>
				<Page />
			</StrictMode>,
		)
		await nextFrame()

		expect(document.querySelectorAll('.so-drawer')).toHaveLength(1)

		act(() => {
			opener().focus()
			shown.set(true)
		})
		await nextFrame()

		expect(document.activeElement).toBe(node('.so-test-first'))
		expect(document.documentElement.style.overflow).toBe('hidden')

		act(() => shown.set(false))
		await nextFrame()

		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.documentElement.style.overflow).toBe('')
	})

	it('серверная разметка: поверх страницы — пусто, с contained — панель на месте', () => {
		expect(renderToString(<Drawer visible>{inside}</Drawer>)).toBe('')

		const html = document.createElement('div')

		html.innerHTML = renderToString(
			<div className="so-test-host">
				<Drawer contained visible>
					{inside}
				</Drawer>
			</div>,
		)

		expect(html.querySelector('.so-test-host > .so-backdrop + .so-drawer')).not.toBeNull()
	})

	it('гидратация закрытой с contained — без расхождений, панель — узел сервера', async () => {
		const shown = { set: (_: boolean) => {} }

		function Page(): ReactElement {
			const [visible, setVisible] = useState(false)

			shown.set = setVisible

			return (
				<div className="so-test-host">
					<Drawer
						contained
						visible={visible}
						onChangeVisible={({ newValue }) => setVisible(newValue)}
					>
						{inside}
					</Drawer>
				</div>
			)
		}

		const container = document.createElement('div')
		const onRecoverableError = vi.fn()

		container.innerHTML = renderToString(<Page />)
		document.body.append(container)

		const server = panel()

		act(() => {
			track(hydrateRoot(container, <Page />, { onRecoverableError }))
		})
		await nextFrame()

		expect(onRecoverableError).not.toHaveBeenCalled()
		expect(panel()).toBe(server)
		expect(isOpen()).toBe(false)

		act(() => shown.set(true))
		await nextFrame()

		expect(isOpen()).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-first'))
	})

	/**
	 * Номер слоя выдаёт счётчик ядра, один на процесс, — у сервера свой. Номер
	 * открывает узел, поэтому в разметке сервера его нет, первая отрисовка
	 * браузера с ней сходится, а номер приходит кадром узла.
	 */
	it('гидратация открытой с contained — без расхождений, номер слоя — кадром узла', async () => {
		const page = (
			<div className="so-test-host">
				<Drawer contained visible>
					{inside}
				</Drawer>
			</div>
		)
		const container = document.createElement('div')
		const onRecoverableError = vi.fn()

		container.innerHTML = renderToString(page)
		document.body.append(container)

		expect(panel().hasAttribute('data-layer')).toBe(false)
		expect(backdrop().hasAttribute('data-layer')).toBe(false)

		act(() => {
			track(hydrateRoot(container, page, { onRecoverableError }))
		})
		await nextFrame()

		const layer = panel().getAttribute('data-layer')

		expect(onRecoverableError).not.toHaveBeenCalled()
		expect(layer).not.toBeNull()
		expect(backdrop().getAttribute('data-layer')).toBe(layer)
		expect(panel().style.zIndex).toBe(layer)
		expect(backdrop().style.zIndex).toBe(layer)
	})
})
