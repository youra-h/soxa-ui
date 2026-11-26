import type { JSX } from 'solid-js'
import { Root, createRootProps, renderSlot } from '../../../adapter'
import { Show } from '../../../adapter/runtime/flow'
import type { SplitterHandleProps } from './base.component'
import { setupSplitterHandle } from './setup.component'

export function SplitterHandle(props: SplitterHandleProps): JSX.Element {
	const binding = setupSplitterHandle(props)
	const state = binding.state
	const attributes = createRootProps(() => ({
		state,
		sets: [state.attrs, state.aria, state.dataset],
		forward: binding.forwardProps(),
	}))

	return (
		<Show when={state.rendered}>
			<Root tag={state.tag} attributes={attributes} ref={binding.ref}>
				<Show when={state.thumbShown}>
					<span class="so-splitter__grip" aria-hidden="true">
						{renderSlot(props.icon)}
					</span>
				</Show>
			</Root>
		</Show>
	)
}
