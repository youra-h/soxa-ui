<script lang="ts">
	import { Dynamic, toRootProps } from '../../adapter'
	import type { SidebarProps } from './base.component'
	import { setupSidebar } from './setup.component'

	let { ref = $bindable(), ...props }: SidebarProps = $props()
	const mountId = $props.id()
	const binding = setupSidebar(() => props, mountId, (node) => (ref = node))
	const state = binding.state
</script>

<Dynamic
	rendered={state.rendered}
	tag={state.tag}
	attributes={toRootProps(state, [state.attrs, state.aria, state.dataset], binding.forwardProps)}
	attach={binding.attachElement}
>
	<div class="so-sidebar__content" inert={state.offcanvasHidden}>
		{@render props.children?.({ collapsed: state.collapsed ?? false })}
	</div>
</Dynamic>
