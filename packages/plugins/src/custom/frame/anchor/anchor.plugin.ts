import { TEvented, type IFrame, type TDefaultValues, type TValuePayload } from '@soxa-ui/core'
import { TBasePlugin } from '../../../base'
import type { IPluginContext } from '../../../base'
import { TElementPlugin } from '../../element'
import { afterTransitions, isPinnedToViewport, positionOriginOf } from '../../../utils'
import type { TPoint } from '../../../utils'
import type {
	IAnchorPluginOptions,
	IAnchorPluginProps,
	TAnchorPluginEvents,
	TAnchorRect,
	TFramePlacement,
} from './types'

/**
 * Атрибут фактической стороны панели после flip: плагин пишет его в `dataset`
 * Frame. Читают его тема и плагин жеста (`TSwipePlugin`): панель у триггера
 * уходит жестом от него, а под ним она или над ним, знает только её узел.
 *
 * Имя с префиксом `data-`: по нему читают узел, а `dataset` принимает имя с
 * префиксом как есть.
 */
export const ANCHOR_PLACEMENT_ATTRIBUTE = 'data-placement'

/** Сторона блока — панель над якорем или под ним. */
type TBlockSide = 'top' | 'bottom'

/**
 * Сторона строки — панель у начала или у конца строки якоря. Логическая: в
 * LTR начало слева, в RTL справа.
 */
type TInlineSide = 'start' | 'end'

/** Сторона панели у якоря — на одной из двух осей. */
type TAnchorSide = TBlockSide | TInlineSide

/**
 * Выравнивание панели вдоль якоря: у верха и низа — по строке, у боковой
 * стороны — по вертикали.
 */
type TAlignment = 'start' | 'center' | 'end'

/** Размер панели, по которому считается её место (см. `_panelSize`). */
type TPanelSize = { readonly width: number; readonly height: number }

/** Сторона напротив — на той же оси: flip переносит панель, но не поворачивает. */
const OPPOSITE: Readonly<Record<TAnchorSide, TAnchorSide>> = {
	top: 'bottom',
	bottom: 'top',
	start: 'end',
	end: 'start',
}

const opposite = (side: TAnchorSide): TAnchorSide => OPPOSITE[side]

/** Сторона на оси строки — панель сбоку от якоря. */
const isInlineSide = (side: TAnchorSide): side is TInlineSide => side === 'start' || side === 'end'

/**
 * Стоит ли сторона строки слева от якоря: в LTR — начало, в RTL — конец.
 * Физическая сторона нужна только расчёту — наружу (`data-placement`) уходит
 * логическая.
 */
const isLeftSide = (side: TInlineSide, rtl: boolean): boolean => (side === 'start') !== rtl

/**
 * Shift: отрезок длиной `size` с началом `start` сдвигается внутрь
 * `[0, limit]`, чтобы не вылезал ни с одной стороны. Длиннее границы —
 * прижимается к нулю: видно хотя бы начало.
 */
const shiftInto = (start: number, size: number, limit: number): number =>
	Math.min(Math.max(start, 0), Math.max(0, limit - size))

/** Одна ли это точка: координаты те же, или точки нет у обеих. */
const samePoint = (a: TPoint | null, b: TPoint | null): boolean =>
	a === b || (a !== null && b !== null && a.x === b.x && a.y === b.y)

