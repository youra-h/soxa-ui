/**
 * One standard mount snapshot with read-only document relationships and localized part names.
 */
import type { TStateListener, TStateSnapshot } from '../../../protected/adapter/exchange'
import type { ICollectionAriaStateOptions } from './aria-state.types'

function recordOf(value: unknown): Readonly<Record<string, unknown>> {
	return typeof value === 'object' && value !== null
		? Object.fromEntries(Object.entries(value))
		: {}
}

const EMPTY: Readonly<Record<string, unknown>> = Object.freeze({})

/** The core owns state; these overlays belong to one DOM mount and never write a shared model. */
export class TCollectionAriaState {
	private _base: TStateSnapshot | undefined
	private _link: Readonly<Record<string, unknown>> | undefined
	private _outputs: readonly Readonly<Record<string, unknown>>[] = []
	private _snapshot: TStateSnapshot | undefined
	private readonly _fields = new Map<string, { base: unknown; link: unknown; value: unknown }>()

	constructor(private readonly _options: ICollectionAriaStateOptions) {}

	/** Merge mount-local outputs while preserving snapshot and unchanged field identities. */
	getSnapshot(): TStateSnapshot {
		const base = this._options.state.getSnapshot()
		const link = this._options.link?.getSnapshot() ?? EMPTY
		const outputs = (this._options.outputs ?? []).map((output) => output.getSnapshot())

		// Subscribers must see the same object while all source snapshots are unchanged
		if (
			this._snapshot &&
			this._base === base &&
			this._link === link &&
			outputs.every((output, index) => output === this._outputs[index])
		) {
			return this._snapshot
		}

		const snapshot = { ...base }

		if (this._options.link) snapshot.aria = this._combine('aria', base.aria, link)

		for (const output of outputs) {
			for (const [name, value] of Object.entries(output)) {
				snapshot[name] = this._combine(name, base[name], value)
			}
		}

		this._base = base
		this._link = link
		this._outputs = outputs
		this._snapshot = Object.freeze(snapshot)

		return this._snapshot
	}

	/**
	 * Forward source changes through the merged view and release every
	 * subscription together. A field without an overlay passes as the
	 * exchange gave it: no merged snapshot is rebuilt for it.
	 */
	subscribe(listener: TStateListener): () => void {
		const { state, link, outputs = [] } = this._options
		const merged = (name: string): void => listener(name, this.getSnapshot()[name])
		const overlaid = (name: string): boolean =>
			(name === 'aria' && link !== undefined) ||
			outputs.some((output) => Object.hasOwn(output.getSnapshot(), name))

		const releases = outputs.map((output) =>
			output.subscribe(() => {
				for (const name of Object.keys(output.getSnapshot())) merged(name)
			}),
		)

		if (link) releases.push(link.subscribe(() => merged('aria')))

		releases.push(
			state.subscribe((name, value) =>
				overlaid(name) ? merged(name) : listener(name, value),
			),
		)

		return () => {
			for (const release of releases) release()
		}
	}

	/** Cache each overlaid field separately so changing one does not invalidate the others. */
	private _combine(name: string, base: unknown, patch: unknown): unknown {
		const cached = this._fields.get(name)

		if (cached && cached.base === base && cached.link === patch) return cached.value

		const value = Object.freeze({ ...recordOf(base), ...recordOf(patch) })

		this._fields.set(name, { base, link: patch, value })

		return value
	}
}
