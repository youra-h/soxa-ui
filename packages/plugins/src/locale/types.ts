import type { IListenable } from '../base/types'

/**
 * Строки, которые библиотека рисует сама: имена кнопок без текста — закрытия,
 * разворота, листания, очистки, сортировки, — полей, которым подпись неоткуда
 * взять, и текст кнопок, которые она кладёт в свою разметку («OK» и «Отмена»
 * в подвале панели DatePicker).
 *
 * Разделы — по компоненту, который читает строку. Имён, которые знает только
 * приложение (подпись поля, имя индикатора выполнения), здесь нет: их задают
 * пропсы компонента (`aria_label`, `thumbLabels`).
 *
 * Строки — шаблоны, а не функции: локаль — данные, и её грузят из JSON.
 * Строка с именем части (`tabs.close`, `tags.close`, `field.clear`,
 * `table.sort`) несёт место для имени — `{name}`: порядок слов у каждого
 * языка свой, и склейка «слово + имя» навязала бы всем один (`formatName`).
 */
export type TTranslations = {
	/** Optional for existing application locales. */
	readonly guide?: Readonly<Record<'previous' | 'next' | 'done' | 'progress', string>>
	readonly fileUpload?: Readonly<
		Record<'choose' | 'drop' | 'limit' | 'remove' | 'type' | 'size' | 'count', string> & {
			browse?: string
		}
	>
	/** Optional so complete custom locales created before AlertDialog remain compatible. */
	readonly alertDialog?: { readonly confirm: string; readonly cancel: string }

	/** Optional so complete custom locales created before Alert remain compatible. */
	readonly alert?: { readonly close: string }

	/** Optional to preserve complete custom locales created before CodeBlock. */
	readonly codeBlock?: {
		readonly region: string
		readonly copy: string
		readonly copied: string
		readonly error: string
	}

	/** Optional so existing complete custom locales remain compatible. */
	readonly breadcrumbs?: { readonly navigation: string; readonly overflow: string }

	/** Модальный слой — окно и выезжающая панель */
	readonly modal: {
		/** Имя кнопки закрытия */
		readonly close: string
	}
	/** Модальное окно */
	readonly dialog: {
		/** Имя кнопки разворота — одно на оба состояния: состояние сообщает `aria-pressed` */
		readonly maximize: string
	}
	/** Поповер */
	readonly popover: {
		/** Имя кнопки закрытия */
		readonly close: string
	}
	/** Табы */
	readonly tabs: {
		/** Имя кнопки закрытия таба — шаблон с текстом таба на месте `{name}` */
		readonly close: string
	}
	/** Теги */
	readonly tags: {
		/** Имя кнопки закрытия тега — шаблон с текстом тега на месте `{name}` */
		readonly close: string
	}
	/** Всплывающие уведомления */
	readonly toasts: {
		/**
		 * Имя региона с тостами — вместе с клавишей, которая ведёт к ним фокус
		 * (F8): так её объявляет скринридер, когда пользователь попадает в регион
		 */
		readonly region: string
		/** Имя кнопки закрытия тоста — шаблон с текстом тоста на месте `{name}` */
		readonly close: string
	}
	/** Лента с кнопками листания */
	readonly scroller: {
		/** Имя кнопки «назад» */
		readonly prev: string
		/** Имя кнопки «вперёд» */
		readonly next: string
	}
	/**
	 * Постраничная навигация. Своего имени у неё в локали нет: что листают —
	 * таблицу, ленту, результаты поиска, — знает только приложение, и имя
	 * ряду даёт оно (`aria_label`)
	 */
	readonly pagination: {
		/** Имя стрелки «назад» — на предыдущую страницу */
		readonly prev: string
		/** Имя стрелки «вперёд» — на следующую страницу */
		readonly next: string
	}
	/** Поле ввода — текстовое, даты и числа */
	readonly field: {
		/** Имя кнопки очистки — шаблон с именем поля на месте `{name}` */
		readonly clear: string
	}
	/** Поле числа */
	readonly numberInput: {
		/** Имя кнопки шага «больше» — шаблон с именем поля на месте `{name}` */
		readonly increment: string
		/** Имя кнопки шага «меньше» — шаблон с именем поля на месте `{name}` */
		readonly decrement: string
	}
	/** Таблица */
	readonly table: {
		/** Имя чекбокса «выбрать все» в шапке колонки выбора */
		readonly selectAll: string
		/**
		 * Имя кнопки сортировки в заголовке колонки — шаблон с подписью колонки
		 * на месте `{name}`: текста у кнопки нет, в ней одна стрелка
		 */
		readonly sort: string
	}
	/** Календарь */
	readonly calendar: {
		/** Имя кнопки «предыдущий месяц» */
		readonly prevMonth: string
		/** Имя кнопки «следующий месяц» */
		readonly nextMonth: string
		/** Имя стрелки панели выбора месяца и года «предыдущий год» — на уровне месяцев */
		readonly prevYear: string
		/** Имя стрелки «следующий год» — на уровне месяцев */
		readonly nextYear: string
		/** Имя стрелки «предыдущие 12 лет» — на уровне лет */
		readonly prevYears: string
		/** Имя стрелки «следующие 12 лет» — на уровне лет */
		readonly nextYears: string
	}
	/** Поле даты с календарём в панели */
	readonly datePicker: {
		/** Имя кнопки календаря — оно же имя панели, которую кнопка открывает */
		readonly trigger: string
		/** Имя поля начала диапазона */
		readonly start: string
		/** Имя поля конца диапазона */
		readonly end: string
		/** Текст кнопки подвала панели, которая принимает выбор (`confirmable`) */
		readonly confirm: string
		/** Текст кнопки подвала панели, которая закрывает её без выбора */
		readonly cancel: string
	}
	/** Оценка звёздами */
	readonly rating: {
		/**
		 * Значение для скринридера (`aria-valuetext`) — шаблон: оценка на месте
		 * `{value}`, наибольшая — на месте `{max}`. Без «звёзд»: значок оценки
		 * меняет слот, и звёздами он бывает не всегда
		 */
		readonly value: string
		/**
		 * Ошибка обязательной оценки, которую не поставили, — сообщение
		 * браузера при отправке формы (`setCustomValidity`). Тоже без «звёзд»
		 */
		readonly required: string
	}
	/** Многострочное поле */
	readonly textarea: {
		/**
		 * Счётчик символов при пределе `maxlength` — шаблон: набрано на месте
		 * `{count}`, предел — на месте `{max}`. Без предела счётчик — одно
		 * число, и строки ему не нужно
		 */
		readonly counter: string
	}
}

