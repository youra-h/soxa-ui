import type { JSX } from 'solid-js'
import { Root, createRootProps } from '../../../adapter'
import { Show } from '../../../adapter/runtime/flow'
import { setupListBoxSeparator } from './setup.component'
import type { ListBoxSeparatorProps } from './base.component'

export function ListBoxSeparator(props: ListBoxSeparatorProps): JSX.Element {
	const binding = setupListBoxSeparator(props)
	const state = binding.state
	const root = createRootProps(() => ({
		state,
		sets: [state.attrs, state.aria, state.dataset],
		forward: binding.forwardProps(),
	}))

	return (
		<Show when={state.rendered}>
			<Root tag={state.tag} attributes={root} ref={binding.ref} />
		</Show>
	)
}
