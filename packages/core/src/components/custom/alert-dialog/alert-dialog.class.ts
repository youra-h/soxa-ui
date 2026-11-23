import { TActionEvent } from '../../../common'
import { TDialog } from '../dialog'
import type { IDialogProps, TDialogPlacement } from '../dialog'
import type { TCloseReason } from '../../base/layer'
import type { IAlertDialog, IAlertDialogProps, TAlertDialogEvents } from './types'

/** A modal confirmation: the application performs the operation after hearing a choice. */
export default class TAlertDialog
	extends TDialog<IAlertDialogProps, TAlertDialogEvents>
	implements IAlertDialog
{
	static override baseClass = 'so-alert-dialog'

	static override defaultValues: typeof TDialog.defaultValues = {
		...TDialog.defaultValues,
		alert: true,
	}

	private _choosing = false

	constructor(props: Partial<IAlertDialogProps> = {}) {
		// Ignore unsupported input even for JavaScript consumers; the controller keeps these modes fixed.
		const dialogProps = {
			...props,
			modal: true,
			alert: true,
			placement: 'center',
			offset: undefined,
			maximized: false,
			maximizable: false,
		}

		super(dialogProps)
	}

	// Getter-only overrides retain the inherited state and reject writes through a Dialog reference.
	override get modal(): boolean {
		return super.modal
	}

	override get alert(): boolean {
		return super.alert
	}

	override get placement(): TDialogPlacement {
		return super.placement
	}

	override get offset(): number | string | undefined {
		return super.offset
	}

	override get maximized(): boolean {
		return super.maximized
	}

	override get maximizable(): boolean {
		return super.maximizable
	}

	/** Keep fixed Dialog modes out of assign() and serialized component props. */
	override getProps(): IAlertDialogProps {
		const props: IDialogProps = super.getProps()

		delete props.modal
		delete props.alert
		delete props.placement
		delete props.offset
		delete props.maximized
		delete props.maximizable

		return props
	}

	// Bound commands can be passed directly through scoped slots.
	readonly confirm = (): void => this._choose('confirm', 'button')
	readonly cancel = (): void => this._choose('cancel', 'button')

	override requestClose(reason: TCloseReason): void {
		if (reason === 'outside' || (reason === 'escape' && !this.dismissible)) return

		this._choose('cancel', reason)
	}

	private _choose(choice: 'confirm' | 'cancel', reason: TCloseReason): void {
		if (!this.visible || this._choosing) return

		this._choosing = true

		try {
			const event = new TActionEvent()

			this.events.emit(choice, event)

			if (!event.defaultPrevented) super.requestClose(reason)
		} finally {
			this._choosing = false
		}
	}
}
