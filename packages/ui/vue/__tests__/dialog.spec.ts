/**
 * Dialog во Vue — проводка целиком, на настоящей разметке.
 *
 * Модель проверяет ядро (`core/__tests__/dialog.spec.ts`), правила фокуса и
 * нажатия мимо — плагины; здесь важно, что они сходятся: окно телепортировано
 * целиком, подложка — сосед панели с тем же слоем, панель помечена владельцем,
 * кнопки шапки говорят с ядром, три причины закрытия проходят через запрос, а
 * окно поверх окна и Select внутри закрывают только свой слой.
 *
 * Раскладку, переходы темы и действие `mousedown` jsdom не выполняет: место,
 * размер, появление и исчезание и то, что нажатие по подложке не уносит
 * фокус, — `playground/vue/browser/dialog.spec.ts`.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref, type Ref, type VNode } from 'vue'
import { Dialog, Select, SelectItem } from '@soxa-ui/vue'
import { TDialog } from '@soxa-ui/core'
import type { IDialogProps, TCloseEvent, TCloseReason } from '@soxa-ui/core'
import type { TDialogOffsetEvent } from '@soxa-ui/plugins'
import * as material from '@soxa-ui/icons-material'

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

let wrapper: ReturnType<typeof mount> | null = null

afterEach(() => {
	wrapper?.unmount()
	wrapper = null
	document.body.innerHTML = ''
})

/** Узел по селектору; нет его — тест падает здесь, а не на чтении свойства. */
function find(selector: string, scope: ParentNode = document): HTMLElement {
	const element = scope.querySelector(selector)

	if (!(element instanceof HTMLElement)) throw new Error(`${selector}: HTML-узла нет`)

	return element
}

const panel = (scope: ParentNode = document) => find('.so-dialog', scope)
const backdrop = (scope: ParentNode = document) => find('.so-backdrop:has(+ .so-dialog)', scope)
const isOpen = (element: HTMLElement = panel()) => element.style.display !== 'none'
const opener = () => find('.so-test-opener')

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
const inside = () => [
	h('button', { class: 'so-test-first' }, 'Первая'),
	h('button', { class: 'so-test-second' }, 'Вторая'),
]

type TPageOptions = {
	props?: Partial<IDialogProps> & Record<string, unknown>
	content?: () => VNode | VNode[]
	slots?: Record<string, () => VNode | VNode[] | string>
}

/**
 * Страница с кнопкой, которая открывает окно, и само окно на `v-model:visible`.
 * Отдаёт открытость: её пишет и тест, и окно (`update:visible`).
 */
async function render({ props = {}, content = inside, slots = {} }: TPageOptions = {}): Promise<
	Ref<boolean>
> {
	const shown = ref(false)

	wrapper = mount(
		defineComponent({
			render: () =>
				h('div', [
					h('button', { class: 'so-test-opener' }, 'Открыть'),
					h(
						Dialog,
						{
							...props,
							visible: shown.value,
							'onUpdate:visible': (value: boolean) => {
								shown.value = value
							},
						},
						{ title: () => 'Настройки', default: content, ...slots },
					),
				]),
		}),
		{ attachTo: document.body },
	)

	await settle()

	return shown
}

/** Рендер и кадр: корень плагины получают через `requestAnimationFrame`, фокус уходит кадром позже. */
async function settle(): Promise<void> {
	await nextTick()
	await nextFrame()
}

/** Открыть окно с кнопки страницы и дождаться, пока фокус уйдёт в окно. */
async function open(shown: Ref<boolean>): Promise<void> {
	opener().focus()
	shown.value = true

	await settle()
}

