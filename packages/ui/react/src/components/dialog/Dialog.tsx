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
import { useSetupDialog } from './setup.component'
import type { DialogProps } from './base.component'

const CloseIcon = roleIcon('close')
const MaximizeIcon = roleIcon('arrowsOutward')
const RestoreIcon = roleIcon('arrowsInward')

/**
 * Dialog — модальное окно: подложка и панель — соседи в телепорте (docs/agents/overlay.md,
 * «Слой оверлея»). `tabIndex={-1}` панели перекрывают набор ядра и атрибуты потребителя.
 */
export function Dialog(props: DialogProps): ReactElement | null {
	const { ctrl, ref, forwardProps, state } = useSetupDialog(props)
	const toggleMaximized = useClickAction(() => ctrl.toggleMaximized())
	const close = useClickAction(() => ctrl.requestClose('button'))

	const {
		rendered,
		tag,
		target,
		modal,
		attrs,
		aria,
		dataset,
		titleAria,
		bodyAria,
		closable,
		closeAria,
		maximizable,
		maximizeAria,
		maximized,
		dismiss_ownerAttribute,
	} = state

	if (!rendered) return null

	const Tag = tag as ElementType

	return (
		<Teleport to={target}>
			{modal ? <Backdrop state={state} /> : null}
			<Tag
				tabIndex={-1}
				{...toRootProps(
					ref,
					state,
					[attrs, aria, dataset, dismiss_ownerAttribute],
					forwardProps,
				)}
			>
				<h2 className="so-dialog__title" {...toAriaProps(titleAria)}>
					{renderSlot(props.title)}
				</h2>
				<div className="so-dialog__body" {...toAriaProps(bodyAria)}>
					{renderSlot(props.children)}
				</div>
				<div className="so-dialog__footer">{renderSlot(props.footer)}</div>
				{maximizable ? (
					<Button
						embedded="dialog.maximize"
						type="button"
						className="so-dialog__maximize"
						ref={toggleMaximized}
						{...toAriaProps(maximizeAria)}
					>
						{maximized
							? (renderSlot(props['restore-icon']) ?? (
									<Icon embedded="dialog.restore-icon" tag={RestoreIcon} />
								))
							: (renderSlot(props['maximize-icon']) ?? (
									<Icon embedded="dialog.maximize-icon" tag={MaximizeIcon} />
								))}
					</Button>
				) : null}
				{closable ? (
					<Button
						embedded="dialog.close"
						type="button"
						className="so-dialog__close"
						ref={close}
						{...toAriaProps(closeAria)}
					>
						{renderSlot(props['close-icon']) ?? (
							<Icon embedded="dialog.close-icon" tag={CloseIcon} />
						)}
					</Button>
				) : null}
			</Tag>
		</Teleport>
	)
}
