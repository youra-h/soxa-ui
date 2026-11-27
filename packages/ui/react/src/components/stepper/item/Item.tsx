import type { ReactElement } from 'react'
import { hasIcon } from '@soxa-ui/setup'
import {
	renderSlot,
	roleIcon,
	toAriaProps,
	toControlAttrs,
	toRootForward,
	toRootProps,
	useClickAction,
	withRenderBoundary,
} from '../../../adapter'
import { Icon } from '../../icon'
import { useSetupStepperItem } from './setup.component'
import type { StepperItemAttributes, StepperItemProps } from './base.component'

export const StepperItem = withRenderBoundary(function StepperItem(
	props: StepperItemProps,
): ReactElement | null {
	const { ref, forwardProps, state, activate } = useSetupStepperItem(props)
	const click = useClickAction(() => {
		if (state.stepper_interactive) activate()
	})

	if (!state.rendered) return null

	const Trigger = state.stepper_interactive ? 'button' : 'span'
	const scope = {
		value: state.value ?? '',
		number: state.stepper_number ?? 1,
		active: state.active ?? false,
		completed: state.completed ?? false,
		error: state.error ?? false,
	}
	const leading = renderSlot(props.leading, scope)
	const subtitle = renderSlot(props.subtitle, scope) ?? state.description
	const details = renderSlot(props.details, scope)
	const icon = scope.active
		? hasIcon('step')
			? 'step'
			: 'arrowRight'
		: scope.error
			? 'error'
			: scope.completed
				? 'check'
				: undefined

	return (
		<li {...toRootProps(ref, state, [state.dataset], toRootForward(forwardProps))}>
			{leading != null && <div className="so-stepper-item__leading">{leading}</div>}
			<Trigger
				className="so-stepper-item__trigger"
				{...toAriaProps(state.aria)}
				{...toControlAttrs<StepperItemAttributes>(forwardProps)}
				ref={click}
				type={state.stepper_interactive ? 'button' : undefined}
				disabled={
					state.stepper_interactive && !state.stepper_canActivate ? true : undefined
				}
			>
				<span className="so-stepper-item__indicator" aria-hidden="true">
					{renderSlot(props.indicator, scope) ??
						(icon ? (
							<Icon
								embedded={
									scope.active ? 'stepper.step-icon' : 'stepper.status-icon'
								}
								className={scope.active ? 'so-stepper-item__step-icon' : undefined}
								tag={roleIcon(icon)}
								size={state.size}
							/>
						) : (
							scope.number
						))}
				</span>
				<span className="so-stepper-item__body">
					<span className="so-stepper-item__label">
						{renderSlot(props.children, scope) ?? state.text}
					</span>
					{subtitle && <span className="so-stepper-item__description">{subtitle}</span>}
				</span>
			</Trigger>
			{state.stepper_hasSeparator && (
				<span className="so-stepper-item__separator" aria-hidden="true">
					{renderSlot(props.separator, scope)}
				</span>
			)}
			{details != null && <div className="so-stepper-item__details">{details}</div>}
		</li>
	)
})
