import type { ITabsItem } from '@soxa-ui/core'
import { TBasePlugin } from '../../../base'
import type { IPluginContext } from '../../../base'
import { TIdPlugin } from '../../id'

/** Read-only document relationship supplied before either side is serialized. */
export interface ITabsInitialLink {
	readonly tabId: string
	readonly panelId: string
	readonly tabFallbackId?: string
	readonly panelFallbackId?: string
}

export interface ITabsItemIdsOptions {
	readonly initial?: ITabsInitialLink
}

/**
 * The tab side of the tab-panel link: the tab's `id` and `aria-controls`, the
 * panel's `id`. The panel binding (`TTabsContentBindingExtension`) reads both
 * back from the tab, so the halves cannot diverge.
 *
 * An `id` the application gave either side (its `TIdPlugin`) wins over the
 * mount formula; an accepted panel hands its plugin over (`bindPanel`).
 * A prepared mount takes its ids from the initial source and, until accepted,
 * renders the link from its patch: the shared item may serve other requests.
 */
export class TTabsItemIdsPlugin extends TBasePlugin<ITabsItem> {
	private _tab: ITabsItem | null = null
	private _formula = ''
	private _fallbackPanelId = ''
	private _tabId = ''
	private _idPlugin: TIdPlugin | undefined
	private _panel: TIdPlugin | undefined

	/** Written on install, synchronously: the link is in the first and the server render. */
	override install(ctx: IPluginContext, options: ITabsItemIdsOptions = {}): void {
		super.install(ctx, options)

		this._tab = ctx.getInstance<ITabsItem>()
		this._idPlugin = ctx.get(TIdPlugin)

		this._tabId =
			options.initial?.tabFallbackId ?? options.initial?.tabId ?? ctx.createId('tab')
		this._formula = options.initial?.panelId ?? ctx.createId('panel')
		this._fallbackPanelId = options.initial?.panelFallbackId ?? this._formula

		this._write()

		// Accepted, a prepared mount moves its link from the patch into the model
		if (this.pluginMount) this._whenAccepted(this._write)

		this._idPlugin?.events.on('change:id', this._write)
	}

	/** Only accepted panels may bind; the last accepted panel replaces the previous one. */
	bindPanel(panel: TIdPlugin): void {
		if (this._panel === panel) return

		this._panel?.events.off('change:id', this._write)

		this._panel = panel
		this._formula = this._fallbackPanelId

		panel.events.on('change:id', this._write)

		this._write()
	}

	unbindPanel(panel: TIdPlugin): void {
		if (this._panel !== panel) return

		panel.events.off('change:id', this._write)
		this._panel = undefined

		this._write()
	}

	override destroy(): void {
		this._panel?.events.off('change:id', this._write)
		this._idPlugin?.events.off('change:id', this._write)

		this._panel = undefined
		this._idPlugin = undefined
		this._tab = null

		super.destroy()
	}

	private readonly _write = (): void => {
		const id = this._idPlugin?.id ?? this._tabId
		const controls = this._panel?.id ?? this._formula
		const mount = this.pluginMount

		if (mount && !mount.accepted) {
			mount.patch('aria', { id, 'aria-controls': controls })

			return
		}

		this._tab?.aria.add('id', id)
		this._tab?.aria.add('aria-controls', controls)
	}
}
