/**
 * Contracts of the adapter context, its options and extension constructors.
 */

import type { TEvented } from '@soxa-ui/core'
import type { ILocaleSource, IPluginBundle } from '@soxa-ui/plugins'
import type {
	IComponentContract,
	IComponentDescriptor,
	IPluginDefinition,
	IPluginsContract,
} from '../../define'
import type { IAdapterProfile } from '../../naming'
import type { TExchange } from '../exchange/exchange.class'
import type { TMember } from '../exchange/member.class'

/**
 * The context's life: `attach` — the framework accepted the assembled
 * component, `detach` — it began removing it, `destroy` — it let it go. Each
 * comes once and in this order. The adapter's runtime sends all three;
 * `detach` may also come earlier from the collection the component is a
 * member of (`TCollectionMembers`).
 */
export type TAdapterEvents = {
	attach: () => void
	detach: () => void
	destroy: () => void
}

/**
 * A context contract with the instance and the plugins named, the rest as for
 * any component. By it `createAdapterContext` resolves the instance from two
 * sources: the descriptor's `ctor` and the given `ctrl`.
 */
export type TContextContract<
	TInstance extends object,
	TPlugins extends IPluginsContract = IPluginsContract,
> = IComponentContract & { instance: TInstance; plugins: TPlugins }

/**
 * A context of which only the instance is known. This is how an extension
 * declares what it works with: `TInstanceContext<TCollectionOwner>` — any
 * component whose instance has an `engine`.
 */
export type TInstanceContext<TInstance extends object> = IAdapterContext<
	TContextContract<TInstance>
>

/**
 * An extension constructor with options. `TInstance` is the instance the
 * extension needs (`TCollectionExtension` — a facade with `engine`);
 * `IAdapterContext.use()` checks it against the context's instance at compile
 * time, so an extension cannot go on a component that lacks what it works
 * with.
 */
export interface IAdapterExtensionCtor<
	T = unknown,
	TOpts = unknown,
	TInstance extends object = object,
> {
	new (context: TInstanceContext<TInstance>, options: TOpts): T
}

/** An extension constructor without options. */
export interface IAdapterExtensionCtorNoOpts<T = unknown, TInstance extends object = object> {
	new (context: TInstanceContext<TInstance>): T
}

/** Any extension constructor: a registry key and an item of the starting set. */
export type TAnyExtensionCtor = new (...args: any[]) => unknown

/** Options of creating an adapter context: a ready instance (`ctrl`) or the constructor's props and options. */
export interface IAdapterContextOptions<TInstance extends object = object> {
	ctrl?: TInstance
	/** Per-mount installation options for plugins already declared by the descriptor. */
	pluginOptions?: readonly IPluginDefinition[]
	/**
	 * The framework's props. `object`, not `Record<string, unknown>`: adapters
	 * declare props as interfaces without an index signature. They are read by
	 * the descriptor's names through `Reflect.get`.
	 */
	props?: object
	options?: object
	/**
	 * The place's name if the component is a detail of another component's
	 * markup (a tag's row and close button). It goes into the mount's
	 * composition (`resolveComposition`): registry plugins with `scope: 'own'`
	 * are not installed on an embedded component.
	 */
	embedded?: string
	/**
	 * The mount id — from the framework's `useId`, the same on the server and
	 * in the browser. It goes to the own plugin bundle, from which plugins build
	 * the parts' `id`s (`IPluginBundle.createId`); the instance does not get it —
	 * ids are the document's business, not the core's. With a bundle not its
	 * own (`config.bundle`) the mount id is of whoever assembled the bundle.
	 */
	mountId?: string
	/**
	 * The subtree's locale — from the framework's nearest locale provider above:
	 * the Intl tag and the library's strings, with a change event. It goes to
	 * the own plugin bundle, as the mount id does (`IPluginBundle.locale`), and
	 * the language and names plugins write the tag and the button names from it,
	 * on assembly and on every change. The instance does not get it: the
	 * language is known by the component's place in the tree, not by the
	 * instance. Not given — the bundle has its own English one. With a bundle
	 * not its own (`config.bundle`) the locale is of whoever assembled it.
	 */
	locale?: ILocaleSource
}

