import type { ISidebar } from '@soxa-ui/core'
import { SidebarDescriptor } from '@soxa-ui/setup'
import {
	bind,
	defineElement,
	ElementBase,
	type ITemplate,
	type TElementClassOf,
	type TElementType,
} from '../../adapter'
import './item'
import { setupSidebar } from './setup.component'

const sidebarTemplate: ITemplate<ISidebar> = {
	create: (root) => {
		const content = root.ownerDocument.createElement('div')
		content.className = 'so-sidebar__content'
		root.append(content)
		return { slots: { default: { mode: 'append', node: content } } }
	},
	bindings: [
		bind('offcanvasHidden', ({ content, state }) => {
			content.toggleAttribute('inert', state.offcanvasHidden === true)
		}),
	],
}

export const TSidebarElement: TElementClassOf<
	typeof HTMLElement,
	typeof SidebarDescriptor,
	ISidebar
> = ElementBase(HTMLElement, {
	descriptor: SidebarDescriptor,
	template: sidebarTemplate,
	setup: setupSidebar,
})

defineElement('so-sidebar', TSidebarElement, 'aside')
export type TSidebarElementProps = TElementType<typeof TSidebarElement>
