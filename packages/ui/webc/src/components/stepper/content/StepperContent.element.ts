import { StepperContentDescriptor, TStepperContentExtension } from '@soxa-ui/setup'
import type { IStepperContent } from '@soxa-ui/core'
import {
	ElementBase,
	defineElement,
	bind,
	createWebcAdapterContext,
	useAdapter,
	type TElementClassOf,
	type TElementType,
} from '../../../adapter'
import { createWebcElevator } from '../../../adapter/elevator'

export const TStepperContentElement: TElementClassOf<
	typeof HTMLDivElement,
	typeof StepperContentDescriptor,
	IStepperContent
> = ElementBase(HTMLDivElement, {
	descriptor: StepperContentDescriptor,
	root: { strategy: 'host', sets: ['attrs', 'dataset', 'aria'], shownBy: 'active' },
	template: {
		create: (root) => ({ slots: { default: { mode: 'append', node: root } } }),
		bindings: [
			bind('active', ({ state, showSlot }) => showSlot('default', state.active === true)),
		],
	},
	setup(host, ctrl, props, onUpdate) {
		const adapter = createWebcAdapterContext(host, StepperContentDescriptor(), {
			ctrl,
			props,
		}).use(TStepperContentExtension, { elevator: createWebcElevator(host) })

		return useAdapter(adapter, host, onUpdate)
	},
})

defineElement('so-stepper-content', TStepperContentElement, 'div')

export type TStepperContentElementProps = TElementType<typeof TStepperContentElement>
