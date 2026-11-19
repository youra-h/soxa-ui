import { getCurrentInstance, toRaw } from 'vue'

/**
 * A prepared part's props as the consumer wrote them: Vue fills every declared
 * Boolean with a generated `false`, and those defaults are not inputs that
 * conflict with the declared source. Applied by the shared preparation only to
 * a part it resolves as prepared.
 */
export function initialAssemblyProps<T extends object>(props: T): T {
	const raw = getCurrentInstance()?.vnode.props ?? {}

	return new Proxy(props, {
		get(target, key, receiver) {
			if (typeof key !== 'string') return Reflect.get(target, key, receiver)

			const kebab = key.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase())

			return Object.hasOwn(raw, key) || Object.hasOwn(raw, kebab)
				? toRaw(Reflect.get(target, key, receiver))
				: undefined
		},
	})
}
