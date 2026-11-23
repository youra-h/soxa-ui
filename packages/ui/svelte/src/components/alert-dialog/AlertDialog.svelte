<script lang="ts">
	import type { TAttributesMap } from '@soxa-ui/core'
	import { clickAction, Dynamic, Teleport, roleIcon, toRootProps } from '../../adapter'
	import Backdrop from '../../adapter/backdrop/Backdrop.svelte'
	import { Button } from '../button'
	import { Icon } from '../icon'
	import { setupAlertDialog } from './setup.component'
	import type { AlertDialogProps } from './base.component'

	let { ref = $bindable(), ...props }: AlertDialogProps = $props()
	const mountId = $props.id()
	const binding = setupAlertDialog(() => props, mountId, (node) => (ref = node))
	const state = binding.state
	const ctrl = binding.ctrl
	const confirm = clickAction(ctrl.confirm)
	const cancel = clickAction(ctrl.cancel)
	const close = clickAction(() => ctrl.requestClose('button'))
	const PANEL: TAttributesMap = { tabindex: '-1' }
	const CLOSE = roleIcon('close')
</script>

{#if state.rendered}
	<Teleport to={state.target}>
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
			<h2 class="so-alert-dialog__title" {...state.titleAria}>{@render props.title?.()}</h2><div
				class="so-alert-dialog__body"
				{...state.bodyAria}
			>{@render props.children?.()}</div><div class="so-alert-dialog__footer">{#if props.footer}
					{@render props.footer({ confirm: ctrl.confirm, cancel: ctrl.cancel })}
				{:else}
					<Button
						embedded="alert-dialog.cancel"
						type="button"
						class="so-alert-dialog__cancel"
						{@attach cancel}
					>{#if props.cancel}{@render props.cancel()}{:else}{state.names_cancel}{/if}</Button><Button
						embedded="alert-dialog.action"
						type="button"
						class="so-alert-dialog__action"
						{@attach confirm}
					>{#if props.action}{@render props.action()}{:else}{state.names_confirm}{/if}</Button>
				{/if}</div>{#if state.closable}
				<Button
					embedded="alert-dialog.close"
					type="button"
					class="so-alert-dialog__close"
					{@attach close}
					{...state.closeAria}
				>
					{#if props['close-icon']}
						{@render props['close-icon']()}
					{:else}
						<Icon embedded="alert-dialog.close-icon" tag={CLOSE} />
					{/if}
				</Button>
			{/if}
		</Dynamic>
	</Teleport>
{/if}
