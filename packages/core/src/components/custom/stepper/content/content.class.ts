import { TComponentView } from '../../../base/component-view'
import type {
	IComponentView,
	IComponentViewProps,
	TComponentViewEvents,
} from '../../../base/component-view'
import type { TDefaultValues } from '../../../base/component'
import type { TValuePayload } from '../../../../common'

export interface IStepperContentProps extends IComponentViewProps {
	value?: string | number
}

export type TStepperContentEvents = TComponentViewEvents & {
	'change:value': (payload: TValuePayload<string | number>) => void
	'change:active': (payload: TValuePayload<boolean>) => void
}

export interface IStepperContent extends IComponentView<
	IStepperContentProps,
	TStepperContentEvents
> {
	value: string | number
	readonly active: boolean
}

export class TStepperContent
	extends TComponentView<IStepperContentProps, TStepperContentEvents>
	implements IStepperContent
{
	static override baseClass = 'so-stepper-content'

	static defaultValues: typeof TComponentView.defaultValues &
		TDefaultValues<IStepperContentProps, 'value'> = {
		...TComponentView.defaultValues,
		value: '',
	}

	private _value: string | number
	private _active = false

	constructor(props: Partial<IStepperContentProps> = {}) {
		super(props)

		this._value = props.value ?? (new.target as typeof TStepperContent).defaultValues.value
	}

	get value(): string | number {
		return this._value
	}

	set value(value: string | number) {
		const oldValue = this._value
		if (value === oldValue) return

		this._value = value
		this.events.emit('change:value', { oldValue, newValue: value })
	}

	get active(): boolean {
		return this._active
	}

	setActive(active: boolean): void {
		const oldValue = this._active
		if (active === oldValue) return

		this._active = active
		this.events.emit('change:active', { oldValue, newValue: active })
	}

	override getProps(): IStepperContentProps {
		return { ...super.getProps(), value: this.value }
	}
}
