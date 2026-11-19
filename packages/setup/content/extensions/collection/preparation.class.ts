/**
 * Collection input preparation shared by native adapters, before context construction.
 */
import { TCollectionInitialPartPlugin, TCollectionInitialPlugin } from '@soxa-ui/plugins'
import { preparationOf, TPreparationExtension } from '@soxa-ui/core'
import type { ICollectionTransaction } from '@soxa-ui/core'
import type { IPluginBundle } from '@soxa-ui/plugins'

import type {
	IAdapterPreparation,
	IAdapterContext,
	IAdapterContextConfig,
	IAdapterContextOptions,
	IPreparedAssembly,
	TContextContract,
} from '../../../protected/adapter/context'
import type { IComponentDescriptor, IPluginsContract } from '../../../protected/define'
import type { TElevatorFactory } from '../../../protected/adapter/elevator'
import {
	collectionInitialOwnerOptions,
	collectionInitialSourceOf,
	createCollectionInitialSource,
	resolveCollectionInitialItem,
	resolveCollectionInitialPanel,
} from './initial'
import type { TInitialPropsNormalizer } from './initial.types'
import { collectionInitialInputs } from './initial-inputs'
import type { TCollectionInitialSource } from './initial-source.class'

/** The prepared source of an owner, by the owner's bundle: its facade shares that bundle. */
const sources = new WeakMap<IPluginBundle, TCollectionInitialSource>()

/** Sources survive native reassembly, but are never shared across native mounts. */
export class TCollectionPreparationLifetime {
	private _sources?: Map<number, TCollectionInitialSource | undefined>

	/** Capture each assembly position once, including the absence of an initial declaration. */
	get(
		index: number,
		props: object,
		panelDefaultValue?: string | number,
	): TCollectionInitialSource | undefined {
		const sources = (this._sources ??= new Map())

		if (!sources.has(index)) {
			sources.set(index, createCollectionInitialSource(props, panelDefaultValue))
		}

		return sources.get(index)
	}
}

/** A facade shares the source of its own bundle, not a process-global current owner. */
export function collectionPreparedSource(
	bundle: IPluginBundle | null | undefined,
): TCollectionInitialSource | undefined {
	return bundle ? sources.get(bundle) : undefined
}

/** Unrelated components and unprepared shared facades keep the ordinary assembly path. */
export function collectionNeedsPreparation(
	descriptor: IComponentDescriptor,
	config?: IAdapterContextConfig,
): boolean {
	if (config?.bundle !== undefined) {
		return Boolean(
			collectionPreparedSource(config.bundle) ||
			config.bundle?.get(TCollectionInitialPartPlugin)?.prepared,
		)
	}

	return descriptor.plugins.some(
		(plugin) =>
			plugin.ctor === TCollectionInitialPlugin ||
			plugin.ctor === TCollectionInitialPartPlugin,
	)
}

/** The panel lookup default an owner descriptor declares on its initial plugin. */
function panelDefaultOf(options: object | undefined): string | number | undefined {
	const value: unknown = options && Reflect.get(options, 'panelDefaultValue')

	return typeof value === 'string' || typeof value === 'number' ? value : undefined
}

/** Resolves owner, item and panel inputs before assembly; temporary views share one receipt. */
export class TCollectionPreparation implements IAdapterPreparation {
	private _ownerIndex = 0
	private _source?: TCollectionInitialSource

	constructor(
		private readonly _elevator: TElevatorFactory,
		private readonly _lifetime?: TCollectionPreparationLifetime,
		private readonly _normalize?: TInitialPropsNormalizer,
	) {}

	/**
	 * One receipt owns the whole native assembly, including its shared facades.
	 * Only an assembly that met a prepared source gets one.
	 */
	pending(
		contexts: readonly IAdapterContext[],
		rollback: () => void,
	): ICollectionTransaction | undefined {
		const engine = this._source?.engine
		const context = contexts[0]

		if (!engine || !context) return

		if (!preparationOf(engine)) engine.use(new TPreparationExtension())

		// The deadline cleans up abandoned views; it does not delay or complete server rendering.
		return preparationOf(engine)?.prepare({ timeout: 1000, rollback })
	}

	prepare<TInstance extends object, TPlugins extends IPluginsContract>(
		descriptor: IComponentDescriptor<TContextContract<TInstance, TPlugins>>,
		options: IAdapterContextOptions<TInstance>,
		config: IAdapterContextConfig,
	): IPreparedAssembly<TInstance, TPlugins> {
		if (config.bundle !== undefined)
			return this._prepareFacade(descriptor, options, config.bundle)

		const owner = descriptor.plugins.find((plugin) => plugin.ctor === TCollectionInitialPlugin)

		if (owner) return this._prepareOwner(options, panelDefaultOf(owner.options))

		const part = descriptor.plugins.find(
			(plugin) => plugin.ctor === TCollectionInitialPartPlugin,
		)

		if (!part) return { options }

		const resolve =
			part.options && Reflect.get(part.options, 'panel') === true
				? resolveCollectionInitialPanel
				: resolveCollectionInitialItem
		const resolved = resolve(descriptor, options, this._elevator, this._normalize)

		// An unprepared part keeps its options: nothing to record for the receipt
		if (resolved === options) return { options }

		return {
			options: resolved,
			complete: () => {
				this._source = collectionInitialSourceOf(this._elevator)
			},
		}
	}

	/** Facades inherit prepared inputs and the engine from their component's bundle. */
	private _prepareFacade<TInstance extends object, TPlugins extends IPluginsContract>(
		descriptor: IComponentDescriptor<TContextContract<TInstance, TPlugins>>,
		options: IAdapterContextOptions<TInstance>,
		bundle: IPluginBundle | null,
	): IPreparedAssembly<TInstance, TPlugins> {
		const source = collectionPreparedSource(bundle)

		if (source) this._source = source

		return {
			options: {
				...options,
				props: collectionInitialInputs({ descriptor, bundle }, options.props ?? {}),
				...(source?.engine
					? { options: { ...options.options, engine: source.engine } }
					: {}),
			},
		}
	}

	/** Capture the owner's declaration once per native mount position. */
	private _prepareOwner<TInstance extends object, TPlugins extends IPluginsContract>(
		options: IAdapterContextOptions<TInstance>,
		panelDefault: string | number | undefined,
	): IPreparedAssembly<TInstance, TPlugins> {
		const props = options.props ?? {}
		const source = this._lifetime
			? this._lifetime.get(this._ownerIndex++, props, panelDefault)
			: createCollectionInitialSource(props, panelDefault)

		return {
			options: collectionInitialOwnerOptions(options, source),
			complete: (context) => {
				if (!source || !context.bundle) return

				sources.set(context.bundle, source)
				this._source = source
			},
		}
	}
}

/**
 * The assembly config with the shared collection preparation, when the
 * descriptor takes part in one. Every adapter wires it here, so an unrelated
 * component keeps its config object untouched.
 */
export function collectionPreparationConfig(
	descriptor: IComponentDescriptor,
	config: IAdapterContextConfig | undefined,
	create: () => TCollectionPreparation,
): IAdapterContextConfig | undefined {
	if (config?.preparation || !collectionNeedsPreparation(descriptor, config)) return config

	return { ...config, preparation: create() }
}
