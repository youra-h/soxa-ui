import type { IDatePicker } from '@soxa-ui/core'
import { TBasePlugin } from '../../../base'
import type { IPluginContext } from '../../../base'
import { TPopupControls } from '../../overlay/popup-controls'

/** Keeps deterministic popup IDs and only references a bound popup. */
export class TDatePickerIdsPlugin extends TBasePlugin {
	private _controls: TPopupControls | undefined

	/** Internal Frame bundle hookup, exposed only as a protected descriptor output. */
	readonly bindPanel = (bundle: unknown): void => this._controls?.bindPanel(bundle)

	override destroy(): void {
		this._controls?.destroy()
		super.destroy()
	}

	override install(ctx: IPluginContext): void {
		super.install(ctx)

		const picker = ctx.getInstance<IDatePicker>()

		if (!picker) return

		const panelId = ctx.createId('panel')

		picker.panelAria.add('id', panelId)
		this._controls = new TPopupControls(
			picker.triggerAria,
			panelId,
			() => picker.open && picker.visible,
		)
		const sync = (): void => this._controls?.sync()

		this._listenTo(picker.events, 'change:open', sync)
		this._listenTo(picker.events, 'change:visible', sync)
	}
}
