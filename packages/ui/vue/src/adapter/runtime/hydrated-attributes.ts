import { getCurrentInstance, onMounted, type VNode } from 'vue'

const isHydrationAttribute = (name: string): boolean =>
	name.startsWith('aria-') || name.startsWith('data-')

/** Reconcile attributes Vue leaves untouched while hydrating an existing root. */
export function useHydratedAttributes(): void {
	const instance = getCurrentInstance()

	// A hydrated component already has its server node during setup. Keep
	// ordinary client mounts and server renders out of this extra pass.
	if (!instance?.vnode.el) return

	onMounted(() => {
		let root: VNode = instance.subTree

		while (root.component) root = root.component.subTree

		if (typeof root.type !== 'string' || !(root.el instanceof Element)) return

		const element = root.el
		const props = root.props ?? {}

		// Read the rendered vnode, including fallthrough attributes and consumer
		// overrides. The model alone does not describe the final DOM attributes.
		for (const name of element.getAttributeNames()) {
			if (isHydrationAttribute(name) && props[name] == null) element.removeAttribute(name)
		}

		for (const name of Object.keys(props)) {
			if (!isHydrationAttribute(name) || props[name] == null) continue

			const value = String(props[name])

			if (element.getAttribute(name) !== value) element.setAttribute(name, value)
		}
	})
}
