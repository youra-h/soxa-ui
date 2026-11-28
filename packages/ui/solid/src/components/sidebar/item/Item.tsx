import type { JSX } from 'solid-js'
import { Root, createRootProps, renderSlot } from '../../../adapter'
import { Show } from '../../../adapter/runtime/flow'
import type { SidebarItemProps } from './base.component'
import { setupSidebarItem } from './setup.component'

export function SidebarItem(props: SidebarItemProps): JSX.Element {
	const binding = setupSidebarItem(props)
	const state = binding.state
	const attributes = createRootProps(() => ({
		state,
		sets: [state.attrs, state.aria, state.dataset],
		forward: { title: state.text || undefined, ...binding.forwardProps() },
	}))

	return (
		<Show when={state.rendered}>
			<Root tag={state.tag} attributes={attributes} ref={binding.ref}>
				<span class="so-sidebar-item__leading" aria-hidden="true">
					{renderSlot(props.leading)}
				</span>
				<span class="so-sidebar-item__text">
					{renderSlot(props.children, {
						get text() {
							return state.text ?? ''
						},
					}) ?? state.text}
				</span>
			</Root>
		</Show>
	)
}
