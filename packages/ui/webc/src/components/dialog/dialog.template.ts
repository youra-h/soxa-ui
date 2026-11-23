/**
 * Шаблон Dialog: подложка — спутник корня, в окне заголовок, тело, подвал и
 * кнопки шапки; закрытие, кроме крестика, — плагины модального слоя.
 * docs/architecture.md, Layer 8d, «Модальный слой и тосты».
 */

import type { IDialog } from '@soxa-ui/core'
import { DEFAULT_SLOT } from '@soxa-ui/setup'
import {
	bind,
	createDetail,
	lend,
	lendBefore,
	lendMark,
	ownerAttributes,
	type ITemplate,
} from '../../adapter'
import { backdropOutputs, createBackdrop, paintBackdrop } from '../../adapter/backdrop/backdrop'
import { TButtonElement, type TButtonElementProps } from '../button'
import { TIconElement, type TIconElementProps } from '../icon'
import type { TDialogOutputs } from './setup.component'

type TDialogParts = {
	readonly backdrop: HTMLElement
	readonly title: HTMLElement
	readonly body: HTMLElement
	readonly footer: HTMLElement
	readonly maximize: TButtonElementProps
	/** Место значка разворота: остаётся там, куда кнопка, собравшись, положила свой слот. */
	readonly mark: Comment
	/** `null` — значок даёт слот `maximize-icon`. */
	readonly outward: TIconElementProps | null
	/** `null` — значок даёт слот `restore-icon`. */
	readonly inward: TIconElementProps | null
	readonly close: TButtonElementProps
}

const parts = new WeakMap<HTMLElement, TDialogParts>()

function buttonOf(owner: Document, embedded: string, className: string): TButtonElementProps {
	const button = createDetail(owner, TButtonElement, { embedded, attributes: { type: 'button' } })

	button.className = className

	return button
}

function iconOf(owner: Document, embedded: string, role: string): TIconElementProps {
	const icon = createDetail(owner, TIconElement, { embedded })

	icon.icon = role

	return icon
}

function toggleIcon(icon: TIconElementProps | null, mark: Comment, shown: boolean): void {
	if (!icon) return

	if (!shown) {
		icon.remove()
	} else if (icon.nextSibling !== mark) {
		lendBefore(mark, icon)
	}
}

/** Которой нет — вне документа, а не спрятана: тема опирается на её отсутствие (`:has()`). */
function toggleButton(button: HTMLElement, shown: boolean, put: () => void): void {
	if (!shown) {
		button.remove()
	} else if (!button.isConnected) {
		put()
	}
}

export const dialogTemplate: ITemplate<IDialog, unknown, TDialogOutputs> = {
	create: (root, ctx) => {
		const { hasSlot } = ctx

		const { ownerDocument } = root
		const backdrop = createBackdrop(ownerDocument)
		// Заголовок стоит всегда: на него окно ссылается `aria-labelledby`
		const title = ownerDocument.createElement('h2')
		const body = ownerDocument.createElement('div')
		const footer = ownerDocument.createElement('div')
		const maximize = buttonOf(ownerDocument, 'dialog.maximize', 'so-dialog__maximize')
		const close = buttonOf(ownerDocument, 'dialog.close', 'so-dialog__close')

		// Пометки владельцем у подложки нет — нажатие по ней мимо; к странице
		// указатель не пускает только она
		title.className = 'so-dialog__title'
		body.className = 'so-dialog__body'
		footer.className = 'so-dialog__footer'

		const mark = lendMark(maximize, DEFAULT_SLOT)

		const outward = hasSlot('maximize-icon')
			? null
			: iconOf(ownerDocument, 'dialog.maximize-icon', 'arrowsOutward')
		const inward = hasSlot('restore-icon')
			? null
			: iconOf(ownerDocument, 'dialog.restore-icon', 'arrowsInward')

		if (!hasSlot('close-icon')) {
			lend(close, DEFAULT_SLOT, iconOf(ownerDocument, 'dialog.close-icon', 'close'))
		}

		maximize.addEventListener('click', () => ctx.ctrl?.toggleMaximized())
		// Запрос: отменить закрытие может подписчик `close:before`
		close.addEventListener('click', () => ctx.ctrl?.requestClose('button'))

		// Кнопки последними: фокус встаёт в содержимое, крестик — последняя остановка
		// Tab. В окне с построения — свет значков едет в них, не выходя из документа
		root.append(title, body, footer, maximize, close)
		parts.set(root, { backdrop, title, body, footer, maximize, mark, outward, inward, close })

		return {
			companion: backdrop,
			slots: {
				title: { mode: 'append', node: title },
				default: { mode: 'append', node: body },
				footer: { mode: 'append', node: footer },
				'maximize-icon': { mode: 'before', node: mark, slot: DEFAULT_SLOT },
				'restore-icon': { mode: 'before', node: mark, slot: DEFAULT_SLOT },
				'close-icon': { mode: 'append', node: close, slot: DEFAULT_SLOT },
			},
		}
	},

	bindings: [
		bind('modal', ({ root, state }) => {
			const backdrop = parts.get(root)?.backdrop

			if (backdrop) backdrop.hidden = state.modal === false
		}),

		// Без пометки плагины не нашли бы слой окна, и нажатие в список внутри закрыло бы его
		bind('dismiss_ownerAttribute', ({ root, state }) => {
			ownerAttributes(root, { tabindex: '-1', ...state.dismiss_ownerAttribute })
		}),

		bind(backdropOutputs, ({ root, state }) => {
			const backdrop = parts.get(root)?.backdrop

			if (backdrop) paintBackdrop(backdrop, state)
		}),

		bind('titleAria', ({ root, state }) => {
			const title = parts.get(root)?.title

			if (title) ownerAttributes(title, state.titleAria)
		}),

		bind('bodyAria', ({ root, state }) => {
			const body = parts.get(root)?.body

			if (body) ownerAttributes(body, state.bodyAria)
		}),

		bind(['maximizable', 'maximizeAria'], ({ root, state }) => {
			const own = parts.get(root)

			if (!own) return

			ownerAttributes(own.maximize, state.maximizeAria)
			toggleButton(own.maximize, state.maximizable === true, () =>
				own.footer.after(own.maximize),
			)
		}),

		bind('maximized', ({ root, state, showSlot }) => {
			const own = parts.get(root)

			if (!own) return

			const maximized = state.maximized === true

			showSlot('maximize-icon', !maximized)
			showSlot('restore-icon', maximized)
			toggleIcon(own.outward, own.mark, !maximized)
			toggleIcon(own.inward, own.mark, maximized)
		}),

		bind(['closable', 'closeAria'], ({ root, state }) => {
			const own = parts.get(root)

			if (!own) return

			ownerAttributes(own.close, state.closeAria)
			toggleButton(own.close, state.closable === true, () => root.append(own.close))
		}),
	],
}
