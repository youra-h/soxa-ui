export const SIDEBAR_BRAND = {
	name: 'Редакция «Поле»',
	subtitle: 'Команда выпуска',
	mark: new URL('../../../../../brand/mark.svg', import.meta.url).href,
}

export const SIDEBAR_SEARCH = 'Поиск по разделам'

const profileName = 'Анна Волкова'
const profileRole = 'Редактор'

export const SIDEBAR_PROFILE = {
	name: profileName,
	role: profileRole,
	label: `${profileName} ${profileRole}`,
	initials: 'АВ',
	items: [
		{ value: 'profile', text: 'Мой профиль' },
		{ value: 'notifications', text: 'Настройки уведомлений' },
	],
}
