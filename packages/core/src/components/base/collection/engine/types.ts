import type { TValuePayload } from '../../../../common'
import type { ICommand, IQueryCommand } from './commands'
import type { ICollectionTransactions } from './transactions'
import { TEvented } from '../../../../common/event'
import { TActionEvent } from '../../../../common/event/action-event'

/**
 * База событий коллекции, которые несут meta-снапшот `_`.
 * Мета снимается с сырого источника в конструкторе — до любых `*:before`-хендлеров,
 * поэтому factory-подмена item не влияет на уже захваченный `_`.
 */
// Параметр держит арность дженерика: наследники передают TItem явно.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export abstract class TItemEvent<TItem = any> extends TActionEvent {
	public _: Record<string, unknown> = {}

	protected captureMeta(source: unknown): void {
		if (typeof source === 'object' && source !== null && '_' in source) {
			const meta = (source as Record<string, unknown>)._

			if (typeof meta === 'object' && meta !== null) {
				this._ = meta as Record<string, unknown>
				return
			}
		}

		this._ = {}
	}
}

export class TInsertEvent<TItem> extends TItemEvent<TItem> {
	constructor(private _item: Partial<TItem>) {
		super()

		this.captureMeta(this._item)
	}

	get item(): Partial<TItem> {
		return this._item
	}

	set item(value: Partial<TItem>) {
		this._item = value
	}
}

export class TUpdateEvent<TItem> extends TItemEvent<TItem> {
	/** changes без `_` — то, что реально пойдёт в Object.assign. */
	readonly changes: Partial<TItem>

	constructor(
		public item: TItem,
		source: Partial<TItem>,
	) {
		super()

		this.captureMeta(source)

		// отделяем meta от данных, чтобы `_` не «прилип» к item при Object.assign
		const changes = { ...(source as Record<string, unknown>) }
		delete changes._

		this.changes = changes as Partial<TItem>
	}
}

/**
 * Событие удаления элемента. Отменяемо: `preventDefault()` до мутации
 * хранилища оставляет элемент на месте, ровно как у вставки/обновления.
 */
export class TRemoveEvent<TItem> extends TItemEvent<TItem> {
	constructor(public readonly item: TItem) {
		super()

		this.captureMeta(this.item)
	}
}

/**
 * Событие перемещения элемента. `oldIndex` — вычисленная позиция на момент
 * события, только для чтения. `newIndex` можно подменить в хендлере — тем же
 * приёмом, что подмена `item` у вставки.
 */
export class TMoveEvent<TItem> extends TItemEvent<TItem> {
	constructor(
		public readonly item: TItem,
		public readonly oldIndex: number,
		private _newIndex: number,
	) {
		super()

		this.captureMeta(this.item)
	}

	get newIndex(): number {
		return this._newIndex
	}

	set newIndex(value: number) {
		this._newIndex = value
	}
}

/**
 * Событие полной очистки коллекции. `items` — снимок состава на момент
 * вызова, один хук на всю операцию, а не по хуку на элемент: отмена части
 * элементов оставила бы коллекцию непустой, что противоречит смыслу `reset`.
 */
export class TClearEvent<TItem> extends TActionEvent {
	constructor(public readonly items: readonly TItem[]) {
		super()
	}
}

/**
 * Событие чтения состава — точка внедрения для расширений.
 *
 * Команда чтения (`TQueryCommand`) кладёт сюда снимок сырого storage и эмитит
 * `items:query:before`. Подписчик волен подменить `items`: сузить состав
 * (фильтр), переставить (сортировка) или отдать обёртки над элементами. Тот же
 * приём, что у `item:add:before` в `TFactoryExtension`, только правится не
 * элемент, а список.
 *
 * В storage при этом не меняется ничего: запись идёт командами напрямую в
 * хранилище и выборок не видит.
 */
export class TQueryEvent<TItem> extends TActionEvent {
	constructor(public items: readonly TItem[]) {
		super()
	}
}

export type TCollectionStorageDriverEvents<TItem> = {
	/**
	 * Вызывается ПЕРЕД добавлением элемента (до мутации хранилища).
	 * - Изменить `e.item` — подменить элемент (например, item factory).
	 * - Вызвать `e.preventDefault()` — отменить вставку.
	 */
	'item:add:before': (e: TInsertEvent<TItem>) => void

	/** Вызывается при добавлении одного элемента */
	'item:added': (e: TInsertEvent<TItem>) => void

	/**
	 * Вызывается ПЕРЕД удалением элемента (до мутации хранилища).
	 * Вызвать `e.preventDefault()` — отменить удаление.
	 */
	'item:remove:before': (e: TRemoveEvent<TItem>) => void

	/** Вызывается при удалении одного элемента */
	'item:removed': (e: TRemoveEvent<TItem>) => void

	/** Вызывается ПЕРЕД изменением элемента (до мутации). Можно подменить `e.item`/`e.changes` или `preventDefault()`. */
	'item:update:before': (e: TUpdateEvent<TItem>) => void

	/** Вызывается при изменении одного элемента */
	'item:updated': (e: TUpdateEvent<TItem>) => void

	/**
	 * Вызывается ПЕРЕД перемещением элемента (до мутации хранилища).
	 * Можно подменить `e.newIndex` или вызвать `e.preventDefault()`.
	 */
	'item:move:before': (e: TMoveEvent<TItem>) => void

	/** Вызывается при перемещении элемента */
	'item:moved': (e: TMoveEvent<TItem>) => void

	/**
	 * The storage composition changed. `items` is a snapshot: a listener may
	 * keep it, and the next change does not alter it.
	 */
	'change:items': (payload: TValuePayload<readonly TItem[]>) => void

	/** Изменение количества элементов */
	'change:count': (payload: TValuePayload<number>) => void

	/**
	 * Вызывается ПЕРЕД полной очисткой коллекции (до мутации хранилища).
	 * Один хук на всю операцию — `e.items` снимок состава, `e.preventDefault()`
	 * отменяет очистку целиком.
	 */
	'items:clear:before': (e: TClearEvent<TItem>) => void

	/** Полный сброс или очистка коллекции */
	reset: () => void

	/**
	 * Состав прочитан, но ещё не отдан — подписчик может подменить `e.items`.
	 * Это чтение: storage событие не трогает.
	 */
	'items:query:before': (e: TQueryEvent<TItem>) => void

	/**
	 * Прежняя выборка устарела — условия отбора изменились.
	 *
	 * Состав хранилища при этом не менялся, поэтому `change:items` здесь не
	 * подходит. Подаёт его тот, кто меняет условия (например `filter`), через
	 * `driver.invalidateQuery()`; слушателю достаточно перечитать выборку.
	 */
	'items:query:invalidated': () => void
}