/** What the own bundle takes from the mount: the mount id and the subtree's locale. */
export type TBundleMount = Pick<IAdapterContextOptions, 'mountId' | 'locale' | 'pluginOptions'>

export interface IAdapterContextConfig {
	/**
	 * A ready plugin bundle, passed by whoever assembled it (a collection
	 * adapter shares the component's bundle with the facade). Without it the
	 * bundle is assembled by the composition: the descriptor's plugins plus the
	 * application's registrations.
	 */
	bundle?: IPluginBundle | null
}

/**
 * The adapter context: the assembled component and its extensions.
 *
 * The parameter is the descriptor contract the context was assembled by
 * (`IComponentContract`). `createAdapterContext` infers it, and the adapters'
 * `useAdapter` takes from it the instance type and the plugins' outputs for
 * the state type (`TAdapterState`), so components write no generics.
 */
export interface IAdapterContext<C extends IComponentContract = IComponentContract> {
	/** A phantom field: absent at runtime, it only carries the contract in the type. */
	readonly __contract?: C
	readonly instance: C['instance']
	readonly bundle: IPluginBundle | null
	readonly descriptor: IComponentDescriptor
	/**
	 * The assembly props, until the first `connect()`: extensions read them in
	 * their constructors and the exchange starts its input memory from them.
	 * After `connect()` — `undefined`: the input memory lives in its own cells
	 * and the context lets the props go.
	 */
	readonly props: object | undefined
	/** The place's name if the component is a detail of another's markup (`IAdapterContextOptions.embedded`). */
	readonly embedded: string | undefined
	readonly events: TEvented<TAdapterEvents>

	/** Install an extension WITHOUT options. */
	use<T>(ExtensionCtor: IAdapterExtensionCtorNoOpts<T, C['instance']>): this
	/** Install an extension WITH required options. */
	use<T, TOpts>(
		ExtensionCtor: IAdapterExtensionCtor<T, TOpts, C['instance']>,
		options: TOpts,
	): this

	/** The installed extension of the given class. */
	get<T>(ctor: new (...args: any[]) => T): T | undefined

	/**
	 * Bind the markup's root node to the bundle's `TElementPlugin`; `null`
	 * unbinds. Without that plugin the call does nothing.
	 */
	bindElement(element: Element | null): void

	/**
	 * The value exchange with the framework, in its profile's names: state,
	 * inputs, events. The input memory starts from the assembly props; the
	 * assembly has already applied the initial values.
	 *
	 * One exchange per mount: the first call creates it and releases the
	 * assembly props, a repeat with the same profile returns it, another
	 * profile is an error.
	 */
	connect(profile: IAdapterProfile): TExchange

	/**
	 * The framework accepted the assembled component: from now on it is part of
	 * the live tree, not an assembly draft. Whatever writes into someone else's
	 * storage (an item entering its owner's collection) waits for `attach`.
	 * Called once, between assembly and `destroy()`, by the adapter's runtime,
	 * not by the component.
	 */
	attach(): void

	/**
	 * The framework began removing the component: the first moment of its
	 * teardown, before its children go. The context only reports it (the
	 * `detach` event); the adapter stops the consumer on it. A collection
	 * detaches its members too (`TCollectionMembers`): siblings leave one by
	 * one, and a member still heard would hear them go. Once: a repeat does
	 * nothing.
	 */
	detach(): void

	/** Destroy the context; detached first, if it was not. */
	destroy(): void
}

/**
 * Ownership of the plugin bundle: own (`TOwnBundle`) or shared
 * (`TSharedBundle`). Not a flag every user of the bundle checks: everything
 * that depends on it is done by one of the two objects.
 */
export interface IBundleTenancy {
	readonly bundle: IPluginBundle | null
	/**
	 * The exchange members from the bundle: the descriptor's plugins and, for
	 * an own bundle, the binding too. Built per call: the assembly and the
	 * exchange need them, the bundle does not keep them.
	 */
	members(): readonly TMember[]
	/** Which of the bundle's members (`members()`) this assembly writes initial values to. */
	seeded(members: readonly TMember[]): readonly TMember[]
	/** Finish the assembly after the initial values: registry plugins and announcing the bundle. */
	complete(): void
	destroy(): void
}
