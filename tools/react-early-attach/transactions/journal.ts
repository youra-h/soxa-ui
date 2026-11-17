import type { IAdapterContext } from '@soxa-ui/setup'

export enum RegistrationState {
	Pending,
	Commit,
	Rollback,
}
type TToken = { state: RegistrationState }
type TAssembly = {
	readonly contexts: IAdapterContext | readonly IAdapterContext[]
	readonly destroy: () => void
}
type TEntry = {
	context: IAdapterContext
	engine: object
	item: object
	deadline: number
	initialize: () => void
	initialized: boolean
	destroy?: () => void
}

/** Test-only pending registration journal; storage operations stay in native collection extensions. */
class TPendingRegistrations {
	private readonly pending = new Map<TToken, TEntry>()
	private readonly byContext = new WeakMap<object, TToken>()
	private readonly owners = new WeakMap<object, Set<object>>()
	private timer: ReturnType<typeof setTimeout> | undefined
	private ttl = 40
	readonly engines: WeakRef<object>[] = []
	readonly models: WeakRef<object>[] = []
	readonly contexts: WeakRef<object>[] = []
	readonly resources: WeakRef<object>[] = []
	readonly counters = { prepare: 0, commit: 0, rollback: 0, rebuild: 0 }

	get size() {
		return this.pending.size
	}
	configure(ttl: number) {
		if (this.size)
			throw new Error('Pending registrations must be settled before reconfiguration')
		this.ttl = ttl
	}

	prepare(
		context: IAdapterContext,
		engine: object,
		item: object,
		initialize: () => void,
	): TToken {
		const token = { state: RegistrationState.Pending }
		const initialized = !this.owners.get(engine)?.size
		this.pending.set(token, {
			context,
			engine,
			item,
			deadline: Date.now() + this.ttl,
			initialize,
			initialized,
		})
		this.byContext.set(context, token)
		this.models.push(new WeakRef(item))
		this.contexts.push(new WeakRef(context))
		this.counters.prepare++
		try {
			if (initialized) initialize()
		} catch (error) {
			this.finish(token, RegistrationState.Rollback)
			throw error
		}
		this.schedule()
		return token
	}

	bind(assembly: TAssembly) {
		const contexts = Array.isArray(assembly.contexts) ? assembly.contexts : [assembly.contexts]
		if (contexts.some((context) => this.byContext.has(context))) {
			for (const context of contexts) {
				this.resources.push(new WeakRef(context))
				if (context.bundle) this.resources.push(new WeakRef(context.bundle))
			}
		}
		for (const context of contexts) {
			const token = this.byContext.get(context)
			const entry = token ? this.pending.get(token) : undefined
			if (entry) entry.destroy = assembly.destroy
			const engine = Reflect.get(context.instance, 'engine')
			if (
				engine &&
				typeof engine === 'object' &&
				!this.engines.some((ref) => ref.deref() === engine)
			)
				this.engines.push(new WeakRef(engine))
		}
	}

	commit(token: TToken) {
		if (token.state === RegistrationState.Rollback)
			throw new Error('Commit requires rebuilding the rolled-back assembly')
		const entry = this.pending.get(token)
		if (entry && !entry.initialized) {
			entry.initialize()
			entry.initialized = true
		}
		this.finish(token, RegistrationState.Commit)
		this.schedule()
	}

	acceptOwner(engine: object, context: object) {
		let owners = this.owners.get(engine)
		if (!owners) this.owners.set(engine, (owners = new Set()))
		owners.add(context)
	}
	releaseOwner(engine: object, context: object) {
		this.owners.get(engine)?.delete(context)
	}

	rollback(token: TToken) {
		const entry = this.finish(token, RegistrationState.Rollback)
		if (!entry) return
		if (!entry.destroy) throw new Error('Rollback before assembly binding')
		entry.destroy()
		this.schedule()
	}

	rollbackPending() {
		for (const token of [...this.pending.keys()]) this.rollback(token)
	}

	forget(contexts: readonly IAdapterContext[]) {
		for (const context of contexts) {
			const token = this.byContext.get(context)
			if (token) this.finish(token, RegistrationState.Rollback)
		}
		this.schedule()
	}

	expire() {
		this.timer = undefined
		const now = Date.now()
		for (const [token, entry] of [...this.pending])
			if (entry.deadline <= now) this.rollback(token)
		this.schedule()
	}

	reset() {
		for (const token of [...this.pending.keys()]) this.rollback(token)
		if (this.timer) clearTimeout(this.timer)
		this.timer = undefined
		this.engines.length = 0
		this.models.length = 0
		this.contexts.length = 0
		this.resources.length = 0
		this.counters.prepare = 0
		this.counters.commit = 0
		this.counters.rollback = 0
		this.counters.rebuild = 0
	}

	private finish(token: TToken, state: RegistrationState) {
		const entry = this.pending.get(token)
		if (!entry) return
		this.pending.delete(token)
		this.byContext.delete(entry.context)
		token.state = state
		if (state === RegistrationState.Commit) this.counters.commit++
		else this.counters.rollback++
		return entry
	}

	private schedule() {
		if (this.timer) clearTimeout(this.timer)
		this.timer = undefined
		if (!this.pending.size) return
		let deadline = Infinity
		for (const entry of this.pending.values()) deadline = Math.min(deadline, entry.deadline)
		this.timer = setTimeout(() => this.expire(), Math.max(0, deadline - Date.now()))
		this.timer.unref?.()
	}
}

export const registrations = new TPendingRegistrations()
