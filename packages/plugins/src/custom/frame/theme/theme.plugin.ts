import type { IFrame } from '@soxa-ui/core'
import { TBasePlugin, type IPluginContext } from '../../../base'
import { TElementPlugin } from '../../element'
import { TAnchorPlugin } from '../anchor'

const THEME = 'data-so-theme'

/** Preserve the anchor's theme across a Frame teleport without copying computed CSS. */
export class TFrameThemePlugin extends TBasePlugin<IFrame> {
	private _frame: IFrame | null = null
	private _anchor: TAnchorPlugin | undefined
	private _panel: Element | null = null
	private _observer: MutationObserver | null = null
	private _written: string | undefined

	override install(ctx: IPluginContext): void {
		super.install(ctx)

		this._frame = ctx.getInstance<IFrame>() ?? null
		this._anchor = ctx.get(TAnchorPlugin)
		this._listenTo(this._anchor?.events, 'change:anchor', () => this._refresh())
		this._listenTo(this._frame?.events, 'change:contained', () => this._refresh())

		const element = ctx.get(TElementPlugin)
		this._listenTo(element?.events, 'bind', (panel) => {
			this._clear()
			this._panel = panel
			this._refresh()
		})

		this._panel = element?.element ?? null
		this._refresh()
	}

	override destroy(): void {
		this._clear()
		this._panel = null
		this._frame = null
		this._anchor = undefined

		super.destroy()
	}

	private _acceptOverrides(records: readonly MutationRecord[]): void {
		// Our writes happen while disconnected. Even writing the same value is an explicit override.
		if (
			records.some(
				(record) => record.target === this._panel && record.attributeName === THEME,
			)
		) {
			this._written = undefined
		}
	}

	private _unwatch(): void {
		this._acceptOverrides(this._observer?.takeRecords() ?? [])
		this._observer?.disconnect()
	}

	private _clear(): void {
		this._unwatch()
		this._observer = null

		// Only remove our last value; an explicit application override belongs to it.
		if (this._written !== undefined && this._panel?.getAttribute(THEME) === this._written) {
			this._panel.removeAttribute(THEME)
		}

		this._written = undefined
	}

	private _refresh(): void {
		this._unwatch()

		const panel = this._panel
		const anchor = this._anchor?.anchor

		if (panel === null || !anchor || this._frame?.contained) {
			this._clear()
			return
		}

		const ancestors: Node[] = []
		let theme: string | null = null

		// Cross shadow roots through their hosts, as inherited variables do.
		for (let node: Node | null = anchor; node !== null;) {
			ancestors.push(node)
			if (theme === null && node instanceof Element) theme = node.getAttribute(THEME)

			node = node instanceof ShadowRoot ? node.host : node.parentNode
		}

		const current = panel.getAttribute(THEME)

		if (current === null || current === this._written) {
			if (theme === null) panel.removeAttribute(THEME)
			else if (current !== theme) panel.setAttribute(THEME, theme)

			this._written = theme ?? undefined
		} else {
			this._written = undefined
		}

		this._observer ??= new MutationObserver((records) => {
			this._acceptOverrides(records)
			this._refresh()
		})
		this._observer.observe(panel, { attributes: true, attributeFilter: [THEME] })

		// A move can change the nearest scope, even if no theme attribute changed.
		for (const node of ancestors) {
			this._observer.observe(node, {
				attributes: true,
				attributeFilter: [THEME],
				childList: true,
			})
		}
	}
}
