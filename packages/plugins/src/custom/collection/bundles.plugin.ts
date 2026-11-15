import { batchOf, plainOf } from '@soxa-ui/core'
import { TBasePlugin } from '../../base'
import type { IPluginBundle } from '../../base'
import type { IComponentView, TCollectionEngine } from '@soxa-ui/core'
import type { TBundlesEvents } from './types'

/**
 * TCollectionBundlesPlugin — реестр plugin-bundles элементов коллекции.
 *
 * Держит ссылку на коллекцию (`engine`), поэтому любой плагин имеет доступ
 * ко всему состоянию коллекции (активный элемент, порядок, элементы) без костылей
 * для каждого отдельного свойства.
 *
 * Накапливает ТОЛЬКО bundles: Map<uid, IPluginBundle>. Реестр синхронизируется с
 * жизненным циклом элементов коллекции через события `plain` (`item:removed`, `reset`).
 * Порядок bundles всегда берётся из коллекции, поэтому `item:moved` не требует
 * дополнительной обработки.
 *
 * Запись живёт, пока набор элемента в документе, и о каждой снятой записи
 * реестр сообщает `bundle:unregistered` — кончилось ли монтирование элемента
 * из данных (`release`) или элемент ушёл из коллекции: убран из данных, снят
 * из разметки, коллекцию очистили. Иначе подписчик, который держит что-то за
 * набором элемента (ссылку `aria-activedescendant` на его `id`, наблюдатель
 * его узла), узнавал бы только об одном из путей.
 *
 * Устанавливается на owner-компоненте коллекции (например, Tabs). Коллекция
 * привязывается через {@link bindEngine} из adapter-слоя после её создания.
 */
export class TCollectionBundlesPlugin extends TBasePlugin<any, TBundlesEvents> {
	private _engine: TCollectionEngine<any, any> | null = null
	private readonly _bundles = new Map<string | number, IPluginBundle>()

	/** Привязать коллекцию. Вызывается adapter-слоем после создания коллекции. */
	bindEngine(engine: TCollectionEngine<any, any>): void {
		if (this._engine === engine) return

		this._engine = engine

		this._whenAccepted(() => {
			const plain = plainOf<IComponentView>(engine)

			// Синхронизация реестра bundles с жизненным циклом элементов коллекции:
			// элемент ушёл — его запись снимается тем же путём, что и кончившееся
			// монтирование, с `bundle:unregistered`
			this._listenTo(plain?.events, 'item:removed', (e) => {
				const uid = this._uid(e.item)

				if (uid !== undefined && this._bundles.has(uid)) this.unregister(uid)
			})

			// Очистка шлёт `item:removed` каждому элементу раньше `reset`: к нему
			// остаются только записи, чьих элементов в коллекции не было
			this._listenTo(plain?.events, 'reset', () => {
				for (const uid of [...this._bundles.keys()]) this.unregister(uid)
			})

			// Оповещаем плагины о том, что коллекция привязана.
			this.events.emit('engine:bound', engine)
		})
	}

	/** Ссылка на коллекцию, к которой привязан реестр. */
	get engine(): TCollectionEngine<any, any> | null {
		return this._engine
	}

	/** Зарегистрировать bundle элемента коллекции (ключ — uid элемента). */
	register(bundle: IPluginBundle, item: unknown): void {
		const uid = this._uid(item)

		if (uid === undefined) return

		this._bundles.set(uid, bundle)

		this.events.emit('bundle:registered', { uid, bundle })
	}

	/**
	 * Отпустить bundle элемента, чьё монтирование кончилось: запись снимается,
	 * только если она всё ещё его. Элемент из данных остаётся в коллекции и
	 * после размонтирования — отбор или окно таблицы его прячут, — и без этого
	 * запись держала бы bundle с отсоединённым узлом, пока элемент не удалят.
	 * Новое монтирование того же элемента регистрирует свой bundle раньше, чем
	 * прежнее снимается (React пересобирает до очистки), — его запись не
	 * трогается.
	 */
	release(bundle: IPluginBundle, item: unknown): void {
		const uid = this._uid(item)

		if (uid === undefined || this._bundles.get(uid) !== bundle) return

		this.unregister(uid)
	}

	/** Снять регистрацию bundle элемента коллекции. */
	unregister(uid: string | number): void {
		this._bundles.delete(uid)

		this.events.emit('bundle:unregistered', { uid })
	}

	/** Bundle элемента по uid. */
	getByUid(uid: string | number): IPluginBundle | undefined {
		return this._bundles.get(uid)
	}

	/** Bundle по элементу коллекции. */
	getByItem(item: unknown): IPluginBundle | undefined {
		const uid = this._uid(item)

		return uid === undefined ? undefined : this._bundles.get(uid)
	}

	/** Все bundles в порядке элементов коллекции. */
	getAll(): IPluginBundle[] {
		if (!this._engine) return Array.from(this._bundles.values())

		const result: IPluginBundle[] = []

		for (const item of batchOf<IComponentView>(this._engine)?.items ?? []) {
			const bundle = this.getByItem(item)

			if (bundle) result.push(bundle)
		}

		return result
	}

	private _uid(item: unknown): string | number | undefined {
		return (item as { uid?: string | number } | null | undefined)?.uid
	}
}
