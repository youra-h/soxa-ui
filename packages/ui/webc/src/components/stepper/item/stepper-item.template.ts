import type { IStepperItem, TStepperItemCollectionFacade } from '@soxa-ui/core'
import { hasIcon } from '@soxa-ui/setup'
import { bind, createDetail, ownerAttributes, patch, type ITemplate } from '../../../adapter'
import { TIconElement } from '../../icon'

type TParts = {
	trigger: HTMLElement
	readonly indicator: HTMLSpanElement
	readonly label: HTMLSpanElement
	readonly description: HTMLSpanElement
	readonly separator: HTMLSpanElement
	readonly icon: ReturnType<typeof createIcon>
}

const parts = new WeakMap<HTMLElement, TParts>()

function createIcon(owner: Document) {
	return createDetail(owner, TIconElement, { embedded: 'stepper.status-icon' })
}

export const stepperItemTemplate: ITemplate<IStepperItem, TStepperItemCollectionFacade> = {
	create(root, ctx) {
		const owner = root.ownerDocument
		const make = <K extends keyof HTMLElementTagNameMap>(tag: K, part: string) => {
			const node = owner.createElement(tag)
			node.className = part
			return node
		}

		const leading = make('div', 'so-stepper-item__leading')
		const trigger = make('span', 'so-stepper-item__trigger')
		const indicator = make('span', 'so-stepper-item__indicator')
		const body = make('span', 'so-stepper-item__body')
		const label = make('span', 'so-stepper-item__label')
		const description = make('span', 'so-stepper-item__description')
		const separator = make('span', 'so-stepper-item__separator')
		const details = make('div', 'so-stepper-item__details')
		const icon = createIcon(owner)

		indicator.setAttribute('aria-hidden', 'true')
		separator.setAttribute('aria-hidden', 'true')
		body.append(label, description)
		trigger.append(indicator, body)
		if (ctx.hasSlot('leading')) root.append(leading)
		root.append(trigger, separator)
		if (ctx.hasSlot('details')) root.append(details)

		const own = { trigger, indicator, label, description, separator, icon }
		parts.set(root, own)
		root.addEventListener('click', (event) => {
			if (
				!event.defaultPrevented &&
				ctx.state.stepper_interactive &&
				event.target instanceof Node &&
				own.trigger.contains(event.target) &&
				ctx.facade
			) {
				ctx.facade.active = true
			}
		})

		return {
			slots: {
				leading: { mode: 'append', node: leading },
				indicator: { mode: 'append', node: indicator },
				default: { mode: 'append', node: label },
				subtitle: { mode: 'append', node: description },
				separator: { mode: 'append', node: separator },
				details: { mode: 'append', node: details },
			},
		}
	},
	bindings: [
		bind(['aria', 'stepper_interactive', 'stepper_canActivate'], ({ root, state }) => {
			const own = parts.get(root)
			if (!own) return

			const tag = state.stepper_interactive ? 'button' : 'span'
			if (own.trigger.localName !== tag) {
				const trigger = root.ownerDocument.createElement(tag)
				trigger.className = own.trigger.className
				trigger.append(...own.trigger.childNodes)
				own.trigger.replaceWith(trigger)
				own.trigger = trigger
			}
			ownerAttributes(own.trigger, state.aria)
			if (own.trigger instanceof HTMLButtonElement) {
				own.trigger.type = 'button'
				own.trigger.disabled = !state.stepper_canActivate
			}
		}),
		bind(
			['active', 'completed', 'error', 'size', 'stepper_number'],
			({ root, state, hasSlot }) => {
				const own = parts.get(root)
				if (!own || hasSlot('indicator')) return

				const role = state.active
					? hasIcon('step')
						? 'step'
						: 'arrowRight'
					: state.error
						? 'error'
						: state.completed
							? 'check'
							: undefined
				if (role) {
					own.icon.classList.toggle('so-stepper-item__step-icon', state.active === true)
					patch(own.icon, { icon: role, size: state.size })
					if (own.icon.parentNode !== own.indicator)
						own.indicator.replaceChildren(own.icon)
				} else {
					own.indicator.textContent = String(state.stepper_number ?? 1)
				}
			},
		),
		bind(['text', 'description', 'stepper_hasSeparator'], ({ root, state, hasSlot }) => {
			const own = parts.get(root)
			if (!own) return

			if (!hasSlot('default')) own.label.textContent = state.text ?? ''
			if (!hasSlot('subtitle')) own.description.textContent = state.description ?? ''
			own.description.hidden = !state.description && !hasSlot('subtitle')
			own.separator.hidden = !state.stepper_hasSeparator
		}),
	],
}
