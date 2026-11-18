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

/** Owns the tab-panel link. Prepared mounts derive ARIA without writing the shared data model. */
export class TTabsItemIdsPlugin extends TBasePlugin<ITabsItem> {
	private _tab: ITabsItem | null = null
	private _formula = ''
	private _fallbackPanelId = ''
	private _tabId = ''
	private _idPlugin: TIdPlugin | undefined
	private _panel: TIdPlugin | undefined
	private _initial = false
	private readonly _listeners = new Set<() => void>()
	private _snapshot: Readonly<Record<string, unknown>> = Object.freeze({})

	get initial(): boolean {
		return this._initial
	}

	/** Publish predeclared links before rendering, then follow the mounted tab's ID changes. */
	override install(ctx: IPluginContext, options: ITabsItemIdsOptions = {}): void {
		super.install(ctx, options)

		this._tab = ctx.getInstance<ITabsItem>()
		this._initial = options.initial !== undefined
		this._idPlugin = ctx.get(TIdPlugin)

		this._tabId =
			options.initial?.tabFallbackId ?? options.initial?.tabId ?? ctx.createId('tab')
		this._formula = options.initial?.panelId ?? ctx.createId('panel')
		this._fallbackPanelId = options.initial?.panelFallbackId ?? this._formula

		// Prepared links are mount-local; ordinary mounts keep writing the model's ARIA.
		if (options.initial)
			this._snapshot = Object.freeze({
				id: options.initial.tabId,
				'aria-controls': options.initial.panelId,
			})
		else this._write()

		this._idPlugin?.events.on('change:id', this._write)
	}

	getSnapshot(): Readonly<Record<string, unknown>> {
		return this._snapshot
	}

	subscribe(listener: () => void): () => void {
		this._listeners.add(listener)

		return () => this._listeners.delete(listener)
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
		this._listeners.clear()

		super.destroy()
	}

	private readonly _write = (): void => {
		const id = this._idPlugin?.id ?? this._tabId
		const controls = this._panel?.id ?? this._formula

		if (!this._initial) {
			this._tab?.aria.add('id', id)
			this._tab?.aria.add('aria-controls', controls)
		}

		if (this._snapshot.id === id && this._snapshot['aria-controls'] === controls) return

		this._snapshot = Object.freeze({ id, 'aria-controls': controls })

		for (const listener of this._listeners) listener()
	}
}
