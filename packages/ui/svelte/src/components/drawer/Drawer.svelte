<script lang="ts">
	import type { TAttributesMap } from '@soxa-ui/core'
	import { clickAction, Dynamic, Teleport, roleIcon, toRootProps } from '../../adapter'
	import Backdrop from '../../adapter/backdrop/Backdrop.svelte'
	import { Button } from '../button'
	import { Icon } from '../icon'
	import { setupDrawer } from './setup.component'
	import type { DrawerProps } from './base.component'

	let { ref = $bindable(), ...props }: DrawerProps = $props()
	const mountId = $props.id()

	const binding = setupDrawer(() => props, mountId, (node) => (ref = node))
	const state = binding.state
	const ctrl = binding.ctrl
	const close = clickAction(() => ctrl.requestClose('button'))

	// Первым, под наборами ядра: фокус встаёт на панель, когда внутри нечего фокусировать
	const PANEL: TAttributesMap = { tabindex: '-1' }

	const CLOSE = roleIcon('close')
</script>

<!--
	The backdrop and the panel are siblings, the backdrop first: they share one layer, and the panel
	is on top just by order. Order in the panel — gesture handle, title, body, footer, cross: it is
	the last Tab stop. The cross is mounted only while on (`{#if}`): the theme relies on its
	absence from the DOM, and a hidden button would still assemble its instance and plugins. The
	nodes are glued: Svelte would keep a space as text, and the theme collapses an empty title and
	footer by `:empty`.
-->
{#if state.rendered}
	<Teleport to={state.target} disabled={state.contained}>
		<Backdrop {state} /><Dynamic
			rendered
			tag={state.tag}
			attributes={toRootProps(
				state,
				[PANEL, state.attrs, state.aria, state.dataset, state.dismiss_ownerAttribute],
				binding.forwardProps,
			)}
			attach={binding.attachElement}
		>
			{#if state.handleRendered}
				<div class="so-drawer__handle" aria-hidden="true"></div>
			{/if}<h2 class="so-drawer__title" {...state.titleAria}>{@render props.title?.()}</h2><div
				class="so-drawer__body"
			>
				{@render props.children?.()}
			</div><div class="so-drawer__footer">{@render props.footer?.()}</div>{#if state.closable}
				<Button
					embedded="drawer.close"
					type="button"
					class="so-drawer__close"
					{@attach close}
					{...state.closeAria}
				>
					{#if props['close-icon']}
						{@render props['close-icon']()}
					{:else}
						<Icon embedded="drawer.close-icon" tag={CLOSE} />
					{/if}
				</Button>{/if}
		</Dynamic>
	</Teleport>
{/if}
