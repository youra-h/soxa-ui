<script lang="ts">
	import { Dynamic, toRootProps } from '../../../adapter'
	import { setupListBoxSeparator } from './setup.component'
	import type { ListBoxSeparatorProps } from './base.component'

	let { ref = $bindable(), ...props }: ListBoxSeparatorProps = $props()
	const mountId = $props.id()

	const binding = setupListBoxSeparator(() => props, mountId, (node) => (ref = node))
	const state = binding.state
</script>

<Dynamic
	rendered={state.rendered}
	tag={state.tag}
	attributes={toRootProps(
		state,
		[state.attrs, state.aria, state.dataset],
		binding.forwardProps,
	)}
	attach={binding.attachElement}
/>
