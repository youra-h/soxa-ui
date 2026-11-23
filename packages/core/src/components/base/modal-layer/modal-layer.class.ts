import { TLayer, TCloseEvent, FRAME_LAYER_ATTRIBUTE } from '../layer'
import type { TCloseReason } from '../layer'
import type { TDefaultValues } from '../component'
import { TAria } from '../../../common'
import type { TDatasetAttributes, TEventSink } from '../../../common'
import TBackdrop from './backdrop.class'
import type { IModalLayer, IModalLayerProps, TBackdropView, TModalLayerEvents } from './types'

/**
 * Модальный слой — общая база модального окна и выезжающей панели.
 *
 * Паттерн APG у обоих один — Dialog (Modal): панель, сама корень и слой
 * (`TLayer`), объявляет себя `role="dialog"` и `aria-modal="true"`, имя ей
 * даёт заголовок (`aria-labelledby`), подложка — её сосед с тем же номером
 * слоя. Окно и панель различаются раскладкой — место и разворот у окна, край
 * экрана и жест у панели, — а всё, что следует из модальности, общее и живёт
 * здесь один раз: кнопка закрытия, запрос закрытия и размер.
 *
 * Фокус, замкнутый Tab и Escape — у `TModalFocusPlugin`, нажатие мимо — у
 * `TDismissPlugin`, немой для скринридера фон — у `THideOutsidePlugin`,
 * запертая прокрутка — у `TScrollLockPlugin`: здесь только состояние и то,
 * что из него следует для разметки.
 *
 * **Имя — заголовок.** Слот `title` рисуется всегда, и `aria-labelledby`
 * ссылается на него. Сторона заголовка — набор `titleAria`: у разметки без
 * экземпляра своего набора нет. `id` заголовка и ссылку на него пишет
 * плагин `TModalLayerIdsPlugin` — `id` нужны документу, а не слою.
 * `TAriaPlugin` модальному слою не ставится: он пишет те же ключи и снял бы
 * связку при установке.
 *
 * **Закрытие пользователем — запрос** (`requestClose`) с причиной: кнопка
 * закрытия, нажатие мимо, Escape или жест панели. Запрос проходит через
 * отменяемое `close:before`, а при `dismissible: false` нажатие мимо и Escape
 * отклоняются без события — остаются кнопка и жест, который потребитель
 * включил сам. Запись `visible` из кода и `v-model` запросом не считаются:
 * родитель, который открытость пишет сам, с панелью не разойдётся. Поэтому
 * не `hide:before` — его шлёт и программное скрытие.
 *
 * **Имя кнопки закрытия — от локали**, а не проп: строки библиотеки задаёт
 * локаль поддерева, и имя в набор кнопки (`closeAria`) пишет плагин имён
 * (`TModalNamesPlugin`). Слой держит только набор.
 *
 * **Размер — значение, раскладка — тема.** Ширина и высота уходят теме
 * переменными раскладки наследника (`TDialogLayoutPlugin`,
 * `TDrawerLayoutPlugin`); не заданы — размер выбирает тема.
 *
 * **Открытость — `data-open`** у панели и подложки. По нему тема ведёт
 * переход к закрытому виду и обратно: окно гаснет и проявляется, панель
 * уезжает за край и въезжает. У панели атрибут — от слоя (`TLayer`), как у
 * любой панели; подложке его отдаёт набор `backdropDataset`.
 */
export default class TModalLayer<
	TProps extends IModalLayerProps = IModalLayerProps,
	TEvents extends TModalLayerEvents = TModalLayerEvents,
