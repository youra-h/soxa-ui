import { createApp, nextTick } from 'vue'
import { view } from './vue-fixture'
import { install } from './client'
install(async (element, spec) => {
	const app = createApp({ render: () => view(spec) })
	app.mount(element)
	await nextTick()
	return () => app.unmount()
})
