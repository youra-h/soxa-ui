/**
 * Dialog в Svelte — проводка целиком, на настоящей разметке.
 *
 * Модель проверяет ядро (`core/__tests__/dialog.spec.ts`), правила фокуса и
 * нажатия мимо — плагины; здесь важно, что они сходятся: окно телепортировано
 * целиком, подложка — сосед панели с тем же слоем, панель помечена владельцем,
 * кнопки шапки говорят с ядром, три причины закрытия проходят через запрос, а
 * окно поверх окна, Select и поповер внутри закрывают только свой слой. Сценарии —
 * те же, что у Vue (`dialog.spec.ts`); открытость и разворот, которые Vue
 * держит `v-model`, здесь возвращают пропом колбэки `onChangeVisible` и
 * `onChangeMaximized`.
 *
 * Сценарии Vue с Select внутри — здесь те же, и рядом — те же с поповером:
 * правило слоёв одно — список Select и панель поповера тоже слои в `body` выше
 * окна.
 *
 * Раскладку, переходы темы и действие `mousedown` jsdom не выполняет: место,
 * размер, появление и исчезание и то, что нажатие по подложке не уносит
 * фокус, — `playground/vue/browser/dialog.spec.ts`.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushSync } from 'svelte'
import { TDialog } from '@soxa-ui/core'
import type { TCloseEvent, TCloseReason } from '@soxa-ui/core'
import type { TDialogOffsetEvent } from '@soxa-ui/plugins'
import * as material from '@soxa-ui/icons-material'
import type { DialogProps } from '@soxa-ui/svelte'
import Harness, { type TDialogCase } from './Dialog.test.svelte'
import { contentOf, find, mount, nextFrame, type TMounted } from './mount'
import { reactiveProps } from './reactive-props.svelte'

afterEach(() => {
	vi.restoreAllMocks()
})

const node = (selector: string, scope: ParentNode = document) => find(scope, selector, HTMLElement)

const panel = () => node('.so-dialog')
const backdrop = () => node('.so-backdrop:has(+ .so-dialog)')
const isOpen = (element: HTMLElement = panel()) => element.style.display !== 'none'
const opener = () => node('.so-test-opener')

/** Нажатие мимо — `pointerdown`, как его слушает плагин оверлея. */
function pointerDown(target: Element): void {
	target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }))
	flushSync()
}

/** Клик — его ловит обработчик кнопки, делегированный Svelte корню. */
function click(target: HTMLElement): void {
	target.click()
	flushSync()
}

/** Клавиша на элементе под фокусом. Отдаёт событие: по нему видно, погашена ли она. */
function press(key: string, options: KeyboardEventInit = {}): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options })

	;(document.activeElement ?? document.body).dispatchEvent(event)
	flushSync()

	return event
}

/** Смена пропсов и кадр: корень плагины получают через него, фокус уходит кадром позже. */
async function settle(): Promise<void> {
	flushSync()
	await nextFrame()
}

/**
 * Страница с кнопкой, которая открывает окно, и само окно. Открытость
 * возвращается пропом, как привязка: колбэк `onChangeVisible` пишет её в
 * пропсы окна. Отдаёт пропсы окна, журнал открытости, которую получил
 * потребитель, и смонтированное.
 */
async function render(dialog: DialogProps = {}, kind: TDialogCase = 'page') {
	const visibles: boolean[] = []
	const props = reactiveProps<DialogProps>({
		...dialog,
		visible: dialog.visible ?? false,
		onChangeVisible: ({ newValue: value }) => {
			visibles.push(value)
			props.visible = value
		},
	})
	const mounted = mount(Harness, { case: kind, dialog: props })

	await nextFrame()

	return { props, visibles, mounted }
}

/** Открыть окно с кнопки страницы и дождаться, пока фокус уйдёт в окно. */
async function open(props: DialogProps): Promise<void> {
	opener().focus()
	props.visible = true

	await settle()
}

