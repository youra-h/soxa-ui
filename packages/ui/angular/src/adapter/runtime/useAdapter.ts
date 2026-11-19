/**
 * useAdapter — binds an adapter context to Angular, the counterpart of Vue's
 * `useAdapter`.
 *
 * - state is a signal: it notifies the template itself, with Zone.js or
 *   without;
 * - the component is accepted (`attach()`) as soon as the binding is created;
 * - `syncInputs` is the `ngOnChanges` delta, `syncEvents` routes core events
 *   to the output emitters, `detach` stops the consumer, `destroy` cleans up.
 *
 * A collection component has two contexts, its own and the facade's (three
 * for an item with a submenu), and the base needs one binding: `joinBindings`
 * joins them. AGENTS.md (Angular), «Коллекция: два контекста — одна связка».
 */

import { isPlatformBrowser } from '@angular/common'
import {
	computed,
	inject,
	PLATFORM_ID,
	signal,
	type EventEmitter,
	type Signal,
} from '@angular/core'
import {
	collectionInitialInputs,
	collectionInitialPrepared,
	collectionInitialState,
	toInstanceState,
} from '@soxa-ui/setup'
import { appTeardown } from './app-teardown'
import type {
	DescriptorAllEvents,
	DescriptorComponentProps,
	DescriptorInstance,
	IAdapterContext,
	IComponentContract,
	IComponentDescriptor,
	TAdapterState,
	TStateSnapshot,
	TSnapshotOf,
	TInstanceState,
} from '@soxa-ui/setup'
import { AngularProfile } from '../common/profile'

/**
 * The input type of a descriptor prop: the input field of the generated
 * `T<Name>Surface`, which strict templates check the binding against.
 */
export type TInputValue<
	TDescriptorFn extends (...args: any[]) => IComponentDescriptor,
	TInput extends keyof DescriptorComponentProps<TDescriptorFn>,
> = DescriptorComponentProps<TDescriptorFn>[TInput]

/**
 * The value of an output, what `syncEvents` emits: the core event's only
 * argument, the tuple of its arguments when there are several (the new and
 * the previous item of `change:activation`), `undefined` when there are none.
 * The same payload as `detail` of a Web Components event.
 */
type TOutputValue<THandler> = THandler extends (...args: infer TArgs) => unknown
	? TArgs extends readonly []
		? undefined
		: TArgs extends readonly [unknown]
			? TArgs[0]
			: TArgs
	: undefined

/** One value from the core event's arguments, see `TOutputValue`. */
function payloadOf(args: readonly unknown[]): unknown {
	return args.length > 1 ? args : args[0]
}

/**
 * The output type of a descriptor event: the `declare` field of the generated
 * `T<Name>Surface`. The getter behind it is the base's: on the prototype of the
 * component's class, of an output every visual component has — on that of the
 * generated `TViewSurface`.
 */
export type TOutputEmitter<
	TDescriptorFn extends (...args: any[]) => IComponentDescriptor,
	TEvent extends keyof DescriptorAllEvents<TDescriptorFn>,
> = EventEmitter<TOutputValue<DescriptorAllEvents<TDescriptorFn>[TEvent]>>

/** A model emits the property value rather than its change event payload. */
export type TModelEmitter<
	TDescriptorFn extends (...args: any[]) => IComponentDescriptor,
	TInput extends keyof DescriptorComponentProps<TDescriptorFn>,
> = EventEmitter<
	TInput extends keyof DescriptorInstance<TDescriptorFn>
		? TSnapshotOf<DescriptorInstance<TDescriptorFn>[TInput]>
		: TInputValue<TDescriptorFn, TInput>
>

/**
 * State as the template reads it: instance properties, plugin inputs and
 * outputs (`TOutputs`, as in setup's `TAdapterState`) and facade properties.
 * Their names never clash: facade and plugin names are prefixed, and a plugin
 * prop without a namespace (`id` of `TIdPlugin`) differs from the instance's
 * by construction.
 */
export type TBindingState<
	TInstance,
	TFacade = unknown,
	TOutputs = unknown,
	TOwnerFacade = unknown,
> = TInstanceState<TInstance> &
	TInstanceState<TFacade> &
	TInstanceState<TOutputs> &
	TInstanceState<TOwnerFacade>

/** The created emitter of an output by name, otherwise `undefined`. */
export type TOutputOf = (name: string) => EventEmitter<unknown> | undefined

/** The binding of one context. */
type TExchange<TState> = {
	readonly state: Signal<TState>
	syncInputs(inputs: object): void
	resetInputs(names: readonly string[]): void
	/** Returns the unsubscription. */
	syncEvents(outputOf: TOutputOf): () => void
	/** The teardown began: the consumer hears nothing from then on. */
	detach(): void
	destroy(): void
}

/** The component's binding for the base; for a component with a facade `joinBindings` builds it. */
export type TBinding<
	TInstance = any,
	TFacade = unknown,
	TOutputs = unknown,
	TOwnerFacade = unknown,
> = TExchange<TBindingState<TInstance, TFacade, TOutputs, TOwnerFacade>> & {
	readonly ctrl: TInstance
	/** The collection facade; for an item with a submenu, its facade in the collection above. */
	readonly facade: TFacade
	bindElement(el: Element | null): void
}