describe('разметка', () => {
	it('окно телепортировано целиком: подложка и панель — соседи в body, подложка раньше', async () => {
		await render()

		expect(panel().parentElement).toBe(document.body)
		expect(backdrop().parentElement).toBe(document.body)
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

		const title = find('.so-dialog__title')

		expect(panel().getAttribute('role')).toBe('dialog')
		expect(panel().getAttribute('aria-modal')).toBe('true')
		expect(panel().getAttribute('tabindex')).toBe('-1')
		expect(panel().getAttribute('aria-labelledby')).toBe(title.id)
		expect(title.textContent).toBe('Настройки')
		expect(panel().hasAttribute('aria-describedby')).toBe(false)
	})

	it('предупреждение — alertdialog, описание — тело окна', async () => {
		await render({ props: { alert: true } })

		const body = find('.so-dialog__body')

		expect(panel().getAttribute('role')).toBe('alertdialog')
		expect(panel().getAttribute('aria-describedby')).toBe(body.id)
		expect(body.contains(find('.so-test-first'))).toBe(true)
	})

	it('слоты — по местам: заголовок, тело, подвал', async () => {
		await render({ slots: { footer: () => h('button', { class: 'so-test-ok' }, 'Готово') } })

		expect(find('.so-dialog__title').textContent).toBe('Настройки')
		expect(find('.so-dialog__body').contains(find('.so-test-first'))).toBe(true)
		expect(find('.so-dialog__footer').contains(find('.so-test-ok'))).toBe(true)
	})

	it('место — модификатором, по умолчанию центр; развёрнутость — data-maximized', async () => {
		await render({ props: { placement: 'end' } })

		expect(panel().classList).toContain('so-dialog--placement-end')
		expect(panel().dataset.maximized).toBe('false')
	})

	/** По нему тема гасит закрытое окно вместе с подложкой. */
	it('открытость — data-open у панели и подложки, туда и обратно', async () => {
		const shown = await render()

		expect(panel().dataset.open).toBe('false')
		expect(backdrop().dataset.open).toBe('false')

		await open(shown)

		expect(panel().dataset.open).toBe('true')
		expect(backdrop().dataset.open).toBe('true')

		shown.value = false
		await settle()

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
		const shown = await render()

		await open(shown)

		const layer = panel().dataset.layer

		expect(layer).toMatch(/^\d+$/)
		expect(backdrop().dataset.layer).toBe(layer)
		expect(panel().style.zIndex).toBe(layer)
		expect(backdrop().style.zIndex).toBe(layer)
	})

	it('панель помечена владельцем, подложка — нет: для окна она мимо', async () => {
		await render()

		// Пометка — от id монтирования окна (`useId`), а не от счётчика процесса
		expect(panel().dataset.owner).toBeTruthy()
		expect(backdrop().hasAttribute('data-owner')).toBe(false)
	})

	it('атрибуты и события потребителя — на панели, а не в телепорте', async () => {
		const onClick = vi.fn()

		await render({ props: { class: 'so-test-mine', 'data-test': 'x', onClick } })

		expect(panel().classList).toContain('so-test-mine')
		expect(panel().classList).toContain('so-dialog')
		expect(panel().dataset.test).toBe('x')

		panel().click()

		expect(onClick).toHaveBeenCalledTimes(1)
	})

	it('target меняет место телепорта', async () => {
		const host = document.createElement('div')

		host.id = 'so-test-host'
		document.body.appendChild(host)

		await render({ props: { target: '#so-test-host' } })

		expect(panel().parentElement).toBe(host)
		expect(backdrop().parentElement).toBe(host)
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

	it('смена offset из шаблона пересчитывает переменные', async () => {
		const offset = ref<number | string | undefined>(24)

		wrapper = mount(
			defineComponent({
				render: () => h(Dialog, { offset: offset.value }, { default: inside }),
			}),
			{ attachTo: document.body },
		)

		await settle()

		offset.value = '5%'
		await nextTick()

		expect(offsets().top).toBe('5%')

		offset.value = undefined
		await nextTick()

		expect(offsets().top).toBe('')
	})

	it('обработчик layout:offset:before правит сторону у окна, открытого позже', async () => {
		const shown = await render({
			props: {
				offset: 24,
				'onLayout:offset:before': (event: TDialogOffsetEvent) => {
					event.top = '10%'
				},
			},
		})

		await open(shown)

		expect(offsets()).toEqual({ top: '10%', bottom: '24px', start: '24px', end: '24px' })
	})

	it('и у созданного видимым: показа, который пересчитал бы стили, у него нет', async () => {
		const placements: string[] = []

		wrapper = mount(Dialog, {
			props: {
				visible: true,
				placement: 'start',
				offset: 24,
				'onLayout:offset:before': (event: TDialogOffsetEvent) => {
					placements.push(event.placement)
					event.start = 0
				},
			},
			slots: { default: inside },
			attachTo: document.body,
		})

		await settle()

		expect(placements).toContain('start')
		expect(offsets()).toEqual({ top: '24px', bottom: '24px', start: '0px', end: '24px' })
	})
})

describe('кнопки шапки', () => {
	it('крестик назван локалью — без провайдера английской, closable: false его убирает из DOM', async () => {
		await render()

		expect(find('.so-dialog__close').getAttribute('aria-label')).toBe('Close')

		wrapper?.unmount()
		document.body.innerHTML = ''

		await render({ props: { closable: false } })

		expect(document.querySelector('.so-dialog__close')).toBeNull()
	})

	it('кнопки разворота по умолчанию нет, maximizable её рисует', async () => {
		await render()

		expect(document.querySelector('.so-dialog__maximize')).toBeNull()

		wrapper?.unmount()
		document.body.innerHTML = ''

		await render({ props: { maximizable: true } })

		const button = find('.so-dialog__maximize')

		expect(button.getAttribute('aria-label')).toBe('Maximize')
		expect(button.getAttribute('aria-pressed')).toBe('false')
	})

	it('разворот переключает maximized: data-maximized, aria-pressed и иконка', async () => {
		const dialog = new TDialog()
		const shown = await render({ props: { ctrl: dialog, maximizable: true } })

		await open(shown)

		const button = find('.so-dialog__maximize')
		/** Контур значка кнопки — сравнивается с контуром роли в пакете. */
		const iconPath = () => button.querySelector('svg path')?.getAttribute('d')
		const pathOf = (body: string) => /d="([^"]+)"/.exec(body)?.[1]

		expect(iconPath()).toBe(pathOf(material.arrowsOutward.body))

		button.click()
		await nextTick()

		expect(dialog.maximized).toBe(true)
		expect(panel().dataset.maximized).toBe('true')
		expect(button.getAttribute('aria-pressed')).toBe('true')
		expect(iconPath()).toBe(pathOf(material.arrowsInward.body))

		button.click()
		await nextTick()

		expect(panel().dataset.maximized).toBe('false')
		expect(iconPath()).toBe(pathOf(material.arrowsOutward.body))
	})

	it('разворот виден v-model: update:maximized на каждый клик', async () => {
		const shown = await render({ props: { maximizable: true } })

		await open(shown)

		find('.so-dialog__maximize').click()
		await nextTick()

		expect(wrapper?.findComponent(Dialog).emitted('update:maximized')).toEqual([[true]])
	})
})

