import type { JSX } from 'solid-js'
import { Root, createRootProps, renderSlot } from '../../../adapter'
import { Show } from '../../../adapter/runtime/flow'
import { setupStepperContent } from './setup.component'
import type { StepperContentProps } from './base.component'

export function StepperContent(props: StepperContentProps): JSX.Element {
	const binding = setupStepperContent(props)
	const state = binding.state
	const root = createRootProps(() => ({
		state,
		sets: [state.attrs, state.dataset, state.aria],
		forward: binding.forwardProps(),
	}))

	return (
		<Show when={state.rendered && state.active}>
			<Root tag={state.tag} attributes={root} ref={binding.ref}>
				{renderSlot(props.children)}
			</Root>
		</Show>
	)
}
