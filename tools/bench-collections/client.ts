import { data, type Spec } from './data'
import { TComponent } from '@soxa-ui/core'
import { TPluginBundle } from '@soxa-ui/plugins'
import './setup'
import '@soxa-ui/theme-oren'
import './style.css'

export function install(
	mount: (root: HTMLElement, spec: Spec) => Promise<() => void> | (() => void),
) {
	let dispose: (() => void) | undefined
	let spec: Spec
	const root = document.getElementById('root')
	if (!root) throw new Error('Missing benchmark root')
	const frames = () =>
		new Promise<void>((resolve) =>
			requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
		)
	Object.assign(window, {
		bench: {
			prototypes: { component: TComponent.prototype, bundle: TPluginBundle.prototype },
			prepare(n: number, kind: string, mode: string, library = 'soxa') {
				spec = { ...data(n, kind), mode, library }
			},
			async mount() {
				const started = performance.now()
				dispose = await mount(root, spec)
				const domMs = performance.now() - started
				await frames()
				return { domMs, paintMs: performance.now() - started }
			},
			async unmount() {
				dispose?.()
				dispose = undefined
				root.replaceChildren()
				await frames()
			},
		},
	})
}
