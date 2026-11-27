import { TValueControl } from '../../../base/value-control'
import type { TDefaultValues } from '../../../base/component'
import type { IStepperItem, IStepperItemProps, TStepperItemEvents } from './types'

export class TStepperItem
	extends TValueControl<string | number, IStepperItemProps, TStepperItemEvents>
	implements IStepperItem
{
	static override baseClass = 'so-stepper-item'

	static defaultValues: typeof TValueControl.defaultValues &
		TDefaultValues<IStepperItemProps, 'text' | 'description' | 'completed' | 'error'> = {
		...TValueControl.defaultValues,
		value: '',
		text: '',
		description: '',
		completed: false,
		error: false,
		tag: 'li',
	}

	private _text: string
	private _description: string
	private _completed: boolean
	private _error: boolean

	constructor(props: Partial<IStepperItemProps> = {}) {
		super(props)

		const defaults = (new.target as typeof TStepperItem).defaultValues
		this._text = props.text ?? defaults.text
		this._description = props.description ?? defaults.description
		this._completed = props.completed ?? defaults.completed
		this._error = props.error ?? defaults.error
		this._dataset.add('completed', this._completed)
		this._dataset.add('error', this._error)
		this._aria.add('aria-invalid', this._error ? 'true' : undefined)
	}

	protected override get _ariaTag(): string {
		return 'button'
	}

	get text(): string {
		return this._text
	}

	set text(value: string) {
		const oldValue = this._text
		if (value === oldValue) return

		this._text = value
		this.events.emit('change:text', { oldValue, newValue: value })
	}

	get description(): string {
		return this._description
	}

	set description(value: string) {
		const oldValue = this._description
		if (value === oldValue) return

		this._description = value
		this.events.emit('change:description', { oldValue, newValue: value })
	}

	get completed(): boolean {
		return this._completed
	}

	set completed(value: boolean) {
		const oldValue = this._completed
		if (value === oldValue) return

		this._completed = value
		this._dataset.add('completed', value)
		this.events.emit('change:completed', { oldValue, newValue: value })
	}

	get error(): boolean {
		return this._error
	}

	set error(value: boolean) {
		const oldValue = this._error
		if (value === oldValue) return

		this._error = value
		this._dataset.add('error', value)
		this._aria.add('aria-invalid', value ? 'true' : undefined)
		this.events.emit('change:error', { oldValue, newValue: value })
	}

	override getProps(): IStepperItemProps {
		return {
			...super.getProps(),
			text: this.text,
			description: this.description,
			completed: this.completed,
			error: this.error,
		}
	}
}
