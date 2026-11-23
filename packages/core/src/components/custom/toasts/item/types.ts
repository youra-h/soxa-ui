import type {
	IComponentView,
	IComponentViewProps,
	TComponentViewEvents,
} from '../../../base/component-view'
import type { ISwipeable, TSwipeableEvents, TSwipeSide } from '../../../base/layer'
import type { ICloseRequestable } from '../../../base/layer'
import type {
	TAria,
	TAriaAttributes,
	TChangeEvent,
	TThemeRegistry,
	TValuePayload,
} from '../../../../common'

/**
 * Вид сообщения тоста — что случилось: сведения (`info`), успех (`success`),
 * предупреждение (`warning`) или ошибка (`error`). Не задан — обычное
 * сообщение.
 *
 * Значок по виду выбирает разметка — роль иконки, своя у каждого вида, — а тема
 * только красит его по модификатору `--type-<v>`. Смысл у вида один в любой
 * теме, поэтому это union ядра, как `type` у Tooltip, а не реестр темы, как
 * `variant`: имён вариантов библиотека не знает, и выбрать по ним значок не
 * смогла бы.
 */
export type TToastsItemType = 'info' | 'success' | 'warning' | 'error'

/** Appearance values are supplied by the active theme. */
export interface IToastsItemViews extends TThemeRegistry {}

export type TToastsItemView = Extract<keyof IToastsItemViews, string>

export type TToastsItemEvents = TComponentViewEvents &
	TSwipeableEvents & {
		/** change:text */
		'change:text': (payload: TValuePayload<string>) => void
		/** Запись своего `text` — подправить или отменить (`TChangeEvent`) */
		'change:text:before': (e: TChangeEvent<string>) => void
		/** change:description */
		'change:description': (payload: TValuePayload<string>) => void
		/** change:type — вид сообщения; `undefined` — обычное */
		'change:type': (payload: TValuePayload<TToastsItemType | undefined>) => void
		'change:view': (payload: TValuePayload<TToastsItemView | undefined>) => void
		/** change:loading — тост ждёт или ожидание снято */
		'change:loading': (payload: TValuePayload<boolean>) => void
		/** change:closable */
		'change:closable': (payload: TValuePayload<boolean>) => void
		/** Запись своего `closable` — подправить или отменить (`TChangeEvent`) */
		'change:closable:before': (e: TChangeEvent<boolean>) => void
		/** change:duration — своя длительность тоста; `undefined` — как у владельца */
		'change:duration': (payload: TValuePayload<number | undefined>) => void
		/** change:alert */
		'change:alert': (payload: TValuePayload<boolean>) => void
		/** change:render */
		'change:render': (payload: TValuePayload<unknown>) => void
		/** change:open — тост закрыли. Закрытие окончательное: открытым тост больше не станет */
		'change:open': (payload: TValuePayload<boolean>) => void
		/** The card's ARIA attributes changed. */
		'change:cardAria': (payload: TValuePayload<TAriaAttributes>) => void
		/** change:closeAria — набор атрибутов кнопки закрытия изменился */
		'change:closeAria': (payload: TValuePayload<TAriaAttributes>) => void
	}

export interface IToastsItemProps extends IComponentViewProps {
	/** Текст тоста — его заголовок */
	text?: string
	/** Описание под текстом */
	description?: string
	/**
	 * Вид сообщения: `info`, `success`, `warning` или `error` — значок вида в
	 * начале строки. Не задан — обычное сообщение
	 */
	type?: TToastsItemType
	/** Surface treatment for this item, overriding the manager's view when set. */
	view?: TToastsItemView
	/**
	 * Тост ждёт — идёт работа, о которой он сообщает («Сохраняем…»): на месте
	 * значка бежит кольцо, при любом виде, и сам тост не закрывается. Снятое
	 * ожидание начинает отсчёт заново
	 */
	loading?: boolean
	/** Есть ли у тоста кнопка закрытия. По умолчанию есть */
	closable?: boolean
	/**
	 * Сколько тост держится на экране, мс. `undefined` — как у владельца,
	 * `0` — держится, пока его не закроют
	 */
	duration?: number
	/** Urgency controls the alert role and the shared announcer priority. */
	alert?: boolean
	/**
	 * Своё содержимое тоста — под текстом: кнопка «Отменить» и подобное. Ядро
	 * значение не читает: что это и как его нарисовать, знает адаптер (во Vue —
	 * компонент, которому тост приходит пропом `toast`)
	 */
	render?: unknown
}

export interface IToastsItem<
	TProps extends IToastsItemProps = IToastsItemProps,
	TEvents extends TToastsItemEvents = TToastsItemEvents,
>
	extends IComponentView<TProps, TEvents>, ISwipeable, ICloseRequestable {
	/** Текст тоста — его заголовок */
	text: string
	/** Описание под текстом */
	description: string
	/** Вид сообщения; `undefined` — обычное сообщение */
	type: TToastsItemType | undefined
	view?: TToastsItemView | undefined
	/** Тост ждёт: на месте значка кольцо, и сам тост не закрывается */
	loading: boolean
	/** Есть ли у тоста кнопка закрытия */
	closable: boolean
	/** Своя длительность, мс; `undefined` — как у владельца, `0` — не закрывается сам */
	duration: number | undefined
	/** Urgency controls the alert role and the shared announcer priority. */
	alert: boolean
	/** Своё содержимое — его рисует адаптер, ядро значение не читает */
	render: unknown
	/** Открыт ли тост. Закрытие окончательное: закрывает `close()` */
	readonly open: boolean
	/** Куда тост уходит жестом — пишет коллекция по месту региона */
	swipeSide: TSwipeSide
	/** Атрибуты кнопки закрытия — живой набор: имя с текстом тоста пишет плагин имён */
	readonly closeAria: TAria
	/** ARIA of the existing card: urgent messages remain discoverable as alerts. */
	readonly cardAria: TAria
	/** Закрыть тост. Закрытый гаснет и уходит из коллекции, когда доиграл переходы */
	close(): void
}
