/**
 * Shared initial-source capture and part resolution before component assembly.
 */
import { TCollectionAriaState } from './aria-state.class'
import type { TCollectionStatePort } from './aria-state.types'
import {
	TPluginMount,
	TTabsItemNamesPlugin,
	TTagsItemNamesPlugin,
	TTabsItemIdsPlugin,
	TCollectionInitialPartPlugin,
	TCollectionInitialPlugin,
} from '@soxa-ui/plugins'

import { TCollectionEngine } from '@soxa-ui/core'
import type {
	IAdapterContextOptions,
	IComponentDescriptor,
	TElevatorFactory,
} from '../../../protected'
import { ITEM_CONTEXT_ELEVATOR } from '../../../protected/adapter/elevator/keys'
import { COLLECTION_INITIAL_ELEVATOR } from './keys'
import { TCollectionInitialSource } from './initial-source.class'

/** Native adapters retain this object for their owner lifetime; absent input preserves legacy setup. */
export function createCollectionInitialSource(
	props: object,
	panelDefaultValue?: string | number,
): TCollectionInitialSource | undefined {
	const initial: unknown = Reflect.get(props, 'initial')

	if (initial === undefined) return undefined

	const engine: unknown = Reflect.get(props, 'engine')

	if (engine !== undefined && !(engine instanceof TCollectionEngine)) {
		throw new Error('Collection initial engine must be a collection engine.')
	}

	return new TCollectionInitialSource({
		initial,
		items: Reflect.get(props, 'items'),
		engine,
		panelDefaultValue,
	})
}

/** A foreign intervening owner masks the prepared source, exactly as it masks the item context. */
export function collectionInitialSourceOf(
	elevator: TElevatorFactory,
): TCollectionInitialSource | undefined {
	const source = elevator(COLLECTION_INITIAL_ELEVATOR).up()

	return source && source.engine === elevator(ITEM_CONTEXT_ELEVATOR).up() ? source : undefined
}

function rejectConflictingProps(props: object, names: readonly string[] = []): void {
	for (const name of new Set(['value', 'active', 'selected', 'id', ...names])) {
		if (Reflect.get(props, name) !== undefined) {
			throw new Error(`Collection initial parts take ${name} from their declared source.`)
		}
	}
}

/** Create one acceptance gate for this bundle's already-declared plugins. */
function preparedPluginOptions(
	descriptor: Pick<IComponentDescriptor, 'plugins'>,
	options: IAdapterContextOptions,
): NonNullable<IAdapterContextOptions['pluginOptions']> {
	const mount = new TPluginMount()
	const overrides = new Map<import('../../../protected').TPluginCtor, object | undefined>()

	for (const entry of options.pluginOptions ?? []) {
		if (
			overrides.has(entry.ctor) ||
			!descriptor.plugins.some((plugin) => plugin.ctor === entry.ctor)
		)
			throw new Error(
				'Mount installation options must name each declared plugin at most once.',
			)

		overrides.set(entry.ctor, entry.options)
	}

	return descriptor.plugins.map((plugin) =>
		plugin.with({ ...overrides.get(plugin.ctor), pluginMount: mount }),
	)
}

