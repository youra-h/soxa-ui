import { afterEach, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick, ref, type App } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Button } from '@soxa-ui/vue'

let app: App | undefined

afterEach(() => {
	app?.unmount()
	app = undefined
	document.body.innerHTML = ''
	vi.restoreAllMocks()
})

it('reconciles fallthrough data and ARIA attributes once, then lets Vue own updates', async () => {
	const attributes = ref<Record<string, string | boolean | null>>({
		'data-state': 'server',
		'data-server-only': 'old',
		'aria-current': 'page',
		'aria-hidden': true,
	})
	const render = () => h(Button, { text: 'Continue', ...attributes.value })
	const container = document.createElement('div')

	container.innerHTML = await renderToString(createSSRApp({ render }))
	document.body.append(container)
	const button = container.querySelector('button')

	if (!button) throw new Error('Missing server button')

	attributes.value = {
		'data-state': 'client',
		'data-client-only': 'new',
		'data-disabled': 'consumer',
		'aria-current': null,
		'aria-hidden': false,
	}
	const warnings: string[] = []
	app = createSSRApp({ render })
	app.config.warnHandler = (message) => warnings.push(message)
	app.mount(container)
	await nextTick()

	expect(container.querySelector('button')).toBe(button)
	expect(button.getAttribute('data-state')).toBe('client')
	expect(button.hasAttribute('data-server-only')).toBe(false)
	expect(button.getAttribute('data-client-only')).toBe('new')
	expect(button.getAttribute('data-disabled')).toBe('consumer')
	expect(button.hasAttribute('aria-current')).toBe(false)
	expect(button.getAttribute('aria-hidden')).toBe('false')
	expect(warnings).toEqual([])

	attributes.value = { 'data-state': 'updated', 'aria-current': 'step' }
	await nextTick()

	expect(button.getAttribute('data-state')).toBe('updated')
	expect(button.getAttribute('aria-current')).toBe('step')
	expect(button.hasAttribute('data-client-only')).toBe(false)
})
