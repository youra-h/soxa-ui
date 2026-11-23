/**
 * Dialog в Solid — проводка целиком, на настоящей разметке.
 *
 * Модель проверяет ядро (`core/__tests__/dialog.spec.ts`), правила фокуса и
 * нажатия мимо — плагины; здесь важно, что они сходятся: окно телепортировано
 * целиком, подложка — сосед панели с тем же слоем, панель помечена владельцем,
 * кнопки шапки говорят с ядром, три причины закрытия проходят через запрос, а
 * окно поверх окна и поповер внутри закрывают только свой слой. Сценарии — те
 * же, что у Vue (`ui/vue/__tests__/dialog.spec.ts`); слой выше окна там —
 * список Select, здесь — панель Popover, как у React: Select в Solid нет.
 * Открытость и разворот, которые Vue держит `v-model`, здесь возвращают
 * пропом колбэки `onChangeVisible` и `onChangeMaximized`.
 *
 * Телепорт стоит на `Portal` Solid, а тот кладёт в цель свою обёртку и рисует
 * окно в ней: подложка и панель — соседи в этой обёртке, а не прямо в `body`.
 * Поэтому место окна проверяется тем, в какой цели оно лежит (`contains`), а
 * соседство и порядок — друг с другом.
 *
 * Своё у Solid — содержимое `Teleport` разворачивается один раз: смена цели
 * переносит окно тем же узлом, с тем же полем, и собирается содержимое в
 * контексте места, где стоит окно.
 *
 * Раскладку, переходы темы и действие `mousedown` jsdom не выполняет: место,
 * размер, появление и исчезание и то, что нажатие по подложке не уносит
 * фокус, — `playground/vue/browser/dialog.spec.ts`.
 */

import { describe, it, expect, vi } from 'vitest'
import { createSignal, type JSX } from 'solid-js'
import { TDialog } from '@soxa-ui/core'
import type { TCloseEvent, TCloseReason, TValuePayload } from '@soxa-ui/core'
import { TPluginBundle, ruRU, type TDialogOffsetEvent } from '@soxa-ui/plugins'
import type { DescriptorSlots, PopoverDescriptor } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'
import { Button, Dialog, LocaleProvider, Popover, type DialogProps } from '@soxa-ui/solid'
import { find, mount, nextFrame, type TMounted } from './mount'

type TPopoverTriggerScope = DescriptorSlots<typeof PopoverDescriptor>['trigger']

/** Узел по селектору; нет его — тест падает здесь, а не на чтении свойства. */
const node = (selector: string, scope: ParentNode = document) => find(scope, selector, HTMLElement)

const panel = (scope: ParentNode = document) => node('.so-dialog', scope)
const backdrop = (scope: ParentNode = document) => node('.so-backdrop:has(+ .so-dialog)', scope)
const isOpen = (element: HTMLElement = panel()) => element.style.display !== 'none'
const opener = () => node('.so-test-opener')

/** Нажатие мимо — `pointerdown`, как его слушает плагин оверлея. */
const pointerDown = (target: Element) =>
	target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }))

/** Клавиша на элементе под фокусом. Отдаёт событие: по нему видно, погашена ли она. */
function press(key: string, options: KeyboardEventInit = {}): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options })

	;(document.activeElement ?? document.body).dispatchEvent(event)

	return event
}

/** Содержимое окна с двумя остановками Tab. */
const inside = () => (
	<>
		<button class="so-test-first">Первая</button>
		<button class="so-test-second">Вторая</button>
	</>
)

type TPageOptions = {
	/** Пропсы окна; `data-*` в JSX — атрибут, а объекту его тип называет сам. */
	props?: DialogProps & { [name: `data-${string}`]: string }
	content?: () => JSX.Element
}

/** Страница: открытость окна, журнал открытости, которую получил потребитель, и монтирование. */
type TPage = {
	/** Открытость — сигнал родителя: его пишет и тест, и окно (`onChangeVisible`). */
	readonly visible: () => boolean
	readonly setVisible: (value: boolean) => void
	/** Что окно сообщило `onChangeVisible`. */
	readonly changes: readonly boolean[]
	readonly mounted: TMounted
}