>
	extends TLayer<TProps, TEvents>
	implements IModalLayer<TProps, TEvents>
{
	static defaultValues: typeof TLayer.defaultValues &
		TDefaultValues<
			IModalLayerProps,
			'closable' | 'dismissible',
			'width' | 'height' | 'backdrop'
		> = {
		...TLayer.defaultValues,
		// Не `'auto'`, как у Frame: размер по умолчанию выбирает тема, а
		// `auto` растянул бы окно по экрану
		width: undefined,
		backdrop: undefined,
		height: undefined,
		closable: true,
		dismissible: true,
	}

	private readonly _backdrop: TBackdrop
	protected _width: number | string | undefined
	protected _height: number | string | undefined
	protected _closable: boolean
	protected _dismissible: boolean
	protected _titleAria: TAria
	protected _closeAria: TAria

	constructor(props: Partial<TProps> = {}) {
		const ctor = new.target as typeof TModalLayer

		super(props)

		this._backdrop = new TBackdrop(props.backdrop ?? ctor.defaultValues.backdrop)
		this._width = props.width ?? ctor.defaultValues.width
		this._height = props.height ?? ctor.defaultValues.height
		this._closable = props.closable ?? ctor.defaultValues.closable
		this._dismissible = props.dismissible ?? ctor.defaultValues.dismissible

		this._aria.add('role', 'dialog')
		// Слой модален: скринридер вне его не читает. Это значение, а не
		// операция — фон на самих узлах прячет `THideOutsidePlugin`
		this._aria.add('aria-modal', 'true')

		this._titleAria = new TAria()
		this._titleAria.subscribe((_set, oldValue) =>
			this._sink.emit('change:titleAria', { newValue: this._titleAria.toObject(), oldValue }),
		)

		this._closeAria = new TAria()
		this._closeAria.subscribe((_set, oldValue) =>
			this._sink.emit('change:closeAria', { newValue: this._closeAria.toObject(), oldValue }),
		)
	}

	/**
	 * Эмит собственных событий класса — без приведения `this.events` к
	 * конкретной карте (см. `TEventSink` в `common/event/types.ts`).
	 */
	protected override get _sink(): TEventSink<TModalLayerEvents> {
		return this.events
	}

	/**
	 * Пользователь закрывает панель: кнопкой закрытия, нажатием мимо, Escape
	 * или жестом. Нажатие мимо и Escape при `dismissible: false` отклоняются
	 * без события; остальное проходит через отменяемое `close:before`.
	 *
	 * Зовут его кнопка закрытия и плагины слоя. Код, которому нужно просто
	 * закрыть панель, пишет `visible = false`: запросом это не считается.
	 */
	requestClose(reason: TCloseReason): void {
		// Закрывать нечего
		if (!this.visible) return

		// Нажатие мимо и Escape — не повод, если панель закрывается только
		// кнопкой. Жест — повод: его потребитель включает сам
		if (!this._dismissible && (reason === 'outside' || reason === 'escape')) return

		const event = new TCloseEvent(reason)

		this._sink.emit('close:before', event)

		if (event.defaultPrevented) return

		this.hide()
	}

	/**
	 * Ширина панели: число — px, строка — CSS-значение. Не задана — ширину
	 * даёт тема. Значение уходит теме переменной, а не инлайном: потолок по
	 * экрану и развёрнутое окно тема держит сама.
	 */
	get width(): number | string | undefined {
		return this._width
	}

	set width(value: number | string | undefined) {
		const oldWidth = this.width

		if (this._width === value) return

		this._width = value
		this._sink.emit('change:width', { newValue: value, oldValue: oldWidth })
	}

	/** Высота панели: число — px, строка — CSS-значение. Не задана — высоту даёт тема. */
	get height(): number | string | undefined {
		return this._height
	}

	set height(value: number | string | undefined) {
		const oldHeight = this.height

		if (this._height === value) return

		this._height = value
		this._sink.emit('change:height', { newValue: value, oldValue: oldHeight })
	}

	/**
	 * Показывать ли кнопку закрытия. Без неё панель закрывают нажатие мимо,
	 * Escape (пока `dismissible`), свой жест панели и код.
	 */
	get closable(): boolean {
		return this._closable
	}

	set closable(value: boolean) {
		const oldClosable = this.closable

		if (this._closable === value) return

		this._closable = value
		this._sink.emit('change:closable', { newValue: value, oldValue: oldClosable })
	}

	/**
	 * Закрывают ли панель нажатие мимо и Escape. Выключено — панель
	 * закрывается только кнопкой закрытия, своим жестом и кодом. Закрыть её
	 * только Escape — отменить `close:before` с причиной `outside`.
	 */
	get dismissible(): boolean {
		return this._dismissible
	}

	set dismissible(value: boolean) {
		const oldDismissible = this.dismissible

		if (this._dismissible === value) return

		this._dismissible = value
		this._sink.emit('change:dismissible', { newValue: value, oldValue: oldDismissible })
	}

	/**
	 * Сторона заголовка в связке с панелью. Отдельный набор, а не часть
	 * `aria`: `aria` описывает панель, а это — вложенный элемент без
	 * экземпляра (AGENTS.md, «Часть или слот»). Живой: `id` в него пишет
	 * `TModalLayerIdsPlugin`, об изменении набор сообщает `change:titleAria`.
	 */
	get titleAria(): TAria {
		return this._titleAria
	}

	/**
	 * Набор кнопки закрытия — соседней с содержимым, а не самой панели. Живой:
	 * имя в него пишет плагин имён (`TModalNamesPlugin`) от локали, об
	 * изменении набор сообщает `change:closeAria`.
	 */
	get closeAria(): TAria {
		return this._closeAria
	}

	/**
	 * The backdrop shares its panel’s layer number and open state. An outside press
	 * on a higher backdrop dismisses only that layer. The backdrop stays a sibling
	 * of its panel and carries no owner marker, so the press counts as outside
	 * for its own layer.
	 */
	get backdropDataset(): TDatasetAttributes {
		const layer = this._dataset.get(FRAME_LAYER_ATTRIBUTE)

		return {
			...(layer === undefined ? {} : { [FRAME_LAYER_ATTRIBUTE]: layer }),
			'data-open': String(this.visible),
		}
	}

	get backdrop(): TBackdropView | undefined {
		return this._backdrop.view
	}

	set backdrop(value: TBackdropView | undefined) {
		const oldValue = this._backdrop.view
		if (value === oldValue) return

		this._backdrop.view = value
		this._sink.emit('change:backdrop', { newValue: value, oldValue })
	}

	get backdropClasses(): string[] {
		return this._backdrop.classes.toArray()
	}

	override getProps(): TProps {
		return {
			...super.getProps(),
			backdrop: this.backdrop,
			width: this._width,
			height: this._height,
			closable: this._closable,
			dismissible: this._dismissible,
		}
	}
}
