import type { TValuePayload } from '@soxa-ui/core'
import type { TPluginEvents } from '../../../base'
import type { TPoint } from '../../../utils'

/**
 * Сторона и выравнивание панели относительно якоря — одной схемой: сначала
 * сторона, затем выравнивание.
 *
 * Сторон четыре, на двух осях. `top` и `bottom` — стороны блока: панель над
 * якорем или под ним, а выравнивание идёт вдоль строки. `start` и `end` —
 * стороны строки: панель у начала или у конца строки якоря, а выравнивание
 * идёт вдоль якоря по вертикали. Выравнивания три: `-start` — по началу якоря
 * (у боковой стороны — верхние края вровень), `-end` — по концу (нижние края
 * вровень), значение без суффикса — по центру (как у Floating UI).
 *
 * Логическое здесь всё, что лежит на оси строки: сторона `start`/`end` и
 * выравнивание `-start`/`-end` у верха и низа — в RTL они меняются местами,
 * как `placement` у Drawer. Ось блока от направления не зависит: верх и низ,
 * выравнивание боковой панели и центр в RTL те же.
 *
 * Набор намеренно маленький: это выбор потребителя, а не подбор места.
 * Автоматический переворот при нехватке места (flip) и сдвиг у края экрана
 * (shift) плагин делает сам поверх этого выбора — см. `TAnchorPlugin`.
 */
export type TFramePlacement =
	| 'bottom-start'
	| 'bottom'
	| 'bottom-end'
	| 'top-start'
	| 'top'
	| 'top-end'
	| 'end-start'
	| 'end'
	| 'end-end'
	| 'start-start'
	| 'start'
	| 'start-end'

/**
 * Прямоугольник места панели в координатах окна: якоря — его
 * `getBoundingClientRect()`, точки — нулевого размера. Расчёту хватает краёв
 * и ширины.
 */
export type TAnchorRect = Pick<DOMRectReadOnly, 'left' | 'top' | 'right' | 'bottom' | 'width'>

export interface IAnchorPluginOptions {
	/** Сторона и выравнивание относительно якоря. По умолчанию `bottom-start`. */
	placement?: TFramePlacement
	/** Тянуть ширину панели по ширине якоря. */
	matchWidth?: boolean
	/**
	 * Переворачивать ли панель на противоположную сторону, когда на выбранной
	 * она не влезает в окно — сверху и снизу по высоте, сбоку по ширине. По
	 * умолчанию `true`. Сторону выбирает показ, а открытая панель её держит:
	 * стоит, пока на ней влезает, и переходит на противоположную, только если
	 * влезает там, — прокрутка страницы не гоняет её туда и обратно.
	 * Выключенный flip оставляет сторону потребителя как есть; shift от него не
	 * зависит.
	 */
	flip?: boolean
	/**
	 * Отступ панели от якоря, px: сверху и снизу — по вертикали, сбоку — по
	 * горизонтали. По умолчанию `0`.
	 */
	offset?: number
}

export type TAnchorPluginEvents = TPluginEvents & {
	/** change:anchor */
	'change:anchor': (payload: TValuePayload<Element | null>) => void
	/** change:point */
	'change:point': (payload: TValuePayload<TPoint | null>) => void
	/** change:placement */
	'change:placement': (payload: TValuePayload<TFramePlacement>) => void
	/** change:matchWidth */
	'change:matchWidth': (payload: TValuePayload<boolean>) => void
	/** change:flip */
	'change:flip': (payload: TValuePayload<boolean>) => void
	/** change:offset */
	'change:offset': (payload: TValuePayload<number>) => void
}

/**
 * Пропсы плагина такими, какими их объявляет contribution — без неймспейса.
 *
 * Неймспейс (`anchor_anchor`) навешивает `DescriptorAllProps` в `@soxa-ui/setup`
 * по `namespace` из `definePlugin`; здесь только собственные имена пропсов.
 */
export interface IAnchorPluginProps {
	anchor?: Element | null
	/**
	 * Точка в координатах окна, у которой встаёт панель, — главнее якоря,
	 * пока задана: контекстное меню встаёт у места вызова, а не у области.
	 */
	point?: TPoint | null
	placement?: TFramePlacement
	matchWidth?: boolean
	flip?: boolean
	offset?: number
}
