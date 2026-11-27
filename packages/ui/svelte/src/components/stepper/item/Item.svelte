<script lang="ts">
	import { hasIcon } from '@soxa-ui/setup'
	import { clickAction, Dynamic, roleIcon, toControlAttrs, toRootForward, toRootProps } from '../../../adapter'
	import { Icon } from '../../icon'
	import { setupStepperItem } from './setup.component'
	import type { StepperItemAttributes, StepperItemProps } from './base.component'

	let { ref = $bindable(), ...props }: StepperItemProps = $props()
	const mountId = $props.id()
	const binding = setupStepperItem(() => props, mountId, (node) => (ref = node))
	const state = binding.state
	const scope = $derived({
		value: state.value ?? '',
		number: state.stepper_number ?? 1,
		active: state.active ?? false,
		completed: state.completed ?? false,
		error: state.error ?? false,
	})
	const activate = clickAction(() => {
		if (state.stepper_interactive) binding.activate()
	})
	const stepIcon = roleIcon(hasIcon('step') ? 'step' : 'arrowRight')
	const errorIcon = roleIcon('error')
	const checkIcon = roleIcon('check')
</script>

<Dynamic rendered={state.rendered} tag="li"
	attributes={toRootProps(state, [state.dataset], toRootForward(binding.forwardProps))}
	attach={binding.attachElement}>
	{#if props.leading}
		<div class="so-stepper-item__leading">{@render props.leading(scope)}</div>
	{/if}
	<svelte:element this={state.stepper_interactive ? 'button' : 'span'} class="so-stepper-item__trigger"
		{...state.aria} {...toControlAttrs<StepperItemAttributes>(binding.forwardProps)}
		type={state.stepper_interactive ? 'button' : undefined}
		disabled={state.stepper_interactive && !state.stepper_canActivate ? true : undefined}
		{@attach activate}>
		<span class="so-stepper-item__indicator" aria-hidden="true">
			{#if props.indicator}
				{@render props.indicator(scope)}
			{:else if state.active || state.error || state.completed}
				<Icon embedded={state.active ? 'stepper.step-icon' : 'stepper.status-icon'}
					class={state.active ? 'so-stepper-item__step-icon' : undefined}
					tag={state.active ? stepIcon : state.error ? errorIcon : checkIcon} size={state.size} />
			{:else}
				{state.stepper_number}
			{/if}
		</span>
		<span class="so-stepper-item__body">
			<span class="so-stepper-item__label">
				{#if props.children}{@render props.children(scope)}{:else}{state.text}{/if}
			</span>
			{#if props.subtitle || state.description}
				<span class="so-stepper-item__description">
					{#if props.subtitle}{@render props.subtitle(scope)}{:else}{state.description}{/if}
				</span>
			{/if}
		</span>
	</svelte:element>
	{#if state.stepper_hasSeparator}
		<span class="so-stepper-item__separator" aria-hidden="true">{@render props.separator?.(scope)}</span>
	{/if}
	{#if props.details}
		<div class="so-stepper-item__details">{@render props.details(scope)}</div>
	{/if}
</Dynamic>
