<script lang="ts">
	import { Dynamic, toRootProps } from '../../../adapter'
	import { setupStepperContent } from './setup.component'
	import type { StepperContentProps } from './base.component'

	let { ref = $bindable(), ...props }: StepperContentProps = $props()
	const mountId = $props.id()

	const binding = setupStepperContent(() => props, mountId, (node) => (ref = node))
	const state = binding.state
</script>

<Dynamic
	rendered={state.rendered && state.active}
	tag={state.tag}
	attributes={toRootProps(state, [state.attrs, state.dataset, state.aria], binding.forwardProps)}
	attach={binding.attachElement}
>
	{@render props.children?.()}
</Dynamic>
