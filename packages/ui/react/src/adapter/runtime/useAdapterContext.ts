/**
 * useAdapterContext — keeps the component's contexts between renders and owns
 * their whole life: assembly on the first render, acceptance at the commit,
 * reassembly when the effect is set up again, destruction in its cleanup. The
 * first moment of the teardown, `detach`, is the layout cleanup of the
 * consumer's subscription (`TEventCallbacks.release`). AGENTS.md (React),
 * «Срок жизни контекста».
 */

import { useContext, useEffect, useEffectEvent, useId, useMemo, useReducer, useRef } from 'react'
import { createAdapterContext } from '@soxa-ui/setup'
import type {
	IAdapterContext,
	TElevatorFactory,
	TCollectionPreparationLifetime,
} from '@soxa-ui/setup'
import type { TCreateCollectionPreparation } from './collection-preparation'
import type { ICollectionTransaction } from '@soxa-ui/core'
import { ElevatorContext, type TElevatorLayer } from '../elevator/layer'
import { LocaleContext } from '../locale/context'
import { TReactElevatorScope } from '../elevator/scope.class'
import { TDrafts } from './drafts.class'
import { accepting } from './accepting'

/** The context assembly the hook gives the factory: the signature of `createAdapterContext`. */
export type TCreateAdapterContext = typeof createAdapterContext

/** What the factory assembles: the component's context, or several (its own and the facade's). */
export type TAdapterContexts = IAdapterContext | readonly IAdapterContext[]

export type TAssembly<T extends TAdapterContexts> = {
	/** Exactly what the factory returned. */
	readonly contexts: T
	/** The layer: the parent's plus what the assembly put down. Children get it via `Elevate`. */
	readonly layer: TElevatorLayer
}

const nextVersion = (version: number) => version + 1

/** Assemblies React has not accepted yet, shared by all components. */
const drafts = new TDrafts()

function isList(contexts: TAdapterContexts): contexts is readonly IAdapterContext[] {
	return Array.isArray(contexts)
}

function listOf(contexts: TAdapterContexts): readonly IAdapterContext[] {
	return isList(contexts) ? contexts : [contexts]
}

/** In assembly order: the facade is assembled on the owner's bundle and accepted after it. */
function attachAll(contexts: TAdapterContexts): void {
	for (const context of listOf(contexts)) context.attach()
}

/** All before any is destroyed: the component's consumer hears nothing of its facade leaving. */
function detachAll(contexts: TAdapterContexts): void {
	for (const context of listOf(contexts)) context.detach()
}

/** Detached, then in reverse order: the facade goes before the owner. */
function destroyAll(contexts: TAdapterContexts): void {
	detachAll(contexts)

	for (const context of [...listOf(contexts)].reverse()) context.destroy()
}

/**
 * The assembly the hook holds: the contexts, the elevator and what they took
 * from outside. The effect's cleanup is the `destroy` arrow: AGENTS.md
 * (React), «Функции дольше рендера — в классах».
 */
class TBuilt<T extends TAdapterContexts> {
	private _destroyed = false
	private _receipt?: ICollectionTransaction

	/** Preparation tracks resources; native acceptance alone confirms this attempt. */
	prepare(preparation: ReturnType<TCreateCollectionPreparation> | undefined): void {
		this._receipt = preparation?.pending(listOf(this.contexts), this.destroy)
	}

	/**
	 * @param contexts exactly what the factory returned
	 * @param scope the elevator the contexts are assembled on
	 * @param _held `ctrl` and the collection engine that came from outside
	 */
	constructor(
		readonly contexts: T,
		readonly scope: TReactElevatorScope,
		private _held: readonly object[] | undefined,
	) {}

	get destroyed(): boolean {
		return this._destroyed
	}

	/**
	 * The consumers of the contexts being accepted hear nothing of what the
	 * acceptance writes (an item entering its collection): that is the
	 * starting state, as in the other adapters, where the consumer starts
	 * listening after the acceptance. React accepts in a passive effect, after
	 * the consumer started listening in a layout effect (before the first
	 * paint, so `ready` of `TElementPlugin` is not lost), and accepts the
	 * children before the owner, whose consumer has to hear them enter.
	 */
	accept(): void {
		this._releaseDraft()?.commit()

		accepting(this.contexts, () => attachAll(this.contexts))
	}

	readonly destroy = (): void => {
		if (this._destroyed) return

		this._destroyed = true
		this._releaseDraft()?.cancel()

		destroyAll(this.contexts)
	}

	private _releaseDraft(): ICollectionTransaction | undefined {
		const receipt = this._receipt
		this._receipt = undefined

		if (this._held) {
			drafts.forget(this._held)
			this._held = undefined
		}

		return receipt
	}
}

export function useAdapterContext<T extends TAdapterContexts>(
	factory: (create: TCreateAdapterContext, elevator: TElevatorFactory) => T,
	createPreparation?: TCreateCollectionPreparation,
): TAssembly<T> {
	const mountId = useId()
	const locale = useContext(LocaleContext)
	const parent = useContext(ElevatorContext)
	const ref = useRef<TBuilt<T> | null>(null)
	const preparationLifetime = useRef<TCollectionPreparationLifetime | null>(null)

	// The layer the last effect setup ran with
	const settled = useRef<TElevatorLayer | null>(null)
	const [, rerender] = useReducer(nextVersion, 0)

	const assemble = (layer: TElevatorLayer): TBuilt<T> => {
		const scope = new TReactElevatorScope(layer)
		const preparation = createPreparation?.(scope.elevator, preparationLifetime)
		const held: object[] = []

		// A retry of a discarded render over the same `ctrl` keeps the discarded one's id
		let id = mountId

		// A mount id and a locale given explicitly as options stay with whoever
		// gave them
		const create: TCreateAdapterContext = (descriptor, options, config) => {
			// One preparation per assembly pass: its receipt covers every context of it
			config = preparation ? preparation.config(descriptor, config) : config

			const taken = drafts.take(options)

			held.push(...taken.held)
			id = taken.mountId ?? id

			return createAdapterContext(descriptor, { mountId: id, locale, ...options }, config)
		}

		const built = new TBuilt(factory(create, scope.elevator), scope, held)

		drafts.add(held, built.destroy, id)

		// Register rollback only after all contexts exist, so it can release the whole assembly.
		try {
			built.prepare(preparation)
		} catch (error) {
			built.destroy()

			throw error
		}

		return built
	}

	// The factory of the last render, not of the one the effect saw
	const rebuild = useEffectEvent(() => assemble(parent))

	if (!ref.current || ref.current.destroyed) {
		ref.current = assemble(parent)
	}

	const built = ref.current

	// A stale read layer sets the effect up again with the new one
	const source = built.scope.isStale(parent) ? parent : settled.current

	useEffect(() => {
		settled.current = source

		// A repeated setup: the component is alive, but its contexts are destroyed
		if (ref.current?.destroyed) {
			ref.current = rebuild()
			rerender()
		}

		const current = ref.current

		if (!current) return

		current.accept()

		return current.destroy
	}, [source])

	const layer = useMemo(() => built.scope.layerOver(parent), [built, parent])

	return { contexts: built.contexts, layer }
}
