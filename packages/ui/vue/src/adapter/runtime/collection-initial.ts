import { collectionInitialSourceOf } from '@soxa-ui/setup'
import { VueElevatorFactory } from '../elevator'
import { createCollectionInitialSource } from '@soxa-ui/setup'
import { getCurrentInstance, toRaw } from 'vue'

export function useCollectionInitial(props: object, panelDefaultValue?: string | number) {
	return createCollectionInitialSource(
		{
			...props,
			initial: toRaw(Reflect.get(props, 'initial')),
			engine: toRaw(Reflect.get(props, 'engine')),
		},
		panelDefaultValue,
	)
}

/** Vue's generated Boolean defaults are not explicitly supplied model inputs. */
export function initialAssemblyProps<T extends object>(props: T): T {
	const source = collectionInitialSourceOf(VueElevatorFactory)
	const ctrl: unknown = toRaw(Reflect.get(props, 'ctrl'))
	if (
		Reflect.get(props, 'initial') === undefined &&
		(typeof ctrl !== 'object' || ctrl === null || source?.ordinal(ctrl) === undefined)
	)
		return props
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
