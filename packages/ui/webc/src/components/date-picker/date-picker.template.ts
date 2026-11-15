/**
 * Шаблон DatePicker: разметка режима (`mode`) — перед местом режима, за ним
 * панель — деталь Frame с календарём. Поля и календарь — экземпляры DatePicker
 * на всю жизнь: при смене режима детали над ними остаются за шаблоном.
 * docs/architecture.md, Layer 8d, «Даты».
 */

import type { IDatePicker } from '@soxa-ui/core'
import { DEFAULT_SLOT } from '@soxa-ui/setup'
import {
	bind,
	createDetail,
	lend,
	lendBefore,
	lendMark,
	lendTemplates,
	ownerAttributes,
	type ITemplate,
	type ITemplateContext,
	type TItemSlots,
	patch,
} from '../../adapter'
import { lendRoleIcon } from '../common/icon-button'
import { clearButton, removeClearButton } from '../common/clear'
import { TButtonElement, type TButtonElementProps } from '../button'
import { TCalendarElement, type TCalendarElementProps } from '../calendar'
import { TDateInputElement, type TDateInputElementProps } from '../date-input'
import { TFrameElement, type TFrameElementProps } from '../frame'
import type { TDatePickerOutputs } from './setup.component'

/**
 * Образец `item` — календарю образцом под тем же именем, `<template>`: в самом
 * календаре копия не оживает (`setup/__tests__/item-slots.spec.ts`).
 */
export const DATE_PICKER_CALENDAR_SLOTS: TItemSlots = {
	item: 'item',
}

type TDatePickerContext = ITemplateContext<IDatePicker, unknown, TDatePickerOutputs>

type TDatePickerParts = {
	readonly field: TDateInputElementProps
	readonly clearMark: Comment
	readonly trailingMark: Comment
	readonly start: TDateInputElementProps
	readonly dash: HTMLElement
	readonly end: TDateInputElementProps
	readonly trigger: TButtonElementProps
	/** Место разметки режима в корне: поля и кнопки встают перед ним. */
	readonly place: Comment
	readonly panel: TFrameElementProps
	readonly handle: HTMLElement
	readonly content: HTMLElement
}

type TFooter = {
	readonly cancel: TButtonElementProps
	readonly confirm: TButtonElementProps
}

type TPanelCalendar = {
	readonly node: TCalendarElementProps
	readonly confirmable: boolean
}

const parts = new WeakMap<HTMLElement, TDatePickerParts>()

const footers = new WeakMap<HTMLElement, TFooter>()

const calendars = new WeakMap<HTMLElement, TPanelCalendar>()

/** Стоящий на месте узел не двигается: перенос элемента soxa — его отключение и подключение. */
function placeBefore(parent: Node, nodes: readonly Node[], ref: Node): void {
	let next = ref

	for (let index = nodes.length - 1; index >= 0; index -= 1) {
		const node = nodes[index]

		if (!node) continue

		if (node.parentNode !== parent || node.nextSibling !== next) parent.insertBefore(node, next)

		next = node
	}
}

/** До сборки поля — в его свет, после — в слот (`lendBefore`); стоящие на месте не двигаются. */
function lendAllBefore(mark: Comment, nodes: readonly Node[]): void {
	if (nodes.every((node, index) => node.nextSibling === (nodes[index + 1] ?? mark))) return

	for (const node of nodes) lendBefore(mark, node)
}

function clearNodes(ctx: TDatePickerContext): readonly Node[] {
	if (ctx.hasSlot('clear')) return ctx.slotted('clear')

	if (ctx.state.clearable !== true) {
		removeClearButton(ctx.root)

		return []
	}

	return [clearButton(ctx, 'date-picker')]
}

/** «Отмена» только закрывает: черновик сбрасывает само закрытие, фокус возвращает плагин фокуса. */
function footerOf(ctx: TDatePickerContext): TFooter {
	const known = footers.get(ctx.root)

	if (known) return known

	const { ownerDocument } = ctx.root
	const cancel = createDetail(ownerDocument, TButtonElement, {
		embedded: 'date-picker.cancel',
		attributes: { type: 'button' },
	})
	const confirm = createDetail(ownerDocument, TButtonElement, {
		embedded: 'date-picker.confirm',
		attributes: { type: 'button' },
	})

	cancel.className = 'so-date-picker__cancel'
	confirm.className = 'so-date-picker__confirm'

	cancel.addEventListener('click', () => {
		const picker = ctx.ctrl

		if (picker) picker.open = false
	})
	confirm.addEventListener('click', () => {
		ctx.ctrl?.confirm()
	})

	const footer = { cancel, confirm }

	footers.set(ctx.root, footer)

	return footer
}

