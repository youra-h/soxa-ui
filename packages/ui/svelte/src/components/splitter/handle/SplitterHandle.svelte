<script lang="ts">
	import { Dynamic, toRootProps } from '../../../adapter'
	import { setupSplitterHandle } from './setup.component'
	import type { SplitterHandleProps } from './base.component'

	let { ref = $bindable(), ...props }: SplitterHandleProps = $props()
	const mountId = $props.id()

	const binding = setupSplitterHandle(() => props, mountId, (node) => (ref = node))
	const state = binding.state
</script>

<Dynamic
	rendered={state.rendered}
	tag={state.tag}
	attributes={toRootProps(state, [state.attrs, state.aria, state.dataset], binding.forwardProps)}
	attach={binding.attachElement}
>
	{#if state.thumbShown}
		<span class="so-splitter__grip" aria-hidden="true">{@render props.icon?.()}</span>
	{/if}
</Dynamic>