/**
 * TAnchorPlugin — привязка Frame к чужому элементу.
 *
 * Общий слой для всего, что открывается у чего-то: выпадающий список Select,
 * меню у кнопки, поповер, подсказка. Сам ничего не рисует — вычисляет
 * координаты и пишет их во Frame (`x`, `y`, при `matchWidth` ещё `width`).
 * Дальше их раскладывает `TFrameLayoutPlugin`, как любые другие координаты.
 *
 * Разделение не формальное: раскладка отвечает за собственные пропсы Frame,
 * привязка — за слежение за посторонним элементом. Смешивать их значит
 * заводить в одном плагине два повода меняться.
 *
 * **Место считается, пока панель на экране** — показана или ещё гаснет.
 * Закрытые панели у полей — списки Select, подсказки, меню, календари
 * DatePicker — стоят на странице десятками, и каждая на каждом кадре
 * прокрутки меряла бы свой якорь и писала бы во Frame новые координаты.
 * Поэтому якорь плагин запоминает сразу, а слежение за ним (`_subscribe`)
 * заводит показ Frame, у Frame, созданного видимым, — назначение якоря.
 * Снимает его конец закрытия: когда корень доиграл переходы закрытия
 * (`afterTransitions`), — гаснущая и уходящая жестом панель идёт за полем до
 * конца. Новый показ ожидание отменяет. Снятие места — якоря, когда точки нет,
 * и точки, когда нет якоря, — и `destroy()` снимают слежение сразу, снятый
 * корень — тоже: панели на экране нет, и ждать её перехода незачем, — а новый
 * корень показанной панели слежение возвращает.
 * Вне слежения место не считает ничто — ни прокрутка, ни наблюдатель панели,
 * ни сеттеры, — на любой стороне, сбоку тоже: показ считает его заново.
 * Открытость плагин ведёт сам, по `show` и `hide` своего Frame, а не
 * адаптер: якорь только у открытой панели развёл бы это правило по шести
 * адаптерам.
 *
 * `placement` — сторона и выравнивание по якорю: `-start` — по началу, `-end` —
 * по концу, без суффикса — по центру. Стороны блока, `top` и `bottom`, ставят
 * панель над якорем или под ним, и выравнивание идёт вдоль строки. Стороны
 * строки, `start` и `end`, ставят её у начала или конца строки якоря, и
 * выравнивание идёт вдоль якоря по вертикали: `-start` — верхние края вровень,
 * `-end` — нижние. Поверх этого выбора плагин сам решает две вещи:
 * **flip** — если панель не влезает с выбранной стороны (сверху и снизу — по
 * высоте, сбоку — по ширине), а с противоположной места больше, показывает её
 * там; **shift** — сдвигает панель вдоль якоря, чтобы она не вылезала за край:
 * у верха и низа — `x`, у боковой — `y`. Границей обоим служит видимая область
 * окна, без классической полосы прокрутки (см. `_viewport`). Оба работают
 * внутри тех же вариантов `placement`: flip переключает только сторону, на той
 * же оси, — выравнивание, центр в том числе, остаётся, — а shift не меняет
 * `placement` и только ограничивает координату. Flip выключается свойством
 * `flip` (по умолчанию включён): панель остаётся на стороне потребителя, даже
 * если там не влезает. Shift от него не зависит.
 *
 * Боковая панель сверх того прижимается к краям окна и по `x`: не влезла ни с
 * одной стороны (узкий экран, широкое содержимое вроде календаря) — накрывает
 * якорь, но видна целиком. У верха и низа этот случай закрывает потолок высоты
 * панели в теме, а потолка ширины у произвольного содержимого нет.
 *
 * У flip есть память. Правило выше только выбирает сторону (`_chooseSide`), а
 * открытая панель свою держит (`_holdSide`): пока на ней влезает — стоит, не
 * влезла — переходит на противоположную, только если влезает там, не влезает
 * нигде — стоит. Правило без памяти скакало: одна и та же граница «снизу
 * влезает» и уводила панель наверх, и возвращала её вниз. На телефоне палец
 * двигает страницу по пикселю туда и обратно, адресная строка браузера
 * прячется и выезжает, и поле всё время стоит на этой границе, а на коротком
 * экране, где панель не влезает нигде, сторона менялась на каждом переходе
 * поля через середину экрана. Так же поступает CSS Anchor Positioning — держит
 * последний удачный вариант. Сбоку правило и память те же, только место
 * меряется по ширине: границу «сбоку влезает» якорь переходит при прокрутке
 * вбок и смене ширины окна. Сторону забывают показ Frame, смена `placement` и
 * `flip`, смена и снятие якоря и `contained`, и следующий расчёт выбирает её
 * заново. Закрытие её не забывает: гаснущая панель держит сторону, как
 * открытая.
 *
 * `RTL` (`getComputedStyle(anchor).direction`) разворачивает ось строки. У
 * верха и низа — выравнивание: в RTL `-start` выравнивает панель по правому
 * краю якоря, `-end` — по левому. У боковой — сторону: в RTL `start` справа
 * от якоря, `end` — слева. Центр и выравнивание боковой панели по вертикали
 * от направления не зависят.
 *
 * Фактическая сторона после flip уходит теме через `data-placement` на самом
 * Frame (`frame.dataset`) — она не всегда совпадает с тем, что задал
 * потребитель в `placement`. Выравнивание в ней — потребителя, а сторона
 * логическая и в RTL: `end-start`, перенесённый flip-ом, — `start-start`.
 *
 * `position` панели у якоря выбирает плагин (`_choosePosition`), как пишет
 * её `x` и `y`: `absolute`, а у якоря, который стоит в окне, — `fixed`.
 * Панель `fixed` прокрутку страницы не замечает, и сдвинуть её за полем
 * может только пересчёт по `scroll`. На телефоне страницу прокручивает
 * композитор, а `scroll` приходит в JS кадром позже: поле уже уехало, панель
 * кадр стоит и догоняет — дрожит на каждом кадре прокрутки. Ни кадр
 * (`requestAnimationFrame`), ни память стороны этого не снимают. Панель
 * `absolute` лежит в документе, и окно браузер прокручивает вместе с ней и
 * полем, без JS, — так у PrimeVue. Якорь в окне (`fixed` или `sticky` к
 * окну, `isPinnedToViewport`) прокрутка окна не двигает, и панель `absolute`
 * отставала бы от него наоборот — у него `fixed`. Выбирают заново показ Frame
 * и смена якоря у показанной панели.
 *
 * Внутренняя прокрутка — граница, а не недоделка. Поле в своём прокручиваемом
 * блоке, а панель в `body`: её отставание на кадр снимет только CSS Anchor
 * Positioning, где место считает браузер, — или `target` панели в самом
 * блоке, и тогда она едет вместе с ним.
 *
 * **Точка** (`point`) — место вместо якоря: контекстное меню встаёт у места
 * вызова, а не у области, в которой его вызвали. Точка главнее якоря, пока
 * задана, — иначе выбирать, к чему привязать панель, пришлось бы шаблону, —
 * а снятая возвращает панель к якорю. Это прямоугольник нулевого размера в
 * координатах окна, и расчёт у него тот же: стороны, flip, shift, RTL
 * (направление — якоря, без него — самой панели) и `data-placement`, и
 * считается он так же, пока панель на экране: у закрытой точка только
 * запоминается. Своего у точки три вещи: панель `fixed` — точка стоит в окне,
 * как якорь в `fixed`-шапке; пересчёт только на смену размера окна —
 * прокрутка и размер чужого элемента точку не двигают, и наблюдателя якоря у
 * неё нет; `matchWidth` не действует — ширины у точки нет. Новая точка, как
 * новый якорь, выбирает сторону заново.
 *
 * Считается всё в координатах окна (`getBoundingClientRect()`), а во Frame
 * уходит от угла блока, от которого браузер отсчитывает `left`/`top` панели
 * (`positionOriginOf`): у `absolute` в `body` это начало документа, в
 * позиционированном предке — его угол с прокруткой, у `fixed` — окно или
 * предок с трансформацией. Панель внутри контейнера (`contained`) якорь не
 * двигает: её место в контейнере решает тема, и стороны у неё нет —
 * `data-placement` снимается.
 *
 * По той же причине оба наблюдателя (`ResizeObserver`) смотрят border-box:
 * наблюдать надо ровно то, что меряем. Умолчание `content-box` пропустило бы
 * смену одной рамки или паддинга — толщина рамки по состоянию, паддинг по
 * размеру, — и координаты держались бы устаревшими до ближайшего
 * scroll/resize окна.
 */
