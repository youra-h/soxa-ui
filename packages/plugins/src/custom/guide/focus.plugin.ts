import type { IGuide } from '@soxa-ui/core'
import type { IPluginContext } from '../../base'
import { trapTab } from '../../utils'
import { TOverlayFocusPlugin, type IOverlayOpenOptions } from '../overlay'

export class TGuideFocusPlugin extends TOverlayFocusPlugin {
	private _guide: IGuide | null = null

	override install(ctx: IPluginContext, options?: IOverlayOpenOptions): void {
		this._guide = ctx.getInstance<IGuide>()
		super.install(ctx, options)

		this._listenTo(this._guide?.events, 'change:modal', ({ newValue }) => {
			if (newValue && this._guide?.visible) this._focusPanel()
		})
	}

	protected override _panelFallback(root: Element): Element {
		return root
	}

	protected override _onTab(event: KeyboardEvent): void {
		if (this._panel && this._guide?.modal) trapTab(event, this._panel)
	}

	override destroy(): void {
		this._guide = null
		super.destroy()
	}
}