/**
 * Страница с кнопкой, которая открывает окно, и само окно, чья открытость —
 * сигнал родителя. Колбэк `onChangeVisible` пишет её в тот же сигнал, как
 * привязка. Корень плагины получают через `requestAnimationFrame`, поэтому кадр
 * выждан.
 */
async function render({ props = {}, content = inside }: TPageOptions = {}): Promise<TPage> {
	const [visible, setVisible] = createSignal(false)
	const changes: boolean[] = []
	const mounted = mount(() => (
		<div>
			<button class="so-test-opener">Открыть</button>
			<Dialog
				title="Настройки"
				{...props}
				visible={visible()}
				onChangeVisible={({ newValue: value }: TValuePayload<boolean>) => {
					changes.push(value)
					setVisible(value)
				}}
			>
				{content()}
			</Dialog>
		</div>
	))

	await nextFrame()

	return { visible, setVisible: (value) => setVisible(value), changes, mounted }
}

/** Открыть окно с кнопки страницы и дождаться, пока фокус уйдёт в окно. */
async function open(page: TPage): Promise<void> {
	opener().focus()
	page.setVisible(true)

	await nextFrame()
}

/** Закрыть окно записью родителя и дождаться кадра. */
async function close(page: TPage): Promise<void> {
	page.setVisible(false)

	await nextFrame()
}

