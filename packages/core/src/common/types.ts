export type TConstructor<T = object> = new (...args: any[]) => T

export type TAbstractConstructor<T = object> = abstract new (...args: any[]) => T

/**
 * Основа реестра значений оформления — набора, который объявляет тема, а не
 * библиотека (AGENTS.md, «Оформление: значения объявляет тема»).
 *
 * Реестр — интерфейс на одно свойство (`IComponentVariants`, `IButtonViews`),
 * а тип значения — его ключи: `Extract<keyof IButtonViews, string>`. В ядре
 * реестр пуст, и тип значения — `never`: у темы без дополнительных видов
 * значений просто нет, модификатора нет, и блок выглядит видом по умолчанию.
 * Тема дополняет модуль в своём `index.d.ts`:
 *
 * ```ts
 * declare module '@soxa-ui/core' {
 * 	interface IButtonViews {
 * 		plain: true
 * 	}
 * }
 * ```
 *
 * Значение ключа не читается никем — важны только имена. Проверка у значений
 * только типовая: в рантайме значение уходит в класс строкой
 * (`so-button--view-plain`), и его набор ядру знать незачем.
 *
 * Реестр наследует эту основу, а не пуст сам по себе: так он читается как
 * именованная точка расширения, а не как случайный `{}`.
 */
export type TThemeRegistry = Record<never, true>

/** Реестр вариантов — смыслового цвета компонента. Значения объявляет тема. */
export interface IComponentVariants extends TThemeRegistry {}

export type TComponentVariant = Extract<keyof IComponentVariants, string>

/**
 * Шкала размеров, по возрастанию — на порядок опирается `shiftSize`.
 *
 * Единственное перечисление, объявленное массивом, а не union'ом, и на то есть
 * причина: значения нужны ядру **в рантайме**. Раньше их было два — union здесь
 * и приватный `SIZE_SCALE` в `utility/size.ts`, две руками набранные копии
 * одних и тех же пяти строк.
 *
 * Остальные перечисления библиотеки (`TTabsAlignment`, `TListIndicator`, …)
 * остаются обычными union'ами: рантайм-потребителей у них в библиотеке нет, а
 * списки значений нужны только стенду — он и держит их у себя, со сверкой на
 * компиляции. Класть их в ядро значило бы усложнять компоненты ради
 * инструмента.
 *
 * Значения оформления (`TComponentVariant`, `TButtonView`, …) — не перечисления
 * библиотеки вовсе: их набор объявляет тема, см. `TThemeRegistry`.
 */
export const COMPONENT_SIZES = ['sm', 'normal', 'lg', 'xl', '2xl'] as const

export type TComponentSize = (typeof COMPONENT_SIZES)[number]

/**
 * A completed property change. Values keep their object identities: no deep
 * cloning or freezing is performed. Mutable values are not historical copies.
 * Collections and markup sets supply shallow boundary snapshots of their
 * containers; the objects stored inside them keep their original references.
 */
export type TValuePayload<TValue> = {
	newValue: TValue
	oldValue: TValue
}

export type TOrientation = 'horizontal' | 'vertical'

export type TScrollBehavior = 'none' | 'instant' | 'smooth'
