import type { IExtension, IExtensionContext, IBaseOwnerItemExtensionOptions } from '../types'
import { TSelectEvent } from './types'
import type { TSelectionEvents, TSelectionMode, ISelectionExtension } from './types'
import type { ISelectionItemExtension } from './item'
import { TSelectionItemExtension } from './item'
import { TBaseOwnerItemExtension } from '../base-owner-item-extension.class'
import type { TMetaEntry } from '../meta'
import { metaOf } from '../neighbours'
import type { TDataset } from '../../../../../../common'
import { sameValue } from '../../../../../../common/utility/same-value'

/**
 * TSelectionExtension — расширение для управления выборкой элементов.
 *
 * Поддерживает режимы:
 * - `'none'` — выделение запрещено
 * - `'single'` — только один элемент
 * - `'multiple'` — любое количество элементов
 *
 * @template TItem — тип элемента коллекции (пользователь может расширить)
 */
export class TSelectionExtension<TItem extends object = any>
	extends TBaseOwnerItemExtension<TItem, ISelectionItemExtension<TItem>, TSelectionEvents<TItem>>
	implements IExtension<TItem>, ISelectionExtension<TItem>
{
	readonly name = 'selection' as const

	private _selected: Set<TItem> = new Set()
	private _mode: TSelectionMode = 'single'
	/** Выбранные, которых удалила запись, — объявить на её `change:items`. */
	private _lostOnWrite?: Set<TItem>

	constructor(options?: IBaseOwnerItemExtensionOptions<TItem, ISelectionItemExtension<TItem>>) {
		super(TSelectionItemExtension, options)
	}

	get mode(): TSelectionMode {
		return this._mode
	}

	set mode(value: TSelectionMode) {
		const oldMode = this.mode

		if (this._mode === value) return

		const wasMultiple = this._mode === 'multiple'

		if (value === 'none') {
			// полностью очистить выбор
			this.resetSelection()
		}

		this._mode = value

		// `multiple` -> `single` снимает выбор целиком, а не урезает до одного:
		// оставить какой-то из выбранных значило бы выбрать за пользователя.
		// Сброс после смены режима — `change:selection` видит уже `single`.
		// `single` -> `multiple` выбор не трогает
		if (value === 'single' && wasMultiple) this.resetSelection()

		this.events.emit('change:mode', { newValue: value, oldValue: oldMode })
	}

	get multiple(): boolean {
		return this._mode === 'multiple'
	}

	get single(): boolean {
		return this._mode === 'single'
	}

	install(ctx: IExtensionContext<TItem>): void {
		super.install(ctx)

		// Changed items on a selection change, the added one on its entry: a
		// batch sends `item:added` for every item at once at its end, and a pass
		// over all on each made filling quadratic. A write of the list does not
		// change the selection of the other items, so `change:items` has no pass
		this.events.on('change:selection', (_items, changed) => {
			for (const item of changed) this._writeDataset(item)
		})
		ctx.driver.events.on('item:added', (e) => this._writeDataset(e.item as TItem))
		this._syncDataset()

		// Любое удаление из хранилища — команда с `item:removed`, в том числе
		// очистка и сверка `patch`: здесь выбор и теряет удалённый элемент.
		// Потерю выбор объявляет, как активация — снятие удалённого активного,
		// но раз на запись: запись удаляет пачкой, и `change:selection` на
		// каждый удалённый выбранный прогнал бы подписчиков выбора по всей
		// коллекции столько раз. `change:items` приходит следом за всеми
		// `item:removed` каждой записи — команды и пачки, — и потерянные
		// уходят в нём сменившимися
		ctx.driver.events.on('item:removed', (e) => {
			if (this._selected.delete(e.item)) (this._lostOnWrite ??= new Set()).add(e.item)
		})

		ctx.driver.events.on('change:items', () => {
			const lost = this._lostOnWrite

			if (lost === undefined) return

			this._lostOnWrite = undefined
			this._notifySelected(lost)
		})

		ctx.driver.events.on('reset', () => {
			this.resetSelection()
		})

		const meta = metaOf(ctx)

		if (meta) {
			// Отметки одной записи `meta` отдаёт одним списком — и выбираются
			// они одной операцией
			const selectMarked = (entries: readonly TMetaEntry<TItem>[]) =>
				this._selectMarked(
					entries.filter((entry) => entry.meta.selected).map(({ item }) => item),
				)

			meta.events.on('meta:applied', selectMarked)
			meta.events.on('meta:changed', selectMarked)

			// Догон: расширение могло прийти в уже наполненную коллекцию, и свои
			// `meta:applied` оно тогда пропустило. Снимок помнит `meta`, а
			// отметки собираются той же группой
			this._selectMarked(ctx.driver.valueOf().filter((item) => meta.get(item)?.selected))
		}
	}

	/**
	 * Выбрать отмеченные в данных (`_: { selected: true }`) — группу одной
	 * заменой выбора: в `multiple` к выбранным добавляются отмеченные, в
	 * `single` итог — последний принятый, как у `select` по одной отметке.
	 * Хук `item:select:before` — каждой отметке, которая становится выбранной,
	 * `change:selection` — одно, и только если выбор сменился. `select` по
	 * одной сверял бы состав и слал событие на каждую отметку, и подписчики
	 * выбора проходили бы коллекцию столько раз.
	 */
	private _selectMarked(items: readonly TItem[]): void {
		if (items.length === 0) return

		this.replaceSelection(this.multiple ? [...this._selected, ...items] : items)
	}

	/**
	 * Зеркалит выбор в `data-selected` элементов — контракт с темой.
	 *
	 * Здесь, а не в расширении каждого компонента: `data-selected` у Accordion,
	 * ListBox и Select один и тот же, различается только ARIA (`aria-selected`
	 * у опции, `aria-expanded` у секции) — она и остаётся за расширением
	 * компонента. Раньше это делали шаблоны, и при портировании на остальные
	 * пять адаптеров копий стало бы пятнадцать.
	 *
	 * Здесь, а не в item-расширении, потому что item-расширения создаются
	 * лениво — только когда адаптер запросит контекст элемента. Атрибут же
	 * обязан стоять с первой отрисовки, включая серверную.
	 *
	 * Атрибут проставляется **всем** элементам, а не только выбранным: тема
	 * смотрит `[data-selected='true']`, и «не выбран» надо отличать от
	 * «состояние неприменимо».
	 *
	 * Движок коллекции визуального слоя не касается, поэтому проверка, а не
	 * приведение типа: элементом коллекции может быть и не компонент.
	 */
	private _syncDataset(): void {
		this._ctx?.driver.valueOf().forEach((item: TItem) => this._writeDataset(item))
	}

	/** `data-selected` одного элемента — по текущему выбору. */
	private _writeDataset(item: TItem): void {
		;(item as { dataset?: TDataset }).dataset?.add('selected', this.isSelected(item))
	}

	/**
	 * Выбрать элемент. Перед выбором приходит `item:select:before`, и
	 * `preventDefault()` оставляет выбор прежним. Отменяется только «стать
	 * выбранным» — снятие выбора (`deselect`, `resetSelection`) идёт без хука.
	 *
	 * @returns выбран ли элемент после вызова
	 */
	select(item: TItem): boolean {
		if (this._mode === 'none') return false
		// Выбрать выбранное — не смена, как снять невыбранное в `deselect`
		if (this._selected.has(item)) return true
		if (!this._ctx.driver.valueOf().includes(item)) return false

		const event = new TSelectEvent(item)

		this.events.emit('item:select:before', event)

		if (event.defaultPrevented) return false

		const changed = new Set<TItem>()

		if (!this.multiple) {
			// снять выделение с предыдущего — его отметка сменилась тоже
			for (const previous of this._selected) changed.add(previous)

			this._selected.clear()
		}

		this._selected.add(item)
		changed.add(item)

		this._notifySelected(changed)

		return true
	}

	deselect(item: TItem): void {
		if (this._mode === 'none') return

		if (!this._selected.has(item)) return

		this._selected.delete(item)

		this._notifySelected(new Set([item]))
	}

	/**
	 * Выбрать элементы пачкой — отдельная операция, а не `select` в цикле:
	 * у `select` каждый вызов сверяется с составом и шлёт своё
	 * `change:selection`, и его подписчики (`data-selected` всех элементов,
	 * пробросы в фасады) проходили бы коллекцию на каждый элемент пачки.
	 * Здесь состав сверяется один раз, а `change:selection` — одно, в конце.
	 *
	 * Хук `item:select:before` — на каждый элемент, как у `select`: отмена
	 * одного остальных не отменяет, принятый встаёт в выбор сразу. Элемент вне
	 * коллекции и уже выбранный пропускаются без хука.
	 *
	 * В `single` и `none` пачка не выбирается: какой из её элементов оставить,
	 * решал бы не пользователь, — тем же правилом `multiple → single` снимает
	 * выбор целиком.
	 */
	selectMany(items: readonly TItem[]): void {
		if (!this.multiple) return

		const stored = new Set(this._ctx.driver.valueOf())
		const changed = new Set<TItem>()

		for (const item of items) {
			if (this._selected.has(item) || !stored.has(item)) continue

			const event = new TSelectEvent(item)

			this.events.emit('item:select:before', event)

			if (event.defaultPrevented) continue

			this._selected.add(item)
			changed.add(item)
		}

		if (changed.size > 0) this._notifySelected(changed)
	}

	/**
	 * Снять выделение с элементов пачкой — в любом режиме, как `deselect`.
	 * Снятие хука не имеет, поэтому и сверять нечего: снимается то, что
	 * выбрано, а `change:selection` — одно, в конце.
	 */
	deselectMany(items: readonly TItem[]): void {
		const changed = new Set<TItem>()

		for (const item of items) {
			if (this._selected.delete(item)) changed.add(item)
		}

		if (changed.size > 0) this._notifySelected(changed)
	}

	/**
	 * Заменить выбор: выбранными остаются эти элементы, в этом порядке.
	 *
	 * Одна операция, а не сброс и добор: `resetSelection` и `select` по одному
	 * слали `change:selection` на каждый шаг — и тогда, когда выбор в итоге не
	 * менялся. «То же самое» решает сама операция, как сеттер: тот же состав
	 * тем же порядком — не смена, и события нет.
	 *
	 * Хук `item:select:before` — только тому, кто становится выбранным: уже
	 * выбранный остаётся без хука, как у `select`, снимаемый уходит без хука,
	 * как у `deselect`. Элемент вне коллекции пропускается.
	 *
	 * - `multiple` — выбраны принятые из списка, в его порядке; отмена одного
	 *   остальных не отменяет;
	 * - `single` — как `select` по списку: принятый заменяет прежний, итог —
	 *   последний принятый. Пустой список снимает выбор, а список, где не
	 *   принят никто, оставляет прежний — как отменённый `select`;
	 * - `none` — выбора нет.
	 *
	 * Сменившиеся — разность прежнего выбора и нового в обе стороны: снятые и
	 * ставшие выбранными. Сменился только порядок — набор пуст, а
	 * `change:selection` приходит: порядок выбора — его часть.
	 */
	replaceSelection(items: readonly TItem[]): void {
		if (this._mode === 'none') return

		const before = this.selected
		const stored = new Set(this._ctx.driver.valueOf())

		const accepts = (item: TItem): boolean => {
			if (!stored.has(item)) return false
			if (this._selected.has(item)) return true

			const event = new TSelectEvent(item)

			this.events.emit('item:select:before', event)

			return !event.defaultPrevented
		}

		let next: TItem[]

		if (this.multiple) {
			next = [...new Set(items)].filter(accepts)
		} else {
			next = items.length === 0 ? [] : before

			for (const item of items) {
				if (accepts(item)) next = [item]
			}
		}

		if (sameValue(before, next)) return

		const previous = this._selected
		const selected = new Set(next)
		const changed = new Set<TItem>()

		for (const item of previous) {
			if (!selected.has(item)) changed.add(item)
		}

		for (const item of selected) {
			if (!previous.has(item)) changed.add(item)
		}

		this._selected = selected
		this._notifySelected(changed)
	}

	/** @returns выбран ли элемент после вызова */
	toggle(item: TItem): boolean {
		if (this._mode === 'none') return false

		if (this._selected.has(item)) {
			this.deselect(item)

			return false
		}

		return this.select(item)
	}

	get selected(): TItem[] {
		return Array.from(this._selected)
	}

	isSelected(item: TItem): boolean {
		return this._selected.has(item)
	}

	get selectedCount(): number {
		return this._selected.size
	}

	/**
	 * Полная очистка выделения. Сменились все, кто был выбран: прежний набор
	 * и уходит сменившимися.
	 */
	resetSelection(): void {
		if (this._selected.size > 0) {
			const changed: ReadonlySet<TItem> = this._selected

			this._selected = new Set()

			this._notifySelected(changed)
		}
	}

	/**
	 * Уведомление об изменении выделения: выбранные и элементы, чья отметка
	 * сменилась.
	 */
	private _notifySelected(changed: ReadonlySet<TItem>): void {
		this.events.emit('change:selection', this.selected, changed)
	}
}
