import type { ISplitterHandle } from '@soxa-ui/core'
import { SplitterHandleDescriptor } from '@soxa-ui/setup'
import {
	ElementBase,
	bind,
	type ITemplate,
	type TElementClassOf,
	type TElementType,
} from '../../../adapter'
import { setupSplitterHandle } from './setup.component'

const grips = new WeakMap<HTMLElement, HTMLElement>()

const template: ITemplate<ISplitterHandle> = {
	create: (root) => {
		const grip = root.ownerDocument.createElement('span')
		grip.className = 'so-splitter__grip'
		grip.setAttribute('aria-hidden', 'true')
		grips.set(root, grip)

		return { slots: { icon: { mode: 'append', node: grip } } }
	},
	bindings: [
		bind('thumbShown', ({ root, state }) => {
			const grip = grips.get(root)

			if (!grip) return

			if (!state.thumbShown) grip.remove()
			else if (grip.parentNode !== root) root.append(grip)
		}),
	],
}

export const TSplitterHandleElement: TElementClassOf<
	typeof HTMLDivElement,
	typeof SplitterHandleDescriptor,
	ISplitterHandle
> = ElementBase(HTMLDivElement, {
	descriptor: SplitterHandleDescriptor,
	template,
	root: { strategy: 'host' },
	setup: setupSplitterHandle,
})

export type TSplitterHandleElementProps = TElementType<typeof TSplitterHandleElement>