export class TAnchorPlugin extends TBasePlugin<any, TAnchorPluginEvents> {
	/** Measurements report geometry independently of the anchor input events. */
	readonly rectEvents = new TEvented<{
		change: (payload: TValuePayload<TAnchorRect | null>) => void
	}>()
	/**
	 * Умолчания пропов плагина. Из них стартуют поля плагина, и их же
	 * `definePlugin` кладёт в декларации пропов: значение живёт в одном месте.
	 * `flip: true` в приватном поле адаптер не увидел бы и отдал бы Frame без
	 * `anchor_flip` своё `false`.
	 *
	 * `anchor: null` — «панель ни к чему не привязана». Якорь не опция, его
	 * задаёт только разметка, но умолчание объявлено и ему: снятый из разметки
	 * проп связка возвращает к умолчанию декларации, и без него панель
	 * оставалась бы привязанной к прежнему элементу. Так же `point: null` —
	 * «точки нет, панель у якоря».
	 */
	static defaultValues: TDefaultValues<
		IAnchorPluginProps,
		'anchor' | 'point' | 'placement' | 'matchWidth' | 'flip' | 'offset'
	> = {
		anchor: null,
		point: null,
		placement: 'bottom-start',
		matchWidth: false,
		flip: true,
		offset: 0,
	}

	private _frame: IFrame | null = null
	private _element: Element | null = null
	/** Якорю нужны только `getBoundingClientRect()` и `parentElement` — хватает `Element`. */
	private _anchor: Element | null = TAnchorPlugin.defaultValues.anchor
	/** Точка в координатах окна — главнее якоря, пока задана. */
	private _point: TPoint | null = TAnchorPlugin.defaultValues.point
	private _rect: TAnchorRect | null = null
	private _placement: TFramePlacement = TAnchorPlugin.defaultValues.placement
	private _matchWidth = TAnchorPlugin.defaultValues.matchWidth
	private _flip = TAnchorPlugin.defaultValues.flip
	private _offset = TAnchorPlugin.defaultValues.offset
	private _cleanups: Array<() => void> = []
	private _panelObserver: ResizeObserver | null = null
	/**
	 * Кадр, в котором вернётся наблюдение панели, снятое на уведомление якоря
	 * (см. `_onAnchorResize`); `null` — возвращать нечего.
	 */
	private _panelResumeFrame: number | null = null
	/** Сторона, реально отданная во Frame — по ней решаем, менялся ли `data-placement`. */
	private _actualPlacement: TFramePlacement | null = null
	/**
	 * Сторона, которую держит панель (см. `_holdSide`); `null` — держать
	 * нечего, и сторону выбирает `_chooseSide`. Она всегда на оси выбора
	 * потребителя: смена `placement` память забывает.
	 *
	 * Запоминает её только расчёт с разложенной панелью — высотой больше нуля.
	 * На `show` закрытая панель ещё не разложена (`display: none`), а нулевой
	 * размер влезает с любой стороны: запомненная по нему сторона держалась бы
	 * на первом настоящем измерении вместо выбора. Поэтому `_actualPlacement`
	 * памятью не служит — его пишет любой расчёт. Признак раскладки — высота и
	 * у боковой панели, которой место меряют по ширине: ширину при
	 * `matchWidth` даёт якорь и до раскладки, а высоту знает только узел.
	 */
	private _heldSide: TAnchorSide | null = null
	/**
	 * Слежение идёт: панель показана или ещё гаснет (см. описание класса). Вне
	 * слежения у плагина нет подписок на якорь, и место он не считает.
	 */
	private _following = false
	/** Отмена ожидания конца перехода закрытия; `null` — плагин не ждёт. */
	private _stopWaiting: (() => void) | null = null