function syncFooter(ctx: TDatePickerContext, { cancel, confirm }: TFooter): void {
	const { state } = ctx
	const disabled = state.confirmDisabled === true

	patch(cancel, { size: state.size, text: state.names_cancel })
	patch(confirm, { size: state.size, disabled, text: state.names_confirm })
}

/** Календарь и движок — до вставки: сборка календаря берёт их при подключении. */
function calendarOf(ctx: TDatePickerContext, confirmable: boolean): TCalendarElementProps {
	const calendar = createDetail(ctx.root.ownerDocument, TCalendarElement, {
		embedded: 'date-picker.calendar',
	})

	calendar.className = 'so-date-picker__calendar'

	if (ctx.ctrl) {
		calendar.ctrl = ctx.ctrl.calendar
		calendar.engine = ctx.ctrl.engine
	}

	lendTemplates(ctx, calendar, DATE_PICKER_CALENDAR_SLOTS)

	if (confirmable) {
		const footer = footerOf(ctx)

		syncFooter(ctx, footer)
		lend(calendar, 'footer', footer.cancel)
		lend(calendar, 'footer', footer.confirm)
	}

	return calendar
}

function fieldOf(owner: Document, embedded: string, className: string): TDateInputElementProps {
	const field = createDetail(owner, TDateInputElement, { embedded })

	field.className = className

	return field
}

