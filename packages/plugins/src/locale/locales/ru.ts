import { freezeLocale } from '../locale'

/** Русский (Россия). */
export const ruRU = freezeLocale({
	tag: 'ru-RU',
	translations: {
		fileUpload: {
			choose: 'Выбрать файлы',
			drop: 'Перетащите или',
			browse: 'выберите файлы',
			limit: 'Максимальный размер файла: {size}',
			remove: 'Удалить {name}',
			type: '{name}: неподдерживаемый тип файла.',
			size: '{name}: файл слишком большой.',
			count: '{name}: достигнут лимит файлов.',
		},
		alertDialog: { confirm: 'Подтвердить', cancel: 'Отмена' },
		alert: { close: 'Закрыть' },
		codeBlock: {
			region: 'Код',
			copy: 'Копировать',
			copied: 'Скопировано',
			error: 'Не удалось скопировать код',
		},
		breadcrumbs: { navigation: 'Навигационная цепочка', overflow: 'Показать скрытые звенья' },
		modal: { close: 'Закрыть' },
		dialog: { maximize: 'Развернуть' },
		popover: { close: 'Закрыть' },
		tabs: { close: 'Закрыть {name}' },
		tags: { close: 'Закрыть {name}' },
		toasts: { region: 'Уведомления (F8)', close: 'Закрыть {name}' },
		scroller: { prev: 'Прокрутить назад', next: 'Прокрутить вперёд' },
		pagination: { prev: 'Предыдущая страница', next: 'Следующая страница' },
		field: { clear: 'Очистить {name}' },
		numberInput: { increment: 'Увеличить {name}', decrement: 'Уменьшить {name}' },
		table: { selectAll: 'Выбрать все', sort: 'Сортировать по столбцу {name}' },
		calendar: {
			prevMonth: 'Предыдущий месяц',
			nextMonth: 'Следующий месяц',
			prevYear: 'Предыдущий год',
			nextYear: 'Следующий год',
			prevYears: 'Предыдущие 12 лет',
			nextYears: 'Следующие 12 лет',
		},
		datePicker: {
			trigger: 'Выбрать дату',
			start: 'Дата начала',
			end: 'Дата окончания',
			confirm: 'ОК',
			cancel: 'Отмена',
		},
		rating: {
			value: '{value} из {max}',
			required: 'Поставьте оценку',
		},
		textarea: { counter: '{count} / {max}' },
	},
})
