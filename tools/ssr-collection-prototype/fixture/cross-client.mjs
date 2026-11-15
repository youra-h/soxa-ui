import { newRun } from './cross-plan.mjs'

export async function hydrate(framework, props, entries, container) {
	const plan = new Map(entries.map(([id, items]) => [id, new Map(items)]))
	const options = { ...props, candidate: true, run: newRun('render', plan) }
	if (framework === 'vue') {
		const { app } = await import('./cross-vue.mjs')
		const instance = app(options)
		instance.mount(container)
		return () => instance.unmount()
	}
	if (framework === 'svelte') {
		const { hydrate, unmount } = await import('svelte')
		const Page = (await import('./CrossPage.svelte')).default
		const instance = hydrate(Page, { target: container, props: options })
		return () => unmount(instance)
	}
	const { hydrate } = await import('solid-js/web')
	const { Page } = await import('./cross-solid.tsx')
	return hydrate(() => Page(options), container)
}
