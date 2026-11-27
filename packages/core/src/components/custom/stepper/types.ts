import type {
	IValueControl,
	IValueControlProps,
	TValueControlEvents,
} from '../../base/value-control'
import type { TOrientation, TValuePayload } from '../../../common'
import type { IStepperCollectionProps } from './collection/types'

export type TStepperValue = string | number | undefined

export interface IStepperProps extends IValueControlProps<TStepperValue>, IStepperCollectionProps {
	/** Constrain forward navigation to the first incomplete step. */
	linear?: boolean
	/** Whether step headers are buttons. Explicit Previous and Next actions still work. */
	interactive?: boolean
	orientation?: TOrientation
}

export type TStepperEvents = TValueControlEvents<TStepperValue> & {
	'change:linear': (payload: TValuePayload<boolean>) => void
	'change:interactive': (payload: TValuePayload<boolean>) => void
	'change:orientation': (payload: TValuePayload<TOrientation>) => void
}

export interface IStepper extends IValueControl<TStepperValue, IStepperProps, TStepperEvents> {
	linear: boolean
	interactive: boolean
	orientation: TOrientation
}
