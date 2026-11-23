import type { JSX } from 'solid-js'
import {
	Root,
	Teleport,
	clickAction,
	createPartProps,
	createRootProps,
	renderSlot,
	resolveSlot,
	roleIcon,
} from '../../adapter'
import { Show } from '../../adapter/runtime/flow'
import { Backdrop } from '../../adapter/backdrop/Backdrop'
import { Button } from '../button'
import { Icon } from '../icon'
import { setupAlertDialog } from './setup.component'
import type { AlertDialogProps } from './base.component'

const CLOSE = roleIcon('close')
export function AlertDialog(props: AlertDialogProps): JSX.Element {
	const binding = setupAlertDialog(props)
	const state = binding.state
	const ctrl = binding.ctrl
	const confirm = clickAction(ctrl.confirm)
	const cancel = clickAction(ctrl.cancel)
	const close = clickAction(() => ctrl.requestClose('button'))
	const panel = createRootProps(() => ({
		state,
		sets: [state.attrs, state.aria, state.dataset, state.dismiss_ownerAttribute],
		forward: binding.forwardProps(),
	}))
	const titleAria = createPartProps(() => state.titleAria)
	const bodyAria = createPartProps(() => state.bodyAria)
	const closeIcon = resolveSlot(
		() => props['close-icon'],
		() => ({}),
	)
	const footer = resolveSlot(
		() => props.footer,
		() => ({ confirm: ctrl.confirm, cancel: ctrl.cancel }),
	)

	return (
		<Show when={state.rendered}>
			<Teleport to={state.target}>
				<Backdrop state={state} />
				<Root
					tag={state.tag}
					attributes={() => ({ tabindex: '-1', ...panel() })}
					ref={binding.ref}
				>
					<h2 class="so-alert-dialog__title" {...titleAria()}>
						{renderSlot(props.title)}
					</h2>
					<div class="so-alert-dialog__body" {...bodyAria()}>
						{renderSlot(props.children)}
					</div>
					<div class="so-alert-dialog__footer">
						<Show
							when={props.footer !== undefined}
							fallback={
								<>
									<Button
										embedded="alert-dialog.cancel"
										type="button"
										class="so-alert-dialog__cancel"
										ref={cancel}
									>
										{props.cancel !== undefined
											? renderSlot(props.cancel)
											: state.names_cancel}
									</Button>
									<Button
										embedded="alert-dialog.action"
										type="button"
										class="so-alert-dialog__action"
										ref={confirm}
									>
										{props.action !== undefined
											? renderSlot(props.action)
											: state.names_confirm}
									</Button>
								</>
							}
						>
							{footer()}
						</Show>
					</div>
					<Show when={state.closable}>
						<Button
							embedded="alert-dialog.close"
							type="button"
							class="so-alert-dialog__close"
							ref={close}
							{...state.closeAria}
						>
							{closeIcon() ?? <Icon embedded="alert-dialog.close-icon" tag={CLOSE} />}
						</Button>
					</Show>
				</Root>
			</Teleport>
		</Show>
	)
}
