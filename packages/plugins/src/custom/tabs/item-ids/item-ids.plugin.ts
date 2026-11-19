import type { ITabsItem } from '@soxa-ui/core'
import { TBasePlugin, TMountSnapshot } from '../../../base'
import type { IMountSnapshotPort, IPluginContext } from '../../../base'
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
 * TTabsItemIdsPlugin — the tab's side of the tab ↔ panel link in the document.
 *
 * It writes the tab's `id` and `aria-controls`, the `id` of its panel; nothing
 * else writes them. The panel keeps no formula of its own: the panel binding
 * (`TTabsContentBindingExtension`) takes the tab's `id` into its
 * `aria-labelledby` and its own `id` from `aria-controls`, unless it has one,
 * and follows every change.
 *
 * An `id` given by the application wins over the mount's on both sides. The
 * tab's own (`TIdPlugin` of the tab) goes on the tab's row. The panel's own
 * reaches the tab from the binding: an accepted panel hands its `TIdPlugin`
 * over (`bindPanel`), and `aria-controls` follows it until the panel unbinds
 * (`unbindPanel`).
 *
 * Without them the `id` comes from the mount, not the instance: only the
 * document needs it, and it must match on the server and in the browser. It
 * is written on install, synchronously, so the first (server) render has the
 * link. A panel's own `id` comes later, with the panel's entry, so server
 * markup may point to the formula until hydration. The cost: `aria-controls`
 * is there even without `Tabs.Content`, which the tabs pattern requires.
 *
 * A prepared mount (`initial`) gets both ids before either side renders and
 * keeps them in its own snapshot (`link`) instead of the shared model's `aria`.
 */
export class TTabsItemIdsPlugin extends TBasePlugin<ITabsItem> {
	private _tab: ITabsItem | null = null
	private _idPlugin: TIdPlugin | undefined
	/** `TIdPlugin` of the bound panel: the `id` the application gave it. */
	private _panel: TIdPlugin | undefined
	private _tabId = ''
	/** The panel's `id` while the panel has none of its own. */
	private _formula = ''
	/** The formula once a bound panel replaced a declared panel `id`. */
	private _fallbackPanelId = ''
	/** The prepared mount's link; an ordinary mount writes the tab's `aria`. */
	private _link: TMountSnapshot | undefined

	/** The link of a prepared mount, read by its panel and its merged state. */
	get link(): IMountSnapshotPort | undefined {
		return this._link
	}

	override install(ctx: IPluginContext, options: ITabsItemIdsOptions = {}): void {
		super.install(ctx, options)

		const { initial } = options

		this._tab = ctx.getInstance<ITabsItem>()
		this._idPlugin = ctx.get(TIdPlugin)
		this._tabId = initial?.tabFallbackId ?? initial?.tabId ?? ctx.createId('tab')
		this._formula = initial?.panelId ?? ctx.createId('panel')
		this._fallbackPanelId = initial?.panelFallbackId ?? this._formula

		if (initial) {
			this._link = new TMountSnapshot(
				Object.freeze({ id: initial.tabId, 'aria-controls': initial.panelId }),
			)
		} else {
			this._write()
		}

		this._idPlugin?.events.on('change:id', this._write)
	}

	/** Only accepted panels bind; the last accepted panel replaces the previous one. */
	bindPanel(panel: TIdPlugin): void {
		if (this._panel === panel) return

		this._panel?.events.off('change:id', this._write)

		this._panel = panel
		this._formula = this._fallbackPanelId

		panel.events.on('change:id', this._write)

		this._write()
	}

	/** Another panel's unbinding does not touch this one: a new mount may be accepted first. */
	unbindPanel(panel: TIdPlugin): void {
		if (this._panel !== panel) return

		panel.events.off('change:id', this._write)
		this._panel = undefined

		this._write()
	}

	/** The panel's `TIdPlugin` outlives the tab's mount: a data tab mounts again when shown. */
	override destroy(): void {
		this._panel?.events.off('change:id', this._write)
		this._idPlugin?.events.off('change:id', this._write)

		this._panel = undefined
		this._idPlugin = undefined
		this._tab = null
		this._link?.clear()

		super.destroy()
	}

	private readonly _write = (): void => {
		const id = this._idPlugin?.id ?? this._tabId
		const controls = this._panel?.id ?? this._formula
		const link = this._link

		if (!link) {
			this._tab?.aria.add('id', id)
			this._tab?.aria.add('aria-controls', controls)

			return
		}

		const current = link.getSnapshot()

		if (current.id === id && current['aria-controls'] === controls) return

		link.publish(Object.freeze({ id, 'aria-controls': controls }))
	}
}
