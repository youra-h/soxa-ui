/**
 * Owns the descriptor and registered plugins for one mount.
 * Announces bundle:create on a microtask before running plugin created() hooks.
 * A destroyed bundle is never announced; nodes are detached before destruction.
 */

import type { IEventEmitter } from '@soxa-ui/core'
import { TElementPlugin, TPluginBundle } from '@soxa-ui/plugins'
import type { IPluginBundle } from '@soxa-ui/plugins'
import { PLUGIN_PROPS } from '../../naming'
import { resolveRegisteredPlugins } from '../../registry'
import type { IBundleContext, IComponentDescriptor, TPluginCtor } from '../../define'
import { TMember } from '../exchange/member.class'
import type { IMemberSpec } from '../exchange/types'
import { TExternalPlugins } from './external-plugins.class'
import type { IBundleTenancy, TBundleMount } from './types'

function hasEmit(value: unknown): value is Pick<IEventEmitter, 'emit'> {
	return (
		typeof value === 'object' &&
		value !== null &&
		'emit' in value &&
		typeof value.emit === 'function'
	)
}

type TBundleDescriptor = Pick<IComponentDescriptor, 'ctor' | 'plugins' | 'props'>

const externalSpecs = new WeakMap<TBundleDescriptor, IMemberSpec>()
const ownPlugins = new WeakMap<TBundleDescriptor, ReadonlySet<TPluginCtor>>()

/**
 * Описание участника-связки: `pluginProps` — с умолчанием от класса его
 * владельца, как у любого другого пропа. Одно на дескриптор, а не пересчёт на
 * каждое монтирование: по нему обмен находит таблицу маршрутов своего типа.
 */
function externalSpecOf(descriptor: TBundleDescriptor): IMemberSpec {
	let spec = externalSpecs.get(descriptor)

	if (!spec) {
		spec = Object.freeze({
			props: Object.freeze(
				descriptor.props
					.filter((prop) => prop.name.name === PLUGIN_PROPS)
					.map((prop) => prop.rebase(TExternalPlugins.defaultValues)),
			),
			events: [],
		})
		externalSpecs.set(descriptor, spec)
	}

	return spec
}

/** Классы плагинов дескриптора — один набор на дескриптор, а не на монтирование. */
function ownPluginsOf(descriptor: TBundleDescriptor): ReadonlySet<TPluginCtor> {
	let own = ownPlugins.get(descriptor)

	if (!own) {
		own = new Set(descriptor.plugins.map((plugin) => plugin.ctor))
		ownPlugins.set(descriptor, own)
	}

	return own
}

export class TOwnBundle implements IBundleTenancy {
	readonly bundle: IPluginBundle

	private readonly _external: TExternalPlugins

	constructor(
		private readonly _descriptor: TBundleDescriptor,
		private readonly _instance: object,
		private readonly _context: IBundleContext,
		mount: TBundleMount = {},
	) {
		const bundle = new TPluginBundle(_instance, mount.mountId, mount.locale)

		const options = new Map<TPluginCtor, object>()

		// Validate all mount overrides before installing any descriptor plugin.
		for (const entry of mount.pluginOptions ?? []) {
			if (!ownPluginsOf(_descriptor).has(entry.ctor) || options.has(entry.ctor)) {
				throw new Error(
					'Mount installation options must name each declared plugin at most once.',
				)
			}

			options.set(entry.ctor, entry.options ?? {})
		}

		for (const plugin of _descriptor.plugins) {
			const input = options.get(plugin.ctor)

			bundle.use(
				plugin.ctor,
				input ? { ...plugin.options, ...input } : (plugin.options ?? {}),
			)
		}

		this.bundle = bundle
		this._external = new TExternalPlugins(bundle, _instance, ownPluginsOf(_descriptor))
	}

	members(): readonly TMember[] {
		return [
			...this._descriptor.plugins.flatMap((plugin) => {
				const owner = this.bundle.get(plugin.ctor)

				// Описание участника-плагина — его определение: одно на тип
				return owner ? [new TMember(owner, plugin)] : []
			}),
			// Связка — такой же участник: её свойство `pluginProps` пишет обычная линия
			new TMember(this._external, externalSpecOf(this._descriptor)),
		]
	}

	/** Своим плагинам и связке начальные значения пишет эта сборка. */
	seeded(members: readonly TMember[]): readonly TMember[] {
		return members
	}

	complete(): void {
		for (const plugin of resolveRegisteredPlugins(this._instance, this._context)) {
			if (this._descriptor.plugins.some((own) => own.ctor === plugin.ctor)) {
				throw new Error(
					`${plugin.ctor.name} уже входит в состав ${this._descriptor.ctor.name}: плагин реестра только добавляет`,
				)
			}

			this.bundle.use(plugin.ctor, plugin.options ?? {})
		}

		this._announce()
	}

	destroy(): void {
		this._external.destroy()

		const element = this.bundle.get(TElementPlugin)

		if (element) element.element = null

		this.bundle.destroy()
	}

	private _announce(): void {
		const { bundle } = this

		void Promise.resolve().then(() => {
			if (bundle.destroyed) return

			const events: unknown = Reflect.get(this._instance, 'events')

			if (hasEmit(events)) events.emit('bundle:create', bundle)

			bundle.created()
		})
	}
}
