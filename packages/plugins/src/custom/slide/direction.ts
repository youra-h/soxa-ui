import type { ISlidable } from '@soxa-ui/core'
import type { TSlideDirection, TSlidePoint } from './types'

/**
 * Направление роста значения у владельца.
 *
 * Горизонталь растёт от начала строки, поэтому в RTL — справа; `inverted`
 * переворачивает сторону. Вертикаль растёт снизу вверх при любом направлении
 * письма. Направление письма — вычисленное, а не `direction` компонента: у
 * того бывает `inherit`, и тогда сторону задаёт предок.
 */
export function slideDirection(
	owner: Pick<ISlidable, 'orientation' | 'inverted'>,
	element: Element,
): TSlideDirection {
	if (owner.orientation === 'vertical') return owner.inverted ? 'from-top' : 'from-bottom'

	const rtl = getComputedStyle(element).direction === 'rtl'

	return rtl === owner.inverted ? 'from-left' : 'from-right'
}

/** Путь от стороны `min` до точки — по оси направления. */
const OFFSET: Record<TSlideDirection, (box: DOMRectReadOnly, point: TSlidePoint) => number> = {
	'from-left': (box, point) => point.clientX - box.left,
	'from-right': (box, point) => box.right - point.clientX,
	'from-bottom': (box, point) => box.bottom - point.clientY,
	'from-top': (box, point) => point.clientY - box.top,
}

/** Сторона коробки, вдоль которой идёт ход. */
const LENGTH: Record<TSlideDirection, 'width' | 'height'> = {
	'from-left': 'width',
	'from-right': 'width',
	'from-bottom': 'height',
	'from-top': 'height',
}

/**
 * Длина хода в px — по коробке дорожки вдоль оси направления. По ней радиус
 * щелчка из пикселей становится долей хода.
 */
export function lengthAlong(direction: TSlideDirection, box: DOMRectReadOnly): number {
	return box[LENGTH[direction]]
}

export function offsetAlong(
	direction: TSlideDirection,
	box: DOMRectReadOnly,
	point: TSlidePoint,
): number {
	return OFFSET[direction](box, point)
}

/**
 * Доля хода в точке указателя по коробке дорожки: 0 — у `min`, 1 — у `max`,
 * за краями — за 0 и 1. Коробка дорожки — ход центров ручек, её края и есть 0
 * и 1 (контракт с темой). Коробка нулевой длины — начало хода.
 *
 * Долю здесь не прижимают — прижимает владелец, и не долю указателя, а итог.
 * Ручку он ведёт со смещением захвата, и прижатая доля не довела бы до края
 * ручку, взятую не за середину. А по точке нажатия он решает, какую из ручек
 * на одном значении вести: прижатая к краю, она спутала бы с движением наружу
 * движение внутрь, начатое ещё за краем.
 */
export function fractionAt(
	direction: TSlideDirection,
	box: DOMRectReadOnly,
	point: TSlidePoint,
): number {
	const length = lengthAlong(direction, box)

	return length > 0 ? offsetAlong(direction, box, point) / length : 0
}

/**
 * Стрелки к `min` для каждого направления роста (таблица `BACK_KEYS` у
 * Radix); две остальные ведут к `max`. Стрелки своей оси двигают ручку туда,
 * куда смотрят. Стрелки чужой оси — как в любом поле с числом: ↑ и →
 * прибавляют; исключение — вертикаль сверху вниз, где ↓ прибавляет, потому что
 * туда уходит и ручка.
 */
const BACK_KEYS: Record<TSlideDirection, readonly string[]> = {
	'from-left': ['ArrowLeft', 'ArrowDown'],
	'from-right': ['ArrowRight', 'ArrowDown'],
	'from-bottom': ['ArrowDown', 'ArrowLeft'],
	'from-top': ['ArrowUp', 'ArrowLeft'],
}

const ARROWS: ReadonlySet<string> = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'])

/** Шаг от стрелки: `1` — к `max`, `-1` — к `min`; не стрелка — `null`. */
export function arrowStep(direction: TSlideDirection, key: string): 1 | -1 | null {
	if (!ARROWS.has(key)) return null

	return BACK_KEYS[direction].includes(key) ? -1 : 1
}
