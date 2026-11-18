import { createApp } from 'vue'
import { useTheme } from '@soxa-ui/setup'
import oren from '@soxa-ui/theme-oren/setup'
import '@soxa-ui/theme-oren'
import App from './App.vue'
import { configure } from './configure'
import './page.css'

const stopTheme = useTheme(oren)
const stopPlugins = configure()
const app = createApp(App, { custom: false })
app.onUnmount(() => {
	stopPlugins()
	stopTheme()
})
app.mount('#app')
