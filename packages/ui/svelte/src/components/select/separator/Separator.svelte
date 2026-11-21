<script lang="ts">
	import { Dynamic, toRootProps } from '../../../adapter'
	import { setupSelectSeparator } from './setup.component'
	import type { SelectSeparatorProps } from './base.component'

	let { ref = $bindable(), ...props }: SelectSeparatorProps = $props()
	const mountId = $props.id()

	const binding = setupSelectSeparator(() => props, mountId, (node) => (ref = node))
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
