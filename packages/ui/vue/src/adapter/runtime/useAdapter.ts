/**
 * useAdapter — the one Vue hook of the project.
 *
 * 1. Binds the component to Vue through the exchange `adapter.connect()` in
 *    `setup()`: the state record, the inputs, the events and `update:<prop>`
 *    for `v-model`
 * 2. Accepts the component: `adapter.attach()` in `setup()`
 * 3. Binds the root DOM element to `TElementPlugin` through the context
 * 4. Calls `adapter.detach()` when the unmount begins and `adapter.destroy()`
 *    when it ends
 *
 * The template gets a view of the binding (`./view.ts`): a component with
 * facades joins them with `joinBindings`, and adds its own values with
 * `extendBinding`.
 */

import {
	ref,
	inject,
	ssrContextKey,
	shallowReactive,
	watch,
	onBeforeUnmount,
	onUnmounted,
	onBeforeUpdate,
	getCurrentInstance,
	type Ref,
} from 'vue'
import { TElementPlugin } from '@soxa-ui/plugins'
import {
	collectionInitialInputs,
	collectionInitialState,
	collectionInitialPrepared,
	type IAdapterContext,
	type IComponentContract,
	type TInstanceState,
} from '@soxa-ui/setup'
import type { IPluginBundle } from '@soxa-ui/plugins'
import { VueProfile } from '../common'
import { bindingOf } from './view'
import { useHydratedAttributes } from './hydrated-attributes'

/** The public properties and getters of the controller (`TInstance`), without its methods. */
export type TExtractControllerState<TInstance> = {
	[
		K in keyof TInstance as TInstance[K] extends (...args: never[]) => unknown ? never : K
	]: TInstance[K]
}

/** Props as the template sees them: refs among them are unwrapped, as a `setup()` result's are. */
export type TUnwrapRefs<T> = {
	[K in keyof T]: T[K] extends Ref<infer U> ? U : T[K]
}

/**
 * What `useAdapter` returns and the template sees:
 * - `ctrl` — the controller instance
 * - `plugins` — the plugin bundle
 * - `rootElement` — the ref of the root, when the bundle has `TElementPlugin`
 * - the state (`TBindingState`)
 */
export type TBinding<C extends IComponentContract, TProps> = TBindingFields<C> &
	TBindingState<C, TProps>

/** The fields of a component's view: read before its state. */
export type TBindingFields<C extends IComponentContract> = {
	ctrl: C['instance']
	plugins: IPluginBundle | null
	rootElement?: Ref<Element | null>
}

/**
 * The state in types: the props `TProps`, the instance properties and the
 * plugin outputs of the contract — the latter of the same kind as in the other
 * adapters (`TInstanceState`): a snapshot, read-only, an optional key.
 */
export type TBindingState<C extends IComponentContract, TProps> = TUnwrapRefs<TProps> &
	TExtractControllerState<C['instance']> &
	TInstanceState<C['plugins']['outputs']>

/**
 * The typed state record (`TBindingState`).
 *
 * The boundary between runtime and type, one for `useAdapter` and
 * `useCollectionAdapter` — as `toInstanceState` in the other adapters. The
 * record is filled by the descriptor from the same instance and the same
 * plugins the contract `C` describes, but by property names — the descriptor
 * holds that link, TypeScript does not see it.
 */
export function toBindingState<C extends IComponentContract, TProps>(
	record: Readonly<Record<string, unknown>>,
): TBindingState<C, TProps> {
	return record as TBindingState<C, TProps>
}

/** Adds a key to a plain record like an assignment would, but keeps the record a fast object. */
function define(record: Record<string, unknown>, name: string, value: unknown): void {
	Object.defineProperty(record, name, {
		value,
		writable: true,
		enumerable: true,
		configurable: true,
	})
}

/**
 * What `useAdapter` and `useCollectionAdapter` share: the subscriptions, the
 * acceptance and the cleanup. Returns the state record of the context.
 */
