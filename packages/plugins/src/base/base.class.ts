import type { IListenable, IPlugin, IPluginContext, TPluginEvents } from './types'
import { TEvented } from '@soxa-ui/core'
import type { TEventSink } from '@soxa-ui/core'
import type { TPluginMount } from './mount.class'

export abstract class TBasePlugin<
	TInstance = any,
	TEvents extends TPluginEvents = TPluginEvents,
> implements IPlugin<TInstance, TEvents> {
	readonly events: TEvented<TEvents> = new TEvented<TEvents>()

	/**
	 * Отписки от чужих шин, на которые плагин подписался через
	 * {@link _listenTo}. Их снимает `destroy()` — тот же приём, что `_relays`
	 * у `TEvented.relay`.
	 */
	private _unsubscribes: (() => void)[] = []
	private _pluginMount: TPluginMount | undefined
	/** A deferred effect of a destroyed plugin must not start at acceptance. */
	private _destroyed = false

	/** The acceptance gate of a prepared mount (`IPluginContext.pluginMount`). */
	get pluginMount(): TPluginMount | undefined {
		return this._pluginMount
	}

	install(ctx: IPluginContext, options?: unknown): void {
		this._pluginMount = ctx.pluginMount

		this._sink.emit('install', ctx, options)
	}

	/** Run the internal creation announcement after the bundle becomes available. */
	created(): void {
		this._sink.emit('create', this)
	}

	/**
	 * Снимает подписки {@link _listenTo} и сообщает об уничтожении. Список
	 * очищается, поэтому повторный вызов отписываться уже не будет.
	 */
	destroy(): void {
		this._destroyed = true

		for (const unsubscribe of this._unsubscribes) unsubscribe()

		this._unsubscribes = []
		this._sink.emit('destroy')
	}

	/**
	 * Эмит собственных событий базы — без приведения `this.events` к
	 * конкретной карте (см. `TEventSink` в `@soxa-ui/core`). Эмит звучит за
	 * счёт констрейнта: карта наследника включает `TPluginEvents`.
	 */
	protected get _sink(): TEventSink<TPluginEvents> {
		return this.events
	}

	/**
	 * Подписаться на шину, которая живёт дольше плагина: подписку снимет
	 * `destroy()`.
	 *
	 * Такая шина — у владельца (`ctx.getInstance()`): свой `ctrl` приложения
	 * переживает перемонтирование, и каждое монтирование ставит ему новый набор.
	 * Такие же — у расширений движка коллекции, когда движок пришёл снаружи
	 * (`engine`), и у любого инстанса ядра, которого плагин не создавал.
	 * Подписка прямым `on` копила бы на них обработчики уничтоженных плагинов.
	 *
	 * На шину плагина — своего набора (`ctx.get(...)`) или набора элемента —
	 * подписываются прямым `on`: она умирает вместе с набором.
	 *
	 * Метод, а не пара `on`/`off` в каждом плагине: той паре нужно поле под
	 * каждый обработчик, а забытый `off` не виден — обработчик уничтоженного
	 * плагина ничего не делает, и шина копит его молча.
	 *
	 * Шины нет (у набора нет владельца, у движка нет расширения) —
	 * подписываться не на что. Имя события и обработчик сверяются по карте
	 * шины, как у `TEvented.on`.
	 *
	 * `TEvented` в типе шины — ради вывода карты, а не второй вид шины: из
	 * `TEvented<X>` в `IListenable` TypeScript карту не выводит (методы у
	 * `IListenable` обобщённые), а из `TEvented<X>` в `TEvented` — выводит.
	 * `IListenable` нужен шине владельца, которого плагин знает по контракту
	 * (`TListHeightPlugin`).
	 */
	protected _listenTo<
		TSource extends Record<string, (...args: any) => any>,
		K extends keyof TSource,
	>(
		source: TEvented<TSource> | IListenable<TSource> | null | undefined,
		event: K,
		handler: TSource[K],
	): void {
		if (!source) return

		// A prepared mount subscribes once accepted; the deferred call takes the direct path then
		if (this._pluginMount && !this._pluginMount.accepted) {
			this._pluginMount.defer(() => {
				if (!this._destroyed) this._listenTo(source, event, handler)
			})

			return
		}

		source.on(event, handler)
		this._unsubscribes.push(() => source.off(event, handler))
	}

	/**
	 * Run a foreign effect now, or at acceptance of a prepared mount, whose
	 * assembly may still be discarded. The returned release runs on `destroy()`.
	 */
	protected _whenAccepted(effect: () => void | (() => void)): void {
		if (this._pluginMount && !this._pluginMount.accepted) {
			this._pluginMount.defer(() => {
				if (!this._destroyed) this._whenAccepted(effect)
			})

			return
		}

		const release = effect()

		if (release) this._unsubscribes.push(release)
	}
}
