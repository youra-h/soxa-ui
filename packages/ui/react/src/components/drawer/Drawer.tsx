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
import { useSetupDrawer } from './setup.component'
import type { DrawerProps } from './base.component'

const CloseIcon = roleIcon('close')

/**
 * Drawer — выезжающая панель: подложка и панель, как у Dialog; `contained`
 * выключает телепорт (AGENTS.md (React), «Teleport»).
 */
export function Drawer(props: DrawerProps): ReactElement | null {
	const { ctrl, ref, forwardProps, state } = useSetupDrawer(props)
	const close = useClickAction(() => ctrl.requestClose('button'))

	const {
		rendered,
		tag,
		target,
		contained,
		attrs,
		aria,
		dataset,
		titleAria,
		closable,
		closeAria,
		handleRendered,
		dismiss_ownerAttribute,
	} = state

	if (!rendered) return null

	const Tag = tag as ElementType

	return (
		<Teleport to={target} disabled={contained}>
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
				{handleRendered ? <div className="so-drawer__handle" aria-hidden="true" /> : null}
				<h2 className="so-drawer__title" {...toAriaProps(titleAria)}>
					{renderSlot(props.title)}
				</h2>
				<div className="so-drawer__body">{renderSlot(props.children)}</div>
				<div className="so-drawer__footer">{renderSlot(props.footer)}</div>
				{closable ? (
					<Button
						embedded="drawer.close"
						type="button"
						className="so-drawer__close"
						ref={close}
						{...toAriaProps(closeAria)}
					>
						{renderSlot(props['close-icon']) ?? (
							<Icon embedded="drawer.close-icon" tag={CloseIcon} />
						)}
					</Button>
				) : null}
			</Tag>
		</Teleport>
	)
}
