/**
 * A per-assembly preparation stage, before any model or plugin is constructed.
 */
import type { IComponentDescriptor, IPluginsContract } from '../../define'
import type {
	IAdapterContext,
	IAdapterContextConfig,
	IAdapterContextOptions,
	TContextContract,
} from './types'

export interface IPreparedAssembly<TInstance extends object, TPlugins extends IPluginsContract> {
	readonly options: IAdapterContextOptions<TInstance>
	/** Records mount-local results after construction; it does not accept the mount. */
	readonly complete?: (context: IAdapterContext<TContextContract<TInstance, TPlugins>>) => void
}

export interface IAdapterPreparation {
	prepare<TInstance extends object, TPlugins extends IPluginsContract>(
		descriptor: IComponentDescriptor<TContextContract<TInstance, TPlugins>>,
		options: IAdapterContextOptions<TInstance>,
		config: IAdapterContextConfig,
	): IPreparedAssembly<TInstance, TPlugins>
}
