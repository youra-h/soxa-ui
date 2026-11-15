import type { TAria } from '@soxa-ui/core'
import { TPluginBundle } from '../../base'
import { TElementPlugin } from '../element'

const owners = new WeakMap<TAria, TPopupControls>()

/** Tracks a popup's actual root, including synchronous removal before ready. */
export class TPopupControls {
	private _element: Element | null = null
	private _unbind: (() => void) | undefined

	constructor(
		private readonly _aria: TAria,
		private readonly _id: string,
		private readonly _expanded: () => boolean,
	) {
		owners.set(this._aria, this)
		this.sync()
	}

	readonly bindPanel = (bundle: unknown): void => {
		if (bundle === null || (typeof Element !== 'undefined' && bundle instanceof Element)) {
			this._element = bundle
			this.sync()
			return
		}

		if (!(bundle instanceof TPluginBundle)) return

		this._unbind?.()
		const element = bundle.get(TElementPlugin)
		const bind = (node: Element | null): void => {
			this._element = node
			this.sync()
		}

		element?.events.on('bind', bind)
		this._unbind = () => element?.events.off('bind', bind)
		bind(element?.element ?? null)
	}

	sync(): void {
		if (owners.get(this._aria) !== this) return

		this._aria.add('aria-controls', this._element ? this._id : null)
		// An intended opening is not expanded until the popup exists (APG Combobox).
		this._aria.add('aria-expanded', !!this._element && this._expanded() ? 'true' : 'false')
	}

	destroy(): void {
		this._unbind?.()
		// A newer mount of an external ctrl may already own the same ARIA set.
		if (owners.get(this._aria) === this) {
			this._element = null
			this.sync()
			owners.delete(this._aria)
		}
	}
}
