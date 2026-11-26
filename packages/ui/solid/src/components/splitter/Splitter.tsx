import type { JSX } from 'solid-js'
import { Elevate, Root, createRootProps, renderSlot } from '../../adapter'
import { Show } from '../../adapter/runtime/flow'
import type { SplitterProps } from './base.component'
import { setupSplitter } from './setup.component'

export function SplitterComponent(props: SplitterProps): JSX.Element {
	const binding = setupSplitter(props)
	const state = binding.state
	const attributes = createRootProps(() => ({
		state,
		sets: [state.attrs, state.aria, state.dataset],
		forward: binding.forwardProps(),
		style: state.splitterStyle,
	}))

	return (
		<Show when={state.rendered}>
			<Root tag={state.tag} attributes={attributes} ref={binding.ref}>
				<Elevate layer={binding.layer}>{renderSlot(props.children)}</Elevate>
			</Root>
		</Show>
	)
}
