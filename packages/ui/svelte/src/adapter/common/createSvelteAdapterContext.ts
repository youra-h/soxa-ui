import { createAdapterContext } from '@soxa-ui/setup'
import type {
	IAdapterContext,
	IAdapterContextConfig,
	IAdapterContextOptions,
	IComponentDescriptor,
	IPluginsContract,
	TContextContract,
} from '@soxa-ui/setup'
import { nearestLocale } from '../locale/context'

/** Опции `createAdapterContext`, но id монтирования обязателен: забытый ловят типы. */
export type TSvelteAdapterContextOptions<TInstance extends object> =
	IAdapterContextOptions<TInstance> & { mountId: string }

/**
 * Сборка компонента Svelte, как `createVueAdapterContext` у Vue: id
 * монтирования — `$props.id()` компонента, локаль — ближайшего
 * `LocaleProvider`. Зовётся при инициализации компонента.
 * AGENTS.md (Svelte), «Сборка компонента».
 */
export function createSvelteAdapterContext<
	TInstance extends object,
	TPlugins extends IPluginsContract,
>(
	descriptor: IComponentDescriptor<TContextContract<TInstance, TPlugins>>,
	options: TSvelteAdapterContextOptions<TInstance>,
	config?: IAdapterContextConfig,
): IAdapterContext<TContextContract<TInstance, TPlugins>> {
	return createAdapterContext(
		descriptor,
		{ ...options, locale: options.locale ?? nearestLocale() },
		config,
	)
}
