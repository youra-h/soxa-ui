<script lang="ts">
	import { Dynamic, toRootProps } from '../../../adapter'
	import { setupSplitterPanel } from './setup.component'
	import type { SplitterPanelProps } from './base.component'

	let { ref = $bindable(), ...props }: SplitterPanelProps = $props()
	const mountId = $props.id()

	const binding = setupSplitterPanel(() => props, mountId, (node) => (ref = node))
	const state = binding.state
</script>

<Dynamic
	rendered={state.rendered}
	tag={state.tag}
	attributes={toRootProps(state, [state.attrs, state.aria, state.dataset], binding.forwardProps, state.panelStyle)}
	attach={binding.attachElement}
>
	{@render props.children?.()}
</Dynamic>
