import type { ElementType, ReactElement } from 'react'
import {
	Teleport,
	renderSlot,
	roleIcon,
	toAriaProps,
	toRootProps,
	useClickAction,
} from '../../adapter'
import { Backdrop } from '../../adapter/backdrop/Backdrop'
import { Button } from '../button'
import { Icon } from '../icon'
import { useSetupAlertDialog } from './setup.component'
import type { AlertDialogProps } from './base.component'

const CloseIcon = roleIcon('close')

export function AlertDialog(props: AlertDialogProps): ReactElement | null {
	const { ctrl, ref, forwardProps, state } = useSetupAlertDialog(props)
	const confirm = useClickAction(ctrl.confirm)
	const cancel = useClickAction(ctrl.cancel)
	const close = useClickAction(() => ctrl.requestClose('button'))
	const {
		rendered,
		tag,
		target,
		attrs,
		aria,
		dataset,
		titleAria,
		bodyAria,
		closable,
		closeAria,
		dismiss_ownerAttribute,
		names_cancel,
		names_confirm,
	} = state

	if (!rendered) return null

	const Tag = tag as ElementType

	return (
		<Teleport to={target}>
			<Backdrop state={state} />
			<Tag
				tabIndex={-1}
				{...toRootProps(
					ref,
					state,
					[attrs, aria, dataset, dismiss_ownerAttribute],
					forwardProps,
				)}
			>
				<h2 className="so-alert-dialog__title" {...toAriaProps(titleAria)}>
					{renderSlot(props.title)}
				</h2>
				<div className="so-alert-dialog__body" {...toAriaProps(bodyAria)}>
					{renderSlot(props.children)}
				</div>
				<div className="so-alert-dialog__footer">
					{props.footer !== undefined ? (
						renderSlot(props.footer, { confirm: ctrl.confirm, cancel: ctrl.cancel })
					) : (
						<>
							<Button
								embedded="alert-dialog.cancel"
								type="button"
								className="so-alert-dialog__cancel"
								ref={cancel}
							>
								{props.cancel !== undefined
									? renderSlot(props.cancel)
									: names_cancel}
							</Button>
							<Button
								embedded="alert-dialog.action"
								type="button"
								className="so-alert-dialog__action"
								ref={confirm}
							>
								{props.action !== undefined
									? renderSlot(props.action)
									: names_confirm}
							</Button>
						</>
					)}
				</div>
				{closable ? (
					<Button
						embedded="alert-dialog.close"
						type="button"
						className="so-alert-dialog__close"
						ref={close}
						{...toAriaProps(closeAria)}
					>
						{renderSlot(props['close-icon']) ?? (
							<Icon embedded="alert-dialog.close-icon" tag={CloseIcon} />
						)}
					</Button>
				) : null}
			</Tag>
		</Teleport>
	)
}
