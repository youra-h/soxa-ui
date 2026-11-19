/**
 * Prepared collection assembly: capture the owner's declared source and
 * resolve its parts before their contexts are constructed.
 */
import { TCollectionInitialPartPlugin, TPluginMount, TTabsItemIdsPlugin } from '@soxa-ui/plugins'
import { TCollectionEngine } from '@soxa-ui/core'

import type {
	IAdapterContextOptions,
	IComponentDescriptor,
	IPluginDefinition,
	TElevatorFactory,
} from '../../../protected'
import { ITEM_CONTEXT_ELEVATOR } from '../../../protected/adapter/elevator/keys'
import { COLLECTION_INITIAL_ELEVATOR } from './keys'
import { TCollectionInitialSource } from './initial-source.class'
import { HIDDEN_INITIAL, initialPropsView, partInputNames, partProps } from './initial-inputs'
import type { TInitialPropsNormalizer } from './initial.types'

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

/** Consume the captured declaration; a prepared owner gates foreign plugin effects until acceptance. */
export function collectionInitialOwnerOptions<TInstance extends object>(
	options: IAdapterContextOptions<TInstance>,
	source?: TCollectionInitialSource,
): IAdapterContextOptions<TInstance> {
	const props =
		options.props && Reflect.get(options.props, 'initial') !== undefined
			? initialPropsView(options.props, HIDDEN_INITIAL)
			: options.props

	if (source) return { ...options, props, pluginMount: new TPluginMount() }

	return props === options.props ? options : { ...options, props }
}

/**
 * Resolve before creating the item context: the ordinal renders the existing
 * data model. An item without an ordinal, explicit or by its prepared `ctrl`,
 * keeps its options untouched.
 */
export function resolveCollectionInitialItem<TInstance extends object>(
	descriptor: Pick<IComponentDescriptor, 'ctor' | 'props' | 'plugins'> & {
		readonly ctor: new (...args: any[]) => TInstance
	},
	options: IAdapterContextOptions<TInstance>,
	elevator: TElevatorFactory,
	normalize?: TInitialPropsNormalizer,
): IAdapterContextOptions<TInstance> {
	const requested: unknown = options.props && Reflect.get(options.props, 'initial')
	const source = collectionInitialSourceOf(elevator)
	// A data item rendered from the prepared source carries its model as `ctrl`
	const ordinal = requested ?? (options.ctrl ? source?.ordinal(options.ctrl) : undefined)

	if (ordinal === undefined) return options

	if (!source) throw new Error('Collection initial part needs its own prepared owner source.')

	const props = normalize ? normalize(options.props ?? {}) : (options.props ?? {})

	rejectConflictingProps(props, partInputNames(descriptor))

	const ctrl = source.item(ordinal, descriptor.ctor, options.ctrl)
	const id = source.declaredId(ordinal)
	const link = source.link(ctrl)
	const ids = link && descriptor.plugins.find((plugin) => plugin.ctor === TTabsItemIdsPlugin)

	return {
		...options,
		ctrl,
		props: partProps(descriptor, props, id),
		pluginMount: new TPluginMount(),
		pluginOptions: [
			...(options.pluginOptions ?? []),
			partPlugin(descriptor).with({ prepared: true, id }),
			...(ids ? [ids.with({ initial: link })] : []),
		],
	}
}

/** Panel declarations supply their initial value and id; the panel remains outside membership. */
export function resolveCollectionInitialPanel<TInstance extends object>(
	descriptor: Pick<IComponentDescriptor, 'plugins'>,
	options: IAdapterContextOptions<TInstance>,
	elevator: TElevatorFactory,
	normalize?: TInitialPropsNormalizer,
): IAdapterContextOptions<TInstance> {
	const ordinal: unknown = options.props && Reflect.get(options.props, 'initial')

	if (ordinal === undefined) return options

	const source = collectionInitialSourceOf(elevator)

	if (!source) throw new Error('Collection initial panel needs its own prepared owner source.')

	const props = normalize ? normalize(options.props ?? {}) : (options.props ?? {})

	rejectConflictingProps(props)

	const panel = source.panel(ordinal)

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
		pluginMount: new TPluginMount(),
		pluginOptions: [
			...(options.pluginOptions ?? []),
			partPlugin(descriptor).with({ prepared: true, panel: true, ...panel }),
		],
	}
}

/** The part's declared input carrier; a prepared part without it is a descriptor error. */
function partPlugin(descriptor: Pick<IComponentDescriptor, 'plugins'>): IPluginDefinition {
	const part = descriptor.plugins.find((plugin) => plugin.ctor === TCollectionInitialPartPlugin)

	if (!part) throw new Error('Collection initial part requires its declared input plugin.')

	return part
}

/** The declaration owns identity and state: the same input from the framework is an error. */
function rejectConflictingProps(props: object, managed?: ReadonlySet<string>): void {
	for (const name of ['value', 'active', 'selected', 'id']) {
		if (Reflect.get(props, name) !== undefined) throw conflict(name)
	}

	for (const name of managed ?? []) {
		if (name !== 'initial' && name !== 'tag' && Reflect.get(props, name) !== undefined) {
			throw conflict(name)
		}
	}
}

function conflict(name: string): Error {
	return new Error(`Collection initial parts take ${name} from their declared source.`)
}
