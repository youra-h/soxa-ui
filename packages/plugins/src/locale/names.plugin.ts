import { TBasePlugin } from '../base'
import type { IPluginContext, TPluginEvents } from '../base'
import type { TTranslations } from './types'

/**
 * TNamesPlugin — база плагинов имён (неймспейс `names`): строки локали в
 * наборы компонента.
 *
 * Имена кнопок без текста — закрыть, развернуть, листать, очистить — строки
 * языка, а язык знает место компонента в дереве, а не экземпляр: локаль
 * приходит от провайдера адаптера в контекст плагина (`ctx.locale`), как id
 * монтирования приходит в `createId`. Поэтому ядро имён не строит — оно
 * держит живые наборы частей (`closeAria`, `prevAria`…) и пишет в них то, что
 * знает само (`tabindex`, `aria-pressed`), а имя пишет плагин имён своего
 * компонента: при установке, синхронно, — имена на языке приложения есть уже
 * в первой и серверной отрисовке, — и на каждую смену локали, на лету.
 *
 * База держит то, что у всех плагинов имён одно: владельца, первую запись и
 * подписку на смену локали. Наследник пишет имена (`_name`) и, если имя
 * зависит от свойства владельца — текста таба, имени поля, — подписывается на
 * его смену (`_watch`). Подписки живут, пока жив набор: их снимает
 * `destroy()` базы.
 */
export abstract class TNamesPlugin<
	TOwner extends object,
	TEvents extends TPluginEvents = TPluginEvents,
> extends TBasePlugin<TOwner, TEvents> {
	private _snapshot: Readonly<Record<string, Readonly<Record<string, unknown>>>> = Object.freeze(
		{},
	)
	private readonly _listeners = new Set<() => void>()

	getSnapshot(): Readonly<Record<string, Readonly<Record<string, unknown>>>> {
		return this._snapshot
	}
	subscribe(listener: () => void): () => void {
		this._listeners.add(listener)

		return () => this._listeners.delete(listener)
	}

	/** Prepared mounts name their own DOM without changing a shared data model. */
	protected _setName(
		field: string,
		target: { add(name: 'aria-label', value: string): unknown },
		label: string,
	): void {
		if (!this.pluginMount) {
			target.add('aria-label', label)

			return
		}

		if (this._snapshot[field]?.['aria-label'] === label) return

		this._snapshot = Object.freeze({
			...this._snapshot,
			[field]: Object.freeze({ 'aria-label': label }),
		})

		for (const listener of this._listeners) listener()
	}

	override destroy(): void {
		this._listeners.clear()

		super.destroy()
	}

	override install(ctx: IPluginContext, options?: unknown): void {
		super.install(ctx, options)

		const owner = ctx.getInstance<TOwner>()

		if (!owner) return

		const name = (): void => this._name(owner, ctx.locale.locale.translations)

		name()
		this._listenTo(ctx.locale.events, 'change', name)
		this._watch(owner, name, ctx)

		// The shared model may have changed while this mount was waiting for acceptance.
		if (this.pluginMount) this._whenAccepted(name)
	}

	/** Записать имена владельцу по строкам локали. */
	protected abstract _name(owner: TOwner, translations: TTranslations): void

	/**
	 * Свои поводы переписать имена сверх смены локали — смена свойства
	 * владельца, из которого собрано имя. По умолчанию их нет.
	 */
	protected _watch(_owner: TOwner, _name: () => void, _ctx: IPluginContext): void {}
}