describe('разметка', () => {
	it('окно телепортировано целиком: подложка и панель — соседи в цели, подложка раньше', async () => {
		const { mounted } = await render()

		expect(document.body.contains(panel())).toBe(true)
		expect(mounted.container.contains(panel())).toBe(false)
		expect(mounted.container.contains(backdrop())).toBe(false)
		expect(backdrop().parentElement).toBe(panel().parentElement)
		expect(backdrop().nextElementSibling).toBe(panel())
		expect(panel().contains(backdrop())).toBe(false)
	})

	it('закрытое окно спрятано вместе с подложкой, а не размонтировано', async () => {
		await render()

		expect(isOpen()).toBe(false)
		expect(isOpen(backdrop())).toBe(false)
		expect(document.querySelector('.so-test-first')).not.toBeNull()
	})

	it('панель — модальный диалог, имя — заголовок', async () => {
		await render()

		const title = node('.so-dialog__title')

		expect(panel().getAttribute('role')).toBe('dialog')
		expect(panel().getAttribute('aria-modal')).toBe('true')
		expect(panel().getAttribute('tabindex')).toBe('-1')
		expect(panel().getAttribute('aria-labelledby')).toBe(title.id)
		expect(title.textContent).toBe('Настройки')
		expect(panel().hasAttribute('aria-describedby')).toBe(false)
	})

	it('предупреждение — alertdialog, описание — тело окна', async () => {
		await render({ props: { alert: true } })

		const body = node('.so-dialog__body')

		expect(panel().getAttribute('role')).toBe('alertdialog')
		expect(panel().getAttribute('aria-describedby')).toBe(body.id)
		expect(body.contains(node('.so-test-first'))).toBe(true)
	})

	it('слоты — по местам: заголовок, тело, подвал', async () => {
		await render({ props: { footer: <button class="so-test-ok">Готово</button> } })

		expect(node('.so-dialog__title').textContent).toBe('Настройки')
		expect(node('.so-dialog__body').contains(node('.so-test-first'))).toBe(true)
		expect(node('.so-dialog__footer').contains(node('.so-test-ok'))).toBe(true)
	})

	/** Пустой заголовок и подвал тема сворачивает по `:empty`: в них ни узла, ни текста. */
	it('без заголовка и подвала их части пусты', () => {
		mount(() => <Dialog>{inside()}</Dialog>)

		expect(node('.so-dialog__title').childNodes).toHaveLength(0)
		expect(node('.so-dialog__footer').childNodes).toHaveLength(0)
	})

	it('место — модификатором, по умолчанию центр; развёрнутость — data-maximized', async () => {
		await render({ props: { placement: 'end' } })

		expect(panel().classList).toContain('so-dialog--placement-end')
		expect(panel().dataset.maximized).toBe('false')
	})

	/** По нему тема гасит закрытое окно вместе с подложкой. */
	it('открытость — data-open у панели и подложки, туда и обратно', async () => {
		const page = await render()

		expect(panel().dataset.open).toBe('false')
		expect(backdrop().dataset.open).toBe('false')

		await open(page)

		expect(panel().dataset.open).toBe('true')
		expect(backdrop().dataset.open).toBe('true')

		await close(page)

		expect(panel().dataset.open).toBe('false')
		expect(backdrop().dataset.open).toBe('false')
	})

	it('размер — переменными темы, не инлайном', async () => {
		await render({ props: { width: 480, height: '60vh' } })

		expect(panel().style.getPropertyValue('--so-dialog-width')).toBe('480px')
		expect(panel().style.getPropertyValue('--so-dialog-height')).toBe('60vh')
		expect(panel().style.width).toBe('')
	})

	it('незаданный размер переменной не даёт: умолчание — у темы', async () => {
		await render()

		expect(panel().style.getPropertyValue('--so-dialog-width')).toBe('')
		expect(panel().style.getPropertyValue('--so-dialog-height')).toBe('')
	})

	it('открытое: панель и подложка в одном слое — z-index и data-layer одни', async () => {
		const page = await render()

		await open(page)

		const layer = panel().dataset.layer

		expect(layer).toMatch(/^\d+$/)
		expect(backdrop().dataset.layer).toBe(layer)
		expect(panel().style.zIndex).toBe(layer)
		expect(backdrop().style.zIndex).toBe(layer)
	})

	it('панель помечена владельцем, подложка — нет: для окна она мимо', async () => {
		await render()

		// Пометка — от id монтирования окна (`createUniqueId`), а не от счётчика процесса
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
		expect(panel().classList).toContain('so-dialog')
		expect(panel().dataset.test).toBe('x')
		expect(nodes).toHaveLength(1)
		expect(nodes[0]).toBe(panel())
		expect(backdrop().classList).not.toContain('so-test-mine')
		expect(backdrop().hasAttribute('data-test')).toBe(false)

		panel().click()

		expect(onClick).toHaveBeenCalledTimes(1)
	})

	/** `tabindex` стоит до спреда: атрибут потребителя его перекрывает, как у Vue. */
	it('tabindex потребителя — поверх tabindex="-1" панели', async () => {
		await render({ props: { tabindex: 0 } })

		expect(panel().getAttribute('tabindex')).toBe('0')
	})

	it('target меняет место телепорта', async () => {
		const host = document.createElement('div')

		host.id = 'so-test-host'
		document.body.appendChild(host)

		await render({ props: { target: '#so-test-host' } })

		expect(host.contains(panel())).toBe(true)
		expect(host.contains(backdrop())).toBe(true)
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
		await render({ props: { offset: 24 } })

		expect(offsets()).toEqual({ top: '24px', bottom: '24px', start: '24px', end: '24px' })
		expect(panel().getAttribute('style')).not.toMatch(/inset|margin/)
	})

	it('незаданный отступ переменных не даёт: умолчание — у темы', async () => {
		await render()

		expect(offsets()).toEqual({ top: '', bottom: '', start: '', end: '' })
	})

	it('смена offset из пропа пересчитывает переменные', async () => {
		const [offset, setOffset] = createSignal<number | string | undefined>(24)

		mount(() => <Dialog offset={offset()}>{inside()}</Dialog>)
		await nextFrame()

		setOffset('5%')

		expect(offsets().top).toBe('5%')

		setOffset(undefined)

		expect(offsets().top).toBe('')
	})

	it('обработчик layout:offset:before правит сторону у окна, открытого позже', async () => {
		const page = await render({
			props: {
				offset: 24,
				onLayoutOffsetBefore: (event: TDialogOffsetEvent) => {
					event.top = '10%'
				},
			},
		})

		await open(page)

		expect(offsets()).toEqual({ top: '10%', bottom: '24px', start: '24px', end: '24px' })
	})

	it('и у созданного видимым: показа, который пересчитал бы стили, у него нет', async () => {
		const placements: string[] = []

		mount(() => (
			<Dialog
				visible
				placement="start"
				offset={24}
				onLayoutOffsetBefore={(event: TDialogOffsetEvent) => {
					placements.push(event.placement)
					event.start = 0
				}}
			>
				{inside()}
			</Dialog>
		))
		await nextFrame()

		expect(placements).toContain('start')
		expect(offsets()).toEqual({ top: '24px', bottom: '24px', start: '0px', end: '24px' })
	})
})

