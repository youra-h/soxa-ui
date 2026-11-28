import type { ISidebarItem } from '@soxa-ui/core'
import { SidebarItemDescriptor } from '@soxa-ui/setup'
import {
	bind,
	defineElement,
	ElementBase,
	type ITemplate,
	type TElementClassOf,
	type TElementType,
} from '../../../adapter'
import { setupSidebarItem } from './setup.component'

const sidebarItemTemplate: ITemplate<ISidebarItem> = {
	create: (root) => {
		const leading = root.ownerDocument.createElement('span')
		leading.className = 'so-sidebar-item__leading'
		leading.setAttribute('aria-hidden', 'true')

		const label = root.ownerDocument.createElement('span')
		label.className = 'so-sidebar-item__text'
		root.append(leading, label)

		return {
			slots: {
				leading: { mode: 'append', node: leading },
				default: { mode: 'append', node: label },
			},
		}
	},
	bindings: [
		bind('text', ({ content, state, hasSlot, root }) => {
			if (!hasSlot('default')) content.textContent = state.text ?? ''
			root.title = state.text ?? ''
		}),
	],
}

export const TSidebarItemElement: TElementClassOf<
	typeof HTMLButtonElement,
	typeof SidebarItemDescriptor,
	ISidebarItem
> = ElementBase(HTMLButtonElement, {
	descriptor: SidebarItemDescriptor,
	template: sidebarItemTemplate,
	setup: setupSidebarItem,
})

export const TSidebarLinkElement: TElementClassOf<
	typeof HTMLAnchorElement,
	typeof SidebarItemDescriptor,
	ISidebarItem
> = ElementBase(HTMLAnchorElement, {
	descriptor: SidebarItemDescriptor,
	template: sidebarItemTemplate,
	setup: setupSidebarItem,
})

defineElement('so-sidebar-item', TSidebarItemElement, 'button')
defineElement('so-sidebar-link', TSidebarLinkElement, 'a')
export type TSidebarItemElementProps = TElementType<typeof TSidebarItemElement>
export type TSidebarLinkElementProps = TElementType<typeof TSidebarLinkElement>
