/**
 * The Web Components binding over an assembled adapter context. The platform
 * has no reactivity: state is a plain object, `onUpdate` reports a change,
 * and the element base schedules the render. Core events are `CustomEvent`s
 * on the element; from the owner's markup they do not bubble. AGENTS.md (Web
 * Components), «Связка».
 */

import { TActionEvent } from '@soxa-ui/core'
import { collectionInitialInputs, collectionInitialState, toInstanceState } from '@soxa-ui/setup'
import type {
	IAdapterContext,
	IComponentContract,
	TAdapterState,
	TInstanceState,
} from '@soxa-ui/setup'
import { WebcProfile } from '../common'
import { isOwnerMarkup } from './marks'

/**
 * Instance properties with plugin outputs, and facade properties. Outputs go
 * in one view with the instance, the owner's facade with the facade: from an
 * intersection of three views TypeScript does not infer the instance from the
 * expected type of the template context.
 */
export type TBindingState<
	TInstance,
	TFacade = unknown,
	TOutputs = unknown,
	TOwnerFacade = unknown,
> = TInstanceState<TInstance & TOutputs> & TInstanceState<TFacade & TOwnerFacade>

/** `TFacade` is the collection facade; the template calls collection commands via its context. */
export type TBinding<
	TInstance = object,
	TFacade = unknown,
	TOutputs = unknown,
	TOwnerFacade = unknown,
> = {
	readonly state: TBindingState<TInstance, TFacade, TOutputs, TOwnerFacade>
	readonly ctrl: TInstance
	readonly facade: TFacade
	syncProps(props: object): void
	bindElement(el: Element | null): void
	/** The teardown began: the consumer hears nothing from then on. */
	detach(): void
	destroy(): void
}

/** A facade's binding: `ctrl` and the node belong to the component, not the facade. */
export type TCollectionBinding<TFacade = object> = {
	readonly state: TInstanceState<TFacade>
	readonly facade: TFacade
	syncProps(props: object): void
	/** The teardown began: the consumer hears nothing from then on. */
	detach(): void
	destroy(): void
}

export type TUpdateListener = (name: string, value: unknown) => void

type TExchange<C extends IComponentContract> = {
	readonly state: TAdapterState<C>
	syncProps(props: object): void
	/** The teardown began: the consumer hears nothing from then on. */
	detach(): void
	destroy(): void
}

type TJoined = {
	readonly state: Readonly<Record<string, unknown>>
	syncProps(props: object): void
	/** The teardown began: the consumer hears nothing from then on. */
	detach(): void
	destroy(): void
}

/**
 * An event "before" (a `TActionEvent` argument) is cancelable: cancelling it
 * cancels the core event.
 *
 * A removed element sends nothing: the consumer took it down, and what its
 * teardown stirs (the blur of the removed node, the markup items leaving the
 * collection) is news to no one, as in the other adapters
 * (benchmarks/parity/README.md). An element moved elsewhere is assembled anew
 * on connecting (`ElementBase`), so its state starts over there too.
 */
function dispatch(
	host: HTMLElement,
	name: string,
	args: readonly unknown[],
	bubbles: boolean,
): void {
	if (!host.isConnected) return

	const detail = args.length > 1 ? args : args[0]
	const action = detail instanceof TActionEvent ? detail : undefined
	const event = new CustomEvent(name, {
		detail,
		bubbles,
		composed: true,
		cancelable: action !== undefined,
	})

	if (!host.dispatchEvent(event)) action?.preventDefault()
}

function useExchange<C extends IComponentContract>(
	adapter: IAdapterContext<C>,
	host: HTMLElement,
	onUpdate: TUpdateListener,
): TExchange<C> {
	const binding = adapter.connect(WebcProfile)
	const bubbles = !isOwnerMarkup(host)
	const state: Record<string, unknown> = {}

	// The subscription hands over every property's value at once: that fills the state
	const unsubscribe = collectionInitialState(adapter, binding.state).subscribe((name, value) => {
		state[name] = value
		onUpdate(name, value)
	})

	// Web Components have no discarded assemblies: the binding is made on connect
	adapter.attach()

	// Events after the acceptance: what it writes is the starting state, as in
	// the other adapters (benchmarks/parity/README.md). A component with
	// collection facades binds them first: the facade, accepted, writes into
	// the component (the months of Calendar's grids, Table's `dataset`)
	const unbindEvents = binding.events.listen((exportName, args) => {
		dispatch(host, exportName, args, bubbles)
	})

	// The consumer stops on `detach`, which comes from `disconnectedCallback`
	// or, for a collection item, from its collection before the siblings go
	// one by one (`TCollectionMembers`). The state stops with it: the rest
	// would refresh for nothing while the siblings leave. One listener for
	// both: a second turns the event's handler into a set
	adapter.events.on('detach', () => {
		unbindEvents()
		unsubscribe()
	})

	return {
		state: toInstanceState<C>(state),

		// A delta, not `full`: the element passes one attribute or property at a time
		syncProps(props: object): void {
			binding.inputs.delta(collectionInitialInputs(adapter, props))
		},

		detach(): void {
			adapter.detach()
		},

		destroy(): void {
			unsubscribe()
			unbindEvents()
			adapter.destroy()
		},
	}
}

