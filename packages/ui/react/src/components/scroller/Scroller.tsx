import type { ElementType, ReactElement } from 'react'
import { renderSlot, roleIcon, toAriaProps, toRootProps } from '../../adapter'
import { Button } from '../button'
import { Icon } from '../icon'
import { useSetupScroller } from './setup.component'
import type { ScrollerProps } from './base.component'

/** Одна иконка на обе кнопки: стрелку «назад» зеркалит тема. */
const Arrow = roleIcon('arrowRight')

// Firefox can restore disabled before hydration. Pass its button attribute through as HTML.
const arrowAttributes = { autoComplete: 'off' }

/**
 * Scroller — лента в одну строку: кнопки «назад» и «вперёд» вокруг вьюпорта.
 * `viewportAria` — после `tabIndex`: ряд с roving tabindex сам решает, кому быть остановкой.
 */
export function Scroller(props: ScrollerProps): ReactElement | null {
	const { ref, forwardProps, state } = useSetupScroller(props)

	const {
		rendered,
		tag,
		attrs,
		aria,
		dataset,
		size,
		prevDisabled,
		nextDisabled,
		prevAria,
		nextAria,
		viewportTabIndex,
		viewportAria,
	} = state

	if (!rendered) return null

	const Tag = tag as ElementType

	return (
		<Tag {...toRootProps(ref, state, [attrs, aria, dataset], forwardProps)}>
			<Button
				embedded="scroller.prev"
				type="button"
				{...arrowAttributes}
				className="so-scroller__prev"
				size={size}
				disabled={prevDisabled}
				{...toAriaProps(prevAria)}
			>
				{renderSlot(props['prev-icon']) ?? (
					<Icon embedded="scroller.prev-icon" tag={Arrow} size={size} />
				)}
			</Button>

			<div
				className="so-scroller__viewport"
				tabIndex={viewportTabIndex}
				{...toAriaProps(viewportAria)}
			>
				{renderSlot(props.children)}
			</div>

			<Button
				embedded="scroller.next"
				type="button"
				{...arrowAttributes}
				className="so-scroller__next"
				size={size}
				disabled={nextDisabled}
				{...toAriaProps(nextAria)}
			>
				{renderSlot(props['next-icon']) ?? (
					<Icon embedded="scroller.next-icon" tag={Arrow} size={size} />
				)}
			</Button>
		</Tag>
	)
}
