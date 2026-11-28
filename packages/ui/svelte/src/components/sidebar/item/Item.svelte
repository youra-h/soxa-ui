<script lang="ts">
	import { Dynamic, toRootProps } from '../../../adapter'
	import type { SidebarItemProps } from './base.component'
	import { setupSidebarItem } from './setup.component'

	let { ref = $bindable(), ...props }: SidebarItemProps = $props()
	const mountId = $props.id()
	const binding = setupSidebarItem(() => props, mountId, (node) => (ref = node))
	const state = binding.state
</script>

{#snippet label()}{state.text}{/snippet}
<Dynamic
	rendered={state.rendered}
	tag={state.tag}
	attributes={toRootProps(state, [{ title: state.text || null }, state.attrs, state.aria, state.dataset], binding.forwardProps)}
	attach={binding.attachElement}
>
	<span class="so-sidebar-item__leading" aria-hidden="true">{@render props.leading?.()}</span>
	<span class="so-sidebar-item__text">
		{@render (props.children ?? label)({ text: state.text ?? '' })}
	</span>
</Dynamic>