	override install(ctx: IPluginContext, options?: IAnchorPluginOptions): void {
		super.install(ctx, options)

		this._placement = options?.placement ?? this._placement
		this._matchWidth = options?.matchWidth ?? this._matchWidth
		this._flip = options?.flip ?? this._flip
		this._offset = options?.offset ?? this._offset
		this._frame = ctx.getInstance<IFrame>() ?? null
		// Frame, созданный видимым, уже на экране, а `show` для него не придёт:
		// за якорем он следит с назначения
		this._following = this._frame?.visible ?? false

		const elementPlugin = ctx.get(TElementPlugin)

		// Размер панели меняется вместе с содержимым (выросший Popover, теги
		// перенеслись) без единого scroll/resize — за ним следит свой наблюдатель.
		// Его колбэк ничего не приостанавливает: `observe()` сразу присылает
		// уведомление, и пауза здесь зациклилась бы (см. `_onAnchorResize`).
		elementPlugin?.events.on('ready', (element) => {
			this._cancelPanelResume()
			this._element = element
			this._panelObserver?.disconnect()
			this._panelObserver = new ResizeObserver(() => this._update())
			this._panelObserver.observe(element, { box: 'border-box' })
			// Показанной панели вернули корень: слежение, снятое на `removed`,
			// возвращается
			if (!this._following && this._frame?.visible) this._follow()
			this._update()
		})

		// Панели на экране нет: ни следить за якорем, ни ждать её перехода
		// закрытия незачем
		elementPlugin?.events.on('removed', () => {
			this._cancelPanelResume()
			this._panelObserver?.disconnect()
			this._panelObserver = null
			this._element = null
			this._unfollow()
		})

		// Панель могла открыться после того, как якорь уже назначен. Сторону
		// показ выбирает заново: прошлое открытие встало там, где было место
		// тогда
		this._listenTo(this._frame?.events, 'show', () => {
			this._heldSide = null
			this._choosePosition()
			this._follow()
			this._update()
		})
		this._listenTo(this._frame?.events, 'hide', () => this._unfollowAfterTransitions())
		this._listenTo(this._frame?.events, 'change:contained', () => this._update())
	}

	/**
	 * Назначает якорь. У закрытой панели якорь только запоминается: место
	 * посчитает показ.
	 */
	setAnchor(element: Element): void {
		const oldAnchor = this.anchor

		if (this._anchor === element) return

		this._anchor = element
		this._onPlaceChange()
		this.events.emit('change:anchor', { newValue: element, oldValue: oldAnchor })
	}

	removeAnchor(): void {
		const oldAnchor = this.anchor

		if (!this._anchor) return

		this._anchor = null
		this._onPlaceChange()
		this.events.emit('change:anchor', { newValue: null, oldValue: oldAnchor })
	}

	get anchor(): Element | null {
		return this._anchor
	}

	/**
	 * Точка в координатах окна, у которой встаёт панель, — главнее якоря,
	 * пока задана (см. описание класса). Значение: сверяется по координатам, и
	 * та же точка ничего не пересчитывает. У закрытой панели только
	 * запоминается, как якорь.
	 */
	get point(): TPoint | null {
		return this._point
	}

	set point(value: TPoint | null) {
		const oldPoint = this.point

		if (samePoint(this._point, value)) return

		this._point = value === null ? null : { x: value.x, y: value.y }
		this._onPlaceChange()
		this.events.emit('change:point', { newValue: this._point, oldValue: oldPoint })
	}

	get placement(): TFramePlacement {
		return this._placement
	}

	set placement(value: TFramePlacement) {
		const oldPlacement = this.placement

		if (this._placement === value) return

		this._placement = value
		this._heldSide = null
		this._update()
		this.events.emit('change:placement', { newValue: value, oldValue: oldPlacement })
	}

	get matchWidth(): boolean {
		return this._matchWidth
	}

	set matchWidth(value: boolean) {
		const oldMatchWidth = this.matchWidth

		if (this._matchWidth === value) return

		this._matchWidth = value
		this._update()
		this.events.emit('change:matchWidth', { newValue: value, oldValue: oldMatchWidth })
	}

	get flip(): boolean {
		return this._flip
	}

	set flip(value: boolean) {
		const oldFlip = this.flip

		if (this._flip === value) return

		this._flip = value
		this._heldSide = null
		this._update()
		this.events.emit('change:flip', { newValue: value, oldValue: oldFlip })
	}

	get offset(): number {
		return this._offset
	}

	set offset(value: number) {
		const oldOffset = this.offset

		if (this._offset === value) return

		this._offset = value
		this._update()
		this.events.emit('change:offset', { newValue: value, oldValue: oldOffset })
	}

	override destroy(): void {
		this._unfollow()

		this._cancelPanelResume()
		this._panelObserver?.disconnect()
		this._panelObserver = null

		this._frame = null
		this._element = null
		this._anchor = null
		this._point = null

		super.destroy()
	}

	/** Last measured anchor rectangle in viewport coordinates. */
	get rect(): TAnchorRect | null {
		return this._rect
	}

	private _setRect(value: TAnchorRect | null): void {
		const oldValue = this._rect
		if (
			oldValue?.left === value?.left &&
			oldValue?.top === value?.top &&
			oldValue?.right === value?.right &&
			oldValue?.bottom === value?.bottom &&
			oldValue?.width === value?.width
		)
			return

		this._rect = value
		this.rectEvents.emit('change', { oldValue, newValue: value })
	}

