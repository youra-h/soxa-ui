import type { IStepper, IStepperItem, TStepperCollectionFacade } from '@soxa-ui/core'
import { TKeyedLoop, bind, createItem, lendSamples, type ITemplate } from '../../adapter'
import { TStepperItemElement } from './item/StepperItem.element'

const loops = new WeakMap<HTMLElement, TKeyedLoop<IStepperItem, number>>()

export const stepperTemplate: ITemplate<IStepper, TStepperCollectionFacade> = {
	create(root, { hasSlot }) {
		const list = root.ownerDocument.createElement('ol')
		list.className = 'so-stepper__list'
		list.setAttribute('role', 'list')
		root.append(list)

		if (!hasSlot('default')) {
			loops.set(root, new TKeyedLoop(list, null, (item) => item.uid))
		}

		return {
			slots: {
				default: { mode: 'append', node: list },
				content: { mode: 'append', node: root },
				item: { mode: 'sample' },
			},
		}
	},
	bindings: [
		bind('shown', (ctx) => {
			loops.get(ctx.root)?.draw(ctx.state.shown ?? [], (item) => {
				const step = createItem(ctx.root.ownerDocument, TStepperItemElement)
				step.ctrl = item
				lendSamples(ctx, step, { item: 'default' })
				return step
			})
		}),
	],
}
