import {
	createAdapterContext,
	TCollectionPreparation,
	TCollectionPreparationLifetime,
	collectionPreparationConfig,
} from '@soxa-ui/setup'
import type {
	IAdapterContext,
	IAdapterContextConfig,
	IAdapterContextOptions,
	IComponentDescriptor,
	IPluginsContract,
	TContextContract,
} from '@soxa-ui/setup'
import { nearestLocale } from '../locale/context'
import { createWebcElevator } from '../elevator'

const preparationLifetimes = new WeakMap<Element, TCollectionPreparationLifetime>()

/**
 * Сборка элемента: локаль — ближайшего `<so-locale-provider>` вверх от хоста.
 * Зовётся на каждое подключение, поэтому переставленный элемент берёт локаль
 * нового места. Id монтирования не нужен: серверной разметки у Custom
 * Elements нет.
 */
export function createWebcAdapterContext<
	TInstance extends object,
	TPlugins extends IPluginsContract,
>(
	host: Element,
	descriptor: IComponentDescriptor<TContextContract<TInstance, TPlugins>>,
	options: IAdapterContextOptions<TInstance>,
	config?: IAdapterContextConfig,
): IAdapterContext<TContextContract<TInstance, TPlugins>> {
	return createAdapterContext(
		descriptor,
		{ ...options, locale: options.locale ?? nearestLocale(host) },
		collectionPreparationConfig(
			descriptor,
			config,
			() => new TCollectionPreparation(createWebcElevator(host), lifetimeOf(host)),
		),
	)
}

/** A host keeps its sources across reconnection and moves: the element is the native mount. */
function lifetimeOf(host: Element): TCollectionPreparationLifetime {
	let lifetime = preparationLifetimes.get(host)

	if (!lifetime) {
		lifetime = new TCollectionPreparationLifetime()
		preparationLifetimes.set(host, lifetime)
	}

	return lifetime
}