	/**
	 * Место панели сменилось — якорь или точка. Сторону следующий расчёт
	 * выбирает заново: прошлую выбрали у другого места. Места не осталось —
	 * панель ни к чему не привязана: подписок нет, и стороны, которую видит
	 * тема, тоже. У закрытой панели место только запоминается — посчитает его
	 * показ, — у показанной `position`, подписки и координаты — по новому
	 * месту.
	 */
	private _onPlaceChange(): void {
		this._heldSide = null

		if (!this._anchor && !this._point) {
			this._setRect(null)
			this._unsubscribe()
			this._actualPlacement = null
			this._frame?.dataset.add(ANCHOR_PLACEMENT_ATTRIBUTE, null)

			return
		}

		if (!this._following) return

		this._choosePosition()
		this._subscribe()
		this._update()
	}

	/**
	 * Прямоугольник места панели в координатах окна: у точки — нулевого
	 * размера, иначе якоря. Нет ни того, ни другого — `null`.
	 */
	private _placeRect(): TAnchorRect | null {
		const point = this._point

		if (point) return { left: point.x, right: point.x, top: point.y, bottom: point.y, width: 0 }

		return this._anchor?.getBoundingClientRect() ?? null
	}

	/**
	 * Письмо справа налево — у якоря, а у точки без якоря — у самой панели:
	 * начало у точки там же, откуда идёт строка вокруг неё.
	 */
	private get _rtl(): boolean {
		const source = this._anchor ?? this._element

		return source !== null && getComputedStyle(source).direction === 'rtl'
	}

	/**
	 * Тянуть ширину панели есть по чему, только пока место — якорь: ширины у
	 * точки нет, и `matchWidth` с ней панель не сжимает.
	 */
	private get _matchesWidth(): boolean {
		return this._matchWidth && this._point === null
	}

	/**
	 * Считает координаты и кладёт их во Frame.
	 *
	 * Вне слежения не считает ничего, на какой бы стороне ни стояла панель:
	 * закрытой панели место не нужно, его посчитает показ (см. описание
	 * класса).
	 *
	 * Расчёт выбирает сторона после flip. Над якорем и под ним `x` идёт от
	 * выравнивания по строке (`_resolveX`), а `y` — от стороны. Сбоку наоборот:
	 * `x` — от стороны (`_inlineX`), `y` — от выравнивания по вертикали
	 * (`_inlineY`). Место — якорь или точка (`_placeRect`).
	 *
	 * При `matchWidth` ширину панели для `x` и shift даёт якорь (см.
	 * `_panelSize`), а не записанный во Frame `width`: до DOM он доедет только
	 * после рендера адаптера.
	 */
	private _update(): void {
		if (!this._following) return

		const frame = this._frame

		if (frame?.contained) {
			this._setRect(null)
			this._heldSide = null
			this._applyPlacement(null)

			return
		}

		const rect = this._placeRect()

		if (!frame || !rect) return

		const panel = this._panelSize(rect)

		if (this._matchesWidth) frame.width = rect.width

		const rtl = this._rtl
		const alignment = this._alignment
		const side = this._resolveSide(rect, panel, rtl)
		const origin = positionOriginOf(this._element, frame.strategy)

		if (isInlineSide(side)) {
			frame.x = this._inlineX(side, rect, panel.width, rtl) - origin.x
			frame.y = this._inlineY(rect, panel.height, alignment) - origin.y
		} else {
			frame.x = this._resolveX(rect, panel.width, alignment, rtl) - origin.x
			frame.y =
				(side === 'top'
					? rect.top - panel.height - this._offset
					: rect.bottom + this._offset) - origin.y
		}

		this._setRect(rect)
		this._applyPlacement(alignment === 'center' ? side : `${side}-${alignment}`)
	}

	/**
	 * `position` панели: `fixed` у точки и у якоря, который стоит в окне, иначе
	 * `absolute` (см. описание класса). Точка — в координатах окна и стоит в
	 * нём, как якорь в `fixed`-шапке.
	 *
	 * Выбранное держится до следующего показа или смены места. Стили предков
	 * якоря на каждом `scroll` не перечитываем: шапка, которая стала `fixed`
	 * при открытой панели, — редкость, а обход предков со стилями на каждом
	 * кадре прокрутки обошёлся бы всем.
	 */
	private _choosePosition(): void {
		const frame = this._frame

		if (!frame) return

		if (this._point) {
			frame.strategy = 'fixed'

			return
		}

		const anchor = this._anchor

		if (anchor) frame.strategy = isPinnedToViewport(anchor) ? 'fixed' : 'absolute'
	}

	/**
	 * Выравнивание из выбора потребителя — конец значения: суффикс `-start` или
	 * `-end`, а значение без суффикса (`top`, `bottom`, `start`, `end`) — центр.
	 * Суффикс — с дефисом: значение `start` — сторона с центром, а не
	 * выравнивание по началу.
	 */
	private get _alignment(): TAlignment {
		if (this._placement.endsWith('-start')) return 'start'
		if (this._placement.endsWith('-end')) return 'end'

		return 'center'
	}

