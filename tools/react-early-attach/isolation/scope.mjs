import { AsyncLocalStorage } from 'node:async_hooks'

const requests = new AsyncLocalStorage()
let earlyClient = false

/** Resource scope used by the experiment's host and native subtree candidates. */
export class TIsolatedExecution {
	contexts = []
	references = []
	destroyed = 0
	closed = false

	run(action) {
		return requests.run(this, action)
	}

	capture(context) {
		if (this.closed) throw new Error('Assembly after SSR scope disposal')
		this.contexts.push(context)
		this.references.push(new WeakRef(context), new WeakRef(context.instance))
		if (context.bundle) this.references.push(new WeakRef(context.bundle))
		const engine = Reflect.get(context.instance, 'engine')
		if (engine && typeof engine === 'object') this.references.push(new WeakRef(engine))
		context.events.on('destroy', () => {
			this.destroyed++
		})
	}

	engines() {
		return [
			...new Set(
				this.contexts
					.map((context) => Reflect.get(context.instance, 'engine'))
					.filter(Boolean),
			),
		]
	}

	values() {
		return this.engines().map((engine) =>
			engine.extensions.batch.items.map((item) => item.value),
		)
	}

	dispose() {
		if (this.closed) return
		this.closed = true
		const contexts = this.contexts
		this.contexts = []
		for (const context of contexts) context.detach()
		for (const context of contexts.reverse()) context.destroy()
	}
}

export function installIsolationHooks() {
	Reflect.set(globalThis, '__ssrIsolation', {
		checkInput(options, componentScope) {
			const execution = componentScope ?? requests.getStore()
			if (!execution) return
			if (execution.closed) throw new Error('Assembly after SSR scope disposal')
			if (options.ctrl || options.options?.engine || options.props?.engine) {
				throw new Error(
					'Prototype only: externally supplied ctrl/engine require an explicit isolation design',
				)
			}
		},
		capture(context, componentScope) {
			;(componentScope ?? requests.getStore())?.capture(context)
		},
		early(componentScope) {
			return !!componentScope || !!requests.getStore() || earlyClient
		},
	})
}

export function setEarlyClient(value) {
	earlyClient = value
}
export function removeIsolationHooks() {
	earlyClient = false
	Reflect.deleteProperty(globalThis, '__ssrIsolation')
}
