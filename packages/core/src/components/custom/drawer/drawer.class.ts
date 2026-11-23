import { TModalLayer } from '../../base/modal-layer'
import type { TDefaultValues } from '../../base/component'
import type { TSwipe, TSwipeSide } from '../../base/layer'
import type { TDatasetAttributes } from '../../../common'
import type { IDrawer, IDrawerProps, TDrawerEvents, TDrawerPlacement } from './types'

/**
 * Выезжающая панель — модальный слой у края экрана.
 *
 * Своего паттерна APG у выезжающей панели нет: это модальный Dialog, и всё,
 * что из модальности следует, — роль, `aria-modal`, имя от заголовка, кнопка
 * закрытия, запрос закрытия и размер — у общей с окном базы `TModalLayer`.
 * Панель модальна всегда, в том числе внутри контейнера. Своего у неё —
 * край, жест и место в документе.
 *
 * **Край — значение, раскладка и анимация — тема.** Край уходит модификатором
 * `--placement-<v>` (стоит всегда), открытость — `data-open` слоя: по нему
 * тема уводит закрытую панель за край. Своего въезда и выезда у ядра
 * нет — ни «присутствия», ни хуков под анимацию: закрытая панель спрятана
 * `visible`, а переход до скрытия и после показа держит CSS.
 *
 * **Жест** (`swipe`) — смахнуть панель к её краю, чтобы закрыть: панель —
 * смахиваемый слой (`ISwipeable`), и уходит она к своему краю, `swipeSide`
 * равен `placement`. Тянет `TSwipePlugin`, общий для слоёв: сдвиг во время
 * жеста — операция над узлом, и через обмен на каждом кадре он не ходит. В
 * ядро приходят только значения: `beginSwipe`/`endSwipe` — признак «тянут»
 * (`swiping`, `data-swiping`: по нему тема снимает переход, пока панель идёт
 * за пальцем) — и закрытие запросом с причиной `swipe`. Жест закрывает и при
 * `dismissible: false`: его потребитель включает сам. Отменённое
 * `close:before` оставляет панель открытой, и она возвращается на место.
 *
 * **Внутри контейнера** (`contained`) панель не телепортируется, а встаёт в
 * ближайшем позиционированном предке — например, в модальном окне.
 * Модальность та же, кроме замка прокрутки документа: прокрутку запирает
 * только панель поверх страницы, и для `TScrollLockPlugin` ядро отдаёт это
 * производным значением `locksScroll`, а не флагом в плагине.
 */
export default class TDrawer extends TModalLayer<IDrawerProps, TDrawerEvents> implements IDrawer {
	static override baseClass = 'so-drawer'

	static defaultValues: typeof TModalLayer.defaultValues &
		TDefaultValues<IDrawerProps, 'placement' | 'swipe' | 'contained'> = {
		...TModalLayer.defaultValues,
		placement: 'end',
		swipe: 'none',
		contained: false,
	}

	protected _placement!: TDrawerPlacement
	protected _swipe: TSwipe
	protected _contained!: boolean
	protected _swiping = false
	/** Последнее отданное `locksScroll`: событие — только на его смену. */
	protected _locksScroll = false

	constructor(props: Partial<IDrawerProps> = {}) {
		super(props)

		const ctor = new.target as typeof TDrawer

		this._swipe = props.swipe ?? ctor.defaultValues.swipe

		this._applyPlacement(props.placement ?? ctor.defaultValues.placement)
		this._applyContained(props.contained ?? ctor.defaultValues.contained)
		this._dataset.add('swiping', this._swiping)

		this.events.on('change:visible', () => {
			// Скрытую панель не тянут: жест кончается вместе с ней
			if (!this.visible) this._setSwiping(false)

			this._syncLocksScroll()
		})
	}

	/**
	 * Жест начался: панель тянут. Скрытую панель и панель без жеста тянуть
	 * нельзя — тогда жест не начинается.
	 */
	beginSwipe(): boolean {
		if (this._swipe === 'none' || !this.visible) return false

		this._setSwiping(true)

		return true
	}

