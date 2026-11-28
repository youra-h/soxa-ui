import { h, type FunctionalComponent, type HTMLAttributes } from 'vue'

export function createSlotContainer(
	attributes: Readonly<Record<string, string>>,
): FunctionalComponent<HTMLAttributes> {
	const Container: FunctionalComponent<HTMLAttributes> = (_, { attrs, slots }) =>
		h('div', { ...attrs, ...attributes }, slots.default?.())

	Container.inheritAttrs = false
	return Container
}
