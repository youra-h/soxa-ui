import type { JSX } from 'solid-js'
import { hasIcon } from '@soxa-ui/setup'
import {
	ResolvedSlot,
	Root,
	clickAction,
	createRootProps,
	resolveSlot,
	roleIcon,
	toControlAttrs,
	toRootForward,
} from '../../../adapter'
import { Show } from '../../../adapter/runtime/flow'
import { Icon } from '../../icon'
import { setupStepperItem } from './setup.component'
import type { StepperItemAttributes, StepperItemProps } from './base.component'

export function StepperItem(props: StepperItemProps): JSX.Element {
	const binding = setupStepperItem(props)
	const state = binding.state
	const root = createRootProps(() => ({
		state,
		sets: [state.dataset],
		forward: toRootForward(binding.forwardProps()),
	}))
	const trigger = () => ({
		...state.aria,
		...toControlAttrs<StepperItemAttributes>(binding.forwardProps()),
		class: 'so-stepper-item__trigger',
		style: {},
		type: state.stepper_interactive ? 'button' : undefined,
		disabled: state.stepper_interactive && !state.stepper_canActivate ? true : undefined,
	})
	const scope = () => ({
		value: state.value ?? '',
		number: state.stepper_number ?? 1,
		active: state.active ?? false,
		completed: state.completed ?? false,
		error: state.error ?? false,
	})
	const label = resolveSlot(() => props.children, scope)
	const description = resolveSlot(() => props.subtitle, scope)
	const separator = resolveSlot(() => props.separator, scope)
	const activate = clickAction(() => {
		if (state.stepper_interactive) binding.activate()
	})
	const stepIcon = roleIcon(hasIcon('step') ? 'step' : 'arrowRight')
	const errorIcon = roleIcon('error')
	const checkIcon = roleIcon('check')

	return (
		<Show when={state.rendered}>
			<li {...root()} ref={binding.ref}>
				<ResolvedSlot content={props.leading} scope={scope}>
					{(leading) => <div class="so-stepper-item__leading">{leading()}</div>}
				</ResolvedSlot>
				<Root
					tag={state.stepper_interactive ? 'button' : 'span'}
					attributes={trigger}
					ref={activate}
				>
					<span class="so-stepper-item__indicator" aria-hidden="true">
						<ResolvedSlot
							content={props.indicator}
							scope={scope}
							fallback={
								<Show
									when={state.active || state.error || state.completed}
									fallback={state.stepper_number}
								>
									<Icon
										embedded={
											state.active
												? 'stepper.step-icon'
												: 'stepper.status-icon'
										}
										class={
											state.active ? 'so-stepper-item__step-icon' : undefined
										}
										tag={
											state.active
												? stepIcon
												: state.error
													? errorIcon
													: checkIcon
										}
										size={state.size}
									/>
								</Show>
							}
						/>
					</span>
					<span class="so-stepper-item__body">
						<span class="so-stepper-item__label">{label() ?? state.text}</span>
						<Show when={description() || state.description}>
							<span class="so-stepper-item__description">
								{description() ?? state.description}
							</span>
						</Show>
					</span>
				</Root>
				<Show when={state.stepper_hasSeparator}>
					<span class="so-stepper-item__separator" aria-hidden="true">
						{separator()}
					</span>
				</Show>
				<ResolvedSlot content={props.details} scope={scope}>
					{(details) => <div class="so-stepper-item__details">{details()}</div>}
				</ResolvedSlot>
			</li>
		</Show>
	)
}
