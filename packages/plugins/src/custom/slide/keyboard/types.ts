import type { ISlidable } from '@soxa-ui/core'
import type { TPluginEvents } from '../../../base'
import type { ISlideParts } from '../parts'

/**
 * Своих событий у плагина нет: результат клавиши виден через владельца —
 * значение и `commit` сообщает он, фокус остаётся на поле.
 */
export type TSlideKeyboardPluginEvents = TPluginEvents

export interface ISlideKeyboardPluginOptions {
	parts?: ISlideParts
	/** Limit arrow keys to the axis of movement. */
	axisOnly?: boolean
	activate?: (owner: ISlidable, index: number) => void
}
