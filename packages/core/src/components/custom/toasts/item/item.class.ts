import { TComponentView } from '../../../base/component-view'
import type { TDefaultValues } from '../../../base/component'
import type { TCloseReason, TSwipe, TSwipeSide } from '../../../base/layer'
import { TAria, TChangeEvent } from '../../../../common'
import type { TEventSink } from '../../../../common'
import type {
	IToastsItem,
	IToastsItemProps,
	TToastsItemEvents,
	TToastsItemType,
	TToastsItemView,
} from './types'

/**
 * One toast in the manager's collection. Its type supplies the visual icon
 * and color; loading prevents expiry while work is pending. Message text
 * and description belong to the model, custom content to the renderer.
 * Closing is final: the item fades out and the removal plugin drops it.
 * The card remains keyboard accessible (F8, Escape, close action) and can
 * be swiped, but aria-live=off keeps its interactive subtree out of automatic
 * speech. TToastsAnnouncePlugin sends text/description to persistent polite
 * or assertive regions according to alert; roles remain useful in navigation.
 */
export default class TToastsItem<
	TProps extends IToastsItemProps = IToastsItemProps,
	TEvents extends TToastsItemEvents = TToastsItemEvents,
>
	extends TComponentView<TProps, TEvents>
	implements IToastsItem<TProps, TEvents>
{
	static override baseClass = 'so-toasts-item'

	static defaultValues: typeof TComponentView.defaultValues &
		TDefaultValues<
			IToastsItemProps,
			'text' | 'description' | 'loading' | 'closable' | 'alert',
			'type' | 'view' | 'duration' | 'render'
		> = {
		...TComponentView.defaultValues,
		tag: 'li',
		text: '',
		description: '',
		type: undefined,
		view: undefined,
		loading: false,
		closable: true,
		duration: undefined,
		alert: false,
		render: undefined,
	}

	protected _text: string
	protected _description: string
	protected _type: TToastsItemType | undefined
	protected _view: TToastsItemView | undefined
	protected _loading: boolean
	protected _closable: boolean
	protected _duration: number | undefined
	protected _alert: boolean
	protected _render: unknown
	protected _open = true
	protected _swipeSide: TSwipeSide = 'end'
	protected _swiping = false
	protected _closeAria: TAria
	protected _cardAria: TAria

	constructor(props: Partial<TProps> = {}) {
		super(props)

		const ctor = new.target as typeof TToastsItem
		const own = props as Partial<IToastsItemProps>

		this._text = own.text ?? ctor.defaultValues.text
		this._description = own.description ?? ctor.defaultValues.description
		this._type = own.type ?? ctor.defaultValues.type
		this._view = own.view ?? ctor.defaultValues.view
		this._loading = own.loading ?? ctor.defaultValues.loading
		this._closable = own.closable ?? ctor.defaultValues.closable
		this._duration = own.duration ?? ctor.defaultValues.duration
		this._alert = own.alert ?? ctor.defaultValues.alert
		this._render = own.render ?? ctor.defaultValues.render

		this._cardAria = new TAria()
		this._cardAria.add('aria-live', 'off')
		this._cardAria.subscribe((_set, oldValue) =>
			this._sink.emit('change:cardAria', { newValue: this._cardAria.toObject(), oldValue }),
		)
		this._closeAria = new TAria()
		// The close control remains discoverable, but its changing name is not a status message.
		this._closeAria.add('aria-live', 'off')
		this._closeAria.subscribe((_set, oldValue) =>
			this._sink.emit('change:closeAria', { newValue: this._closeAria.toObject(), oldValue }),
		)

		this._classes.swap({ prefix: '--type-', newValue: this._type })
		this._classes.swap({ prefix: '--view-', newValue: this._view })
		this._syncRole()
		// The shared announcer delivers the message; this subtree is for navigation.
		this._aria.add('aria-live', 'off')
		this._aria.add('tabindex', '0')
		this._dataset.add('open', true)
		this._dataset.add('swiping', false)
	}

	/**
	 * Эмит собственных событий класса — без приведения `this.events` к
	 * конкретной карте (см. `TEventSink` в `common/event/types.ts`).
	 */
	protected override get _sink(): TEventSink<TToastsItemEvents> {
		return this.events
	}

	/** Текст тоста — его заголовок. */
	get text(): string {
		return this._text
	}

	set text(value: string) {
		if (value === this._text) return

		const e = new TChangeEvent(value, this._text)

		this._sink.emit('change:text:before', e)

		if (e.defaultPrevented || e.value === this._text) return

		this._text = e.value
		this._sink.emit('change:text', { newValue: e.value, oldValue: e.oldValue })
	}

	/** Описание под текстом. */
	get description(): string {
		return this._description
	}

	set description(value: string) {
		const oldDescription = this.description

		if (value === this._description) return

		this._description = value
		this._sink.emit('change:description', { newValue: value, oldValue: oldDescription })
	}

	/** Вид сообщения; `undefined` — обычное сообщение. */
	get type(): TToastsItemType | undefined {
		return this._type
	}

	/**
	 * `swap`, а не `swapClass` с шаблонной строкой: вида может не быть, и
	 * шаблон дал бы `--type-undefined`.
	 */
	set type(value: TToastsItemType | undefined) {
		const oldType = this.type

		if (value === this._type) return

		this._classes.swap({ prefix: '--type-', oldValue: this._type, newValue: value })
		this._type = value
		this._sink.emit('change:type', { newValue: value, oldValue: oldType })
	}

	get view(): TToastsItemView | undefined {
		return this._view
	}

	set view(value: TToastsItemView | undefined) {
		if (value === this._view) return

		const oldValue = this._view
		this._classes.swap({ prefix: '--view-', oldValue, newValue: value })
		this._view = value
		this._sink.emit('change:view', { newValue: value, oldValue })
	}

	/** Тост ждёт: на месте значка кольцо, и сам тост не закрывается. */
	get loading(): boolean {
		return this._loading
	}

	set loading(value: boolean) {
		const oldLoading = this.loading

		if (value === this._loading) return

		this._loading = value
		this._sink.emit('change:loading', { newValue: value, oldValue: oldLoading })
	}

	/** Есть ли у тоста кнопка закрытия. */
	get closable(): boolean {
		return this._closable
	}

	set closable(value: boolean) {
		const oldClosable = this.closable

		if (value === this._closable) return

		const e = new TChangeEvent(value, this._closable)

		this._sink.emit('change:closable:before', e)

		if (e.defaultPrevented || e.value === this._closable) return

		this._closable = e.value
		this._sink.emit('change:closable', { newValue: e.value, oldValue: oldClosable })
	}

	/**
	 * Своя длительность, мс. `undefined` — как у владельца, `0` — тост
	 * держится, пока его не закроют. Итог — у коллекции (`durationOf`): своя
	 * или владельца, а пока тост ждёт — `0`.
	 */
	get duration(): number | undefined {
		return this._duration
	}

	set duration(value: number | undefined) {
		const oldDuration = this.duration

		if (value === this._duration) return

		this._duration = value
		this._sink.emit('change:duration', { newValue: value, oldValue: oldDuration })
	}

	/** Urgency exposes the existing card as an alert and selects assertive announcements. */
	get alert(): boolean {
		return this._alert
	}

	set alert(value: boolean) {
		const oldAlert = this.alert

		if (value === this._alert) return

		this._alert = value
		this._syncRole()
		this._sink.emit('change:alert', { newValue: value, oldValue: oldAlert })
	}

	/** Своё содержимое: рисует адаптер, ядро значение не читает. */
	get render(): unknown {
		return this._render
	}

	set render(value: unknown) {
		const oldRender = this.render

		if (value === this._render) return

		this._render = value
		this._sink.emit('change:render', { newValue: value, oldValue: oldRender })
	}

	/** Открыт ли тост. Закрытие окончательное: закрывает `close()`. */
	get open(): boolean {
		return this._open
	}

	/**
	 * Закрыть тост. Закрытый гаснет переходом темы (`data-open="false"`),
	 * перестаёт быть остановкой фокуса и уходит из коллекции, когда доиграл
	 * переходы, — убирает его плагин удаления владельца. Повторный вызов
	 * ничего не делает.
	 */
	close(): void {
		const oldOpen = this.open

		if (!this._open) return

		this._open = false
		this._setSwiping(false)
		this._dataset.add('open', false)
		this._aria.add('tabindex', '-1')
		this._sink.emit('change:open', { newValue: false, oldValue: oldOpen })
	}

	/**
	 * Пользователь закрывает тост — крестиком, жестом, Escape. Тост соглашается
	 * всегда: отменяемого закрытия у него нет.
	 */
	requestClose(_reason: TCloseReason): void {
		this.close()
	}

	/** За что тост смахивают — за всю плашку, кроме контролов. */
	get swipe(): TSwipe {
		return 'panel'
	}

	/** Куда тост уходит жестом. Пишет коллекция по месту региона. */
	get swipeSide(): TSwipeSide {
		return this._swipeSide
	}

	set swipeSide(value: TSwipeSide) {
		const oldSwipeSide = this.swipeSide

		if (value === this._swipeSide) return

		this._swipeSide = value
		this._sink.emit('change:swipeSide', { newValue: value, oldValue: oldSwipeSide })
	}

	/** Идёт жест: с `beginSwipe` до `endSwipe` или до закрытия. */
	get swiping(): boolean {
		return this._swiping
	}

	/** Жест начался: тост тянут. Закрытый тост не тянут — жест не начинается. */
	beginSwipe(): boolean {
		if (!this._open) return false

		this._setSwiping(true)

		return true
	}

	/** Жест кончился. Закрывать или нет, решил плагин жеста. */
	endSwipe(): void {
		this._setSwiping(false)
	}

	/**
	 * Атрибуты кнопки закрытия — отдельный набор, а не часть `aria`: `aria`
	 * описывает тост, а это кнопка в нём. Имя с текстом тоста («Закрыть
	 * Сохранено») пишет плагин имён, за границу core → ui уходит снимок
	 * (`valueOf()`), об изменении набор сообщает `change:closeAria`.
	 */
	get closeAria(): TAria {
		return this._closeAria
	}

	/** The card's navigation role; automatic announcements use the shared live regions. */
	get cardAria(): TAria {
		return this._cardAria
	}

	/**
	 * Roles describe the cards during navigation; automatic messages are separate.
	 * The explicit aria-live=off keeps names and controls out of live speech; alerts
	 * are delivered through the shared assertive announcer.
	 */
	protected _syncRole(): void {
		// The list child keeps its native structure; urgency belongs to the existing card.
		this._aria.add('role', 'listitem')
		this._cardAria.add('role', this._alert ? 'alert' : null)
	}

	protected _setSwiping(value: boolean): void {
		const oldSwiping = this.swiping

		if (this._swiping === value) return

		this._swiping = value
		this._dataset.add('swiping', value)
		this._sink.emit('change:swiping', { newValue: value, oldValue: oldSwiping })
	}

	override getProps(): TProps {
		return {
			...super.getProps(),
			text: this._text,
			description: this._description,
			type: this._type,
			view: this._view,
			loading: this._loading,
			closable: this._closable,
			duration: this._duration,
			alert: this._alert,
			render: this._render,
		} as TProps
	}
}
