import type { TPluginEvents } from '../../../base'
import type { TSlideDirection } from '../types'
import type { ISlideSnapStrategy } from './strategies'

/**
 * Своих событий у плагина нет: результат жеста виден через владельца —
 * значение, `dragging` и `commit` сообщает он. Второй путь к тем же фактам
 * через события плагина разошёлся бы с первым.
 */
export type TSlidePointerPluginEvents = TPluginEvents

export interface ISlidePointerPluginOptions {
	/**
	 * Сколько мс ручка стоит на пересечённой метке в режиме щелчка `hold`,
	 * прежде чем догнать указатель. По умолчанию — 250: столько хватает, чтобы
	 * заметить остановку и отпустить ручку на метке, а тянуть дальше ещё не
	 * мешает.
	 */
	holdDelay?: number
}

/** Жест, который ведёт плагин: от нажатия до отпускания. */
export type TSlidePointerGesture = {
	/** `pointerId` указателя жеста: чужие указатели его не двигают */
	pointer: number
	/** Дорожка: по её коробке указатель переводится в долю хода */
	track: Element
	/** Направление роста — на весь жест, вычислено при нажатии */
	direction: TSlideDirection
	/** Стратегия щелчка — по режиму владельца на момент нажатия */
	snap: ISlideSnapStrategy
	/** Доля указателя при нажатии */
	origin: number
	/**
	 * Доля ручки при нажатии: у захвата — где она стоит, у нажатия мимо ручек —
	 * точка нажатия. Без щелчка ручка сдвигается на столько же, на сколько
	 * указатель от `origin`
	 */
	anchor: number
	/** Последняя доля указателя */
	at: number
	/**
	 * Куда плагин поставил ручку последним шагом. Щелчок отдал ту же долю —
	 * ядру сообщать нечего
	 */
	placed: number
}

/** Начало жеста — то, что известно до того, как владелец его принял. */
export type TSlidePointerStart = Pick<
	TSlidePointerGesture,
	'pointer' | 'track' | 'direction' | 'origin'
>