describe('закрытие пользователем', () => {
	/** Причины закрытия, которые видел подписчик `close:before`. */
	const recorder = () => {
		const reasons: TCloseReason[] = []

		return {
			reasons,
			'onClose:before': (event: TCloseEvent) => {
				reasons.push(event.reason)
			},
		}
	}

	it('крестик — причина button, фокус возвращается туда, откуда открыли', async () => {
		const { reasons, ...listener } = recorder()
		const shown = await render({ props: listener })

		await open(shown)

		expect(document.activeElement).toBe(find('.so-test-first'))

		find('.so-dialog__close').click()
		await nextTick()

		expect(reasons).toEqual(['button'])
		expect(shown.value).toBe(false)
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('Escape — причина escape, клавиша погашена', async () => {
		const { reasons, ...listener } = recorder()
		const shown = await render({ props: listener })

		await open(shown)

		const event = press('Escape')

		await nextTick()

		expect(event.defaultPrevented).toBe(true)
		expect(reasons).toEqual(['escape'])
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('нажатие по подложке — причина outside, фокус возвращается', async () => {
		const { reasons, ...listener } = recorder()
		const shown = await render({ props: listener })

		await open(shown)

		pointerDown(backdrop())
		await nextTick()

		expect(reasons).toEqual(['outside'])
		expect(isOpen()).toBe(false)
		expect(document.activeElement).toBe(opener())
	})

	it('нажатие в окно его не закрывает', async () => {
		const shown = await render()

		await open(shown)

		pointerDown(find('.so-test-second'))
		await nextTick()

		expect(isOpen()).toBe(true)
	})

	it('отмена close:before оставляет окно открытым', async () => {
		const shown = await render({
			props: { 'onClose:before': (event: TCloseEvent) => event.preventDefault() },
		})

		await open(shown)

		find('.so-dialog__close').click()
		press('Escape')
		pointerDown(backdrop())
		await nextTick()

		expect(shown.value).toBe(true)
		expect(isOpen()).toBe(true)
	})

	describe('dismissible: false', () => {
		it('подложка и Escape окно не закрывают и close:before не шлют', async () => {
			const { reasons, ...listener } = recorder()
			const shown = await render({ props: { dismissible: false, ...listener } })

			await open(shown)

			pointerDown(backdrop())
			press('Escape')
			await nextTick()

			expect(reasons).toEqual([])
			expect(isOpen()).toBe(true)
		})

		it('крестик закрывает', async () => {
			const shown = await render({ props: { dismissible: false } })

			await open(shown)

			find('.so-dialog__close').click()
			await nextTick()

			expect(isOpen()).toBe(false)
		})
	})
})

describe('открытость — visible и v-model', () => {
	it('visible из шаблона открывает и закрывает, программное закрытие — без close:before', async () => {
		const onCloseBefore = vi.fn()
		const shown = await render({ props: { 'onClose:before': onCloseBefore } })

		await open(shown)

		expect(isOpen()).toBe(true)
		expect(isOpen(backdrop())).toBe(true)
		expect(document.activeElement).toBe(find('.so-test-first'))

		shown.value = false
		await settle()

		expect(isOpen()).toBe(false)
		expect(isOpen(backdrop())).toBe(false)
		expect(onCloseBefore).not.toHaveBeenCalled()
		expect(document.activeElement).toBe(opener())
	})

	it('открытие и закрытие пользователем видит v-model: update:visible', async () => {
		const shown = await render()

		await open(shown)
		press('Escape')
		await nextTick()

		expect(shown.value).toBe(false)
		expect(wrapper?.findComponent(Dialog).emitted('update:visible')).toEqual([[true], [false]])
	})

	it('visible из инстанса открывает так же, как из шаблона', async () => {
		const dialog = new TDialog()

		wrapper = mount(Dialog, {
			props: { ctrl: dialog },
			slots: { default: inside },
			attachTo: document.body,
		})

		await settle()

		dialog.visible = true
		await settle()

		expect(isOpen()).toBe(true)
		expect(document.activeElement).toBe(find('.so-test-first'))
	})
})

describe('окно поверх окна', () => {
	/** Нижнее окно, из которого открыто верхнее. */
	async function renderNested() {
		const lower = ref(false)
		const upper = ref(false)

		wrapper = mount(
			defineComponent({
				render: () =>
					h('div', [
						h('button', { class: 'so-test-opener' }, 'Открыть'),
						h(
							Dialog,
							{
								class: 'so-test-lower',
								visible: lower.value,
								'onUpdate:visible': (value: boolean) => {
									lower.value = value
								},
							},
							() => [
								h('button', { class: 'so-test-lower-first' }, 'Внизу'),
								h(
									Dialog,
									{
										class: 'so-test-upper',
										visible: upper.value,
										'onUpdate:visible': (value: boolean) => {
											upper.value = value
										},
									},
									() => h('button', { class: 'so-test-upper-first' }, 'Наверху'),
								),
							],
						),
					]),
			}),
			{ attachTo: document.body },
		)

		await settle()

		opener().focus()
		lower.value = true
		await settle()

		upper.value = true
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

		const lower = Number(find('.so-test-lower').dataset.layer)
		const upper = Number(find('.so-test-upper').dataset.layer)

		expect(upper).toBeGreaterThan(lower)
		expect(backdropOf(find('.so-test-upper')).dataset.layer).toBe(String(upper))
		expect(document.activeElement).toBe(find('.so-test-upper-first'))
	})

	it('нажатие по подложке верхнего закрывает только его', async () => {
		const { lower, upper } = await renderNested()

		pointerDown(backdropOf(find('.so-test-upper')))
		await nextTick()

		expect(upper.value).toBe(false)
		expect(lower.value).toBe(true)
		expect(document.activeElement).toBe(find('.so-test-lower-first'))
	})

	it('Escape в верхнем закрывает только его', async () => {
		const { lower, upper } = await renderNested()

		press('Escape')
		await nextTick()

		expect(upper.value).toBe(false)
		expect(lower.value).toBe(true)
	})

	it('нижнее окно для скринридера спрятано, пока открыто верхнее', async () => {
		const { upper } = await renderNested()

		expect(find('.so-test-lower').getAttribute('aria-hidden')).toBe('true')
		expect(find('.so-test-upper').closest('[aria-hidden="true"]')).toBeNull()

		upper.value = false
		await settle()

		expect(find('.so-test-lower').hasAttribute('aria-hidden')).toBe(false)
	})
})

describe('Select внутри', () => {
	const withSelect = () => [
		h(Select, { class: 'so-test-select' }, () => [
			h(SelectItem, { key: 'a', value: 'a', text: 'Первый' }),
			h(SelectItem, { key: 'b', value: 'b', text: 'Второй' }),
		]),
	]

	const field = () => find('.so-test-select input')
	const selectPanel = () => find('.so-select__panel')

	/** Клик мышью целиком: нажатие, фокус от `mousedown`, клик. */
	async function click(target: HTMLElement): Promise<void> {
		pointerDown(target)
		target.focus()
		target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

		await nextTick()
	}

	it('список Select — слоем выше окна: нажатие в него окно не закрывает', async () => {
		const shown = await render({ content: withSelect })

		await open(shown)
		await click(field())
		await nextFrame()

		expect(isOpen(selectPanel())).toBe(true)
		expect(Number(selectPanel().dataset.layer)).toBeGreaterThan(Number(panel().dataset.layer))

		const option = find('.so-select__panel [role="option"]')

		pointerDown(option)
		option.click()
		await nextTick()

		expect(shown.value).toBe(true)
		expect(isOpen()).toBe(true)
	})

	it('Escape в открытом Select закрывает только Select, второй — окно', async () => {
		const shown = await render({ content: withSelect })

		await open(shown)
		await click(field())

		expect(isOpen(selectPanel())).toBe(true)

		press('Escape')
		await nextTick()

		expect(isOpen(selectPanel())).toBe(false)
		expect(shown.value).toBe(true)

		press('Escape')
		await nextTick()

		expect(shown.value).toBe(false)
	})
})

describe('фон под окном', () => {
	it('открытое окно прячет страницу от скринридера и запирает прокрутку', async () => {
		const shown = await render()

		await open(shown)

		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		expect(document.documentElement.style.overflow).toBe('hidden')

		shown.value = false
		await settle()

		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.documentElement.style.overflow).toBe('')
	})
})

describe('non-modal dialog', () => {
	it('preserves focus, page access and natural keyboard navigation', async () => {
		const shown = await render({ props: { modal: false, dismissible: false } })
		await open(shown)

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

		shown.value = false
		await settle()
		expect(document.activeElement).toBe(opener())
	})

	it('switches an open dialog without stealing focus when releasing modality', async () => {
		const ctrl = new TDialog({ modal: false, dismissible: false })
		const shown = await render({ props: { ctrl } })
		await open(shown)
		ctrl.modal = true
		await settle()
		expect(panel().contains(document.activeElement)).toBe(true)
		expect(document.body.style.overflow).toBe('hidden')

		find('.so-test-second').focus()
		ctrl.modal = false
		await settle()
		expect(document.activeElement).toBe(find('.so-test-second'))
		expect(document.body.style.overflow).not.toBe('hidden')
		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		expect(document.querySelector('.so-backdrop:has(+ .so-dialog)')).toBeNull()
	})

	it('handles Escape only inside the non-modal dialog', async () => {
		const shown = await render({ props: { modal: false } })
		await open(shown)
		expect(press('Escape').defaultPrevented).toBe(false)
		expect(shown.value).toBe(true)
		find('.so-test-first').focus()
		expect(press('Escape').defaultPrevented).toBe(true)
		await settle()
		expect(shown.value).toBe(false)
	})
})

describe('mixed dialog layers', () => {
	it('releases only its own modal effects and cleans up external controllers', async () => {
		const lower = new TDialog({ visible: true, dismissible: false })
		const upper = new TDialog({ visible: true, dismissible: false })
		wrapper = mount(
			defineComponent({
				render: () =>
					h('main', [
						h('button', { class: 'so-test-opener' }, 'Page'),
						h(Dialog, { ctrl: lower }, { title: () => 'Lower', default: inside }),
						h(Dialog, { ctrl: upper }, { title: () => 'Upper', default: inside }),
					]),
			}),
			{ attachTo: document.body },
		)
		await settle()

		upper.modal = false
		await settle()
		expect(document.body.style.overflow).toBe('hidden')
		expect(opener().closest('[aria-hidden="true"]')).not.toBeNull()
		upper.hide()
		await settle()
		expect(document.body.style.overflow).toBe('hidden')

		lower.modal = false
		await settle()
		expect(document.body.style.overflow).not.toBe('hidden')
		expect(opener().closest('[aria-hidden="true"]')).toBeNull()
		opener().focus()
		wrapper.unmount()
		wrapper = null
		lower.modal = true
		upper.modal = true
		await nextFrame()
		expect(document.body.style.overflow).not.toBe('hidden')
		expect(document.querySelector('[inert], body > [aria-hidden="true"]')).toBeNull()
	})
})