export const datePickerTemplate: ITemplate<IDatePicker, unknown, TDatePickerOutputs> = {
	create: (root, ctx) => {
		const { hasSlot } = ctx
		const { ownerDocument } = root
		const field = fieldOf(ownerDocument, 'date-picker.field', 'so-date-picker__field')
		const start = fieldOf(ownerDocument, 'date-picker.start', 'so-date-picker__start')
		const end = fieldOf(ownerDocument, 'date-picker.end', 'so-date-picker__end')
		const dash = ownerDocument.createElement('span')
		const trigger = createDetail(ownerDocument, TButtonElement, {
			embedded: 'date-picker.trigger',
			attributes: { type: 'button' },
		})
		const place = ownerDocument.createComment('')
		const panel = createDetail(ownerDocument, TFrameElement, {
			embedded: 'date-picker.frame',
			attributes: { tabindex: '-1' },
		})
		panel.addEventListener('so:bundle:create', (event) => {
			if (event.target === panel && event instanceof CustomEvent) {
				ctx.state.ids_bindPanel?.(event.detail)
			}
		})
		const handle = ownerDocument.createElement('div')
		const content = ownerDocument.createElement('div')

		// Обёртка у конца поля стоит всегда: кнопки встают перед метками
		const clearMark = lendMark(field, 'clear')
		const trailingMark = lendMark(field, 'trailing')

		dash.className = 'so-date-picker__dash'
		dash.setAttribute('aria-hidden', 'true')
		dash.textContent = '–'
		trigger.className = 'so-date-picker__trigger'
		panel.className = 'so-date-picker__panel'
		panel.strategy = 'fixed'
		panel.anchor_anchor = root
		panel.anchor_offset = 4
		handle.className = 'so-date-picker__handle'
		handle.setAttribute('aria-hidden', 'true')
		content.className = 'so-date-picker__content'

		if (!hasSlot('trigger-icon')) {
			lendRoleIcon(trigger, 'calendar', 'date-picker.trigger-icon')
		}

		// Содержимое — до вставки панели: она входит в документ одной вставкой и
		// собирается один раз
		lend(panel, DEFAULT_SLOT, content)
		root.append(place, panel)
		parts.set(root, {
			field,
			clearMark,
			trailingMark,
			start,
			dash,
			end,
			trigger,
			place,
			panel,
			handle,
			content,
		})

		return {
			// Своя кнопка очистки — у места режима: на её место ставит первая отрисовка
			slots: {
				clear: { mode: 'before', node: place },
				'trigger-icon': { mode: 'append', node: trigger, slot: DEFAULT_SLOT },
				item: { mode: 'sample' },
			},
		}
	},

	bindings: [
		// The calendar to its detail on every connection: details are built after
		// the DatePicker, and one moved in with another `ctrl` hands over the new
		// instance before the detail is rebuilt. The fields go with their mode, below
		bind([], ({ root, ctrl }) => {
			const own = parts.get(root)

			if (!own || !ctrl) return

			const calendar = calendars.get(root)?.node

			if (calendar && calendar.ctrl !== ctrl.calendar) {
				calendar.ctrl = ctrl.calendar
				calendar.engine = ctrl.engine
			}
		}),

		// Атрибут `id` разметки — вход; записанный инстансу из кода доходит до узла здесь
		bind('id', ({ root, state }) => {
			if (state.id === undefined) {
				if (root.hasAttribute('id')) root.removeAttribute('id')
			} else if (root.id !== state.id) {
				root.id = state.id
			}
		}),

		// A range has its buttons after the end field, not in its slot: they work with the
		// whole period. The mode's fields get their instances before they are placed — on
		// every connection, as the calendar above: the core creates a field when its mode
		// needs it, and the other mode's details get theirs when that mode comes
		bind(['mode', 'clearable'], (ctx) => {
			const own = parts.get(ctx.root)
			const picker = ctx.ctrl

			if (!own || !picker) return

			const clear = clearNodes(ctx)

			if (ctx.state.mode === 'range') {
				patch(own.start, { ctrl: picker.start })
				patch(own.end, { ctrl: picker.end })
				own.field.remove()
				placeBefore(
					ctx.root,
					[own.start, own.dash, own.end, ...clear, own.trigger],
					own.place,
				)

				return
			}

			patch(own.field, { ctrl: picker.field })
			own.start.remove()
			own.dash.remove()
			own.end.remove()
			lendAllBefore(own.clearMark, clear)
			lendAllBefore(own.trailingMark, [own.trigger])
			placeBefore(ctx.root, [own.field], own.place)
		}),

		bind(['clearable', 'size', 'disabled', 'clearAria'], (ctx) => {
			if (!ctx.hasSlot('clear') && ctx.state.clearable === true)
				clearButton(ctx, 'date-picker')
		}),

		bind(['size', 'openable', 'triggerAria', 'triggerDataset'], ({ root, state }) => {
			const trigger = parts.get(root)?.trigger

			if (!trigger) return

			const disabled = state.openable !== true

			patch(trigger, { size: state.size, disabled })

			ownerAttributes(trigger, { ...state.triggerAria, ...state.triggerDataset })
		}),

		// Поле одной даты — группа частей: имя ему пропсами, набор `aria` — слоем владельца
		bind(['aria', 'aria_label', 'aria_labelledBy', 'aria_describedBy'], ({ root, state }) => {
			const field = parts.get(root)?.field

			if (!field) return

			ownerAttributes(field, state.aria)

			patch(field, {
				aria_label: state.aria_label,
				aria_labelledBy: state.aria_labelledBy,
				aria_describedBy: state.aria_describedBy,
			})
		}),

		bind(['names_start', 'names_end'], ({ root, state }) => {
			const own = parts.get(root)

			if (!own) return

			patch(own.start, { aria_label: state.names_start })
			patch(own.end, { aria_label: state.names_end })
		}),

		// `visible`, а не `rendered`: увезённую панель прячет база Frame по поддереву
		// (AGENTS.md (Web Components), «Поддерево»)
		bind(['open', 'visible'], ({ root, state }) => {
			const panel = parts.get(root)?.panel
			const visible = state.visible === true && state.open === true

			if (panel && panel.visible !== visible) panel.visible = visible
		}),

		bind(['panelAria', 'panelDataset', 'dismiss_ownerAttribute'], ({ root, state }) => {
			const panel = parts.get(root)?.panel

			if (panel) {
				ownerAttributes(panel, {
					...state.panelAria,
					...state.panelDataset,
					...state.dismiss_ownerAttribute,
				})
			}
		}),

		bind('handleRendered', ({ root, state }) => {
			const own = parts.get(root)

			if (!own) return

			const { panel, handle } = own

			if (state.handleRendered !== true) {
				handle.remove()
			} else if (handle.parentNode !== panel) {
				lend(panel, DEFAULT_SLOT, handle, 'start')
			}
		}),

		// The footer is the calendar's light at build time: a change of `confirmable`
		// builds the calendar anew. The calendar is drawn from the panel's first
		// opening on (`contentRendered`)
		bind(['confirmable', 'contentRendered'], (ctx) => {
			const own = parts.get(ctx.root)

			if (!own || !ctx.ctrl || ctx.state.contentRendered !== true) return

			const confirmable = ctx.state.confirmable === true
			const drawn = calendars.get(ctx.root)

			if (drawn?.confirmable === confirmable) return

			const calendar = calendarOf(ctx, confirmable)

			if (drawn) own.content.replaceChild(calendar, drawn.node)
			else own.content.appendChild(calendar)

			calendars.set(ctx.root, { node: calendar, confirmable })
		}),

		bind(['size', 'confirmDisabled', 'names_cancel', 'names_confirm'], (ctx) => {
			const footer = footers.get(ctx.root)

			if (footer) syncFooter(ctx, footer)
		}),
	],
}