/**
 * Локаль — язык и строки библиотеки одним значением.
 *
 * `tag` — тег BCP 47 для Intl: подписи дат, первый день недели, формат поля
 * даты, формат и разбор поля числа, сравнение строк при сортировке таблицы,
 * цифры номеров страниц пагинации. `translations` — строки, которые
 * библиотека рисует сама. Одно значение, а не два: язык без строк
 * давал бы китайские даты рядом с английскими кнопками.
 *
 * Готовые — шесть языков ООН (`enUS`, `ruRU`, `zhCN`, `frFR`, `esES`,
 * `arEG`); любую другую приложение пишет само или собирает поверх готовой
 * (`extendLocale`).
 */
export type TLocale = {
	readonly tag: string
	readonly translations: TTranslations
}

/** Часть строк: любые разделы, в разделе — любые строки. */
export type TPartialTranslations = {
	readonly [K in keyof TTranslations]?: Partial<TTranslations[K]>
}

/** Правка локали для `extendLocale`: свой тег, свои строки — что задано. */
export type TLocalePatch = {
	readonly tag?: string
	readonly translations?: TPartialTranslations
}

/** События источника локали. */
export type TLocaleSourceEvents = {
	/** change — локаль сменилась: новая уже в `locale` */
	change: (locale: TLocale) => void
}

/**
 * Источник локали монтирования — то, что плагин видит в контексте
 * (`IPluginContext.locale`): текущая локаль и её смена.
 *
 * Только чтение: локаль задаёт тот, кто источник создал, — провайдер адаптера
 * для своего поддерева. Плагин читает её при установке и подписывается на
 * смену.
 */
export interface ILocaleSource {
	readonly locale: TLocale
	readonly events: IListenable<TLocaleSourceEvents>
}

/**
 * Что плагину языка нужно от владельца: свойство `locale`.
 *
 * Структурный тип, а не класс: плагин стоит на календаре, поле даты,
 * DatePicker, поле числа, таблице и пагинации, а общего у них только это
 * свойство.
 */
export interface ILocaleOwner {
	locale: string
}
