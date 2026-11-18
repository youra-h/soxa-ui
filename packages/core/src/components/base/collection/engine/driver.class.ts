import type { IStorage } from './storage'
import type { ICommand, ICommandContext, IQueryCommand } from './commands'
import type {
	ICollectionStorageDriver,
	IQueryStrategy,
	TCollectionStorageDriverEvents,
} from './types'
import { TEvented } from '../../../../common/event'
import { TCollectionTransactions } from './transactions/transactions.class'
import type { ICollectionTransactions } from './transactions'

export class TCollectionStorageDriver<T> implements ICollectionStorageDriver<T> {
	private _transactions?: TCollectionTransactions<T>

	/** Pending attempts are allocated only when an adapter needs deferred acceptance. */
	get transactions(): ICollectionTransactions<T> {
		return (this._transactions ??= new TCollectionTransactions<T>())
	}

	private _storage: IStorage<T> // Хранилище элементов коллекции
	private _isBatching = false // Флаг, указывающий, что в данный момент выполняется батч
	private _pendingCommands: ICommand<T>[] = [] // Список команд, которые были выполнены во время батча и должны быть обработаны после его завершения

	/** Как `query()` получает выборку. По умолчанию — исполняет чтение на каждый вызов. */
	private _queryStrategy: IQueryStrategy<T> = { read: (run) => run(), stale: () => {} }

	/** Сколько команд записи применяется сейчас — с вложенными, из хуков. */
	private _applying = 0

	public readonly events = new TEvented<TCollectionStorageDriverEvents<T>>()

	constructor(storage: IStorage<T>) {
		this._storage = storage
	}

	/**
	 * Снимок сырого состава хранилища.
	 *
	 * Единственное чтение, которое драйвер отдаёт без команды — и это
	 * осознанно: тем, кто пишет в хранилище (расширения), нужен состав как он
	 * есть, без выборки. Всё, что показывается наружу, идёт через
	 * `query()` — там подписчик может его подменить.
	 *
	 * Копия, а не живая ссылка на `storage.items`: иначе состав менялся бы под
	 * тем, кто его уже получил. Заодно это конвенция границы core → ui:
	 * `TPropSpec.read` (setup) у объекта со своим `valueOf()` берёт результат
	 * вызова.
	 */
	public valueOf(): T[] {
		return [...this._storage.items]
	}

	/**
	 * Выполняет команду над коллекцией. Если в данный момент выполняется батч, то события не эмитятся сразу, а откладываются до конца батча.
	 * @param command Команда для выполнения
	 */
	public execute(command: ICommand<T>): void {
		const oldValue = this._isBatching ? undefined : this.valueOf()
		// apply отвечает за мутацию и синхронные «before»-хуки (например, item factory).
		// Выполняется всегда сразу, в том числе внутри батча.
		const ctx: ICommandContext<T> = { storage: this._storage, events: this.events }

		this._apply(command, ctx)

		if (!this._isBatching) {
			command.emitEvents(ctx)

			if (command.changed && oldValue !== undefined) {
				this.events.emit('change:items', { newValue: this.valueOf(), oldValue })
			}
		} else {
			this._pendingCommands.push(command)
		}
	}

	/**
	 * Выполняет читающую команду и возвращает выборку.
	 *
	 * Отдельно от `execute`, а не режимом внутри него: запись уведомляет об
	 * изменении состава, чтение — нет. Батчинг тоже ни при чём — откладывать
	 * нечего, результат нужен сразу.
	 *
	 * Как получить выборку, решает стратегия чтения, — кроме чтения из хуков
	 * команды записи, которая ещё применяется: хранилище тогда в движении, и
	 * чтение исполняется как есть, мимо стратегии. Выборка до команды уже не
	 * та, а середина команды (`patch` применил часть шагов) не годится в
	 * выборку, которую стратегия отдала бы потом.
	 *
	 * @param command Читающая команда
	 */
	public query(command: IQueryCommand<T>): readonly T[] {
		const run = (): readonly T[] => {
			command.apply({ storage: this._storage, events: this.events })

			return command.result
		}

		return this._applying > 0 ? run() : this._queryStrategy.read(run)
	}

	/**
	 * Пометить прежнюю выборку недействительной.
	 *
	 * Драйвер не знает, кто и по какому правилу отбирает — он лишь передаёт
	 * дальше, что спрашивать надо заново: сначала стратегии чтения, потом
	 * читателям. Отдельно от `change:items`: состав хранилища не менялся, и
	 * путать эти два факта нельзя.
	 */
	public invalidateQuery(): void {
		this._queryStrategy.stale()

		this.events.emit('items:query:invalidated')
	}

	/**
	 * Поставить стратегию чтения. Ставит её расширение коллекции; прежняя
	 * выборка у новой стратегии не числится — первое чтение её исполнит.
	 */
	public useQueryStrategy(strategy: IQueryStrategy<T>): void {
		this._queryStrategy = strategy
	}

	/**
	 * Выполняет действие в режиме батча. Все команды, выполненные внутри действия, будут отложены до конца батча и события будут эмититься только один раз.
	 * @param action Действие, выполняемое в режиме батча.
	 */
	public batch(action: () => void): void {
		const oldValue = this._isBatching ? undefined : this.valueOf()
		const wasBatching = this._isBatching
		this._isBatching = true

		try {
			action()
		} finally {
			this._isBatching = wasBatching

			if (!this._isBatching && this._pendingCommands.length > 0) {
				const commandsToEmit = [...this._pendingCommands]
				this._pendingCommands = []

				commandsToEmit.forEach((cmd) =>
					cmd.emitEvents({ storage: this._storage, events: this.events }),
				)

				if (oldValue !== undefined && commandsToEmit.some((cmd) => cmd.changed)) {
					this.events.emit('change:items', { newValue: this.valueOf(), oldValue })
				}
			}
		}
	}

	/**
	 * Применить команду записи и сообщить стратегии чтения, если хранилище
	 * изменилось, — сразу, а не с уведомлениями: подписчики `item:added`,
	 * действие внутри `batch()` и следующая команда читают уже новый состав.
	 * Отменённая команда хранилища не меняла — прежняя выборка верна.
	 *
	 * В `finally`: команда, оборванная исключением, могла успеть записать
	 * часть (`patch`), и записанное — тоже запись.
	 */
	private _apply(command: ICommand<T>, ctx: ICommandContext<T>): void {
		this._applying++

		try {
			command.apply(ctx)
		} finally {
			this._applying--

			if (command.changed) this._queryStrategy.stale()
		}
	}
}
