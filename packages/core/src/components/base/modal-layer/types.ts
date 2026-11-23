import type { TThemeRegistry, TValuePayload } from '../../../common'
import type { ICloseRequestable, ILayer, ILayerProps, TCloseEvent, TLayerEvents } from '../layer'
import type { TAria, TAriaAttributes, TDatasetAttributes } from '../../../common'

/** Backdrop views are declared by the theme. */
export interface IBackdropViews extends TThemeRegistry {}

export type TBackdropView = Extract<keyof IBackdropViews, string>

export interface IModalLayerProps extends ILayerProps {
	/** Appearance of the modal backdrop. The theme supplies the default. */
	backdrop?: TBackdropView
	/**
	 * Ширина панели: число — px, строка — CSS-значение. Не задана — ширину
	 * даёт тема
	 */
	width?: number | string
	/**
	 * Высота панели: число — px, строка — CSS-значение. Не задана — высоту
	 * даёт тема
	 */
	height?: number | string
	/** Показывать ли кнопку закрытия */
	closable?: boolean
	/**
	 * Закрывают ли панель нажатие мимо и Escape. Выключено — только кнопка
	 * закрытия, свой жест панели и код
	 */
	dismissible?: boolean
}

export type TModalLayerEvents = TLayerEvents & {
	'change:backdrop': (payload: TValuePayload<TBackdropView | undefined>) => void
	/**
	 * close:before — пользователь закрывает панель: кнопкой закрытия, нажатием
	 * мимо, Escape или жестом (`e.reason`). `e.preventDefault()` оставляет её
	 * открытой. Запись `visible` из кода и `v-model` его не шлют.
	 */
	'close:before': (e: TCloseEvent) => void
	/** change:width */
	'change:width': (payload: TValuePayload<number | string | undefined>) => void
	/** change:height */
	'change:height': (payload: TValuePayload<number | string | undefined>) => void
	/** change:closable */
	'change:closable': (payload: TValuePayload<boolean>) => void
	/** change:dismissible */
	'change:dismissible': (payload: TValuePayload<boolean>) => void
	/** change:titleAria — набор атрибутов заголовка изменился */
	'change:titleAria': (payload: TValuePayload<TAriaAttributes>) => void
	/** change:closeAria — набор атрибутов кнопки закрытия изменился */
	'change:closeAria': (payload: TValuePayload<TAriaAttributes>) => void
}

export interface IModalLayer<
	TProps extends IModalLayerProps = IModalLayerProps,
	TEvents extends Record<string, (...args: any) => any> = TModalLayerEvents,
>
	extends ILayer<TProps, TEvents>, ICloseRequestable {
	backdrop: TBackdropView | undefined
	readonly backdropClasses: string[]
	/** Ширина панели; `undefined` — ширину даёт тема */
	width: number | string | undefined
	/** Высота панели; `undefined` — высоту даёт тема */
	height: number | string | undefined
	/** Показывать ли кнопку закрытия */
	closable: boolean
	/** Закрывают ли панель нажатие мимо и Escape */
	dismissible: boolean
	/** Атрибуты заголовка: `id`, на который ссылается `aria-labelledby` панели, пишет плагин */
	readonly titleAria: TAria
	/** Атрибуты кнопки закрытия: имя от локали пишет плагин имён */
	readonly closeAria: TAria
	/** `data-*` подложки: тот же номер слоя и та же открытость, что у панели */
	readonly backdropDataset: TDatasetAttributes
}
