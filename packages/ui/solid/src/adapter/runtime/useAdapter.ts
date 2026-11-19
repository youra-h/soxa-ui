/**
 * useAdapter — binds an adapter context to Solid, the counterpart of Vue's
 * `useAdapter`.
 *
 * - state is shallow, a signal per property read (`createShallowState`),
 *   filled by the subscription to the binding;
 * - inputs: an effect over all props, the binding writes the changed ones;
 * - the component body runs once, on the server too: that is the acceptance
 *   (`attach()`), and the cleanup is `onCleanup`;
 * - events go to the `onXxx` callback props, after the acceptance, until
 *   `detach`.
 *
 * The adapter's `ref` binds the root to `TElementPlugin` and hands the same
 * node to the consumer's `ref`. A collection has two contexts: the facade is
 * bound by `useCollectionAdapter`, before the component, and `joinBindings`
 * joins it with the component's binding. AGENTS.md (Solid), «Связка».
 */

import {
	createComputed,
	createEffect,
	createMemo,
	createSignal,
	getOwner,
	onCleanup,
	onMount,
	runWithOwner,
	type Accessor,
} from 'solid-js'
import { isServer } from 'solid-js/web'
import {
	collectionInitialInputs,
	collectionInitialPrepared,
	collectionInitialState,
	toInstanceState,
} from '@soxa-ui/setup'
import type { IAdapterContext, IComponentContract, TAdapterState, TExchange } from '@soxa-ui/setup'
import { SolidProfile } from '../common'
import { createShallowState, joinState, type TJoinedState } from './state'

/**
 * The consumer's `ref` gets the component's root: a function, or a variable
 * the Solid compiler turns into one. The node is an `Element`: the root can be
 * an `<svg>`.
 */
export type TConsumerRef = Element | ((element: Element) => void)

export type TBinding<
	C extends IComponentContract = IComponentContract,
	TProps extends object = object,
> = {
	readonly ctrl: C['instance']
	readonly state: TAdapterState<C>
	/** A memo: the attributes the binding did not take. */
	forwardProps: () => Partial<TProps>
	/** The bound root; `null` unrendered or removed. The panel's anchor (`anchor_anchor`). */
	rootElement: Accessor<Element | null>
	/** The root's callback ref: binds to `TElementPlugin`, then calls the consumer's `ref`. */
	ref: (el: Element) => void
	/** Only the binding: for a root inside a wrapper (the table's window). */
	bindRef: (el: Element) => void
	/** Only the consumer's `ref`: for the root's wrapper. */
	consumerRef: (el: Element) => void
}

/** The binding of a collection facade: it has no `ctrl` and no `ref` of its own. */
export type TCollectionBinding<TState extends object, TProps extends object = object> = {
	readonly state: TState
	/** The attributes the facade leaves; `joinBindings` passes it the component's rest. */
	forward: (props: Partial<TProps>) => Partial<TProps>
}

/** What `joinBindings` takes of a binding it joins the facades with. */
type TJoinable<TProps extends object> = {
	readonly state: object
	forwardProps: () => Partial<TProps>
}

/** A component's binding joined with a facade: state as one view, attributes from the facade. */
export type TJoinedBinding<
	TOwner extends TJoinable<TProps>,
	TFacadeState extends object,
	TProps extends object,
> = Omit<TOwner, 'state' | 'forwardProps'> & {
	readonly state: TJoinedState<TOwner['state'], TFacadeState>
	forwardProps: () => Partial<TProps>
}

/** What the component and a facade share: exchange, state, inputs, acceptance, events, cleanup. */
function useExchange(
	adapter: IAdapterContext,
	props: object,
): { binding: TExchange; state: Readonly<Record<string, unknown>> } {
	const binding = adapter.connect(SolidProfile)

	// Prepared SSR reads a snapshot without accepting foreign subscriptions or engine ownership.
	if (isServer && collectionInitialPrepared(adapter)) {
		return {
			binding,
			state: { ...collectionInitialState(adapter, binding.state).getSnapshot() },
		}
	}

	const [state, write, updates] = createShallowState()

	onCleanup(binding.updates.listen(updates))

	const release = collectionInitialState(adapter, binding.state).subscribe(write)

	onCleanup(release)

	createEffect(() => binding.inputs.full(collectionInitialInputs(adapter, props)))

	// Children run in document order, so items join the collection in DOM order
	adapter.attach()

	// Events after the acceptance: what it writes is the starting state, as in
	// the other adapters (benchmarks/parity/README.md). A component with
	// collection facades binds them first: the facade, accepted, writes into
	// the component (the months of Calendar's grids, Table's `dataset`)
	const stop = binding.events.listen((exportName, args) => {
		const callback: unknown = Reflect.get(props, exportName)

		if (typeof callback === 'function') callback(...args)
	})

	// The consumer stops on `detach`, which comes from the teardown's first
	// moment (`detachFirst`) or, for a collection item, from its collection
	// before the siblings go one by one (`TCollectionMembers`). The state stops
	// with it: the rest would refresh for nothing while the siblings leave. One
	// listener for both: a second turns the event's handler into a set
	adapter.events.on('detach', () => {
		stop()
		release()
	})
	onCleanup(stop)
	detachFirst(adapter)

	// Solid runs cleanups in reverse order of registration
	onCleanup(() => adapter.destroy())

	return { binding, state }
}

