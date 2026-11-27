import type {
	IValueControl,
	IValueControlProps,
	TValueControlEvents,
} from '../../../base/value-control'
import type { TValuePayload } from '../../../../common'

export interface IStepperItemProps extends IValueControlProps<string | number> {
	text?: string
	description?: string
	completed?: boolean
	error?: boolean
}

export type TStepperItemEvents = TValueControlEvents<string | number> & {
	'change:text': (payload: TValuePayload<string>) => void
	'change:description': (payload: TValuePayload<string>) => void
	'change:completed': (payload: TValuePayload<boolean>) => void
	'change:error': (payload: TValuePayload<boolean>) => void
}

export interface IStepperItem extends IValueControl<
	string | number,
	IStepperItemProps,
	TStepperItemEvents
> {
	text: string
	description: string
	completed: boolean
	error: boolean
}
