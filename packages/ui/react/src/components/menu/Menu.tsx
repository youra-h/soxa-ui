import type { ElementType, ReactElement } from 'react'
import { Elevate, hasSlot, renderSlot, toAriaProps, toPartClass, toRootProps } from '../../adapter'
import { Frame } from '../frame'
import { drawItems } from './submenu/Submenu'
import { useSetupMenu } from './setup.component'
import type { MenuProps } from './base.component'

/**
 * Menu — меню действий у кнопки (APG Menu Button) или контекстное меню области.
 * docs/agents/patterns.md, «Готовые паттерны» (Menu).
 */
export function Menu(props: MenuProps): ReactElement | null {
	const { ref, forwardProps, state, rootElement, layer } = useSetupMenu(props)

	const {
		rendered,
		tag,
		attrs,
		aria,
		dataset,
		open,
		point,
		placement,
		triggerAria,
		triggerDataset,
		panelClasses,
		contentRendered,
		dismiss_ownerAttribute,
	} = state

	if (!rendered) return null

	const Tag = tag as ElementType

	return (
		<Tag {...toRootProps(ref, state, [attrs, dataset], forwardProps)}>
			<Elevate layer={layer}>
				{renderSlot(props.trigger, {
					triggerAria:
						!rootElement && triggerAria?.['aria-controls']
							? { ...triggerAria, 'aria-controls': null }
							: (triggerAria ?? {}),
					triggerDataset: triggerDataset ?? {},
				})}
				<Frame
					embedded="menu.frame"
					className={toPartClass(panelClasses)}
					tabIndex={-1}
					visible={state.visible && open}
					strategy="fixed"
					anchor_anchor={rootElement}
					anchor_point={point}
					anchor_placement={placement}
					anchor_offset={4}
					{...toAriaProps(aria)}
					{...toAriaProps(dismiss_ownerAttribute)}
				>
					{/* Items from the panel's first opening on (`contentRendered`) */}
					<div className="so-menu__list">
						{!contentRendered
							? null
							: hasSlot(props.children)
								? renderSlot(props.children)
								: drawItems(state, props)}
					</div>
				</Frame>
			</Elevate>
		</Tag>
	)
}
