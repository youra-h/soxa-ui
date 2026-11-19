import type { IExtension, IExtensionContext, IBaseOwnerItemExtensionOptions } from '../types'
import type { TOrderEvents, IOrderExtension } from './types'
import type { IOrderItemExtension } from './item'
import { TOrderItemExtension } from './item'
import { TBaseOwnerItemExtension } from '../base-owner-item-extension.class'

/**
 * TOrderExtension — расширение-наблюдатель за порядком элементов в коллекции.
 *
 * Драйвер не знает о порядке (движок не заводит понятий под конкретное
 * расширение), поэтому факт «последовательность элементов сменилась»
 * расширение выводит само из `item:added`/`item:removed`/`item:moved`: любое
 * из них поднимает внутренний флаг. Обновление свойств элемента этих событий
 * не даёт, поэтому обновление порядок не трогает.
 *
 * Эмит откладывается до ближайшего `change:items`: в батче item-событий на
 * одну операцию может прийти несколько (вставка + удаление, две перестановки
 * и т. п.), а `change:items` драйвер шлёт ровно один раз на команду или на
 * весь `batch`. Флаг сбрасывается сразу после эмита, чтобы не протечь в
 * следующий, не связанный с порядком `change:items`.
 *
 * Positions are memoized per storage revision: every item read its order on
 * each change, and copying the storage for each `indexOf` made one mount of N
 * items cost N² copies. Item adapters hear the change only when their own
 * position moved — appending an item moves no one else.
 *
 * @template TItem — тип элемента коллекции (пользователь может расширить)
 */
export class TOrderExtension<TItem extends object = any>
	extends TBaseOwnerItemExtension<TItem, IOrderItemExtension<TItem>, TOrderEvents>
	implements IExtension<TItem>, IOrderExtension<TItem>
{
	readonly name = 'order' as const

	private _orderChanged = false

	private _positions: Map<TItem, number> | undefined
	private _revision = -1
	private readonly _adapters = new Set<IOrderItemExtension<TItem>>()

	constructor(options?: IBaseOwnerItemExtensionOptions<TItem, IOrderItemExtension<TItem>>) {
		super(TOrderItemExtension, options)
	}

	override install(ctx: IExtensionContext<TItem>): void {
		super.install(ctx)

		const markChanged = () => {
			this._orderChanged = true
		}

		ctx.driver.events.on('item:added', markChanged)
		ctx.driver.events.on('item:removed', markChanged)
		ctx.driver.events.on('item:moved', markChanged)

		ctx.driver.events.on('change:items', () => {
			if (!this._orderChanged) return

			this._orderChanged = false
			this.events.emit('change:order')

			// A copy: a listener may release adapters while they are notified
			for (const adapter of [...this._adapters]) adapter.sync()
		})
	}

	/** @inheritdoc IExtensionItems.createItem */
	override createItem(owner: TItem): IOrderItemExtension<TItem> {
		const adapter = super.createItem(owner)

		this._adapters.add(adapter)
		adapter.events.on('destroy', () => this._adapters.delete(adapter))

		return adapter
	}

	/**
	 * Возвращает актуальный индекс элемента в коллекции.
	 */
	getItemOrder(item: TItem): number {
		const { driver } = this._ctx

		if (!this._positions || this._revision !== driver.revision) {
			const positions = new Map<TItem, number>()

			// The first occurrence wins, as `indexOf` did
			driver.valueOf().forEach((entry, index) => {
				if (!positions.has(entry)) positions.set(entry, index)
			})

			this._positions = positions
			this._revision = driver.revision
		}

		return this._positions.get(item) ?? -1
	}
}
