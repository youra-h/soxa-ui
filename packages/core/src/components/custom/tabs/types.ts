import type { TAttributes, TAttributesMap } from '../../../common'
import type { TOrientation, TValuePayload } from '../../../common'
import type { IControl, IControlProps, TControlEvents } from '../../base/control'
import type { TThemeRegistry } from '../../../common'
import type { TCollectionStorageDriverEvents } from '../../base/collection'
import type { ITabsCollectionProps } from './collection/types'
import type { ITabsItem, ITabsItemProps } from './item/types'

export type TTabsOrientation = TOrientation
export type TTabsAlignment = 'start' | 'center' | 'end' | 'stretch'
export type TTabsPosition = 'start' | 'end'
/**
 * Реестр видов табов. Значения объявляет тема (см. `TThemeRegistry`).
 *
 * Ориентация, выравнивание и сторона сюда не входят: их читают ядро, плагины и
 * разметка, и смысл у них один в любой теме.
 */
export interface ITabsViews extends TThemeRegistry {}

export type TTabsView = Extract<keyof ITabsViews, string>

export type TTabsEvents = TControlEvents &
	TCollectionStorageDriverEvents<ITabsItem> & {
		'change:scrollAttrs': (payload: TValuePayload<TAttributesMap>) => void
		/** change:orientation */
		'change:orientation': (payload: TValuePayload<TOrientation>) => void
		/** change:alignment */
		'change:alignment': (payload: TValuePayload<TTabsAlignment>) => void
		/** change:position */
		'change:position': (payload: TValuePayload<TTabsPosition>) => void
		/** change:view */
		'change:view': (payload: TValuePayload<TTabsView | undefined>) => void
		/** change:closable */
		'change:closable': (payload: TValuePayload<boolean>) => void
		// /** item:close — эмитится перед удалением таба при закрытии */
		// 'item:close': (item: ITabsItem) => void
		// /** item:closable — эмитится при изменении свойства closable у таба */
		// 'item:closable': (item: ITabsItem, value: boolean) => void
		// /** item:text — эмитится при изменении текста таба */
		// 'item:text': (item: ITabsItem, value: string) => void
		// /** item:rendered — эмитится при изменении rendered у таба */
		// 'item:rendered': (item: ITabsItem, value: boolean) => void
		// /** item:visible — эмитится при изменении visible у таба */
		// 'item:visible': (item: ITabsItem, value: boolean) => void
		// 'item:present': (item: ITabsItem, value: boolean) => void
		// 'item:disabled': (item: ITabsItem, value: boolean) => void
		// /** Массовое добавление (от batch-расширения) */
		// 'items:added': (items: ITabsItem[]) => void
		// /** Массовое удаление (от batch-расширения) */
		// 'items:removed': (items: ITabsItem[]) => void
		// /** Изменение выборки (от selection-расширения) */
		// 'change:selection': (items: ITabsItem[]) => void
	}

/** Пропсы самого компонента Tabs (без коллекционной части). */
export interface ITabsComponentProps extends IControlProps {
	/** Ориентация табов */
	orientation?: TOrientation
	/** Выравнивание табов */
	alignment?: TTabsAlignment
	/** Позиция табов (для vertical) */
	position?: TTabsPosition
	/** Вид табов. Не задан — модификатора нет, и табы выглядят видом темы по умолчанию */
	view?: TTabsView
	/** Разрешить закрытие табов (по умолчанию false) */
	closable?: boolean
}

/** Полный набор пропсов Tabs: компонент + коллекция (items, engine, trackBy). */
export interface ITabsProps
	extends ITabsComponentProps, ITabsCollectionProps<ITabsItemProps, ITabsItem> {}

export interface ITabs extends IControl<ITabsProps, TTabsEvents> {
	/** Native attributes of the scrolling part, separate from the semantic root. */
	readonly scrollAttrs: TAttributes
	/** Ориентация табов */
	orientation: TOrientation
	/** Выравнивание табов */
	alignment: TTabsAlignment
	/** Позиция табов (для vertical) */
	position: TTabsPosition
	/** Вид табов */
	view: TTabsView | undefined
	/** Разрешить закрытие табов */
	closable: boolean
}
