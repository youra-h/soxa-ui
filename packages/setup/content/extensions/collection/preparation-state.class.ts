/**
 * Pending mount ownership, shared by one engine and released by commit or rollback.
 */
import type { ICollectionPreparationRegistration } from './types'

type TPending = { owner: object; deadline: number; destroy: () => void }

class TRegistration implements ICollectionPreparationRegistration {
	constructor(private _state: TCollectionPreparationState | undefined) {}

	commit(): void {
		this._state?.finish(this)
	}
	cancel(): void {
		this._state?.finish(this)
	}
	release(): void {
		this._state = undefined
	}
}

/** Shared only by mounts of the same engine; accepted owners disable speculative writes. */
export class TCollectionPreparationState {
	private readonly _owners = new Set<object>()
	private readonly _pending = new Map<TRegistration, TPending>()
	private _timer: ReturnType<typeof setTimeout> | undefined
	private _expiring = 0
	private _deadline = Infinity

	accept(owner: object): void {
		this._owners.add(owner)
	}

	release(owner: object): void {
		this._owners.delete(owner)
		this._expiring++
		try {
			for (const [registration, pending] of [...this._pending]) {
				if (pending.owner === owner) this._rollback(registration)
			}
		} finally {
			this._expiring--
			this._schedule()
		}
	}

	prepare(
		owner: object,
		timeout: number,
		initialize: () => void,
		destroy: () => void,
	): ICollectionPreparationRegistration {
		const registration = new TRegistration(this)
		const deadline = Date.now() + timeout
		this._pending.set(registration, { owner, deadline, destroy })
		try {
			if (!this._owners.size) initialize()
		} catch (error) {
			this._rollback(registration)
			throw error
		}
		this._schedule(deadline)
		return registration
	}

	finish(registration: TRegistration): TPending | undefined {
		const pending = this._pending.get(registration)
		this._pending.delete(registration)
		registration.release()
		this._schedule()
		return pending
	}

	private _rollback(registration: TRegistration): void {
		// Forget first: destroy may cancel the same registration or another mount.
		this.finish(registration)?.destroy()
	}

	private _schedule(earlier = Infinity): void {
		if (this._expiring) return
		if (!this._pending.size) {
			if (this._timer !== undefined) clearTimeout(this._timer)
			this._timer = undefined
			return
		}
		if (this._timer !== undefined) {
			if (earlier >= this._deadline) return
			clearTimeout(this._timer)
		}
		let deadline = Infinity
		for (const pending of this._pending.values())
			deadline = Math.min(deadline, pending.deadline)
		this._deadline = deadline
		this._timer = setTimeout(this._expire, Math.max(0, deadline - Date.now()))
		// The same implementation runs in browsers and must not keep a Node process alive.
		const timer: unknown = this._timer
		if (
			timer !== null &&
			typeof timer === 'object' &&
			'unref' in timer &&
			typeof timer.unref === 'function'
		)
			timer.unref()
	}

	private readonly _expire = (): void => {
		this._timer = undefined
		this._expiring++
		const now = Date.now()
		try {
			for (const [registration, pending] of [...this._pending]) {
				if (pending.deadline <= now) this._rollback(registration)
			}
		} finally {
			this._expiring--
			this._schedule()
		}
	}
}

const states = new WeakMap<object, TCollectionPreparationState>()

export function preparationState(engine: object): TCollectionPreparationState {
	let state = states.get(engine)
	if (!state) {
		state = new TCollectionPreparationState()
		states.set(engine, state)
	}
	return state
}