	/**
	 * Размер видимой области — граница и для flip, и для shift.
	 *
	 * Берём `window.visualViewport`: он знает область без классической полосы
	 * прокрутки, а `innerWidth`/`innerHeight` считают полосу своей, и панель у
	 * самого края окна уезжала под неё полоской примерно в 15px. Тот же выбор
	 * границы у Floating UI для стратегии `fixed`, на которой только и работает
	 * привязка.
	 *
	 * Объекта нет (jsdom, старые браузеры) — остаётся окно.
	 * `document.documentElement.clientWidth` не берём: в jsdom он нулевой, и
	 * юнит-тесты панелей пришлось бы подпирать.
	 *
	 * Смещение видимой области при pinch-zoom (`offsetLeft`/`offsetTop`) не
	 * учитываем — координаты панели отсчитываются от окна. Это осознанная
	 * граница, а не недоделка: сдвинутую лупой область пришлось бы учитывать и
	 * в `y`, и в подписке на её собственные scroll/resize.
	 */
	private get _viewport(): { readonly width: number; readonly height: number } {
		return window.visualViewport ?? { width: window.innerWidth, height: window.innerHeight }
	}

	/**
	 * Сторона с учётом flip — на оси выбора потребителя.
	 *
	 * Выбор потребителя в `_placement` не перетирается — flip живёт только
	 * здесь, в вычислении фактической стороны. С выключенным `flip` сторона
	 * потребителя отдаётся сразу, и память не участвует. Иначе панель держит
	 * запомненную сторону (`_holdSide`), а пока держать нечего, сторону
	 * выбирает правило (`_chooseSide`). Запоминает её только расчёт с
	 * разложенной панелью (см. `_heldSide`).
	 *
	 * Правило у обеих осей одно, разная только мера: над якорем и под ним
	 * панели нужна её высота, сбоку — ширина, и там и там с отступом от якоря.
	 */
	private _resolveSide(rect: TAnchorRect, panel: TPanelSize, rtl: boolean): TAnchorSide {
		const wants = this._wantedSide

		if (!this._flip) return wants

		const needed = (isInlineSide(wants) ? panel.width : panel.height) + this._offset
		const side =
			this._heldSide === null
				? this._chooseSide(wants, rect, needed, rtl)
				: this._holdSide(this._heldSide, rect, needed, rtl)

		if (panel.height > 0) this._heldSide = side

		return side
	}

	/**
	 * Сторона из выбора потребителя. Её называет начало значения, а не
	 * префикс с дефисом: у центра суффикса нет, и `top` по префиксу `top-`
	 * уехал бы вниз.
	 */
	private get _wantedSide(): TAnchorSide {
		if (this._placement.startsWith('top')) return 'top'
		if (this._placement.startsWith('start')) return 'start'
		if (this._placement.startsWith('end')) return 'end'

		return 'bottom'
	}

	/**
	 * Выбор стороны — у панели, которая стороны ещё не держит.
	 *
	 * Сторона потребителя, а если на ней панель не влезает в видимую область,
	 * а на противоположной места больше, — противоположная. Не влезает
	 * нигде — остаёмся на стороне потребителя.
	 */
	private _chooseSide(
		wants: TAnchorSide,
		rect: TAnchorRect,
		needed: number,
		rtl: boolean,
	): TAnchorSide {
		const spaceWanted = this._spaceAt(wants, rect, rtl)
		const spaceOpposite = this._spaceAt(opposite(wants), rect, rtl)

		if (spaceWanted >= needed || spaceOpposite <= spaceWanted) return wants

		return opposite(wants)
	}

	/**
	 * Удержание стороны: панель стоит на ней, пока там влезает. Не влезла —
	 * переходит на противоположную, только если влезает там; не влезает
	 * нигде — остаётся.
	 *
	 * Правило выбора для этого не годится: граница у него одна — «на стороне
	 * потребителя влезает», а когда не влезает нигде, — середина экрана, — и
	 * поле, которое стоит на ней, переводило бы панель туда и обратно на
	 * каждом пикселе прокрутки. У удержания границы две — «здесь перестала
	 * влезать» и «там влезает», — и между ними панель стоит, где стоит. Запас
	 * между границами — не подобранное число пикселей, а вся полоса, где
	 * панель влезает с обеих сторон или ни с одной.
	 */
	private _holdSide(
		side: TAnchorSide,
		rect: TAnchorRect,
		needed: number,
		rtl: boolean,
	): TAnchorSide {
		if (this._spaceAt(side, rect, rtl) >= needed) return side

		return this._spaceAt(opposite(side), rect, rtl) >= needed ? opposite(side) : side
	}

	/**
	 * Место в видимой области с этой стороны якоря: над ним (`top`) и под ним
	 * (`bottom`) — по высоте, у начала и конца строки (`start`, `end`) — по
	 * ширине, слева или справа по направлению письма.
	 */
	private _spaceAt(side: TAnchorSide, rect: TAnchorRect, rtl: boolean): number {
		if (side === 'top') return rect.top
		if (side === 'bottom') return this._viewport.height - rect.bottom

		return isLeftSide(side, rtl) ? rect.left : this._viewport.width - rect.right
	}

	/**
	 * Левый край панели над якорем или под ним — с учётом выравнивания, RTL и
	 * shift.
	 *
	 * После выравнивания (`_alignX`) `x` сдвигается внутрь видимой области по
	 * горизонтали, чтобы панель не вылезала ни слева, ни справа — если панель
	 * шире области, прижимается к левому краю. Центр сдвигается так же, как
	 * начало и конец: у края окна панель перестаёт стоять по центру якоря, но
	 * остаётся видна целиком.
	 */
	private _resolveX(
		rect: TAnchorRect,
		panelWidth: number,
		alignment: TAlignment,
		rtl: boolean,
	): number {
		return shiftInto(
			this._alignX(rect, panelWidth, alignment, rtl),
			panelWidth,
			this._viewport.width,
		)
	}

