import type { JSX } from 'solid-js'
import { Root, Teleport, clickAction, createRootProps } from '../../adapter'
import { Show } from '../../adapter/runtime/flow'
import { Button } from '../button'
import { setupGuide } from './setup.component'
import type { GuideProps } from './base.component'

export function Guide(props: GuideProps): JSX.Element {
	const binding = setupGuide(props)
	const { state, ctrl } = binding
	const root = createRootProps(() => ({
		state,
		sets: [state.attrs, state.aria, state.dataset],
		forward: binding.forwardProps(),
	}))
	const previous = clickAction(() => ctrl.previous())
	const next = clickAction(() => ctrl.next())
	const close = clickAction(() => ctrl.requestClose('button'))

	return (
		<Show when={state.rendered}>
			<Teleport to={state.target}>
				<Show when={state.visible && (state.modal || state.position_spotlight)}>
					<div
						class="so-guide__decoration"
						style={state.position_layer}
						aria-hidden="true"
					>
						<Show when={state.modal}>
							<div class="so-guide__backdrop" />
						</Show>
						<Show when={state.position_spotlight}>
							{(spotlight) => <div class="so-guide__spotlight" style={spotlight()} />}
						</Show>
					</div>
				</Show>
				<Root
					tag={state.tag}
					attributes={() => ({ tabindex: '-1', ...root() })}
					ref={binding.ref}
				>
					<Show when={state.step}>
						{(step) => (
							<>
								<div class="so-guide__content" aria-live="polite">
									<p class="so-guide__progress">{state.names_labels?.progress}</p>
									<h2 class="so-guide__title">{step().title}</h2>
									<Show when={step().description}>
										<p class="so-guide__description">{step().description}</p>
									</Show>
								</div>
								<div class="so-guide__actions">
									<Button
										type="button"
										embedded="guide.previous"
										disabled={(state.stepNumber ?? 0) <= 1}
										ref={previous}
									>
										{state.names_labels?.previous}
									</Button>
									<Button type="button" embedded="guide.next" ref={next}>
										{state.names_labels?.forward}
									</Button>
									<Button type="button" embedded="guide.close" ref={close}>
										{state.names_labels?.close}
									</Button>
								</div>
							</>
						)}
					</Show>
				</Root>
			</Teleport>
		</Show>
	)
}