/** Overlay consumed/prepared inputs without evaluating native child or slot getters. */
function initialPropsView(props: object, overrides: object): object {
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

/** Consume the captured declaration and defer foreign plugin effects until mount acceptance. */
export function collectionInitialOwnerOptions<TInstance extends object>(
	descriptor: Pick<IComponentDescriptor, 'plugins'>,
	options: IAdapterContextOptions<TInstance>,
	source?: TCollectionInitialSource,
): IAdapterContextOptions<TInstance> {
	const props =
		options.props && Reflect.get(options.props, 'initial') !== undefined
			? initialPropsView(options.props, { initial: undefined })
			: options.props

	return source
		? { ...options, props, pluginOptions: preparedPluginOptions(descriptor, options) }
		: props === options.props
			? options
			: { ...options, props }
}

/** Resolve before creating the item context: the ordinal renders the existing data model. */
export function resolveCollectionInitialItem<TInstance extends object>(
	descriptor: Pick<IComponentDescriptor, 'ctor' | 'props' | 'plugins'> & {
		readonly ctor: new (...args: any[]) => TInstance
	},
	options: IAdapterContextOptions<TInstance>,
	elevator: TElevatorFactory,
): IAdapterContextOptions<TInstance> {
	const props = options.props ?? {}
	const requested: unknown = Reflect.get(props, 'initial')
	const source = collectionInitialSourceOf(elevator)
	const automatic = options.ctrl && source?.ordinal(options.ctrl)
	const ordinal: unknown =
		requested ?? (automatic !== undefined && automatic >= 0 ? automatic : undefined)

	if (ordinal === undefined) return options

	if (!source) throw new Error('Collection initial part needs its own prepared owner source.')

	rejectConflictingProps(
		props,
		descriptor.props
			.filter(
				(prop) =>
					!prop.protected &&
					!['ctrl', 'embedded', 'pluginProps', 'initial', 'tag'].includes(prop.name.name),
			)
			.map((prop) => prop.name.name),
	)

	const ctrl = source.item(ordinal, descriptor.ctor, options.ctrl)

	const id = source.source.items[Number(ordinal)].id
	const declaredId = typeof id === 'string' ? id : undefined
	const link = source.link(ctrl)
	const part = descriptor.plugins.find((plugin) => plugin.ctor === TCollectionInitialPartPlugin)
	const ids = descriptor.plugins.find((plugin) => plugin.ctor === TTabsItemIdsPlugin)

	if (!part) throw new Error('Collection initial part requires its declared input plugin.')

	const pluginOptions = [
		...(options.pluginOptions ?? []),
		part.with({ prepared: true, id: declaredId }),
		...(ids && link ? [ids.with({ initial: link })] : []),
	]

	return {
		...options,
		ctrl,
		props: initialPartProps(descriptor, props, declaredId),
		pluginOptions: preparedPluginOptions(descriptor, { ...options, pluginOptions }),
	}
}

/** Panel declarations supply their initial value and id; the panel remains outside membership. */
export function resolveCollectionInitialPanel<TInstance extends object>(
	descriptor: Pick<IComponentDescriptor, 'plugins'>,
	options: IAdapterContextOptions<TInstance>,
	elevator: TElevatorFactory,
): IAdapterContextOptions<TInstance> {
	const props = options.props ?? {}
	const ordinal: unknown = Reflect.get(props, 'initial')

	if (ordinal === undefined) return options

	const source = collectionInitialSourceOf(elevator)

	if (!source) throw new Error('Collection initial panel needs its own prepared owner source.')

	rejectConflictingProps(props)

	const panel = source.panel(ordinal)
	const part = descriptor.plugins.find((plugin) => plugin.ctor === TCollectionInitialPartPlugin)

	if (!part) throw new Error('Collection initial panel requires its declared input plugin.')

	if (
		options.ctrl &&
		panel.value !== undefined &&
		!Object.is(Reflect.get(options.ctrl, 'value'), panel.value)
	) {
		throw new Error('Collection initial panel and ctrl must have the same value.')
	}

	return {
		...options,
		props: initialPropsView(props, panel),
		pluginOptions: preparedPluginOptions(descriptor, {
			...options,
			pluginOptions: [
				...(options.pluginOptions ?? []),
				part.with({ prepared: true, panel: true, ...panel }),
			],
		}),
	}
}

/** Prepared data owns model inputs; native runtimes keep plugin/attribute inputs live. */
function initialPartProps(
	descriptor: Pick<IComponentDescriptor, 'props'>,
	props: object,
	id?: string,
	panel?: { value: string | number | undefined },
): object {
	const managed = new Set([
		'active',
		'selected',
		...descriptor.props
			.filter(
				(prop) =>
					!prop.protected &&
					!['ctrl', 'embedded', 'pluginProps'].includes(prop.name.name),
			)
			.map((prop) => prop.name.name),
	])

	return new Proxy(props, {
		get(target, key, receiver) {
			if (key === 'id') return id
			if (key === 'value' && panel) return panel.value

			return typeof key === 'string' && managed.has(key)
				? undefined
				: Reflect.get(target, key, receiver)
		},
		has(target, key) {
			return !(typeof key === 'string' && managed.has(key)) && Reflect.has(target, key)
		},
	})
}

/** Hide consumed inputs from subsequent exchanges so they cannot overwrite prepared models. */
export function collectionInitialInputs(
	context: Pick<import('../../../protected').IAdapterContext, 'descriptor' | 'bundle'>,
	props: object,
): object {
	if (
		context.bundle?.get(TCollectionInitialPlugin) &&
		Reflect.get(props, 'initial') !== undefined
	)
		return initialPropsView(props, { initial: undefined })

	const part = context.bundle?.get(TCollectionInitialPartPlugin)

	return part?.prepared
		? initialPartProps(
				context.descriptor,
				props,
				part.declaredId,
				part.panel ? { value: part.declaredValue } : undefined,
			)
		: props
}

/** All adapters read the same single derived ARIA port; no adapter merges relationships. */
export function collectionInitialState(
	context: import('../../../protected').IAdapterContext,
	state: TCollectionStatePort,
): TCollectionStatePort {
	if (!context.descriptor.props.some((prop) => prop.name.name === 'aria')) return state

	const ids = context.bundle?.get(TTabsItemIdsPlugin)
	const link = ids?.initial ? ids : context.bundle?.get(TCollectionInitialPartPlugin)?.aria
	const names =
		context.bundle?.get(TTabsItemNamesPlugin) ?? context.bundle?.get(TTagsItemNamesPlugin)
	const outputs = names?.pluginMount ? [names] : []

	return link || outputs.length ? new TCollectionAriaState({ state, link, outputs }) : state
}

/** Prepared assembly can render its full source before the native mount accepts it. */
export function collectionInitialPrepared(
	context: import('../../../protected').IAdapterContext,
): boolean {
	return Boolean(
		context.bundle?.get(TCollectionInitialPlugin)?.pluginMount ??
		context.bundle?.get(TCollectionInitialPartPlugin)?.pluginMount,
	)
}
