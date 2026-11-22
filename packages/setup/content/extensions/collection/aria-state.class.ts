/**
 * The state a prepared mount renders before acceptance.
 */
import type { TPluginMount } from '@soxa-ui/plugins'
import type { TStateListener, TStateSnapshot } from '../../../protected/adapter/exchange'
import type { TCollectionStatePort } from './aria-state.types'

function recordOf(value: unknown): Readonly<Record<string, unknown>> {
	return typeof value === 'object' && value !== null
		? Object.fromEntries(Object.entries(value))
		: {}
}

/**
 * The shared model with the mount's patches over it (`TPluginMount.patches`).
 * Only the server render and a React render before commit need it: once the
 * mount is accepted, the patches are gone and the model is read as it is.
 *
 * A component and its collection facade share one bundle and so one mount:
 * a patch applies only to a field this state has, or the facade's state would
 * carry the patch alone over the component's whole field.
 */
export class TCollectionAriaState {
	constructor(
		private readonly _state: TCollectionStatePort,
		private readonly _mount: TPluginMount,
	) {}

	getSnapshot(): TStateSnapshot {
		const base = this._state.getSnapshot()
		const patches = this._patched(base)

		if (patches.length === 0) return base

		const snapshot = { ...base }

		for (const name of patches) {
			snapshot[name] = Object.freeze({
				...recordOf(base[name]),
				...this._mount.patches[name],
			})
		}

		return Object.freeze(snapshot)
	}

	/** A consumer that keeps the port can switch to the exchange state at acceptance. */
	subscribe(
		listener: TStateListener,
		accepted?: (state: TCollectionStatePort) => void,
	): () => void {
		const state = this._state

		if (accepted && this._mount.accepted) {
			accepted(state)

			return state.subscribe(listener)
		}

		const patched = this._patched(state.getSnapshot())
		const pending: { view?: TCollectionAriaState } = { view: this }

		// Acceptance can change the rendered field without a model event.
		this._mount.defer(() => {
			if (!pending.view) return

			pending.view = undefined
			accepted?.(state)

			for (const name of patched) listener(name, state.getSnapshot()[name])
		})

		const release = state.subscribe((name) =>
			listener(name, (pending.view ?? state).getSnapshot()[name]),
		)

		return () => {
			pending.view = undefined
			release()
		}
	}

	private _patched(base: TStateSnapshot): string[] {
		return Object.keys(this._mount.patches).filter((name) => Object.hasOwn(base, name))
	}
}
