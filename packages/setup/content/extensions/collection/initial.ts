/**
 * Shared initial-source capture and part resolution before component assembly.
 */
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

/** Resolve before creating the item context: the ordinal renders the existing data model. */
export function resolveCollectionInitialItem<TInstance extends object>(
	descriptor: Pick<IComponentDescriptor, 'ctor' | 'props'> & {
		readonly ctor: new (...args: any[]) => TInstance
	},
	options: IAdapterContextOptions<TInstance>,
	elevator: TElevatorFactory,
): IAdapterContextOptions<TInstance> {
	const props = options.props ?? {}
	const ordinal: unknown = Reflect.get(props, 'initial')

	if (ordinal === undefined) return options

	const source = collectionInitialSourceOf(elevator)

	if (!source) throw new Error('Collection initial part needs its own prepared owner source.')

	rejectConflictingProps(
		props,
		descriptor.props
			.filter(
				(prop) =>
					!prop.protected &&
					!['ctrl', 'embedded', 'pluginProps', 'initial'].includes(prop.name.name),
			)
			.map((prop) => prop.name.name),
	)

	const ctrl = source.item(ordinal, descriptor.ctor, options.ctrl)

	return { ...options, ctrl }
}

/** Panel declarations supply their initial value and id; the panel remains outside membership. */
export function resolveCollectionInitialPanel<TInstance extends object>(
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

	if (
		options.ctrl &&
		panel.value !== undefined &&
		!Object.is(Reflect.get(options.ctrl, 'value'), panel.value)
	) {
		throw new Error('Collection initial panel and ctrl must have the same value.')
	}

	return { ...options, props: { ...props, ...panel } }
}
