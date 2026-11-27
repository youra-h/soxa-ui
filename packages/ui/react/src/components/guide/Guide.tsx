import type { ElementType, ReactElement } from 'react'
import { Teleport, toReactStyle, toRootProps, useClickAction, roleIcon } from '../../adapter'
import { Backdrop } from '../../adapter/backdrop/Backdrop'
import { Button } from '../button'
import { Icon } from '../icon'
import { useSetupGuide } from './setup.component'
import type { GuideProps } from './base.component'

const CloseIcon = roleIcon('close')

export function Guide(props: GuideProps): ReactElement | null {
	const { ctrl, ref, forwardProps, state } = useSetupGuide(props)
	const previous = useClickAction(() => ctrl.previous())
	const next = useClickAction(() => ctrl.next())
	const close = useClickAction(() => ctrl.requestClose('button'))
	const {
		tag,
		rendered,
		target,
		visible,
		backdropRendered,
		step,
		stepNumber,
		attrs,
		aria,
		dataset,
	} = state
	const spotlight = state.position_spotlight
	const labels = state.names_labels

	if (!rendered) return null

	const Tag = tag as ElementType

	return (
		<Teleport to={target}>
			{visible && (backdropRendered || spotlight) ? (
				<div
					className="so-guide__decoration"
					style={toReactStyle(state.position_layer)}
					aria-hidden="true"
				>
					{backdropRendered ? (
						<Backdrop
							state={{
								backdropClasses: state.backdropClasses,
								layout_backdropStyles: state.position_backdrop,
								visible: true,
							}}
						/>
					) : null}
					{spotlight ? (
						<div className="so-guide__spotlight" style={toReactStyle(spotlight)} />
					) : null}
				</div>
			) : null}
			<Tag tabIndex={-1} {...toRootProps(ref, state, [attrs, aria, dataset], forwardProps)}>
				{step ? (
					<>
						<div className="so-guide__content" aria-live="polite">
							<p className="so-guide__progress">{labels?.progress}</p>
							<h2 className="so-guide__title">{step.title}</h2>
							{step.description ? (
								<p className="so-guide__description">{step.description}</p>
							) : null}
						</div>
						<div className="so-guide__actions">
							<Button
								type="button"
								embedded="guide.previous"
								disabled={(stepNumber ?? 0) <= 1}
								ref={previous}
							>
								{labels?.previous}
							</Button>
							<Button type="button" embedded="guide.next" ref={next}>
								{labels?.forward}
							</Button>
						</div>
						{state.closable ? (
							<Button
								type="button"
								embedded="guide.close"
								className="so-guide__close"
								aria_label={labels?.close}
								ref={close}
							>
								<Icon embedded="guide.close-icon" tag={CloseIcon} />
							</Button>
						) : null}
					</>
				) : null}
			</Tag>
		</Teleport>
	)
}
