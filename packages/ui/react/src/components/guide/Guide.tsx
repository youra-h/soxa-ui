import type { ElementType, ReactElement } from 'react'
import { Teleport, toReactStyle, toRootProps, useClickAction } from '../../adapter'
import { Button } from '../button'
import { useSetupGuide } from './setup.component'
import type { GuideProps } from './base.component'

export function Guide(props: GuideProps): ReactElement | null {
	const { ctrl, ref, forwardProps, state } = useSetupGuide(props)
	const previous = useClickAction(() => ctrl.previous())
	const next = useClickAction(() => ctrl.next())
	const close = useClickAction(() => ctrl.requestClose('button'))
	const { tag, rendered, target, visible, modal, step, stepNumber, attrs, aria, dataset } = state
	const spotlight = state.position_spotlight
	const labels = state.names_labels

	if (!rendered) return null

	const Tag = tag as ElementType

	return (
		<Teleport to={target}>
			{visible && (modal || spotlight) ? (
				<div
					className="so-guide__decoration"
					style={toReactStyle(state.position_layer)}
					aria-hidden="true"
				>
					{modal ? <div className="so-guide__backdrop" /> : null}
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
							<Button type="button" embedded="guide.close" ref={close}>
								{labels?.close}
							</Button>
						</div>
					</>
				) : null}
			</Tag>
		</Teleport>
	)
}