/** Снять страницу раньше конца теста — перед вторым монтированием в том же тесте. */
function clear(mounted: TMounted): void {
	mounted.destroy()
	document.body.innerHTML = ''
}

describe('разметка', () => {
	// Телепорт кладёт их в свою обёртку: место — по `contains`, а не по родителю
	it('окно телепортировано целиком: подложка и панель — соседи в body, подложка раньше', async () => {
		const { mounted } = await render()

		expect(document.body.contains(panel())).toBe(true)
		expect(mounted.container.contains(panel())).toBe(false)
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
		await render({ alert: true })

		const body = node('.so-dialog__body')

		expect(panel().getAttribute('role')).toBe('alertdialog')
		expect(panel().getAttribute('aria-describedby')).toBe(body.id)
		expect(body.contains(node('.so-test-first'))).toBe(true)
	})

	it('сниппеты — по местам: заголовок, тело, подвал', async () => {
		await render({}, 'footer')

		expect(node('.so-dialog__title').textContent).toBe('Настройки')
		expect(node('.so-dialog__body').contains(node('.so-test-first'))).toBe(true)
		expect(node('.so-dialog__footer').contains(node('.so-test-ok'))).toBe(true)
	})

	/**
	 * Вокруг сниппетов пробелов нет: пустой подвал тема сворачивает по `:empty`.
	 * Пустоту меряет `contentOf`, как её видит `:empty`.
	 */
	it('без подвала — пустой подвал, без текста внутри', async () => {
		await render()

		expect(contentOf(node('.so-dialog__footer'))).toEqual([])
		expect(contentOf(node('.so-dialog__title'))).toEqual(['#text «Настройки»'])
	})

	it('место — модификатором, по умолчанию центр; развёрнутость — data-maximized', async () => {
		await render({ placement: 'end' })

		expect(panel().classList).toContain('so-dialog--placement-end')
		expect(panel().dataset.maximized).toBe('false')
	})

	/** По нему тема гасит закрытое окно вместе с подложкой. */
	it('открытость — data-open у панели и подложки, туда и обратно', async () => {
		const { props } = await render()

		expect(panel().dataset.open).toBe('false')
		expect(backdrop().dataset.open).toBe('false')

		await open(props)

		expect(panel().dataset.open).toBe('true')
		expect(backdrop().dataset.open).toBe('true')

		props.visible = false
		await settle()

		expect(panel().dataset.open).toBe('false')
		expect(backdrop().dataset.open).toBe('false')
	})

	it('размер — переменными темы, не инлайном', async () => {
		await render({ width: 480, height: '60vh' })

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
		const { props } = await render()

		await open(props)

		const layer = panel().dataset.layer

		expect(layer).toMatch(/^\d+$/)
		expect(backdrop().dataset.layer).toBe(layer)
		expect(panel().style.zIndex).toBe(layer)
		expect(backdrop().style.zIndex).toBe(layer)
	})

	it('панель помечена владельцем, подложка — нет: для окна она мимо', async () => {
		await render()

		// Пометка — от id монтирования окна (`$props.id()`), а не от счётчика процесса
		expect(panel().dataset.owner).toBeTruthy()
		expect(backdrop().hasAttribute('data-owner')).toBe(false)
	})

	it('атрибуты и события потребителя — на панели, а не на подложке', async () => {
		const onclick = vi.fn()

		await render({ class: 'so-test-mine', 'data-test': 'x', onclick })

		expect(panel().classList).toContain('so-test-mine')
		expect(panel().classList).toContain('so-dialog')
		expect(panel().dataset.test).toBe('x')
		expect(backdrop().classList).not.toContain('so-test-mine')

		panel().click()

		expect(onclick).toHaveBeenCalledTimes(1)
	})

	it('target меняет место телепорта', async () => {
		const host = document.createElement('div')

		host.id = 'so-test-host'
		document.body.appendChild(host)

		await render({ target: '#so-test-host' })

		expect(host.contains(panel())).toBe(true)
		expect(host.contains(backdrop())).toBe(true)
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
		await render({ offset: 24 })

		expect(offsets()).toEqual({ top: '24px', bottom: '24px', start: '24px', end: '24px' })
		expect(panel().getAttribute('style')).not.toMatch(/inset|margin/)
	})

	it('незаданный отступ переменных не даёт: умолчание — у темы', async () => {
		await render()

		expect(offsets()).toEqual({ top: '', bottom: '', start: '', end: '' })
	})

	it('смена offset из разметки пересчитывает переменные', async () => {
		const { props } = await render({ offset: 24 })

		props.offset = '5%'
		flushSync()

		expect(offsets().top).toBe('5%')

		props.offset = undefined
		flushSync()

		expect(offsets().top).toBe('')
	})

	it('обработчик layout:offset:before правит сторону у окна, открытого позже', async () => {
		const { props } = await render({
			offset: 24,
			onLayoutOffsetBefore: (event: TDialogOffsetEvent) => {
				event.top = '10%'
			},
		})

		await open(props)

		expect(offsets()).toEqual({ top: '10%', bottom: '24px', start: '24px', end: '24px' })
	})

	it('и у созданного видимым: показа, который пересчитал бы стили, у него нет', async () => {
		const placements: string[] = []

		await render({
			visible: true,
			placement: 'start',
			offset: 24,
			onLayoutOffsetBefore: (event: TDialogOffsetEvent) => {
				placements.push(event.placement)
				event.start = 0
			},
		})

		expect(placements).toContain('start')
		expect(offsets()).toEqual({ top: '24px', bottom: '24px', start: '0px', end: '24px' })
	})
})

