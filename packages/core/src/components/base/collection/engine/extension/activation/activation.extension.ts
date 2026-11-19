import type { IExtension, IExtensionContext, IBaseOwnerItemExtensionOptions } from '../types'
import { TActivateEvent } from './types'
import type { TActivationEvents, IActivationExtension } from './types'
import { TActivationItemExtension, type IActivationItemExtension } from './item'
import { TBaseOwnerItemExtension } from '../base-owner-item-extension.class'
import type { TMetaEntry } from '../meta'
import { metaOf } from '../neighbours'
import type { TDataset } from '../../../../../../common'

/**
 * TActivationExtension — расширение для управления активным элементом коллекции.
 *
 * Всегда один активный элемент. При активации нового — предыдущий деактивируется.
 *
 * Активацию можно отменить: перед ней приходит `item:activate:before`, и
 * `preventDefault()` оставляет активным прежний элемент. Отменяется только
 * «стать активным» — снятие активности (`deactivate`, `reset`) идёт без хука.
 *
 * @template TItem — тип элемента коллекции (пользователь может расширить)
 */
export class TActivationExtension<TItem extends object = any>
	extends TBaseOwnerItemExtension<
		TItem,
		IActivationItemExtension<TItem>,
		TActivationEvents<TItem>
	>
	implements IExtension<TItem>, IActivationExtension<TItem>
{
	readonly name = 'activation' as const

	private _activeItem?: TItem

	constructor(options?: IBaseOwnerItemExtensionOptions<TItem, IActivationItemExtension<TItem>>) {
		super(TActivationItemExtension, options)
	}

	get activeItem(): TItem | undefined {
		return this._activeItem
	}

	override install(ctx: IExtensionContext<TItem>): void {
		super.install(ctx)

		// Всем — на смену активного, добавленному — только ему, как у
		// `TSelectionExtension`: проход по всем на каждый `item:added` пачки
		// сделал бы наполнение квадратичным
		// Only the two items whose activity changed: a pass over all on every
		// change made removing tabs one by one quadratic
		this.events.on('change:activation', (item, previous) => {
			if (previous) this._writeDataset(previous)
			if (item) this._writeDataset(item)
		})
		ctx.driver.events.on('item:added', (e) => this._writeDataset(e.item as TItem))
		this._syncDataset()

		// Удалили активный — только сброс. Кого активировать взамен и нужно ли
		// вообще, общее расширение не решает: это политика компонента. Tabs,
		// например, берёт соседа — см. `TTabsExtension`.
		ctx.driver.events.on('item:removed', (e) => {
			if (this._activeItem === e.item) {
				this.reset()
			}
		})

		ctx.driver.events.on('reset', () => {
			this.reset()
		})

		const meta = metaOf(ctx)

		if (meta) {
			// Отметки одной записи `meta` отдаёт одним списком. Активный один, и
			// отметка у него обычно одна, поэтому — по порядку, как по одной:
			// итог — последний принятый
			const activateMarked = (entries: readonly TMetaEntry<TItem>[]) => {
				for (const { item, meta: marks } of entries) {
					if (marks.active) this.activate(item)
				}
			}

			meta.events.on('meta:applied', activateMarked)
			meta.events.on('meta:changed', activateMarked)

			// Догон: расширение могло прийти в уже наполненную коллекцию, и свои
			// `meta:applied` оно тогда пропустило. Снимок помнит `meta`
			ctx.driver.valueOf().forEach((item) => {
				if (meta.get(item)?.active) this.activate(item)
			})
		}
	}

	/**
	 * Установить активный элемент.
	 * Если элемент уже активен — ничего не делает.
	 * Предыдущий активный элемент деактивируется автоматически.
	 *
	 * @returns активен ли элемент после вызова: `false` — его нет в коллекции
	 * или активацию отменили в `item:activate:before`
	 */
	activate(item: TItem): boolean {
		if (this._activeItem === item) return true

		if (!this._ctx.driver.valueOf().includes(item)) return false

		const event = new TActivateEvent(item)

		this.events.emit('item:activate:before', event)

		if (event.defaultPrevented) return false

		const previous = this._activeItem

		this._activeItem = item

		this.events.emit('item:activated', item)
		this.events.emit('change:activation', item, previous)

		return true
	}

	/**
	 * Деактивировать элемент.
	 * Если элемент не является активным — ничего не делает.
	 */
	deactivate(item: TItem): void {
		if (this._activeItem !== item) return

		this._activeItem = undefined

		this.events.emit('item:deactivated', item)
		this.events.emit('change:activation', undefined, item)
	}

	/**
	 * Переключить активность элемента.
	 * Если элемент активен — деактивирует, иначе — активирует.
	 */
	toggle(item: TItem): void {
		if (this._activeItem === item) {
			this.deactivate(item)
		} else {
			this.activate(item)
		}
	}

	/**
	 * Проверить, активен ли элемент.
	 */
	isActive(item: TItem): boolean {
		return this._activeItem === item
	}

	/**
	 * Зеркалит активность в `data-selected` элементов — как это делает
	 * `TSelectionExtension` для выбора.
	 *
	 * Имя атрибута то же, хотя состояние называется иначе, и это осознанно:
	 * `data-*` — контракт с темой, а тема красит «выделенный элемент»
	 * одинаково, будь он активным табом, раскрытой секцией или выбранной
	 * опцией. Расходится только ARIA, и она остаётся за расширением
	 * конкретного компонента.
	 */
	private _syncDataset(): void {
		this._ctx?.driver.valueOf().forEach((item: TItem) => this._writeDataset(item))
	}

	/** `data-selected` одного элемента — по текущему активному. */
	private _writeDataset(item: TItem): void {
		;(item as { dataset?: TDataset }).dataset?.add('selected', this.isActive(item))
	}

	/**
	 * Сбросить активный элемент.
	 */
	reset(): void {
		if (this._activeItem) {
			const prev = this._activeItem

			this._activeItem = undefined

			this.events.emit('item:deactivated', prev)
			this.events.emit('change:activation', undefined, prev)
		}
	}

	/**
	 * Найти следующий подходящий элемент для активации.
	 * Поиск: сначала вперёд от fromItem, затем назад.
	 *
	 * @param predicate Условие отбора (опционально)
	 * @param fromItem  Элемент-ориентир для поиска (опционально)
	 */
	findActivatable(predicate?: (item: TItem) => boolean, fromItem?: TItem): TItem | undefined {
		const check = predicate ?? (() => true)
		// One snapshot: `valueOf()` copies the storage on every call
		const items = this._ctx.driver.valueOf()
		const fromIndex = fromItem !== undefined ? items.indexOf(fromItem) : -1

		// Сначала вперёд: fromIndex+1, fromIndex+2, ...
		for (let i = fromIndex + 1; i < items.length; i++) {
			const item = items[i]
			if (item && check(item)) return item
		}

		// Затем назад: fromIndex-1, fromIndex-2, ...
		for (let i = fromIndex - 1; i >= 0; i--) {
			const item = items[i]
			if (item && check(item)) return item
		}

		return undefined
	}
}