export function useAdapter<C extends IComponentContract>(
	adapter: IAdapterContext<C>,
	host: HTMLElement,
	onUpdate: TUpdateListener,
): TBinding<C['instance'], unknown, C['plugins']['outputs']> {
	return {
		...useExchange(adapter, host, onUpdate),
		ctrl: adapter.instance,
		facade: undefined,

		bindElement(el: Element | null): void {
			adapter.bindElement(el)
		},
	}
}

export function useCollectionAdapter<C extends IComponentContract>(
	adapter: IAdapterContext<C>,
	host: HTMLElement,
	onUpdate: TUpdateListener,
): TCollectionBinding<C['instance']> {
	return {
		...useExchange(adapter, host, onUpdate),
		facade: adapter.instance,
	}
}

type TJoinedStates = {
	readonly states: readonly Readonly<Record<string, unknown>>[]
}

/** The first state in order that has the name. */
function stateOf(
	{ states }: TJoinedStates,
	name: string | symbol,
): Readonly<Record<string, unknown>> | undefined {
	return typeof name === 'string' ? states.find((state) => Object.hasOwn(state, name)) : undefined
}

/**
 * One handler for all views: a getter per name of every view (a closure, its
 * scope and a pair of accessors) cost a table row kilobytes.
 */
const JOINED: ProxyHandler<TJoinedStates> = {
	get(target, name) {
		return typeof name === 'string' ? stateOf(target, name)?.[name] : undefined
	},
	has(target, name) {
		return stateOf(target, name) !== undefined
	},
	ownKeys({ states }) {
		return [...new Set(states.flatMap((state) => Object.keys(state)))]
	},
	getOwnPropertyDescriptor(target, name) {
		const state = stateOf(target, name)

		return state && typeof name === 'string'
			? { value: state[name], enumerable: true, configurable: true, writable: false }
			: undefined
	},
}

/**
 * A live view of several states: a property comes from the first that has it.
 * The subscription filled the keys at assembly and no new ones appear; values
 * are read at access time.
 */
function joinStates(
	states: readonly Readonly<Record<string, unknown>>[],
): Readonly<Record<string, unknown>> {
	return new Proxy<TJoinedStates>({ states }, JOINED)
}

/** The runtime/type boundary, as `toInstanceState`: the descriptors hold the name link. */
function toBindingState<TInstance, TFacade, TOutputs, TOwnerFacade>(
	view: Readonly<Record<string, unknown>>,
): TBindingState<TInstance, TFacade, TOutputs, TOwnerFacade> {
	return view as TBindingState<TInstance, TFacade, TOutputs, TOwnerFacade>
}

/**
 * One binding from two or three contexts: the own, the item's facade and, for
 * an item with a submenu, the facade of its own collection. The node is the
 * own only; `detach` goes to all; facades are destroyed before the component,
 * while its plugin bundle is intact.
 */
export function joinBindings<TInstance, TFacade, TOutputs, TOwnerFacade = unknown>(
	owner: TBinding<TInstance, unknown, TOutputs>,
	facade: TCollectionBinding<TFacade>,
	ownerFacade?: TCollectionBinding<TOwnerFacade>,
): TBinding<TInstance, TFacade, TOutputs, TOwnerFacade> {
	const facades: TJoined[] = ownerFacade ? [facade, ownerFacade] : [facade]
	const ownerState: Readonly<Record<string, unknown>> = owner.state

	return {
		state: toBindingState<TInstance, TFacade, TOutputs, TOwnerFacade>(
			joinStates([ownerState, ...facades.map((each) => each.state)]),
		),
		ctrl: owner.ctrl,
		facade: facade.facade,

		syncProps(props: object): void {
			owner.syncProps(props)

			for (const each of facades) each.syncProps(props)
		},

		bindElement(el: Element | null): void {
			owner.bindElement(el)
		},

		detach(): void {
			owner.detach()

			for (const each of facades) each.detach()
		},

		destroy(): void {
			for (const each of facades) each.destroy()

			owner.destroy()
		},
	}
}
