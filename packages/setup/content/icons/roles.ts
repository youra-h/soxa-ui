/**
 * Роли, которые компоненты библиотеки требуют от пакета иконок.
 *
 * Пакет иконок — не мешок SVG, а **реализация контракта**: список ролей,
 * которые нужны компонентам. Ровно как тема реализует те классы, которые
 * soxa выпускает в разметку. Поэтому роли перечислены явно, а
 * conformance-тест проверяет, что пакет закрывает их все.
 *
 * Список — наполнение, а не механика: появилась иконка в новом компоненте —
 * роль дописывается сюда. Реестр (`protected/registry/icons.ts`) о списке не
 * знает и работает с любой строкой, поэтому новая роль не трогает движок.
 */

import type { TIconSource } from '../../protected/registry'

/**
 * Список закрытый: он и есть контракт. Появилась иконка в новом компоненте —
 * роль добавляется сюда, и conformance-тест сразу покажет, какие пакеты её
 * ещё не закрыли.
 */
export const ICON_ROLES = [
	'check',
	// The active Stepper item uses a horizontal arrow and dot in every built-in pack.
	'step',
	'checkIndeterminate',
	'close',
	'copy',
	'arrowDown',
	'arrowRight',
	// Кнопка разворота модального окна: стрелки наружу — развернуть, внутрь —
	// вернуть размер
	'arrowsOutward',
	'arrowsInward',
	// Кнопка календаря DatePicker
	'calendar',
	// Отметка направления сортировки в заголовке колонки Table: стрелка вверх —
	// по возрастанию, по убыванию её поворачивает тема
	'arrowUpward',
	// Звезда Rating — одна на оба слоя: пустая звезда снизу и залитая сверху
	// красятся темой, значок у них один
	'star',
	// Кнопки шага NumberInput: «меньше» и «больше». Глифы «−» и «+», а не
	// стрелки: шевроны рядом читались бы как «раскрыть»
	'minus',
	'plus',
	// Значок у текста ошибки поля формы Field: в режиме принудительных цветов
	// ошибку от подсказки отличает только он; и значок вида `error` тоста
	'error',
	// Значки видов тоста Toasts: обычное сообщение (без вида) — `notification`,
	// сведения — `info`, успех — `success`, предупреждение — `warning`; ошибка —
	// `error` выше. В режиме принудительных цветов значки красит система, и вид
	// различает только глиф — поэтому значок у каждого вида свой
	'notification',
	'info',
	'success',
	'warning',
] as const

export type TIconRole = (typeof ICON_ROLES)[number]

/** Application packs keep their existing required roles and can add the Stepper glyph. */
export type TIconPack = Record<Exclude<TIconRole, 'step'>, TIconSource> &
	Record<string, TIconSource>

/**
 * Каких обязательных ролей не хватает в наборе.
 *
 * Основа conformance-теста пакета: пустой массив означает, что контракт
 * закрыт целиком.
 */
export function missingIconRoles(pack: Partial<Record<string, TIconSource>>): TIconRole[] {
	return ICON_ROLES.filter((role) => !pack[role])
}
