<script lang="ts">
	import type { TAttributesMap } from '@soxa-ui/core'
	import { clickAction, Dynamic, Teleport, roleIcon, toRootProps } from '../../adapter'
	import Backdrop from '../../adapter/backdrop/Backdrop.svelte'
	import { Button } from '../button'
	import { Icon } from '../icon'
	import { setupDialog } from './setup.component'
	import type { DialogProps } from './base.component'

	let { ref = $bindable(), ...props }: DialogProps = $props()
	const mountId = $props.id()

	const binding = setupDialog(() => props, mountId, (node) => (ref = node))
	const state = binding.state
	const ctrl = binding.ctrl
	const toggleMaximized = clickAction(() => ctrl.toggleMaximized())
	const close = clickAction(() => ctrl.requestClose('button'))

	// Первым, под наборами ядра: фокус встаёт на панель, когда внутри нечего фокусировать
	const PANEL: TAttributesMap = { tabindex: '-1' }

	const CLOSE = roleIcon('close')
	const MAXIMIZE = roleIcon('arrowsOutward')
	const RESTORE = roleIcon('arrowsInward')
</script>

<!--
	The backdrop and the panel are siblings, the backdrop first: they share one layer, and the panel
	is on top just by order. Order in the panel — title, body, footer, buttons: the cross is the last
	Tab stop. The buttons are mounted only while on (`{#if}`): the theme relies on their absence
	from the DOM, and a hidden button would still assemble its instance and plugins. The nodes are
	glued: Svelte would keep a space as text, and the theme collapses an empty title and footer by
	`:empty`.
-->
{#if state.rendered}
	<Teleport to={state.target}>
		{#if state.modal}<Backdrop {state} />{/if}<Dynamic
			rendered
			tag={state.tag}
			attributes={toRootProps(
				state,
				[PANEL, state.attrs, state.aria, state.dataset, state.dismiss_ownerAttribute],
				binding.forwardProps,
			)}
			attach={binding.attachElement}
		>
			<h2 class="so-dialog__title" {...state.titleAria}>{@render props.title?.()}</h2><div
				class="so-dialog__body"
				{...state.bodyAria}
			>
				{@render props.children?.()}
			</div><div class="so-dialog__footer">{@render props.footer?.()}</div>{#if state.maximizable}
				<Button
					embedded="dialog.maximize"
					type="button"
					class="so-dialog__maximize"
					{@attach toggleMaximized}
					{...state.maximizeAria}
				>
					{#if state.maximized}
						{#if props['restore-icon']}
							{@render props['restore-icon']()}
						{:else}
							<Icon embedded="dialog.restore-icon" tag={RESTORE} />
						{/if}
					{:else if props['maximize-icon']}
						{@render props['maximize-icon']()}
					{:else}
						<Icon embedded="dialog.maximize-icon" tag={MAXIMIZE} />
					{/if}
				</Button>{/if}{#if state.closable}
				<Button
					embedded="dialog.close"
					type="button"
					class="so-dialog__close"
					{@attach close}
					{...state.closeAria}
				>
					{#if props['close-icon']}
						{@render props['close-icon']()}
					{:else}
						<Icon embedded="dialog.close-icon" tag={CLOSE} />
					{/if}
				</Button>{/if}
		</Dynamic>
	</Teleport>
{/if}
