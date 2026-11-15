/**
 * Сервер и браузер в одном процессе спека: серверный рендер Vue и гидратация
 * его разметки.
 */

import { createSSRApp, type App, type VNode } from 'vue'
import { renderToString, type SSRContext } from 'vue/server-renderer'

/** Контейнеры, над которыми прошла гидратация: их убирает `unmountHydrated`. */
const containers: HTMLElement[] = []
/** Приложения гидратации: снятое окно отпускает замок прокрутки и пометки фона. */
const apps: App[] = []

/**
 * Рендер сервера и гидратация той же разметки; предупреждения Vue — наружу.
 *
 * Страница сервера — целиком, с телепортами: панели оверлеев (Frame) Vue
 * рендерит не в разметку приложения, а в `context.teleports`, и серверная
 * страница кладёт их в начало `body`, перед приложением. Гидратация
 * телепорта ищет его содержимое с первого узла цели и запоминает, где
 * остановилась, на самой цели, поэтому `body` у каждого рендера свой.
 * Разметка сервера — приложение (`server`) и содержимое телепортов
 * (`teleported`).
 */
export async function hydrate(
	render: () => VNode,
	beforeHydrate?: (client: HTMLElement) => void,
): Promise<{
	server: HTMLElement
	teleported: HTMLElement
	client: HTMLElement
	warnings: string[]
}> {
	const context: SSRContext = {}
	const html = await renderToString(createSSRApp({ render }), context)
	const server = document.createElement('div')
	const teleported = document.createElement('div')
	const client = document.createElement('div')
	const warnings: string[] = []

	server.innerHTML = html
	teleported.innerHTML = context.teleports?.body ?? ''
	client.innerHTML = html
	document.body = document.createElement('body')
	document.body.innerHTML = context.teleports?.body ?? ''
	document.body.append(client)
	containers.push(client)

	beforeHydrate?.(client)

	const app = createSSRApp({ render })

	app.config.warnHandler = (message) => warnings.push(message)
	app.mount(client)
	apps.push(app)

	return { server, teleported, client, warnings }
}

/** После теста: снять приложения гидратации и убрать их контейнеры из документа. */
export function unmountHydrated(): void {
	for (const app of apps.splice(0)) app.unmount()
	for (const container of containers.splice(0)) container.remove()
}
