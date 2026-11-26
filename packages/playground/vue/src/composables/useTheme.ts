import { ref, watchEffect } from 'vue'
import { THEMES } from '@soxa-ui/playground-shared'

const STORAGE_KEY = 'soxa-playground-theme'

const theme = ref(THEMES[0].value)
const dark = ref(false)

try {
	const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')

	if (saved) {
		if (THEMES.some(({ value }) => value === saved.theme)) theme.value = saved.theme
		dark.value = Boolean(saved.dark)
	}
} catch {
	// Приватный режим или заблокированное хранилище — не повод падать
}

watchEffect(() => {
	document.documentElement.dataset.soTheme = dark.value ? `${theme.value}-dark` : theme.value

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: theme.value, dark: dark.value }))
	} catch {
		// The theme can still change when storage is unavailable.
	}
})

/**
 * Тема и цветовая схема.
 *
 * Схема — суффикс значения `data-so-theme`. Её можно менять отдельно от темы.
 *
 * Состояние общее на всё приложение (модульный `ref`, а не `provide`): тему
 * читает и шапка, и любая страница, а второго экземпляра стенда не бывает.
 */
export function useTheme() {
	return { theme, dark, themes: THEMES }
}
