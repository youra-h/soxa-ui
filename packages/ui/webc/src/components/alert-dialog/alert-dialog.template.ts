import type { IAlertDialog } from '@soxa-ui/core'
import { DEFAULT_SLOT } from '@soxa-ui/setup'
import { bind, createDetail, lend, ownerAttributes, type ITemplate } from '../../adapter'
import { backdropOutputs, createBackdrop, paintBackdrop } from '../../adapter/backdrop/backdrop'
import { TButtonElement, type TButtonElementProps } from '../button'
import { TIconElement } from '../icon'
import type { TAlertDialogOutputs } from './setup.component'

type TParts = {
	backdrop: HTMLElement
	title: HTMLElement
	body: HTMLElement
	footer: HTMLElement
	close: TButtonElementProps
	action: TButtonElementProps | null
	cancel: TButtonElementProps | null
	actionText: Text | null
	cancelText: Text | null
}
const parts = new WeakMap<HTMLElement, TParts>()

function buttonOf(doc: Document, part: string): TButtonElementProps {
	const button = createDetail(doc, TButtonElement, {
		embedded: 'alert-dialog.' + part,
		attributes: { type: 'button' },
	})

	button.className = 'so-alert-dialog__' + part

	return button
}

export const alertDialogTemplate: ITemplate<IAlertDialog, unknown, TAlertDialogOutputs> = {
	create: (root, ctx) => {
		const doc = root.ownerDocument
		const backdrop = createBackdrop(doc)
		const title = doc.createElement('h2')
		const body = doc.createElement('div')
		const footer = doc.createElement('div')
		const close = buttonOf(doc, 'close')
		const hasFooter = ctx.hasSlot('footer')
		const cancel = hasFooter ? null : buttonOf(doc, 'cancel')
		const action = hasFooter ? null : buttonOf(doc, 'action')
		const cancelText = !hasFooter && !ctx.hasSlot('cancel') ? doc.createTextNode('') : null
		const actionText = !hasFooter && !ctx.hasSlot('action') ? doc.createTextNode('') : null

		title.className = 'so-alert-dialog__title'
		body.className = 'so-alert-dialog__body'
		footer.className = 'so-alert-dialog__footer'

		if (cancel && action) {
			if (cancelText) lend(cancel, DEFAULT_SLOT, cancelText)
			if (actionText) lend(action, DEFAULT_SLOT, actionText)
			cancel.addEventListener('click', () => ctx.ctrl?.cancel())
			action.addEventListener('click', () => ctx.ctrl?.confirm())
			footer.append(cancel, action)
		}

		if (!ctx.hasSlot('close-icon')) {
			const icon = createDetail(doc, TIconElement, { embedded: 'alert-dialog.close-icon' })

			icon.icon = 'close'
			lend(close, DEFAULT_SLOT, icon)
		}

		close.addEventListener('click', () => ctx.ctrl?.requestClose('button'))
		root.append(title, body, footer, close)
		parts.set(root, {
			backdrop,
			title,
			body,
			footer,
			close,
			action,
			cancel,
			actionText,
			cancelText,
		})

		return {
			companion: backdrop,
			slots: {
				title: { mode: 'append', node: title },
				default: { mode: 'append', node: body },
				footer: { mode: 'append', node: footer },
				...(cancel
					? { cancel: { mode: 'append' as const, node: cancel, slot: DEFAULT_SLOT } }
					: {}),
				...(action
					? { action: { mode: 'append' as const, node: action, slot: DEFAULT_SLOT } }
					: {}),
				'close-icon': { mode: 'append', node: close, slot: DEFAULT_SLOT },
			},
		}
	},
	bindings: [
		bind('dismiss_ownerAttribute', ({ root, state }) =>
			ownerAttributes(root, { tabindex: '-1', ...state.dismiss_ownerAttribute }),
		),
		bind(backdropOutputs, ({ root, state }) => {
			const backdrop = parts.get(root)?.backdrop

			if (backdrop) paintBackdrop(backdrop, state)
		}),
		bind('titleAria', ({ root, state }) => {
			const p = parts.get(root)
			if (p) ownerAttributes(p.title, state.titleAria)
		}),
		bind('bodyAria', ({ root, state }) => {
			const p = parts.get(root)
			if (p) ownerAttributes(p.body, state.bodyAria)
		}),
		bind('names_confirm', ({ root, state }) => {
			const p = parts.get(root)
			if (p?.actionText) p.actionText.data = state.names_confirm ?? ''
		}),
		bind('names_cancel', ({ root, state }) => {
			const p = parts.get(root)
			if (p?.cancelText) p.cancelText.data = state.names_cancel ?? ''
		}),
		bind(['closable', 'closeAria'], ({ root, state }) => {
			const p = parts.get(root)

			if (!p) return

			ownerAttributes(p.close, state.closeAria)
			if (!state.closable) p.close.remove()
			else if (!p.close.isConnected) root.append(p.close)
		}),
	],
}
