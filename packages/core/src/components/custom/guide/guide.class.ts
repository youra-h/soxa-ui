import { createEngineActivation } from '../../base/collection'
import { TCloseEvent, type TCloseReason } from '../../base/layer'
import { TFrame } from '../frame'
import TBackdrop from '../../base/modal-layer/backdrop.class'
import type { TBackdropView } from '../../base/modal-layer'
import type { IGuide, IGuideProps, IGuideStep, TGuideEvents } from './types'

type TItem = { id: string; step: IGuideStep }

export class TGuide extends TFrame<IGuideProps, TGuideEvents> implements IGuide {
	static override baseClass = 'so-guide'
	static override defaultValues = {
		...TFrame.defaultValues,
		width: 'min(22rem, calc(100% - 2rem))',
		height: 'fit-content',
		steps: undefined,
		backdrop: undefined,
		closable: true,
	}

	private readonly _engine = createEngineActivation<TItem>()
	private readonly _backdrop: TBackdrop
	private _closable: boolean

	constructor(props: IGuideProps = {}) {
		super({ ...props, visible: false })

		this._backdrop = new TBackdrop(props.backdrop)
		this._closable = props.closable ?? TGuide.defaultValues.closable

		this._extensions.batch.trackBy = (item) => item.id
		this._aria.add('role', 'dialog')
		this.steps = props.steps ?? []

		if (props.visible) this.start()
	}

	private get _extensions() {
		return this._engine.extensions
	}

	get steps(): readonly IGuideStep[] {
		return this._extensions.batch.items.map(({ step }) => step)
	}

	set steps(input: readonly IGuideStep[] | undefined) {
		const value = input ?? []
		const ids = new Set(value.map(({ id }) => id))
		if (ids.size !== value.length) throw new Error('Guide step IDs must be unique')

		const oldSteps = this.steps
		if (
			value.length === oldSteps.length &&
			value.every((step, index) => step === oldSteps[index])
		)
			return
		if (!value.length && this.visible) {
			this.close()
			if (this.visible) return
		}

		const oldStep = this.step
		const oldIndex = this.stepNumber - 1
		const { batch, plain, activation, order } = this._extensions

		this._engine.batch(() => {
			batch.update(value.map((step) => ({ id: step.id, step })))

			const byId = new Map(batch.items.map((item) => [item.id, item]))

			for (const [index, { id }] of value.entries()) {
				const item = byId.get(id)
				if (item && order.getItemOrder(item) !== index) plain.move(item, index)
			}
		})

		if (this.visible && !activation.activeItem) {
			const fallback = batch.items[Math.min(oldIndex, batch.total - 1)]
			if (fallback) activation.activate(fallback)
			else this.close()
		}

		this._publishStep(oldStep)
		this.events.emit('change:steps', { oldValue: oldSteps, newValue: this.steps })
	}

	get step(): IGuideStep | undefined {
		return this._extensions.activation.activeItem?.step
	}

	get stepNumber(): number {
		const { activation, order } = this._extensions
		const item = activation.activeItem

		return item ? order.getItemOrder(item) + 1 : 0
	}

	get stepCount(): number {
		return this._extensions.batch.total
	}

	get modal(): boolean {
		return this.step?.mode === 'modal'
	}

	get backdrop(): TBackdropView | undefined {
		return this._backdrop.view
	}

	set backdrop(value: TBackdropView | undefined) {
		const oldValue = this.backdrop
		if (oldValue === value) return

		this._backdrop.view = value
		this.events.emit('change:backdrop', { oldValue, newValue: value })
	}

	get backdropClasses(): string[] {
		return this._backdrop.classes.toArray()
	}

	get backdropRendered(): boolean {
		return this.modal || this.backdrop !== undefined
	}

	get closable(): boolean {
		return this._closable
	}

	set closable(value: boolean) {
		const oldValue = this._closable
		if (value === oldValue) return

		this._closable = value
		this.events.emit('change:closable', { oldValue, newValue: value })
	}

	override show(): void {
		this.start()
	}

	start(id?: string): boolean {
		if (this.visible) return id === undefined || this.goTo(id)

		const item =
			id === undefined
				? this._extensions.batch.items[0]
				: this._extensions.batch.find((entry) => entry.id === id)
		if (!item || !this._activate(item) || !this.step) return false

		super.show()
		if (!this.visible) this._reset()

		return this.visible
	}

	next(): boolean {
		if (!this.visible) return false

		const next = this._extensions.batch.items[this.stepNumber]
		if (next) return this._activate(next)

		this.close()
		if (this.visible) return false

		this.events.emit('complete')
		return true
	}

	previous(): boolean {
		const previous = this._extensions.batch.items[this.stepNumber - 2]

		return this.visible && previous !== undefined && this._activate(previous)
	}

	goTo(id: string): boolean {
		const item = this._extensions.batch.find((entry) => entry.id === id)

		return this.visible && item !== undefined && this._activate(item)
	}

	close(): void {
		this.hide()
	}

	requestClose(reason: TCloseReason): void {
		if (!this.visible) return

		const event = new TCloseEvent(reason)
		this.events.emit('close:before', event)

		if (!event.defaultPrevented) this.close()
	}

	override getProps(): IGuideProps {
		return {
			...super.getProps(),
			steps: this.steps,
			backdrop: this.backdrop,
			closable: this.closable,
		}
	}

	protected override afterHide(): void {
		super.afterHide()
		if (!this.visible) this._reset()
	}

	private _activate(item: TItem): boolean {
		const oldStep = this.step
		const active = this._extensions.activation.activate(item)
		if (active) this._publishStep(oldStep)

		return active
	}

	private _reset(): void {
		const oldStep = this.step
		this._extensions.activation.reset()
		this._publishStep(oldStep)
	}

	private _publishStep(oldStep: IGuideStep | undefined): void {
		const step = this.step
		if (step === oldStep) return

		const oldModal = oldStep?.mode === 'modal'
		this._aria.add('aria-label', step?.title ?? null)
		this._aria.add('aria-modal', this.modal ? 'true' : null)

		if (oldModal !== this.modal) {
			this.events.emit('change:modal', { oldValue: oldModal, newValue: this.modal })
		}

		this.events.emit('change:step', { oldValue: oldStep, newValue: step })
	}
}