	/**
	 * Левый край панели по выравниванию, до shift.
	 *
	 * Центр — середина якоря минус половина панели, от направления он не
	 * зависит. Начало и конец логические: в LTR `start` — левый край якоря,
	 * `end` — правый, в RTL наоборот.
	 */
	private _alignX(
		rect: TAnchorRect,
		panelWidth: number,
		alignment: TAlignment,
		rtl: boolean,
	): number {
		if (alignment === 'center') return (rect.left + rect.right - panelWidth) / 2

		const alignRight = rtl ? alignment === 'start' : alignment === 'end'

		return alignRight ? rect.right - panelWidth : rect.left
	}

	/**
	 * Левый край боковой панели: слева от якоря или справа по стороне и
	 * направлению письма, с зазором `offset`, — и прижатый к видимой области.
	 *
	 * Прижим по `x` у боковой панели — сверх shift: не влезла ни с одной
	 * стороны, и flip её не спас, — накрывает якорь, но видна целиком (см.
	 * описание класса). Шире области — прижимается к левому краю, как панель
	 * над якорем и под ним.
	 */
	private _inlineX(
		side: TInlineSide,
		rect: TAnchorRect,
		panelWidth: number,
		rtl: boolean,
	): number {
		const x = isLeftSide(side, rtl)
			? rect.left - panelWidth - this._offset
			: rect.right + this._offset

		return shiftInto(x, panelWidth, this._viewport.width)
	}

	/**
	 * Верхний край боковой панели по выравниванию — и shift: `y` сдвигается
	 * внутрь видимой области по вертикали, чтобы панель не вылезала ни сверху,
	 * ни снизу; выше области — прижимается к верхнему краю.
	 */
	private _inlineY(rect: TAnchorRect, panelHeight: number, alignment: TAlignment): number {
		return shiftInto(
			this._alignY(rect, panelHeight, alignment),
			panelHeight,
			this._viewport.height,
		)
	}

	/**
	 * Верхний край боковой панели по выравниванию, до shift: `start` — верхние
	 * края панели и якоря вровень, `end` — нижние, центр — середина к
	 * середине. Ось вертикальная, и от направления письма выравнивание не
	 * зависит.
	 */
	private _alignY(rect: TAnchorRect, panelHeight: number, alignment: TAlignment): number {
		if (alignment === 'start') return rect.top
		if (alignment === 'end') return rect.bottom - panelHeight

		return (rect.top + rect.bottom - panelHeight) / 2
	}

	/** Пишет фактическую сторону во Frame, только если она изменилась. */
	private _applyPlacement(placement: TFramePlacement | null): void {
		if (this._actualPlacement === placement) return

		this._actualPlacement = placement
		this._frame?.dataset.add(ANCHOR_PLACEMENT_ATTRIBUTE, placement)
	}

	/**
	 * Размер панели. Нужен для выравнивания по правому краю и по центру, для
	 * показа сверху и слева, для flip и для shift — везде координата
	 * отсчитывается от размера панели, а не только от якоря.
	 *
	 * Берём `getBoundingClientRect()`, а не `offsetWidth`/`offsetHeight`:
	 * оба нулевые, пока `v-show` держит панель на `display: none`, но
	 * `getBoundingClientRect()` пересчитывается уже на первом кадре после
	 * того, как её сняли — раньше на это полагаться было нельзя, теперь за
	 * этим кадром следит `ResizeObserver`.
	 *
	 * При `matchWidth` ширина берётся из якоря, а не из DOM: во Frame она уже
	 * записана, но узел получит её только после рендера адаптера, а панели ещё
	 * может не быть вовсе. Поэтому список под полем не зависит от того,
	 * отрисовалась ли панель, и с `*-end` не мигает по устаревшей ширине.
	 * Высоту якорь не знает — она всегда из DOM.
	 */
	private _panelSize(anchorRect: TAnchorRect): TPanelSize {
		const panel = this._element?.getBoundingClientRect()

		return {
			width: this._matchesWidth ? anchorRect.width : (panel?.width ?? 0),
			height: panel?.height ?? 0,
		}
	}

	/**
	 * Заводит слежение: показ Frame, у Frame, созданного видимым, —
	 * назначение якоря (см. описание класса). Ожидание конца закрытия
	 * отменяется: панель снова открыта.
	 */
	private _follow(): void {
		this._stopWaitingTransitions()
		this._following = true
		this._subscribe()
	}

	/** Снимает слежение сразу — вместе с ожиданием конца закрытия, если оно шло. */
	private _unfollow(): void {
		this._stopWaitingTransitions()
		this._following = false
		this._unsubscribe()
		this._setRect(null)
	}

	/**
	 * Закрытие снимает слежение, когда корень доиграет переходы закрытия:
	 * гаснущая и уходящая жестом панель ещё на экране и идёт за полем до
	 * конца. Снятое прямо на `hide`, слежение оставило бы её стоять, пока поле
	 * уезжает. Корня нет — ждать нечего, и слежение снимается сразу.
	 */
	private _unfollowAfterTransitions(): void {
		if (!this._following) return

		const element = this._element

		if (!element) {
			this._unfollow()

			return
		}

		this._stopWaitingTransitions()
		this._stopWaiting = afterTransitions(element, () => {
			this._stopWaiting = null
			this._unfollow()
		})
	}