describe('кнопки шапки', () => {
	it('крестик назван локалью — без провайдера английской, closable: false его убирает из DOM', async () => {
		const { mounted } = await render()

		expect(node('.so-dialog__close').getAttribute('aria-label')).toBe('Close')

		clear(mounted)
		await render({ closable: false })

		expect(document.querySelector('.so-dialog__close')).toBeNull()
	})

	it('кнопки разворота по умолчанию нет, maximizable её рисует', async () => {
		const { mounted } = await render()

		expect(document.querySelector('.so-dialog__maximize')).toBeNull()

		clear(mounted)
		await render({ maximizable: true })

		const button = node('.so-dialog__maximize')

		expect(button.getAttribute('aria-label')).toBe('Maximize')
		expect(button.getAttribute('aria-pressed')).toBe('false')
	})

	it('разворот переключает maximized: data-maximized, aria-pressed и иконка', async () => {
		const dialog = new TDialog()
		const { props } = await render({ ctrl: dialog, maximizable: true })

		await open(props)

		const button = node('.so-dialog__maximize')
		/** Контур значка кнопки — сравнивается с контуром роли в пакете. */
		const iconPath = () => button.querySelector('svg path')?.getAttribute('d')
		const pathOf = (body: string) => /d="([^"]+)"/.exec(body)?.[1]

		expect(iconPath()).toBe(pathOf(material.arrowsOutward.body))

		click(button)

		expect(dialog.maximized).toBe(true)
		expect(panel().dataset.maximized).toBe('true')
		expect(button.getAttribute('aria-pressed')).toBe('true')
		expect(iconPath()).toBe(pathOf(material.arrowsInward.body))

		click(button)

		expect(panel().dataset.maximized).toBe('false')
		expect(iconPath()).toBe(pathOf(material.arrowsOutward.body))
	})

	it('разворот виден потребителю: onChangeMaximized на каждый клик', async () => {
		const maximized: boolean[] = []
		const { props } = await render({
			maximizable: true,
			onChangeMaximized: ({ newValue: value }) => {
				maximized.push(value)
			},
		})

		await open(props)

		click(node('.so-dialog__maximize'))

		expect(maximized).toEqual([true])
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
		const { reasons, ...listener } = recorder()
		const { props } = await render(listener)

		await open(props)

		expect(document.activeElement).toBe(node('.so-test-first'))

		click(node('.so-dialog__close'))

		expect(reasons).toEqual(['button'])
		expect(props.visible).toBe(false)
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('Escape — причина escape, клавиша погашена', async () => {
		const { reasons, ...listener } = recorder()
		const { props } = await render(listener)

		await open(props)

		const event = press('Escape')

		expect(event.defaultPrevented).toBe(true)
		expect(reasons).toEqual(['escape'])
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('нажатие по подложке — причина outside, фокус возвращается', async () => {
		const { reasons, ...listener } = recorder()
		const { props } = await render(listener)

		await open(props)

		pointerDown(backdrop())

		expect(reasons).toEqual(['outside'])
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('нажатие в окно его не закрывает', async () => {
		const { props } = await render()

		await open(props)

		pointerDown(node('.so-test-second'))

		expect(isOpen()).toBe(true)
	})

	it('отмена close:before оставляет окно открытым', async () => {
		const { props } = await render({
			onCloseBefore: (event: TCloseEvent) => event.preventDefault(),
		})

		await open(props)

		click(node('.so-dialog__close'))
		press('Escape')
		pointerDown(backdrop())

		expect(props.visible).toBe(true)
		expect(isOpen()).toBe(true)
	})

	describe('dismissible: false', () => {
		it('подложка и Escape окно не закрывают и close:before не шлют', async () => {
			const { reasons, ...listener } = recorder()
			const { props } = await render({ dismissible: false, ...listener })

			await open(props)

			pointerDown(backdrop())
			press('Escape')

			expect(reasons).toEqual([])
			expect(isOpen()).toBe(true)
		})

		it('крестик закрывает', async () => {
			const { props } = await render({ dismissible: false })

			await open(props)

			click(node('.so-dialog__close'))

			expect(isOpen()).toBe(false)
		})
	})
})

describe('открытость — visible и onChangeVisible', () => {
	it('visible из разметки открывает и закрывает, программное закрытие — без close:before', async () => {
		const onCloseBefore = vi.fn()
		const { props } = await render({ onCloseBefore })

		await open(props)

		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-first'))

		props.visible = false
		await settle()

		expect(isOpen()).toBe(false)
		expect(isOpen(backdrop())).toBe(false)
		expect(onCloseBefore).not.toHaveBeenCalled()
		expect(document.activeElement).toBe(opener())
	})

	it('открытие и закрытие пользователем видит потребитель: onChangeVisible', async () => {
		const { props, visibles } = await render()

		await open(props)
		press('Escape')

		expect(props.visible).toBe(false)
		expect(visibles).toEqual([true, false])
	})

	it('visible из инстанса открывает так же, как из разметки', async () => {
		const dialog = new TDialog()

		mount(Harness, { dialog: { ctrl: dialog } })
		await nextFrame()

		dialog.visible = true
		await settle()

		expect(isOpen()).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-first'))
	})
})

describe('окно поверх окна', () => {
	/** Нижнее окно, из которого открыто верхнее. */
	async function renderNested() {
		const lower = reactiveProps<DialogProps>({
			visible: false,
			onChangeVisible: ({ newValue: value }) => {
				lower.visible = value
			},
		})
		const upper = reactiveProps<DialogProps>({
			visible: false,
			onChangeVisible: ({ newValue: value }) => {
				upper.visible = value
			},
		})

		mount(Harness, { case: 'nested', dialog: lower, upper })
		await nextFrame()

		opener().focus()
		lower.visible = true
		await settle()

		upper.visible = true
		await settle()

		return { lower, upper }
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

		expect(upper.visible).toBe(false)
		expect(lower.visible).toBe(true)
		expect(document.activeElement).toBe(node('.so-test-lower-first'))
	})

	it('Escape в верхнем закрывает только его', async () => {
		const { lower, upper } = await renderNested()

		press('Escape')

		expect(upper.visible).toBe(false)
		expect(lower.visible).toBe(true)
	})

	// Пометка фона — на обёртке телепорта нижнего окна, а не на самой панели
	it('нижнее окно для скринридера спрятано, пока открыто верхнее', async () => {
		const { upper } = await renderNested()

		expect(node('.so-test-lower').closest('[aria-hidden="true"]')).not.toBeNull()
		expect(node('.so-test-upper').closest('[aria-hidden="true"]')).toBeNull()

		upper.visible = false
		await settle()

		expect(node('.so-test-lower').closest('[aria-hidden="true"]')).toBeNull()
	})
})

/**
 * Список Select — слой в `body` выше окна, соседка окна, а не его потомок,
 * как у Vue.
 */
describe('Select внутри', () => {
	const field = () => node('.so-test-select input')
	const selectPanel = () => node('.so-select__panel')

	/** Клик мышью целиком: нажатие, фокус от `mousedown`, клик. */
	async function pointerClick(target: HTMLElement): Promise<void> {
		target.dispatchEvent(
			new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
		)
		target.focus()
		target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
		await settle()
	}

	it('список Select — слоем выше окна: нажатие в него окно не закрывает', async () => {
		const { props } = await render({}, 'select')

		await open(props)
		await pointerClick(field())

		expect(isOpen(selectPanel())).toBe(true)
		expect(Number(selectPanel().dataset.layer)).toBeGreaterThan(Number(panel().dataset.layer))

		const option = node('.so-select__panel [role="option"]')

		option.dispatchEvent(
			new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
		)
		option.click()
		await settle()

		expect(props.visible).toBe(true)
		expect(isOpen()).toBe(true)
	})

	it('Escape в открытом Select закрывает только Select, второй — окно', async () => {
		const { props } = await render({}, 'select')

		await open(props)
		await pointerClick(field())

		expect(isOpen(selectPanel())).toBe(true)

		press('Escape')

		expect(isOpen(selectPanel())).toBe(false)
		expect(props.visible).toBe(true)

		press('Escape')

		expect(props.visible).toBe(false)
	})
})

/**
 * Правило то же и для поповера: его панель — слой в `body` выше окна,
 * соседка окна, а не его потомок.
 */
describe('Popover внутри', () => {
	const popoverTrigger = () => node('.so-test-popover-trigger')
	const popoverPanel = () => node('.so-popover__panel')

	/** Клик мышью целиком: нажатие, фокус от `mousedown`, клик. */
	async function pointerClick(target: HTMLElement): Promise<void> {
		target.dispatchEvent(
			new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
		)
		target.focus()
		target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
		await settle()
	}

	it('панель поповера — слоем выше окна: нажатие в неё окно не закрывает', async () => {
		const { props } = await render({}, 'popover')

		await open(props)
		await pointerClick(popoverTrigger())

		expect(isOpen(popoverPanel())).toBe(true)
		expect(Number(popoverPanel().dataset.layer)).toBeGreaterThan(Number(panel().dataset.layer))

		await pointerClick(node('.so-test-popover-second'))

		expect(props.visible).toBe(true)
		expect(isOpen()).toBe(true)
		expect(isOpen(popoverPanel())).toBe(true)
	})

	it('Escape в открытом поповере закрывает только поповер, второй — окно', async () => {
		const { props } = await render({}, 'popover')

		await open(props)
		await pointerClick(popoverTrigger())

		expect(isOpen(popoverPanel())).toBe(true)

		press('Escape')

		expect(isOpen(popoverPanel())).toBe(false)
		expect(props.visible).toBe(true)

		press('Escape')

		expect(props.visible).toBe(false)
	})
})

describe('фон под окном', () => {
	it('открытое окно прячет страницу от скринридера и запирает прокрутку', async () => {
		const { props } = await render()

		await open(props)

		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		props.visible = false
		await settle()

		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.documentElement.style.overflow).toBe('')
	})
})

describe('non-modal dialog', () => {
	it('preserves focus, page access and natural keyboard navigation', async () => {
		const { props } = await render({ modal: false, dismissible: false })
		await open(props)

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

		props.visible = false
		await settle()
		expect(document.activeElement).toBe(opener())
	})
})
