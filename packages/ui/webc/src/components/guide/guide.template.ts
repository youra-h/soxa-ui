import type { IGuide } from '@soxa-ui/core'
import { DEFAULT_SLOT } from '@soxa-ui/setup'
import {
	bind,
	createDetail,
	lend,
	ownerAttributes,
	ownerStyles,
	type ITemplate,
} from '../../adapter'
import { createBackdrop, paintBackdrop } from '../../adapter/backdrop/backdrop'
import { TIconElement } from '../icon'
import { TButtonElement, type TButtonElementProps } from '../button'
import type { TGuideOutputs } from './setup.component'

type TAction = { button: TButtonElementProps; label: Text }
type TParts = {
	decoration: HTMLDivElement
	backdrop: HTMLElement
	spotlight: HTMLDivElement
	title: HTMLHeadingElement
	description: HTMLParagraphElement
	progress: HTMLParagraphElement
	previous: TAction
	next: TAction
	close: TButtonElementProps
}

const parts = new WeakMap<HTMLElement, TParts>()

function buttonOf(doc: Document, part: string, run: () => void): TButtonElementProps {
	const button = createDetail(doc, TButtonElement, {
		embedded: 'guide.' + part,
		attributes: { type: 'button' },
	})
	button.addEventListener('click', run)
	return button
}

function actionOf(doc: Document, part: string, run: () => void): TAction {
	const button = buttonOf(doc, part, run)
	const label = doc.createTextNode('')
	lend(button, DEFAULT_SLOT, label)

	return { button, label }
}

export const guideTemplate: ITemplate<IGuide, unknown, TGuideOutputs> = {
	create: (root, ctx) => {
		const doc = root.ownerDocument
		const decoration = doc.createElement('div')
		const backdrop = createBackdrop(doc)
		const spotlight = doc.createElement('div')
		const content = doc.createElement('div')
		const progress = doc.createElement('p')
		const title = doc.createElement('h2')
		const description = doc.createElement('p')
		const actions = doc.createElement('div')
		const previous = actionOf(doc, 'previous', () => ctx.ctrl?.previous())
		const next = actionOf(doc, 'next', () => ctx.ctrl?.next())
		const close = buttonOf(doc, 'close', () => ctx.ctrl?.requestClose('button'))
		const icon = createDetail(doc, TIconElement, { embedded: 'guide.close-icon' })
		icon.icon = 'close'
		lend(close, DEFAULT_SLOT, icon)

		decoration.className = 'so-guide__decoration'
		decoration.setAttribute('aria-hidden', 'true')
		close.className = 'so-guide__close'
		spotlight.className = 'so-guide__spotlight'
		content.className = 'so-guide__content'
		content.setAttribute('aria-live', 'polite')
		progress.className = 'so-guide__progress'
		title.className = 'so-guide__title'
		description.className = 'so-guide__description'
		actions.className = 'so-guide__actions'
		ownerAttributes(root, { tabindex: '-1' })

		decoration.append(backdrop, spotlight)
		content.append(progress, title, description)
		actions.append(previous.button, next.button)
		root.append(content, actions)
		parts.set(root, {
			decoration,
			backdrop,
			spotlight,
			title,
			description,
			progress,
			previous,
			next,
			close,
		})

		return { companion: decoration, slots: {} }
	},
	bindings: [
		bind(
			[
				'visible',
				'backdropRendered',
				'backdropClasses',
				'position_backdrop',
				'position_spotlight',
				'position_layer',
			],
			({ root, state }) => {
				const p = parts.get(root)
				if (!p) return

				p.decoration.hidden =
					!state.visible || (!state.backdropRendered && !state.position_spotlight)
				p.backdrop.hidden = !state.backdropRendered
				paintBackdrop(p.backdrop, {
					backdropClasses: state.backdropClasses,
					layout_backdropStyles: state.position_backdrop,
				})
				p.spotlight.hidden = !state.position_spotlight
				ownerStyles(p.decoration, state.position_layer)
				ownerStyles(p.spotlight, state.position_spotlight ?? undefined)
			},
		),
		bind(['step', 'stepNumber', 'names_labels', 'closable'], ({ root, state }) => {
			const p = parts.get(root)
			if (!p) return

			p.title.textContent = state.step?.title ?? ''
			p.description.textContent = state.step?.description ?? ''
			p.description.hidden = !state.step?.description
			p.progress.textContent = state.names_labels?.progress ?? ''
			p.previous.button.disabled = (state.stepNumber ?? 0) <= 1
			p.previous.label.data = state.names_labels?.previous ?? ''
			p.next.label.data = state.names_labels?.forward ?? ''
			ownerAttributes(p.close, { 'aria-label': state.names_labels?.close ?? null })
			if (state.step && state.closable) {
				if (p.close.parentNode !== root) root.append(p.close)
			} else {
				p.close.remove()
			}
		}),
	],
}