/**
 * Sends `detach` at the teardown's first moment: the consumer hears nothing
 * from then on, as in the other adapters (benchmarks/parity/README.md). Solid
 * cleans an owner's computations first, the last made first, and its cleanups
 * after them, so the children (markup items leaving the collection with an
 * ever shorter list, the root's unbinding) went before `onCleanup` of the
 * component's body. A computation made on mount, when the children already
 * exist, is the owner's last one, and its cleanup is the first of the
 * teardown. Before the mount, and on the server, where effects do not run,
 * `onCleanup(stop)` unsubscribes and `destroy` detaches.
 */
function detachFirst(adapter: IAdapterContext): void {
	const owner = getOwner()

	onMount(() =>
		runWithOwner(owner, () => createComputed(() => onCleanup(() => adapter.detach()))),
	)
}

export function useAdapter<C extends IComponentContract, TProps extends object>(
	adapter: IAdapterContext<C>,
	props: TProps,
): TBinding<C, TProps> {
	const { binding, state } = useExchange(adapter, props)
	const forwardProps = createMemo(() => binding.forward(props))
	const [rootElement, setRootElement] = createSignal<Element | null>(null)

	// Unbinding is a cleanup of the node's owner: a tag change (`Root`) unbinds the previous node
	const bindRef = (el: Element): void => {
		adapter.bindElement(el)
		setRootElement(el)

		onCleanup(() => {
			adapter.bindElement(null)
			setRootElement(null)
		})
	}

	const consumerRef = (el: Element): void => {
		const consumer: unknown = Reflect.get(props, 'ref')

		if (typeof consumer === 'function') consumer(el)
	}

	return {
		ctrl: adapter.instance,
		state: toInstanceState<C>(state),
		forwardProps,
		rootElement,
		bindRef,
		consumerRef,

		ref(el: Element) {
			bindRef(el)
			consumerRef(el)
		},
	}
}

/**
 * The adapter of a collection facade: the facade takes its inputs and events
 * from `props` and leaves the attributes that are not its own (`forward`).
 * No `ctrl` and no `ref`: `joinBindings` joins the facade with the
 * component's binding. Bound before the component: the facade, accepted,
 * writes into it, and that is its starting state.
 */
export function useCollectionAdapter<C extends IComponentContract, TProps extends object>(
	adapter: IAdapterContext<C>,
	props: TProps,
): TCollectionBinding<TAdapterState<C>, TProps> {
	const { binding, state } = useExchange(adapter, props)

	return {
		state: toInstanceState<C>(state),
		forward: (rest) => binding.forward(rest),
	}
}

/**
 * The binding of a component with its facades — one, for the markup: the
 * state of all of them as one view (`joinState`), the attributes of the last
 * facade (each takes its own from the rest of the previous one, the first —
 * from the component's), the rest — the component's.
 */
export function joinBindings<
	TProps extends object,
	TOwner extends TJoinable<TProps>,
	TFacade extends object,
>(
	owner: TOwner,
	facade: TCollectionBinding<TFacade, TProps>,
): TJoinedBinding<TOwner, TFacade, TProps>
export function joinBindings<
	TProps extends object,
	TOwner extends TJoinable<TProps>,
	TFacade extends object,
	TOwnerFacade extends object,
>(
	owner: TOwner,
	facade: TCollectionBinding<TFacade, TProps>,
	ownerFacade: TCollectionBinding<TOwnerFacade, TProps>,
): TJoinedBinding<TJoinedBinding<TOwner, TFacade, TProps>, TOwnerFacade, TProps>
export function joinBindings(
	owner: TJoinable<object>,
	...facades: TCollectionBinding<object>[]
): TJoinable<object> {
	return {
		...owner,
		state: facades.reduce((state, facade) => joinState(state, facade.state), owner.state),
		forwardProps: createMemo(() =>
			facades.reduce((rest, facade) => facade.forward(rest), owner.forwardProps()),
		),
	}
}
