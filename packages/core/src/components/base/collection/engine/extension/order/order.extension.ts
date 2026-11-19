import type { IExtension, IExtensionContext, IBaseOwnerItemExtensionOptions } from '../types'
import type { TOrderEvents, IOrderExtension } from './types'
import type { IOrderItemExtension } from './item'
import { TOrderItemExtension } from './item'
import { TBaseOwnerItemExtension } from '../base-owner-item-extension.class'

/**
 * TOrderExtension — observes the order of the collection's items.
 *
 * The driver knows nothing of order (the engine introduces no notions for a
 * particular extension), so the extension derives "the sequence changed" from
 * `item:added`/`item:removed`/`item:moved`: any of them raises a flag. An
 * item's property update sends none of them and leaves the order alone.
 *
 * The emit waits for the next `change:items`: one operation may send several
 * item events (an insert and a removal, two moves), while the driver sends
 * `change:items` exactly once per command or per `batch`. The flag is reset
 * right after the emit, so it does not leak into an unrelated `change:items`.
 *
 * Positions are memoized per storage revision: every item read its order on
 * each change, and copying the storage for each `indexOf` made one mount of N
 * items cost N² copies. An item adapter reports the change only when its own
 * position moved (`TOrderItemExtension`).
 *
 * @template TItem — the collection's item type (a user may extend it)
 */
export class TOrderExtension<TItem extends object = any>
	extends TBaseOwnerItemExtension<TItem, IOrderItemExtension<TItem>, TOrderEvents>
	implements IExtension<TItem>, IOrderExtension<TItem>
{
	readonly name = 'order' as const

	private _orderChanged = false

	private _positions: Map<TItem, number> | undefined
	private _revision = -1

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
		})
	}

	/** @inheritdoc IOrderExtension.getItemOrder */
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
