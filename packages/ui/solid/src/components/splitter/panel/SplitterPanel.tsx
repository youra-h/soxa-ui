import type { JSX } from 'solid-js'
import { Root, createRootProps, renderSlot } from '../../../adapter'
import { Show } from '../../../adapter/runtime/flow'
import type { SplitterPanelProps } from './base.component'
import { setupSplitterPanel } from './setup.component'

export function SplitterPanel(props: SplitterPanelProps): JSX.Element {
	const binding = setupSplitterPanel(props)
	const state = binding.state
	const attributes = createRootProps(() => ({
		state,
		sets: [state.attrs, state.aria, state.dataset],
		forward: binding.forwardProps(),
		style: state.panelStyle,
	}))

	return (
		<Show when={state.rendered}>
			<Root tag={state.tag} attributes={attributes} ref={binding.ref}>
				{renderSlot(props.children)}
			</Root>
		</Show>
	)
}