export function useAdapterParts(
	adapter: IAdapterContext,
	props: object,
	emit?: (event: string, ...args: unknown[]) => void,
): Readonly<Record<string, unknown>> {
	const link = adapter.connect(VueProfile)

	// Prepared membership exists before children. Vue SSR has no unmount cleanup,
	// so its snapshot must not accept foreign subscriptions or replace an engine owner.
	if (collectionInitialPrepared(adapter) && inject(ssrContextKey, null) !== null) {
		return { ...collectionInitialState(adapter, link.state).getSnapshot() }
	}

	const offs: Array<() => void> = []

	// 1. Core → Vue: one shallow reactive record per context. The subscription
	// hands over every property with triggers at once, through the same call a
	// trigger uses: that is how the record gets all its keys before the first
	// render.
	//
	// Vue creates a `Dep` for a key only when an effect (the render) reads it,
	// so a property the markup does not read costs one slot of the record; a
	// `shallowRef` per property cost a `RefImpl` and a `Dep` on each
	// (benchmarks/pages/vue.md, 869fmjnaq). The record is shallow: the core
	// hands out values, not handles on live state, and reports a change with a
	// new value (AGENTS.md, «Контракт границы core → ui»). A deep record
	// wrapped everything composite (a table row's cell array, every cell, its
	// `aria` and `dataset`, the collection items) in proxies with a dependency
	// per read key, though nobody changes them in place: in the table that was
	// almost a fifth of a row's memory (benchmarks/table/history.md, 869fekb4g).
	//
	// A new key (a value handed over inside `subscribe()`) is defined on the
	// plain record, past the proxy: nobody has read it yet, and the proxy's
	// `set` with a trigger on every key cost a page about 5% of its mount
	// (benchmarks/pages/vue.md, 869fmjnaq). Defined, not assigned: assigning
	// new keys turns a record of more than a dozen keys into a dictionary,
	// while defining keeps it a fast object whose shape all mounts of the type
	// share. A key the record already has is a change and goes through the
	// proxy, which notifies whoever read it
	const record: Record<string, unknown> = {}
	const state = shallowReactive(record)

	offs.push(
		collectionInitialState(adapter, link.state).subscribe((name, value) => {
			if (Object.hasOwn(record, name)) state[name] = value
			else define(record, name, value)
		}),
	)

	// 2. Vue → core: the inputs go to the core as a full set before a render
	// that brought a new vnode from the parent. A parent pass that changed the
	// props updates the component, and Vue calls `onBeforeUpdate` with the new
	// props already in place, before the render; a render of the component's
	// own state keeps the vnode and leaves the inputs alone. Unchanged inputs
	// write nothing: the input memory swallows a repeat. The context assembly
	// applied the starting values, so only changes go here.
	//
	// Not a `watch` over the props: for Vue to track the inputs its getter read
	// every one of them, and each read of the props proxy creates a `Dep` and a
	// `Link` for its key, present or not, on top of the effect with its
	// scheduler and closures, on every component. That was a tenth of a button
	// and a seventh of a Select page (benchmarks/pages/vue.md, 869fmhuag)
	const instance = getCurrentInstance()
	let vnode = instance?.vnode

	onBeforeUpdate(() => {
		if (!instance || instance.vnode === vnode) return

		vnode = instance.vnode
		link.inputs.full(collectionInitialInputs(adapter, props))
	})

	// 3. The component is accepted: in Vue that is `setup()` itself, with no
	// repeats and no discarded assemblies. Here, not in `onMounted`: `setup()`
	// runs on the server too, and a collection item has to join the collection
	// before the server markup
	adapter.attach()

	// 4. Events: the core's events and `update:<prop>` for `v-model`, which the
	// exchange sends by the profile right after the core event.
	//
	// After the acceptance: what it writes is the starting state, as in the
	// other adapters (benchmarks/parity/README.md). A component with collection
	// facades binds them first: the facade, accepted, writes into the
	// component (the months of Calendar's grids, Table's `dataset`).
	//
	// The consumer hears nothing once the unmount began: it stops on `detach`,
	// sent from `onBeforeUnmount`. Vue calls the parent's `beforeUnmount` hooks
	// before it unmounts the children; stopped later, the consumer heard the
	// markup items leave the collection with an ever shorter `update:items`
	// (`v-model:items` of a `v-if`-ed owner emptied the parent's list), and the
	// blur of the removed node
	if (emit)
		adapter.events.on(
			'detach',
			link.events.listen((name, args) => emit(name, ...args)),
		)

	onBeforeUnmount(() => adapter.detach())

	// 5. Cleanup. Unsubscribing is a must: with an external `ctrl` that
	// outlives the component, `adapter.destroy()` leaves `instance.events`
	// alone, and the handlers would pile up with every mount
	onUnmounted(() => {
		offs.forEach((off) => off())
		adapter.destroy()
	})

	return state
}

/**
 * The node behind a template ref: Vue puts a component's instance there when
 * the root is drawn by a component (Icon's `tag` is its glyph), and the node
 * is that instance's `$el`.
 */
function elementOf(root: unknown): Element | null {
	if (root instanceof Element) return root

	const el: unknown = typeof root === 'object' && root !== null ? Reflect.get(root, '$el') : null

	return el instanceof Element ? el : null
}

/**
 * The ref of the root bound to `TElementPlugin`, only where the bundle has
 * the plugin: headless layers do not. A facade shares the component's bundle
 * and has no node of its own, so `useCollectionAdapter` does not call this.
 *
 * The plugin gets the node, whatever the template wrote into the ref
 * (`elementOf`): a component's instance in `TElementPlugin` gave no
 * `element:ready`, and the plugins of Icon with a glyph never got a node.
 */
function useRootElement(adapter: IAdapterContext): Ref<Element | null> | undefined {
	if (!adapter.bundle?.get(TElementPlugin)) return undefined

	useHydratedAttributes()

	const rootElement = ref<Element | null>(null)

	watch(rootElement, (root) => adapter.bindElement(elementOf(root)), { flush: 'post' })

	return rootElement
}

/**
 * The binding of a component: its fields and its state.
 *
 * The component writes no generics: the instance and the plugin outputs come
 * from the contract in the context type (`createVueAdapterContext` infers it),
 * the props from `props` themselves.
 */
export function useAdapter<C extends IComponentContract, TProps extends object>(
	adapter: IAdapterContext<C>,
	props: TProps,
	emit?: (event: string, ...args: unknown[]) => void,
): TBinding<C, TProps> {
	const state = toBindingState<C, TProps>(useAdapterParts(adapter, props, emit))
	const rootElement = useRootElement(adapter)
	const fields: TBindingFields<C> = rootElement
		? { ctrl: adapter.instance, plugins: adapter.bundle, rootElement }
		: { ctrl: adapter.instance, plugins: adapter.bundle }

	return bindingOf(fields, state)
}
