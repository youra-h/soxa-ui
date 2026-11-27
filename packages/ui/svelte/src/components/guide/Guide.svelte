<script lang="ts">
	import { clickAction, Dynamic, Teleport, roleIcon, toRootProps, toStyleText } from '../../adapter'
	import Backdrop from '../../adapter/backdrop/Backdrop.svelte'
	import { Button } from '../button'
	import { Icon } from '../icon'
	import { setupGuide } from './setup.component'
	import type { GuideProps } from './base.component'

	const CLOSE = roleIcon('close')

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
		{#if state.visible && (state.backdropRendered || state.position_spotlight)}
			<div class="so-guide__decoration" style={toStyleText(state.position_layer)} aria-hidden="true">
				{#if state.backdropRendered}
					<Backdrop
						state={{
							backdropClasses: state.backdropClasses,
							layout_backdropStyles: state.position_backdrop,
							visible: true,
						}}
					/>
				{/if}
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
				</div>
				{#if state.closable}
					<Button
						type="button"
						embedded="guide.close"
						class="so-guide__close"
						aria_label={state.names_labels?.close}
						{@attach close}
					>
						<Icon embedded="guide.close-icon" tag={CLOSE} />
					</Button>
				{/if}
			{/if}
		</Dynamic>
	</Teleport>
{/if}
