export const SIDEBAR_BRAND = {
	name: 'Редакция «Поле»',
	subtitle: 'Команда выпуска',
	mark: new URL('../../../../../brand/mark.svg', import.meta.url).href,
}

export const SIDEBAR_SEARCH = 'Поиск по разделам'

export const SIDEBAR_PROFILE = {
	name: 'Анна Волкова',
	role: 'Редактор',
	initials: 'АВ',
	items: [
		{ value: 'profile', text: 'Мой профиль' },
		{ value: 'notifications', text: 'Настройки уведомлений' },
	],
}
