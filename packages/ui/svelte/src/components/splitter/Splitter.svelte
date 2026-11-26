<script lang="ts">
	import { Dynamic, toRootProps } from '../../adapter'
	import { setupSplitter } from './setup.component'
	import type { SplitterProps } from './base.component'

	let { ref = $bindable(), ...props }: SplitterProps = $props()
	const mountId = $props.id()

	const binding = setupSplitter(() => props, mountId, (node) => (ref = node))
	const state = binding.state
</script>

<Dynamic
	rendered={state.rendered}
	tag={state.tag}
	attributes={toRootProps(state, [state.attrs, state.aria, state.dataset], binding.forwardProps, state.splitterStyle)}
	attach={binding.attachElement}
>
	{@render props.children?.()}
</Dynamic>
