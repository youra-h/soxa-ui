import { createApp } from 'vue'
import { useTheme } from '@soxa-ui/setup'
import studio from '@example/soxa-theme/setup'
import '@example/soxa-theme'
import App from './App.vue'
import { configure } from './configure'
import './page.css'

const stopTheme = useTheme(studio)
const stopPlugins = configure()
const app = createApp(App, { custom: true })
app.onUnmount(() => {
	stopPlugins()
	stopTheme()
})
app.mount('#app')
