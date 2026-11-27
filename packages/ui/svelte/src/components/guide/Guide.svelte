<script lang="ts">
	import { clickAction, Dynamic, Teleport, toRootProps, toStyleText } from '../../adapter'
	import { Button } from '../button'
	import { setupGuide } from './setup.component'
	import type { GuideProps } from './base.component'

	let { ref = $bindable(), ...props }: GuideProps = $props()
	const mountId = $props.id()

	const binding = setupGuide(() => props, mountId, (node) => (ref = node))
	const { state, ctrl } = binding
	const previous = clickAction(() => ctrl.previous())
	const next = clickAction(() => ctrl.next())
	const close = clickAction(() => ctrl.requestClose('button'))
	const panel = { tabindex: '-1' }
</script>

{#if state.rendered}
	<Teleport to={state.target}>
		{#if state.visible && (state.modal || state.position_spotlight)}
			<div class="so-guide__decoration" style={toStyleText(state.position_layer)} aria-hidden="true">
				{#if state.modal}<div class="so-guide__backdrop"></div>{/if}
				{#if state.position_spotlight}
					<div class="so-guide__spotlight" style={toStyleText(state.position_spotlight)}></div>
				{/if}
			</div>
		{/if}
		<Dynamic
			rendered
			tag={state.tag}
			attributes={toRootProps(state, [panel, state.attrs, state.aria, state.dataset], binding.forwardProps)}
			attach={binding.attachElement}
		>
			{#if state.step}
				<div class="so-guide__content" aria-live="polite">
					<p class="so-guide__progress">{state.names_labels?.progress}</p>
					<h2 class="so-guide__title">{state.step.title}</h2>
					{#if state.step.description}
						<p class="so-guide__description">{state.step.description}</p>
					{/if}
				</div>
				<div class="so-guide__actions">
					<Button type="button" embedded="guide.previous" disabled={(state.stepNumber ?? 0) <= 1} {@attach previous}>
						{state.names_labels?.previous}
					</Button>
					<Button type="button" embedded="guide.next" {@attach next}>{state.names_labels?.forward}</Button>
					<Button type="button" embedded="guide.close" {@attach close}>{state.names_labels?.close}</Button>
				</div>
			{/if}
		</Dynamic>
	</Teleport>
{/if}
