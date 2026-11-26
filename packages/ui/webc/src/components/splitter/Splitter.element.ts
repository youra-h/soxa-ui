import type { ISplitter } from '@soxa-ui/core'
import { SplitterDescriptor } from '@soxa-ui/setup'
import {
	ElementBase,
	defineElement,
	type ITemplate,
	type TElementClassOf,
	type TElementType,
} from '../../adapter'
import { setupSplitter } from './setup.component'
import { TSplitterPanelElement } from './panel'
import { TSplitterHandleElement } from './handle'

const template: ITemplate<ISplitter> = {
	create: (root) => {
		return { slots: { default: { mode: 'append', node: root } } }
	},
	bindings: [],
}

export const TSplitterElement: TElementClassOf<
	typeof HTMLDivElement,
	typeof SplitterDescriptor,
	ISplitter
> = ElementBase(HTMLDivElement, {
	descriptor: SplitterDescriptor,
	template,
	root: { strategy: 'host', style: 'splitterStyle' },
	setup: setupSplitter,
})

defineElement('so-splitter', TSplitterElement, 'div')
defineElement('so-splitter-panel', TSplitterPanelElement, 'div')
defineElement('so-splitter-handle', TSplitterHandleElement, 'div')

export type TSplitterElementProps = TElementType<typeof TSplitterElement>
