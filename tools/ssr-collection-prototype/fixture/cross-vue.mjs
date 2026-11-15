import { createSSRApp, defineComponent, Fragment, h, inject, provide } from 'vue'
import { Tabs } from '@soxa-ui/vue'
import { RUN, SCOPE, scopeOf, itemOf } from './cross-plan.mjs'
const Root = defineComponent({
	setup(_, { slots }) {
		const run = inject(RUN)
		const scope = scopeOf(run)
		provide(SCOPE, scope)
		return () =>
			run.phase === 'scan'
				? h(Fragment, null, [slots.default?.(), slots.content?.()])
				: h(Tabs, { engine: scope.engine }, slots)
	},
})
const Item = defineComponent({
	inheritAttrs: false,
	setup(_, { attrs }) {
		const run = inject(RUN)
		const ctrl = itemOf(inject(SCOPE), attrs, run.phase)
		return () => (run.phase === 'scan' ? null : h(Tabs.Item, { ...attrs, ctrl }))
	},
})
const Content = defineComponent({
	inheritAttrs: false,
	setup(_, { attrs, slots }) {
		const run = inject(RUN)
		return () => (run.phase === 'scan' ? slots.default?.() : h(Tabs.Content, attrs, slots))
	},
})
function set(props) {
	const R = props.candidate ? Root : Tabs,
		I = props.candidate ? Item : Tabs.Item,
		C = props.candidate ? Content : Tabs.Content
	const count = props.count ?? 2,
		prefix = props.prefix ?? ''
	return h(R, null, {
		default: () => [
			...Array.from({ length: count }, (_, i) =>
				props.scenario === 'conditional' && i === 1
					? null
					: h(I, {
							value: prefix + i,
							text: 'Tab ' + prefix + i,
							active: i === count - 1,
						}),
			),
			props.scenario === 'conditional'
				? h(I, { value: prefix + 'last', text: 'Tab ' + prefix + 'last', active: true })
				: null,
		],
		content: () => [
			...Array.from({ length: count }, (_, i) =>
				h(C, { value: prefix + i }, () => [
					'Panel ' + prefix + i,
					(props.scenario === 'nested' && i === count - 1) ||
					props.scenario === 'inactive-nested'
						? set({
								candidate: props.candidate,
								prefix: i === 0 ? 'hidden-' : 'nested-',
							})
						: null,
				]),
			),
			props.scenario === 'conditional'
				? h(C, { value: prefix + 'last' }, () => 'Panel ' + prefix + 'last')
				: null,
		],
	})
}
export function app(props) {
	return createSSRApp({
		setup() {
			provide(RUN, props.run)
			return () => set(props)
		},
	})
}
