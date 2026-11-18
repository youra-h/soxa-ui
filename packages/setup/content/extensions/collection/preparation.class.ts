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
	collectionInitialInputs,
	collectionInitialOwnerOptions,
	createCollectionInitialSource,
	resolveCollectionInitialItem,
	resolveCollectionInitialPanel,
	collectionInitialSourceOf,
} from './initial'
import type { TCollectionInitialSource } from './initial-source.class'

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

/** Resolves owner, item and panel inputs before assembly; temporary views share one receipt. */
export class TCollectionPreparation implements IAdapterPreparation {
	private _ownerIndex = 0
	private _source?: TCollectionInitialSource

	constructor(
		private readonly _elevator: TElevatorFactory,
		private readonly _lifetime?: TCollectionPreparationLifetime,
		private readonly _normalize: (props: object) => object = (props) => props,
	) {}

	/** One receipt owns the whole native assembly, including its shared facades. */
	pending(
		contexts: readonly IAdapterContext[],
		rollback: () => void,
	): ICollectionTransaction | undefined {
		const engine = this._source?.engine
		const context = contexts[0]

		if (!engine || !context) return

		let preparation = preparationOf(engine)

		if (!preparation) {
			engine.use(new TPreparationExtension())
			preparation = preparationOf(engine)
		}

		// The deadline cleans up abandoned views; it does not delay or complete server rendering.
		return preparation?.prepare(context.instance, {
			owner: context,
			timeout: 1000,
			rollback,
		})
	}

	prepare<TInstance extends object, TPlugins extends IPluginsContract>(
		descriptor: IComponentDescriptor<TContextContract<TInstance, TPlugins>>,
		options: IAdapterContextOptions<TInstance>,
		config: IAdapterContextConfig,
	): IPreparedAssembly<TInstance, TPlugins> {
		// Facades inherit prepared inputs from their component's bundle.
		if (config.bundle !== undefined) {
			const source = collectionPreparedSource(config.bundle)

			if (source) this._source = source

			return {
				options: {
					...options,
					props: collectionInitialInputs(
						{ descriptor, bundle: config.bundle },
						options.props ?? {},
					),
					...(source?.engine
						? { options: { ...options.options, engine: source.engine } }
						: {}),
				},
			}
		}

		const owner = descriptor.plugins.find((plugin) => plugin.ctor === TCollectionInitialPlugin)

		if (owner) {
			const defaultValue: unknown =
				owner.options && Reflect.get(owner.options, 'panelDefaultValue')
			const panelDefault =
				typeof defaultValue === 'string' || typeof defaultValue === 'number'
					? defaultValue
					: undefined

			const source = this._lifetime
				? this._lifetime.get(this._ownerIndex++, options.props ?? {}, panelDefault)
				: createCollectionInitialSource(options.props ?? {}, panelDefault)

			return {
				options: collectionInitialOwnerOptions(descriptor, options, source),
				complete: (context) => {
					if (source && context.bundle) {
						sources.set(context.bundle, source)
						this._source = source
					}
				},
			}
		}

		const part = descriptor.plugins.find(
			(plugin) => plugin.ctor === TCollectionInitialPartPlugin,
		)

		if (!part) return { options }

		const inputs = { ...options, props: this._normalize(options.props ?? {}) }

		return {
			options:
				part.options && Reflect.get(part.options, 'panel') === true
					? resolveCollectionInitialPanel(descriptor, inputs, this._elevator)
					: resolveCollectionInitialItem(descriptor, inputs, this._elevator),
			complete: (context) => {
				if (context.bundle?.get(TCollectionInitialPartPlugin)?.prepared) {
					this._source = collectionInitialSourceOf(this._elevator)
				}
			},
		}
	}
}
