import type { JSX } from 'solid-js'
import { Root, createRootProps, renderSlot } from '../../adapter'
import { Show } from '../../adapter/runtime/flow'
import type { SidebarProps } from './base.component'
import { setupSidebar } from './setup.component'

export function Sidebar(props: SidebarProps): JSX.Element {
	const binding = setupSidebar(props)
	const state = binding.state
	const attributes = createRootProps(() => ({
		state,
		sets: [state.attrs, state.aria, state.dataset],
		forward: binding.forwardProps(),
	}))

	return (
		<Show when={state.rendered}>
			<Root tag={state.tag} attributes={attributes} ref={binding.ref}>
				<div class="so-sidebar__content" inert={state.offcanvasHidden}>
					{renderSlot(props.children, {
						get collapsed() {
							return state.collapsed ?? false
						},
					})}
				</div>
			</Root>
		</Show>
	)
}
