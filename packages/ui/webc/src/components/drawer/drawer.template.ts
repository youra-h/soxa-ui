/**
 * Шаблон Drawer: подложка-спутник раньше панели; в панели — полоса, заголовок,
 * тело, подвал, потом крестик: фокус при открытии попадает на первый контрол
 * содержимого, а крестик — последняя остановка Tab. Заголовок стоит всегда — на
 * него ссылается `aria-labelledby`. Без `closable` крестика нет в документе:
 * тема опирается на его отсутствие.
 */

import type { IDrawer } from '@soxa-ui/core'
import { DEFAULT_SLOT } from '@soxa-ui/setup'
import { bind, createDetail, ownerAttributes, type ITemplate } from '../../adapter'
import { backdropOutputs, createBackdrop, paintBackdrop } from '../../adapter/backdrop/backdrop'
import { lendRoleIcon } from '../common/icon-button'
import { TButtonElement, type TButtonElementProps } from '../button'
import type { TDrawerOutputs } from './setup.component'

/** Части панели — одни на всё время жизни элемента. */
type TDrawerParts = {
	readonly backdrop: HTMLElement
	readonly handle: HTMLElement
	readonly title: HTMLElement
	readonly body: HTMLElement
	readonly footer: HTMLElement
	readonly close: TButtonElementProps
}

const parts = new WeakMap<HTMLElement, TDrawerParts>()

export const drawerTemplate: ITemplate<IDrawer, unknown, TDrawerOutputs> = {
	create: (root, ctx) => {
		const { hasSlot } = ctx

		const { ownerDocument } = root
		const backdrop = createBackdrop(ownerDocument)
		const handle = ownerDocument.createElement('div')
		const title = ownerDocument.createElement('h2')
		const body = ownerDocument.createElement('div')
		const footer = ownerDocument.createElement('div')
		const close = createDetail(ownerDocument, TButtonElement, {
			embedded: 'drawer.close',
			attributes: { type: 'button' },
		})

		handle.className = 'so-drawer__handle'
		handle.setAttribute('aria-hidden', 'true')
		title.className = 'so-drawer__title'
		body.className = 'so-drawer__body'
		footer.className = 'so-drawer__footer'
		close.className = 'so-drawer__close'

		// Своя иконка — только без слота `close-icon`
		if (!hasSlot('close-icon')) {
			lendRoleIcon(close, 'close', 'drawer.close-icon')
		}

		close.addEventListener('click', () => ctx.ctrl?.requestClose('button'))

		// Крестик — в панели с построения: свет слота иконки едет в него, не
		// выходя из документа. Без `closable` его снимает первая раскладка
		root.append(title, body, footer, close)
		parts.set(root, { backdrop, handle, title, body, footer, close })

		return {
			companion: backdrop,
			slots: {
				title: { mode: 'append', node: title },
				default: { mode: 'append', node: body },
				footer: { mode: 'append', node: footer },
				'close-icon': { mode: 'append', node: close, slot: DEFAULT_SLOT },
			},
		}
	},

	bindings: [
		// `tabindex="-1"` — фокус встаёт на панель, когда внутри нечего фокусировать;
		// с пометкой владельцем — одним слоем владельца
		bind('dismiss_ownerAttribute', ({ root, state }) => {
			ownerAttributes(root, { tabindex: '-1', ...state.dismiss_ownerAttribute })
		}),

		// Подложка — тот же слой, открытость и место, что у панели
		bind(backdropOutputs, ({ root, state }) => {
			const backdrop = parts.get(root)?.backdrop

			if (backdrop) paintBackdrop(backdrop, state)
		}),

		bind('titleAria', ({ root, state }) => {
			const title = parts.get(root)?.title

			if (title) ownerAttributes(title, state.titleAria)
		}),

		// Полоса жеста — первой в панели, пока жест включён
		bind('handleRendered', ({ root, state }) => {
			const handle = parts.get(root)?.handle

			if (!handle) return

			if (state.handleRendered !== true) {
				handle.remove()
			} else if (root.firstChild !== handle) {
				root.prepend(handle)
			}
		}),

		// Крестик — последним в панели, пока панель можно закрыть им
		bind(['closable', 'closeAria'], ({ root, state }) => {
			const close = parts.get(root)?.close

			if (!close) return

			ownerAttributes(close, state.closeAria)

			if (state.closable !== true) {
				close.remove()
			} else if (!close.isConnected) {
				root.append(close)
			}
		}),
	],
}