/**
 * Стратегия чтения драйвера — как `query()` получает выборку.
 *
 * Исполнить чтение стратегия может на каждый вызов или отдать прежний
 * результат. От драйвера она получает только исполнение чтения (`run`) — не
 * хранилище и не команду, — а когда прежний результат устарел, драйвер
 * сообщает ей сам (`stale`): команда записи изменила хранилище — сразу после
 * её применения, до уведомлений и внутри `batch()` тоже, — или выборку
 * объявили недействительной (`invalidateQuery()`) — до
 * `items:query:invalidated`. Своих поводов у стратегии нет. Пока команда
 * записи применяется, хранилище в движении, и чтение из её хуков `*:before`
 * драйвер исполняет мимо стратегии.
 *
 * По умолчанию драйвер исполняет чтение на каждый вызов. Другую стратегию
 * ставит расширение коллекции (`useQueryStrategy`).
 */
export interface IQueryStrategy<TItem> {
	/** Отдать выборку; `run` исполняет чтение над хранилищем. */
	read(run: () => readonly TItem[]): readonly TItem[]

	/** Прежняя выборка устарела. */
	stale(): void
}

/**
 * Хранилище движка: команды записи, читающие команды и снимок сырого состава.
 *
 * Массивом не притворяется намеренно. Раньше драйвер был Proxy над
 * `storage.items`, и «дай хранилище» с «дай список» писались одинаково —
 * отсюда и брались обходы правил. Нужен состав как он есть — `valueOf()`,
 * нужна выборка — `query()`.
 */
export interface ICollectionStorageDriver<TItem> {
	/** Optional transaction support; existing custom drivers keep their current contract. */
	readonly transactions?: ICollectionTransactions<TItem>

	/** Снимок сырого состава хранилища — копия, не живая ссылка. */
	valueOf(): TItem[]

	readonly events: TEvented<TCollectionStorageDriverEvents<TItem>>

	/** Единственный легитимный способ изменить состояние через StorageDriver */
	execute(command: ICommand<TItem>): void

	/** Пакетное выполнение команд */
	batch(action: () => void): void

	/**
	 * Выполнить читающую команду и вернуть выборку.
	 *
	 * Отдельный метод, а не режим `execute`: чтение и запись — разные операции.
	 * `execute` после команды шлёт `change:items`, а чтение состав не меняет;
	 * сводить их в один метод пришлось бы ветвлением внутри — тем самым
	 * костылём, которого здесь быть не должно.
	 */
	query(command: IQueryCommand<TItem>): readonly TItem[]

	/** Сообщить, что условия отбора изменились и прежняя выборка недействительна. */
	invalidateQuery(): void

	/** Поставить стратегию чтения — как `query()` получает выборку. */
	useQueryStrategy(strategy: IQueryStrategy<TItem>): void
}

export interface ICollectionEngineCore<TItem, TExtensions extends Record<string, any>> {
	readonly driver: ICollectionStorageDriver<TItem>
	readonly extensions: TExtensions
}

/**
 * Pass-through проп готовой коллекции. Зеркало CollectionDescriptor.
 * Аналог `ctrl` для компонентов: если задан — используется вместо создания новой коллекции.
 */
export interface ICollectionProps<TCollectionEngine = unknown> {
	engine?: TCollectionEngine
}

/**
 * Сырой источник элемента коллекции: props + опциональная meta `_`.
 * Используется для `items` — состояния (active, selected) передаются через `_.{state}`.
 */
export type TCollectionEngineItemSource<
	TItemProps = any,
	TMeta = Record<string, any>,
> = Partial<TItemProps> & {
	_?: TMeta
}

/**
 * События движка коллекции (TCollectionEngine).
 * Позволяют получить ссылку на движок в момент его создания.
 */
export type TCollectionEngineEvents<TEngine = unknown> = {
	/** Движок создан и готов к использованию. Передаётся сам движок. */
	'engine:create': (engine: TEngine) => void
}