describe('кнопки шапки', () => {
	it('крестик назван локалью — без провайдера английской, closable: false его убирает из DOM', () => {
		const [closable, setClosable] = createSignal(true)

		mount(() => <Dialog closable={closable()}>{inside()}</Dialog>)

		expect(node('.so-dialog__close').getAttribute('aria-label')).toBe('Close')

		setClosable(false)

		expect(document.querySelector('.so-dialog__close')).toBeNull()
	})

	it('крестик и разворот названы локалью поддерева', () => {
		mount(() => (
			<LocaleProvider locale={ruRU}>
				<Dialog maximizable>{inside()}</Dialog>
			</LocaleProvider>
		))

		expect(node('.so-dialog__close').getAttribute('aria-label')).toBe('Закрыть')
		expect(node('.so-dialog__maximize').getAttribute('aria-label')).toBe('Развернуть')
	})

	it('кнопки разворота по умолчанию нет, maximizable её рисует', () => {
		const [maximizable, setMaximizable] = createSignal(false)

		mount(() => <Dialog maximizable={maximizable()}>{inside()}</Dialog>)

		expect(document.querySelector('.so-dialog__maximize')).toBeNull()

		setMaximizable(true)

		const button = node('.so-dialog__maximize')

		expect(button.getAttribute('aria-label')).toBe('Maximize')
		expect(button.getAttribute('aria-pressed')).toBe('false')
	})

	it('разворот переключает maximized: data-maximized, aria-pressed и иконка', async () => {
		const dialog = new TDialog()
		const page = await render({ props: { ctrl: dialog, maximizable: true } })

		await open(page)

		const button = node('.so-dialog__maximize')
		/** Контур значка кнопки — сравнивается с контуром роли в пакете. */
		const iconPath = () => button.querySelector('svg path')?.getAttribute('d')
		const pathOf = (body: string) => /d="([^"]+)"/.exec(body)?.[1]

		expect(iconPath()).toBe(pathOf(material.arrowsOutward.body))

		button.click()

		expect(dialog.maximized).toBe(true)
		expect(panel().dataset.maximized).toBe('true')
		expect(button.getAttribute('aria-pressed')).toBe('true')
		expect(iconPath()).toBe(pathOf(material.arrowsInward.body))

		button.click()

		expect(panel().dataset.maximized).toBe('false')
		expect(iconPath()).toBe(pathOf(material.arrowsOutward.body))
	})

	/** Свои значки — слоты `maximize-icon` и `restore-icon`; видна одна, по `maximized`. */
	it('слоты значков разворота подменяют иконки, видна одна — по maximized', async () => {
		const dialog = new TDialog()

		mount(() => (
			<Dialog
				ctrl={dialog}
				maximizable
				maximize-icon={<i class="so-test-maximize" />}
				restore-icon={<i class="so-test-restore" />}
			>
				{inside()}
			</Dialog>
		))

		const button = node('.so-dialog__maximize')

		expect(button.querySelector('.so-test-maximize')).not.toBeNull()
		expect(button.querySelector('.so-test-restore')).toBeNull()
		expect(button.querySelector('svg')).toBeNull()

		dialog.maximized = true

		expect(button.querySelector('.so-test-maximize')).toBeNull()
		expect(button.querySelector('.so-test-restore')).not.toBeNull()
	})

	it('слот close-icon подменяет иконку крестика', () => {
		mount(() => <Dialog close-icon={<i class="so-test-x" />}>{inside()}</Dialog>)

		expect(node('.so-dialog__close .so-test-x')).toBeTruthy()
		expect(node('.so-dialog__close').querySelector('svg')).toBeNull()
	})

	it('разворот виден onChangeMaximized: по вызову на клик', async () => {
		const changes: boolean[] = []
		const page = await render({
			props: {
				maximizable: true,
				onChangeMaximized: ({ newValue: value }: TValuePayload<boolean>) =>
					changes.push(value),
			},
		})

		await open(page)

		node('.so-dialog__maximize').click()

		expect(changes).toEqual([true])
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

	it('крестик — причина button, фокус возвращается туда, откуда открыли', async () => {
		const { reasons, onCloseBefore } = recorder()
		const page = await render({ props: { onCloseBefore } })

		await open(page)

		expect(document.activeElement).toBe(node('.so-test-first'))

		node('.so-dialog__close').click()

		expect(reasons).toEqual(['button'])
		expect(page.visible()).toBe(false)
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('Escape — причина escape, клавиша погашена', async () => {
		const { reasons, onCloseBefore } = recorder()
		const page = await render({ props: { onCloseBefore } })

		await open(page)

		const event = press('Escape')

		expect(event.defaultPrevented).toBe(true)
		expect(reasons).toEqual(['escape'])
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('нажатие по подложке — причина outside, фокус возвращается', async () => {
		const { reasons, onCloseBefore } = recorder()
		const page = await render({ props: { onCloseBefore } })

		await open(page)

		pointerDown(backdrop())

		expect(reasons).toEqual(['outside'])
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('нажатие в окно его не закрывает', async () => {
		const page = await render()

		await open(page)

		pointerDown(node('.so-test-second'))

		expect(isOpen()).toBe(true)
	})

	it('отмена close:before оставляет окно открытым', async () => {
		const page = await render({
			props: { onCloseBefore: (event: TCloseEvent) => event.preventDefault() },
		})

		await open(page)

		node('.so-dialog__close').click()
		press('Escape')
		pointerDown(backdrop())

		expect(page.visible()).toBe(true)
		expect(isOpen()).toBe(true)
	})

	describe('dismissible: false', () => {
		it('подложка и Escape окно не закрывают и close:before не шлют', async () => {
			const { reasons, onCloseBefore } = recorder()
			const page = await render({ props: { dismissible: false, onCloseBefore } })

			await open(page)

			pointerDown(backdrop())
			press('Escape')

			expect(reasons).toEqual([])
			expect(isOpen()).toBe(true)
		})

		it('крестик закрывает', async () => {
			const page = await render({ props: { dismissible: false } })

			await open(page)

			node('.so-dialog__close').click()

			expect(isOpen()).toBe(false)
		})
	})
})

describe('открытость — visible и onChangeVisible', () => {
	it('visible из пропа открывает и закрывает, программное закрытие — без close:before', async () => {
		const onCloseBefore = vi.fn()
		const page = await render({ props: { onCloseBefore } })

		await open(page)

		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-first'))

		await close(page)

		expect(isOpen()).toBe(false)
		expect(isOpen(backdrop())).toBe(false)
		expect(onCloseBefore).not.toHaveBeenCalled()
		expect(document.activeElement).toBe(opener())
	})

	it('открытие и закрытие пользователем видит onChangeVisible', async () => {
		const page = await render()

		await open(page)

		press('Escape')

		expect(page.changes).toEqual([true, false])
		expect(page.visible()).toBe(false)
		expect(isOpen()).toBe(false)
	})

	it('visible из инстанса открывает так же, как из пропа', async () => {
		const dialog = new TDialog()

		mount(() => <Dialog ctrl={dialog}>{inside()}</Dialog>)
		await nextFrame()

		dialog.visible = true
		await nextFrame()

		expect(isOpen()).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-first'))
	})
})

describe('окно поверх окна', () => {
	/** Нижнее окно, из которого открыто верхнее. */
	async function renderNested() {
		const [lower, setLower] = createSignal(false)
		const [upper, setUpper] = createSignal(false)

		mount(() => (
			<div>
				<button class="so-test-opener">Открыть</button>
				<Dialog
					class="so-test-lower"
					visible={lower()}
					onChangeVisible={({ newValue: value }: TValuePayload<boolean>) =>
						setLower(value)
					}
				>
					<button class="so-test-lower-first">Внизу</button>
					<Dialog
						class="so-test-upper"
						visible={upper()}
						onChangeVisible={({ newValue: value }: TValuePayload<boolean>) =>
							setUpper(value)
						}
					>
						<button class="so-test-upper-first">Наверху</button>
					</Dialog>
				</Dialog>
			</div>
		))
		await nextFrame()

		opener().focus()
		setLower(true)
		await nextFrame()

		setUpper(true)
		await nextFrame()

		return { lower, upper, setUpper }
	}

	const backdropOf = (dialog: HTMLElement) => {
		const previous = dialog.previousElementSibling

		if (!(previous instanceof HTMLElement)) throw new Error('у окна нет подложки')

		return previous
	}

	it('верхнее окно — слоем выше нижнего, его подложка — тоже', async () => {
		await renderNested()

		const lower = Number(node('.so-test-lower').dataset.layer)
		const upper = Number(node('.so-test-upper').dataset.layer)

		expect(upper).toBeGreaterThan(lower)
		expect(backdropOf(node('.so-test-upper')).dataset.layer).toBe(String(upper))
		expect(document.activeElement).toBe(node('.so-test-upper-first'))
	})

	it('нажатие по подложке верхнего закрывает только его', async () => {
		const { lower, upper } = await renderNested()

		pointerDown(backdropOf(node('.so-test-upper')))

		expect(upper()).toBe(false)
		expect(lower()).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-lower-first'))
	})

	it('Escape в верхнем закрывает только его', async () => {
		const { lower, upper } = await renderNested()

		press('Escape')

		expect(upper()).toBe(false)
		expect(lower()).toBe(true)
	})

	/**
	 * Пометку ставит плагин соседям верхней панели и её предков. Нижнее окно
	 * лежит в обёртке своего портала — соседке обёртки верхнего в `body`, —
	 * поэтому помечена обёртка, а не панель: спрятана панель через предка.
	 */
	it('нижнее окно для скринридера спрятано, пока открыто верхнее', async () => {
		const { setUpper } = await renderNested()
		const muted = (element: Element) => element.closest('[aria-hidden="true"]') !== null

		expect(muted(node('.so-test-lower'))).toBe(true)
		expect(muted(node('.so-test-upper'))).toBe(false)

		setUpper(false)
		await nextFrame()

		expect(muted(node('.so-test-lower'))).toBe(false)
	})
})

/**
 * Панель поповера в окне — тоже панель в `body`, соседка окна, а не его
 * потомок. Пока закрыта, она лежит там без номера слоя выше окна: номер
 * пишет показ. Открытая — слой выше окна: нажатие в неё окно не закрывает,
 * Escape закрывает только её, и скринридер её видит.
 */
describe('Popover внутри', () => {
	const withPopover = () => (
		<Popover
			class="so-test-popover"
			trigger={(scope: TPopoverTriggerScope) => (
				<Button
					text="Ещё"
					class="so-test-popover-trigger"
					{...scope.triggerAria}
					{...scope.triggerDataset}
				/>
			)}
		>
			<button class="so-test-popover-first">В панели</button>
		</Popover>
	)

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
		await nextFrame()
	}

	it('панель поповера — слоем выше окна: нажатие в неё окно не закрывает', async () => {
		const page = await render({ content: withPopover })

		await open(page)
		await openPopover()

		expect(isOpen(popoverPanel())).toBe(true)
		expect(Number(popoverPanel().dataset.layer)).toBeGreaterThan(Number(panel().dataset.layer))

		pointerDown(node('.so-test-popover-first'))

		expect(page.visible()).toBe(true)
		expect(isOpen()).toBe(true)
		expect(isOpen(popoverPanel())).toBe(true)
	})

	it('Escape в открытом поповере закрывает только его, второй — окно', async () => {
		const page = await render({ content: withPopover })

		await open(page)
		await openPopover()

		expect(document.activeElement).toBe(node('.so-test-popover-first'))

		press('Escape')

		expect(isOpen(popoverPanel())).toBe(false)
		expect(page.visible()).toBe(true)
		expect(document.activeElement).toBe(popoverTrigger())

		press('Escape')

		expect(page.visible()).toBe(false)
	})

	it('окно открыто — страница под aria-hidden, окно и его содержимое доступны', async () => {
		const page = await render({ content: withPopover })

		await open(page)

		expect(muted(opener())).toBe(true)
		expect(muted(panel())).toBe(false)
		expect(muted(popoverTrigger())).toBe(false)
	})

	it('закрытая панель поповера спрятана, открытая — доступна', async () => {
		const page = await render({ content: withPopover })

		await open(page)

		// Панель смонтирована и скрыта, номера слоя выше окна у неё ещё нет
		expect(muted(popoverPanel())).toBe(true)

		await openPopover()

		expect(popoverTrigger().getAttribute('aria-expanded')).toBe('true')
		expect(muted(popoverPanel())).toBe(false)
		expect(muted(node('.so-test-popover-first'))).toBe(false)
	})

	it('окно закрыто — всё как было, в том числе чужие aria-hidden', async () => {
		const page = await render({ content: withPopover })
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
		const page = await render()

		await open(page)

		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		await close(page)

		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.documentElement.style.overflow).toBe('')
	})
})

/**
 * Своё у Solid: содержимое `Teleport` развёрнуто один раз, под владельцем
 * места, где стоит окно.
 */
describe('Solid', () => {
	/**
	 * Смена цели переносит окно теми же узлами: панель с подложкой не
	 * пересобираются, и набранное в поле окна остаётся. Новый узел дал бы ту же
	 * разметку, поэтому сторож — тождество узлов.
	 */
	it('смена target переносит панель с подложкой теми же узлами, набранное в поле остаётся', () => {
		const first = document.createElement('section')
		const second = document.createElement('section')

		first.id = 'first'
		second.id = 'second'
		document.body.append(first, second)

		const [target, setTarget] = createSignal('#first')

		mount(() => (
			<Dialog target={target()} visible>
				<input class="so-test-field" />
			</Dialog>
		))

		const node0 = panel()
		const shade = backdrop()
		const field = find(node0, '.so-test-field', HTMLInputElement)

		field.value = 'набрано'

		expect(first.contains(node0)).toBe(true)
		expect(first.contains(shade)).toBe(true)

		setTarget('#second')

		expect(panel()).toBe(node0)
		expect(backdrop()).toBe(shade)
		expect(second.contains(node0)).toBe(true)
		expect(shade.nextElementSibling).toBe(node0)
		expect(first.children).toHaveLength(0)
		expect(node0.querySelector('.so-test-field')).toBe(field)
		expect(field.value).toBe('набрано')
	})

	it('цели нет — нет ни окна, ни подложки', () => {
		mount(() => (
			<Dialog target="#missing" visible>
				{inside()}
			</Dialog>
		))

		expect(document.querySelector('.so-dialog')).toBeNull()
		expect(document.querySelector('.so-backdrop:has(+ .so-dialog)')).toBeNull()
	})

	it('снятое окно уносит панель и подложку из цели', () => {
		const { destroy } = mount(() => <Dialog visible>{inside()}</Dialog>)

		expect(document.querySelector('.so-dialog')).not.toBeNull()

		destroy()

		expect(document.querySelector('.so-dialog')).toBeNull()
		expect(document.querySelector('.so-backdrop:has(+ .so-dialog)')).toBeNull()
	})

	/**
	 * Портал рисует окно под владельцем места, где оно стоит: контексты места
	 * доходят до содержимого в цели, и кнопка в окне собирается с локалью
	 * провайдера вокруг окна, а не с английской.
	 */
	it('содержимое окна — в контексте места: локаль провайдера вокруг окна', async () => {
		const bundles: TPluginBundle[] = []

		mount(() => (
			<LocaleProvider locale={ruRU}>
				<Dialog visible>
					<Button
						class="so-test-inside"
						onBundleCreate={(bundle: unknown) => {
							if (bundle instanceof TPluginBundle) bundles.push(bundle)
						}}
					/>
				</Dialog>
			</LocaleProvider>
		))
		// Набор объявляется на микрозадаче после сборки
		await Promise.resolve()

		expect(panel().querySelector('.so-test-inside')).not.toBeNull()
		expect(bundles.map((bundle) => bundle.locale.locale.tag)).toEqual([ruRU.tag])
	})
})

describe('non-modal dialog', () => {
	it('preserves focus, page access and natural keyboard navigation', async () => {
		const page = await render({ props: { modal: false, dismissible: false } })
		await open(page)

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

		await close(page)
		expect(document.activeElement).toBe(opener())
	})
})
