/**
 * Шаблон Select: поле — деталь Input, панель — деталь Frame со списком. Scope у
 * слотов нет: `field`, `tags` и `clear` берут данные у элемента
 * (`el.ctrl.field`, `el.state.tags`). docs/architecture.md, Layer 8d, «Набор
 * тегов и поле выбора».
 */

import type { ISelect, ISelectItem, ITags, TSelectCollectionFacade } from '@soxa-ui/core'
import { DEFAULT_SLOT } from '@soxa-ui/setup'
import {
	bind,
	createDetail,
	lend,
	lendBefore,
	lendMark,
	ownerAttributes,
	type ITemplate,
	type ITemplateContext,
	type TItemSlots,
	patch,
} from '../../adapter'
import { TFrameElement, type TFrameElementProps } from '../frame'
import { TIconElement, type TIconElementProps } from '../icon'
import { TInputElement, type TInputElementProps } from '../input'
import { TTagsElement, type TTagsElementProps } from '../tags'
import { TSelectGroupElement } from './group'
import { TSelectItemElement } from './item'
import { TDrawnRows, type TDrawnRowsSpec } from '../common/drawn-rows'
import type { TSelectOutputs } from './setup.component'

/** Слот Select → слот опции из данных; сверяет `setup/__tests__/item-slots.spec.ts`. */
export const SELECT_ITEM_SLOTS: TItemSlots = {
	'item-leading': 'leading',
	item: 'default',
	'item-trailing': 'trailing',
	'item-indicator-icon': 'indicator-icon',
}

type TSelectContext = ITemplateContext<ISelect, TSelectCollectionFacade, TSelectOutputs>

const ROWS: TDrawnRowsSpec<ISelectItem> = {
	block: 'select',
	item: TSelectItemElement,
	group: TSelectGroupElement,
	slots: SELECT_ITEM_SLOTS,
}

type TSelectParts = {
	readonly field: TInputElementProps
	readonly mark: Comment
	readonly arrow: TIconElementProps | null
	readonly panel: TFrameElementProps
	readonly handle: HTMLElement
	readonly list: HTMLElement
	/** Опции и распорки — одной петлёй; нет её — опции разметки. */
	readonly rows: TDrawnRows<ISelectItem> | null
}

type TFieldTags = {
	readonly node: TTagsElementProps
	readonly ctrl: ITags
}

const parts = new WeakMap<HTMLElement, TSelectParts>()

const fieldTags = new WeakMap<HTMLElement, TFieldTags>()

/**
 * Экземпляр сменился — новая деталь: Select заводит его на каждый переход в
 * `multiple`, а связка без движка снаружи — на каждое подключение.
 */
function drawTags(ctx: TSelectContext, own: TSelectParts): void {
	const tags = ctx.state.tags ?? null
	const drawn = fieldTags.get(ctx.root)

	if (drawn?.ctrl === tags) return

	drawn?.node.remove()
	fieldTags.delete(ctx.root)

	if (!tags) return

	const node = createDetail(ctx.root.ownerDocument, TTagsElement, { embedded: 'select.tags' })

	node.className = 'so-select__tags'
	// Экземпляр и коллекция — до вставки: сборка тегов берёт их при подключении
	node.ctrl = tags
	node.engine = ctx.state.tags_engine ?? undefined
	lendBefore(own.mark, node)
	fieldTags.set(ctx.root, { node, ctrl: tags })
}

