import type { TPluginEvents } from '../../../base'

/**
 * Своих событий у плагина нет: результат клавиши виден через владельца —
 * значение и `commit` сообщает он, фокус остаётся на поле.
 */
export type TSlideKeyboardPluginEvents = TPluginEvents
