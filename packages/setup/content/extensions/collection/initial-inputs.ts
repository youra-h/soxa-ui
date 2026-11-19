/**
 * Views of the framework's props for prepared collection mounts: the declared
 * source owns the model inputs, so the framework's own values (and its
 * generated defaults) must not reach the exchange and overwrite them.
 */
import { TCollectionInitialPartPlugin, TCollectionInitialPlugin } from '@soxa-ui/plugins'

import type { IAdapterContext, IComponentDescriptor } from '../../../protected'

type TPartDescriptor = Pick<IComponentDescriptor, 'props'>

/** The owner's `initial` is consumed by its preparation, not by the exchange. */
export const HIDDEN_INITIAL: object = Object.freeze({ initial: undefined })

/** Props the exchange never routes to a model, prepared or not. */
const WIRING = ['ctrl', 'embedded', 'pluginProps']

const managedNames = new WeakMap<TPartDescriptor['props'], ReadonlySet<string>>()

/**
 * The inputs a prepared part takes from its declaration, not from the
 * framework: its model props and the collection state. One set per
 * descriptor, not per mount or per render.
 */
export function partInputNames(descriptor: TPartDescriptor): ReadonlySet<string> {
	let names = managedNames.get(descriptor.props)

	if (!names) {
		names = new Set([
			'active',
			'selected',
			...descriptor.props
				.filter((prop) => !prop.protected && !WIRING.includes(prop.name.name))
				.map((prop) => prop.name.name),
		])
		managedNames.set(descriptor.props, names)
	}

	return names
}

/** Overlay consumed or prepared inputs without evaluating native child or slot getters. */
export function initialPropsView(props: object, overrides: object): object {
	const read = (key: PropertyKey) =>
		Reflect.has(overrides, key) ? Reflect.get(overrides, key) : Reflect.get(props, key)

	return new Proxy(
		{},
		{
			get: (_target, key) => read(key),
			has: (_target, key) => Reflect.has(overrides, key) || Reflect.has(props, key),
			ownKeys: () => [...new Set([...Reflect.ownKeys(props), ...Reflect.ownKeys(overrides)])],
			getOwnPropertyDescriptor: (_target, key) =>
				Reflect.has(overrides, key) || Reflect.has(props, key)
					? {
							configurable: true,
							enumerable:
								Reflect.getOwnPropertyDescriptor(overrides, key)?.enumerable ??
								Reflect.getOwnPropertyDescriptor(props, key)?.enumerable ??
								false,
							get: () => read(key),
						}
					: undefined,
		},
	)
}

/**
 * The handler behind a prepared part's props. It is the same for every props
 * object of the mount, so a framework passing new props on each render
 * allocates only the proxy. A class, not an object of closures: a mount keeps
 * one small object instead of two functions and their scope.
 */
class TPartPropsHandler implements ProxyHandler<object> {
	constructor(
		private readonly _managed: ReadonlySet<string>,
		private readonly _id: string | undefined,
		private readonly _panel: boolean,
		private readonly _value: string | number | undefined,
	) {}

	get(target: object, key: PropertyKey, receiver: unknown): unknown {
		if (key === 'id') return this._id
		if (key === 'value' && this._panel) return this._value

		return this._hides(key) ? undefined : Reflect.get(target, key, receiver)
	}

	has(target: object, key: PropertyKey): boolean {
		return !this._hides(key) && Reflect.has(target, key)
	}

	private _hides(key: PropertyKey): boolean {
		return typeof key === 'string' && this._managed.has(key)
	}
}

/** Handlers by context descriptor, then by mount: a component and its facade share the bundle. */
const handlers = new WeakMap<
	TPartDescriptor['props'],
	WeakMap<TCollectionInitialPartPlugin, ProxyHandler<object>>
>()

function handlerOf(descriptor: TPartDescriptor, part: TCollectionInitialPartPlugin) {
	let mounts = handlers.get(descriptor.props)

	if (!mounts) {
		mounts = new WeakMap()
		handlers.set(descriptor.props, mounts)
	}

	let handler = mounts.get(part)

	if (!handler) {
		handler = new TPartPropsHandler(
			partInputNames(descriptor),
			part.declaredId,
			part.panel,
			part.declaredValue,
		)
		mounts.set(part, handler)
	}

	return handler
}

/** Prepared data owns model inputs; native runtimes keep plugin and attribute inputs live. */
export function partProps(descriptor: TPartDescriptor, props: object, id?: string): object {
	return new Proxy(props, new TPartPropsHandler(partInputNames(descriptor), id, false, undefined))
}

/** Hide consumed inputs from later exchanges so they cannot overwrite prepared models. */
export function collectionInitialInputs(
	context: Pick<IAdapterContext, 'descriptor' | 'bundle'>,
	props: object,
): object {
	const bundle = context.bundle

	if (!bundle) return props

	const part = bundle.get(TCollectionInitialPartPlugin)

	if (part?.prepared) return new Proxy(props, handlerOf(context.descriptor, part))

	return bundle.get(TCollectionInitialPlugin) && Reflect.get(props, 'initial') !== undefined
		? initialPropsView(props, HIDDEN_INITIAL)
		: props
}
