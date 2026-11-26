import type { ISplitterPanel } from '@soxa-ui/core'
import { SplitterPanelDescriptor } from '@soxa-ui/setup'
import {
	ElementBase,
	type ITemplate,
	type TElementClassOf,
	type TElementType,
} from '../../../adapter'
import { setupSplitterPanel } from './setup.component'

const template: ITemplate<ISplitterPanel> = {
	create: (root) => {
		return { slots: { default: { mode: 'append', node: root } } }
	},
	bindings: [],
}

export const TSplitterPanelElement: TElementClassOf<
	typeof HTMLDivElement,
	typeof SplitterPanelDescriptor,
	ISplitterPanel
> = ElementBase(HTMLDivElement, {
	descriptor: SplitterPanelDescriptor,
	template,
	root: { strategy: 'host', style: 'panelStyle' },
	setup: setupSplitterPanel,
})

export type TSplitterPanelElementProps = TElementType<typeof TSplitterPanelElement>