	/** Отменяет ожидание конца закрытия. */
	private _stopWaitingTransitions(): void {
		this._stopWaiting?.()
		this._stopWaiting = null
	}

	/**
	 * Следит за тем, что двигает место панели.
	 *
	 * У якоря — скролл его предков, ресайз окна и изменение размера самого
	 * якоря (без скролла — например, у него пропал соседний тег). Scroll и
	 * resize пересчитывают координаты сразу, уведомление наблюдателя якоря —
	 * через `_onAnchorResize`. Каждый слушатель снимается по своей ссылке на
	 * элемент: одна переменная цикла, захваченная всеми замыканиями, к моменту
	 * очистки была бы уже `null`, и слушатели остались бы висеть.
	 *
	 * У точки — только ресайз окна: точка в координатах окна, прокрутка и
	 * размер чужого элемента её не двигают, а у края окна по-другому решаются
	 * flip и shift. Якорь, оставшийся под точкой, не наблюдается: точка
	 * главнее.
	 *
	 * Подписки живут только при слежении (`_follow`, смена места у показанной
	 * панели): у закрытой панели их нет вовсе. Прежние снимаются первыми, и
	 * повторный показ второго набора не заводит.
	 */
	private _subscribe(): void {
		this._unsubscribe()

		const update = () => this._update()

		if (this._point) {
			this._listenWindow('resize', update)

			return
		}

		const anchor = this._anchor

		if (!anchor) return

		for (let el = anchor.parentElement; el; el = el.parentElement) {
			const target = el

			target.addEventListener('scroll', update, { passive: true })
			this._cleanups.push(() => target.removeEventListener('scroll', update))
		}

		this._listenWindow('resize', update)
		this._listenWindow('scroll', update)

		const anchorObserver = new ResizeObserver(() => this._onAnchorResize())

		anchorObserver.observe(anchor, { box: 'border-box' })
		this._cleanups.push(() => anchorObserver.disconnect())
	}

	/** Слушатель окна — с отпиской в общем списке подписок. */
	private _listenWindow(type: 'resize' | 'scroll', listener: () => void): void {
		window.addEventListener(type, listener, { passive: true })
		this._cleanups.push(() => window.removeEventListener(type, listener))
	}

	private _unsubscribe(): void {
		for (const cleanup of this._cleanups) cleanup()

		this._cleanups = []
	}

	/**
	 * Пересчёт по уведомлению наблюдателя якоря — с паузой в наблюдении панели.
	 *
	 * Колбэк `ResizeObserver` выполняется внутри шага наблюдения кадра, и
	 * записанные здесь `x`, `y` и `width` адаптер успевает отрисовать тут же, в
	 * микрозадаче после колбэка. При `matchWidth` от этого в том же шаге
	 * меняется размер панели. Панель телепортирована и в DOM лежит мельче
	 * якоря, а после уведомления якоря браузер в этом шаге доставляет только
	 * уведомления узлов глубже него. Уведомление панели пропускается: на
	 * `window` уходит `error` («ResizeObserver loop completed with undelivered
	 * notifications»), который получают трекеры ошибок у потребителя, а позиция
	 * по новому размеру панели запаздывает на кадр.
	 *
	 * Поэтому наблюдение панели снимается до пересчёта и возвращается следующим
	 * кадром — приём `autoUpdate` из Floating UI. Вернувшееся наблюдение само
	 * присылает текущий размер: если от новой ширины выросла высота (перенос
	 * текста у панели сверху), `y` поправится по нему. Возвращать микрозадачей
	 * нельзя: она попадёт в тот же шаг, и уведомление снова пропустится.
	 *
	 * Пауза только у якоря. Колбэк панели ничего не приостанавливает:
	 * `observe()` сразу присылает уведомление, и пауза на нём зациклилась бы.
	 * Scroll и resize окна, сеттеры и `show` выполняются вне шага наблюдения, им
	 * пауза не нужна.
	 */
	private _onAnchorResize(): void {
		this._pausePanel()
		this._update()
	}

	/**
	 * Снимает наблюдение панели до следующего кадра.
	 *
	 * Возврат один: повторное уведомление до кадра второго не заводит, иначе
	 * отмена застала бы только последний. Отменяют возврат `removed`, новый
	 * `ready` и `destroy` — то, что убирает или меняет саму панель. Снятие якоря
	 * и конец закрытия (`removeAnchor`, `_unsubscribe`) его не отменяют: панель
	 * осталась, и без возврата за её размером никто бы не следил.
	 */
	private _pausePanel(): void {
		const observer = this._panelObserver
		const element = this._element

		if (!observer || !element) return

		observer.unobserve(element)

		if (this._panelResumeFrame !== null) return

		this._panelResumeFrame = requestAnimationFrame(() => {
			this._panelResumeFrame = null
			observer.observe(element, { box: 'border-box' })
		})
	}

	/** Отменяет отложенный возврат наблюдения панели. */
	private _cancelPanelResume(): void {
		if (this._panelResumeFrame === null) return

		cancelAnimationFrame(this._panelResumeFrame)
		this._panelResumeFrame = null
	}
}
