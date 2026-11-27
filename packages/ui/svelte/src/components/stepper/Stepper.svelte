<script lang="ts">
	import { Dynamic, toRootProps } from '../../adapter'
	import { StepperItem } from './item'
	import { setupStepper } from './setup.component'
	import type { StepperProps } from './base.component'

	let { ref = $bindable(), ...props }: StepperProps = $props()
	const mountId = $props.id()
	const binding = setupStepper(() => props, mountId, (node) => (ref = node))
	const state = binding.state
</script>

<Dynamic rendered={state.rendered} tag={state.tag}
	attributes={toRootProps(state, [state.attrs, state.dataset, state.aria], binding.forwardProps)}
	attach={binding.attachElement}>
	<ol class="so-stepper__list" role="list">
		{#if props.children}
			{@render props.children()}
		{:else}
			{#each state.shown ?? [] as item (item.uid)}
				{#if props.item}
					{@render props.item({ item })}
				{:else}
					<StepperItem ctrl={item} />
				{/if}
			{/each}
		{/if}
	</ol>
	{@render props.content?.({
		value: state.value, next: binding.next, previous: binding.previous,
		canNext: state.stepper_canNext ?? false, canPrevious: state.stepper_canPrevious ?? false,
	})}
</Dynamic>
