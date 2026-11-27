import type { JSX } from 'solid-js'
import { Elevate, ResolvedSlot, Root, createRootProps, resolveSlot } from '../../adapter'
import { For, Show } from '../../adapter/runtime/flow'
import { StepperItem } from './item'
import { setupStepper } from './setup.component'
import type { StepperProps } from './base.component'

export function Stepper(props: StepperProps): JSX.Element {
	const binding = setupStepper(props)
	const state = binding.state
	const root = createRootProps(() => ({
		state,
		sets: [state.attrs, state.dataset, state.aria],
		forward: binding.forwardProps(),
	}))

	const content = resolveSlot(
		() => props.content,
		() => ({
			value: state.value,
			next: binding.next,
			previous: binding.previous,
			canNext: state.stepper_canNext ?? false,
			canPrevious: state.stepper_canPrevious ?? false,
		}),
	)

	return (
		<Show when={state.rendered}>
			<Root tag={state.tag} attributes={root} ref={binding.ref}>
				<Elevate layer={binding.layer}>
					<ol class="so-stepper__list" role="list">
						<ResolvedSlot
							content={props.children}
							fallback={
								<For each={state.shown}>
									{(item) => (
										<ResolvedSlot
											content={props.item}
											scope={() => ({ item })}
											fallback={<StepperItem ctrl={item} />}
										/>
									)}
								</For>
							}
						/>
					</ol>
					{content()}
				</Elevate>
			</Root>
		</Show>
	)
}
