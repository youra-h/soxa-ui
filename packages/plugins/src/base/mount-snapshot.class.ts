type TListener = () => void

/** A read-only port to a mount-local record: what the merged state of a prepared mount reads. */
export interface IMountSnapshotPort<T extends object = Readonly<Record<string, unknown>>> {
	getSnapshot(): T
	subscribe(listener: () => void): () => void
}

/**
 * TMountSnapshot — attributes one prepared mount renders without writing a
 * shared model.
 *
 * A prepared collection's models may be shared between mounts that are not
 * accepted yet (a discarded React render) or between server requests (an
 * external engine), so the document links and names of one mount are kept
 * beside it instead of in the model's `aria`. The adapter's merged state
 * (`TCollectionAriaState` in setup) reads them through this port. Only a
 * prepared mount creates one: an ordinary mount writes the model.
 */
export class TMountSnapshot<
	T extends object = Readonly<Record<string, unknown>>,
> implements IMountSnapshotPort<T> {
	/** A mount's record is read by one merged state: a single listener is kept as is. */
	private _listeners: TListener | readonly TListener[] | undefined

	constructor(private _snapshot: T) {}

	getSnapshot(): T {
		return this._snapshot
	}

	subscribe(listener: TListener): () => void {
		const current = this._listeners

		this._listeners =
			current === undefined
				? listener
				: typeof current === 'function'
					? [current, listener]
					: [...current, listener]

		return () => this._unsubscribe(listener)
	}

	/** Replace the record; the caller decides whether it changed. */
	publish(snapshot: T): void {
		this._snapshot = snapshot

		const listeners = this._listeners

		if (typeof listeners === 'function') listeners()
		else if (listeners) for (const listener of listeners) listener()
	}

	/** The mount ended: nobody reads it any more. */
	clear(): void {
		this._listeners = undefined
	}

	private _unsubscribe(listener: TListener): void {
		const current = this._listeners

		if (current === listener) {
			this._listeners = undefined
		} else if (Array.isArray(current)) {
			const rest = current.filter((each) => each !== listener)

			this._listeners = rest.length === 1 ? rest[0] : rest
		}
	}
}
