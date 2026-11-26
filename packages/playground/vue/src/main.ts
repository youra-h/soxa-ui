import { createApp, watch } from 'vue'
import { useIcons, useTheme as installTheme } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'
import App from './App.vue'
import { router } from './router'
import { DEFAULT_ROUTE } from './navigation'

import oren from '@soxa-ui/theme-oren/setup'
import { useTheme } from './composables/useTheme'
import orenStyles from './themes/oren.css?inline'
import burgStyles from './themes/burg.css?inline'
import './styles.css'

// Both themes use the same layout plugins. Install them once for all preview hosts.
useIcons(material)
installTheme(oren)

// The selected stylesheet also styles overlays teleported to the document body.
const stylesheet = document.createElement('style')
document.head.prepend(stylesheet)

const { theme } = useTheme()
watch(
	theme,
	(value) => {
		stylesheet.textContent = value === 'burg' ? burgStyles : orenStyles
	},
	{ immediate: true, flush: 'sync' },
)

// Прямая ссылка сильнее умолчания: перезагрузка страницы компонента должна
// оставлять на ней, а не выкидывать на витрину
if (!window.location.hash) window.location.hash = DEFAULT_ROUTE

createApp(App).use(router).mount('#app')