	/**
	 * Жест кончился. Закрывать или нет, решил плагин по пройденному пути и
	 * скорости, и закрывает он запросом (`requestClose('swipe')`): его, как и
	 * кнопку, подписчик вправе отменить.
	 */
	endSwipe(): void {
		this._setSwiping(false)
	}

	/** У какого края экрана стоит панель. */
	get placement(): TDrawerPlacement {
		return this._placement
	}

	set placement(value: TDrawerPlacement) {
		const oldPlacement = this.placement
		const oldSwipeSide = this.swipeSide

		if (this._placement === value) return

		this._applyPlacement(value, this._placement)
		this.events.emit('change:placement', { newValue: value, oldValue: oldPlacement })
		// Край — он же сторона ухода жестом
		this.events.emit('change:swipeSide', { newValue: value, oldValue: oldSwipeSide })
	}

	/** За что панель можно утянуть к её краю: ни за что, за полосу или за любое место. */
	get swipe(): TSwipe {
		return this._swipe
	}

	set swipe(value: TSwipe) {
		const oldSwipe = this.swipe

		if (this._swipe === value) return

		this._swipe = value

		// Жест выключили посреди жеста — тянуть больше нечего
		if (value === 'none') this._setSwiping(false)

		this.events.emit('change:swipe', { newValue: value, oldValue: oldSwipe })
	}

	/** Панель внутри своего контейнера, а не поверх страницы. */
	get contained(): boolean {
		return this._contained
	}

	set contained(value: boolean) {
		const oldContained = this.contained

		if (this._contained === value) return

		this._applyContained(value)
		this.events.emit('change:contained', { newValue: value, oldValue: oldContained })
	}

	/** Куда панель уходит жестом — к своему краю. */
	get swipeSide(): TSwipeSide {
		return this._placement
	}

	/** Идёт жест: с `beginSwipe` до `endSwipe` или до скрытия панели. */
	get swiping(): boolean {
		return this._swiping
	}

	/**
	 * Запирает ли панель прокрутку страницы. Запирает открытая панель поверх
	 * страницы; внутри контейнера страница за ней остаётся той, что была.
	 */
	get locksScroll(): boolean {
		return this.visible && !this._contained
	}

	/**
	 * Рисовать ли полосу у края, за которую тянут. Рисуется, пока жест
	 * включён, — и при `panel` тоже: она говорит, что панель можно смахнуть.
	 */
	get handleRendered(): boolean {
		return this._swipe !== 'none'
	}

	/**
	 * `data-*` подложки: номер слоя и открытость, как у любого модального
	 * слоя, и то, что тема читает у самой панели, — место в документе.
	 * Подложка — сосед панели без экземпляра: внутри контейнера она накрывает
	 * только его.
	 */
	override get backdropDataset(): TDatasetAttributes {
		return {
			...super.backdropDataset,
			'data-contained': String(this._contained),
		}
	}

	protected _applyPlacement(newValue: TDrawerPlacement, oldValue?: TDrawerPlacement): void {
		this._classes.swap({
			prefix: '--placement-',
			oldValue,
			newValue,
		})

		this._placement = newValue
	}

	protected _applyContained(value: boolean): void {
		this._contained = value

		// Тема по нему ставит панель и подложку в контейнер, а не на экран
		this._dataset.add('contained', value)
		this._syncLocksScroll()
	}

	protected _setSwiping(value: boolean): void {
		const oldSwiping = this.swiping

		if (this._swiping === value) return

		this._swiping = value
		this._dataset.add('swiping', value)
		this.events.emit('change:swiping', { newValue: value, oldValue: oldSwiping })
	}

	/** `change:locksScroll` — только на смену: открытость и место меняются врозь. */
	protected _syncLocksScroll(): void {
		const oldLocksScroll = this.locksScroll

		const value = this.locksScroll

		if (this._locksScroll === value) return

		this._locksScroll = value
		this.events.emit('change:locksScroll', { newValue: value, oldValue: oldLocksScroll })
	}

	override getProps(): IDrawerProps {
		return {
			...super.getProps(),
			placement: this._placement,
			swipe: this._swipe,
			contained: this._contained,
		}
	}
}