export const selectTemplate: ITemplate<ISelect, TSelectCollectionFacade, TSelectOutputs> = {
	create: (root, ctx) => {
		const { hasSlot } = ctx
		const { ownerDocument } = root
		const field = createDetail(ownerDocument, TInputElement, { embedded: 'select.field' })
		const box = ownerDocument.createElement('span')
		const panel = createDetail(ownerDocument, TFrameElement, { embedded: 'select.frame' })
		panel.addEventListener('so:bundle:create', (event) => {
			if (event.target === panel && event instanceof CustomEvent) {
				ctx.state.ids_bindPanel?.(event.detail)
			}
		})
		const handle = ownerDocument.createElement('div')
		const list = ownerDocument.createElement('div')
		const end = ownerDocument.createComment('')

		field.className = 'so-select__field'
		box.className = 'so-select__arrow'
		panel.className = 'so-select__panel'
		panel.strategy = 'fixed'
		panel.anchor_anchor = root
		panel.anchor_offset = 4
		handle.className = 'so-select__handle'
		handle.setAttribute('aria-hidden', 'true')
		list.className = 'so-select__list'
		// Конец опций: петля держит строки перед ним, и `empty` встаёт туда же
		list.appendChild(end)

		// Обёртка `leading` поля стоит и в `single`; теги — перед меткой, `leading` Select — за ней
		const mark = lendMark(field, 'leading')

		// Обёртка стрелки остаётся и со слотом: по её классу тема разворачивает
		// стрелку, а `TSelectPointerPlugin` в `editable` открывает панель
		let arrow: TIconElementProps | null = null

		if (!hasSlot('arrow-icon')) {
			arrow = createDetail(ownerDocument, TIconElement, { embedded: 'select.arrow' })
			arrow.icon = 'arrowDown'
			box.appendChild(arrow)
		}

		// Сначала содержимое в детали, потом детали в корень: одна вставка — одна сборка
		lend(field, 'trailing', box)
		lend(panel, DEFAULT_SLOT, list)

		if (!hasSlot('field')) root.appendChild(field)

		root.appendChild(panel)

		const rows = hasSlot(DEFAULT_SLOT) ? null : new TDrawnRows(list, end, ROWS)

		parts.set(root, { field, mark, arrow, panel, handle, list, rows })

		return {
			// `clear` раньше `trailing`: у конца поля он первый, за ним стрелка и `trailing`
			slots: {
				field: { mode: 'before', node: panel },
				tags: { mode: 'before', node: mark, slot: 'leading' },
				leading: { mode: 'append', node: field, slot: 'leading' },
				clear: { mode: 'append', node: field, slot: 'clear' },
				'arrow-icon': { mode: 'append', node: box },
				trailing: { mode: 'append', node: field, slot: 'trailing' },
				default: { mode: 'before', node: end },
				empty: { mode: 'before', node: end },
				item: { mode: 'sample' },
				'item-leading': { mode: 'sample' },
				'item-trailing': { mode: 'sample' },
				'item-indicator-icon': { mode: 'sample' },
			},
			control: field,
		}
	},

	bindings: [
		// На каждое подключение: в построении инстанса ещё нет, а деталь
		// собирается после Select и берёт экземпляр поля при подключении
		bind([], ({ root, ctrl }) => {
			const field = parts.get(root)?.field

			if (field && ctrl && field.ctrl !== ctrl.field) field.ctrl = ctrl.field
		}),

		// `id` Select (приложения или поля формы) — `id` его поля: атрибут `id`
		// детали с полем база берёт её пропом, и Input кладёт его на `<input>`.
		// Пустой — снят. Пишется на каждую смену: с корня детали атрибут снят, и
		// сверять не с чем
		bind('id', ({ root, state }) => {
			const field = parts.get(root)?.field

			if (field) field.id = state.id ?? ''
		}),

		// У детали с полем набор уходит на `<input>`, поверх набора комбобокса
		bind('aria', ({ root, state }) => {
			const field = parts.get(root)?.field

			if (field) ownerAttributes(field, state.aria)
		}),

		bind('size', ({ root, state }) => {
			const arrow = parts.get(root)?.arrow

			if (arrow && arrow.size !== state.size) arrow.size = state.size
		}),

		bind(['tags', 'tags_engine'], (ctx) => {
			const own = parts.get(ctx.root)

			ctx.showSlot('tags', (ctx.state.tags ?? null) !== null)

			if (own && !ctx.hasSlot('tags')) drawTags(ctx, own)
		}),

		// Открытость — `visible`, а не `rendered`: закрытие не вычищает коллекцию опций.
		// Увезённую панель прячет база Frame, AGENTS.md (Web Components), «Поддерево»
		bind(
			['open', 'panelPlacement', 'panelFlip', 'autoFitWidth', 'visible'],
			({ root, state }) => {
				const panel = parts.get(root)?.panel

				if (!panel) return

				const visible = state.visible === true && state.open === true
				const flip = state.panelFlip === true
				const matchWidth = state.autoFitWidth === true

				patch(panel, {
					visible,
					anchor_placement: state.panelPlacement,
					anchor_flip: flip,
					anchor_matchWidth: matchWidth,
				})
			},
		),

		// Без пометки владельцем нажатие в панель считалось бы нажатием мимо
		bind(['panelDataset', 'dismiss_ownerAttribute'], ({ root, state }) => {
			const panel = parts.get(root)?.panel

			if (panel) {
				ownerAttributes(panel, { ...state.panelDataset, ...state.dismiss_ownerAttribute })
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

		// Остановки Tab у списка нет: фокус на поле, опцию объявляет `aria-activedescendant`
		bind('listAria', ({ root, state }) => {
			const list = parts.get(root)?.list

			if (list) ownerAttributes(list, state.listAria)
		}),

		// Options from data from the panel's first opening on (`contentRendered`): a
		// closed Select nobody opened draws an empty list
		bind(['drawnSections', 'groupSeparators', 'contentRendered'], (ctx) => {
			if (ctx.state.contentRendered !== true) return

			parts
				.get(ctx.root)
				?.rows?.draw(ctx, ctx.state.drawnSections, ctx.state.groupSeparators === true)
		}),

		// `empty` — внутри списка: пустой `listbox` для скринридера — тупик
		bind('shown', ({ state, showSlot }) => {
			showSlot('empty', (state.shown ?? []).length === 0)
		}),
	],
}
