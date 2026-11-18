/** Foreign subscriptions begin only when the native framework accepts this mount. */
export class TPluginMount {
	private _accepted = false
	private readonly _pending = new Set<() => void>()

	/** Queue an effect until acceptance; the returned release also cancels an unstarted effect. */
	defer(effect: () => void | (() => void)): () => void {
		let pending = true
		let cleanup: (() => void) | undefined

		const start = (): void => {
			if (!pending) return

			pending = false
			this._pending.delete(start)

			cleanup = effect() ?? undefined
		}

		if (this._accepted) start()
		else this._pending.add(start)

		return () => {
			pending = false
			this._pending.delete(start)

			cleanup?.()
			cleanup = undefined
		}
	}

	/** Start queued effects once; effects registered afterwards may run immediately. */
	accept(): void {
		if (this._accepted) return

		this._accepted = true

		for (const start of this._pending) start()
	}
}

/** Common installation input; it carries no component or collection state. */
export interface IPluginMountOptions {
	readonly pluginMount?: TPluginMount
}
