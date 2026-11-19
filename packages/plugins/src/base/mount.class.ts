/**
 * The acceptance gate of one prepared mount, shared by all plugins of its bundle.
 *
 * A prepared assembly may be discarded before the framework accepts it (a
 * React render under Suspense), so its plugins defer subscriptions to foreign
 * buses until then. The gate keeps only the queue: accepted, it drops the
 * queue and later effects run at once, so an accepted mount retains nothing
 * beyond an ordinary one.
 */
export class TPluginMount {
	private _pending: (() => void)[] | undefined = []

	get accepted(): boolean {
		return this._pending === undefined
	}

	/** Run `effect` at acceptance, or now when the mount is already accepted. */
	defer(effect: () => void): void {
		if (this._pending) this._pending.push(effect)
		else effect()
	}

	/** Start the queued effects once, in the order they were deferred. */
	accept(): void {
		const pending = this._pending

		if (!pending) return

		this._pending = undefined

		for (const effect of pending) effect()
	}
}
