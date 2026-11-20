/** Values a prepared mount renders over fields of the shared model, by field name. */
export type TMountPatches = Readonly<Record<string, Readonly<Record<string, unknown>>>>

const NO_PATCHES: TMountPatches = Object.freeze({})

/**
 * The acceptance gate of one prepared mount, shared by all plugins of its bundle.
 *
 * A prepared assembly may be discarded before the framework accepts it (a
 * React render under Suspense, a server render over an engine shared between
 * requests), so its plugins defer subscriptions to foreign buses until then,
 * and what they would write into the shared model goes into this mount's
 * patches instead. Accepted, the gate drops both and its plugins write the
 * model as an ordinary mount does, so an accepted mount retains nothing beyond
 * an ordinary one.
 */
export class TPluginMount {
	private _pending: (() => void)[] | undefined = []
	private _patches: TMountPatches = NO_PATCHES

	get accepted(): boolean {
		return this._pending === undefined
	}

	/**
	 * Field values rendered before acceptance; empty once accepted. Foreign
	 * subscriptions wait for acceptance, so the patches are fixed on assembly.
	 */
	get patches(): TMountPatches {
		return this._patches
	}

	/** Merge `values` into the field's patch of this mount. */
	patch(field: string, values: Readonly<Record<string, unknown>>): void {
		if (this.accepted) throw new Error('An accepted mount writes its model, not a patch.')

		this._patches = Object.freeze({
			...this._patches,
			[field]: Object.freeze({ ...this._patches[field], ...values }),
		})
	}

	/** Run `effect` at acceptance, or now when the mount is already accepted. */
	defer(effect: () => void): void {
		if (this._pending) this._pending.push(effect)
		else effect()
	}

	/** Drop the patches, then start the queued effects once, in the order they were deferred. */
	accept(): void {
		const pending = this._pending

		if (!pending) return

		this._pending = undefined
		this._patches = NO_PATCHES

		for (const effect of pending) effect()
	}
}
