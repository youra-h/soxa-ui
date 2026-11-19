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

type TMergedField = { base: unknown; link: unknown; value: unknown }

/**
 * The core owns state; these overlays belong to one DOM mount and never write
 * a shared model.
 *
 * There is one per prepared mount, so it keeps little: the sources are
 * listened to through three handlers of the instance while anyone listens to
 * it, and a mount usually has a single listener, kept as is. A listener gets
 * the merged field alone: the whole merged snapshot is built only for
 * `getSnapshot`, which React and Angular read.
 */
export class TCollectionAriaState {
	private _base: TStateSnapshot | undefined
	private _link: Readonly<Record<string, unknown>> | undefined
	private _outputs: readonly Readonly<Record<string, unknown>>[] = []
	private _snapshot: TStateSnapshot | undefined
	private _fields: Map<string, TMergedField> | undefined
	private _listeners: TStateListener | readonly TStateListener[] | undefined
	private _releases: readonly (() => void)[] | undefined
	/** The exchange's last values of the overlaid fields, as its listener gave them. */
	private _bases: Record<string, unknown> | undefined

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
	 * Forward source changes through the merged view. The first listener
	 * subscribes the sources, the last one leaving releases them. A field
	 * without an overlay passes as the exchange gave it: no merged snapshot is
	 * rebuilt for it.
	 */
	subscribe(listener: TStateListener): () => void {
		const current = this._listeners

		if (current === undefined) {
			this._listeners = listener
			this._releases = this._listen()
		} else {
			// A later listener has no replay from the sources: it gets the values now
			this._listeners =
				typeof current === 'function' ? [current, listener] : [...current, listener]

			for (const [name, value] of Object.entries(this.getSnapshot())) listener(name, value)
		}

		return () => this._unsubscribe(listener)
	}

	private _listen(): readonly (() => void)[] {
		const { state, link, outputs = [] } = this._options
		const releases = outputs.map((output) => output.subscribe(this._outputsChanged))

		if (link) releases.push(link.subscribe(this._linkChanged))

		releases.push(state.subscribe(this._stateChanged))

		return releases
	}

	private _unsubscribe(listener: TStateListener): void {
		const current = this._listeners

		if (typeof current === 'function') {
			if (current !== listener) return

			this._listeners = undefined
		} else if (current) {
			const rest = current.filter((each) => each !== listener)

			this._listeners = rest.length === 1 ? rest[0] : rest

			return
		}

		for (const release of this._releases ?? []) release()

		this._releases = undefined
	}

	private readonly _outputsChanged = (): void => {
		for (const output of this._options.outputs ?? []) {
			for (const name of Object.keys(output.getSnapshot())) this._merged(name)
		}
	}

	private readonly _linkChanged = (): void => this._merged('aria')

	private readonly _stateChanged: TStateListener = (name, value) => {
		if (!this._overlaid(name)) {
			this._emit(name, value)

			return
		}

		const bases = (this._bases ??= {})

		bases[name] = value
		this._merged(name)
	}

	private _overlaid(name: string): boolean {
		return (
			(name === 'aria' && this._options.link !== undefined) ||
			(this._options.outputs ?? []).some((output) =>
				Object.hasOwn(output.getSnapshot(), name),
			)
		)
	}

	/** One overlaid field, merged without building the whole snapshot. */
	private _merged(name: string): void {
		const patch =
			name === 'aria' && this._options.link
				? this._options.link.getSnapshot()
				: this._options.outputs
						?.map((output) => output.getSnapshot())
						.find((output) => Object.hasOwn(output, name))?.[name]

		this._emit(name, this._combine(name, this._bases?.[name], patch))
	}

	private _emit(name: string, value: unknown): void {
		const listeners = this._listeners

		if (typeof listeners === 'function') listeners(name, value)
		else if (listeners) for (const listener of listeners) listener(name, value)
	}

	/** Cache each overlaid field separately so changing one does not invalidate the others. */
	private _combine(name: string, base: unknown, patch: unknown): unknown {
		const fields = (this._fields ??= new Map())
		const cached = fields.get(name)

		if (cached && cached.base === base && cached.link === patch) return cached.value

		const value = Object.freeze({ ...recordOf(base), ...recordOf(patch) })

		fields.set(name, { base, link: patch, value })

		return value
	}
}