/** A facade's binding: no `ctrl` and no node, the component has them. */
export type TCollectionBinding<TFacade = any> = TExchange<TInstanceState<TFacade>> & {
	readonly facade: TFacade
}

/** State before the subscription delivered the first snapshot. */
const NO_SNAPSHOT: TStateSnapshot = Object.freeze({})

function useExchange<C extends IComponentContract>(
	adapter: IAdapterContext<C>,
): TExchange<TAdapterState<C>> {
	const binding = adapter.connect(AngularProfile)

	// The signal itself is the state: a `computed` over it only forwarded the snapshot
	const state = signal(toInstanceState<C>(NO_SNAPSHOT))
	const port = collectionInitialState(adapter, binding.state)

	const serverInitial =
		collectionInitialPrepared(adapter) && !isPlatformBrowser(inject(PLATFORM_ID))

	const unsubscribe = serverInitial
		? () => {}
		: port.subscribe(() => state.set(toInstanceState<C>(port.getSnapshot())))

	if (serverInitial) state.set(toInstanceState<C>(port.getSnapshot()))

	let stopEvents: (() => void) | undefined

	// The consumer and the state stop on `detach`: after it the component
	// only comes down, and its siblings leaving a collection one by one would
	// refresh it for nothing. One listener for both: a second turns the
	// event's handler into a set. The application's teardown detaches every
	// context before any view goes (`appTeardown`)
	adapter.events.on('detach', () => {
		stopEvents?.()
		unsubscribe()
	})

	const teardown = appTeardown()

	teardown.add(adapter)

	// `ngOnInit` creates the binding, on the server too: the hooks run in
	// template order, and markup items enter the collection in DOM order
	// Prepared SSR reads a snapshot without taking ownership of an external engine.
	if (!serverInitial) adapter.attach()

	return {
		state,

		// A delta, not `full`: that would reset the other inputs to their defaults
		syncInputs(inputs: object): void {
			binding.inputs.delta(collectionInitialInputs(adapter, inputs))
		},

		resetInputs(names: readonly string[]): void {
			for (const line of binding.lines) {
				if (names.includes(line.name)) line.reset(binding.owners)
			}
		},

		// The emitter is looked up on every event: the output's first read
		// creates it. The consumer stops on `detach`, which comes from
		// `ngOnDestroy` or, for a collection item, from its collection before
		// the siblings go one by one (`TCollectionMembers`)
		syncEvents(outputOf: TOutputOf): () => void {
			if (serverInitial) return () => {}

			const stop = binding.events.listen((exportName, args) =>
				outputOf(exportName)?.emit(payloadOf(args)),
			)

			stopEvents = stop

			return stop
		},

		detach(): void {
			adapter.detach()
		},

		destroy(): void {
			teardown.delete(adapter)
			unsubscribe()
			adapter.destroy()
		},
	}
}

export function useAdapter<C extends IComponentContract>(
	adapter: IAdapterContext<C>,
): TBinding<C['instance'], unknown, C['plugins']['props'] & C['plugins']['outputs']> {
	return {
		...useExchange(adapter),
		ctrl: adapter.instance,
		facade: undefined,
		bindElement: (el) => adapter.bindElement(el),
	}
}

export function useCollectionAdapter<C extends IComponentContract>(
	adapter: IAdapterContext<C>,
): TCollectionBinding<C['instance']> {
	return { ...useExchange(adapter), facade: adapter.instance }
}

/**
 * One binding from the own and the facades': state as one view, inputs,
 * events and `detach` to all, the node to the own only. Destruction goes
 * facades first: the item leaves the collection while its plugin bundle is
 * intact.
 */
export function joinBindings<TInstance, TFacade, TOutputs, TOwnerFacade = unknown>(
	owner: TBinding<TInstance, unknown, TOutputs>,
	facade: TCollectionBinding<TFacade>,
	ownerFacade?: TCollectionBinding<TOwnerFacade>,
): TBinding<TInstance, TFacade, TOutputs, TOwnerFacade> {
	// In destruction order: the item leaves the collection above it before its own
	const facades: readonly TExchange<unknown>[] = ownerFacade ? [facade, ownerFacade] : [facade]

	return {
		state: computed(() => ({ ...ownerFacade?.state(), ...facade.state(), ...owner.state() })),
		ctrl: owner.ctrl,
		facade: facade.facade,

		syncInputs(inputs: object): void {
			owner.syncInputs(inputs)

			for (const each of facades) each.syncInputs(inputs)
		},

		resetInputs(names: readonly string[]): void {
			owner.resetInputs(names)
			for (const each of facades) each.resetInputs(names)
		},

		syncEvents(outputOf: TOutputOf): () => void {
			const stops = [owner, ...facades].map((each) => each.syncEvents(outputOf))

			return () => {
				for (const stop of stops) stop()
			}
		},

		bindElement: (el) => owner.bindElement(el),

		detach(): void {
			for (const each of [owner, ...facades]) each.detach()
		},

		destroy(): void {
			for (const each of facades) each.destroy()

			owner.destroy()
		},
	}
}
